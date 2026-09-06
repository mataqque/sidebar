import { defineConfig } from 'tsup';

/**
 * Build a `dist/` publicado. La librería se distribuía como fuente y la
 * transpilaba el consumidor; ahora se compila aquí para que un `yarn install`
 * la traiga lista y no haga falta `transpilePackages` ni enlazar el repo.
 *
 * `bundle: false` no es una preferencia estética: 12 módulos llevan
 * `"use client"` y son el límite servidor/cliente de Next. Al bundlear, esa
 * directiva se colapsa en la del entrypoint y el árbol entero cae del mismo
 * lado. Compilando archivo a archivo, cada módulo conserva la suya.
 *
 * Los `.d.ts` no salen de aquí sino de `tsc` (ver `tsconfig.build.json`): el
 * generador de tipos de tsup asume un bundle y no acompaña a `bundle: false`.
 */
export default defineConfig({
	entry: ['src/**/*.ts', 'src/**/*.tsx'],
	outDir: 'dist',
	format: ['esm', 'cjs'],
	bundle: false,
	dts: false,
	clean: true,
	sourcemap: true,
	target: 'es2020',
	// esm → `.mjs`, cjs → `.js`. Sin bundle nadie reescribe los specifiers
	// relativos, que quedan sin extensión: en CJS los resuelve Node y en ESM el
	// bundler del consumidor. La extensión explícita evita que Node lea el ESM
	// como CommonJS al no haber `"type": "module"`.
	outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.js' }),
});
