'use client';

import { useEffect, useRef } from 'react';

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

/**
 * Panel flotante con los items de un grupo cuando el sidebar está colapsado.
 *
 * Se posiciona con `position: fixed` (coordenadas calculadas desde el botón) para
 * escapar del `overflow` del sidebar, que de otro modo lo recortaría. Cualquier
 * click en un item lo cierra (la navegación ocurre vía el link interno), igual que
 * `Escape`, que además devuelve el foco al disparador por contrato del llamador.
 */
export function SidebarFlyout({ label, items, top, left, onClose, onSelect }: SidebarFlyoutProps) {
	const panelRef = useRef<HTMLDivElement>(null);

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
			style={{ top, left, boxShadow: 'var(--sb-flyout-shadow)' }}
			className='fixed z-50 max-h-[70vh] min-w-[12rem] overflow-y-auto rounded-[var(--sb-radius)] border border-[color:var(--sb-flyout-border)] bg-[var(--sb-flyout-surface)] p-2'
		>
			<SidebarEyebrow className='px-3 pb-1'>{label}</SidebarEyebrow>
			<ul className='space-y-1' onClick={onClose}>
				{items.map(child => (
					<SidebarMenuItem key={child.id} item={child} isCollapsed={false} isSubItem onSelect={onSelect} />
				))}
			</ul>
		</div>
	);
}
