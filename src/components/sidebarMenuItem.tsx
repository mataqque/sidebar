'use client';

import { cn } from '../lib/cn';
import { isItemActive } from '../menu/active';
import type { MenuItem } from '../menu/types';
import { SidebarBadge } from './sidebarBadge';
import { renderMenuIcon, SidebarText, SIDEBAR_FOCUS_CLASS, SIDEBAR_ICON_STROKE } from './primitives';
import { useSidebar } from './sidebarContext';

interface SidebarMenuItemProps {
	item: MenuItem;
	isCollapsed: boolean;
	isSubItem?: boolean;
	/** Se invoca al activar un item **sin** `href` (acción, no navegación). */
	onSelect?: (item: MenuItem) => void;
}

/**
 * Hoja del menú: un link (`href`) o un botón de acción. Ambos comparten la misma
 * fila visual, pero el contenedor interactivo se rinde una sola vez —el `<a>` o el
 * `<button>` **son** la fila— para no duplicar padding ni alto.
 *
 * El estado activo se dice con la fila entera (fondo teñido + icono y label en
 * acento + un peso más), no con un filete lateral de color: el filete competía
 * con la guía del acordeón, se desalineaba en los sub-items —que ya van
 * indentados— y desaparecía justo cuando más falta hace, con el panel colapsado.
 */
export function SidebarMenuItem({ item, isCollapsed, isSubItem = false, onSelect }: SidebarMenuItemProps) {
	const { currentPath, navigation } = useSidebar();
	const isActive = isItemActive(item, currentPath);

	// El icono de un hijo baja un escalón respecto al del padre. Con los dos al
	// mismo tamaño la lista desplegada competía con la fila que la contiene y el
	// árbol dejaba de leerse como árbol.
	const iconClasses = cn(
		'shrink-0 transition-colors duration-[var(--sb-duration-fast,130ms)]',
		isSubItem ? 'h-4 w-4' : 'h-[1.125rem] w-[1.125rem]',
		isActive ? 'text-[color:var(--sb-accent)]' : 'text-[color:var(--sb-fg-muted)] group-hover/btn:text-[color:var(--sb-fg)]'
	);

	const rowClasses = cn(
		'group/btn group/sidebarlink relative flex w-full items-center gap-2.5 rounded-[var(--sb-radius,0.5rem)] px-2.5',
		'transition-colors duration-[var(--sb-duration-fast,130ms)]',
		SIDEBAR_FOCUS_CLASS,
		isSubItem ? 'h-[var(--sb-subitem-height,2.25rem)]' : 'h-[var(--sb-item-height,2.5rem)]',
		isActive ? 'bg-[var(--sb-active-bg)]' : 'hover:bg-[var(--sb-hover)]',
		isCollapsed && 'justify-center px-0'
	);

	const row = (
		<>
			{/*
				Marca del hijo activo: barra corta pegada al borde de la fila. Un hijo
				vive dentro de un bloque ya sangrado, y ahí la píldora sola se lee peor
				que en un item de nivel raíz; la barra da el ancla vertical sin
				encerrar la fila en un contorno.
			*/}
			{isSubItem && isActive && (
				<span aria-hidden className='absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-[var(--sb-accent)]' />
			)}
			{renderMenuIcon(item.icon, iconClasses, { strokeWidth: SIDEBAR_ICON_STROKE })}
			{!isCollapsed && (
				<SidebarText
					className={cn('flex-1 text-left', isActive && 'font-[number:var(--sb-label-weight-active,600)] text-[color:var(--sb-accent-fg)]')}
					title={item.label}
				>
					{item.label}
				</SidebarText>
			)}
			{!isCollapsed && item.badge && <SidebarBadge badge={item.badge} />}
			{/* Colapsado no hay label visible: el nombre viaja en el accesible del control. */}
			{isCollapsed && <span className='sr-only'>{item.label}</span>}
		</>
	);

	if (item.href) {
		const { Link } = navigation;
		return (
			<li>
				<Link href={item.href} className={rowClasses} aria-current={isActive ? 'page' : undefined} title={isCollapsed ? item.label : undefined}>
					{row}
				</Link>
			</li>
		);
	}

	return (
		<li>
			<button type='button' className={rowClasses} onClick={() => onSelect?.(item)} title={isCollapsed ? item.label : undefined}>
				{row}
			</button>
		</li>
	);
}
