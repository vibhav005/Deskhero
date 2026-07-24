import {
  Award,
  Dumbbell,
  Home,
  LineChart,
  Timer,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the compact bottom bar. */
  primary: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, primary: true },
  { href: "/quests", label: "Quests", icon: Dumbbell, primary: true },
  { href: "/work-mode", label: "Work Mode", icon: Timer, primary: true },
  { href: "/progress", label: "Progress", icon: LineChart, primary: true },
  { href: "/achievements", label: "Badges", icon: Award, primary: false },
  { href: "/profile", label: "Profile", icon: User, primary: true },
];
