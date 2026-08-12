'use client';

import { cn } from '../lib/cn';
import { isItemActive } from '../menu/active';
import type { MenuItem } from '../menu/types';
import { SidebarBadge } from './sidebarBadge';
import { renderMenuIcon, SidebarText } from './primitives';
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
 */
export function SidebarMenuItem({ item, isCollapsed, isSubItem = false, onSelect }: SidebarMenuItemProps) {
	const { currentPath, navigation } = useSidebar();
	const isActive = isItemActive(item, currentPath);

	const iconClasses = cn('flex-shrink-0 transition-colors duration-[var(--sb-duration)]', isActive ? 'text-[color:var(--sb-accent)]' : 'text-[color:var(--sb-fg-muted)]', isSubItem && 'ml-2');

	const rowClasses = cn(
		'group/btn group/sidebarlink relative flex w-full items-center gap-3 rounded-[var(--sb-radius)] px-3 py-2.5 transition-colors duration-200',
		'h-[var(--sb-item-height)] outline-none',
		isActive ? 'bg-[var(--sb-active-bg)]' : 'hover:bg-[var(--sb-hover)]',
		isCollapsed && 'justify-center',
		isSubItem && 'py-2'
	);

	const row = (
		<>
			{isActive && !isCollapsed && <span aria-hidden className='absolute bottom-0 left-0 top-0 w-1 rounded-r-full bg-[var(--sb-accent)]' />}
			{renderMenuIcon(item.icon, iconClasses, { strokeWidth: 1.5 })}
			{!isCollapsed && <SidebarText className={cn('flex-1 text-left text-[1rem] leading-none', isActive && 'text-[color:var(--sb-accent-fg)]')}>{item.label}</SidebarText>}
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
