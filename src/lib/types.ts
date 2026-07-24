// ---------------------------------------------------------------------------
// Domain types for DeskHero
// ---------------------------------------------------------------------------

export type ActivityLevel = "inactive" | "light" | "moderate";

export type Goal =
  | "energy"
  | "posture"
  | "strength"
  | "flexibility"
  | "sleep"
  | "general";

export type SessionDuration = 5 | 10 | 15 | 20;

export type ActivityPreference =
  | "walking"
  | "stretching"
  | "strength"
  | "breathing"
  | "mixed";

export type ReminderPreference = "work" | "morning" | "evening" | "none";

export type QuestCategory =
  | "mobility"
  | "walking"
  | "hydration"
  | "strength"
  | "posture"
  | "eye-care"
  | "breathing"
  | "sleep";

export type Difficulty = "easy" | "moderate" | "challenging";

export type Position = "standing" | "seated" | "either";

/** A single exercise inside a guided workout. */
export interface WorkoutStep {
  name: string;
  /** Seconds for timed steps. Omit when the step is rep-based. */
  seconds?: number;
  /** Repetitions for count-based steps. Omit when the step is timed. */
  reps?: number;
  instruction: string;
  easier: string;
  /** Lucide-style icon key resolved in the UI. */
  icon: string;
}

/** A quest is a completable wellness action. */
export interface Quest {
  id: string;
  title: string;
  category: QuestCategory;
  difficulty: Difficulty;
  /** Estimated minutes to complete. Hydration/eye breaks may be 1. */
  minutes: number;
  xp: number;
  position: Position;
  equipmentFree: boolean;
  summary: string;
  instructions: string[];
  safety: string;
  easierAlternative: string;
  /** Present when the quest launches the guided workout flow. */
  workout?: WorkoutStep[];
  /** Seconds for a simple single-timer quest (walks, breathing, etc.). */
  timerSeconds?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** How many units are needed to unlock. */
  target: number;
  /** How the app measures progress toward this badge. */
  metric:
    | "questsCompleted"
    | "hydrationCompleted"
    | "walksCompleted"
    | "postureCompleted"
    | "workoutsCompleted"
    | "mobilityCompleted"
    | "bestStreak"
    | "daysActive";
}

export interface LevelDef {
  level: number;
  name: string;
  /** Total XP required to reach this level. */
  minXp: number;
}

export interface UserProfile {
  name: string;
  hoursSitting: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  sessionDuration: SessionDuration;
  activityPreference: ActivityPreference;
  reminderPreference: ReminderPreference;
}

export interface Settings {
  sound: boolean;
  reducedMotion: boolean;
  theme: "dark" | "light";
}

/** Aggregate lifetime counters used for stats and achievements. */
export interface Stats {
  movementBreaks: number;
  workoutsCompleted: number;
  walksCompleted: number;
  hydrationCompleted: number;
  postureCompleted: number;
  mobilityCompleted: number;
  questsCompleted: number;
  bestStreak: number;
}

/** Per-day record of activity (used for the weekly chart + streaks). */
export interface DayRecord {
  /** ISO day key, YYYY-MM-DD */
  date: string;
  /** Quest ids completed on this day. */
  completedQuestIds: string[];
  xpEarned: number;
  /** Number of quests assigned that day (for the daily health score). */
  assigned: number;
}

export interface XpEvent {
  id: string;
  label: string;
  xp: number;
  at: number; // timestamp
}

export interface AppState {
  onboarded: boolean;
  profile: UserProfile | null;
  settings: Settings;
  xp: number;
  streak: number;
  bestStreak: number;
  streakFreezeAvailable: boolean;
  lastActiveDay: string | null;
  /** Ids of today's assigned quests. */
  todayQuestIds: string[];
  /** The day todayQuestIds was generated for. */
  todayDate: string;
  stats: Stats;
  history: DayRecord[];
  xpLog: XpEvent[];
  unlockedAchievements: string[];
  /** Whether the all-daily-quests bonus was already awarded today. */
  dailyBonusAwarded: boolean;
}
