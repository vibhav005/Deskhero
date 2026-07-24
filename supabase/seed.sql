-- ---------------------------------------------------------------------------
-- DeskHero seed data. Idempotent (safe to re-run) via ON CONFLICT DO NOTHING.
-- Note: sample challenges are NOT seeded here — challenges.owner_id requires a
-- real profiles row, which only exists after a real user signs up (M1). Create
-- sample challenges after M1 is live, or as part of M5's own testing.
-- ---------------------------------------------------------------------------

-- Levels (7) — identical thresholds to Phase 1, no renumbering.
insert into public.levels (level, name, min_xp) values
  (1, 'Desk Survivor', 0),
  (2, 'Movement Rookie', 120),
  (3, 'Posture Protector', 300),
  (4, 'Mobility Warrior', 560),
  (5, 'Strength Builder', 900),
  (6, 'Energy Master', 1350),
  (7, 'Desk Hero', 1900)
on conflict (level) do nothing;

-- ---------------------------------------------------------------------------
-- Exercises (24) — individual building blocks used by guided workouts below.
-- ---------------------------------------------------------------------------
insert into public.exercises (slug, name, instruction, easier_variant, icon, equipment_free, "position") values
  ('march-in-place', 'March in place', 'Lift your knees at a comfortable pace and let your arms swing.', 'March gently while seated, lifting one foot at a time.', 'footprints', true, 'standing'),
  ('shoulder-rolls', 'Shoulder rolls', 'Roll your shoulders backward in slow, full circles.', 'Make the circles smaller and slower.', 'rotate-cw', true, 'either'),
  ('chair-squats', 'Chair squats', 'Stand up from a chair and sit back down with control.', 'Use your hands on the armrests for support.', 'armchair', true, 'standing'),
  ('wall-pushups', 'Wall push-ups', 'Hands on a wall, bend your elbows, then press back.', 'Stand closer to the wall to reduce the effort.', 'move-horizontal', true, 'standing'),
  ('standing-side-bends', 'Standing side bends', 'Reach one arm overhead and lean gently to the side.', 'Keep the reach small and stay seated if you prefer.', 'move-vertical', true, 'standing'),
  ('chest-neck-stretch', 'Chest & neck stretch', 'Open your chest, then slowly tilt your head side to side.', 'Hold each stretch lightly, never force the range.', 'heart', true, 'either'),
  ('chest-opener', 'Chest opener', 'Clasp hands behind your back and lift the chest.', 'Rest hands on your lower back instead of clasping.', 'heart', true, 'seated'),
  ('neck-release', 'Neck release', 'Slowly drop each ear toward the shoulder and hold.', 'Reduce the tilt and breathe slowly.', 'move-vertical', true, 'seated'),
  ('seated-twist', 'Seated twist', 'Sit tall and rotate gently to each side.', 'Turn only as far as feels easy.', 'move-horizontal', true, 'seated'),
  ('glute-bridges', 'Glute bridges', 'Lie down, lift hips, squeeze, lower slowly.', 'Lift only halfway.', 'move-vertical', true, 'either'),
  ('bird-dogs', 'Bird dogs', 'On hands and knees, extend opposite arm and leg.', 'Extend just the leg, keep both hands down.', 'footprints', true, 'either'),
  ('elevated-plank', 'Elevated plank', 'Forearms on a desk, hold a straight line.', 'Raise your hands higher to reduce load.', 'minus', true, 'standing'),
  ('calf-raises', 'Calf raises', 'Rise onto your toes slowly, then lower with control.', 'Hold a wall or chair for balance.', 'footprints', true, 'standing'),
  ('ankle-circles', 'Ankle circles', 'Lift one foot and circle the ankle slowly each direction.', 'Make smaller circles.', 'rotate-cw', true, 'seated'),
  ('wrist-stretches', 'Wrist stretches', 'Extend one arm, gently pull fingers back, then release.', 'Reduce the pull and hold briefly.', 'move-horizontal', true, 'seated'),
  ('deep-breathing', 'Deep breathing', 'Breathe in slowly through the nose, out slowly through the mouth.', 'Breathe at whatever pace feels natural.', 'wind', true, 'seated'),
  ('box-breathing', 'Box breathing', 'Inhale for 4, hold for 4, exhale for 4, hold for 4.', 'Use a 3-count instead of 4 if that feels easier.', 'wind', true, 'seated'),
  ('eye-palming', 'Eye palming', 'Rub palms warm, gently cover closed eyes, breathe slowly.', 'Simply close your eyes without covering them.', 'eye', true, 'either'),
  ('distance-gazing', 'Distance gazing', 'Look at something far away and let your focus soften.', 'Look out any window for the same effect.', 'eye', true, 'either'),
  ('hip-flexor-stretch', 'Hip flexor stretch', 'Step one foot forward, gently lean into the front knee.', 'Reduce the lean and hold lightly.', 'move-vertical', true, 'standing'),
  ('spinal-twist-standing', 'Standing spinal twist', 'Feet planted, rotate your torso gently side to side.', 'Make the twist smaller.', 'move-horizontal', true, 'standing'),
  ('arm-circles', 'Arm circles', 'Extend arms out and circle them slowly, both directions.', 'Make smaller circles.', 'rotate-cw', true, 'standing'),
  ('seated-cat-cow', 'Seated cat-cow', 'Arch and round your spine slowly while seated.', 'Reduce the range of motion.', 'move-vertical', true, 'seated'),
  ('standing-forward-fold', 'Standing forward fold', 'Hinge at the hips and let your upper body hang gently.', 'Bend your knees generously.', 'move-vertical', true, 'standing')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Workouts (11) — guided routines composed from the exercises above.
