import React, { useState, useEffect } from 'react';
import { Clock, MapPin, BookOpen } from 'lucide-react';
import { Course } from '../types/schedule';
import { getPeriodStartMinutes } from '../utils/dateUtils';

interface MultipleClassesCardProps {
  courses: Course[];
  startsIn: number;
  currentTime: number;
  nextPeriodTime: number;
  acrylic?: boolean;
}

const MultipleClassesCard: React.FC<MultipleClassesCardProps> = ({ courses, startsIn, currentTime, nextPeriodTime, acrylic }) => {
  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}分钟`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  };

  const progressPercent = Math.max(0, Math.min(100, ((nextPeriodTime - currentTime) / 60) * 100));

  return (
    <div className={`${acrylic ? 'bg-transparent border border-green-500/40 text-white' : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'} rounded-2xl p-4 shadow-lg`}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className={`w-5 h-5 ${acrylic ? 'text-green-400' : ''}`} />
        <span className={`text-sm ${acrylic ? 'text-white/80' : 'opacity-90'}`}>即将开始</span>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${acrylic ? 'bg-green-500/20 text-green-300' : 'bg-white/20'}`}>
          {formatTime(startsIn)}
        </span>
      </div>
      <div className="space-y-2">
        {courses.map((course, idx) => (
          <div key={idx} className={`rounded-xl p-3 ${acrylic ? 'border border-white/20' : 'bg-white/10'}`}>
            <div className="flex items-center gap-2">
              <BookOpen className={`w-4 h-4 ${acrylic ? 'text-green-400' : ''}`} />
              <h4 className="font-medium flex-1">{course.name}</h4>
            </div>
            <div className={`flex items-center gap-4 text-xs mt-1 ${acrylic ? 'text-white/70' : 'opacity-80'}`}>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {course.location || '未知地点'}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className={`mt-3 rounded-full h-2 overflow-hidden ${acrylic ? 'bg-white/20' : 'bg-white/20'}`}>
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${acrylic ? 'bg-green-400' : 'bg-white'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className={`text-xs mt-1 ${acrylic ? 'text-white/60' : 'opacity-70'}`}>距离上课还有 {formatTime(startsIn)}</p>
    </div>
  );
};

interface NoClassCardProps {
  message: string;
  acrylic?: boolean;
}

const NoClassCard: React.FC<NoClassCardProps> = ({ message, acrylic }) => {
  return (
    <div className={`${acrylic ? 'bg-transparent border border-white/20 text-white' : 'bg-gradient-to-br from-slate-500 to-slate-600 text-white'} rounded-2xl p-4 shadow-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className={`w-5 h-5 ${acrylic ? 'text-white/70' : ''}`} />
        <span className={`text-sm ${acrylic ? 'text-white/80' : 'opacity-90'}`}>今日课程</span>
      </div>
      <p className={acrylic ? 'text-white/70' : 'text-slate-300'}>{message}</p>
    </div>
  );
};

interface NextClassFinderProps {
  courses: Course[];
  currentWeek: number;
  acrylic?: boolean;
}

export const NextClassFinder: React.FC<NextClassFinderProps> = ({ courses, currentWeek, acrylic }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [currentWeek]);

  if (!courses || courses.length === 0) {
    return null;
  }

  const todayDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const todayCourses = courses.filter(course => {
    const isToday = course.dayOfWeek === todayDayOfWeek;
    const isWeekMatch = course.weeks.includes(currentWeek);
    if (!isWeekMatch) return false;
    if (course.weekType) {
      if (course.weekType === 'odd' && currentWeek % 2 === 0) return false;
      if (course.weekType === 'even' && currentWeek % 2 === 1) return false;
    }
    return isToday;
  });

  if (todayCourses.length === 0) {
    return <NoClassCard message="今天没有课程，好好休息！" acrylic={acrylic} />;
  }

  const upcoming = todayCourses.filter(course => {
    const startTime = getPeriodStartMinutes(course.period);
    return startTime > currentTime;
  });

  if (upcoming.length === 0) {
    return <NoClassCard message="今天课程已全部结束" acrylic={acrylic} />;
  }

  upcoming.sort((a, b) => {
    const aTime = getPeriodStartMinutes(a.period);
    const bTime = getPeriodStartMinutes(b.period);
    return aTime - bTime;
  });

  const firstTime = getPeriodStartMinutes(upcoming[0].period);
  const nextClasses = upcoming.filter(c => getPeriodStartMinutes(c.period) === firstTime);

  if (nextClasses.length > 0) {
    return (
      <MultipleClassesCard 
        courses={nextClasses} 
        startsIn={firstTime - currentTime}
        currentTime={currentTime}
        nextPeriodTime={firstTime}
        acrylic={acrylic}
      />
    );
  }

  return <NoClassCard message="今天课程已全部结束" />;
};
