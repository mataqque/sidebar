'use client';

import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { useSidebar } from './sidebarContext';

export interface SidebarTriggerProps {
	className?: string;
	/** Sustituye el icono por defecto. Recibe el estado para poder alternar el dibujo. */
	children?: ReactNode | ((state: { isOpen: boolean }) => ReactNode);
	/** Nombre accesible cuando el cajón está cerrado. */
	labelOpen?: string;
	/** Nombre accesible cuando está abierto. */
	labelClose?: string;
}

/**
 * Icono por defecto: tres trazos que se convierten en aspa.
 *
 * Dibujado, no un glifo tipográfico, y animado por transformación de sus propias
 * líneas — así el cambio abierto/cerrado es un movimiento continuo y no dos
 * iconos que se intercambian.
 */
function TriggerIcon({ isOpen }: { isOpen: boolean }) {
	const stroke = 'origin-center transition-transform duration-[var(--sb-duration)] ease-out';

	return (
		<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.75} strokeLinecap='round' className='h-5 w-5' aria-hidden='true'>
			<line x1='4' y1='7' x2='20' y2='7' className={cn(stroke, isOpen && 'translate-y-[5px] rotate-45')} />
			<line x1='4' y1='12' x2='20' y2='12' className={cn('transition-opacity duration-[var(--sb-duration)]', isOpen && 'opacity-0')} />
			<line x1='4' y1='17' x2='20' y2='17' className={cn(stroke, isOpen && '-translate-y-[5px] -rotate-45')} />
		</svg>
	);
}

/**
 * Botón que despliega el cajón en pantallas estrechas.
 *
 * Vive en la librería y no en cada consumidor porque sin él el cajón es
 * inalcanzable: un panel que solo se cierra no es una función, es un fallo. Que
 * el paquete traiga los dos lados evita que cada proyecto reinvente el disparador
 * y se olvide del `aria-expanded`.
 *
 * `lg:hidden` porque por encima del breakpoint el sidebar está siempre presente y
 * un botón para «abrir» lo que ya se ve no significa nada. Si tu escala de
 * Tailwind redefine `lg`, este corte la sigue — es la misma clase que usa el
 * sidebar.
 *
 * El área táctil son 44px aunque el icono mida 20: en un teléfono se apunta con
 * el pulgar, y este botón es la única puerta al menú.
 */
export function SidebarTrigger({ className, children, labelOpen = 'Abrir el menú', labelClose = 'Cerrar el menú' }: SidebarTriggerProps) {
	const { isOpen, toggleOpen } = useSidebar();

	return (
		<button
			type='button'
			onClick={toggleOpen}
			aria-expanded={isOpen}
			aria-label={isOpen ? labelClose : labelOpen}
			className={cn(
				'grid h-11 w-11 shrink-0 place-items-center rounded-[var(--sb-radius)]',
				'text-[color:var(--sb-fg)] transition-colors hover:bg-[var(--sb-hover)]',
				'lg:hidden',
				className
			)}
		>
			{typeof children === 'function' ? children({ isOpen }) : (children ?? <TriggerIcon isOpen={isOpen} />)}
		</button>
	);
}