-- ---------------------------------------------------------------------------
insert into public.workouts (slug, title, description, category, total_minutes, difficulty) values
  ('five-minute-energizer', 'Five-minute energizer', 'A gentle full-body loosen-up you can do anywhere.', 'mobility', 5, 'easy'),
  ('posture-recovery-flow', 'Posture recovery flow', 'Open the chest and release the neck and shoulders.', 'posture', 5, 'easy'),
  ('strength-builder-15', 'Fifteen-minute strength builder', 'A longer, equipment-free strength session.', 'strength', 15, 'challenging'),
  ('morning-wakeup', 'Morning wake-up', 'Gentle movement to start the day with energy.', 'mobility', 5, 'easy'),
  ('desk-stretch-break', 'Desk stretch break', 'A short seated reset for the neck, back, and shoulders.', 'posture', 4, 'easy'),
  ('eye-and-mind-reset', 'Eye and mind reset', 'Rest your eyes and calm your focus.', 'eye-care', 3, 'easy'),
  ('lower-body-strength', 'Lower body strength', 'Build strength in the legs and glutes, no equipment.', 'strength', 10, 'moderate'),
  ('upper-body-strength', 'Upper body strength', 'Build strength in the arms, chest, and shoulders.', 'strength', 10, 'moderate'),
  ('full-body-mobility', 'Full body mobility', 'A longer loosen-up covering the whole body.', 'mobility', 8, 'moderate'),
  ('calm-breathing-flow', 'Calm breathing flow', 'Slow, calming breathwork to lower tension.', 'breathing', 5, 'easy'),
  ('evening-winddown', 'Evening wind-down', 'Gentle movement and breathing to prepare for sleep.', 'sleep', 6, 'easy')
on conflict (slug) do nothing;

