"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { SIDEBAR_FOCUS_CLASS } from "./primitives";
import { useSidebar } from "./sidebarContext";
import { ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react";

export interface SidebarHeaderProps {
  /** Marca del proyecto. Se oculta al colapsar para dejar sitio al botón. */
  logo?: ReactNode;
  className?: string;
  collapseLabel?: string;
  expandLabel?: string;
}

/**
 * Icono de panel lateral: un marco con la columna del sidebar marcada. Sustituye
 * al chevron doble, que a 16px se leía como un «avance rápido» de reproductor y
 * no como «esto pliega un panel».
 *
 * El relleno de la columna es el que comunica el estado —sólida cuando el panel
 * está abierto, vacía cuando está plegado—, así que el icono no necesita girar
 * ni cambiar de forma entre estados.
 */
function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return <ArrowLeftFromLine className="rotate-180" />;
  }
  return <ArrowRightFromLine />;
}

/**
 * Cabecera: marca + botón de colapso. El logo entra como slot para que la
 * librería no conozca el sistema de assets de cada proyecto.
 *
 * El alto es fijo y el aire lo pone el padding horizontal; antes convivían un
 * `h-4rem` y un `py-6` que pedían 3rem de padding vertical dentro de esos 4rem,
 * así que el segundo no llegaba a aplicarse nunca.
 */
export function SidebarHeader({
  logo,
  className,
  collapseLabel = "Colapsar menú",
  expandLabel = "Expandir menú",
}: SidebarHeaderProps) {
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-2 px-2.5",
        className,
      )}
    >
      {!isCollapsed && <div className="min-w-0 flex-1">{logo}</div>}
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={isCollapsed ? expandLabel : collapseLabel}
        aria-expanded={!isCollapsed}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--sb-radius,0.5rem)] text-[color:var(--sb-fg-subtle)] transition-colors duration-[var(--sb-duration-fast,130ms)] hover:bg-[var(--sb-hover)] hover:text-[color:var(--sb-fg)]",
          SIDEBAR_FOCUS_CLASS,
          isCollapsed && "mx-auto",
        )}
      >
        <CollapseIcon collapsed={isCollapsed} />
      </button>
    </div>
  );
}
