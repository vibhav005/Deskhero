import type {
  Achievement,
  DayRecord,
  LevelDef,
  Quest,
  UserProfile,
  WorkoutStep,
} from "./types";
import { todayKey } from "./utils";

// ---------------------------------------------------------------------------
// XP values (from the product spec)
// ---------------------------------------------------------------------------
export const XP = {
  hydration: 5,
  eyeBreak: 5,
  posture: 10,
  movement2: 10,
  mobility5: 20,
  walk10: 25,
  workout15: 40,
  dailyBonus: 50,
} as const;

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------
export const LEVELS: LevelDef[] = [
  { level: 1, name: "Desk Survivor", minXp: 0 },
  { level: 2, name: "Movement Rookie", minXp: 120 },
  { level: 3, name: "Posture Protector", minXp: 300 },
  { level: 4, name: "Mobility Warrior", minXp: 560 },
  { level: 5, name: "Strength Builder", minXp: 900 },
  { level: 6, name: "Energy Master", minXp: 1350 },
  { level: 7, name: "Desk Hero", minXp: 1900 },
];

// ---------------------------------------------------------------------------
// Guided workout routines
// ---------------------------------------------------------------------------
const fiveMinuteRoutine: WorkoutStep[] = [
  {
    name: "March in place",
    seconds: 60,
    instruction: "Lift your knees at a comfortable pace and let your arms swing.",
    easier: "March gently while seated, lifting one foot at a time.",
    icon: "footprints",
  },
  {
    name: "Shoulder rolls",
    seconds: 30,
    instruction: "Roll your shoulders backward in slow, full circles.",
    easier: "Make the circles smaller and slower.",
    icon: "rotate-cw",
  },
  {
    name: "Chair squats",
    reps: 10,
    instruction: "Stand up from a chair and sit back down with control.",
    easier: "Use your hands on the armrests for support.",
    icon: "armchair",
  },
  {
    name: "Wall push-ups",
    reps: 10,
    instruction: "Hands on a wall, bend your elbows, then press back.",
    easier: "Stand closer to the wall to reduce the effort.",
    icon: "move-horizontal",
  },
  {
    name: "Standing side bends",
    seconds: 30,
    instruction: "Reach one arm overhead and lean gently to the side.",
    easier: "Keep the reach small and stay seated if you prefer.",
    icon: "move-vertical",
  },
  {
    name: "Chest & neck stretch",
    seconds: 60,
    instruction: "Open your chest, then slowly tilt your head side to side.",
    easier: "Hold each stretch lightly — never force the range.",
    icon: "heart",
  },
];

const postureRoutine: WorkoutStep[] = [
  {
    name: "Chest opener",
    seconds: 45,
    instruction: "Clasp hands behind your back and lift the chest.",
    easier: "Rest hands on your lower back instead of clasping.",
    icon: "heart",
  },
  {
    name: "Neck release",
    seconds: 45,
    instruction: "Slowly drop each ear toward the shoulder and hold.",
    easier: "Reduce the tilt and breathe slowly.",
    icon: "move-vertical",
  },
  {
    name: "Shoulder rolls",
    seconds: 30,
    instruction: "Roll shoulders backward in smooth circles.",
    easier: "Smaller, slower circles.",
    icon: "rotate-cw",
  },
  {
    name: "Seated twist",
    seconds: 60,
    instruction: "Sit tall and rotate gently to each side.",
    easier: "Turn only as far as feels easy.",
    icon: "move-horizontal",
  },
];

const strengthRoutine: WorkoutStep[] = [
  {
    name: "Chair squats",
    reps: 12,
    instruction: "Stand and sit with control, chest tall.",
    easier: "Use armrests for support.",
    icon: "armchair",
  },
  {
    name: "Wall push-ups",
    reps: 12,
    instruction: "Hands on wall, lower and press back.",
    easier: "Step closer to the wall.",
    icon: "move-horizontal",
  },
  {
    name: "Glute bridges",
    reps: 12,
    instruction: "Lie down, lift hips, squeeze, lower slowly.",
    easier: "Lift only halfway.",
    icon: "move-vertical",
  },
  {
    name: "Bird dogs",
    reps: 10,
    instruction: "On hands and knees, extend opposite arm and leg.",
    easier: "Extend just the leg, keep both hands down.",
    icon: "footprints",
  },
  {
    name: "Elevated plank",
    seconds: 30,
    instruction: "Forearms on a desk, hold a straight line.",
    easier: "Raise your hands higher to reduce load.",
    icon: "minus",
  },
];

