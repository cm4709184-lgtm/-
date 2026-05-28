import React, { memo } from 'react';
import { MapPin, User } from 'lucide-react';
import { Course } from '../types/schedule';

interface CourseCardProps {
  course: Course;
  showWeekType?: boolean;
  highlight?: boolean;
  acrylic?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = memo(({ course, showWeekType = true, highlight = false, acrylic }) => {
  const getWeekTypeStyles = () => {
    if (!course.weekType || course.weekType === 'all') {
      if (acrylic) return 'border border-white/20 text-white';
      return highlight ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200';
    }
    if (acrylic) return 'border border-white/20 text-white';
    return course.weekType === 'odd'
      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      : 'bg-purple-100 text-purple-700 border border-purple-200';
  };

  if (acrylic) {
    return (
      <div className={`rounded-xl p-3 sm:p-4 h-full ${highlight ? 'border border-green-500/40' : 'border border-white/20'}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-bold text-sm sm:text-base leading-tight flex-1 text-white">
            {course.name}
          </h4>
          {showWeekType && course.weekType && course.weekType !== 'all' && (
            <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${getWeekTypeStyles()}`}>
              {course.weekType === 'odd' ? '单' : '双'}
            </span>
          )}
        </div>
        <div className="space-y-1.5 text-xs sm:text-sm">
          {course.teacher && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-white">
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="truncate">{course.teacher}</span>
            </div>
          )}
          {course.location && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-white">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="truncate">{course.location}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const gradientClass = highlight ? 'from-green-500 to-emerald-600' : 'from-slate-400 to-slate-500';

  return (
    <div className={`bg-gradient-to-br ${gradientClass} text-white rounded-xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all h-full`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-bold text-sm sm:text-base leading-tight flex-1">
          {course.name}
        </h4>
        
        {showWeekType && course.weekType && course.weekType !== 'all' && (
          <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${getWeekTypeStyles()}`}>
            {course.weekType === 'odd' ? '单' : '双'}
          </span>
        )}
      </div>
      
      <div className="space-y-1.5 text-xs sm:text-sm opacity-95">
        {course.teacher && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 opacity-80" />
            <span className="truncate">{course.teacher}</span>
          </div>
        )}
        
        {course.location && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 opacity-80" />
            <span className="truncate">{course.location}</span>
          </div>
        )}
      </div>
    </div>
  );
});

CourseCard.displayName = 'CourseCard';
