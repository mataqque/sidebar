'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '../lib/cn';
import { smoothScrollTo } from '../lib/smoothScroll';

export interface SidebarScrollProps {
	children: ReactNode;
	className?: string;
	/** Ancho del thumb en px. */
	thumbWidth?: number;
	thumbClassName?: string;
	trackClassName?: string;
	/** Margen derecho del scrollbar respecto al contenedor. */
	offsetRight?: number;
	/** Margen vertical del scrollbar. */
	offsetY?: number;
	/** Scroll suave en JS para el wheel y los saltos del track. */
	smooth?: boolean;
	smoothDuration?: number;
	contentClassName?: string;
}

/**
 * Curva del scroll por rueda: arranque inmediato y frenado largo (cubic out).
 *
 * La rueda es un gesto directo —el usuario ya ha empujado—, así que el
 * movimiento tiene que empezar en el primer frame y lo único que queda por
 * suavizar es la llegada. El `easeInOutCubic` que trae `smoothScrollTo` por
 * defecto dejaba el contenido quieto los primeros ~80ms, y esa pausa se percibe
 * como que la interfaz no responde. Ese default se queda para los saltos
 * programáticos, que sí quieren arrancar suave.
 *
 * Vive aquí y no en `smoothScroll.ts` porque es una decisión de esta interacción
 * concreta, no una utilidad general.
 */
const wheelEasing = (t: number) => 1 - Math.pow(1 - t, 3);

/** Alto mínimo del thumb para que siga siendo agarrable en listas muy largas. */
const MIN_THUMB_HEIGHT = 30;

/** Medidas del contenedor. Solo cambian al redimensionar o al cambiar el contenido. */
interface ScrollMetrics {
	scrollHeight: number;
	clientHeight: number;
	maxScroll: number;
	thumbHeight: number;
	maxThumbTop: number;
}

const EMPTY_METRICS: ScrollMetrics = { scrollHeight: 0, clientHeight: 0, maxScroll: 0, thumbHeight: 0, maxThumbTop: 0 };

/**
 * Contenedor con scrollbar propio, tematizado por tokens. Se incluye en la
 * librería porque el sidebar depende de él y arrastrarlo desde la app rompería la
 * autonomía del paquete.
 *
 * **La posición del thumb no pasa por el estado de React.** Antes cada evento de
 * scroll hacía `setState`, así que el thumb solo se movía cuando terminaba el
 * ciclo de render: medido, iba entre 3 y 4px por detrás del contenido en 52 de
 * cada 70 frames, y eso es exactamente lo que se ve como retraso. Ahora el
 * handler escribe el `transform` directamente sobre el nodo, dentro del mismo
 * frame en que llega el evento, así que el thumb y el contenido pintan juntos.
 *
 * El resto de la técnica va en la misma dirección: las medidas del contenedor se
 * cachean y solo se recalculan al redimensionar o mutar el contenido, de modo que
 * el camino de scroll lee únicamente `scrollTop`; y el movimiento va por
 * `transform` en vez de `top`, que dispararía layout en cada frame.
 */