// ---------------------------------------------------------------------------
// Quest catalog
// ---------------------------------------------------------------------------
export const QUESTS: Quest[] = [
  {
    id: "hydrate-2",
    title: "Drink two glasses of water",
    category: "hydration",
    difficulty: "easy",
    minutes: 1,
    xp: XP.hydration,
    position: "either",
    equipmentFree: true,
    summary: "A quick hydration boost to keep your focus sharp.",
    instructions: [
      "Fill a glass with water.",
      "Sip slowly and finish it.",
      "Refill and drink a second glass.",
    ],
    safety: "Sip at a comfortable pace. There is no need to rush.",
    easierAlternative: "Drink a single glass — every sip counts.",
  },
  {
    id: "eye-rest",
    title: "Follow one screen-rest exercise",
    category: "eye-care",
    difficulty: "easy",
    minutes: 2,
    xp: XP.eyeBreak,
    position: "either",
    equipmentFree: true,
    summary: "Give your eyes a gentle break from the screen.",
    instructions: [
      "Look at something about 20 feet away.",
      "Hold your gaze softly for 20 seconds.",
      "Blink slowly a few times and return.",
    ],
    safety: "Keep the room comfortably lit to reduce eye strain.",
    easierAlternative: "Simply close your eyes and rest them for 20 seconds.",
    timerSeconds: 120,
  },
  {
    id: "posture-3",
    title: "Take three posture breaks",
    category: "posture",
    difficulty: "easy",
    minutes: 3,
    xp: XP.posture,
    position: "either",
    equipmentFree: true,
    summary: "Reset your spine and shoulders three times.",
    instructions: [
      "Sit tall, roll shoulders back and down.",
      "Lengthen the back of your neck.",
      "Repeat two more times through the day.",
    ],
    safety: "Move gently — posture resets should feel easy, never strained.",
    easierAlternative: "Do a single mindful posture reset.",
  },
  {
    id: "mobility-5",
    title: "Complete a five-minute mobility routine",
    category: "mobility",
    difficulty: "easy",
    minutes: 5,
    xp: XP.mobility5,
    position: "either",
    equipmentFree: true,
    summary: "A gentle full-body loosen-up you can do anywhere.",
    instructions: ["Follow the guided steps at your own pace."],
    safety:
      "Stop if you feel pain, dizziness, or discomfort. Move within an easy range.",
    easierAlternative: "Do the seated versions of each move.",
    workout: fiveMinuteRoutine,
  },
  {
    id: "walk-10",
    title: "Walk for ten minutes",
    category: "walking",
    difficulty: "easy",
    minutes: 10,
    xp: XP.walk10,
    position: "standing",
    equipmentFree: true,
    summary: "A short walk to refresh your body and mind.",
    instructions: [
      "Head outside or walk around your space.",
      "Keep a relaxed, steady pace.",
      "Return feeling a little more energised.",
    ],
    safety: "Wear comfortable shoes and choose a safe, even path.",
    easierAlternative: "Walk for five minutes instead — a small step still counts.",
    timerSeconds: 600,
  },
  {
    id: "workout-mini",
    title: "Complete a short home workout",
    category: "strength",
    difficulty: "moderate",
    minutes: 5,
    xp: XP.mobility5,
    position: "either",
    equipmentFree: true,
    summary: "A light home workout — no equipment needed.",
    instructions: ["Follow the guided steps and rest whenever you need."],
    safety:
      "Keep movements controlled. Skip anything that causes pain or strain.",
    easierAlternative: "Reduce the repetitions by half.",
    workout: fiveMinuteRoutine,
  },
  {
    id: "movement-2",
    title: "Two-minute movement break",
    category: "mobility",
    difficulty: "easy",
    minutes: 2,
    xp: XP.movement2,
    position: "standing",
    equipmentFree: true,
    summary: "Stand up and get the blood moving.",
    instructions: [
      "Stand and march gently in place.",
      "Add a few shoulder rolls.",
      "Finish with a big stretch upward.",
    ],
    safety: "Rise slowly to avoid light-headedness.",
    easierAlternative: "Do gentle seated marches and arm circles.",
    timerSeconds: 120,
  },
  {
    id: "breathe-3",
    title: "Three-minute breathing reset",
    category: "breathing",
    difficulty: "easy",
    minutes: 3,
    xp: XP.posture,
    position: "seated",
    equipmentFree: true,
    summary: "Slow, calming breaths to lower tension.",
    instructions: [
      "Breathe in for a count of four.",
      "Hold gently for four.",
      "Exhale slowly for six. Repeat.",
    ],
    safety: "Breathe within a comfortable range — never strain the breath.",
    easierAlternative: "Simply breathe slowly without counting.",
    timerSeconds: 180,
  },
  {
    id: "posture-flow-5",
    title: "Posture recovery flow",
    category: "posture",
    difficulty: "easy",
    minutes: 5,
    xp: XP.mobility5,
    position: "either",
    equipmentFree: true,
    summary: "Open the chest and release the neck and shoulders.",
    instructions: ["Follow the guided posture steps slowly."],
    safety: "Ease into each stretch; avoid any sharp sensations.",
    easierAlternative: "Hold each move for a shorter time.",
    workout: postureRoutine,
  },
  {
    id: "strength-15",
    title: "Fifteen-minute strength builder",
    category: "strength",
    difficulty: "challenging",
    minutes: 15,
    xp: XP.workout15,
    position: "either",
    equipmentFree: true,
    summary: "A longer, equipment-free strength session.",
    instructions: ["Move through each exercise with control and rest as needed."],
    safety:
      "Keep good form over speed. Stop with any pain, dizziness, or chest discomfort.",
    easierAlternative: "Do two rounds instead of the full set, or reduce reps.",
    workout: strengthRoutine,
  },
  {
    id: "walk-20",
    title: "Twenty-minute walk",
    category: "walking",
    difficulty: "moderate",
    minutes: 20,
    xp: XP.workout15,
    position: "standing",
    equipmentFree: true,
    summary: "A longer walk to lift energy and clear your head.",
    instructions: [
      "Choose a pleasant, safe route.",
      "Keep a steady, comfortable pace.",
      "Notice how you feel by the end.",
    ],
    safety: "Stay hydrated and pick even ground.",
    easierAlternative: "Split it into two ten-minute walks.",
    timerSeconds: 1200,
  },
  {
    id: "sleep-prep",
    title: "Evening wind-down routine",
    category: "sleep",
    difficulty: "easy",
    minutes: 10,
    xp: XP.walk10,
    position: "either",
    equipmentFree: true,
    summary: "Gentle movement and breathing to prepare for sleep.",
    instructions: [
      "Dim your screens and lights.",
      "Do slow neck and shoulder stretches.",
      "Finish with three minutes of slow breathing.",
    ],
    safety: "Keep everything gentle and calming before bed.",
    easierAlternative: "Just do the slow breathing portion.",
    timerSeconds: 600,
  },
  {
    id: "hydrate-reminder",
    title: "Refill your water bottle",
    category: "hydration",
    difficulty: "easy",
    minutes: 1,
    xp: XP.hydration,
    position: "either",
    equipmentFree: true,
    summary: "Keep water within reach for the next hour.",
    instructions: ["Fill your bottle or glass and keep it on your desk."],
    safety: "No special precautions needed.",
    easierAlternative: "Even half a glass is a good start.",
  },
  {
    id: "eye-2020",
    title: "20-20-20 eye break",
    category: "eye-care",
    difficulty: "easy",
    minutes: 2,
    xp: XP.eyeBreak,
    position: "either",
    equipmentFree: true,
    summary: "Every 20 minutes, look 20 feet away for 20 seconds.",
    instructions: [
      "Look far into the distance.",
      "Relax your focus for 20 seconds.",
      "Blink softly and return to work.",
    ],
    safety: "Comfortable lighting helps reduce strain.",
    easierAlternative: "Close your eyes and rest them instead.",
    timerSeconds: 120,
  },
];

