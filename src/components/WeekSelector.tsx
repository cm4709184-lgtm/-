import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface WeekSelectorProps {
  currentWeek: number;
  totalWeeks: number;
  onWeekChange: (week: number) => void;
  acrylic?: boolean;
  isDark?: boolean;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  currentWeek,
  totalWeeks,
  onWeekChange,
  acrylic,
  isDark,
}) => {
  const acrylicText = acrylic ? (isDark ? 'text-white' : 'text-black') : '';

  const handlePrevWeek = () => {
    if (currentWeek > 1) {
      onWeekChange(currentWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeek < totalWeeks) {
      onWeekChange(currentWeek + 1);
    }
  };

  const handleWeekSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onWeekChange(parseInt(e.target.value));
  };

  return (
    <div className={`max-w-lg mx-auto ${acrylic ? 'bg-black/20 border border-white/25' : 'bg-white'} rounded-2xl shadow-sm p-3 sm:p-4`}>
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevWeek}
          disabled={currentWeek <= 1}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center ${acrylic ? 'border border-white/20 hover:bg-white/10' : 'bg-slate-100 hover:bg-blue-50'}`}
          aria-label="上一周"
        >
          <ChevronLeft className={`w-5 h-5 sm:w-6 sm:h-6 ${acrylic ? acrylicText : 'text-slate-700'}`} />
        </button>

        <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 px-2">
          <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 hidden sm:block ${acrylic ? 'text-blue-400' : 'text-blue-500'}`} />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`text-sm sm:text-base ${acrylic ? acrylicText : 'text-slate-600'}`}>第</span>
            <select
              value={currentWeek}
              onChange={handleWeekSelect}
              className={`rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer transition-all appearance-none ${acrylic ? `bg-transparent border border-white/20 ${acrylicText}` : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-0 text-blue-700'}`}
              style={{
                backgroundImage: acrylic ? 'none' : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: '28px'
              }}
            >
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => (
                <option key={week} value={week} className="text-slate-800">
                  {week}
                </option>
              ))}
            </select>
            <span className={`text-sm sm:text-base ${acrylic ? acrylicText : 'text-slate-600'}`}>周</span>
          </div>
        </div>

        <button
          onClick={handleNextWeek}
          disabled={currentWeek >= totalWeeks}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center ${acrylic ? 'border border-white/20 hover:bg-white/10' : 'bg-slate-100 hover:bg-blue-50'}`}
          aria-label="下一周"
        >
          <ChevronRight className={`w-5 h-5 sm:w-6 sm:h-6 ${acrylic ? acrylicText : 'text-slate-700'}`} />
        </button>
      </div>

      <div className={`mt-2 text-center text-xs sm:text-sm ${acrylic ? acrylicText : 'text-slate-500'}`}>
        共 {totalWeeks} 周
      </div>
    </div>
  );
};
