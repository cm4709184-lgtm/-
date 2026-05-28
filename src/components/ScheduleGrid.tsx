import React, { useMemo } from 'react';
import { Course } from '../types/schedule';
import { CourseCard } from './CourseCard';
import { getPeriodLabel, formatPeriodTime, getCourseDate, formatDate, getCurrentWeek } from '../utils/dateUtils';
import { useScheduleStore } from '../store/scheduleStore';

interface ScheduleGridProps {
  courses: Course[];
  selectedWeek: number;
  acrylic?: boolean;
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ courses, selectedWeek, acrylic }) => {
  const semesterStart = useScheduleStore((s) => s.semesterStart);

  const todayDayOfWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    return day === 0 ? 7 : day;
  }, []);

  const isCurrentWeek = useMemo(() => {
    const curr = getCurrentWeek(semesterStart, 20);
    return curr === selectedWeek;
  }, [selectedWeek, semesterStart]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const isWeekMatch = course.weeks.includes(selectedWeek);

      if (!isWeekMatch) return false;

      if (course.weekType) {
        if (course.weekType === 'odd' && selectedWeek % 2 === 0) return false;
        if (course.weekType === 'even' && selectedWeek % 2 === 1) return false;
      }

      return true;
    });
  }, [courses, selectedWeek]);

  const scheduleData = useMemo(() => {
    const grid: Record<number, Course[]> = {};

    for (let day = 1; day <= 7; day++) {
      grid[day] = [];
    }

    filteredCourses.forEach(course => {
      if (grid[course.dayOfWeek]) {
        grid[course.dayOfWeek].push(course);
      }
    });

    for (let day = 1; day <= 7; day++) {
      grid[day].sort((a, b) => a.period - b.period);
    }

    return grid;
  }, [filteredCourses]);

  const dayHasCourses = useMemo(() => {
    return DAYS.map((_, index) => {
      const dayNum = index + 1;
      return {
        dayNum,
        hasCourses: scheduleData[dayNum] && scheduleData[dayNum].length > 0
      };
    });
  }, [scheduleData]);

  const hasAnyCourses = dayHasCourses.some(d => d.hasCourses);

  return (
    <div className="space-y-3">
      {dayHasCourses.map(({ dayNum, hasCourses }) => {
        const dayName = DAYS[dayNum - 1];
        const isToday = isCurrentWeek && dayNum === todayDayOfWeek;

        if (!hasCourses) return null;

        const dayCourses = scheduleData[dayNum] || [];
        const weekDate = getCourseDate(semesterStart, selectedWeek, dayNum);

        return (
          <div key={dayNum} className={`rounded-2xl shadow-sm overflow-hidden transition-colors duration-300 ${
            isToday
              ? (acrylic ? 'bg-black/20 border border-green-400/50' : 'bg-green-50/80 ring-2 ring-green-400 ring-offset-1')
              : (acrylic ? 'bg-black/20 border border-white/25' : 'bg-white')
          }`}>
            <div className={`${
              acrylic
                ? 'border-b border-white/20 text-white'
                : isToday
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
            } px-4 py-3`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  {dayName}
                  {isToday && <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">今天</span>}
                </h3>
                <span className={`text-xs ${acrylic && !isToday ? 'text-white/70' : 'opacity-80'}`}>
                  {formatDate(weekDate)}
                </span>
              </div>
            </div>

            <div className="p-3 space-y-2">
              {dayCourses.map((course, idx) => (
                <div key={`${course.name}-${course.period}-${idx}`}>
                  <div className={`text-xs font-medium mb-1.5 px-1 flex items-center gap-2 ${
                    acrylic ? 'text-white' : isToday ? 'text-green-600' : 'text-slate-500'
                  }`}>
                    <span className={`${acrylic ? 'border border-white/20 text-white' : isToday ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'} px-2 py-0.5 rounded`}>
                      {getPeriodLabel(course.period)}
                    </span>
                    <span className={acrylic ? 'text-white/70' : isToday ? 'text-green-500' : 'text-slate-400'}>
                      {formatPeriodTime(course.period)}
                    </span>
                  </div>
                  <CourseCard course={course} highlight={isToday} acrylic={acrylic} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!hasAnyCourses && (
        <div className={`text-center py-12 ${acrylic ? 'bg-black/20 border border-white/25' : 'bg-white'} rounded-2xl shadow-sm`}>
          <p className={`text-sm ${acrylic ? 'text-white' : 'text-slate-500'}`}>本周暂无课程</p>
        </div>
      )}
    </div>
  );
};
