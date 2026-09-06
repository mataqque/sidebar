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
 *
 * El ritmo es deliberadamente asimétrico: mucho aire por encima del rótulo, poco
 * por debajo, y filas casi pegadas dentro del bloque. Así la sección se lee como
 * un grupo y no como una lista uniforme de filas equidistantes.
 */
export function SidebarSection({ label, isCollapsed, children }: SidebarSectionProps) {
	return (
		<li role='presentation'>
			{isCollapsed ? (
				<>
					<SidebarSeparator className='mx-auto my-2 w-6' />
					<span className='sr-only'>{label}</span>
				</>
			) : (
				<SidebarEyebrow className='overflow-hidden text-ellipsis px-2.5 pb-1 pt-4' title={label}>
					{label}
				</SidebarEyebrow>
			)}
			<ul className='space-y-0.5'>{children}</ul>
		</li>
	);
}