export function getQuestById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-step",
    name: "First Step",
    description: "Complete your very first quest.",
    icon: "sparkles",
    target: 1,
    metric: "questsCompleted",
  },
  {
    id: "hydration-starter",
    name: "Hydration Starter",
    description: "Finish 3 hydration quests.",
    icon: "droplet",
    target: 3,
    metric: "hydrationCompleted",
  },
  {
    id: "movement-rookie",
    name: "Movement Rookie",
    description: "Complete 5 quests in total.",
    icon: "footprints",
    target: 5,
    metric: "questsCompleted",
  },
  {
    id: "posture-protector",
    name: "Posture Protector",
    description: "Complete 3 posture quests.",
    icon: "shield",
    target: 3,
    metric: "postureCompleted",
  },
  {
    id: "mobility-warrior",
    name: "Mobility Warrior",
    description: "Finish 5 mobility routines.",
    icon: "activity",
    target: 5,
    metric: "mobilityCompleted",
  },
  {
    id: "weekend-walker",
    name: "Weekend Walker",
    description: "Complete 4 walking quests.",
    icon: "map",
    target: 4,
    metric: "walksCompleted",
  },
  {
    id: "five-day-explorer",
    name: "Five-Day Explorer",
    description: "Stay active for 5 different days.",
    icon: "compass",
    target: 5,
    metric: "daysActive",
  },
  {
    id: "desk-hero",
    name: "Desk Hero",
    description: "Complete 25 quests in total.",
    icon: "crown",
    target: 25,
    metric: "questsCompleted",
  },
];

