import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Une clases condicionales y resuelve conflictos de utilidades Tailwind
 * (la última gana). Interno a la librería: no depende del `cn` del consumidor
 * para que el paquete sea autocontenido.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
