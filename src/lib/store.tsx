"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ACHIEVEMENTS,
  DEMO_PROFILE,
  QUESTS,
  SEED_XP,
  XP,
  buildSeedHistory,
  getQuestById,
} from "./data";
import {
  applyStatDelta,
  assignDailyQuests,
  computeUnlocked,
} from "./logic";
import type { AppState, Settings, Stats, UserProfile } from "./types";
import { todayKey } from "./utils";

const STORAGE_KEY = "deskhero.state.v1";

const emptyStats: Stats = {
  movementBreaks: 0,
  workoutsCompleted: 0,
  walksCompleted: 0,
  hydrationCompleted: 0,
  postureCompleted: 0,
  mobilityCompleted: 0,
  questsCompleted: 0,
  bestStreak: 0,
};

const defaultSettings: Settings = { sound: true, reducedMotion: false, theme: "dark" };

function makeInitialState(): AppState {
  return {
    onboarded: false,
    profile: null,
    settings: defaultSettings,
    xp: 0,
    streak: 0,
    bestStreak: 0,
    streakFreezeAvailable: true,
    lastActiveDay: null,
    todayQuestIds: [],
    todayDate: todayKey(),
    stats: { ...emptyStats },
    history: [],
    xpLog: [],
    unlockedAchievements: [],
    dailyBonusAwarded: false,
  };
}

/** A last-completed toast payload the UI can react to. */
export interface Celebration {
  id: number;
  message: string;
  xp: number;
}

