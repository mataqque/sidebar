# @mataqque/sidebar

Sidebar de dashboard para React 18/19. Menú declarativo por **contribuciones** (core + plugins), colapsable con flyout, tematizable por **tokens CSS** y sin acoplamiento al router ni al modelo de sesión de tu app.

## Instalación

Se distribuye como dependencia git y **se transpila desde el consumidor** (no hay paso de build ni `dist/`).

```bash
npm i "@mataqque/sidebar@github:mataqque/sidebar#v0.3.0"
```

### Desarrollo contra una copia local

Para iterar en el diseño sin pasar por commit → tag → push → reinstalar, enlaza la carpeta. `yarn link` crea un **symlink**: no toca `package.json` ni `yarn.lock`, así que CI y producción siguen usando el tag de git.

```bash
cd ../sidebar-ui && yarn link          # una vez, registra el paquete
cd ../mi-app     && yarn link @mataqque/sidebar
```

Para volver al tag: `yarn unlink @mataqque/sidebar && yarn install --check-files`.

> No uses `file:../sidebar-ui`: yarn **copia** la carpeta con su `node_modules` dentro, duplicando React.

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

import { Sidebar, SidebarProvider, buildSidebarMenu } from '@mataqque/sidebar';
import { nextNavigationAdapter } from '@mataqque/sidebar/next';

const items = buildSidebarMenu(coreMenu);

export function Shell({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider navigation={nextNavigationAdapter} persistKey='sidebar:collapsed'>
			<div className='flex h-screen'>
				<Sidebar items={items} logo={<Logo />} profile={<MyProfile />} footer={<MyFooter />} />
				<main className='flex-1 overflow-auto'>{children}</main>
			</div>
		</SidebarProvider>
	);
}
```

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

## Comportamiento responsive

El rail de iconos **está siempre visible**, en cualquier ancho. Lo que cambia con el viewport es a quién le quita sitio el panel expandido:

| Ancho | Colapsado | Expandido |
|---|---|---|
| ≥ `lg` | Columna de `--sb-width-collapsed` | La columna se ensancha a `--sb-width` y empuja el contenido |
| < `lg` | Igual | El hueco sigue en `--sb-width-collapsed`; solo crece el panel, superponiéndose (tope `85vw`) |

En los dos casos el ancho anima **desde** `--sb-width-collapsed` y vuelve a él. No hay cajón que entre desde fuera de la pantalla ni franja de anchos sin sidebar.

`lg` es el de **tu** Tailwind: las clases las compila el consumidor. Si has redefinido `screens`, pasa el mismo número a `expandBreakpoint` para que la única decisión que vive en JS —arrancar colapsado en móvil, y recogerlo al navegar mientras se superpone— caiga en el mismo sitio que el CSS.

```tsx
<SidebarProvider navigation={nextNavigationAdapter} persistKey='sidebar:collapsed' expandBreakpoint={1100}>
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

Tokens principales, por familia:

| Familia | Tokens |
|---|---|
| Geometría | `--sb-width`, `--sb-width-collapsed`, `--sb-item-height`, `--sb-subitem-height`, `--sb-radius` |
| Motion | `--sb-duration` (geometría), `--sb-duration-fast` (color y estado), `--sb-ease` |
| Tipografía | `--sb-label-size`, `--sb-label-weight`, `--sb-label-weight-active`, `--sb-section-size` |
| Superficies | `--sb-surface`, `--sb-border`, `--sb-separator`, `--sb-hover` |
| Estado | `--sb-accent`, `--sb-accent-fg`, `--sb-active-bg`, `--sb-focus-bg` |
| Texto | `--sb-fg`, `--sb-fg-muted` (iconos), `--sb-fg-subtle` (rótulos de sección) |

Modo oscuro vía `.dark` o `[data-theme='dark']`. Lista completa en `src/styles/tokens.css`.

Dos ajustes automáticos que conviene conocer antes de sobreescribir: bajo `pointer: coarse` las filas crecen a `2.75rem` para ser diana de dedo, y los fondos de badge están fijados para sostener 4.5:1 contra `--sb-badge-fg`, así que cambiar uno pide recomprobar el par.

### Chevron compartido

Los grupos colapsables usan `SidebarChevron`, y está exportado para que un select propio que metas en un slot (tenant, idioma, entorno) use el mismo icono y el mismo giro en vez de uno parecido:

```tsx
import { SidebarChevron } from '@mataqque/sidebar';

<button onClick={() => setOpen(o => !o)}>
	<span>{tenant}</span>
	<SidebarChevron open={open} />
</button>
```

Tamaño, grosor de trazo, color y duración salen de los tokens, así que los dos coinciden por construcción y no por copiar valores. Lleva `data-sidebar-chevron="open|closed"` por si quieres engancharte al estado desde CSS.

Si tus selects ya usan otra librería de iconos y prefieres que mande la tuya, va al revés: pásala una vez al provider y todos los grupos la adoptan.

```tsx
<SidebarProvider chevron={open => <ChevronDown className={cn('h-5 w-5 transition-transform', open && 'rotate-180')} />}>
```

Recibe el estado abierto/cerrado y devuelve el nodo ya girado o no: el giro pertenece al icono, no al grupo, así que controlas también la duración y la curva.

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
- El flyout se cierra con `Escape`, recibe el foco al abrirse y lo devuelve al disparador al cerrarse.
- Foco de teclado visible (`--sb-focus-bg`) en toda fila, grupo y botón de colapso: las filas llevan `outline-none` y lo reemplazan con un fondo marcado bajo `focus-visible`, nunca lo suprimen sin más. Es fondo y no contorno para no encerrar en un recuadro una fila que, si está activa, ya tiene marca propia.
- Contraste verificado ≥ 4.5:1 en ambos temas para label, rótulo de sección y texto de badge.
- `--sb-duration` y `--sb-duration-fast` a `0ms` bajo `prefers-reduced-motion: reduce`, así que ningún hover ni chevron conserva transición propia.

## Notas de diseño

- **Se distribuye como fuente**, no compilada: el consumidor la transpila. Elimina el paso de build, el `prepare` en instalaciones git y la desincronización entre `dist/` y `src/`. A cambio, exige un bundler que procese TS/JSX de `node_modules` (`transpilePackages` en Next).
- `buildSidebarMenu`, `activePluginContributions`, `isItemActive` y `findActiveGroupIds` son **puras**: no leen `process.env`, ni globals, ni el router. El entorno y el modelo de roles entran por parámetro.
- El colapso persistido se aplica **tras el montaje**, nunca en el inicializador de `useState`: leer `localStorage` en render rompe la hidratación.
