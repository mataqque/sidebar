'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { defaultNavigationAdapter, type NavigationAdapter } from '../adapters/navigation';
import { SidebarContextProvider, type SidebarContextValue } from './sidebarContext';

export interface SidebarProviderProps {
	children: ReactNode;
	/** Adaptador de router. En Next pasa `nextNavigationAdapter` de `@mataqque/sidebar/next`. */
	navigation?: NavigationAdapter;
	/** Estado inicial en modo no controlado. Default: `false` (expandido). */
	defaultCollapsed?: boolean;
	/** Estado en modo controlado. Al pasarlo, el provider deja de gestionar el suyo. */
	collapsed?: boolean;
	/** Notifica cada cambio de estado (en ambos modos). */
	onCollapsedChange?: (collapsed: boolean) => void;
	/**
	 * Clave de `localStorage` donde recordar el colapso entre visitas. Omítela para
	 * no persistir. Solo aplica en modo no controlado.
	 */
	persistKey?: string;
}

/** Lee la preferencia persistida; cualquier fallo (SSR, storage bloqueado) devuelve `null`. */
function readPersisted(key: string): boolean | null {
	try {
		const raw = window.localStorage.getItem(key);
		return raw === null ? null : raw === 'true';
	} catch {
		return null;
	}
}

/**
 * Raíz del sidebar: posee el estado de colapso y publica el adaptador de router.
 *
 * La preferencia persistida se aplica **después del montaje**, no en el
 * inicializador de `useState`: leer `localStorage` durante el render rompería la
 * hidratación (el servidor no puede conocer ese valor). El coste es un frame con
 * el estado por defecto, a cambio de HTML consistente.
 */
export function SidebarProvider({ children, navigation = defaultNavigationAdapter, defaultCollapsed = false, collapsed, onCollapsedChange, persistKey }: SidebarProviderProps) {
	const isControlled = collapsed !== undefined;
	const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
	const isCollapsed = isControlled ? collapsed : internalCollapsed;

	const currentPath = navigation.useCurrentPath();

	useEffect(() => {
		if (isControlled || !persistKey) return;
		const stored = readPersisted(persistKey);
		if (stored !== null) setInternalCollapsed(stored);
	}, [isControlled, persistKey]);

	const setCollapsed = useCallback(
		(next: boolean) => {
			if (!isControlled) setInternalCollapsed(next);
			if (persistKey && !isControlled) {
				try {
					window.localStorage.setItem(persistKey, String(next));
				} catch {
					// Storage no disponible (modo privado, cuota): el colapso sigue funcionando en memoria.
				}
			}
			onCollapsedChange?.(next);
		},
		[isControlled, persistKey, onCollapsedChange]
	);

	const value = useMemo<SidebarContextValue>(
		() => ({ isCollapsed, setCollapsed, toggleCollapsed: () => setCollapsed(!isCollapsed), currentPath, navigation }),
		[isCollapsed, setCollapsed, currentPath, navigation]
	);

	return <SidebarContextProvider value={value}>{children}</SidebarContextProvider>;
}
