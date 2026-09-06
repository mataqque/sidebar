/**
 * Copia el CSS de tokens a `dist/`. No lo hace tsup: con `bundle: false` el
 * loader `copy` de esbuild trataría cada `.css` como entrypoint y le pondría
 * hash al nombre, y el subpath `@mataqque/sidebar/styles.css` tiene que
 * resolver a una ruta estable.
 */
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist/styles', { recursive: true });
copyFileSync('src/styles/tokens.css', 'dist/styles/tokens.css');
console.log('dist/styles/tokens.css');
