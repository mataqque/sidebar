import { cn } from '../lib/cn';
import type { MenuBadge as MenuBadgeModel } from '../menu/types';

const badgeVariants: Record<MenuBadgeModel['variant'], string> = {
	primary: 'bg-[var(--sb-badge-primary)]',
	danger: 'bg-[var(--sb-badge-danger)]',
	success: 'bg-[var(--sb-badge-success)]',
	warning: 'bg-[var(--sb-badge-warning)]',
	neutral: 'bg-[var(--sb-badge-neutral)]',
};

/**
 * Contador o etiqueta al final de una fila. `tabular-nums` mantiene el ancho
 * estable mientras el número cambia, y el mínimo es de un dígito: a `2rem` un
 * "3" quedaba flotando en el centro de una píldora vacía.
 */
export function SidebarBadge({ badge, className }: { badge: MenuBadgeModel; className?: string }) {
	return (
		<span
			className={cn(
				'flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums leading-none text-[color:var(--sb-badge-fg)]',
				badgeVariants[badge.variant],
				className
			)}
		>
			{badge.text}
		</span>
	);
}
