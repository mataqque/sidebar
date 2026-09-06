'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { defaultNavigationAdapter, type NavigationAdapter } from '../adapters/navigation';
import { SidebarContextProvider, type SidebarContextValue } from './sidebarContext';

/**
 * Ancho a partir del cual el sidebar es una columna real del layout. Coincide con
 * el `lg` de Tailwind por defecto.
 */
export const DEFAULT_EXPAND_BREAKPOINT = 1024;

export interface SidebarProviderProps {
	children: ReactNode;
	/** Adaptador de router. En Next pasa `nextNavigationAdapter` de `@mataqque/sidebar/next`. */
	navigation?: NavigationAdapter;
	/** Estado inicial en modo no controlado. Default: `false` (expandido). */
	defaultCollapsed?: boolean;
	/** Estado en modo controlado. Al pasarlo, el provider deja de gestionar el suyo. */
	collapsed?: boolean;
	/** Notifica cada cambio de estado (en ambos modos). */
	onCollapsedChange?: (collapsed: boolean) => void;
	/**
	 * Clave de `localStorage` donde recordar el colapso entre visitas. Omítela para
	 * no persistir. Solo aplica en modo no controlado.
	 */
	persistKey?: string;
	/**
	 * Ancho, en píxeles, a partir del cual el panel expandido ensancha la columna en
	 * vez de superponerse al contenido.
	 *
	 * **Tiene que coincidir con el breakpoint `lg` de tu Tailwind**, porque la
	 * presentación la resuelve el CSS con `lg:` —clases que compila el consumidor,
	 * no la librería— y esto solo gobierna una decisión: por debajo de ese ancho el
	 * sidebar arranca colapsado, para no entrar a la página con el panel tapándola.
	 *
	 * Tailwind por defecto usa 1024; si has redefinido `screens`, pasa el tuyo.
	 */
	expandBreakpoint?: number;
	/**
	 * Sustituye el chevron de los grupos colapsables por el tuyo.
	 *
	 * Existe porque un dashboard ya tiene sus propios selects —tenant, idioma,
	 * entorno— dibujados con su librería de iconos, y dos flechas parecidas pero
	 * distintas en el mismo panel se notan. Pasando aquí la misma que usan esos
	 * selects, el menú deja de tener criterio propio:
	 *
	 * ```tsx
	 * <SidebarProvider chevron={open => <ChevronDown className={cn('h-5 w-5 transition-transform', open && 'rotate-180')} />}>
	 * ```
	 */
	chevron?: (open: boolean) => ReactNode;
}

/** Lee la preferencia persistida; cualquier fallo (SSR, storage bloqueado) devuelve `null`. */
function readPersisted(key: string): boolean | null {
	try {
		const raw = window.localStorage.getItem(key);
		return raw === null ? null : raw === 'true';
	} catch {
		return null;
	}
}

/**
 * Raíz del sidebar: posee el estado de colapso y publica el adaptador de router.
 *
 * La preferencia persistida se aplica **después del montaje**, no en el
 * inicializador de `useState`: leer `localStorage` durante el render rompería la
 * hidratación (el servidor no puede conocer ese valor). El coste es un frame con
 * el estado por defecto, a cambio de HTML consistente.
 *
 * Lo mismo vale para el ancho de pantalla, y por eso el arranque colapsado en
 * móvil también es un efecto: el servidor no sabe cuánto mide el viewport. Quién
 * empuja y quién se superpone lo decide el CSS, que sí acierta en el primer paint.
 */
export function SidebarProvider({
	children,
	navigation = defaultNavigationAdapter,
	defaultCollapsed = false,
	collapsed,
	onCollapsedChange,
	persistKey,
	expandBreakpoint = DEFAULT_EXPAND_BREAKPOINT,
	chevron,
}: SidebarProviderProps) {
	const isControlled = collapsed !== undefined;
	const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
	const isCollapsed = isControlled ? collapsed : internalCollapsed;

	const currentPath = navigation.useCurrentPath();

	/*
	 * En viewports estrechos el panel expandido se superpone al contenido, así que
	 * restaurar ahí un "expandido" persistido significaría entrar a la página con el
	 * menú encima. La preferencia se guarda igual; solo se aplica donde el sidebar
	 * es una columna que empuja.
	 */
	useEffect(() => {
		if (isControlled) return;

		if (!window.matchMedia(`(min-width: ${expandBreakpoint}px)`).matches) {
			setInternalCollapsed(true);
			return;
		}

		if (!persistKey) return;
		const stored = readPersisted(persistKey);
		if (stored !== null) setInternalCollapsed(stored);
	}, [isControlled, persistKey, expandBreakpoint]);

	const setCollapsed = useCallback(
		(next: boolean) => {
			if (!isControlled) setInternalCollapsed(next);
			if (persistKey && !isControlled) {
				try {
					window.localStorage.setItem(persistKey, String(next));
				} catch {
					// Storage no disponible (modo privado, cuota): el colapso sigue funcionando en memoria.
				}
			}
			onCollapsedChange?.(next);
		},
		[isControlled, persistKey, onCollapsedChange]
	);

	/*
	 * Navegar recoge el panel superpuesto.
	 *
	 * Solo donde se superpone: en escritorio el sidebar no tapa nada, y recogerlo al
	 * navegar sería deshacer una preferencia explícita en cada click.
	 */
	useEffect(() => {
		if (isControlled || currentPath === null) return;
		if (window.matchMedia(`(min-width: ${expandBreakpoint}px)`).matches) return;
		setInternalCollapsed(true);
	}, [currentPath, isControlled, expandBreakpoint]);

	const value = useMemo<SidebarContextValue>(
		() => ({ isCollapsed, setCollapsed, toggleCollapsed: () => setCollapsed(!isCollapsed), currentPath, navigation, chevron }),
		[isCollapsed, setCollapsed, currentPath, navigation, chevron]
	);

	return <SidebarContextProvider value={value}>{children}</SidebarContextProvider>;
}
