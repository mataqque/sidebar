import type { CSSProperties } from 'react';

/**
 * Tokens sobreescribibles por instancia. Es un subconjunto deliberado de
 * `tokens.css`: los de uso frecuente. Cualquier otro token se redefine en CSS,
 * que sigue siendo el canal completo de theming.
 */
export type SidebarThemeToken =
	| 'width'
	| 'widthCollapsed'
	| 'itemHeight'
	| 'radius'
	| 'duration'
	| 'scrim'
	| 'surface'
	| 'border'
	| 'separator'
	| 'hover'
	| 'accent'
	| 'accentFg'
	| 'activeBg'
	| 'fg'
	| 'fgMuted'
	| 'fgSubtle';

export type SidebarTheme = Partial<Record<SidebarThemeToken, string>>;

/** Mapa explícito token → variable CSS: evita derivar nombres por convención. */
const TOKEN_VARS: Record<SidebarThemeToken, string> = {
	width: '--sb-width',
	widthCollapsed: '--sb-width-collapsed',
	itemHeight: '--sb-item-height',
	radius: '--sb-radius',
	duration: '--sb-duration',
	scrim: '--sb-scrim',
	surface: '--sb-surface',
	border: '--sb-border',
	separator: '--sb-separator',
	hover: '--sb-hover',
	accent: '--sb-accent',
	accentFg: '--sb-accent-fg',
	activeBg: '--sb-active-bg',
	fg: '--sb-fg',
	fgMuted: '--sb-fg-muted',
	fgSubtle: '--sb-fg-subtle',
};

/**
 * Traduce un `SidebarTheme` a variables CSS inline. Al aplicarse en el `<aside>`,
 * la cascada las hereda a todo el subárbol, así que dos sidebars en la misma
 * página pueden tener acentos distintos sin colisionar.
 */
export function themeToStyle(theme: SidebarTheme | undefined): CSSProperties | undefined {
	if (!theme) return undefined;
	const style: Record<string, string> = {};
	for (const [token, value] of Object.entries(theme) as [SidebarThemeToken, string | undefined][]) {
		if (value !== undefined) style[TOKEN_VARS[token]] = value;
	}
	return style as CSSProperties;
}
