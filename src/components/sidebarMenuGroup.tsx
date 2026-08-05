'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '../lib/cn';
import type { MenuItem } from '../menu/types';
import { SidebarBadge } from './sidebarBadge';
import { renderMenuIcon, SidebarText } from './primitives';
import { SidebarFlyout } from './sidebarFlyout';
import { SidebarMenuItem } from './sidebarMenuItem';

interface SidebarMenuGroupProps {
	item: MenuItem;
	isOpen: boolean;
	onToggle: () => void;
	isCollapsed: boolean;
	/** `true` si la ruta actual cae dentro del grupo (aunque esté cerrado). */
	hasActiveChild: boolean;
	onSelect?: (item: MenuItem) => void;
}

/**
 * Contenedor colapsable. Expandido es un acordeón inline; colapsado ancla un
 * flyout al lado del botón, porque un acordeón dentro de 4rem de ancho no cabe.
 */
export function SidebarMenuGroup({ item, isOpen, onToggle, isCollapsed, hasActiveChild, onSelect }: SidebarMenuGroupProps) {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [flyout, setFlyout] = useState<{ top: number; left: number } | null>(null);
	const showFlyout = isCollapsed && isOpen && flyout !== null;
	const panelId = `sb-group-${item.id}`;

	const isHighlighted = isOpen || hasActiveChild;
	const iconClasses = cn('flex-shrink-0 transition-colors duration-[var(--sb-duration)]', isHighlighted ? 'text-[color:var(--sb-accent)]' : 'text-[color:var(--sb-fg-muted)]');

	const handleClick = () => {
		if (isCollapsed && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setFlyout({ top: rect.top, left: rect.right + 8 });
		}
		onToggle();
	};

	// Cierra el flyout al click fuera, al hacer scroll o al redimensionar: su
	// posición es `fixed` y calculada una vez, así que cualquiera de esos eventos
	// la deja obsoleta. `Escape` lo maneja el propio flyout.
	useEffect(() => {
		if (!showFlyout) return;
		const close = (event: Event) => {
			const target = event.target as HTMLElement | null;
			if (event.type === 'mousedown' && (buttonRef.current?.contains(target) || target?.closest('[data-sidebar-flyout]'))) return;
			onToggle();
		};
		document.addEventListener('mousedown', close);
		window.addEventListener('scroll', close, true);
		window.addEventListener('resize', close);
		return () => {
			document.removeEventListener('mousedown', close);
			window.removeEventListener('scroll', close, true);
			window.removeEventListener('resize', close);
		};
	}, [showFlyout, onToggle]);

	return (
		<li>
			<button
				ref={buttonRef}
				type='button'
				onClick={handleClick}
				aria-expanded={isOpen}
				aria-controls={isCollapsed ? undefined : panelId}
				title={isCollapsed ? item.label : undefined}
				className={cn(
					'group/btn relative flex w-full items-center gap-3 rounded-[var(--sb-radius)] px-3 py-2.5 transition-colors duration-200',
					'h-[var(--sb-item-height)] hover:bg-[var(--sb-hover)]',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sb-accent)]',
					hasActiveChild && !isOpen && 'bg-[var(--sb-active-bg)]',
					isCollapsed && 'justify-center'
				)}
			>
				{renderMenuIcon(item.icon, iconClasses, { strokeWidth: 1.4 })}

				{isCollapsed ? (
					<span className='sr-only'>{item.label}</span>
				) : (
					<>
						<SidebarText className='flex-1 text-left text-[1rem] leading-none'>{item.label}</SidebarText>
						{item.badge && <SidebarBadge badge={item.badge} />}
						<svg aria-hidden className={cn('h-4 w-4 text-[color:var(--sb-fg-muted)] transition-transform duration-200', isOpen && 'rotate-180')} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
						</svg>
					</>
				)}
			</button>

			{/*
				Acordeón inline (solo expandido). `grid-template-rows: 0fr → 1fr` anima
				hasta la altura real del contenido: `max-height` obligaba a un tope
				arbitrario que recortaba los grupos con muchos hijos.
			*/}
			{!isCollapsed && (
				<div id={panelId} className={cn('grid transition-[grid-template-rows,opacity] duration-[var(--sb-duration)]', isOpen ? 'mt-1 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
					<div className='overflow-hidden'>
						<ul className='space-y-1 pl-4'>
							{item.children?.map(child => (
								<SidebarMenuItem key={child.id} item={child} isCollapsed={false} isSubItem onSelect={onSelect} />
							))}
						</ul>
					</div>
				</div>
			)}

			{showFlyout && flyout && <SidebarFlyout label={item.label} items={item.children ?? []} top={flyout.top} left={flyout.left} onClose={onToggle} onSelect={onSelect} />}
		</li>
	);
}
