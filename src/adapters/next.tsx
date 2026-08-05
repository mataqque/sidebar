'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import type { NavigationAdapter } from './navigation';

/**
 * Adaptador para Next App Router. Vive en el subpath `@mataqque/sidebar/next`
 * para que el core no importe `next/*`: quien no use Next nunca carga este módulo
 * y `next` puede ser una peer dependency opcional.
 */
export const nextNavigationAdapter: NavigationAdapter = {
	Link: ({ href, children, ...rest }) => (
		<NextLink href={href} {...rest}>
			{children}
		</NextLink>
	),
	useCurrentPath: usePathname,
};
