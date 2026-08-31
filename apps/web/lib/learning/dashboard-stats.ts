type CompletionEntry = {
  completedAt: Date | null;
  durationMin: number;
};

const WEEKLY_GOAL_HOURS = 10;

function startOfWeek(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function startOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function buildDashboardStudyStats(completions: CompletionEntry[]) {
  const totalMinutes = completions.reduce(
    (sum, item) => sum + (item.durationMin || 15),
    0,
  );
  const studyHours = Math.round(totalMinutes / 60);

  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekMinutes = completions.reduce((sum, item) => {
    if (!item.completedAt || item.completedAt < weekStart || item.completedAt >= weekEnd) {
      return sum;
    }
    return sum + (item.durationMin || 15);
  }, 0);

  const hoursThisWeek = Math.round((weekMinutes / 60) * 10) / 10;

  const activeDays = Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(dayStart.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return completions.some(
      (item) =>
        item.completedAt &&
        item.completedAt >= dayStart &&
        item.completedAt < dayEnd,
    );
  });

  const completionDays = new Set(
    completions
      .filter((item) => item.completedAt)
      .map((item) => startOfDay(item.completedAt!).toISOString()),
  );

  let streakDays = 0;
  const cursor = startOfDay(new Date());
  while (completionDays.has(cursor.toISOString())) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    studyHours,
    hoursThisWeek,
    weeklyGoalHours: WEEKLY_GOAL_HOURS,
    activeDays,
    streakDays,
  };
}

export function estimateRemainingLabel(
  done: number,
  total: number,
  avgMinutesPerLesson = 25,
) {
  const remaining = Math.max(total - done, 0);
  if (remaining === 0) return "Course complete";
  const hours = Math.max(1, Math.round((remaining * avgMinutesPerLesson) / 60));
  return `${hours} hour${hours === 1 ? "" : "s"} remaining`;
}
