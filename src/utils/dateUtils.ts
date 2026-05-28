export interface PeriodTime {
  label: string;
  start: string;
  end: string;
}

export const PERIOD_TIMES: Record<number, PeriodTime> = {
  1:  { label: '1-2节',  start: '08:00', end: '09:35' },
  3:  { label: '3-4节',  start: '09:50', end: '11:25' },
  5:  { label: '5节',    start: '11:30', end: '12:15' },
  6:  { label: '6-7节',  start: '13:30', end: '15:05' },
  8:  { label: '8-9节',  start: '15:20', end: '16:55' },
  10: { label: '10-11节',start: '18:30', end: '20:05' },
  12: { label: '12节',   start: '20:10', end: '20:55' },
};

export function formatPeriodTime(period: number): string {
  const pt = PERIOD_TIMES[period];
  if (!pt) return '';
  return `${pt.start} - ${pt.end}`;
}

export function getPeriodStartMinutes(period: number): number {
  const pt = PERIOD_TIMES[period];
  if (!pt) return 0;
  const [h, m] = pt.start.split(':').map(Number);
  return h * 60 + m;
}

export function getPeriodLabel(period: number): string {
  const pt = PERIOD_TIMES[period];
  return pt ? pt.label : `第${period}节`;
}

export function getCourseDate(
  semesterStart: string,
  week: number,
  dayOfWeek: number
): Date {
  const start = new Date(semesterStart);
  start.setHours(0, 0, 0, 0);
  const daysOffset = (week - 1) * 7 + (dayOfWeek - 1);
  const date = new Date(start);
  date.setDate(start.getDate() + daysOffset);
  return date;
}

export function formatDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${month}/${day} ${weekdays[date.getDay()]}`;
}

export function getAllCourseDates(
  semesterStart: string,
  weeks: number[],
  dayOfWeek: number
): Date[] {
  return weeks.map(w => getCourseDate(semesterStart, w, dayOfWeek));
}

export function getLatestCourseDate(schedule: { courses: { weeks: number[]; dayOfWeek: number }[] }, semesterStart: string): Date | null {
  let latest: Date | null = null;
  for (const course of schedule.courses) {
    for (const week of course.weeks) {
      const date = getCourseDate(semesterStart, week, course.dayOfWeek);
      if (!latest || date > latest) latest = date;
    }
  }
  return latest;
}

export function formatChineseDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${y}年${m}月${d}日 ${weekdays[date.getDay()]}`;
}

export function getCurrentWeek(semesterStart: string, totalWeeks: number): number {
  const start = new Date(semesterStart + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  const week = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(week, totalWeeks));
}
