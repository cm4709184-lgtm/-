import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScheduleStore, Schedule } from '../types/schedule';
import { parseExcelFile } from '../utils/excelParser';

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      schedule: null,
      selectedWeek: 1,
      isLoading: false,
      error: null,
      semesterStart: '2026-03-09',
      semesterLabel: '2025-2026 下学期',
      skipPromptUntil: null,
      lastUpdated: null,

      setSchedule: (schedule: Schedule) => {
        set({ 
          schedule, 
          selectedWeek: schedule.currentWeek,
          error: null,
          lastUpdated: new Date().toISOString()
        });
      },

      setSelectedWeek: (week: number) => {
        const { schedule } = get();
        if (schedule && week >= 1 && week <= schedule.totalWeeks) {
          set({ selectedWeek: week });
        }
      },

      parseExcelFile: async (file: File) => {
        set({ isLoading: true, error: null });
        
        try {
          const schedule = await parseExcelFile(file);
          set({ 
            schedule, 
            selectedWeek: schedule.currentWeek,
            isLoading: false,
            error: null,
            lastUpdated: new Date().toISOString()
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '解析失败',
            isLoading: false 
          });
        }
      },

      setSemesterStart: (date: string, label: string) => {
        set({ semesterStart: date, semesterLabel: label, skipPromptUntil: null });
      },

      snoozeSemesterPrompt: () => {
        const snoozeDate = new Date();
        snoozeDate.setMonth(snoozeDate.getMonth() + 1);
        set({ skipPromptUntil: snoozeDate.toISOString() });
      },

      setLastUpdated: (date: string) => {
        set({ lastUpdated: date });
      },

      reset: () => {
        set({
          schedule: null,
          selectedWeek: 1,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'schedule-storage',
    }
  )
);
