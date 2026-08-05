import { cn } from '../lib/cn';
import type { MenuBadge as MenuBadgeModel } from '../menu/types';

const badgeVariants: Record<MenuBadgeModel['variant'], string> = {
	primary: 'bg-[var(--sb-badge-primary)]',
	danger: 'bg-[var(--sb-badge-danger)]',
	success: 'bg-[var(--sb-badge-success)]',
	warning: 'bg-[var(--sb-badge-warning)]',
	neutral: 'bg-[var(--sb-badge-neutral)]',
};

export function SidebarBadge({ badge, className }: { badge: MenuBadgeModel; className?: string }) {
	return (
		<span className={cn('flex min-w-[2rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium text-[color:var(--sb-badge-fg)]', badgeVariants[badge.variant], className)}>
			{badge.text}
		</span>
	);
}
