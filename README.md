# @mataqque/sidebar

Sidebar de dashboard para React 18/19. Menú declarativo por **contribuciones** (core + plugins), colapsable con flyout, tematizable por **tokens CSS** y sin acoplamiento al router ni al modelo de sesión de tu app.

## Instalación

Se distribuye como dependencia git y **se transpila desde el consumidor** (no hay paso de build ni `dist/`).

```bash
npm i "@mataqque/sidebar@github:mataqque/sidebar#v0.1.0"
```

### 1. Transpilar el paquete (Next)

```ts
// next.config.ts
const nextConfig = {
	transpilePackages: ['@mataqque/sidebar'],
};
```

### 2. Incluirlo en el escaneo de Tailwind

Sin esto, las clases de la librería no se generan y el sidebar sale sin estilos.

```js
// tailwind.config.js
module.exports = {
	content: ['./src/**/*.{ts,tsx}', './node_modules/@mataqque/sidebar/src/**/*.{ts,tsx}'],
};
```

### 3. Importar los tokens

```ts
// app/layout.tsx
import '@mataqque/sidebar/styles.css';
```

## Uso mínimo (Next App Router)

```tsx
'use client';

import { Sidebar, SidebarProvider, SidebarTrigger, buildSidebarMenu } from '@mataqque/sidebar';
import { nextNavigationAdapter } from '@mataqque/sidebar/next';

const items = buildSidebarMenu(coreMenu);

export function Shell({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider navigation={nextNavigationAdapter} persistKey='sidebar:collapsed'>
			<div className='flex min-h-[100dvh]'>
				<Sidebar items={items} logo={<Logo />} profile={<MyProfile />} footer={<MyFooter />} />
				<div className='flex min-w-0 flex-1 flex-col'>
					<header className='flex items-center gap-2'>
						{/* Sin esto el cajón es inalcanzable en móvil. Se oculta solo en `lg`. */}
						<SidebarTrigger />
					</header>
					<main className='flex-1'>{children}</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
```

## Móvil: columna arriba, cajón abajo

Por encima de `lg` el sidebar es una **columna** que ocupa su ancho y empuja al contenido. Por debajo es un **cajón** que sale sobre la página con un velo y se retira al elegir destino.

No es la misma pieza encogida, y por eso no basta con un `w-` responsive: un sidebar de `20rem` en un teléfono de 390px deja 70px para trabajar. A esos anchos la única versión útil es la que no está ahí hasta que se pide.

**Lo que trae de serie:** velo que cierra al tocarlo, `Escape`, cierre automático al navegar, bloqueo del scroll del cuerpo mientras está abierto, y el panel fuera del recorrido de tabulación cuando está cerrado. El colapso se ignora en cajón — una tira de iconos flotando sobre el contenido no sirve para navegar ni deja ver lo que tapa.

**Dos piezas que tienes que poner tú:**

1. **`<SidebarTrigger />`** en tu cabecera. Sin él no hay forma de abrirlo. Se oculta solo a partir de `lg`.
2. **`mobileBreakpoint`** si has redefinido `screens` en Tailwind:

```tsx
<SidebarProvider mobileBreakpoint={1100} …>
```

La presentación la resuelve el CSS con clases `lg:`, que **compila tu Tailwind, no la librería** — así el corte sigue tu escala. Pero el comportamiento (cerrar al navegar, Escape, scroll) necesita el número en JavaScript. Si los dos no coinciden hay una franja de anchos donde el cajón se ve pero no se comporta como tal. El valor por defecto es `1024`, el `lg` de Tailwind sin tocar.

Que el CSS mande y no JavaScript es deliberado: el servidor no conoce el ancho de la pantalla, así que decidir el layout en JS daría un desajuste de hidratación y un parpadeo en el primer paint.

## Modelo de menú

Un menú se declara como lista de `SidebarContribution` y se compila con `buildSidebarMenu`, que ordena, poda e inyecta. Función pura: testeable sin renderizar.

```tsx
import { buildSidebarMenu, SIDEBAR_ICON_CLASS, cn, type SidebarContribution } from '@mataqque/sidebar';
import { Home, Image } from 'lucide-react';

const coreMenu: SidebarContribution[] = [
	{
		item: {
			id: 'home',
			label: 'Inicio',
			href: '/dashboard',
			order: 1,
			icon: (className, attrs) => <Home className={cn('h-6 w-[1.32rem]', SIDEBAR_ICON_CLASS, className)} {...attrs} />,
		},
	},
	{
		item: {
			kind: 'division',
			id: 'section-admin',
			label: 'Administración',
			order: 2,
			children: [{ id: 'media', label: 'Media', href: '/dashboard/media', match: 'startsWith', icon: ... }],
		},
	},
	// Un plugin inyecta dentro de un contenedor existente sin tocar el core:
	{ groupId: 'tools', item: { id: 'emails', label: 'Emails', href: '/dashboard/emails', icon: ... } },
];

export const menu = buildSidebarMenu(coreMenu, process.env.NODE_ENV !== 'production' ? m => console.warn('[sidebar]', m) : undefined);
```

