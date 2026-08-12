'use client';

import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { useSidebar } from './sidebarContext';

export interface SidebarHeaderProps {
	/** Marca del proyecto. Se oculta al colapsar para dejar sitio al botón. */
	logo?: ReactNode;
	className?: string;
	collapseLabel?: string;
	expandLabel?: string;
}

/** Chevron doble que apunta hacia donde se moverá el panel al pulsar. */
function CollapseIcon({ direction }: { direction: 'left' | 'right' }) {
	return (
		<svg aria-hidden viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.6} strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5'>
			{direction === 'left' ? <path d='M11 17l-5-5 5-5M18 17l-5-5 5-5' /> : <path d='M13 17l5-5-5-5M6 17l5-5-5-5' />}
		</svg>
	);
}

/**
 * Cabecera: marca + botón de colapso. El logo entra como slot para que la
 * librería no conozca el sistema de assets de cada proyecto.
 */
export function SidebarHeader({ logo, className, collapseLabel = 'Colapsar menú', expandLabel = 'Expandir menú' }: SidebarHeaderProps) {
	const { isCollapsed, toggleCollapsed } = useSidebar();

	return (
		<div className={cn('flex h-[4rem] items-center justify-between px-4 py-6', className)}>
			{!isCollapsed && logo}
			<button
				type='button'
				onClick={toggleCollapsed}
				aria-label={isCollapsed ? expandLabel : collapseLabel}
				aria-expanded={!isCollapsed}
				className={cn(
					'flex items-center justify-center rounded-[var(--sb-radius)] p-1 text-[color:var(--sb-fg-muted)] outline-none transition-colors hover:bg-[var(--sb-hover)] hover:text-[color:var(--sb-fg)]',
					isCollapsed && 'mx-auto'
				)}
			>
				<CollapseIcon direction={isCollapsed ? 'right' : 'left'} />
			</button>
		</div>
	);
}
