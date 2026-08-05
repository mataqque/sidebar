import type { MenuChild, MenuItem } from './types';
import { isDivision } from './types';

/**
 * ¿La ruta actual activa este item? Funciones puras sobre strings: no tocan el
 * router, así que el matching se puede testear sin renderizar.
 *
 * `match: 'exact'` (default) compara la ruta completa. `'startsWith'` mantiene el
 * item activo en sub-rutas, comparando por segmentos para que `/dashboard/media`
 * no active `/dashboard/media-library`.
 *
 * Negative space: `currentPath === null` (SSR, ruta aún desconocida) nunca activa
 * nada, para que servidor y cliente rindan el mismo HTML.
 */
export function isItemActive(item: MenuItem, currentPath: string | null): boolean {
	if (!item.href || currentPath === null) return false;
	if (currentPath === item.href) return true;
	if (item.match !== 'startsWith') return false;
	const prefix = item.href.endsWith('/') ? item.href : `${item.href}/`;
	return currentPath.startsWith(prefix);
}

/** ¿Este item o alguno de sus descendientes está activo? */
function containsActive(item: MenuItem, currentPath: string | null): boolean {
	return isItemActive(item, currentPath) || (item.children?.some(child => containsActive(child, currentPath)) ?? false);
}

/**
 * Ids de los grupos colapsables que contienen la ruta actual, a cualquier
 * profundidad. El menú los abre en el primer render para que al entrar por URL
 * directa a una sub-ruta el item activo sea visible en vez de quedar escondido
 * dentro de un acordeón cerrado.
 */
export function findActiveGroupIds(nodes: readonly MenuChild[], currentPath: string | null): string[] {
	if (currentPath === null) return [];
	const ids: string[] = [];

	const walkItem = (item: MenuItem): void => {
		if (!item.children || item.children.length === 0) return;
		if (item.children.some(child => containsActive(child, currentPath))) ids.push(item.id);
		item.children.forEach(walkItem);
	};

	for (const node of nodes) {
		if (isDivision(node)) node.children.forEach(walkItem);
		else walkItem(node);
	}

	return ids;
}
