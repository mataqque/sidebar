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
 * **El rail nunca desaparece.** Son dos cajas: el `<aside>` reserva el hueco en el
 * layout y el panel interior es lo que se ve. Por encima de `lg` van acompasados,
 * así que expandir ensancha la columna; por debajo el hueco se queda en el ancho
 * colapsado y solo crece el panel, superponiéndose al contenido. En ambos casos el
 * ancho anima desde `--sb-width-collapsed` y vuelve a él: nunca hay un panel que
 * entre desde fuera de la pantalla ni una franja de anchos sin sidebar visible.
 *
 * Precondición: se renderiza dentro de un `<SidebarProvider>`.
 */
export function Sidebar({ items, logo, header, profile, children, footer, theme, className, label = 'Menú lateral', menuLabel, onSelect }: SidebarProps) {
	const { isCollapsed } = useSidebar();

	// Solo se separan los bloques presentes: un sidebar sin perfil no debe mostrar
	// dos filetes pegados donde debería haber uno.
	//
	// Y no todos los huecos llevan filete. Marca, perfil y bloques propios se
	// agrupan por proximidad; el filete queda para los dos bordes que de verdad
	// informan —donde empieza y donde acaba la región que scrollea— porque una
	// regla en cada junta convertía un panel corto en cuatro líneas horizontales
	// y ninguna decía nada.
	const sections = (
		[
			{ id: 'header', node: header ?? <SidebarHeader logo={logo} /> },
			{ id: 'profile', node: profile },
			{ id: 'children', node: children },
			{ id: 'menu', node: items && items.length > 0 ? <SidebarMenu items={items} label={menuLabel} onSelect={onSelect} /> : undefined },
			{ id: 'footer', node: footer },
		] as { id: string; node: ReactNode }[]
	).filter(section => section.node !== undefined && section.node !== null && section.node !== false);

	return (
		<aside
			aria-label={label}
			data-sidebar-root
			data-state={isCollapsed ? 'collapsed' : 'expanded'}
			style={themeToStyle(theme)}
			className={cn(
				'group/sidebar sticky top-0 z-40 h-[100dvh] shrink-0',
				'transition-[width] duration-[var(--sb-duration,260ms)]',
				// Hueco reservado en el layout. Por debajo de `lg` es siempre el rail:
				// el panel expandido se superpone en vez de estrujar el contenido.
				'w-[var(--sb-width-collapsed)]',
				isCollapsed ? 'lg:w-[var(--sb-width-collapsed)]' : 'lg:w-[var(--sb-width)]',
				className
			)}
		>
			<div
				className={cn(
					'absolute inset-y-0 left-0 flex flex-col overflow-hidden',
					'bg-[var(--sb-surface)]',
					'transition-[width] duration-[var(--sb-duration,260ms)]',
					isCollapsed
						? 'w-[var(--sb-width-collapsed)]'
						: 'w-[var(--sb-width)] max-w-[85vw] shadow-[var(--sb-flyout-shadow)] lg:max-w-none lg:shadow-none'
				)}
			>
				{/*
					Filete derecho del panel. Elemento propio en vez de `border-r` por lo
					mismo que la guía del acordeón: sin el preflight de Tailwind el borde
					no llega a pintarse y el panel se quedaba sin canto.
				*/}
				<span aria-hidden className='pointer-events-none absolute inset-y-0 right-0 z-10 w-px bg-[var(--sb-border)]' />
				{sections.map((section, index) => {
					const hasSeparator = index > 0 && (section.id === 'menu' || section.id === 'footer');
					return (
						<Fragment key={section.id}>
							{hasSeparator && <SidebarSeparator />}
							{/* Sin filete, el aire tiene que venir de algún sitio: si no, marca,
							    perfil y bloque propio del consumidor quedan pegados. */}
							{index > 0 && !hasSeparator && <div aria-hidden className='h-1 shrink-0' />}
							{section.node}
						</Fragment>
					);
				})}
			</div>
		</aside>
	);
}
