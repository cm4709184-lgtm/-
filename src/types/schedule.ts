export interface Course {
  name: string;
  teacher: string;
  location: string;
  dayOfWeek: number;
  period: number;
  weeks: number[];
  weekType?: 'odd' | 'even' | 'all';
}

export interface Schedule {
  currentWeek: number;
  totalWeeks: number;
  courses: Course[];
}

export interface SemesterConfig {
  startDate: string;
  label: string;
}

export interface ScheduleStore {
  schedule: Schedule | null;
  selectedWeek: number;
  isLoading: boolean;
  error: string | null;
  semesterStart: string;
  semesterLabel: string;
  skipPromptUntil: string | null;
  lastUpdated: string | null;
  setSchedule: (schedule: Schedule) => void;
  setSelectedWeek: (week: number) => void;
  parseExcelFile: (file: File) => Promise<void>;
  reset: () => void;
  setSemesterStart: (date: string, label: string) => void;
  snoozeSemesterPrompt: () => void;
  setLastUpdated: (date: string) => void;
}
