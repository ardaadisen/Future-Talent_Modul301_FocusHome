export const initialInventory = {
  xp: 230,
  level: 1,
  bricks: 14,
  glass: 3,
  roofTiles: 2,
};

export const initialAiParsedTask = {
  title: "Algorithm Study",
  startTime: "2026-05-07T15:00:00+03:00",
  endTime: "2026-05-07T15:45:00+03:00",
  durationMinutes: 45,
  difficulty: "MEDIUM",
  description: "Mock AI parsed focus task for algorithms.",
};

export const initialTodayTasks = [
  {
    id: "t1",
    title: "Math Practice",
    durationMinutes: 45,
    difficulty: "MEDIUM",
    status: "PENDING",
    description: "Derivative and integral review.",
  },
  {
    id: "t2",
    title: "English Reading",
    durationMinutes: 30,
    difficulty: "EASY",
    status: "ACTIVE",
    description: "Read one chapter and summarize key points.",
  },
  {
    id: "t3",
    title: "Physics Homework",
    durationMinutes: 60,
    difficulty: "HARD",
    status: "COMPLETED",
    description: "Finish problem set 4.",
  },
  {
    id: "t4",
    title: "History Notes",
    durationMinutes: 30,
    difficulty: "MEDIUM",
    status: "ABANDONED",
    description: "Review Ottoman reform era notes.",
  },
];

export const initialGrid = [
  ["empty", "wall", "empty", "window", "empty"],
  ["roof", "wall", "empty", "empty", "empty"],
  ["empty", "empty", "empty", "empty", "empty"],
  ["empty", "empty", "wall", "empty", "roof"],
  ["empty", "empty", "empty", "empty", "empty"],
];
