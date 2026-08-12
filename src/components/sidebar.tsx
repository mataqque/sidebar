'use client';

import { Fragment, type ReactNode } from 'react';

import { cn } from '../lib/cn';
import type { MenuChild, MenuItem } from '../menu/types';
import { SidebarSeparator } from './primitives';
import { useSidebar } from './sidebarContext';
import { SidebarHeader } from './sidebarHeader';
import { SidebarMenu } from './sidebarMenu';
import { themeToStyle, type SidebarTheme } from './sidebarTheme';

export interface SidebarProps {
	/** Árbol del menú, normalmente salida de `buildSidebarMenu`. */
	items?: readonly MenuChild[];
	/** Marca mostrada en la cabecera por defecto. Ignorado si pasas `header`. */
	logo?: ReactNode;
	/** Sustituye la cabecera completa (incluido el botón de colapso). */
	header?: ReactNode;
	/** Bloque de identidad del usuario. La librería no conoce tu modelo de sesión. */
	profile?: ReactNode;
	/** Bloque libre entre el perfil y el menú (selector de tenant, buscador…). */
	children?: ReactNode;
	footer?: ReactNode;
	/** Sobreescribe tokens solo para esta instancia. */
	theme?: SidebarTheme;
	className?: string;
	/** Nombre accesible del landmark. */
	label?: string;
	menuLabel?: string;
	/** Se invoca al activar un item de menú sin `href`. */
	onSelect?: (item: MenuItem) => void;
	/** Etiqueta del velo que cierra el cajón. */
	scrimLabel?: string;
}

/**
 * Panel lateral del dashboard.
 *
 * La composición es por **slots**: la librería aporta la estructura, el colapso y
 * el menú; el perfil, la marca y los bloques propios los inyecta cada proyecto. Así
 * el mismo paquete sirve a apps con modelos de sesión y de tenant distintos sin que
 * ninguno de esos conceptos entre en la librería.
 *
 * Expone su estado como `data-state` sobre el grupo `sidebar`, de modo que el
 * contenido inyectado pueda reaccionar al colapso solo con clases:
 * `group-data-[state=expanded]/sidebar:flex`.
 *
 * ## Dos formas, no una encogida
 *
 * Por encima de `lg` es una **columna**: ocupa su ancho y empuja al contenido.
 * Por debajo es un **cajón**: sale por encima de la página sobre un velo y se
 * retira al elegir destino. No es la misma cosa más estrecha — un sidebar de
 * 20rem en un teléfono de 390px deja 70px para trabajar, así que a esos anchos la
 * única versión útil es la que no está ahí hasta que se pide.
 *
 * El colapso se ignora por debajo de `lg`: una tira de iconos flotando sobre el
 * contenido no sirve para navegar ni deja ver lo que tapa.
 *
 * **Quién enseña qué lo decide el CSS, no JavaScript.** Así el primer paint ya es
 * correcto y no hay desajuste de hidratación: el servidor no conoce el ancho de
 * la pantalla. El `lg:` lo compila el Tailwind del consumidor, de modo que el
 * corte sigue su escala; dile a `<SidebarProvider mobileBreakpoint>` cuál es ese
 * número para que el comportamiento vaya a la par.
 *
 * Precondición: se renderiza dentro de un `<SidebarProvider>`.
 */
export function Sidebar({
	items,
	logo,
	header,
	profile,
	children,
	footer,
	theme,
	className,
	label = 'Menú lateral',
	menuLabel,
	onSelect,
	scrimLabel = 'Cerrar el menú',
}: SidebarProps) {
	const { isCollapsed, isOpen, setOpen } = useSidebar();

	// Solo se separan los bloques presentes: un sidebar sin perfil no debe mostrar
	// dos filetes pegados donde debería haber uno.
	const sections: ReactNode[] = [
		header ?? <SidebarHeader logo={logo} />,
		profile,
		children,
		items && items.length > 0 ? <SidebarMenu items={items} label={menuLabel} onSelect={onSelect} /> : undefined,
		footer,
	].filter((section): section is ReactNode => section !== undefined && section !== null && section !== false);

	return (
		<>
			{/*
			 * Velo. Cierra el cajón al tocarlo —el gesto que espera cualquiera con un
			 * panel abierto— y separa visualmente lo que está activo de lo que no.
			 *
			 * Sigue montado con el cajón cerrado, animando solo `opacity`: quitarlo del
			 * árbol haría que apareciese de golpe en vez de fundirse. `pointer-events-none`
			 * es lo que impide que intercepte toques cuando es invisible.
			 */}
			<div
				role='presentation'
				aria-label={scrimLabel}
				onClick={() => setOpen(false)}
				className={cn(
					'fixed inset-0 z-40 bg-[var(--sb-scrim)] transition-opacity duration-[var(--sb-duration)] lg:hidden',
					isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
				)}
			/>

			<aside
				aria-label={label}
				data-state={isCollapsed ? 'collapsed' : 'expanded'}
				data-open={isOpen ? 'true' : 'false'}
				style={themeToStyle(theme)}
				className={cn(
					'group/sidebar fixed inset-y-0 left-0 z-50 overflow-hidden',
					'border-r border-[color:var(--sb-border)] bg-[var(--sb-surface)]',
					'transition-[width,transform,visibility] duration-[var(--sb-duration)] ease-out',
					// Ancho: en cajón siempre completo, y acotado para que en una pantalla
					// estrecha quede a la vista un margen de la página de detrás — la
					// señal de que esto se cierra.
					'w-[var(--sb-width)] max-w-[85vw] lg:max-w-none',
					// `invisible` y no solo el desplazamiento: un panel fuera de pantalla
					// pero visible sigue en el recorrido de tabulación, y se acabaría
					// navegando a ciegas por un menú que nadie ve.
					isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
					// A partir de `lg` vuelve a ser columna: sin desplazamiento, en flujo,
					// y ahí sí manda el colapso.
					'lg:visible lg:relative lg:z-40 lg:h-[100dvh] lg:translate-x-0',
					isCollapsed ? 'lg:w-[var(--sb-width-collapsed)]' : 'lg:w-[var(--sb-width)]',
					className
				)}
			>
				<div className='flex h-full w-full flex-col'>
					{sections.map((section, index) => (
						<Fragment key={index}>
							{index > 0 && <SidebarSeparator />}
							{section}
						</Fragment>
					))}
				</div>
			</aside>
		</>
	);
}