interface StoreValue {
  state: AppState;
  ready: boolean;
  celebration: Celebration | null;
  clearCelebration: () => void;
  // actions
  completeOnboarding: (profile: UserProfile) => void;
  loadDemo: () => void;
  resetDemo: () => void;
  completeQuest: (questId: string) => void;
  awardXp: (label: string, xp: number) => void;
  setXp: (xp: number) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  useStreakFreeze: () => void;
  regenerateToday: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Roll the day forward: refresh today's quests + resolve streak on a new day. */
function rollForward(state: AppState): AppState {
  const today = todayKey();
  if (state.todayDate === today) return state;
  if (!state.profile) return { ...state, todayDate: today };

  // Archive the day that just ended into history (if not already there).
  const prevDate = state.todayDate;
  const completedToday = state.todayQuestIds.filter((id) =>
    state.history.find((h) => h.date === prevDate)?.completedQuestIds.includes(id),
  );

  const history = [...state.history];
  const existing = history.find((h) => h.date === prevDate);
  if (!existing) {
    // No record yet — nothing was completed that day.
    history.push({
      date: prevDate,
      completedQuestIds: [],
      xpEarned: 0,
      assigned: state.todayQuestIds.length,
    });
  }

  const newQuests = assignDailyQuests(state.profile);
  return {
    ...state,
    todayDate: today,
    todayQuestIds: newQuests,
    dailyBonusAwarded: false,
    history: history.slice(-60),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(makeInitialState);
  const [ready, setReady] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const celebrationId = useRef(0);

  // Load from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        setState(rollForward({ ...makeInitialState(), ...parsed }));
      }
    } catch {
      // Corrupt or unavailable storage — fall back to a clean state.
    }
    setReady(true);
  }, []);

  // Persist on every change (after ready to avoid clobbering during load).
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota / privacy-mode errors — the prototype still works in-memory.
    }
  }, [state, ready]);

  // Reflect the reduced-motion setting on <html> for global CSS.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle(
      "reduce-motion",
      state.settings.reducedMotion,
    );
  }, [state.settings.reducedMotion]);

  // Reflect the appearance setting on <html>. Dark is the default (:root); "light" opts in.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle(
      "light",
      state.settings.theme === "light",
    );
  }, [state.settings.theme]);

  const fireCelebration = useCallback((message: string, xp: number) => {
    celebrationId.current += 1;
    setCelebration({ id: celebrationId.current, message, xp });
  }, []);

  const clearCelebration = useCallback(() => setCelebration(null), []);

  const completeOnboarding = useCallback((profile: UserProfile) => {
    setState((prev) => ({
      ...prev,
      onboarded: true,
      profile,
      todayDate: todayKey(),
      todayQuestIds: assignDailyQuests(profile),
      dailyBonusAwarded: false,
    }));
  }, []);

  const loadDemo = useCallback(() => {
    const base = makeInitialState();
    const profile = DEMO_PROFILE;
    const history = buildSeedHistory();
    const stats: Stats = {
      movementBreaks: 18,
      workoutsCompleted: 6,
      walksCompleted: 7,
      hydrationCompleted: 12,
      postureCompleted: 9,
      mobilityCompleted: 5,
      questsCompleted: 22,
      bestStreak: 6,
    };
    const seeded: AppState = {
      ...base,
      onboarded: true,
      profile,
      xp: SEED_XP,
      streak: 3,
      bestStreak: 6,
      streakFreezeAvailable: true,
      lastActiveDay: history[history.length - 1]?.date ?? null,
      todayDate: todayKey(),
      todayQuestIds: assignDailyQuests(profile),
      dailyBonusAwarded: false,
      stats,
      history,
    };
    seeded.unlockedAchievements = computeUnlocked(seeded);
    setState(seeded);
  }, []);

  const resetDemo = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setState(makeInitialState());
  }, []);

  const awardXp = useCallback(
    (label: string, xp: number) => {
      setState((prev) => {
        const xpLog = [
          { id: `${Date.now()}-${Math.random()}`, label, xp, at: Date.now() },
          ...prev.xpLog,
        ].slice(0, 40);
        return { ...prev, xp: prev.xp + xp, xpLog };
      });
      fireCelebration(label, xp);
    },
    [fireCelebration],
  );

  const completeQuest = useCallback(
    (questId: string) => {
      const quest = getQuestById(questId);
      if (!quest) return;

      setState((prev) => {
        const today = todayKey();
        const record =
          prev.history.find((h) => h.date === today) ??
          ({ date: today, completedQuestIds: [], xpEarned: 0, assigned: prev.todayQuestIds.length });

        // Prevent awarding XP for the same quest twice in one day.
        if (record.completedQuestIds.includes(questId)) {
          return prev;
        }

        const updatedRecord = {
          ...record,
          completedQuestIds: [...record.completedQuestIds, questId],
          xpEarned: record.xpEarned + quest.xp,
          assigned: prev.todayQuestIds.length || record.assigned,
        };
        const history = [
          ...prev.history.filter((h) => h.date !== today),
          updatedRecord,
        ];

        // Streak: increment when this is the first completion of a new day.
        let streak = prev.streak;
        let bestStreak = prev.bestStreak;
        let lastActiveDay = prev.lastActiveDay;
        if (record.completedQuestIds.length === 0) {
          streak = prev.lastActiveDay === today ? prev.streak : prev.streak + 1;
          lastActiveDay = today;
          bestStreak = Math.max(bestStreak, streak);
        }

        const stats = applyStatDelta(prev.stats, quest);
        stats.bestStreak = Math.max(stats.bestStreak, bestStreak);

        // XP log entry.
        const xpLog = [
          {
            id: `${Date.now()}-${Math.random()}`,
            label: quest.title,
            xp: quest.xp,
            at: Date.now(),
          },
          ...prev.xpLog,
        ].slice(0, 40);

        let xp = prev.xp + quest.xp;
        let dailyBonusAwarded = prev.dailyBonusAwarded;

        // Daily completion bonus.
        const allDone =
          prev.todayQuestIds.length > 0 &&
          prev.todayQuestIds.every((id) =>
            updatedRecord.completedQuestIds.includes(id),
          );
        if (allDone && !dailyBonusAwarded) {
          xp += XP.dailyBonus;
          dailyBonusAwarded = true;
          xpLog.unshift({
            id: `${Date.now()}-bonus`,
            label: "All daily quests complete!",
            xp: XP.dailyBonus,
            at: Date.now(),
          });
        }

        const nextState: AppState = {
          ...prev,
          xp,
          streak,
          bestStreak,
          lastActiveDay,
          stats,
          history,
          xpLog,
          dailyBonusAwarded,
        };
        nextState.unlockedAchievements = computeUnlocked(nextState);
        return nextState;
      });

      fireCelebration(quest.title, quest.xp);
    },
    [fireCelebration],
  );

  /** Dev/testing helper: jump straight to an XP total (e.g. to preview a level's hero gear). */
  const setXp = useCallback((xp: number) => {
    setState((prev) => ({ ...prev, xp: Math.max(0, Math.round(xp)) }));
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...partial } }));
  }, []);

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setState((prev) =>
      prev.profile
        ? { ...prev, profile: { ...prev.profile, ...partial } }
        : prev,
    );
  }, []);

  const useStreakFreeze = useCallback(() => {
    setState((prev) =>
      prev.streakFreezeAvailable
        ? { ...prev, streakFreezeAvailable: false }
        : prev,
    );
  }, []);

  const regenerateToday = useCallback(() => {
    setState((prev) =>
      prev.profile
        ? { ...prev, todayQuestIds: assignDailyQuests(prev.profile) }
        : prev,
    );
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      ready,
      celebration,
      clearCelebration,
      completeOnboarding,
      loadDemo,
      resetDemo,
      completeQuest,
      awardXp,
      setXp,
      updateSettings,
      updateProfile,
      useStreakFreeze,
      regenerateToday,
    }),
    [
      state,
      ready,
      celebration,
      clearCelebration,
      completeOnboarding,
      loadDemo,
      resetDemo,
      completeQuest,
      awardXp,
      setXp,
      updateSettings,
      updateProfile,
      useStreakFreeze,
      regenerateToday,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}

/** Convenience: today's completed quest ids. */
export function useTodayCompleted(): string[] {
  const { state } = useStore();
  const today = todayKey();
  return (
    state.history.find((h) => h.date === today)?.completedQuestIds ?? []
  );
}

export { QUESTS, ACHIEVEMENTS };
