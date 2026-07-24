import {
  Activity,
  Armchair,
  Compass,
  Crown,
  Droplet,
  Dumbbell,
  Eye,
  Footprints,
  Heart,
  Map,
  Minus,
  Moon,
  MoveHorizontal,
  MoveVertical,
  RotateCw,
  Shield,
  Sparkles,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { QuestCategory } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  armchair: Armchair,
  compass: Compass,
  crown: Crown,
  droplet: Droplet,
  dumbbell: Dumbbell,
  eye: Eye,
  footprints: Footprints,
  heart: Heart,
  map: Map,
  minus: Minus,
  moon: Moon,
  "move-horizontal": MoveHorizontal,
  "move-vertical": MoveVertical,
  "rotate-cw": RotateCw,
  shield: Shield,
  sparkles: Sparkles,
  wind: Wind,
};

/** Resolve an icon key to a Lucide component, falling back to Activity. */
export function iconFor(key: string): LucideIcon {
  return ICONS[key] ?? Activity;
}

const CATEGORY_ICON: Record<QuestCategory, LucideIcon> = {
  mobility: Activity,
  walking: Footprints,
  hydration: Droplet,
  strength: Dumbbell,
  posture: Shield,
  "eye-care": Eye,
  breathing: Wind,
  sleep: Moon,
};

export function categoryIcon(category: QuestCategory): LucideIcon {
  return CATEGORY_ICON[category];
}

export const CATEGORY_LABEL: Record<QuestCategory, string> = {
  mobility: "Mobility",
  walking: "Walking",
  hydration: "Hydration",
  strength: "Strength",
  posture: "Posture",
  "eye-care": "Eye care",
  breathing: "Breathing",
  sleep: "Sleep",
};
