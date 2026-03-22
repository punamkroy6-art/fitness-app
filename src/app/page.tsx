"use client";

import { useState, useRef, FormEvent, useEffect, useCallback } from "react";

interface Measurement {
  date: string;
  weight: number;
  waist: number;
}

interface Photo {
  week: string;
  date: string;
  img: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ReminderSettings {
  workout: { enabled: boolean; time: string; days: string[] };
  water: { enabled: boolean; intervalHours: number };
  meals: {
    enabled: boolean;
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
  progress: { enabled: boolean; day: string; time: string };
  voice: { enabled: boolean; volume: number };
  notifications: { enabled: boolean; sound: boolean };
}

const defaultReminders: ReminderSettings = {
  workout: { enabled: true, time: "07:00", days: ["Mon", "Wed", "Fri", "Sat"] },
  water: { enabled: true, intervalHours: 2 },
  meals: {
    enabled: true,
    breakfast: "08:00",
    lunch: "13:00",
    dinner: "19:00",
    snacks: "15:00",
  },
  progress: { enabled: true, day: "Sunday", time: "09:00" },
  voice: { enabled: true, volume: 80 },
  notifications: { enabled: true, sound: true },
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Exercise {
  id: string;
  name: string;
  category: string;
  sets: number;
  reps: string;
  restSeconds: number;
  instructions: string;
  videoUrl: string;
  muscles: string[];
}

const exerciseLibrary: Exercise[] = [
  // LEGS - Quads (6 exercises)
  {
    id: "leg-extension",
    name: "Leg Extensions",
    category: "Quads",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Sit on machine with back against pad\n2. Extend legs fully\n3. Squeeze quadriceps at top\n4. Lower with control",
    videoUrl: "https://www.youtube.com/embed/I3p_7WCCjQw",
    muscles: ["Quadriceps"],
  },
  {
    id: "leg-press",
    name: "Leg Press",
    category: "Quads",
    sets: 4,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Place feet shoulder-width on platform\n2. Lower weight by bending knees\n3. Keep lower back against pad\n4. Press through heels",
    videoUrl: "https://www.youtube.com/embed/7j-2w4-B14E",
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
  },
  {
    id: "hack-squat",
    name: "Hack Squat",
    category: "Quads",
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Position shoulders under pads\n2. Lower body by bending knees\n3. Keep back flat against pad\n4. Press up through heels",
    videoUrl: "https://www.youtube.com/embed/ZetA3GjPA24",
    muscles: ["Quadriceps", "Glutes"],
  },
  {
    id: "front-squat",
    name: "Front Squats",
    category: "Quads",
    sets: 4,
    reps: "8-10",
    restSeconds: 90,
    instructions: "1. Hold barbell on front shoulders\n2. Keep elbows high\n3. Squat down keeping chest up\n4. Drive through heels",
    videoUrl: "https://www.youtube.com/embed/wy2_fJ-JdJA",
    muscles: ["Quadriceps", "Core", "Glutes"],
  },
  {
    id: "walking-lunges",
    name: "Walking Lunges",
    category: "Quads",
    sets: 3,
    reps: "12 each",
    restSeconds: 60,
    instructions: "1. Step forward into lunge\n2. Lower back knee toward ground\n3. Push off front foot\n4. Alternate legs while walking",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
  },
  {
    id: "goblet-squat",
    name: "Goblet Squats",
    category: "Quads",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Hold dumbbell at chest\n2. Keep elbows tucked\n3. Squat down between legs\n4. Drive through heels",
    videoUrl: "https://www.youtube.com/embed/MeIiIdhvXT4",
    muscles: ["Quadriceps", "Glutes", "Core"],
  },

  // LEGS - Hamstrings (6 exercises)
  {
    id: "leg-curl",
    name: "Lying Leg Curl",
    category: "Hamstrings",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Lie face down on machine\n2. Hook heels under pad\n3. Curl heels toward glutes\n4. Lower slowly with control",
    videoUrl: "https://www.youtube.com/embed/W4eKFKQ6y9w",
    muscles: ["Hamstrings"],
  },
  {
    id: "seated-leg-curl",
    name: "Seated Leg Curl",
    category: "Hamstrings",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Sit with pad on thighs\n2. Hook feet under lower pad\n3. Curl legs down\n4. Squeeze hamstrings",
    videoUrl: "https://www.youtube.com/embed/W4eKFKQ6y9w",
    muscles: ["Hamstrings"],
  },
  {
    id: "rdl",
    name: "Romanian Deadlifts",
    category: "Hamstrings",
    sets: 4,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Hold barbell at hip level\n2. Hinge at hips pushing back\n3. Keep legs slightly bent\n4. Feel stretch in hamstrings",
    videoUrl: "https://www.youtube.com/embed/7j-2w4-B14E",
    muscles: ["Hamstrings", "Glutes", "Lower Back"],
  },
  {
    id: "good-mornings",
    name: "Good Mornings",
    category: "Hamstrings",
    sets: 3,
    reps: "10-12",
    restSeconds: 45,
    instructions: "1. Hold barbell on shoulders\n2. Keep legs slightly bent\n3. Hinge forward at hips\n4. Return to standing",
    videoUrl: "https://www.youtube.com/embed/wy2_fJ-JdJA",
    muscles: ["Hamstrings", "Glutes", "Lower Back"],
  },
  {
    id: "stiff-leg-dl",
    name: "Stiff Leg Deadlifts",
    category: "Hamstrings",
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Stand with barbell\n2. Keep legs straight\n3. Lower bar to mid-shin\n4. Feel hamstring stretch",
    videoUrl: "https://www.youtube.com/embed/ZetA3GjPA24",
    muscles: ["Hamstrings", "Glutes", "Lower Back"],
  },
  {
    id: "nordic-curl",
    name: "Nordic Curls",
    category: "Hamstrings",
    sets: 3,
    reps: "8-10",
    restSeconds: 60,
    instructions: "1. Kneel with ankles secured\n2. Lower body forward\n3. Catch yourself with hands\n4. Pull back up",
    videoUrl: "https://www.youtube.com/embed/MeIiIdhvXT4",
    muscles: ["Hamstrings", "Core"],
  },

  // LEGS - Glutes (6 exercises)
  {
    id: "hip-thrust",
    name: "Barbell Hip Thrusts",
    category: "Glutes",
    sets: 4,
    reps: "12-15",
    restSeconds: 60,
    instructions: "1. Sit with upper back against bench\n2. Roll barbell over hips\n3. Drive through heels\n4. Squeeze glutes at top",
    videoUrl: "https://www.youtube.com/embed/WM4RZjvH-5Q",
    muscles: ["Glutes", "Hamstrings"],
  },
  {
    id: "glute-bridge",
    name: "Glute Bridges",
    category: "Glutes",
    sets: 3,
    reps: "15-20",
    restSeconds: 30,
    instructions: "1. Lie on back knees bent\n2. Feet flat on floor\n3. Lift hips squeezing glutes\n4. Hold at top",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Glutes", "Hamstrings"],
  },
  {
    id: "cable-kickback",
    name: "Cable Kickbacks",
    category: "Glutes",
    sets: 3,
    reps: "15 each",
    restSeconds: 30,
    instructions: "1. Attach ankle strap\n2. Hold onto machine\n3. Kick leg back\n4. Squeeze glute at top",
    videoUrl: "https://www.youtube.com/embed/ElWjE5Z2j7M",
    muscles: ["Glutes"],
  },
  {
    id: "peach-maker",
    name: "Peach Maker Machine",
    category: "Glutes",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Position in machine\n2. Push pads outward\n3. Squeeze glutes at top\n4. Control return",
    videoUrl: "https://www.youtube.com/embed/WM4RZjvH-5Q",
    muscles: ["Glutes"],
  },
  {
    id: "donkey-kicks",
    name: "Donkey Kicks",
    category: "Glutes",
    sets: 3,
    reps: "15 each",
    restSeconds: 30,
    instructions: "1. Start on all fours\n2. Kick leg up keeping knee bent\n3. Squeeze glute at top\n4. Lower and repeat",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Glutes"],
  },
  {
    id: "fire-hydrant",
    name: "Fire Hydrants",
    category: "Glutes",
    sets: 3,
    reps: "15 each",
    restSeconds: 30,
    instructions: "1. Start on all fours\n2. Lift leg out to side\n3. Keep knee at 90 degrees\n4. Squeeze at top",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Glutes", "Hip Abductors"],
  },

  // LEGS - Calves (4 exercises)
  {
    id: "standing-calf",
    name: "Standing Calf Raises",
    category: "Calves",
    sets: 4,
    reps: "15-20",
    restSeconds: 30,
    instructions: "1. Stand on raised platform\n2. Lower heels below platform\n3. Rise up on toes\n4. Squeeze at top",
    videoUrl: "https://www.youtube.com/embed/I3p_7WCCjQw",
    muscles: ["Calves"],
  },
  {
    id: "seated-calf",
    name: "Seated Calf Raises",
    category: "Calves",
    sets: 4,
    reps: "15-20",
    restSeconds: 30,
    instructions: "1. Sit with pad on thighs\n2. Lower heels below platform\n3. Rise up on toes\n4. Squeeze at top",
    videoUrl: "https://www.youtube.com/embed/I3p_7WCCjQw",
    muscles: ["Calves"],
  },
  {
    id: "leg-press-calf",
    name: "Leg Press Calf Raises",
    category: "Calves",
    sets: 3,
    reps: "15-20",
    restSeconds: 30,
    instructions: "1. Place toes on edge of platform\n2. Lower heels down\n3. Press through toes\n4. Squeeze calves",
    videoUrl: "https://www.youtube.com/embed/7j-2w4-B14E",
    muscles: ["Calves"],
  },
  {
    id: "calf-jumps",
    name: "Calf Jumps",
    category: "Calves",
    sets: 3,
    reps: "20",
    restSeconds: 30,
    instructions: "1. Stand with feet together\n2. Jump up on toes\n3. Land softly\n4. Repeat quickly",
    videoUrl: "https://www.youtube.com/embed/MeIiIdhvXT4",
    muscles: ["Calves"],
  },

  // LEGS - Inner Thighs (4 exercises)
  {
    id: "adductor",
    name: "Adductor Machine",
    category: "Inner Thighs",
    sets: 3,
    reps: "15-20",
    restSeconds: 45,
    instructions: "1. Sit and spread legs\n2. Push legs together\n3. Control the return\n4. Squeeze inner thighs",
    videoUrl: "https://www.youtube.com/embed/jz6kP6WTCKg",
    muscles: ["Adductors", "Inner Thighs"],
  },
  {
    id: "sumo-squat",
    name: "Sumo Squats",
    category: "Inner Thighs",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Wide stance toes out\n2. Lower hips back and down\n3. Keep knees over toes\n4. Push through heels",
    videoUrl: "https://www.youtube.com/embed/wy2_fJ-JdJA",
    muscles: ["Inner Thighs", "Glutes", "Quadriceps"],
  },
  {
    id: "side-lunge",
    name: "Side Lunges",
    category: "Inner Thighs",
    sets: 3,
    reps: "12 each",
    restSeconds: 45,
    instructions: "1. Stand with feet wide\n2. Lunge to one side\n3. Keep other leg straight\n4. Push back to center",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Inner Thighs", "Glutes", "Quadriceps"],
  },
  {
    id: "cuff-swing",
    name: "Cuff Swings",
    category: "Inner Thighs",
    sets: 3,
    reps: "15 each",
    restSeconds: 30,
    instructions: "1. Hold onto support\n2. Swing leg across body\n3. Control the swing\n4. Feel inner thigh stretch",
    videoUrl: "https://www.youtube.com/embed/jz6kP6WTCKg",
    muscles: ["Inner Thighs", "Hip Flexors"],
  },

  // LEGS - Other (4 exercises)
  {
    id: "split-squat",
    name: "Bulgarian Split Squats",
    category: "Legs",
    sets: 3,
    reps: "10-12 each",
    restSeconds: 60,
    instructions: "1. Back foot on bench\n2. Lower front knee to 90°\n3. Drive through front heel\n4. Keep torso upright",
    videoUrl: "https://www.youtube.com/embed/Fl8a8N2x6jI",
    muscles: ["Quadriceps", "Glutes"],
  },
  {
    id: "step-up",
    name: "Step Ups",
    category: "Legs",
    sets: 3,
    reps: "12 each",
    restSeconds: 45,
    instructions: "1. Stand facing box\n2. Step up driving through heel\n3. Bring other foot up\n4. Step down and repeat",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Quadriceps", "Glutes"],
  },
  {
    id: "single-leg-press",
    name: "Single Leg Press",
    category: "Legs",
    sets: 3,
    reps: "10-12 each",
    restSeconds: 45,
    instructions: "1. Place one foot on platform\n2. Lower weight with one leg\n3. Press back up\n4. Keep hips level",
    videoUrl: "https://www.youtube.com/embed/7j-2w4-B14E",
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
  },
  {
    id: "jump-squat",
    name: "Jump Squats",
    category: "Legs",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Stand with feet shoulder-width\n2. Squat down\n3. Explode up jumping\n4. Land softly",
    videoUrl: "https://www.youtube.com/embed/wy2_fJ-JdJA",
    muscles: ["Quadriceps", "Glutes", "Calves"],
  },

  // UPPER BODY - Chest (4 exercises)
  {
    id: "incline-press",
    name: "Incline Dumbbell Press",
    category: "Chest",
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Set bench to 30-45 degrees\n2. Press dumbbells up\n3. Lower with control\n4. Keep shoulder blades back",
    videoUrl: "https://www.youtube.com/embed/8iPEnn-ltC8",
    muscles: ["Chest", "Shoulders", "Triceps"],
  },
  {
    id: "bench-press",
    name: "Barbell Bench Press",
    category: "Chest",
    sets: 4,
    reps: "8-10",
    restSeconds: 90,
    instructions: "1. Lie on bench grip bar\n2. Lower bar to chest\n3. Press up to start\n4. Keep feet on floor",
    videoUrl: "https://www.youtube.com/embed/rT7DgCr-3pg",
    muscles: ["Chest", "Triceps", "Shoulders"],
  },
  {
    id: "chest-fly",
    name: "Dumbbell Chest Fly",
    category: "Chest",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Lie on bench with arms up\n2. Lower arms to sides\n3. Keep slight bend in elbows\n4. Squeeze chest to return",
    videoUrl: "https://www.youtube.com/embed/S8kXXMhZGSo",
    muscles: ["Chest"],
  },
  {
    id: "cable-crossover",
    name: "Cable Crossovers",
    category: "Chest",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Stand between cables\n2. Bring hands together\n3. Lean slightly forward\n4. Squeeze at bottom",
    videoUrl: "https://www.youtube.com/embed/S8kXXMhZGSo",
    muscles: ["Chest"],
  },

  // UPPER BODY - Back (4 exercises)
  {
    id: "lat-pulldown",
    name: "Lat Pulldowns",
    category: "Back",
    sets: 4,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Grip bar wider than shoulders\n2. Pull bar to upper chest\n3. Squeeze lats at bottom\n4. Control return",
    videoUrl: "https://www.youtube.com/embed/CAwf7n6Luuc",
    muscles: ["Lats", "Biceps", "Rear Delts"],
  },
  {
    id: "barbell-row",
    name: "Barbell Rows",
    category: "Back",
    sets: 4,
    reps: "8-10",
    restSeconds: 60,
    instructions: "1. Bend at hips holding bar\n2. Pull bar to lower chest\n3. Squeeze back muscles\n4. Lower with control",
    videoUrl: "https://www.youtube.com/embed/FWn94Ra_7l8",
    muscles: ["Lats", "Rhomboids", "Biceps"],
  },
  {
    id: "seated-row",
    name: "Seated Cable Rows",
    category: "Back",
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Sit with feet on platform\n2. Pull handle to stomach\n3. Squeeze shoulder blades\n4. Return with control",
    videoUrl: "https://www.youtube.com/embed/rB7G3dj-6GI",
    muscles: ["Lats", "Rhomboids", "Biceps"],
  },
  {
    id: "pull-ups",
    name: "Pull Ups",
    category: "Back",
    sets: 3,
    reps: "8-12",
    restSeconds: 60,
    instructions: "1. Hang from bar overhand grip\n2. Pull up until chin over bar\n3. Squeeze back muscles\n4. Lower with control",
    videoUrl: "https://www.youtube.com/embed/eGo4IYlbE5g",
    muscles: ["Lats", "Biceps", "Core"],
  },

  // UPPER BODY - Shoulders (4 exercises)
  {
    id: "overhead-press",
    name: "Overhead Press",
    category: "Shoulders",
    sets: 4,
    reps: "8-10",
    restSeconds: 60,
    instructions: "1. Hold bar at shoulder height\n2. Press overhead to full extension\n3. Lower with control\n4. Keep core tight",
    videoUrl: "https://www.youtube.com/embed/QAQ64hK4Xxs",
    muscles: ["Shoulders", "Triceps", "Core"],
  },
  {
    id: "lateral-raise",
    name: "Lateral Raises",
    category: "Shoulders",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Hold dumbbells at sides\n2. Raise arms to shoulder height\n3. Keep slight bend in elbows\n4. Lower slowly",
    videoUrl: "https://www.youtube.com/embed/3VcKaXpzqRo",
    muscles: ["Side Delts"],
  },
  {
    id: "face-pull",
    name: "Face Pulls",
    category: "Shoulders",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Set cable at face height\n2. Pull rope toward face\n3. Squeeze rear delts\n4. Return with control",
    videoUrl: "https://www.youtube.com/embed/rep-4x4OQQ",
    muscles: ["Rear Delts", "Rhomboids"],
  },
  {
    id: "arnold-press",
    name: "Arnold Press",
    category: "Shoulders",
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Start with palms facing you\n2. Rotate while pressing up\n3. Full extension at top\n4. Reverse the motion",
    videoUrl: "https://www.youtube.com/embed/6Z15Wjf-JH0",
    muscles: ["Shoulders", "Triceps"],
  },

  // UPPER BODY - Arms (3 exercises)
  {
    id: "bicep-curl",
    name: "Barbell Bicep Curls",
    category: "Arms",
    sets: 3,
    reps: "10-12",
    restSeconds: 45,
    instructions: "1. Hold barbell at thigh level\n2. Curl up keeping elbows still\n3. Squeeze biceps at top\n4. Lower with control",
    videoUrl: "https://www.youtube.com/embed/kwG2ipFRgfo",
    muscles: ["Biceps"],
  },
  {
    id: "tricep-pushdown",
    name: "Tricep Pushdowns",
    category: "Arms",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Hold cable attachment\n2. Push down to full extension\n3. Squeeze triceps\n4. Return with control",
    videoUrl: "https://www.youtube.com/embed/2-LAMcpzODU",
    muscles: ["Triceps"],
  },
  {
    id: "hammer-curl",
    name: "Hammer Curls",
    category: "Arms",
    sets: 3,
    reps: "10-12",
    restSeconds: 45,
    instructions: "1. Hold dumbbells with palms in\n2. Curl up keeping neutral grip\n3. Squeeze at top\n4. Lower with control",
    videoUrl: "https://www.youtube.com/embed/zC3nFhcJ_3I",
    muscles: ["Biceps", "Forearms"],
  },

  // CORE (8 exercises)
  {
    id: "plank",
    name: "Plank Hold",
    category: "Core",
    sets: 3,
    reps: "30-60 sec",
    restSeconds: 30,
    instructions: "1. Forearms on ground\n2. Body in straight line\n3. Engage core\n4. Hold position",
    videoUrl: "https://www.youtube.com/embed/pSHjTRCQxIw",
    muscles: ["Core", "Shoulders"],
  },
  {
    id: "crunches",
    name: "Crunches",
    category: "Core",
    sets: 3,
    reps: "20-25",
    restSeconds: 30,
    instructions: "1. Lie on back knees bent\n2. Hands behind head\n3. Curl shoulders off ground\n4. Squeeze abs",
    videoUrl: "https://www.youtube.com/embed/Xyd_fa5zoEU",
    muscles: ["Abs"],
  },
  {
    id: "russian-twist",
    name: "Russian Twists",
    category: "Core",
    sets: 3,
    reps: "20 each",
    restSeconds: 30,
    instructions: "1. Sit with knees bent\n2. Lean back slightly\n3. Rotate torso side to side\n4. Keep feet elevated",
    videoUrl: "https://www.youtube.com/embed/wkD8rjkodUI",
    muscles: ["Obliques", "Abs"],
  },
  {
    id: "leg-raise",
    name: "Hanging Leg Raises",
    category: "Core",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Hang from pull-up bar\n2. Raise legs to 90 degrees\n3. Lower slowly\n4. Don't swing",
    videoUrl: "https://www.youtube.com/embed/EBYP5N_4i6g",
    muscles: ["Abs", "Hip Flexors"],
  },
  {
    id: "cable-woodchop",
    name: "Cable Woodchops",
    category: "Core",
    sets: 3,
    reps: "12 each",
    restSeconds: 45,
    instructions: "1. Set cable at chest height\n2. Stand sideways to cable\n3. Pull across body\n4. Control return",
    videoUrl: "https://www.youtube.com/embed/oR8xL7oHhT4",
    muscles: ["Obliques", "Core"],
  },
  {
    id: "dead-bug",
    name: "Dead Bugs",
    category: "Core",
    sets: 3,
    reps: "10 each",
    restSeconds: 30,
    instructions: "1. Lie on back arms up\n2. Lift legs to 90 degrees\n3. Opposite arm and leg down\n4. Alternate sides",
    videoUrl: "https://www.youtube.com/embed/gs2T5t7D1QE",
    muscles: ["Core", "Hip Flexors"],
  },
  {
    id: "mountain-climber",
    name: "Mountain Climbers",
    category: "Core",
    sets: 3,
    reps: "20 each",
    restSeconds: 30,
    instructions: "1. Start in push-up position\n2. Drive knee to chest\n3. Alternate legs quickly\n4. Keep hips down",
    videoUrl: "https://www.youtube.com/embed/nmfwI4s3PV0",
    muscles: ["Core", "Hip Flexors", "Shoulders"],
  },
  {
    id: "ab-wheel",
    name: "Ab Wheel Rollouts",
    category: "Core",
    sets: 3,
    reps: "10-15",
    restSeconds: 45,
    instructions: "1. Kneel holding wheel\n2. Roll forward extending body\n3. Keep core tight\n4. Roll back",
    videoUrl: "https://www.youtube.com/embed/Qd4W1GgXoVQ",
    muscles: ["Core", "Shoulders"],
  },

  // CARDIO & FULL BODY (5 exercises)
  {
    id: "burpees",
    name: "Burpees",
    category: "Cardio",
    sets: 3,
    reps: "10-15",
    restSeconds: 45,
    instructions: "1. Start standing\n2. Drop to push-up position\n3. Do push-up\n4. Jump feet to hands and jump up",
    videoUrl: "https://www.youtube.com/embed/TU8QYXLIbDg",
    muscles: ["Full Body", "Chest", "Legs", "Core"],
  },
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swings",
    category: "Cardio",
    sets: 3,
    reps: "15-20",
    restSeconds: 45,
    instructions: "1. Stand with feet wide\n2. Hinge and grab kettlebell\n3. Swing up to shoulder height\n4. Let it swing back down",
    videoUrl: "https://www.youtube.com/embed/YSxHifyI6s8",
    muscles: ["Glutes", "Hamstrings", "Core", "Shoulders"],
  },
  {
    id: "battle-ropes",
    name: "Battle Ropes",
    category: "Cardio",
    sets: 3,
    reps: "30 sec",
    restSeconds: 30,
    instructions: "1. Hold one rope in each hand\n2. Alternate arms up and down\n3. Create wave pattern\n4. Keep core engaged",
    videoUrl: "https://www.youtube.com/embed/4rB4XX3eP2U",
    muscles: ["Shoulders", "Core", "Arms"],
  },
  {
    id: "box-jump",
    name: "Box Jumps",
    category: "Cardio",
    sets: 3,
    reps: "10-12",
    restSeconds: 45,
    instructions: "1. Stand facing box\n2. Swing arms and jump\n3. Land softly on box\n4. Step down",
    videoUrl: "https://www.youtube.com/embed/52r_Ul5k03g",
    muscles: ["Legs", "Glutes", "Calves"],
  },
  {
    id: "rowing",
    name: "Rowing Machine",
    category: "Cardio",
    sets: 3,
    reps: "500m or 3 min",
    restSeconds: 60,
    instructions: "1. Sit on rower feet strapped\n2. Push with legs first\n3. Then lean back and pull handle\n4. Return in reverse order",
    videoUrl: "https://www.youtube.com/embed/zQdd3RXqboE",
    muscles: ["Legs", "Back", "Core", "Shoulders"],
  },
  {
    id: "hack-squat",
    name: "Hack Squat",
    category: "Quads",
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Position shoulders under pads\n2. Lower body by bending knees\n3. Keep back flat against pad\n4. Press up through heels",
    videoUrl: "https://www.youtube.com/embed/ZetA3GjPA24",
    muscles: ["Quadriceps", "Glutes"],
  },
  {
    id: "front-squat",
    name: "Front Squats",
    category: "Quads",
    sets: 4,
    reps: "8-10",
    restSeconds: 90,
    instructions: "1. Hold barbell on front shoulders\n2. Keep elbows high\n3. Squat down keeping chest up\n4. Drive through heels",
    videoUrl: "https://www.youtube.com/embed/wy2_fJ-JdJA",
    muscles: ["Quadriceps", "Core", "Glutes"],
  },
  {
    id: "walking-lunges",
    name: "Walking Lunges",
    category: "Quads",
    sets: 3,
    reps: "12 each",
    restSeconds: 60,
    instructions: "1. Step forward into lunge\n2. Lower back knee toward ground\n3. Push off front foot\n4. Alternate legs while walking",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
  },
  {
    id: "goblet-squat",
    name: "Goblet Squats",
    category: "Quads",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Hold dumbbell at chest\n2. Keep elbows tucked\n3. Squat down between legs\n4. Drive through heels",
    videoUrl: "https://www.youtube.com/embed/MeIiIdhvXT4",
    muscles: ["Quadriceps", "Glutes", "Core"],
  },

  // LEGS - Hamstrings (6 exercises)
  {
    id: "leg-curl",
    name: "Lying Leg Curl",
    category: "Hamstrings",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Lie face down on machine\n2. Hook heels under pad\n3. Curl heels toward glutes\n4. Lower slowly with control",
    videoUrl: "https://www.youtube.com/embed/W4eKFKQ6y9w",
    muscles: ["Hamstrings"],
  },
  {
    id: "seated-leg-curl",
    name: "Seated Leg Curl",
    category: "Hamstrings",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Sit with pad on thighs\n2. Hook feet under lower pad\n3. Curl legs down\n4. Squeeze hamstrings",
    videoUrl: "https://www.youtube.com/embed/ElWjE5Z2j7M",
    muscles: ["Hamstrings"],
  },
  {
    id: "rdl",
    name: "Romanian Deadlifts",
    category: "Hamstrings",
    sets: 4,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Hold barbell at hip level\n2. Hinge at hips pushing back\n3. Keep legs slightly bent\n4. Feel stretch in hamstrings",
    videoUrl: "https://www.youtube.com/embed/7j-2w4-B14E",
    muscles: ["Hamstrings", "Glutes", "Lower Back"],
  },
  {
    id: "good-mornings",
    name: "Good Mornings",
    category: "Hamstrings",
    sets: 3,
    reps: "10-12",
    restSeconds: 45,
    instructions: "1. Hold barbell on shoulders\n2. Keep legs slightly bent\n3. Hinge forward at hips\n4. Return to standing",
    videoUrl: "https://www.youtube.com/embed/wy2_fJ-JdJA",
    muscles: ["Hamstrings", "Glutes", "Lower Back"],
  },
  {
    id: "stiff-leg-dl",
    name: "Stiff Leg Deadlifts",
    category: "Hamstrings",
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Stand with barbell\n2. Keep legs straight\n3. Lower bar to mid-shin\n4. Feel hamstring stretch",
    videoUrl: "https://www.youtube.com/embed/ZetA3GjPA24",
    muscles: ["Hamstrings", "Glutes", "Lower Back"],
  },
  {
    id: "nordic-curl",
    name: "Nordic Curls",
    category: "Hamstrings",
    sets: 3,
    reps: "8-10",
    restSeconds: 60,
    instructions: "1. Kneel with ankles secured\n2. Lower body forward\n3. Catch yourself with hands\n4. Pull back up",
    videoUrl: "https://www.youtube.com/embed/MeIiIdhvXT4",
    muscles: ["Hamstrings", "Core"],
  },

  // LEGS - Glutes (6 exercises)
  {
    id: "hip-thrust",
    name: "Barbell Hip Thrusts",
    category: "Glutes",
    sets: 4,
    reps: "12-15",
    restSeconds: 60,
    instructions: "1. Sit with upper back against bench\n2. Roll barbell over hips\n3. Drive through heels\n4. Squeeze glutes at top",
    videoUrl: "https://www.youtube.com/embed/WM4RZjvH-5Q",
    muscles: ["Glutes", "Hamstrings"],
  },
  {
    id: "glute-bridge",
    name: "Glute Bridges",
    category: "Glutes",
    sets: 3,
    reps: "15-20",
    restSeconds: 30,
    instructions: "1. Lie on back knees bent\n2. Feet flat on floor\n3. Lift hips squeezing glutes\n4. Hold at top",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Glutes", "Hamstrings"],
  },
  {
    id: "cable-kickback",
    name: "Cable Kickbacks",
    category: "Glutes",
    sets: 3,
    reps: "15 each",
    restSeconds: 30,
    instructions: "1. Attach ankle strap\n2. Hold onto machine\n3. Kick leg back\n4. Squeeze glute at top",
    videoUrl: "https://www.youtube.com/embed/ElWjE5Z2j7M",
    muscles: ["Glutes"],
  },
  {
    id: "peach-maker",
    name: "Peach Maker Machine",
    category: "Glutes",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Position in machine\n2. Push pads outward\n3. Squeeze glutes at top\n4. Control return",
    videoUrl: "https://www.youtube.com/embed/WM4RZjvH-5Q",
    muscles: ["Glutes"],
  },
  {
    id: "donkey-kicks",
    name: "Donkey Kicks",
    category: "Glutes",
    sets: 3,
    reps: "15 each",
    restSeconds: 30,
    instructions: "1. Start on all fours\n2. Kick leg up keeping knee bent\n3. Squeeze glute at top\n4. Lower and repeat",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Glutes"],
  },
  {
    id: "fire-hydrant",
    name: "Fire Hydrants",
    category: "Glutes",
    sets: 3,
    reps: "15 each",
    restSeconds: 30,
    instructions: "1. Start on all fours\n2. Lift leg out to side\n3. Keep knee at 90 degrees\n4. Squeeze at top",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Glutes", "Hip Abductors"],
  },

  // LEGS - Calves (4 exercises)
  {
    id: "standing-calf",
    name: "Standing Calf Raises",
    category: "Calves",
    sets: 4,
    reps: "15-20",
    restSeconds: 30,
    instructions: "1. Stand on raised platform\n2. Lower heels below platform\n3. Rise up on toes\n4. Squeeze at top",
    videoUrl: "https://www.youtube.com/embed/P4mI7N9K3jY",
    muscles: ["Calves"],
  },
  {
    id: "seated-calf",
    name: "Seated Calf Raises",
    category: "Calves",
    sets: 4,
    reps: "15-20",
    restSeconds: 30,
    instructions: "1. Sit with pad on thighs\n2. Lower heels below platform\n3. Rise up on toes\n4. Squeeze at top",
    videoUrl: "https://www.youtube.com/embed/P4mI7N9K3jY",
    muscles: ["Calves"],
  },
  {
    id: "leg-press-calf",
    name: "Leg Press Calf Raises",
    category: "Calves",
    sets: 3,
    reps: "15-20",
    restSeconds: 30,
    instructions: "1. Place toes on edge of platform\n2. Lower heels down\n3. Press through toes\n4. Squeeze calves",
    videoUrl: "https://www.youtube.com/embed/7j-2w4-B14E",
    muscles: ["Calves"],
  },
  {
    id: "calf-jumps",
    name: "Calf Jumps",
    category: "Calves",
    sets: 3,
    reps: "20",
    restSeconds: 30,
    instructions: "1. Stand with feet together\n2. Jump up on toes\n3. Land softly\n4. Repeat quickly",
    videoUrl: "https://www.youtube.com/embed/MeIiIdhvXT4",
    muscles: ["Calves"],
  },

  // LEGS - Inner Thighs (4 exercises)
  {
    id: "adductor",
    name: "Adductor Machine",
    category: "Inner Thighs",
    sets: 3,
    reps: "15-20",
    restSeconds: 45,
    instructions: "1. Sit and spread legs\n2. Push legs together\n3. Control the return\n4. Squeeze inner thighs",
    videoUrl: "https://www.youtube.com/embed/jz6kP6WTCKg",
    muscles: ["Adductors", "Inner Thighs"],
  },
  {
    id: "sumo-squat",
    name: "Sumo Squats",
    category: "Inner Thighs",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Wide stance toes out\n2. Lower hips back and down\n3. Keep knees over toes\n4. Push through heels",
    videoUrl: "https://www.youtube.com/embed/wy2_fJ-JdJA",
    muscles: ["Inner Thighs", "Glutes", "Quadriceps"],
  },
  {
    id: "side-lunge",
    name: "Side Lunges",
    category: "Inner Thighs",
    sets: 3,
    reps: "12 each",
    restSeconds: 45,
    instructions: "1. Stand with feet wide\n2. Lunge to one side\n3. Keep other leg straight\n4. Push back to center",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Inner Thighs", "Glutes", "Quadriceps"],
  },
  {
    id: "cuff-swing",
    name: "Cuff Swings",
    category: "Inner Thighs",
    sets: 3,
    reps: "15 each",
    restSeconds: 30,
    instructions: "1. Hold onto support\n2. Swing leg across body\n3. Control the swing\n4. Feel inner thigh stretch",
    videoUrl: "https://www.youtube.com/embed/jz6kP6WTCKg",
    muscles: ["Inner Thighs", "Hip Flexors"],
  },

  // LEGS - Other (4 exercises)
  {
    id: "split-squat",
    name: "Bulgarian Split Squats",
    category: "Legs",
    sets: 3,
    reps: "10-12 each",
    restSeconds: 60,
    instructions: "1. Back foot on bench\n2. Lower front knee to 90°\n3. Drive through front heel\n4. Keep torso upright",
    videoUrl: "https://www.youtube.com/embed/Fl8a8N2x6jI",
    muscles: ["Quadriceps", "Glutes"],
  },
  {
    id: "step-up",
    name: "Step Ups",
    category: "Legs",
    sets: 3,
    reps: "12 each",
    restSeconds: 45,
    instructions: "1. Stand facing box\n2. Step up driving through heel\n3. Bring other foot up\n4. Step down and repeat",
    videoUrl: "https://www.youtube.com/embed/D7KaRcUTQeE",
    muscles: ["Quadriceps", "Glutes"],
  },
  {
    id: "single-leg-press",
    name: "Single Leg Press",
    category: "Legs",
    sets: 3,
    reps: "10-12 each",
    restSeconds: 45,
    instructions: "1. Place one foot on platform\n2. Lower weight with one leg\n3. Press back up\n4. Keep hips level",
    videoUrl: "https://www.youtube.com/embed/7j-2w4-B14E",
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
  },
  {
    id: "jump-squat",
    name: "Jump Squats",
    category: "Legs",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Stand with feet shoulder-width\n2. Squat down\n3. Explode up jumping\n4. Land softly",
    videoUrl: "https://www.youtube.com/embed/wy2_fJ-JdJA",
    muscles: ["Quadriceps", "Glutes", "Calves"],
  },

  // UPPER BODY - Chest (4 exercises)
  {
    id: "incline-press",
    name: "Incline Dumbbell Press",
    category: "Chest",
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Set bench to 30-45 degrees\n2. Press dumbbells up\n3. Lower with control\n4. Keep shoulder blades back",
    videoUrl: "https://www.youtube.com/embed/8iPEnn-ltC8",
    muscles: ["Chest", "Shoulders", "Triceps"],
  },
  {
    id: "bench-press",
    name: "Barbell Bench Press",
    category: "Chest",
    sets: 4,
    reps: "8-10",
    restSeconds: 90,
    instructions: "1. Lie on bench grip bar\n2. Lower bar to chest\n3. Press up to start\n4. Keep feet on floor",
    videoUrl: "https://www.youtube.com/embed/rT7DgCr-3pg",
    muscles: ["Chest", "Triceps", "Shoulders"],
  },
  {
    id: "chest-fly",
    name: "Dumbbell Chest Fly",
    category: "Chest",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Lie on bench with arms up\n2. Lower arms to sides\n3. Keep slight bend in elbows\n4. Squeeze chest to return",
    videoUrl: "https://www.youtube.com/embed/S8kXXMhZGSo",
    muscles: ["Chest"],
  },
  {
    id: "cable-crossover",
    name: "Cable Crossovers",
    category: "Chest",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Stand between cables\n2. Bring hands together\n3. Lean slightly forward\n4. Squeeze at bottom",
    videoUrl: "https://www.youtube.com/embed/S8kXXMhZGSo",
    muscles: ["Chest"],
  },

  // UPPER BODY - Back (4 exercises)
  {
    id: "lat-pulldown",
    name: "Lat Pulldowns",
    category: "Back",
    sets: 4,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Grip bar wider than shoulders\n2. Pull bar to upper chest\n3. Squeeze lats at bottom\n4. Control return",
    videoUrl: "https://www.youtube.com/embed/CAwf7n6Luuc",
    muscles: ["Lats", "Biceps", "Rear Delts"],
  },
  {
    id: "barbell-row",
    name: "Barbell Rows",
    category: "Back",
    sets: 4,
    reps: "8-10",
    restSeconds: 60,
    instructions: "1. Bend at hips holding bar\n2. Pull bar to lower chest\n3. Squeeze back muscles\n4. Lower with control",
    videoUrl: "https://www.youtube.com/embed/FWn94Ra_7l8",
    muscles: ["Lats", "Rhomboids", "Biceps"],
  },
  {
    id: "seated-row",
    name: "Seated Cable Rows",
    category: "Back",
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Sit with feet on platform\n2. Pull handle to stomach\n3. Squeeze shoulder blades\n4. Return with control",
    videoUrl: "https://www.youtube.com/embed/rB7G3dj-6GI",
    muscles: ["Lats", "Rhomboids", "Biceps"],
  },
  {
    id: "pull-ups",
    name: "Pull Ups",
    category: "Back",
    sets: 3,
    reps: "8-12",
    restSeconds: 60,
    instructions: "1. Hang from bar overhand grip\n2. Pull up until chin over bar\n3. Squeeze back muscles\n4. Lower with control",
    videoUrl: "https://www.youtube.com/embed/eGo4IYlbE5g",
    muscles: ["Lats", "Biceps", "Core"],
  },

  // UPPER BODY - Shoulders (4 exercises)
  {
    id: "overhead-press",
    name: "Overhead Press",
    category: "Shoulders",
    sets: 4,
    reps: "8-10",
    restSeconds: 60,
    instructions: "1. Hold bar at shoulder height\n2. Press overhead to full extension\n3. Lower with control\n4. Keep core tight",
    videoUrl: "https://www.youtube.com/embed/QAQ64hK4Xxs",
    muscles: ["Shoulders", "Triceps", "Core"],
  },
  {
    id: "lateral-raise",
    name: "Lateral Raises",
    category: "Shoulders",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Hold dumbbells at sides\n2. Raise arms to shoulder height\n3. Keep slight bend in elbows\n4. Lower slowly",
    videoUrl: "https://www.youtube.com/embed/3VcKaXpzqRo",
    muscles: ["Side Delts"],
  },
  {
    id: "face-pull",
    name: "Face Pulls",
    category: "Shoulders",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Set cable at face height\n2. Pull rope toward face\n3. Squeeze rear delts\n4. Return with control",
    videoUrl: "https://www.youtube.com/embed/rep-4x4OQQ",
    muscles: ["Rear Delts", "Rhomboids"],
  },
  {
    id: "arnold-press",
    name: "Arnold Press",
    category: "Shoulders",
    sets: 3,
    reps: "10-12",
    restSeconds: 60,
    instructions: "1. Start with palms facing you\n2. Rotate while pressing up\n3. Full extension at top\n4. Reverse the motion",
    videoUrl: "https://www.youtube.com/embed/6Z15Wjf-JH0",
    muscles: ["Shoulders", "Triceps"],
  },

  // UPPER BODY - Arms (3 exercises)
  {
    id: "bicep-curl",
    name: "Barbell Bicep Curls",
    category: "Arms",
    sets: 3,
    reps: "10-12",
    restSeconds: 45,
    instructions: "1. Hold barbell at thigh level\n2. Curl up keeping elbows still\n3. Squeeze biceps at top\n4. Lower with control",
    videoUrl: "https://www.youtube.com/embed/kwG2ipFRgfo",
    muscles: ["Biceps"],
  },
  {
    id: "tricep-pushdown",
    name: "Tricep Pushdowns",
    category: "Arms",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Hold cable attachment\n2. Push down to full extension\n3. Squeeze triceps\n4. Return with control",
    videoUrl: "https://www.youtube.com/embed/2-LAMcpzODU",
    muscles: ["Triceps"],
  },
  {
    id: "hammer-curl",
    name: "Hammer Curls",
    category: "Arms",
    sets: 3,
    reps: "10-12",
    restSeconds: 45,
    instructions: "1. Hold dumbbells with palms in\n2. Curl up keeping neutral grip\n3. Squeeze at top\n4. Lower with control",
    videoUrl: "https://www.youtube.com/embed/zC3nFhcJ_3I",
    muscles: ["Biceps", "Forearms"],
  },

  // CORE (8 exercises)
  {
    id: "plank",
    name: "Plank Hold",
    category: "Core",
    sets: 3,
    reps: "30-60 sec",
    restSeconds: 30,
    instructions: "1. Forearms on ground\n2. Body in straight line\n3. Engage core\n4. Hold position",
    videoUrl: "https://www.youtube.com/embed/pSHjTRCQxIw",
    muscles: ["Core", "Shoulders"],
  },
  {
    id: "crunches",
    name: "Crunches",
    category: "Core",
    sets: 3,
    reps: "20-25",
    restSeconds: 30,
    instructions: "1. Lie on back knees bent\n2. Hands behind head\n3. Curl shoulders off ground\n4. Squeeze abs",
    videoUrl: "https://www.youtube.com/embed/Xyd_fa5zoEU",
    muscles: ["Abs"],
  },
  {
    id: "russian-twist",
    name: "Russian Twists",
    category: "Core",
    sets: 3,
    reps: "20 each",
    restSeconds: 30,
    instructions: "1. Sit with knees bent\n2. Lean back slightly\n3. Rotate torso side to side\n4. Keep feet elevated",
    videoUrl: "https://www.youtube.com/embed/wkD8rjkodUI",
    muscles: ["Obliques", "Abs"],
  },
  {
    id: "leg-raise",
    name: "Hanging Leg Raises",
    category: "Core",
    sets: 3,
    reps: "12-15",
    restSeconds: 45,
    instructions: "1. Hang from pull-up bar\n2. Raise legs to 90 degrees\n3. Lower slowly\n4. Don't swing",
    videoUrl: "https://www.youtube.com/embed/EBYP5N_4i6g",
    muscles: ["Abs", "Hip Flexors"],
  },
  {
    id: "cable-woodchop",
    name: "Cable Woodchops",
    category: "Core",
    sets: 3,
    reps: "12 each",
    restSeconds: 45,
    instructions: "1. Set cable at chest height\n2. Stand sideways to cable\n3. Pull across body\n4. Control return",
    videoUrl: "https://www.youtube.com/embed/oR8xL7oHhT4",
    muscles: ["Obliques", "Core"],
  },
  {
    id: "dead-bug",
    name: "Dead Bugs",
    category: "Core",
    sets: 3,
    reps: "10 each",
    restSeconds: 30,
    instructions: "1. Lie on back arms up\n2. Lift legs to 90 degrees\n3. Opposite arm and leg down\n4. Alternate sides",
    videoUrl: "https://www.youtube.com/embed/gs2T5t7D1QE",
    muscles: ["Core", "Hip Flexors"],
  },
  {
    id: "mountain-climber",
    name: "Mountain Climbers",
    category: "Core",
    sets: 3,
    reps: "20 each",
    restSeconds: 30,
    instructions: "1. Start in push-up position\n2. Drive knee to chest\n3. Alternate legs quickly\n4. Keep hips down",
    videoUrl: "https://www.youtube.com/embed/nmfwI4s3PV0",
    muscles: ["Core", "Hip Flexors", "Shoulders"],
  },
  {
    id: "ab-wheel",
    name: "Ab Wheel Rollouts",
    category: "Core",
    sets: 3,
    reps: "10-15",
    restSeconds: 45,
    instructions: "1. Kneel holding wheel\n2. Roll forward extending body\n3. Keep core tight\n4. Roll back",
    videoUrl: "https://www.youtube.com/embed/Qd4W1GgXoVQ",
    muscles: ["Core", "Shoulders"],
  },

  // CARDIO & FULL BODY (5 exercises)
  {
    id: "burpees",
    name: "Burpees",
    category: "Cardio",
    sets: 3,
    reps: "10-15",
    restSeconds: 45,
    instructions: "1. Start standing\n2. Drop to push-up position\n3. Do push-up\n4. Jump feet to hands and jump up",
    videoUrl: "https://www.youtube.com/embed/TU8QYXLIbDg",
    muscles: ["Full Body", "Chest", "Legs", "Core"],
  },
  {
    id: "kettlebell-swing",
    name: "Kettlebell Swings",
    category: "Cardio",
    sets: 3,
    reps: "15-20",
    restSeconds: 45,
    instructions: "1. Stand with feet wide\n2. Hinge and grab kettlebell\n3. Swing up to shoulder height\n4. Let it swing back down",
    videoUrl: "https://www.youtube.com/embed/YSxHifyI6s8",
    muscles: ["Glutes", "Hamstrings", "Core", "Shoulders"],
  },
  {
    id: "battle-ropes",
    name: "Battle Ropes",
    category: "Cardio",
    sets: 3,
    reps: "30 sec",
    restSeconds: 30,
    instructions: "1. Hold one rope in each hand\n2. Alternate arms up and down\n3. Create wave pattern\n4. Keep core engaged",
    videoUrl: "https://www.youtube.com/embed/4rB4XX3eP2U",
    muscles: ["Shoulders", "Core", "Arms"],
  },
  {
    id: "box-jump",
    name: "Box Jumps",
    category: "Cardio",
    sets: 3,
    reps: "10-12",
    restSeconds: 45,
    instructions: "1. Stand facing box\n2. Swing arms and jump\n3. Land softly on box\n4. Step down",
    videoUrl: "https://www.youtube.com/embed/52r_Ul5k03g",
    muscles: ["Legs", "Glutes", "Calves"],
  },
  {
    id: "rowing",
    name: "Rowing Machine",
    category: "Cardio",
    sets: 3,
    reps: "500m or 3 min",
    restSeconds: 60,
    instructions: "1. Sit on rower feet strapped\n2. Push with legs first\n3. Then lean back and pull handle\n4. Return in reverse order",
    videoUrl: "https://www.youtube.com/embed/zQdd3RXqboE",
    muscles: ["Legs", "Back", "Core", "Shoulders"],
  },
];

const workoutCategories = [
  "All",
  "Quads",
  "Hamstrings", 
  "Glutes",
  "Calves",
  "Inner Thighs",
  "Legs",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Core",
  "Cardio",
];

interface PresetWorkout {
  id: string;
  name: string;
  description: string;
  exercises: { name: string; sets: string; reps: string }[];
}

const presetWorkouts: PresetWorkout[] = [
  {
    id: "picture1",
    name: "Picture 1 Pro (Your Plan)",
    description: "Complete transformation program - 6 days/week",
    exercises: [
      { name: "Barbell Hip Thrusts", sets: "4", reps: "12-15" },
      { name: "Incline Dumbbell Press", sets: "3", reps: "10-12" },
      { name: "Leg Curl Machine", sets: "3", reps: "12-15" },
      { name: "Adductor Machine", sets: "3", reps: "15-20" },
    ]
  },
  {
    id: "glute-focus",
    name: "Glute Focus",
    description: "Build your booty - 4 exercises",
    exercises: [
      { name: "Barbell Hip Thrusts", sets: "4", reps: "12-15" },
      { name: "Cable Kickbacks", sets: "3", reps: "15 each" },
      { name: "Glute Bridges", sets: "3", reps: "15-20" },
      { name: "Bulgarian Split Squats", sets: "3", reps: "10-12 each" },
    ]
  },
  {
    id: "leg-day",
    name: "Leg Day",
    description: "Complete legs workout",
    exercises: [
      { name: "Leg Press", sets: "4", reps: "10-12" },
      { name: "Leg Extensions", sets: "3", reps: "12-15" },
      { name: "Lying Leg Curl", sets: "3", reps: "12-15" },
      { name: "Standing Calf Raises", sets: "4", reps: "15-20" },
    ]
  },
  {
    id: "upper-body",
    name: "Upper Body",
    description: "Chest, Back, Shoulders",
    exercises: [
      { name: "Incline Dumbbell Press", sets: "3", reps: "10-12" },
      { name: "Lat Pulldowns", sets: "4", reps: "10-12" },
      { name: "Overhead Press", sets: "3", reps: "8-10" },
      { name: "Barbell Rows", sets: "3", reps: "10-12" },
    ]
  },
  {
    id: "core-crusher",
    name: "Core Crusher",
    description: "Abs and obliques workout",
    exercises: [
      { name: "Plank Hold", sets: "3", reps: "30-60 sec" },
      { name: "Crunches", sets: "3", reps: "20-25" },
      { name: "Russian Twists", sets: "3", reps: "20 each" },
      { name: "Hanging Leg Raises", sets: "3", reps: "12-15" },
    ]
  },
  {
    id: "quick-full",
    name: "Quick Full Body",
    description: "Fast full body workout",
    exercises: [
      { name: "Goblet Squats", sets: "3", reps: "12-15" },
      { name: "Push Ups", sets: "3", reps: "10-15" },
      { name: "Kettlebell Swings", sets: "3", reps: "15-20" },
      { name: "Plank Hold", sets: "3", reps: "30 sec" },
    ]
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [waterCount, setWaterCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [waistInput, setWaistInput] = useState("");
  const [measurements, setMeasurements] = useState<Measurement[]>([
    { date: "2026-03-17", weight: 84.5, waist: 39 },
  ]);
  const [photos, setPhotos] = useState<Photo[]>([
    { week: "Week 0 (Start)", date: "2026-03-17", img: "📷" },
  ]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Your elite AI coach here! Track workouts, share form videos, and I'll guide your transformation to Picture 1. What's your focus today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reminders, setReminders] = useState<ReminderSettings>(defaultReminders);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeWorkout, setActiveWorkout] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<{date: string; exercises: number; duration: number}[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [advisorInput, setAdvisorInput] = useState("");
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorRecommendations, setAdvisorRecommendations] = useState<Exercise[]>([]);
  const [advisorMessage, setAdvisorMessage] = useState("");
  const [theme, setTheme] = useState<"dark" | "light" | "ocean" | "sunset" | "forest" | "purple">("dark");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("fitnessReminders");
    if (stored) {
      setReminders(JSON.parse(stored));
    }
    const storedTheme = localStorage.getItem("fitnessTheme") as typeof theme;
    if (storedTheme) {
      setTheme(storedTheme);
    }
    setNotificationPermission(Notification.permission);
    speechSynthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    localStorage.setItem("fitnessReminders", JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem("fitnessTheme", theme);
  }, [theme]);

  useEffect(() => {
    if (!reminders.notifications.enabled || !reminders.water.enabled) return;

    const checkWaterReminder = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 8 && hour < 21) {
        showNotification(
          "💧 Water Time!",
          "Time to drink water and stay hydrated!"
        );
        if (reminders.voice.enabled) {
          speak("Time to drink water! Stay hydrated for your transformation.");
        }
      }
    }, reminders.water.intervalHours * 60 * 60 * 1000);

    return () => clearInterval(checkWaterReminder);
  }, [reminders.notifications.enabled, reminders.water.enabled, reminders.water.intervalHours, reminders.voice.enabled]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser doesn't support notifications");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const showNotification = (title: string, body: string) => {
    if (notificationPermission === "granted") {
      new Notification(title, { body, icon: "🔥" });
    }
  };

  const speak = useCallback(
    (text: string) => {
      if (!reminders.voice.enabled || !speechSynthRef.current) return;

      speechSynthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = reminders.voice.volume / 100;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthRef.current.speak(utterance);
    },
    [reminders.voice.enabled, reminders.voice.volume]
  );

  const stopSpeaking = () => {
    speechSynthRef.current?.cancel();
    setIsSpeaking(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addWater = () => {
    setWaterCount((prev) => Math.min(prev + 1, 10));
  };

  const saveMeasurements = () => {
    const weight = parseFloat(weightInput);
    const waist = parseFloat(waistInput);
    if (weight && waist) {
      setMeasurements([
        ...measurements,
        { date: new Date().toISOString().split("T")[0], weight, waist },
      ]);
      setShowForm(false);
      setWeightInput("");
      setWaistInput("");
      alert("✅ Measurements saved!");
    }
  };

  const addProgressPhoto = () => {
    const week = Math.floor(measurements.length / 2);
    setPhotos([
      ...photos,
      { week: `Week ${week}`, date: new Date().toISOString().split("T")[0], img: "📸" },
    ]);
  };

  const downloadReport = () => {
    const report = `WEEKLY TRANSFORMATION REPORT
════════════════════════════════════════
Week: ${measurements.length}
Program: Picture 1 (Curvy + Lean)

MEASUREMENTS
Weight: ${measurements[measurements.length - 1].weight}kg → Target: 70-75kg (${Math.round((1 - (measurements[measurements.length - 1].weight - 70) / 14.5) * 100)}% progress)
Waist: ${measurements[measurements.length - 1].waist}" → Target: 24-26" (${Math.round((1 - (measurements[measurements.length - 1].waist - 24) / 15) * 100)}% progress)
Thighs: 25" → Target: 22-23"
Body Fat: 30% → Target: 20-22%

ACTIVITY
Workouts: 5/6 completed
Water Days: ${waterCount}/7 (5+ liters)
Adherence: 85%

ACHIEVEMENTS 🏆
💧 Water Warrior - Consistent hydration
💪 Core Crusher - 50+ core exercises

NEXT WEEK GOALS
→ Complete all 6 workouts
→ 7/7 water days (5+ liters)
→ Inner thigh work 3x per week
→ Wednesday cardio non-negotiable

COACH NOTES
You're making solid progress! Focus on:
• Core 6x/week for waist definition
• Inner thigh exercises 3x weekly
• 5+ liters water daily
• Rest 7-9 hours nightly
• Light leg work only`;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transformation_report_week${measurements.length}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setChatInput("");
    setIsLoading(true);
    scrollToBottom();

    // Generate contextual response without API
    const userMsgLower = msg.toLowerCase();
    let response = "";

    // Check for keywords and give appropriate responses
    const picture1Plan = "Your Picture 1 Pro plan: Barbell Hip Thrusts 4x12-15, Incline Dumbbell Press 3x10-12, Leg Curl 3x12-15, Adductor Machine 3x15-20. This is your main workout routine!";
    
    if (userMsgLower.includes("glute") || userMsgLower.includes("booty") || userMsgLower.includes("butt")) {
      response = picture1Plan + " Focus on hip thrusts, Bulgarian split squats, and glute bridges. Aim for 4 sets of 12-15 reps with progressive overload. Don't forget to warm up properly!";
    } else if (userMsgLower.includes("weight") || userMsgLower.includes("scale")) {
      response = `Your current weight is ${measurements[measurements.length - 1].weight}kg. Remember, weight loss isn't linear! Stay consistent with your workouts and nutrition. Trust the process - you're making progress!`;
    } else if (userMsgLower.includes("water") || userMsgLower.includes("hydrate")) {
      response = `You've had ${waterCount}L of water today. Aim for at least 5L! Proper hydration is crucial for fat loss and muscle recovery. Set reminders if needed!`;
    } else if (userMsgLower.includes("workout") || userMsgLower.includes("exercise")) {
      response = "Great question! Your custom Picture 1 Pro workout is in the Workout tab! It includes: Barbell Hip Thrusts, Incline Dumbbell Press, Leg Curl Machine, and Adductor Machine. Click 'Picture 1 Pro' preset to start your transformation workout!";
    } else if (userMsgLower.includes("diet") || userMsgLower.includes("eat") || userMsgLower.includes("food") || userMsgLower.includes("nutrition")) {
      response = "For your transformation goals, focus on: 1) Protein (1.6-2g per kg body weight), 2) Vegetables with every meal, 3) Stay in calorie deficit, 4) Drink 5L+ water daily. Consistency beats perfection!";
    } else if (userMsgLower.includes("cardio") || userMsgLower.includes("run") || userMsgLower.includes(" treadmill")) {
      response = "Cardio is great for fat loss! Add 2-3 sessions per week - 20-30 minutes of moderate intensity.HIIT is also effective. But remember: diet drives weight loss, cardio helps!";
    } else if (userMsgLower.includes("rest") || userMsgLower.includes("recovery") || userMsgLower.includes("sleep")) {
      response = "Recovery is when muscles grow! Aim for 7-9 hours of sleep, rest days between intense workouts, and proper nutrition. Don't underestimate the power of rest!";
    } else if (userMsgLower.includes("motivation") || userMsgLower.includes("motivate") || userMsgLower.includes("give up")) {
      response = "You've already started - that's the hardest part! Every workout counts. Short-term pain, long-term gain. Picture 1 is waiting! Stay consistent and trust the process! 💪";
    } else if (userMsgLower.includes("hello") || userMsgLower.includes("hi") || userMsgLower.includes("hey")) {
      response = "Hey! Ready to crush your goals today? Check your dashboard for progress, add exercises in the Workout tab, or ask me anything!";
    } else if (userMsgLower.includes("thank")) {
      response = "You're welcome! Remember - consistency is key. You've got this! Keep working towards Picture 1! 🌟";
    } else if (userMsgLower.includes("pain") || userMsgLower.includes("hurt") || userMsgLower.includes("injury")) {
      response = "Listen to your body! If you're in pain, stop the exercise. Mild muscle soreness is normal, but sharp pain is a warning sign. Consider consulting a professional if pain persists.";
    } else if (userMsgLower.includes("waist") || userMsgLower.includes("belly") || userMsgLower.includes("stomach")) {
      response = `Your current waist is ${measurements[measurements.length - 1].waist}". Core exercises and cardio will help. Remember: abs are made in the kitchen! Focus on nutrition and overall fat loss.`;
    } else if (userMsgLower.includes(" thigh") || userMsgLower.includes("leg")) {
      response = "For legs, focus on compound movements like squats, lunges, and leg presses. Add isolation exercises like leg curls and extensions. Consistency is key for leg development!";
    } else if (userMsgLower.includes("chest") || userMsgLower.includes("push")) {
      response = "Build a strong chest with bench press, incline dumbbell press, push-ups, and cable flies. Focus on form over weight. Quality reps = better results!";
    } else if (userMsgLower.includes("back") || userMsgLower.includes("row") || userMsgLower.includes("pull")) {
      response = "A strong back is foundation! Try lat pulldowns, barbell rows, and pull-ups. Focus on squeezing your back muscles, not just moving the weight.";
    } else if (userMsgLower.includes("arm") || userMsgLower.includes("bicep") || userMsgLower.includes("tricep")) {
      response = "For arms, focus on bicep curls, tricep pushdowns, and hammer curls. Remember - bigger muscles come from compound movements too!";
    } else {
      // Default responses - rotate based on random
      const defaultResponses = [
        "Great question! Consistency is what transforms goals into results. Keep showing up, even when you don't feel like it! 💪",
        "You're on the right track! Remember: progress not perfection. Every workout counts toward your transformation!",
        "That's a smart question! Stay focused on your goals, track your progress, and don't compare yourself to others. You're on your own journey!",
        "Love that you're engaged! The Workout tab has 50+ exercises. Build your custom workout and start tracking your sessions!",
        "Keep pushing! Results take time. Trust the process and stay consistent. Picture 1 is your motivation! 🔥",
        "Awesome! You've got all the tools here - dashboard for tracking, workout for exercises, reminders for consistency. Use them all!",
      ];
      response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    // Add user context to response
    let finalResponse = response;
    if (waterCount < 3) {
      finalResponse += " Also, you're behind on water today - aim for 5L!";
    }

    setMessages([...newMessages, { role: "assistant", content: finalResponse }]);
    if (reminders.voice.enabled) {
      speak(finalResponse.replace(/[^a-zA-Z0-9\s.,!?]/g, ""));
    }

    setIsLoading(false);
    scrollToBottom();
  };

  const updateReminder = (
    category: keyof ReminderSettings,
    key: string,
    value: unknown
  ) => {
    setReminders((prev) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
  };

  const toggleDay = (day: string) => {
    const currentDays = reminders.workout.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    updateReminder("workout", "days", newDays);
  };

  const testNotification = () => {
    showNotification(
      "🧪 Test Notification",
      "Your notifications are working!"
    );
  };

  const testVoice = () => {
    speak(
      "Hello! This is your fitness coach. Your voice notifications are working perfectly!"
    );
  };

  const startWorkout = (exercisesToAdd: Exercise[]) => {
    if (exercisesToAdd.length === 0) return;
    setWorkoutExercises(exercisesToAdd);
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setWorkoutTimer(0);
    setRestTimer(0);
    setActiveWorkout(true);
    speak(`Starting workout! First exercise: ${exercisesToAdd[0].name}. ${exercisesToAdd[0].sets} sets of ${exercisesToAdd[0].reps}. Let's go!`);
  };

  const loadPresetWorkout = (presetId: string) => {
    const preset = presetWorkouts.find(p => p.id === presetId);
    if (!preset) return;
    
    const matchedExercises: Exercise[] = [];
    for (const pe of preset.exercises) {
      const found = exerciseLibrary.find(e => e.name === pe.name);
      if (found) matchedExercises.push(found);
      else {
        const fallback = exerciseLibrary.find(e => e.category === "Glutes");
        if (fallback) matchedExercises.push(fallback);
      }
    }
    
    if (matchedExercises.length > 0) {
      setWorkoutExercises(matchedExercises);
      setSelectedPreset(presetId);
      setCurrentExerciseIndex(0);
      setCurrentSet(1);
      setWorkoutTimer(0);
      setRestTimer(0);
      setActiveWorkout(true);
      speak(`Starting ${preset.name}! First exercise: ${matchedExercises[0].name}. Let's go!`);
    }
  };

  const startExercise = () => {
    if (workoutExercises.length === 0) return;
    const exercise = workoutExercises[currentExerciseIndex];
    speak(`Go! ${exercise.name}. Set ${currentSet} of ${exercise.sets}.`);
    setWorkoutTimer(45);
  };

  const completeSet = () => {
    if (workoutExercises.length === 0) return;
    const exercise = workoutExercises[currentExerciseIndex];
    
    if (currentSet < exercise.sets) {
      setCurrentSet(currentSet + 1);
      setRestTimer(exercise.restSeconds);
      speak(`Great! Rest for ${exercise.restSeconds} seconds.`);
    } else if (currentExerciseIndex < workoutExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      const nextExercise = workoutExercises[currentExerciseIndex + 1];
      setRestTimer(30);
      speak(`Set complete! Next exercise: ${nextExercise.name}.`);
    } else {
      finishWorkout();
    }
  };

  const skipRest = () => {
    setRestTimer(0);
  };

  const finishWorkout = () => {
    const duration = workoutTimer;
    setWorkoutHistory([...workoutHistory, {
      date: new Date().toISOString().split("T")[0],
      exercises: workoutExercises.length,
      duration: duration
    }]);
    setActiveWorkout(false);
    setWorkoutExercises([]);
    speak(`Workout complete! Great job! You did ${workoutExercises.length} exercises.`);
    alert(`🎉 Workout Complete!\n\nExercises: ${workoutExercises.length}\nDuration: ${Math.floor(duration / 60)} min`);
  };

  const selectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const addToWorkout = (exercise: Exercise) => {
    setWorkoutExercises([...workoutExercises, exercise]);
  };

  const removeFromWorkout = (index: number) => {
    const updated = [...workoutExercises];
    updated.splice(index, 1);
    setWorkoutExercises(updated);
  };

  const getAdvisorRecommendations = async () => {
    if (!advisorInput.trim()) return;
    
    setAdvisorLoading(true);
    setAdvisorMessage("");
    setAdvisorRecommendations([]);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          messages: [{
            role: "user",
            content: `You are a fitness advisor. Based on user's request, recommend exercises from this list only: ${exerciseLibrary.map(e => `${e.name} (targets: ${e.muscles.join(", ")}, category: ${e.category})`).join(" | ")}.

User request: "${advisorInput}"

Respond in this exact JSON format:
{"recommendations": ["exercise1", "exercise2", ...], "message": "Your personalized advice"}`
          }]
        })
      });

      const data = await response.json();
      const content = data.content?.[0]?.text || "";
      
      try {
        const parsed = JSON.parse(content);
        const recommendedExercises = exerciseLibrary.filter(e => 
          parsed.recommendations?.includes(e.name)
        );
        setAdvisorRecommendations(recommendedExercises);
        setAdvisorMessage(parsed.message || "");
        
        if (reminders.voice.enabled && parsed.message) {
          speak(parsed.message);
        }
      } catch {
        const matchedExercises = exerciseLibrary.filter(e => 
          content.toLowerCase().includes(e.name.toLowerCase())
        );
        setAdvisorRecommendations(matchedExercises.slice(0, 4));
        setAdvisorMessage(content.substring(0, 200));
      }
    } catch (error) {
      const keywords = advisorInput.toLowerCase();
      let filtered = exerciseLibrary;
      
      if (keywords.includes("glute") || keywords.includes("booty") || keywords.includes("butt")) {
        filtered = exerciseLibrary.filter(e => e.category === "Glutes");
      } else if (keywords.includes("chest") || keywords.includes("push")) {
        filtered = exerciseLibrary.filter(e => e.category === "Chest");
      } else if (keywords.includes("leg") || keywords.includes("quad") || keywords.includes("thigh")) {
        filtered = exerciseLibrary.filter(e => e.category === "Legs" || e.category === "Hamstrings");
      } else if (keywords.includes("inner") || keywords.includes("adductor")) {
        filtered = exerciseLibrary.filter(e => e.category === "Inner Thighs");
      }
      
      setAdvisorRecommendations(filtered.slice(0, 4));
      setAdvisorMessage("Here are exercises that match your goals based on your input!");
    }

    setAdvisorLoading(false);
  };

  useEffect(() => {
    if (activeWorkout && workoutTimer > 0) {
      const timer = setInterval(() => {
        setWorkoutTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeWorkout, workoutTimer]);

  useEffect(() => {
    if (activeWorkout && restTimer > 0) {
      const timer = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            speak("Rest complete! Time for your next set!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeWorkout, restTimer]);

  const currentWeight = measurements[measurements.length - 1].weight;
  const currentWaist = measurements[measurements.length - 1].waist;
  const weightProgress = Math.round(
    (1 - (currentWeight - 72.5) / 12) * 100
  );
  const waistProgress = Math.round((1 - (currentWaist - 25) / 14) * 100);

  const themeClasses = {
    dark: "bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] text-white",
    light: "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900",
    ocean: "bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-900 text-white",
    sunset: "bg-gradient-to-br from-orange-950 via-red-900 to-pink-900 text-white",
    forest: "bg-gradient-to-br from-green-950 via-emerald-900 to-teal-900 text-white",
    purple: "bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-900 text-white",
  };

  return (
    <div className={`min-h-screen ${themeClasses[theme] || themeClasses.dark}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#d85a30] to-[#e67e50] px-6 py-6 text-center shadow-lg shadow-orange-500/30">
        <h1 className="mb-1 text-3xl font-bold">Picture 1 Pro 🔥</h1>
        <p className="text-sm opacity-95">
          Advanced transformation tracking • Form analysis • AI coaching
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-orange-500/20 bg-[#1a1a1a]">
        {[
          { id: "dashboard", label: "📊 Dashboard" },
          { id: "workout", label: "💪 Workout" },
          { id: "advisor", label: "🤖 Advisor" },
          { id: "photos", label: "📸 Progress" },
          { id: "form", label: "🎥 Form Check" },
          { id: "reports", label: "📈 Reports" },
          { id: "chat", label: "💬 Coach" },
          { id: "settings", label: "⚙️ Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[80px] px-4 py-4 text-xs font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? "bg-orange-500/20 text-[#d85a30] border-[#d85a30]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#d85a30]">
              Your Progress Dashboard
            </h2>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricCard
                icon="⚖️"
                label="Weight"
                value={`${currentWeight}kg`}
                target="Target: 72.5kg"
                progress={weightProgress}
                color="#ffc864"
              />
              <MetricCard
                icon="📏"
                label="Waist"
                value={`${currentWaist}"`}
                target="Target: 25&quot;"
                progress={waistProgress}
                color="#d85a30"
              />
              <MetricCard
                icon="🦵"
                label="Thighs"
                value='25"'
                target="Target: 22.5&quot;"
                progress={50}
                color="#6496ff"
              />
              <MetricCard
                icon="✨"
                label="Inner Thighs"
                value='27"'
                target="Target: 23.5&quot;"
                progress={40}
                color="#00ff88"
              />
              <MetricCard
                icon="📊"
                label="Body Fat"
                value="30%"
                target="Target: 21%"
                progress={55}
                color="#ff6b9d"
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <div className="text-3xl mb-1">💧</div>
                <div className="text-xs text-gray-400">Water Today</div>
                <div className="text-2xl font-semibold mt-1">{waterCount}/5L</div>
                <button
                  onClick={addWater}
                  className="w-full mt-3 py-2 bg-orange-500/20 border border-dashed border-orange-500/40 rounded-lg text-[#d85a30] text-xs font-semibold hover:bg-orange-500/30 transition-colors"
                >
                  +1L
                </button>
              </div>
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <div className="text-3xl mb-1">💪</div>
                <div className="text-xs text-gray-400">This Week</div>
                <div className="text-2xl font-semibold mt-1">5/6 Workouts</div>
                <div className="text-xs text-gray-500 mt-1">85% adherence</div>
              </div>
            </div>

            {/* Log Measurements Button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full py-3 bg-orange-500/20 border border-dashed border-orange-500/40 rounded-lg text-[#d85a30] font-semibold hover:bg-orange-500/30 transition-colors"
            >
              + Log New Measurements
            </button>

            {/* Measurement Form */}
            {showForm && (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-[#d85a30] mb-4">
                  New Measurements
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Weight (kg)"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm placeholder:text-white/30"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Waist (inches)"
                    value={waistInput}
                    onChange={(e) => setWaistInput(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm placeholder:text-white/30"
                  />
                </div>
                <button
                  onClick={saveMeasurements}
                  className="w-full py-2 bg-[#d85a30] border-none rounded text-white font-semibold text-sm hover:bg-[#e67e50] transition-colors"
                >
                  Save Measurements
                </button>
              </div>
            )}

            {/* Achievements */}
            <div>
              <h3 className="text-sm font-semibold text-[#d85a30] mb-4">
                🏆 Achievements
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Achievement icon="💧" title="Water Warrior" unlocked />
                <Achievement icon="💪" title="Core Crusher" unlocked />
                <Achievement icon="🔥" title="7-Day Streak" />
                <Achievement icon="🎯" title="Perfect Macros" />
              </div>
            </div>
          </div>
        )}

        {/* Workout Tab */}
        {activeTab === "workout" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#d85a30]">
              💪 Workout Session
            </h2>

            {/* Preset Workouts */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <div className="text-sm font-semibold text-orange-400 mb-3">📋 Quick Start Workouts</div>
              <div className="grid grid-cols-2 gap-2">
                {presetWorkouts.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => loadPresetWorkout(preset.id)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      selectedPreset === preset.id 
                        ? "bg-orange-500/30 border border-orange-500" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">{preset.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{preset.exercises.length} exercises</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Workout */}
            {activeWorkout && workoutExercises.length > 0 && (
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6">
                <div className="text-center mb-6">
                  <div className="text-xs text-gray-400 mb-2">CURRENT EXERCISE</div>
                  <div className="text-2xl font-bold text-white mb-2">
                    {workoutExercises[currentExerciseIndex]?.name}
                  </div>
                  <div className="text-lg text-orange-400">
                    Set {currentSet} of {workoutExercises[currentExerciseIndex]?.sets}
                  </div>
                </div>

                {/* Video Player */}
                <div className="aspect-video bg-black/50 rounded-lg mb-4 overflow-hidden">
                  {workoutExercises[currentExerciseIndex]?.videoUrl && workoutExercises[currentExerciseIndex]?.videoUrl !== "placeholder" ? (
                    <div className="relative w-full h-full">
                      <iframe
                        src={workoutExercises[currentExerciseIndex]?.videoUrl?.replace("youtube.com/embed/", "youtube.com/embed/") + "?autoplay=1"}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-500/20 to-red-500/20">
                      <div className="text-6xl mb-4">💪</div>
                      <div className="text-xl font-bold text-white">{workoutExercises[currentExerciseIndex]?.name}</div>
                      <div className="text-sm text-gray-400 mt-2">{workoutExercises[currentExerciseIndex]?.category}</div>
                      <div className="text-xs text-gray-500 mt-4">Follow the instructions below</div>
                    </div>
                  )}
                </div>

                {/* Exercise Instructions */}
                <div className="bg-black/30 rounded-lg p-4 mb-4">
                  <div className="text-xs text-gray-400 mb-2">INSTRUCTIONS</div>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">
                    {workoutExercises[currentExerciseIndex]?.instructions}
                  </pre>
                </div>

                {/* Timer Display */}
                <div className="flex justify-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">SETS x REPS</div>
                    <div className="text-2xl font-bold text-white">
                      {workoutExercises[currentExerciseIndex]?.sets} x {workoutExercises[currentExerciseIndex]?.reps}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">REST</div>
                    <div className={`text-2xl font-bold ${restTimer > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {restTimer > 0 ? `${restTimer}s` : '--'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {restTimer > 0 ? (
                    <button
                      onClick={skipRest}
                      className="flex-1 py-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-400 font-semibold hover:bg-yellow-500/30"
                    >
                      ⏭️ Skip Rest
                    </button>
                  ) : (
                    <button
                      onClick={startExercise}
                      className="flex-1 py-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 font-semibold hover:bg-green-500/30"
                    >
                      ▶️ Start Set
                    </button>
                  )}
                  <button
                    onClick={completeSet}
                    className="flex-1 py-3 bg-[#d85a30] border-none rounded-lg text-white font-semibold hover:bg-[#e67e50]"
                  >
                    ✓ Complete Set
                  </button>
                </div>
                <button
                  onClick={finishWorkout}
                  className="w-full mt-3 py-2 border border-red-500/30 rounded-lg text-red-400 text-sm hover:bg-red-500/10"
                >
                  🛑 End Workout
                </button>
              </div>
            )}

            {/* Exercise Library (when not in active workout) */}
            {!activeWorkout && (
              <>
                {/* Workout Queue */}
                {workoutExercises.length > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold">
                        📋 Your Workout ({workoutExercises.length} exercises)
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startWorkout(workoutExercises)}
                          className="px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 text-xs font-semibold hover:bg-green-500/30"
                        >
                          ▶️ Start
                        </button>
                        <button
                          onClick={() => setWorkoutExercises([])}
                          className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-xs font-semibold hover:bg-red-500/30"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {workoutExercises.map((ex, i) => (
                        <div key={i} className="flex items-center justify-between bg-black/20 rounded px-3 py-2">
                          <div className="text-xs">
                            <span className="text-orange-400">{i + 1}.</span> {ex.name}
                            <span className="text-gray-500 ml-2">{ex.sets}x{ex.reps}</span>
                          </div>
                          <button
                            onClick={() => removeFromWorkout(i)}
                            className="text-red-400 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {workoutCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === cat
                          ? "bg-orange-500 text-white"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Exercise Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exerciseLibrary
                    .filter((ex) => selectedCategory === "All" || ex.category === selectedCategory)
                    .map((exercise) => (
                      <div
                        key={exercise.id}
                        className="bg-orange-500/5 border border-orange-500/20 rounded-lg overflow-hidden"
                      >
                        {/* Video Preview - Thumbnail with Play Button */}
                        <div className="aspect-video bg-black/50 relative">
                          {exercise.videoUrl && exercise.videoUrl !== "placeholder" ? (
                            <>
                              <img 
                                src={`https://img.youtube.com/vi/${exercise.videoUrl.split('/').pop()}/hqdefault.jpg`}
                                alt={exercise.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
                                   onClick={() => window.open(exercise.videoUrl?.replace('embed/', 'watch?v='), '_blank')}>
                                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-500/10 to-red-500/10">
                              <div className="text-4xl mb-2">🏋️</div>
                              <div className="text-sm font-bold text-white text-center px-2">{exercise.name}</div>
                              <div className="text-xs text-gray-400 mt-1">{exercise.category}</div>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-semibold text-sm">{exercise.name}</div>
                              <div className="text-xs text-gray-400">{exercise.category}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-orange-400 font-semibold text-sm">
                                {exercise.sets} x {exercise.reps}
                              </div>
                              <div className="text-xs text-gray-500">{exercise.restSeconds}s rest</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {exercise.muscles.map((muscle) => (
                              <span
                                key={muscle}
                                className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400"
                              >
                                {muscle}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => selectExercise(exercise)}
                              className="flex-1 py-2 bg-orange-500/20 border border-orange-500/40 rounded text-orange-400 text-xs font-semibold hover:bg-orange-500/30"
                            >
                              👁️ View
                            </button>
                            <button
                              onClick={() => addToWorkout(exercise)}
                              className="flex-1 py-2 bg-green-500/20 border border-green-500/40 rounded text-green-400 text-xs font-semibold hover:bg-green-500/30"
                            >
                              ➕ Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Exercise Detail Modal */}
                {selectedExercise && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1a1a2e] border border-orange-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold">{selectedExercise.name}</h3>
                            <div className="text-sm text-gray-400">{selectedExercise.category}</div>
                          </div>
                          <button
                            onClick={() => setSelectedExercise(null)}
                            className="text-gray-400 hover:text-white text-2xl"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden relative">
                          {selectedExercise.videoUrl && selectedExercise.videoUrl !== "placeholder" ? (
                            <>
                              <img 
                                src={`https://img.youtube.com/vi/${selectedExercise.videoUrl.split('/').pop()}/hqdefault.jpg`}
                                alt={selectedExercise.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
                                   onClick={() => window.open(selectedExercise.videoUrl?.replace('embed/', 'watch?v='), '_blank')}>
                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-500/20 to-red-500/20">
                              <div className="text-6xl mb-4">💪</div>
                              <div className="text-2xl font-bold text-white">{selectedExercise.name}</div>
                              <div className="text-sm text-gray-400 mt-2">{selectedExercise.category}</div>
                              <div className="text-xs text-gray-500 mt-4">Follow instructions below</div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-orange-500/10 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-400">Sets</div>
                            <div className="text-xl font-bold text-orange-400">{selectedExercise.sets}</div>
                          </div>
                          <div className="bg-orange-500/10 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-400">Reps</div>
                            <div className="text-xl font-bold text-orange-400">{selectedExercise.reps}</div>
                          </div>
                          <div className="bg-orange-500/10 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-400">Rest</div>
                            <div className="text-xl font-bold text-orange-400">{selectedExercise.restSeconds}s</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-xs text-gray-400 mb-2">TARGET MUSCLES</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedExercise.muscles.map((muscle) => (
                              <span
                                key={muscle}
                                className="px-3 py-1 bg-orange-500/20 rounded-full text-xs text-orange-400"
                              >
                                {muscle}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-xs text-gray-400 mb-2">INSTRUCTIONS</div>
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-black/30 rounded-lg p-4">
                            {selectedExercise.instructions}
                          </pre>
                        </div>

                        <button
                          onClick={() => {
                            addToWorkout(selectedExercise);
                            setSelectedExercise(null);
                          }}
                          className="w-full py-3 bg-[#d85a30] border-none rounded-lg text-white font-semibold hover:bg-[#e67e50]"
                        >
                          ➕ Add to Workout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Exercise Advisor Tab */}
        {activeTab === "advisor" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#d85a30]">
              🤖 AI Exercise Advisor
            </h2>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-sm text-gray-400">
                  Tell me your goals, preferences, or concerns
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={advisorInput}
                  onChange={(e) => setAdvisorInput(e.target.value)}
                  placeholder="e.g., I want to build glutes, or my legs are weak, or I have back pain..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30"
                />
                <button
                  onClick={getAdvisorRecommendations}
                  disabled={advisorLoading || !advisorInput.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 border-none rounded-lg text-white font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                >
                  {advisorLoading ? "🤔 Analyzing..." : "🔮 Get Recommendations"}
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="mt-4">
                <div className="text-xs text-gray-400 mb-2">Quick prompts:</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Build glutes",
                    "Leg day",
                    "Inner thighs",
                    "Chest workout",
                    "Hamstrings",
                    "Full body"
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setAdvisorInput(prompt);
                        setTimeout(() => getAdvisorRecommendations(), 100);
                      }}
                      className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advisor Message */}
            {advisorMessage && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="text-xs text-purple-400 mb-2">💡 Advisor Says:</div>
                <div className="text-sm text-gray-300">{advisorMessage}</div>
              </div>
            )}

            {/* Recommendations */}
            {advisorRecommendations.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-gray-400 mb-3">
                  Recommended Exercises:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advisorRecommendations.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="bg-orange-500/5 border border-orange-500/20 rounded-lg overflow-hidden"
                    >
                      <div className="aspect-video bg-black/50 relative">
                        {exercise.videoUrl && exercise.videoUrl !== "placeholder" ? (
                          <>
                            <img 
                              src={`https://img.youtube.com/vi/${exercise.videoUrl.split('/').pop()}/hqdefault.jpg`}
                              alt={exercise.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
                                 onClick={() => window.open(exercise.videoUrl?.replace('embed/', 'watch?v='), '_blank')}>
                              <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                            <div className="text-4xl mb-2">🏋️</div>
                            <div className="text-sm font-bold text-white text-center px-2">{exercise.name}</div>
                            <div className="text-xs text-gray-400 mt-1">{exercise.category}</div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-sm">{exercise.name}</div>
                            <div className="text-xs text-gray-400">{exercise.category}</div>
                          </div>
                          <div className="text-orange-400 font-semibold text-sm">
                            {exercise.sets} x {exercise.reps}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {exercise.muscles.map((muscle) => (
                            <span
                              key={muscle}
                              className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedExercise(exercise)}
                            className="flex-1 py-2 bg-orange-500/20 border border-orange-500/40 rounded text-orange-400 text-xs font-semibold hover:bg-orange-500/30"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => addToWorkout(exercise)}
                            className="flex-1 py-2 bg-green-500/20 border border-green-500/40 rounded text-green-400 text-xs font-semibold hover:bg-green-500/30"
                          >
                            ➕ Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!advisorLoading && advisorRecommendations.length === 0 && !advisorMessage && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">💬</div>
                <div className="text-sm">Ask me anything about exercises!</div>
                <div className="text-xs mt-2">I'll recommend the best exercises for your goals</div>
              </div>
            )}
          </div>
        )}

        {/* Progress Photos Tab */}
        {activeTab === "photos" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#d85a30]">
              📸 Visual Progress
            </h2>
            <button
              onClick={addProgressPhoto}
              className="w-full py-3 bg-orange-500/20 border border-dashed border-orange-500/40 rounded-lg text-[#d85a30] font-semibold hover:bg-orange-500/30 transition-colors"
            >
              + Add Progress Photo
            </button>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <div
                  key={i}
                  className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center"
                >
                  <div className="text-4xl mb-2">{photo.img}</div>
                  <div className="text-xs font-semibold text-[#d85a30]">
                    {photo.week}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{photo.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Check Tab */}
        {activeTab === "form" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#d85a30]">
              🎥 Form Check Video
            </h2>
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#d85a30] mb-4">
                Submit Your Form Video
              </h3>
              <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm mb-4">
                {exerciseLibrary.map((ex) => (
                  <option key={ex.id} className="bg-[#1a1a2e]">
                    {ex.name}
                  </option>
                ))}
              </select>
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 mb-4 text-sm text-gray-300">
                <span className="text-green-400 font-semibold">How to submit:</span>
                <div className="mt-2 space-y-1">
                  <div>1. Record 30 sec video of your exercise form</div>
                  <div>2. Send video link or upload via chat</div>
                  <div>3. AI coach analyzes form and gives feedback</div>
                  <div>4. Track improvements over weeks</div>
                </div>
              </div>
              <button
                onClick={() =>
                  alert(
                    "Submit form videos through the Coach chat tab! Record 30 seconds showing full range of motion."
                  )
                }
                className="w-full py-3 bg-[#d85a30] border-none rounded-lg text-white font-semibold hover:bg-[#e67e50] transition-colors"
              >
                📱 Submit Form Video
              </button>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#d85a30]">
              📊 Weekly Report
            </h2>
            <button
              onClick={downloadReport}
              className="w-full py-3 bg-[#d85a30] border-none rounded-lg text-white font-semibold hover:bg-[#e67e50] transition-colors"
            >
              ⬇️ Download Report
            </button>
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-6 whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-300 max-h-96 overflow-y-auto">
              {`WEEKLY TRANSFORMATION REPORT
════════════════════════════════════════
Week: ${measurements.length}
Program: Picture 1 (Curvy + Lean)

MEASUREMENTS
Weight: ${currentWeight}kg → Target: 70-75kg (${weightProgress}% progress)
Waist: ${currentWaist}" → Target: 24-26" (${waistProgress}% progress)
Thighs: 25" → Target: 22-23"
Body Fat: 30% → Target: 20-22%

ACTIVITY
Workouts: 5/6 completed
Water Days: ${waterCount}/7 (5+ liters)
Adherence: 85%

ACHIEVEMENTS 🏆
💧 Water Warrior - Consistent hydration
💪 Core Crusher - 50+ core exercises

NEXT WEEK GOALS
→ Complete all 6 workouts
→ 7/7 water days (5+ liters)
→ Inner thigh work 3x per week
→ Wednesday cardio non-negotiable

COACH NOTES
You're making solid progress! Focus on:
• Core 6x/week for waist definition
• Inner thigh exercises 3x weekly
• 5+ liters water daily
• Rest 7-9 hours nightly
• Light leg work only`}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#d85a30]">
              🏋️ AI Fitness Coach
            </h2>
            <div className="bg-[#1a1a1a] rounded-xl p-4 h-[500px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-lg text-sm ${
                        msg.role === "user"
                          ? "bg-orange-500/20 border border-orange-500/40"
                          : "bg-orange-500/5 border border-orange-500/20"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-orange-500/5 border border-orange-500/20 px-4 py-3 rounded-lg text-sm">
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about workouts, nutrition, form, or motivation..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-[#d85a30] border-none rounded-lg text-white font-semibold text-sm hover:bg-[#e67e50] transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#d85a30]">
              ⚙️ Settings & Reminders
            </h2>

            {/* Theme Selector */}
            <div className="border rounded-lg p-4 bg-orange-500/5 border-orange-500/20">
              <div className="text-sm font-semibold mb-3">🎨 App Theme</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "dark", name: "Dark", color: "from-gray-900 to-gray-800", icon: "🌙" },
                  { id: "light", name: "Light", color: "from-gray-100 to-gray-200", icon: "☀️" },
                  { id: "ocean", name: "Ocean", color: "from-blue-900 to-cyan-800", icon: "🌊" },
                  { id: "sunset", name: "Sunset", color: "from-orange-900 to-pink-800", icon: "🌅" },
                  { id: "forest", name: "Forest", color: "from-green-900 to-emerald-800", icon: "🌲" },
                  { id: "purple", name: "Purple", color: "from-purple-900 to-pink-800", icon: "✨" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as typeof theme)}
                    className={`p-3 rounded-lg transition-all ${
                      theme === t.id 
                        ? "ring-2 ring-orange-500 bg-gradient-to-br " + t.color 
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-xl mb-1">{t.icon}</div>
                    <div className={`text-xs font-medium ${theme === t.id ? "text-white" : "text-gray-400"}`}>
                      {t.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Permission */}
            {notificationPermission !== "granted" && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-yellow-400">
                      Enable Notifications
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Get reminders for workouts, water, and meals
                    </div>
                  </div>
                  <button
                    onClick={requestNotificationPermission}
                    className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-400 text-sm font-semibold hover:bg-yellow-500/30"
                  >
                    Enable
                  </button>
                </div>
              </div>
            )}

            {/* Notification Toggle */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Push Notifications</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Status: {notificationPermission}
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateReminder("notifications", "enabled", !reminders.notifications.enabled)
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    reminders.notifications.enabled
                      ? "bg-green-500"
                      : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      reminders.notifications.enabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Voice Toggle */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Voice Announcements</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Text-to-speech for coach and reminders
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateReminder("voice", "enabled", !reminders.voice.enabled)
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    reminders.voice.enabled ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      reminders.voice.enabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {reminders.voice.enabled && (
                <div className="mt-3">
                  <div className="text-xs text-gray-400 mb-2">
                    Volume: {reminders.voice.volume}%
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={reminders.voice.volume}
                    onChange={(e) =>
                      updateReminder("voice", "volume", parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <button
                    onClick={testVoice}
                    disabled={isSpeaking}
                    className="mt-2 px-3 py-1 bg-orange-500/20 rounded text-xs text-[#d85a30] hover:bg-orange-500/30 disabled:opacity-50"
                  >
                    {isSpeaking ? "🔊 Playing..." : "🔊 Test Voice"}
                  </button>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="mt-2 ml-2 px-3 py-1 bg-red-500/20 rounded text-xs text-red-400 hover:bg-red-500/30"
                    >
                      Stop
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Workout Reminders */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold">💪 Workout Reminders</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Daily workout schedule
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateReminder("workout", "enabled", !reminders.workout.enabled)
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    reminders.workout.enabled ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      reminders.workout.enabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {reminders.workout.enabled && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Time:</label>
                    <input
                      type="time"
                      value={reminders.workout.time}
                      onChange={(e) =>
                        updateReminder("workout", "time", e.target.value)
                      }
                      className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          reminders.workout.days.includes(day)
                            ? "bg-orange-500 text-white"
                            : "bg-white/5 text-gray-400"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Water Reminders */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold">💧 Water Reminders</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Stay hydrated throughout the day
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateReminder("water", "enabled", !reminders.water.enabled)
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    reminders.water.enabled ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      reminders.water.enabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {reminders.water.enabled && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Remind every:</label>
                    <select
                      value={reminders.water.intervalHours}
                      onChange={(e) =>
                        updateReminder("water", "intervalHours", parseInt(e.target.value))
                      }
                      className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm"
                    >
                      <option value="1">1 hour</option>
                      <option value="2">2 hours</option>
                      <option value="3">3 hours</option>
                      <option value="4">4 hours</option>
                    </select>
                  </div>
                  <button
                    onClick={testNotification}
                    className="px-3 py-1 bg-orange-500/20 rounded text-xs text-[#d85a30] hover:bg-orange-500/30"
                  >
                    🧪 Test Notification
                  </button>
                </div>
              )}
            </div>

            {/* Meal Reminders */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold">🍽️ Meal & Diet Reminders</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Breakfast, lunch, dinner, snacks
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateReminder("meals", "enabled", !reminders.meals.enabled)
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    reminders.meals.enabled ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      reminders.meals.enabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {reminders.meals.enabled && (
                <div className="space-y-2">
                  {[
                    { key: "breakfast", label: "🌅 Breakfast" },
                    { key: "lunch", label: "☀️ Lunch" },
                    { key: "dinner", label: "🌙 Dinner" },
                    { key: "snacks", label: "🍎 Snacks" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-xs text-gray-400">{label}</label>
                      <input
                        type="time"
                        value={reminders.meals[key as keyof typeof reminders.meals] as string}
                        onChange={(e) =>
                          updateReminder("meals", key, e.target.value)
                        }
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Check-in Reminders */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold">📊 Progress Check-in</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Weekly weigh-in reminder
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateReminder("progress", "enabled", !reminders.progress.enabled)
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    reminders.progress.enabled ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      reminders.progress.enabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {reminders.progress.enabled && (
                <div className="flex items-center gap-2">
                  <select
                    value={reminders.progress.day}
                    onChange={(e) =>
                      updateReminder("progress", "day", e.target.value)
                    }
                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm"
                  >
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
                      (day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      )
                    )}
                  </select>
                  <input
                    type="time"
                    value={reminders.progress.time}
                    onChange={(e) =>
                      updateReminder("progress", "time", e.target.value)
                    }
                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* Reset Settings */}
            <button
              onClick={() => {
                if (confirm("Reset all settings to default?")) {
                  setReminders(defaultReminders);
                }
              }}
              className="w-full py-2 border border-red-500/30 rounded-lg text-red-400 text-sm hover:bg-red-500/10"
            >
              🔄 Reset to Default
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  target,
  progress,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  target: string;
  progress: number;
  color: string;
}) {
  return (
    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4 text-center">
      <div className="text-xl mb-2">{icon}</div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-semibold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{target}</div>
      <div className="w-full h-[3px] bg-white/10 rounded mt-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#d85a30] to-[#e67e50] transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}

function Achievement({
  icon,
  title,
  unlocked,
}: {
  icon: string;
  title: string;
  unlocked?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 text-center ${
        unlocked
          ? "bg-yellow-500/10 border border-yellow-500/30"
          : "bg-white/5 border border-white/10 opacity-50"
      }`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs font-semibold">{title}</div>
      {unlocked && <div className="text-xs text-green-400 mt-1">✅ Unlocked</div>}
    </div>
  );
}
