export type EasingFn = (t: number) => number;

/** Easing por defecto: arranque y frenado suaves (cubic in-out). */
export const easeInOutCubic: EasingFn = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface SmoothScrollOptions {
	/** Duración de la animación en ms. <= 0 salta directo al destino. */
	duration?: number;
	easing?: EasingFn;
}

/**
 * Equivalente en JS a `scroll-behavior: smooth` para el scroll vertical
 * programático de un elemento. Anima `scrollTop` con requestAnimationFrame +
 * easing en lugar de depender de la API nativa (que no es consistente en todos
 * los navegadores ni aplica al wheel).
 *
 * Precondición: `element` es un contenedor con scroll vertical.
 * Postcondición: al finalizar, `element.scrollTop === clamp(target, 0, maxTop)`.
 *
 * @returns función para cancelar la animación en curso (idempotente).
 */
export function smoothScrollTo(element: HTMLElement, target: number, { duration = 350, easing = easeInOutCubic }: SmoothScrollOptions = {}): () => void {
	const maxTop = element.scrollHeight - element.clientHeight;
	const to = Math.max(0, Math.min(target, maxTop));
	const from = element.scrollTop;
	const distance = to - from;

	if (Math.abs(distance) < 1 || duration <= 0) {
		element.scrollTop = to;
		return () => {};
	}

	let rafId = 0;
	let startTime: number | null = null;
	let cancelled = false;

	const step = (now: number) => {
		if (cancelled) return;
		if (startTime === null) startTime = now;
		const progress = Math.min((now - startTime) / duration, 1);
		element.scrollTop = from + distance * easing(progress);
		if (progress < 1) rafId = requestAnimationFrame(step);
	};

	rafId = requestAnimationFrame(step);

	return () => {
		cancelled = true;
		cancelAnimationFrame(rafId);
	};
}
