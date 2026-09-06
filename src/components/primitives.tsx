import type { ReactNode, SVGAttributes } from 'react';

import { cn } from '../lib/cn';
import type { MenuIcon } from '../menu/types';

/**
 * Clases base de todos los iconos del sidebar. Exportada para que el consumidor
 * las aplique a sus propios iconos (`lucide-react`, `@mui/icons-material`, SVG
 * propios) y hereden el tema sin que la librería dependa de ninguna de esas libs.
 */
export const SIDEBAR_ICON_CLASS = 'h-[1.125rem] w-[1.125rem] shrink-0 text-[color:var(--sb-fg-muted)] group-hover/btn:text-[color:var(--sb-fg)] transition-colors duration-[var(--sb-duration-fast,130ms)]';

/**
 * Señal de foco de teclado: un fondo netamente más marcado que el de hover, sin
 * anillo ni contorno. Las filas llevan `outline-none`, así que sin este
 * reemplazo la navegación por tabulador sería invisible.
 *
 * Solo se dispara con `:focus-visible`, nunca con un clic de ratón. El fallback
 * es un gris neutro que funciona sobre superficie clara y oscura, para que un
 * consumidor con la hoja de tokens antigua siga viendo dónde está el foco.
 */
export const SIDEBAR_FOCUS_CLASS = 'outline-none focus-visible:bg-[var(--sb-focus-bg,rgba(125,130,145,0.22))]';

/**
 * Grosor de trazo único para los iconos que dibuja la librería y para los del
 * consumidor. Es el default de lucide a propósito: casi todos los dashboards la
 * usan, y con 1.75 los iconos del menú salían más finos que los del resto de la
 * app (selects, botones), que sí van al valor de la librería.
 */
export const SIDEBAR_ICON_STROKE = 2;

/**
 * Chevron de «esto se despliega»: lo usan los grupos colapsables del menú.
 *
 * Está exportado a propósito. Un dashboard casi siempre mete algún select propio
 * en los slots del sidebar —selector de tenant, de idioma, de entorno— y si cada
 * uno dibuja su flecha acaba habiendo dos chevrones parecidos pero distintos en
 * tamaño, grosor y duración de giro. Usando este componente en ambos sitios
 * coinciden por construcción, no por copiar valores a mano:
 *
 * ```tsx
 * <button onClick={() => setOpen(o => !o)}>
 *   <span>{tenant}</span>
 *   <SidebarChevron open={open} />
 * </button>
 * ```
 */
export function SidebarChevron({ open = false, className }: { open?: boolean; className?: string }) {
	return (
		<svg
			aria-hidden
			data-sidebar-chevron={open ? 'open' : 'closed'}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth={SIDEBAR_ICON_STROKE}
			strokeLinecap='round'
			strokeLinejoin='round'
			className={cn(
				'h-5 w-5 shrink-0 text-[color:var(--sb-fg-muted)]',
				// Gira al mismo ritmo que el acordeón que abre: a 130ms el chevron ya
				// había terminado cuando el panel iba por la mitad, y ese desfase es lo
				// que se lee como un salto seco en vez de como un despliegue.
				'transition-transform duration-[var(--sb-duration,260ms)] ease-[var(--sb-ease,ease-out)]',
				open && 'rotate-180',
				className
			)}
		>
			<path d='m6 9 6 6 6-6' />
		</svg>
	);
}

/**
 * Resuelve el icono de un item: si es una función recibe las clases calculadas
 * (estado activo/hover) para poder teñirse; si ya es un nodo se rinde tal cual.
 */
export function renderMenuIcon(icon: MenuIcon | undefined, className: string, attrs?: SVGAttributes<SVGSVGElement>): ReactNode {
	if (icon === undefined || icon === null) return null;
	return typeof icon === 'function' ? icon(className, attrs) : icon;
}

interface SidebarTextProps {
	children: ReactNode;
	className?: string;
	title?: string;
}

/**
 * Texto estándar del sidebar (label de item, nombre de grupo). Trunca por
 * defecto: un nombre largo de item o de tenant no debe empujar al badge fuera
 * de la fila ni forzar dos líneas en una fila de alto fijo.
 */
export function SidebarText({ children, className, title }: SidebarTextProps) {
	return (
		<span
			className={cn('block truncate text-[length:var(--sb-label-size,0.875rem)] font-[number:var(--sb-label-weight,500)] leading-5 text-[color:var(--sb-fg)]', className)}
			title={title}
		>
			{children}
		</span>
	);
}

/** Rótulo de sección/flyout: mayúsculas pequeñas, tono apagado. */
export function SidebarEyebrow({ children, className, title }: SidebarTextProps) {
	return (
		<span className={cn('block text-[length:var(--sb-section-size,0.5625rem)] font-semibold uppercase tracking-wider text-[color:var(--sb-fg-subtle)]', className)} title={title}>
			{children}
		</span>
	);
}

/** Línea divisoria horizontal entre bloques del sidebar. */
export function SidebarSeparator({ className }: { className?: string }) {
	return <div role='separator' className={cn('block h-px w-full shrink-0 bg-[var(--sb-separator)]', className)} />;
}
