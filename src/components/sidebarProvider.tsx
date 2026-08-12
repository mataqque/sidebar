'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { defaultNavigationAdapter, type NavigationAdapter } from '../adapters/navigation';
import { SidebarContextProvider, type SidebarContextValue } from './sidebarContext';

/**
 * Ancho a partir del cual el sidebar deja de ser un cajón y pasa a ser una
 * columna. Coincide con el `lg` de Tailwind por defecto.
 */
export const DEFAULT_MOBILE_BREAKPOINT = 1024;

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
	 *
	 * El cajón (`isOpen`) **nunca** se persiste: es un estado momentáneo, y
	 * recordarlo abriría el menú tapando la página en cada visita.
	 */
	persistKey?: string;
	/**
	 * Ancho, en píxeles, donde el cajón se convierte en columna fija.
	 *
	 * **Tiene que coincidir con el breakpoint `lg` de tu Tailwind**, porque la
	 * presentación la resuelve el CSS con `lg:` —clases que compila el consumidor,
	 * no la librería— y esto solo gobierna el comportamiento: cerrar al navegar,
	 * la tecla Escape y el bloqueo del scroll. Si los dos números no coinciden hay
	 * una franja de anchos donde el cajón se ve pero no se comporta como tal.
	 *
	 * Tailwind por defecto usa 1024; si has redefinido `screens`, pasa el tuyo.
	 */
	mobileBreakpoint?: number;
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
 * Raíz del sidebar: posee el colapso y el cajón, y publica el adaptador de router.
 *
 * La preferencia persistida se aplica **después del montaje**, no en el
 * inicializador de `useState`: leer `localStorage` durante el render rompería la
 * hidratación (el servidor no puede conocer ese valor). El coste es un frame con
 * el estado por defecto, a cambio de HTML consistente.
 *
 * Lo mismo vale para el cajón, y por eso `isOpen` arranca en `false` siempre: el
 * servidor no sabe el ancho de la pantalla. Quién se ve y quién no lo decide el
 * CSS, que sí funciona en el primer paint; aquí solo vive el comportamiento.
 */
export function SidebarProvider({
	children,
	navigation = defaultNavigationAdapter,
	defaultCollapsed = false,
	collapsed,
	onCollapsedChange,
	persistKey,
	mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT,
}: SidebarProviderProps) {
	const isControlled = collapsed !== undefined;
	const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
	const isCollapsed = isControlled ? collapsed : internalCollapsed;

	const [isOpen, setOpen] = useState(false);

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

	/*
	 * Navegar cierra el cajón.
	 *
	 * Es la razón de ser del cajón: se abre para elegir un destino, así que dejarlo
	 * abierto sobre la página recién cargada obliga a un gesto extra para ver
	 * aquello a lo que se acaba de ir.
	 *
	 * La ruta anterior va en una `ref` para no cerrarlo en el primer render, cuando
	 * `currentPath` pasa de `null` al valor real y no ha habido navegación alguna.
	 */
	const previousPath = useRef(currentPath);
	useEffect(() => {
		if (previousPath.current !== null && previousPath.current !== currentPath) {
			setOpen(false);
		}
		previousPath.current = currentPath;
	}, [currentPath]);

	/*
	 * Al ensanchar la ventana el cajón deja de existir como tal. Si el estado
	 * siguiera en `true`, volver a estrechar la reabriría solo, sin que nadie lo
	 * haya pedido.
	 */
	useEffect(() => {
		const query = window.matchMedia(`(min-width: ${mobileBreakpoint}px)`);
		const sync = (event: MediaQueryList | MediaQueryListEvent) => {
			if (event.matches) setOpen(false);
		};

		sync(query);
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	}, [mobileBreakpoint]);

	/*
	 * Con el cajón abierto: Escape lo cierra y el cuerpo deja de desplazarse.
	 *
	 * El bloqueo del scroll es lo que impide el efecto de arrastrar la página de
	 * detrás mientras se recorre el menú. Se restaura el valor previo en vez de
	 * ponerlo a `''`, por si el consumidor ya gobernaba el `overflow` del body.
	 */
	useEffect(() => {
		if (!isOpen) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false);
		};

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		window.addEventListener('keydown', onKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [isOpen]);

	const value = useMemo<SidebarContextValue>(
		() => ({
			isCollapsed,
			setCollapsed,
			toggleCollapsed: () => setCollapsed(!isCollapsed),
			isOpen,
			setOpen,
			toggleOpen: () => setOpen(current => !current),
			currentPath,
			navigation,
		}),
		[isCollapsed, setCollapsed, isOpen, currentPath, navigation]
	);

	return <SidebarContextProvider value={value}>{children}</SidebarContextProvider>;
}
