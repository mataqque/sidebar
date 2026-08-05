import type { ReactNode, SVGAttributes } from 'react';

import { cn } from '../lib/cn';
import type { MenuIcon } from '../menu/types';

/**
 * Clases base de todos los iconos del sidebar. Exportada para que el consumidor
 * las aplique a sus propios iconos (`lucide-react`, `@mui/icons-material`, SVG
 * propios) y hereden el tema sin que la librería dependa de ninguna de esas libs.
 */
export const SIDEBAR_ICON_CLASS = 'text-[color:var(--sb-fg-muted)] group-hover/btn:text-[color:var(--sb-fg)] transition-colors duration-[var(--sb-duration)]';

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

/** Texto estándar del sidebar (label de item, nombre de grupo). */
export function SidebarText({ children, className, title }: SidebarTextProps) {
	return (
		<span className={cn('text-[color:var(--sb-fg)]', className)} title={title}>
			{children}
		</span>
	);
}

/** Rótulo de sección/flyout: mayúsculas pequeñas, tono apagado. */
export function SidebarEyebrow({ children, className, title }: SidebarTextProps) {
	return (
		<span className={cn('block text-[0.7rem] font-semibold uppercase tracking-wider text-[color:var(--sb-fg-subtle)]', className)} title={title}>
			{children}
		</span>
	);
}

/** Línea divisoria horizontal entre bloques del sidebar. */
export function SidebarSeparator({ className }: { className?: string }) {
	return <div role='separator' className={cn('block h-px w-full bg-[var(--sb-separator)]', className)} />;
}
