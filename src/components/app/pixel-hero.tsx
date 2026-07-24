"use client";

import { motion } from "framer-motion";
import { composeHeroSprite, HERO_COLORS, HERO_GRID_H, HERO_GRID_W } from "@/lib/pixel-hero";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface PixelHeroProps {
  level: number;
  size?: number;
  className?: string;
}

/** A small, code-drawn pixel-art hero that gains visible gear as the player levels up. */
export function PixelHero({ level, size = 72, className }: PixelHeroProps) {
  const { state } = useStore();
  const reduced = state.settings.reducedMotion;
  const rows = composeHeroSprite(level);
  const glowing = level >= 6;

  return (
    <motion.div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-visible rounded-2xl bg-primary-soft/60",
        className,
      )}
      style={{ width: size, height: size }}
      animate={reduced ? undefined : { y: [0, -3, 0] }}
      transition={reduced ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      {glowing && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-2xl bg-accent/30 blur-md",
            !reduced && "animate-pulse",
          )}
        />
      )}
      <svg
        viewBox={`0 0 ${HERO_GRID_W} ${HERO_GRID_H}`}
        width={size * 0.72}
        height={size * 0.72}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`Hero avatar, level ${level}`}
        className="relative"
      >
        {rows.map((row, r) =>
          row
            .split("")
            .map((ch, c) =>
              ch === "." ? null : (
                <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={HERO_COLORS[ch]} />
              ),
            ),
        )}
      </svg>
    </motion.div>
  );
}
