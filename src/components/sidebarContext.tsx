'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { NavigationAdapter } from '../adapters/navigation';

export interface SidebarContextValue {
	/** `true` = el sidebar muestra solo iconos. */
	isCollapsed: boolean;
	setCollapsed: (collapsed: boolean) => void;
	toggleCollapsed: () => void;
	/** Ruta actual resuelta por el adaptador; `null` mientras se desconoce (SSR). */
	currentPath: string | null;
	navigation: NavigationAdapter;
	/**
	 * Chevron de los grupos colapsables. `undefined` usa el de la librería.
	 * Recibe el estado abierto/cerrado y devuelve el nodo ya girado o no: la
	 * animación es cosa del icono, no del grupo.
	 */
	chevron?: (open: boolean) => ReactNode;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export const SidebarContextProvider = SidebarContext.Provider;

/**
 * Estado y adaptadores del sidebar.
 *
 * Precondición: se llama dentro de un `<SidebarProvider>`. Falla ruidosamente en
 * vez de devolver un valor por defecto: un sidebar sin provider no colapsa ni
 * resuelve rutas, y eso es un error de montaje, no un estado válido.
 */
export function useSidebar(): SidebarContextValue {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error('useSidebar debe usarse dentro de <SidebarProvider>.');
	}
	return context;
}
