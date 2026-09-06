'use client';

import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { SIDEBAR_FOCUS_CLASS } from './primitives';
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
		<svg aria-hidden viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.75} strokeLinecap='round' strokeLinejoin='round' className='h-4 w-4'>
			{direction === 'left' ? <path d='M11 17l-5-5 5-5M18 17l-5-5 5-5' /> : <path d='M13 17l5-5-5-5M6 17l5-5-5-5' />}
		</svg>
	);
}

/**
 * Cabecera: marca + botón de colapso. El logo entra como slot para que la
 * librería no conozca el sistema de assets de cada proyecto.
 *
 * El alto es fijo y el aire lo pone el padding horizontal; antes convivían un
 * `h-4rem` y un `py-6` que pedían 3rem de padding vertical dentro de esos 4rem,
 * así que el segundo no llegaba a aplicarse nunca.
 */
export function SidebarHeader({ logo, className, collapseLabel = 'Colapsar menú', expandLabel = 'Expandir menú' }: SidebarHeaderProps) {
	const { isCollapsed, toggleCollapsed } = useSidebar();

	return (
		<div className={cn('flex h-14 shrink-0 items-center justify-between gap-2 px-2.5', className)}>
			{!isCollapsed && <div className='min-w-0 flex-1'>{logo}</div>}
			<button
				type='button'
				onClick={toggleCollapsed}
				aria-label={isCollapsed ? expandLabel : collapseLabel}
				aria-expanded={!isCollapsed}
				className={cn(
					'flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--sb-radius,0.5rem)] text-[color:var(--sb-fg-subtle)] transition-colors duration-[var(--sb-duration-fast,130ms)] hover:bg-[var(--sb-hover)] hover:text-[color:var(--sb-fg)]',
					SIDEBAR_FOCUS_CLASS,
					isCollapsed && 'mx-auto'
				)}
			>
				<CollapseIcon direction={isCollapsed ? 'right' : 'left'} />
			</button>
		</div>
	);
}
