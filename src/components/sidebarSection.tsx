'use client';

import type { ReactNode } from 'react';

import { SidebarEyebrow, SidebarSeparator } from './primitives';

interface SidebarSectionProps {
	label: string;
	isCollapsed: boolean;
	children: ReactNode;
}

/**
 * Encabezado de sección de nivel raíz: rotula y separa un bloque de items. No es
 * navegable ni colapsable. Colapsado sustituye el título por un filete —no hay
 * ancho para texto— pero el rótulo sigue disponible para lectores de pantalla.
 * Los items llegan ya renderizados como `children` desde `SidebarMenu`, que es
 * quien tiene el estado de apertura de los grupos.
 */
export function SidebarSection({ label, isCollapsed, children }: SidebarSectionProps) {
	return (
		<li role='presentation'>
			{isCollapsed ? (
				<>
					<SidebarSeparator className='my-2' />
					<span className='sr-only'>{label}</span>
				</>
			) : (
				<SidebarEyebrow className='overflow-hidden text-ellipsis px-3 pb-1 pt-4' title={label}>
					{label}
				</SidebarEyebrow>
			)}
			<ul className='space-y-1'>{children}</ul>
		</li>
	);
}