insert into public.workout_exercises (workout_id, exercise_id, "position", seconds, reps)
select w.id, e.id, x.position, x.seconds, x.reps
from (values
  ('five-minute-energizer', 'march-in-place', 1, 60, null::int),
  ('five-minute-energizer', 'shoulder-rolls', 2, 30, null),
  ('five-minute-energizer', 'chair-squats', 3, null, 10),
  ('five-minute-energizer', 'wall-pushups', 4, null, 10),
  ('five-minute-energizer', 'standing-side-bends', 5, 30, null),
  ('five-minute-energizer', 'chest-neck-stretch', 6, 60, null),

  ('posture-recovery-flow', 'chest-opener', 1, 45, null),
  ('posture-recovery-flow', 'neck-release', 2, 45, null),
  ('posture-recovery-flow', 'shoulder-rolls', 3, 30, null),
  ('posture-recovery-flow', 'seated-twist', 4, 60, null),

  ('strength-builder-15', 'chair-squats', 1, null, 12),
  ('strength-builder-15', 'wall-pushups', 2, null, 12),
  ('strength-builder-15', 'glute-bridges', 3, null, 12),
  ('strength-builder-15', 'bird-dogs', 4, null, 10),
  ('strength-builder-15', 'elevated-plank', 5, 30, null),

  ('morning-wakeup', 'arm-circles', 1, 30, null),
  ('morning-wakeup', 'standing-forward-fold', 2, 30, null),
  ('morning-wakeup', 'spinal-twist-standing', 3, 30, null),
  ('morning-wakeup', 'calf-raises', 4, null, 10),
  ('morning-wakeup', 'hip-flexor-stretch', 5, 30, null),

  ('desk-stretch-break', 'seated-cat-cow', 1, 45, null),
  ('desk-stretch-break', 'neck-release', 2, 45, null),
  ('desk-stretch-break', 'seated-twist', 3, 45, null),
  ('desk-stretch-break', 'chest-opener', 4, 45, null),

  ('eye-and-mind-reset', 'eye-palming', 1, 30, null),
  ('eye-and-mind-reset', 'distance-gazing', 2, 30, null),
  ('eye-and-mind-reset', 'deep-breathing', 3, 60, null),

  ('lower-body-strength', 'chair-squats', 1, null, 15),
  ('lower-body-strength', 'glute-bridges', 2, null, 15),
  ('lower-body-strength', 'calf-raises', 3, null, 15),
  ('lower-body-strength', 'standing-forward-fold', 4, 30, null),

  ('upper-body-strength', 'wall-pushups', 1, null, 15),
  ('upper-body-strength', 'elevated-plank', 2, 45, null),
  ('upper-body-strength', 'arm-circles', 3, 30, null),
  ('upper-body-strength', 'shoulder-rolls', 4, 30, null),

  ('full-body-mobility', 'march-in-place', 1, 60, null),
  ('full-body-mobility', 'arm-circles', 2, 30, null),
  ('full-body-mobility', 'spinal-twist-standing', 3, 30, null),
  ('full-body-mobility', 'hip-flexor-stretch', 4, 30, null),
  ('full-body-mobility', 'ankle-circles', 5, 30, null),
  ('full-body-mobility', 'wrist-stretches', 6, 30, null),

  ('calm-breathing-flow', 'deep-breathing', 1, 90, null),
  ('calm-breathing-flow', 'box-breathing', 2, 90, null),
  ('calm-breathing-flow', 'eye-palming', 3, 30, null),

  ('evening-winddown', 'seated-cat-cow', 1, 45, null),
  ('evening-winddown', 'neck-release', 2, 45, null),
  ('evening-winddown', 'deep-breathing', 3, 90, null),
  ('evening-winddown', 'box-breathing', 4, 90, null)
) as x(workout_slug, exercise_slug, position, seconds, reps)
join public.workouts w on w.slug = x.workout_slug
join public.exercises e on e.slug = x.exercise_slug
on conflict (workout_id, "position") do nothing;