// ---------------------------------------------------------------------------
// Seed data (used for the demo profile + realistic history)
// ---------------------------------------------------------------------------
export const DEMO_PROFILE: UserProfile = {
  name: "Sam",
  hoursSitting: 8,
  activityLevel: "light",
  goal: "energy",
  sessionDuration: 10,
  activityPreference: "mixed",
  reminderPreference: "work",
};

/** Build ~2 weeks of believable history ending yesterday. */
export function buildSeedHistory(): DayRecord[] {
  const sampleDays: Array<{ ids: string[]; assigned: number }> = [
    { ids: ["hydrate-2", "posture-3", "mobility-5"], assigned: 4 },
    { ids: ["hydrate-2", "walk-10"], assigned: 4 },
    { ids: ["hydrate-2", "posture-3", "walk-10", "eye-rest"], assigned: 4 },
    { ids: [], assigned: 4 },
    { ids: ["hydrate-2", "mobility-5", "posture-3", "walk-10", "eye-rest"], assigned: 5 },
    { ids: ["hydrate-2", "walk-10", "posture-3"], assigned: 5 },
    { ids: ["hydrate-2", "eye-rest"], assigned: 4 },
    { ids: ["hydrate-2", "posture-3", "mobility-5", "walk-10"], assigned: 4 },
    { ids: ["hydrate-2", "posture-3"], assigned: 4 },
    { ids: ["hydrate-2", "walk-10", "mobility-5", "eye-rest", "posture-3"], assigned: 5 },
    { ids: [], assigned: 4 },
    { ids: ["hydrate-2", "posture-3", "walk-10"], assigned: 4 },
    { ids: ["hydrate-2", "mobility-5"], assigned: 4 },
  ];

  const records: DayRecord[] = [];
  const total = sampleDays.length;
  for (let i = 0; i < total; i++) {
    const d = new Date();
    // Oldest first; the last entry is "yesterday" (offset 1).
    d.setDate(d.getDate() - (total - i));
    const day = sampleDays[i];
    const xpEarned = day.ids.reduce((sum, id) => {
      const q = QUESTS.find((x) => x.id === id);
      return sum + (q?.xp ?? 0);
    }, 0);
    records.push({
      date: todayKey(d),
      completedQuestIds: day.ids,
      xpEarned,
      assigned: day.assigned,
    });
  }
  return records;
}

export const SEED_XP = 340; // starts the demo profile at Level 3
