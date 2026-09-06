'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { MenuItem } from '../menu/types';
import { SidebarEyebrow } from './primitives';
import { SidebarMenuItem } from './sidebarMenuItem';

interface SidebarFlyoutProps {
	label: string;
	items: readonly MenuItem[];
	top: number;
	left: number;
	onClose: () => void;
	onSelect?: (item: MenuItem) => void;
}

/** Aire mínimo entre el panel y cualquier borde de la ventana. */
const VIEWPORT_MARGIN = 8;

/**
 * Panel flotante con los items de un grupo cuando el sidebar está colapsado.
 *
 * Se posiciona con `position: fixed` (coordenadas calculadas desde el botón) para
 * escapar del `overflow` del sidebar, que de otro modo lo recortaría. Cualquier
 * click en un item lo cierra (la navegación ocurre vía el link interno), igual que
 * `Escape`; `onClose` devuelve el foco al disparador.
 */
export function SidebarFlyout({ label, items, top, left, onClose, onSelect }: SidebarFlyoutProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const [offsetTop, setOffsetTop] = useState(top);

	// El ancla es el borde superior del botón, así que un grupo cerca del fondo
	// abría un panel que se salía de la ventana. Se mide una vez montado —la
	// altura depende del número de hijos— y se sube lo justo para que quepa.
	useLayoutEffect(() => {
		const panel = panelRef.current;
		if (!panel) return;
		const height = panel.offsetHeight;
		const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
		setOffsetTop(Math.max(VIEWPORT_MARGIN, Math.min(top, maxTop)));
	}, [top, items.length]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	// El primer item recibe el foco: abrir con teclado debe dejar el foco dentro del panel.
	useEffect(() => {
		panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
	}, []);

	return (
		<div
			ref={panelRef}
			data-sidebar-flyout
			role='menu'
			aria-label={label}
			style={{ top: offsetTop, left, boxShadow: 'var(--sb-flyout-shadow)' }}
			className='fixed z-50 max-h-[70vh] min-w-[12rem] overflow-y-auto rounded-[calc(var(--sb-radius,0.5rem)+2px)] border border-solid border-[color:var(--sb-flyout-border)] bg-[var(--sb-flyout-surface)] p-1.5'
		>
			<SidebarEyebrow className='px-2.5 pb-1 pt-1'>{label}</SidebarEyebrow>
			<ul className='space-y-0.5' onClick={onClose}>
				{items.map(child => (
					<SidebarMenuItem key={child.id} item={child} isCollapsed={false} isSubItem onSelect={onSelect} />
				))}
			</ul>
		</div>
	);
}