-- ---------------------------------------------------------------------------
-- Activities (44) — the "quests". Every category has at least 5 entries.
-- contraindicated_tags use the exact limitation vocabulary from onboarding:
-- prefer_seated, avoid_jumping, avoid_floor_exercises, prefer_low_impact.
-- ---------------------------------------------------------------------------
insert into public.activities (
  slug, title, category, difficulty, minutes, xp_value, "position", equipment_free,
  summary, instructions, safety_notes, easier_alternative, timer_seconds, workout_id, contraindicated_tags
) values
  -- Hydration
  ('hydrate-2glasses', 'Drink two glasses of water', 'hydration', 'easy', 1, 5, 'either', true, 'A quick hydration boost to keep your focus sharp.', array['Fill a glass with water.','Sip slowly and finish it.','Refill and drink a second glass.'], 'Sip at a comfortable pace. There is no need to rush.', 'Drink a single glass, every sip counts.', null, null, '{}'),
  ('hydrate-refill-bottle', 'Refill your water bottle', 'hydration', 'easy', 1, 5, 'either', true, 'Keep water within reach for the next hour.', array['Fill your bottle or glass and keep it on your desk.'], 'No special precautions needed.', 'Even half a glass is a good start.', null, null, '{}'),
  ('hydrate-herbal-tea', 'Make a calming herbal tea', 'hydration', 'easy', 2, 5, 'either', true, 'A warm, caffeine-free way to add fluids to your day.', array['Boil water and steep a herbal tea bag.','Sip slowly while it cools.'], 'Let hot drinks cool before sipping.', 'Drink a glass of water instead.', null, null, '{}'),
  ('hydrate-track-intake', 'Check your hydration for the day', 'hydration', 'easy', 1, 5, 'either', true, 'A quick mental check-in on how much you have had to drink.', array['Estimate how many glasses you have had today.','Drink one more if you are behind.'], 'No special precautions needed.', 'Just drink one glass of water now.', null, null, '{}'),
  ('hydrate-morning-glass', 'Start with a morning glass of water', 'hydration', 'easy', 1, 5, 'either', true, 'A simple way to rehydrate after sleep.', array['Drink a full glass of water first thing.'], 'No special precautions needed.', 'A few sips still count.', null, null, '{}'),

  -- Eye care
  ('eye-2020-break', '20-20-20 eye break', 'eye-care', 'easy', 2, 5, 'either', true, 'Every 20 minutes, look 20 feet away for 20 seconds.', array['Look far into the distance.','Relax your focus for 20 seconds.','Blink softly and return to work.'], 'Comfortable lighting helps reduce strain.', 'Close your eyes and rest them instead.', 120, null, '{}'),
  ('eye-rest-exercise', 'Follow one screen-rest exercise', 'eye-care', 'easy', 2, 5, 'either', true, 'Give your eyes a gentle break from the screen.', array['Look at something about 20 feet away.','Hold your gaze softly for 20 seconds.','Blink slowly a few times and return.'], 'Keep the room comfortably lit to reduce eye strain.', 'Simply close your eyes and rest them for 20 seconds.', 120, null, '{}'),
  ('eye-palming-break', 'Take an eye-palming break', 'eye-care', 'easy', 2, 5, 'either', true, 'Rest your eyes fully behind warm palms.', array['Rub your palms together until warm.','Gently cover closed eyes without pressing.','Breathe slowly for 30 seconds.'], 'Never press on the eyes.', 'Simply close your eyes without covering them.', 120, null, '{}'),
  ('eye-blink-exercise', 'Do a mindful blinking exercise', 'eye-care', 'easy', 1, 5, 'either', true, 'Slow, deliberate blinking to refresh dry eyes.', array['Blink slowly and fully ten times.','Rest for a few seconds between sets.'], 'No special precautions needed.', 'Blink at whatever pace feels comfortable.', 60, null, '{}'),
  ('eye-focus-shift', 'Practice near-far focus shifting', 'eye-care', 'easy', 2, 5, 'either', true, 'Shift focus between near and far objects to ease strain.', array['Focus on something close for 5 seconds.','Focus on something far for 5 seconds.','Repeat for two minutes.'], 'Stop if you feel dizzy.', 'Do fewer repetitions.', 120, null, '{}'),

  -- Posture
  ('posture-3breaks', 'Take three posture breaks', 'posture', 'easy', 3, 10, 'either', true, 'Reset your spine and shoulders three times.', array['Sit tall, roll shoulders back and down.','Lengthen the back of your neck.','Repeat two more times through the day.'], 'Move gently, posture resets should feel easy, never strained.', 'Do a single mindful posture reset.', null, null, '{}'),
  ('posture-recovery-flow-quest', 'Posture recovery flow', 'posture', 'easy', 5, 20, 'either', true, 'Open the chest and release the neck and shoulders.', array['Follow the guided posture steps slowly.'], 'Ease into each stretch, avoid any sharp sensations.', 'Hold each move for a shorter time.', null, (select id from public.workouts where slug = 'posture-recovery-flow'), '{}'),
  ('posture-chest-opener', 'Do a chest-opener stretch', 'posture', 'easy', 2, 10, 'seated', true, 'Counter forward hunching with an open-chest stretch.', array['Clasp hands behind your back.','Lift the chest gently and hold.'], 'Never force the stretch.', 'Rest hands on your lower back instead of clasping.', 120, null, '{}'),
  ('posture-neck-release', 'Do a neck release', 'posture', 'easy', 2, 10, 'seated', true, 'Ease neck tension built up from screen time.', array['Slowly drop one ear toward the shoulder and hold.','Repeat on the other side.'], 'Move slowly, never force the tilt.', 'Reduce the tilt and breathe slowly.', 120, null, '{}'),
  ('posture-desk-stretch-break', 'Take a desk stretch break', 'posture', 'easy', 4, 20, 'seated', true, 'A short seated reset for the neck, back, and shoulders.', array['Follow the guided seated stretch sequence.'], 'Keep all stretches gentle.', 'Hold each stretch for less time.', null, (select id from public.workouts where slug = 'desk-stretch-break'), '{}'),
  ('posture-seated-twist', 'Do a seated spinal twist', 'posture', 'easy', 2, 10, 'seated', true, 'Release tension along the spine.', array['Sit tall and rotate gently to one side.','Hold, then repeat on the other side.'], 'Turn only as far as feels easy.', 'Turn less far.', 120, null, '{}'),

  -- Breathing
  ('breathe-3min-reset', 'Three-minute breathing reset', 'breathing', 'easy', 3, 10, 'seated', true, 'Slow, calming breaths to lower tension.', array['Breathe in for a count of four.','Hold gently for four.','Exhale slowly for six, repeat.'], 'Breathe within a comfortable range, never strain the breath.', 'Simply breathe slowly without counting.', 180, null, '{}'),
  ('breathe-box-breathing', 'Practice box breathing', 'breathing', 'easy', 3, 10, 'seated', true, 'A steady four-part breathing pattern to reset focus.', array['Inhale for four counts.','Hold for four counts.','Exhale for four counts.','Hold for four counts, repeat.'], 'Use a shorter count if four feels like a stretch.', 'Use a 3-count instead of 4.', 180, null, '{}'),
  ('breathe-calm-flow', 'Follow a calm breathing flow', 'breathing', 'easy', 5, 20, 'seated', true, 'A guided sequence of slow, calming breathwork.', array['Follow the guided breathing steps.'], 'Breathe at your own comfortable pace throughout.', 'Shorten each step.', null, (select id from public.workouts where slug = 'calm-breathing-flow'), '{}'),
  ('breathe-4-4-6', 'Try a 4-4-6 breathing pattern', 'breathing', 'easy', 2, 5, 'seated', true, 'A short, calming breath pattern for a quick reset.', array['Inhale for 4.','Hold for 4.','Exhale for 6.'], 'Never strain the breath.', 'Breathe naturally without counting.', 120, null, '{}'),
  ('breathe-deep-reset', 'Take a deep-breathing reset', 'breathing', 'easy', 2, 5, 'seated', true, 'A few slow breaths to release tension.', array['Breathe in slowly through the nose.','Breathe out slowly through the mouth.','Repeat for two minutes.'], 'No special precautions needed.', 'Breathe at whatever pace feels natural.', 120, null, '{}'),

  -- Mobility
  ('mobility-5min-routine', 'Complete a five-minute mobility routine', 'mobility', 'easy', 5, 20, 'either', true, 'A gentle full-body loosen-up you can do anywhere.', array['Follow the guided steps at your own pace.'], 'Stop if you feel pain, dizziness, or discomfort. Move within an easy range.', 'Do the seated versions of each move.', null, (select id from public.workouts where slug = 'five-minute-energizer'), '{}'),
  ('mobility-2min-movement', 'Two-minute movement break', 'mobility', 'easy', 2, 10, 'standing', true, 'Stand up and get the blood moving.', array['Stand and march gently in place.','Add a few shoulder rolls.','Finish with a big stretch upward.'], 'Rise slowly to avoid light-headedness.', 'Do gentle seated marches and arm circles.', 120, null, '{}'),
  ('mobility-morning-wakeup', 'Follow a morning wake-up routine', 'mobility', 'moderate', 5, 20, 'standing', true, 'Gentle movement to start the day with energy.', array['Follow the guided wake-up sequence.'], 'Move gently, especially first thing in the morning.', 'Do fewer repetitions of each move.', null, (select id from public.workouts where slug = 'morning-wakeup'), '{}'),
  ('mobility-full-body', 'Follow a full-body mobility routine', 'mobility', 'moderate', 8, 30, 'either', true, 'A longer loosen-up covering the whole body.', array['Follow the guided steps at your own pace.'], 'Stop if anything feels sharp or uncomfortable.', 'Do the seated versions of each move.', null, (select id from public.workouts where slug = 'full-body-mobility'), '{avoid_floor_exercises}'),
  ('mobility-hip-flexor', 'Stretch your hip flexors', 'mobility', 'easy', 2, 10, 'standing', true, 'Release tightness from prolonged sitting.', array['Step one foot forward and lean gently into the front knee.','Hold, then switch sides.'], 'Keep the lean gentle.', 'Reduce the lean.', 120, null, '{prefer_seated}'),
  ('mobility-ankle-circles', 'Do some ankle circles', 'mobility', 'easy', 1, 5, 'seated', true, 'A tiny movement to keep ankles loose.', array['Lift one foot and circle the ankle slowly.','Switch directions, then switch feet.'], 'No special precautions needed.', 'Make smaller circles.', 60, null, '{}'),
  ('mobility-wrist-stretch', 'Stretch your wrists', 'mobility', 'easy', 1, 5, 'seated', true, 'Relieve tension from typing and mousing.', array['Extend one arm, gently pull fingers back.','Hold, then switch hands.'], 'Never force the stretch.', 'Reduce the pull.', 60, null, '{}'),

  -- Walking
  ('walk-10min', 'Walk for ten minutes', 'walking', 'easy', 10, 25, 'standing', true, 'A short walk to refresh your body and mind.', array['Head outside or walk around your space.','Keep a relaxed, steady pace.','Return feeling a little more energised.'], 'Wear comfortable shoes and choose a safe, even path.', 'Walk for five minutes instead, a small step still counts.', 600, null, '{}'),
  ('walk-20min', 'Twenty-minute walk', 'walking', 'moderate', 20, 40, 'standing', true, 'A longer walk to lift energy and clear your head.', array['Choose a pleasant, safe route.','Keep a steady, comfortable pace.','Notice how you feel by the end.'], 'Stay hydrated and pick even ground.', 'Split it into two ten-minute walks.', 1200, null, '{}'),
  ('walk-5min', 'Take a five-minute walk', 'walking', 'easy', 5, 15, 'standing', true, 'A quick reset to break up long sitting.', array['Walk around your space or step outside.','Keep a comfortable, relaxed pace.'], 'Choose even, safe ground.', 'Walk for two minutes instead.', 300, null, '{}'),
  ('walk-stair-climb', 'Take a short stair climb', 'walking', 'moderate', 5, 20, 'standing', true, 'Use stairs for a quick energy boost.', array['Climb a flight of stairs at a comfortable pace.','Rest at the top, then return.'], 'Hold the railing if needed and go at your own pace.', 'Do one flight instead of several.', 300, null, '{avoid_jumping}'),
  ('walk-outdoor-stroll', 'Take a fifteen-minute outdoor stroll', 'walking', 'easy', 15, 30, 'standing', true, 'Fresh air and movement together.', array['Step outside and walk at an easy pace.','Notice your surroundings as you go.'], 'Dress for the weather and choose a safe route.', 'Shorten the walk to five minutes.', 900, null, '{}'),

  -- Strength
  ('strength-mini-workout', 'Complete a short home workout', 'strength', 'moderate', 5, 20, 'either', true, 'A light home workout, no equipment needed.', array['Follow the guided steps and rest whenever you need.'], 'Keep movements controlled. Skip anything that causes pain or strain.', 'Reduce the repetitions by half.', null, (select id from public.workouts where slug = 'five-minute-energizer'), '{}'),
  ('strength-15min-builder', 'Fifteen-minute strength builder', 'strength', 'challenging', 15, 40, 'either', true, 'A longer, equipment-free strength session.', array['Move through each exercise with control and rest as needed.'], 'Keep good form over speed. Stop with any pain, dizziness, or chest discomfort.', 'Do two rounds instead of the full set, or reduce reps.', null, (select id from public.workouts where slug = 'strength-builder-15'), '{prefer_low_impact,avoid_floor_exercises}'),
  ('strength-lower-body', 'Build lower body strength', 'strength', 'moderate', 10, 30, 'standing', true, 'Legs and glutes, no equipment needed.', array['Follow the guided steps with control.'], 'Stop with any joint pain.', 'Reduce repetitions.', null, (select id from public.workouts where slug = 'lower-body-strength'), '{prefer_low_impact}'),
  ('strength-upper-body', 'Build upper body strength', 'strength', 'moderate', 10, 30, 'standing', true, 'Arms, chest, and shoulders, no equipment needed.', array['Follow the guided steps with control.'], 'Stop with any shoulder or wrist pain.', 'Reduce repetitions.', null, (select id from public.workouts where slug = 'upper-body-strength'), '{}'),
  ('strength-wall-pushups', 'Do a set of wall push-ups', 'strength', 'easy', 3, 10, 'standing', true, 'A gentle way to build upper-body strength.', array['Hands on a wall, bend elbows, then press back.','Repeat for a comfortable number of reps.'], 'Stand closer to the wall to reduce difficulty.', 'Do fewer repetitions.', 180, null, '{}'),

  -- Sleep
  ('sleep-evening-winddown', 'Evening wind-down routine', 'sleep', 'easy', 10, 25, 'either', true, 'Gentle movement and breathing to prepare for sleep.', array['Dim your screens and lights.','Do slow neck and shoulder stretches.','Finish with three minutes of slow breathing.'], 'Keep everything gentle and calming before bed.', 'Just do the slow breathing portion.', null, (select id from public.workouts where slug = 'evening-winddown'), '{}'),
  ('sleep-dim-lights-stretch', 'Stretch before dimming the lights', 'sleep', 'easy', 5, 15, 'either', true, 'A short stretch sequence to signal wind-down time.', array['Dim your lights.','Do a few slow, gentle stretches.'], 'Keep movement slow and easy.', 'Do a single stretch instead of several.', 300, null, '{}'),
  ('sleep-breathing-prep', 'Do a breathing exercise before bed', 'sleep', 'easy', 3, 10, 'seated', true, 'Calm the mind before sleep.', array['Sit or lie comfortably.','Breathe slowly in and out for three minutes.'], 'No special precautions needed.', 'Breathe for one minute instead of three.', 180, null, '{}'),
  ('sleep-gentle-neck-release', 'Release neck tension before bed', 'sleep', 'easy', 2, 10, 'seated', true, 'Ease the day''s tension from the neck and shoulders.', array['Slowly drop one ear toward the shoulder and hold.','Repeat on the other side.'], 'Keep all movement slow and gentle.', 'Reduce the tilt.', 120, null, '{}'),
  ('sleep-gratitude-reflection', 'Take a moment for gratitude', 'sleep', 'easy', 2, 5, 'either', true, 'A calming mental exercise to close the day.', array['Think of three small things that went well today.'], 'No special precautions needed.', 'Think of just one thing.', 120, null, '{}')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Achievements (12) with real stored tiers/xp bonuses (fixes Phase 1 bug #5).
-- ---------------------------------------------------------------------------
insert into public.achievements (slug, name, description, icon, target, metric, tier, xp_bonus) values
  ('first-step', 'First Step', 'Complete your very first quest.', 'sparkles', 1, 'questsCompleted', 'bronze', 15),
  ('hydration-starter', 'Hydration Starter', 'Finish 3 hydration quests.', 'droplet', 3, 'hydrationCompleted', 'bronze', 15),
  ('movement-rookie', 'Movement Rookie', 'Complete 5 quests in total.', 'footprints', 5, 'questsCompleted', 'silver', 30),
  ('posture-protector', 'Posture Protector', 'Complete 3 posture quests.', 'shield', 3, 'postureCompleted', 'bronze', 15),
  ('mobility-warrior', 'Mobility Warrior', 'Finish 5 mobility routines.', 'activity', 5, 'mobilityCompleted', 'silver', 30),
  ('weekend-walker', 'Weekend Walker', 'Complete 4 walking quests.', 'map', 4, 'walksCompleted', 'silver', 30),
  ('five-day-explorer', 'Five-Day Explorer', 'Stay active for 5 different days.', 'compass', 5, 'daysActive', 'silver', 30),
  ('desk-hero', 'Desk Hero', 'Complete 25 quests in total.', 'crown', 25, 'questsCompleted', 'gold', 75),
  ('streak-keeper', 'Streak Keeper', 'Reach a 7-day streak.', 'flame', 7, 'bestStreak', 'silver', 30),
  ('workout-warrior', 'Workout Warrior', 'Complete 10 guided workouts.', 'dumbbell', 10, 'workoutsCompleted', 'gold', 75),
  ('hydration-hero', 'Hydration Hero', 'Finish 15 hydration quests.', 'droplet', 15, 'hydrationCompleted', 'silver', 30),
  ('century-club', 'Century Club', 'Complete 50 quests in total.', 'trophy', 50, 'questsCompleted', 'gold', 100)
on conflict (slug) do nothing;

insert into public.achievement_rules (achievement_id, metric, comparator, threshold, sequence)
select a.id, a.metric, 'gte', a.target, 1
from public.achievements a
where not exists (
  select 1 from public.achievement_rules ar where ar.achievement_id = a.id
);
