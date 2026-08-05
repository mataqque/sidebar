'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

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

/** Alto mínimo del thumb para que siga siendo agarrable en listas muy largas. */
const MIN_THUMB_HEIGHT = 30;

/**
 * Contenedor con scrollbar propio, tematizado por tokens. Se incluye en la
 * librería porque el sidebar depende de él y arrastrarlo desde la app rompería la
 * autonomía del paquete.
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

	// Scroll suave: destino acumulado del wheel + cancelador del rAF en curso.
	const wheelTargetRef = useRef<number | null>(null);
	const cancelAnimRef = useRef<(() => void) | null>(null);
	const dragStartRef = useRef<{ startY: number; startScrollTop: number } | null>(null);

	const [thumbHeight, setThumbHeight] = useState(0);
	const [thumbTop, setThumbTop] = useState(0);
	const [isScrollable, setIsScrollable] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	const stopSmoothScroll = useCallback(() => {
		cancelAnimRef.current?.();
		cancelAnimRef.current = null;
		wheelTargetRef.current = null;
	}, []);

	const updateThumb = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const { scrollHeight, clientHeight, scrollTop } = container;
		if (scrollHeight <= clientHeight) {
			setIsScrollable(false);
			return;
		}
		setIsScrollable(true);

		const trackHeight = clientHeight - offsetY * 2;
		const nextThumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, MIN_THUMB_HEIGHT);
		setThumbHeight(nextThumbHeight);
		setThumbTop((scrollTop / (scrollHeight - clientHeight)) * (trackHeight - nextThumbHeight));
	}, [offsetY]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		container.addEventListener('scroll', updateThumb, { passive: true });
		return () => container.removeEventListener('scroll', updateThumb);
	}, [updateThumb]);

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
			cancelAnimRef.current = smoothScrollTo(container, next, { duration: smoothDuration });
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
		const resizeObserver = new ResizeObserver(updateThumb);
		const mutationObserver = new MutationObserver(updateThumb);
		resizeObserver.observe(container);
		mutationObserver.observe(container, { childList: true, subtree: true });
		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, [updateThumb]);

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
			if (!container || !dragStart) return;

			const { scrollHeight, clientHeight } = container;
			const trackHeight = clientHeight - offsetY * 2;
			const currentThumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, MIN_THUMB_HEIGHT);
			const scrollableTrack = trackHeight - currentThumbHeight;
			if (scrollableTrack <= 0) return;

			const delta = ((event.clientY - dragStart.startY) / scrollableTrack) * (scrollHeight - clientHeight);
			container.scrollTop = dragStart.startScrollTop + delta;
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
	}, [isDragging, offsetY]);

	const handleTrackClick = useCallback(
		(event: React.MouseEvent) => {
			const container = containerRef.current;
			const track = trackRef.current;
			if (!container || !track || event.target === thumbRef.current) return;

			const trackRect = track.getBoundingClientRect();
			const ratio = (event.clientY - trackRect.top) / trackRect.height;
			const target = ratio * (container.scrollHeight - container.clientHeight);

			stopSmoothScroll();
			if (smooth) cancelAnimRef.current = smoothScrollTo(container, target, { duration: smoothDuration });
			else container.scrollTop = target;
		},
		[smooth, smoothDuration, stopSmoothScroll]
	);

	return (
		<div className={cn('group/scroll relative z-10 overflow-y-auto overflow-x-hidden', className)}>
			<div ref={containerRef} className={cn('h-full w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', contentClassName)}>
				{children}
			</div>

			{isScrollable && (
				<div
					ref={trackRef}
					className={cn('absolute right-0 top-0 z-50 opacity-30 transition-opacity duration-100 group-hover/scroll:opacity-100', trackClassName)}
					style={{ width: thumbWidth, top: offsetY, bottom: offsetY, right: offsetRight }}
					onClick={handleTrackClick}
				>
					<div className={cn('absolute inset-0 rounded-full bg-[var(--sb-scroll-track)] transition-opacity duration-100', isDragging ? 'opacity-100' : 'opacity-20')} />
					<div
						ref={thumbRef}
						className={cn('absolute cursor-grab rounded-full transition-[width] duration-100 active:cursor-grabbing', isDragging ? 'bg-[var(--sb-scroll-thumb-active)]' : 'bg-[var(--sb-scroll-thumb)]', thumbClassName)}
						style={{ height: thumbHeight, top: thumbTop, width: isDragging ? thumbWidth + 2 : thumbWidth, left: '50%', transform: 'translateX(-50%)' }}
						onMouseDown={handleThumbMouseDown}
					/>
				</div>
			)}
		</div>
	);
}
