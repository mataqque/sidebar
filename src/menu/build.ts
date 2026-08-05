import type { DashboardPlugin, MenuChild, MenuItem, SidebarContribution } from './types';
import { DEFAULT_ORDER, isDivision } from './types';

/** Desempate ascendente por `order`; sin `order` el nodo cae al final (`DEFAULT_ORDER`). */
function byOrder(a: { order?: number }, b: { order?: number }): number {
	return (a.order ?? DEFAULT_ORDER) - (b.order ?? DEFAULT_ORDER);
}

/** Clona un item y sus descendientes sin mutar la fuente. */
function cloneItem(item: MenuItem): MenuItem {
	return { ...item, children: item.children ? item.children.map(cloneItem) : undefined };
}

/** Clona un nodo raíz (item o división) sin mutar la fuente. */
function cloneNode(node: MenuChild): MenuChild {
	return isDivision(node) ? { ...node, children: node.children.map(cloneItem) } : cloneItem(node);
}

/** Indexa por id todos los contenedores del árbol, para resolver `groupId` aunque esté anidado. */
function indexById(nodes: MenuChild[], map: Map<string, MenuChild>): void {
	for (const node of nodes) {
		map.set(node.id, node);
		indexById(node.children ?? [], map);
	}
}

/**
 * Poda los items `hidden` y, en cascada, los contenedores que se quedan sin hijos
 * navegables: un grupo cuyos sub-items están todos ocultos y que no tiene `href`
 * propio no debe renderizarse como un botón que no lleva a ninguna parte.
 */
function pruneItems(items: MenuItem[]): MenuItem[] {
	const kept: MenuItem[] = [];
	for (const item of items) {
		if (item.hidden) continue;
		if (!item.children) {
			kept.push(item);
			continue;
		}
		const children = pruneItems(item.children);
		if (children.length === 0 && !item.href) continue;
		kept.push({ ...item, children: children.length > 0 ? children : undefined });
	}
	return kept;
}

/** Ordena recursivamente los sub-items por `order`, sin mutar la fuente. */
function sortItems(items: MenuItem[]): MenuItem[] {
	return [...items].map(item => (item.children ? { ...item, children: sortItems(item.children) } : item)).sort(byOrder);
}

/** Poda y ordena los nodos raíz; una división sin hijos visibles desaparece con su rótulo. */
function normalizeRoots(nodes: MenuChild[]): MenuChild[] {
	const kept: MenuChild[] = [];
	for (const node of nodes) {
		if (node.hidden) continue;
		if (isDivision(node)) {
			const children = sortItems(pruneItems(node.children));
			if (children.length === 0) continue;
			kept.push({ ...node, children });
			continue;
		}
		const [item] = pruneItems([node]);
		if (!item) continue;
		kept.push(item.children ? { ...item, children: sortItems(item.children) } : item);
	}
	return kept.sort(byOrder);
}

/**
 * Construye el árbol final del sidebar a partir de las contribuciones del core y de
 * los plugins. El orden, en todos los niveles, lo declara cada nodo con su `order`
 * (autodescriptivo). Las divisiones rotulan bloques de nivel raíz; los `groupId`
 * inyectan items dentro de cualquier contenedor por id.
 *
 * Función **pura**: no lee entorno ni globals, así que es testeable sin renderizar.
 *
 * Precondición: cada `groupId` referencia el id de un contenedor existente.
 * Negative space: una contribución cuyo `groupId` no exista —o una división que
 * intente inyectarse con `groupId`— se descarta (con aviso opcional) en vez de romper.
 *
 * @param onWarn Receptor de avisos de contribuciones descartadas. Pásalo solo en
 *   desarrollo; omitirlo silencia los avisos sin cambiar el resultado.
 */
export function buildSidebarMenu(contributions: readonly SidebarContribution[], onWarn?: (message: string) => void): MenuChild[] {
	const roots: MenuChild[] = [];
	const injections: { groupId: string; item: MenuItem }[] = [];

	for (const contribution of contributions) {
		if (!contribution.groupId) {
			roots.push(cloneNode(contribution.item));
			continue;
		}
		if (isDivision(contribution.item)) {
			onWarn?.(`una división ("${contribution.item.id}") no puede inyectarse con groupId; se omite.`);
			continue;
		}
		injections.push({ groupId: contribution.groupId, item: contribution.item });
	}

	const byId = new Map<string, MenuChild>();
	indexById(roots, byId);

	for (const { groupId, item } of injections) {
		const parent = byId.get(groupId);
		if (!parent) {
			onWarn?.(`groupId "${groupId}" inexistente; se omite "${item.id}".`);
			continue;
		}
		const child = cloneItem(item);
		parent.children = [...(parent.children ?? []), child];
		indexById([child], byId);
	}

	return normalizeRoots(roots);
}

interface PluginFilterOptions<TRole extends string> {
	/** Si es `false`, los plugins `devOnly` se descartan. Default: `true`. */
	isDev?: boolean;
	/** Gate adicional del consumidor (rol, permiso, feature flag). Default: todo pasa. */
	canUse?: (plugin: DashboardPlugin<TRole>) => boolean;
}

/**
 * Contribuciones de sidebar de los plugins que superan los gates del consumidor.
 * La librería no lee `process.env` ni conoce el modelo de roles: ambos entran por
 * parámetro para que la función sea pura y testeable.
 */
export function activePluginContributions<TRole extends string>(plugins: readonly DashboardPlugin<TRole>[], options: PluginFilterOptions<TRole> = {}): SidebarContribution[] {
	const { isDev = true, canUse } = options;
	return plugins.filter(plugin => !(plugin.devOnly && !isDev)).filter(plugin => canUse?.(plugin) ?? true).map(plugin => plugin.sidebar);
}
