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
 * Precondición: se renderiza dentro de un `<SidebarProvider>`.
 */
export function Sidebar({ items, logo, header, profile, children, footer, theme, className, label = 'Menú lateral', menuLabel, onSelect }: SidebarProps) {
	const { isCollapsed } = useSidebar();

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
		<aside
			aria-label={label}
			data-state={isCollapsed ? 'collapsed' : 'expanded'}
			style={themeToStyle(theme)}
			className={cn(
				'group/sidebar relative left-0 top-0 z-40 h-screen shrink-0 overflow-hidden',
				'border-r border-[color:var(--sb-border)] bg-[var(--sb-surface)]',
				'transition-[width] duration-[var(--sb-duration)]',
				isCollapsed ? 'w-[var(--sb-width-collapsed)]' : 'w-[var(--sb-width)]',
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
	);
}
