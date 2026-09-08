'use client';

import { useEffect, useState } from 'react';

import { cn } from '../lib/cn';
import { findActiveGroupIds } from '../menu/active';
import { isDivision, type MenuChild, type MenuItem } from '../menu/types';
import { SidebarMenuGroup } from './sidebarMenuGroup';
import { SidebarMenuItem } from './sidebarMenuItem';
import { SidebarScroll } from './sidebarScroll';
import { SidebarSection } from './sidebarSection';
import { useSidebar } from './sidebarContext';

export interface SidebarMenuProps {
	items: readonly MenuChild[];
	className?: string;
	/** Nombre accesible del `<nav>`. */
	label?: string;
	/** Se invoca al activar un item sin `href`. */
	onSelect?: (item: MenuItem) => void;
}

/** ¿Este contenedor o alguno de sus descendientes está en la lista de grupos activos? */
function hasActiveDescendant(item: MenuItem, activeGroupIds: readonly string[]): boolean {
	return activeGroupIds.includes(item.id);
}

/**
 * Renderiza el árbol del menú y posee el estado de apertura de los grupos.
 *
 * Los grupos que contienen la ruta actual se abren solos: entrar por URL directa a
 * una sub-ruta dejaba antes el item activo escondido dentro de un acordeón cerrado.
 * La sincronización es por `currentPath`, no un merge acumulativo, para que lo que
 * el usuario abra o cierre a mano no se revierta en el siguiente render.
 */
export function SidebarMenu({ items, className, label = 'Navegación principal', onSelect }: SidebarMenuProps) {
	const { isCollapsed, currentPath } = useSidebar();
	const activeGroupIds = findActiveGroupIds(items, currentPath);
	const [openGroups, setOpenGroups] = useState<string[]>(activeGroupIds);

	// `currentPath` empieza en `null` (SSR) y resuelve tras la hidratación: hay que
	// reabrir cuando llega, y en cada navegación posterior.
	useEffect(() => {
		setOpenGroups(findActiveGroupIds(items, currentPath));
	}, [items, currentPath]);

	const toggleGroup = (id: string) => {
		setOpenGroups(previous => (previous.includes(id) ? previous.filter(groupId => groupId !== id) : [...previous, id]));
	};

	// Un item raíz o hijo de sección: grupo colapsable si tiene hijos, si no un link.
	const renderItem = (item: MenuItem) =>
		item.children && item.children.length > 0 ? (
			<SidebarMenuGroup
				key={item.id}
				item={item}
				isOpen={openGroups.includes(item.id)}
				onToggle={() => toggleGroup(item.id)}
				isCollapsed={isCollapsed}
				hasActiveChild={hasActiveDescendant(item, activeGroupIds)}
				onSelect={onSelect}
			/>
		) : (
			<SidebarMenuItem key={item.id} item={item} isCollapsed={isCollapsed} onSelect={onSelect} />
		);

	return (
		<nav aria-label={label} className={cn('relative z-[1] h-full min-h-0 flex-1 overflow-hidden py-2', className)}>
			<SidebarScroll className='h-full' thumbWidth={6} offsetRight={3}>
				<ul className='space-y-0.5 px-2'>
					{items.map(entry =>
						isDivision(entry) ? (
							<SidebarSection key={entry.id} label={entry.label} isCollapsed={isCollapsed}>
								{entry.children.map(renderItem)}
							</SidebarSection>
						) : (
							renderItem(entry)
						)
					)}
				</ul>
			</SidebarScroll>
		</nav>
	);
}
