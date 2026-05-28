import React, { useMemo } from 'react';
import { Course } from '../types/schedule';
import { useScheduleStore } from '../store/scheduleStore';
import { getCurrentWeek } from '../utils/dateUtils';

interface TimetableViewProps {
  courses: Course[];
  selectedWeek: number;
  acrylic?: boolean;
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const ROWS = [
  { period: 1,  label: '1-2',   time: '08:00\n09:35', span: 2 },
  { period: 3,  label: '3-4',   time: '09:50\n11:25', span: 2 },
  { period: 5,  label: '5',     time: '11:30\n12:15', span: 1 },
  { period: 6,  label: '6-7',   time: '13:30\n15:05', span: 2 },
  { period: 8,  label: '8-9',   time: '15:20\n16:55', span: 2 },
  { period: 10, label: '10-11', time: '18:30\n20:05', span: 2 },
  { period: 12, label: '12',    time: '20:10\n20:55', span: 1 },
];

export const TimetableView: React.FC<TimetableViewProps> = ({ courses, selectedWeek, acrylic }) => {
  const semesterStart = useScheduleStore((s) => s.semesterStart);

  const todayDayOfWeek = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
  }, []);

  const isCurrentWeek = useMemo(() => {
    const curr = getCurrentWeek(semesterStart, 20);
    return curr === selectedWeek;
  }, [selectedWeek, semesterStart]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      if (!course.weeks.includes(selectedWeek)) return false;
      if (course.weekType === 'odd' && selectedWeek % 2 === 0) return false;
      if (course.weekType === 'even' && selectedWeek % 2 === 1) return false;
      return true;
    });
  }, [courses, selectedWeek]);

  const grid = useMemo(() => {
    const map: Record<number, Record<number, Course>> = {};
    for (const row of ROWS) map[row.period] = {};
    filteredCourses.forEach(c => { if (map[c.period]) map[c.period][c.dayOfWeek] = c; });
    return map;
  }, [filteredCourses]);

  const hasAnyCourses = filteredCourses.length > 0;

  if (!hasAnyCourses) {
    return (
      <div className={`text-center py-12 ${acrylic ? 'bg-black/20 border border-white/25' : 'bg-white'} rounded-2xl shadow-sm`}>
        <p className={`text-sm ${acrylic ? 'text-white' : 'text-slate-500'}`}>本周暂无课程</p>
      </div>
    );
  }

  const getGridRow = (period: number): number => {
    let row = 2;
    for (const r of ROWS) {
      if (r.period === period) return row;
      row += r.span;
    }
    return row;
  };

  return (
    <div className={`rounded-xl overflow-hidden shadow-sm border ${acrylic ? 'bg-black/20 border-white/25' : 'bg-white border-slate-200'}`}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(8, 1fr)`,
        gridAutoRows: '1fr',
      }}>
        <div style={{ gridRow: '1', gridColumn: '1', aspectRatio: '1/1' }}
          className={`border-b border-r flex items-center justify-center text-[10px] font-medium ${acrylic ? 'border-white/20 text-white' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
          节
        </div>
        {DAYS.map((day, idx) => {
          const dayNum = idx + 1;
          const isToday = isCurrentWeek && dayNum === todayDayOfWeek;
          return (
            <div key={day} style={{ gridRow: '1', gridColumn: `${idx + 2}`, aspectRatio: '1/1' }}
              className={`border-b border-r flex items-center justify-center text-[10px] font-medium ${
                acrylic
                  ? (isToday ? 'bg-green-500/30 border-green-400/50 text-white' : 'border-white/20 text-white')
                  : (isToday ? 'bg-green-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-600')
              }`}>
              {day}
            </div>
          );
        })}

        {ROWS.map((row) => {
          const gridRow = getGridRow(row.period);
          const timeParts = row.time.split('\n');
          return (
            <React.Fragment key={row.period}>
              <div style={{ gridRow: `${gridRow} / span ${row.span}`, gridColumn: '1', aspectRatio: row.span > 1 ? '1/2' : '1/1' }}
                className={`border-b border-r flex flex-col items-center justify-center px-0.5 ${acrylic ? 'border-white/20' : 'border-slate-200 bg-slate-50/50'}`}>
                <div className={`text-[10px] font-medium ${acrylic ? 'text-white' : 'text-slate-600'}`}>{row.label}</div>
                <div className={`text-[7px] leading-tight text-center ${acrylic ? 'text-white/70' : 'text-slate-400'}`}>
                  {timeParts[0]}<br />{timeParts[1]}
                </div>
              </div>
              {DAYS.map((_, idx) => {
                const dayNum = idx + 1;
                const isToday = isCurrentWeek && dayNum === todayDayOfWeek;
                const course = grid[row.period]?.[dayNum];
                return (
                  <div key={`${row.period}-${dayNum}`}
                    style={{ gridRow: `${gridRow} / span ${row.span}`, gridColumn: `${idx + 2}`, aspectRatio: row.span > 1 ? '1/2' : '1/1' }}
                    className={`border-b border-r flex items-center justify-center p-px ${
                      acrylic
                        ? (isToday ? 'bg-green-500/10 border-green-400/30' : 'border-white/20')
                        : (isToday ? 'bg-green-50/60' : 'border-slate-200')
                    }`}>
                    {course ? (
                      <div className={`w-full h-full rounded flex flex-col items-center justify-center px-0.5 py-0.5 ${
                        acrylic
                          ? (isToday ? 'border border-green-400/40' : 'border border-white/20')
                          : 'border-0'
                      } ${!acrylic ? (course.name || 'bg-slate-50 border-slate-300 text-slate-700') : ''}`}>
                        <div className={`text-[9px] font-medium text-center leading-tight overflow-hidden ${acrylic ? 'text-white' : ''}`} style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-all'
                        }}>
                          {course.name.length > 4 ? course.name.substring(0, 4) + '...' : course.name}
                        </div>
                        {course.location && (
                          <div className={`text-[7px] text-center mt-px leading-tight break-all ${acrylic ? 'text-white/70' : 'opacity-60'}`}>
                            {course.location}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