### Tipos de nodo

| Nodo | Qué es |
|---|---|
| `MenuItem` sin `children` | Link (`href`) o botón de acción (`onSelect`) |
| `MenuItem` con `children` | Grupo colapsable; colapsado abre un flyout lateral |
| `MenuDivision` (`kind: 'division'`) | Rótulo no navegable que agrupa items de nivel raíz |

### Propiedades útiles

- `order` — posición ascendente en su contenedor. Default `100`.
- `match: 'startsWith'` — mantiene el item activo en sub-rutas (`/media` sigue activo en `/media/42`). Default `'exact'`.
- `hidden` — poda el item; los contenedores que se quedan sin hijos navegables desaparecen en cascada. Úsalo para gating por permiso.
- `groupId` en la contribución — inyecta el item como hijo del contenedor con ese id, a cualquier profundidad.
- `meta` — bolsa libre; la librería no la interpreta.

### Plugins

```ts
import { activePluginContributions, type DashboardPlugin } from '@mataqque/sidebar';

const plugins: DashboardPlugin<RoleType>[] = [emailsPlugin, generatorPlugin];

const contributions = activePluginContributions(plugins, {
	isDev: process.env.NODE_ENV !== 'production',
	canUse: plugin => !plugin.requiredRole || hasRole(plugin.requiredRole),
});
```

## Slots

`Sidebar` aporta estructura, colapso y menú. Todo lo específico de tu app entra como slot, con separadores automáticos solo entre los bloques presentes:

| Prop | Uso |
|---|---|
| `logo` | Marca en la cabecera por defecto |
| `header` | Sustituye la cabecera completa |
| `profile` | Bloque de usuario (tu modelo de sesión) |
| `children` | Bloque libre entre perfil y menú (selector de tenant, buscador…) |
| `footer` | Acciones inferiores |

El contenido inyectado puede reaccionar al colapso solo con clases, sin hooks:

```tsx
<span className='hidden group-data-[state=expanded]/sidebar:inline'>Solo visible expandido</span>
```

## Theming

Todos los estilos leen variables CSS. Tres niveles, de global a local:

```css
/* 1. Global */
:root {
	--sb-accent: #6366f1;
	--sb-width: 18rem;
}
```

```tsx
/* 2. Por instancia */
<Sidebar theme={{ accent: '#6366f1', width: '18rem' }} items={items} />
```

```tsx
/* 3. Por elemento: className en cualquier subcomponente */
<Sidebar className='shadow-xl' />
```

Tokens principales: `--sb-width`, `--sb-width-collapsed`, `--sb-item-height`, `--sb-radius`, `--sb-duration`, `--sb-surface`, `--sb-border`, `--sb-separator`, `--sb-hover`, `--sb-accent`, `--sb-accent-fg`, `--sb-active-bg`, `--sb-fg`, `--sb-fg-muted`, `--sb-fg-subtle`. Modo oscuro vía `.dark` o `[data-theme='dark']`. Lista completa en `src/styles/tokens.css`.

## Router

El único contacto con el router es `NavigationAdapter`:

```ts
interface NavigationAdapter {
	Link: (props: SidebarLinkProps) => ReactNode;
	useCurrentPath: () => string | null; // `null` mientras se desconoce (SSR)
}
```

- **Next App Router** → `nextNavigationAdapter` de `@mataqque/sidebar/next`.
- **Otro router** → implementa las dos propiedades.
- **Sin router** (Storybook, tests) → `defaultNavigationAdapter`, el default.

`useCurrentPath` se invoca una sola vez por render desde `SidebarProvider`, así que puede usar hooks.

## Accesibilidad

- `<aside>` y `<nav>` con nombre accesible propio.
- `aria-current="page"` en el item activo, `aria-expanded` / `aria-controls` en los grupos.
- Colapsado: el label viaja en `sr-only` + `title`, así el control nunca queda sin nombre.
- El flyout se cierra con `Escape` y recibe el foco al abrirse.
- `--sb-duration: 0ms` bajo `prefers-reduced-motion: reduce`.

## Notas de diseño

- **Se distribuye como fuente**, no compilada: el consumidor la transpila. Elimina el paso de build, el `prepare` en instalaciones git y la desincronización entre `dist/` y `src/`. A cambio, exige un bundler que procese TS/JSX de `node_modules` (`transpilePackages` en Next).
- `buildSidebarMenu`, `activePluginContributions`, `isItemActive` y `findActiveGroupIds` son **puras**: no leen `process.env`, ni globals, ni el router. El entorno y el modelo de roles entran por parámetro.
- El colapso persistido se aplica **tras el montaje**, nunca en el inicializador de `useState`: leer `localStorage` en render rompe la hidratación.
