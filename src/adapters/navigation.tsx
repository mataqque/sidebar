'use client';

import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';

export interface SidebarLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	href: string;
	children: ReactNode;
}

/**
 * Único punto de contacto entre el sidebar y el router del consumidor. Aislarlo
 * aquí mantiene el core libre de `next/*`: la misma librería sirve en Next, en
 * React Router o en un Storybook sin router.
 */
export interface NavigationAdapter {
	/** Componente de enlace del framework (`next/link`, `<Link>` de React Router, `<a>`…). */
	Link: (props: SidebarLinkProps) => ReactNode;
	/**
	 * Hook que devuelve la ruta actual sin querystring ni hash.
	 *
	 * Contrato: se invoca **una sola vez por render** desde el proveedor del
	 * sidebar, así que puede usar hooks. Debe devolver `null` mientras la ruta sea
	 * desconocida (SSR) para no provocar mismatch de hidratación.
	 */
	useCurrentPath: () => string | null;
}

/**
 * Lee `window.location.pathname` tras el montaje y sigue los cambios de historial.
 * Devuelve `null` en servidor y en el primer render del cliente: así el HTML del
 * servidor y el de la hidratación coinciden, y el estado activo aparece justo
 * después sin warning de React.
 */
function useLocationPathname(): string | null {
	const [path, setPath] = useState<string | null>(null);

	useEffect(() => {
		const read = () => setPath(window.location.pathname);
		read();
		window.addEventListener('popstate', read);
		return () => window.removeEventListener('popstate', read);
	}, []);

	return path;
}

/**
 * Adaptador sin dependencias: ancla nativa y ruta leída del navegador. Es el
 * fallback cuando no se pasa `navigation` al `SidebarProvider`; en Next usa
 * `nextNavigationAdapter` de `@mataqque/sidebar/next` para no perder la
 * navegación cliente ni el prefetch.
 */
export const defaultNavigationAdapter: NavigationAdapter = {
	Link: ({ href, children, ...rest }) => (
		<a href={href} {...rest}>
			{children}
		</a>
	),
	useCurrentPath: useLocationPathname,
};
