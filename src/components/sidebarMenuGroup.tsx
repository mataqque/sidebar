'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '../lib/cn';
import type { MenuItem } from '../menu/types';
import { SidebarBadge } from './sidebarBadge';
import { renderMenuIcon, SidebarChevron, SidebarText, SIDEBAR_FOCUS_CLASS, SIDEBAR_ICON_STROKE } from './primitives';
import { SidebarFlyout } from './sidebarFlyout';
import { SidebarMenuItem } from './sidebarMenuItem';
import { useSidebar } from './sidebarContext';

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
 * flyout al lado del botón, porque un acordeón dentro del rail no cabe.
 *
 * Abierto y activo son estados distintos y se dicen distinto: abrir solo gira el
 * chevron, y el acento queda reservado a que la ruta actual esté dentro. Teñir
 * también al abrir hacía que cualquier grupo desplegado se leyera como activo.
 */
export function SidebarMenuGroup({ item, isOpen, onToggle, isCollapsed, hasActiveChild, onSelect }: SidebarMenuGroupProps) {
	const { chevron } = useSidebar();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [flyout, setFlyout] = useState<{ top: number; left: number } | null>(null);
	const showFlyout = isCollapsed && isOpen && flyout !== null;
	const panelId = `sb-group-${item.id}`;

	const iconClasses = cn(
		'h-[1.125rem] w-[1.125rem] shrink-0 transition-colors duration-[var(--sb-duration-fast,130ms)]',
		hasActiveChild ? 'text-[color:var(--sb-accent)]' : 'text-[color:var(--sb-fg-muted)] group-hover/btn:text-[color:var(--sb-fg)]'
	);

	const handleClick = () => {
		if (isCollapsed && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setFlyout({ top: rect.top, left: rect.right + 8 });
		}
		onToggle();
	};

	// Cerrar el flyout devuelve el foco al disparador: sin esto, `Escape` o un
	// click fuera desmontaban el panel y el foco caía al `<body>`, dejando la
	// navegación por teclado en el principio del documento.
	const closeFlyout = useCallback(() => {
		onToggle();
		buttonRef.current?.focus();
	}, [onToggle]);

	// El panel es `position: fixed` con coordenadas tomadas del botón, así que
	// scroll y resize lo dejan obsoleto. Antes eso lo cerraba, y el efecto era que
	// pulsar un grupo del fondo de un rail que scrollea no hacía nada: al enfocar,
	// el navegador lo traía a la vista, ese scroll llegaba en el mismo tick y
	// cerraba el flyout recién abierto. Ahora sigue a su ancla y solo se rinde
	// cuando el disparador se sale de la ventana de verdad.
	useEffect(() => {
		if (!showFlyout) return;

		let frame = 0;
		const reposition = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const trigger = buttonRef.current;
				if (!trigger) return;
				const rect = trigger.getBoundingClientRect();
				if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
					onToggle();
					return;
				}
				setFlyout({ top: rect.top, left: rect.right + 8 });
			});
		};

		const closeOnOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement | null;
			if (buttonRef.current?.contains(target) || target?.closest('[data-sidebar-flyout]')) return;
			onToggle();
		};

		document.addEventListener('mousedown', closeOnOutside);
		window.addEventListener('scroll', reposition, true);
		window.addEventListener('resize', reposition);
		return () => {
			cancelAnimationFrame(frame);
			document.removeEventListener('mousedown', closeOnOutside);
			window.removeEventListener('scroll', reposition, true);
			window.removeEventListener('resize', reposition);
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
					'group/btn relative flex w-full items-center gap-2.5 rounded-[var(--sb-radius,0.5rem)] px-2.5',
					'h-[var(--sb-item-height,2.5rem)] transition-colors duration-[var(--sb-duration-fast,130ms)]',
					SIDEBAR_FOCUS_CLASS,
					hasActiveChild ? 'bg-[var(--sb-active-bg)]' : 'hover:bg-[var(--sb-hover)]',
					isCollapsed && 'justify-center px-0'
				)}
			>
				{renderMenuIcon(item.icon, iconClasses, { strokeWidth: SIDEBAR_ICON_STROKE })}

				{isCollapsed ? (
					<span className='sr-only'>{item.label}</span>
				) : (
					<>
						<SidebarText className={cn('flex-1 text-left', hasActiveChild && 'font-[number:var(--sb-label-weight-active,600)] text-[color:var(--sb-accent-fg)]')} title={item.label}>
							{item.label}
						</SidebarText>
						{item.badge && <SidebarBadge badge={item.badge} />}
						{chevron ? chevron(isOpen) : <SidebarChevron open={isOpen} />}
					</>
				)}
			</button>

			{/*
				Acordeón inline (solo expandido). `grid-template-rows: 0fr → 1fr` anima
				hasta la altura real del contenido: `max-height` obligaba a un tope
				arbitrario que recortaba los grupos con muchos hijos.
			*/}
			{!isCollapsed && (
				<div
					id={panelId}
					className={cn('grid transition-[grid-template-rows,opacity] duration-[var(--sb-duration,260ms)] ease-[var(--sb-ease,ease-out)]', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
				>
					<div className='overflow-hidden'>
						{/*
							Los hijos se agrupan solo por indentación y ritmo: sangría hasta la
							columna del label del padre, filas más bajas que las de nivel raíz y
							aire por encima y por debajo del bloque. Sin filete ni caja: en un
							panel estrecho una línea vertical más es ruido, no estructura.
						*/}
						<ul className='ml-[1.75rem] mt-1 space-y-1 pb-1'>
							{item.children?.map(child => (
								<SidebarMenuItem key={child.id} item={child} isCollapsed={false} isSubItem onSelect={onSelect} />
							))}
						</ul>
					</div>
				</div>
			)}

			{showFlyout && flyout && <SidebarFlyout label={item.label} items={item.children ?? []} top={flyout.top} left={flyout.left} onClose={closeFlyout} onSelect={onSelect} />}
		</li>
	);
}