export function SidebarScroll({
	children,
	className,
	thumbWidth = 6,
	thumbClassName,
	trackClassName,
	offsetRight = 4,
	offsetY = 4,
	smooth = true,
	smoothDuration = 350,
	contentClassName,
}: SidebarScrollProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const thumbRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const metricsRef = useRef<ScrollMetrics>(EMPTY_METRICS);

	// Scroll suave: destino acumulado del wheel + cancelador del rAF en curso.
	const wheelTargetRef = useRef<number | null>(null);
	const cancelAnimRef = useRef<(() => void) | null>(null);
	const dragStartRef = useRef<{ startY: number; startScrollTop: number } | null>(null);

	const [isScrollable, setIsScrollable] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	const stopSmoothScroll = useCallback(() => {
		cancelAnimRef.current?.();
		cancelAnimRef.current = null;
		wheelTargetRef.current = null;
	}, []);

	/**
	 * Mueve el thumb a la posición que le toca. Solo lee `scrollTop` —el resto sale
	 * de la caché— y solo escribe `transform`, así que no invalida el layout ni
	 * fuerza un reflow en el siguiente evento.
	 */
	const syncThumbPosition = useCallback(() => {
		const container = containerRef.current;
		const thumb = thumbRef.current;
		const { maxScroll, maxThumbTop } = metricsRef.current;
		if (!container || !thumb || maxScroll <= 0) return;
		const top = (container.scrollTop / maxScroll) * maxThumbTop;
		thumb.style.transform = `translate3d(-50%, ${top}px, 0)`;
	}, []);

	/** Recalcula las medidas. Caro: solo en resize y en cambios de contenido. */
	const measure = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const { scrollHeight, clientHeight } = container;
		const scrollable = scrollHeight > clientHeight + 1;
		setIsScrollable(previous => (previous === scrollable ? previous : scrollable));
		if (!scrollable) {
			metricsRef.current = EMPTY_METRICS;
			return;
		}

		const trackHeight = clientHeight - offsetY * 2;
		const thumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, MIN_THUMB_HEIGHT);
		metricsRef.current = {
			scrollHeight,
			clientHeight,
			maxScroll: scrollHeight - clientHeight,
			thumbHeight,
			maxThumbTop: trackHeight - thumbHeight,
		};

		const thumb = thumbRef.current;
		if (thumb) thumb.style.height = `${thumbHeight}px`;
		syncThumbPosition();
	}, [offsetY, syncThumbPosition]);

	// El thumb se monta con el `isScrollable` ya resuelto, así que las medidas y la
	// posición inicial se aplican antes del primer paint: sin salto visible.
	useLayoutEffect(() => {
		measure();
	}, [measure, isScrollable]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		container.addEventListener('scroll', syncThumbPosition, { passive: true });
		return () => container.removeEventListener('scroll', syncThumbPosition);
	}, [syncThumbPosition]);

	// Wheel con easing en JS. En los extremos no se hace `preventDefault` para que
	// el scroll siga propagando al contenedor padre.
	useEffect(() => {
		const container = containerRef.current;
		if (!container || !smooth) return;

		const handleWheel = (event: WheelEvent) => {
			if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
			const maxTop = container.scrollHeight - container.clientHeight;
			if (maxTop <= 0) return;

			const base = wheelTargetRef.current ?? container.scrollTop;
			const next = Math.max(0, Math.min(base + event.deltaY, maxTop));
			if (next === base && (next === 0 || next === maxTop)) return;

			event.preventDefault();
			wheelTargetRef.current = next;
			cancelAnimRef.current?.();
			// Ease-out: la rueda es un gesto directo y tiene que responder en el primer
			// frame. El in-out por defecto se reserva para saltos programáticos.
			cancelAnimRef.current = smoothScrollTo(container, next, { duration: smoothDuration, easing: wheelEasing });
		};

		container.addEventListener('wheel', handleWheel, { passive: false });
		return () => {
			container.removeEventListener('wheel', handleWheel);
			stopSmoothScroll();
		};
	}, [smooth, smoothDuration, stopSmoothScroll]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const resizeObserver = new ResizeObserver(measure);
		const mutationObserver = new MutationObserver(measure);
		resizeObserver.observe(container);
		mutationObserver.observe(container, { childList: true, subtree: true });
		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, [measure]);

	const handleThumbMouseDown = useCallback(
		(event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			const container = containerRef.current;
			if (!container) return;
			// El arrastre sigue al cursor 1:1: corta cualquier animación suave en curso.
			stopSmoothScroll();
			setIsDragging(true);
			dragStartRef.current = { startY: event.clientY, startScrollTop: container.scrollTop };
		},
		[stopSmoothScroll]
	);

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (event: MouseEvent) => {
			const container = containerRef.current;
			const dragStart = dragStartRef.current;
			const { maxScroll, maxThumbTop } = metricsRef.current;
			if (!container || !dragStart || maxThumbTop <= 0) return;
			container.scrollTop = dragStart.startScrollTop + ((event.clientY - dragStart.startY) / maxThumbTop) * maxScroll;
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			dragStartRef.current = null;
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDragging]);

	const handleTrackClick = useCallback(
		(event: React.MouseEvent) => {
			const container = containerRef.current;
			const track = trackRef.current;
			if (!container || !track || event.target === thumbRef.current) return;

			const trackRect = track.getBoundingClientRect();
			const ratio = (event.clientY - trackRect.top) / trackRect.height;
			const target = ratio * metricsRef.current.maxScroll;

			stopSmoothScroll();
			if (smooth) cancelAnimRef.current = smoothScrollTo(container, target, { duration: smoothDuration });
			else container.scrollTop = target;
		},
		[smooth, smoothDuration, stopSmoothScroll]
	);

	return (
		// El wrapper no scrollea: solo posiciona el track. Con `overflow-y-auto` aquí
		// había un segundo contenedor con scroll, y ese sí enseñaba la barra nativa
		// del navegador junto a la propia.
		<div className={cn('group/scroll relative z-10 overflow-hidden', className)}>
			<div ref={containerRef} className={cn('h-full w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', contentClassName)}>
				{children}
			</div>

			{isScrollable && (
				<div
					ref={trackRef}
					className={cn('absolute right-0 top-0 z-50 opacity-90 transition-opacity duration-[var(--sb-duration-fast,130ms)] group-hover/scroll:opacity-100', trackClassName)}
					style={{ width: thumbWidth, top: offsetY, bottom: offsetY, right: offsetRight }}
					onClick={handleTrackClick}
				>
					<div className={cn('absolute inset-0 rounded-full bg-[var(--sb-scroll-track)] transition-opacity duration-100', isDragging ? 'opacity-100' : 'opacity-20')} />
					<div
						ref={thumbRef}
						className={cn(
							'absolute left-1/2 top-0 cursor-grab rounded-full transition-[width,background-color] duration-100 active:cursor-grabbing',
							isDragging ? 'bg-[var(--sb-scroll-thumb-active)]' : 'bg-[var(--sb-scroll-thumb)]',
							thumbClassName
						)}
						// `height` y `transform` los escribe `measure`/`syncThumbPosition`
						// directamente sobre el nodo: no vuelven a pasar por React.
						style={{ width: isDragging ? thumbWidth + 2 : thumbWidth }}
						onMouseDown={handleThumbMouseDown}
					/>
				</div>
			)}
		</div>
	);
}
