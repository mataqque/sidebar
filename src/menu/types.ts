import type { ReactNode, SVGAttributes } from 'react';

export interface MenuBadge {
	text: string;
	variant: 'primary' | 'danger' | 'success' | 'warning' | 'neutral';
}

/**
 * Icono de un item. Puede ser un nodo ya renderizado o —lo habitual— una función
 * que recibe las clases calculadas por el sidebar (estado activo/hover) y los
 * atributos SVG, para que el icono se tiña con el tema sin que la librería
 * conozca la biblioteca de iconos del consumidor.
 */
export type MenuIcon = ReactNode | ((className?: string, attrs?: SVGAttributes<SVGSVGElement>) => ReactNode);

/** Estrategia para decidir si la ruta actual activa un item. */
export type MenuMatch = 'exact' | 'startsWith';

export interface MenuItem {
	id: string;
	label: string;
	icon?: MenuIcon;
	href?: string;
	/** Posición ascendente dentro de su contenedor (raíz, división o grupo). Default `DEFAULT_ORDER`. */
	order?: number;
	badge?: MenuBadge;
	/** Sub-items de un grupo colapsable (links hoja), ordenados por `order`. */
	children?: MenuItem[];
	/**
	 * Cómo se compara `href` con la ruta actual. `'exact'` (default) preserva el
	 * comportamiento clásico; `'startsWith'` mantiene el item activo en sub-rutas
	 * (`/dashboard/media` sigue activo en `/dashboard/media/123`).
	 */
	match?: MenuMatch;
	/** Excluye el item del árbol final. Pensado para gating por permiso/feature flag. */
	hidden?: boolean;
	/** Metadatos libres del consumidor (permisos, analytics…). La librería no los interpreta. */
	meta?: Record<string, unknown>;
}

/**
 * Encabezado **no navegable** de nivel raíz que rotula y separa un bloque de items
 * del sidebar (p.ej. "Administración", "Marketing"). No es un grupo colapsable: es
 * una etiqueta; sus `children` se renderizan como items normales (links o grupos)
 * bajo el título, ordenados por `order`. La propia división se ordena por `order`
 * entre los demás nodos raíz.
 *
 * `kind: 'division'` es el discriminante que la distingue de un `MenuItem`.
 */
export interface MenuDivision {
	kind: 'division';
	id: string;
	label: string;
	/** Posición ascendente entre los nodos raíz. Default `DEFAULT_ORDER`. */
	order?: number;
	children: MenuItem[];
	hidden?: boolean;
}

/** Un nodo de nivel raíz: o un item suelto (`MenuItem`) o una división con encabezado. */
export type MenuChild = MenuItem | MenuDivision;

/** Type guard: estrecha un `MenuChild` a la rama división de la unión. */
export function isDivision(child: MenuChild): child is MenuDivision {
	return 'kind' in child && child.kind === 'division';
}

/**
 * Una entrada de sidebar aportada por el core de una app o por un plugin.
 *
 * - Sin `groupId`: el nodo es raíz (un item suelto o una división); su posición la
 *   decide su propio `order`.
 * - Con `groupId`: el item se inyecta como hijo del contenedor con ese id —puede ser
 *   un grupo (p.ej. `'plugins'` → "Herramientas") o cualquier item con hijos, esté
 *   donde esté en el árbol— y se ordena por `order` entre los hijos de ese contenedor.
 *   Una división no puede inyectarse: es siempre raíz.
 *
 * Invariante: un plugin nunca edita el core; solo exporta su `SidebarContribution`
 * y el agregador de la app la une al resto.
 */
export interface SidebarContribution {
	item: MenuChild;
	groupId?: string;
}

/**
 * Manifiesto de un **plugin** de dashboard: una feature autocontenida que aporta
 * una entrada al sidebar y se registra en un único punto de la app. Formaliza la
 * convención con lo mínimo para poder acotar plugins por entorno (`devOnly`) o por
 * rol (`requiredRole`, cuyo vocabulario lo define el consumidor vía `TRole`).
 *
 * Invariante: un plugin nunca edita el core del menú; solo exporta su `DashboardPlugin`.
 */
export interface DashboardPlugin<TRole extends string = string> {
	id: string;
	/** Entrada que el plugin inyecta en el sidebar (normalmente con `groupId`). */
	sidebar: SidebarContribution;
	/** Si es `true`, el plugin solo se registra y es accesible en desarrollo. */
	devOnly?: boolean;
	/** Rol mínimo requerido. La librería no lo evalúa: se filtra con `canUse` al construir. */
	requiredRole?: TRole;
}

/** Orden por defecto cuando un nodo no declara `order`. */
export const DEFAULT_ORDER = 100;
