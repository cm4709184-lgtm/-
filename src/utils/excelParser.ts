import * as XLSX from 'xlsx';
import { Course, Schedule } from '../types/schedule';

const PERIOD_MAPPING: Record<number, number> = {
  3: 1,   // 12节 -> 1-2节
  4: 3,   // 34节 -> 3-4节
  5: 5,   // 5节
  6: 6,   // 67节 -> 6-7节
  7: 8,   // 89节 -> 8-9节
  8: 10,  // 1011节 -> 10-11节
  9: 12,  // 12节
};

function parseWeeks(weekStr: string): { weeks: number[]; weekType?: 'odd' | 'even' } {
  const weeks: number[] = [];
  let weekType: 'odd' | 'even' | undefined;

  const cleaned = weekStr.replace(/\(周\)/g, '').replace(/周\]/g, ']');

  if (/\(单周\)|单周/.test(cleaned)) {
    weekType = 'odd';
  } else if (/\(双周\)|双周/.test(cleaned)) {
    weekType = 'even';
  }

  const numStr = cleaned.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  const match = numStr.match(/(\d+[-\d,]+\d+|\d+)/);
  if (!match) return { weeks, weekType };

  const weekParts = match[1].split(',');
  weekParts.forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (!weeks.includes(i)) weeks.push(i);
        }
      }
    } else {
      const num = parseInt(part);
      if (!isNaN(num) && !weeks.includes(num)) {
        weeks.push(num);
      }
    }
  });

  if (weekType === 'odd') {
    const filtered = weeks.filter(w => w % 2 === 1);
    return { weeks: filtered.sort((a, b) => a - b), weekType };
  }
  if (weekType === 'even') {
    const filtered = weeks.filter(w => w % 2 === 0);
    return { weeks: filtered.sort((a, b) => a - b), weekType };
  }

  return { weeks: weeks.sort((a, b) => a - b), weekType };
}

function parseSingleCourse(courseBlock: string): Omit<Course, 'dayOfWeek' | 'period'> | null {
  const lines = courseBlock.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;

  const name = lines[0].trim();
  let teacher = '';
  let location = '';
  let weekStr = '';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('[') && line.includes('周]')) {
      weekStr = line;
    } else if (line.includes('(') && line.includes(')')) {
      const teacherMatch = line.match(/(.+?)\((.*?)\)/);
      if (teacherMatch) {
        teacher = teacherMatch[1].trim();
      }
    } else if (line && !line.includes('[')) {
      location = line;
    }
  }

  if (!name) return null;

  const { weeks, weekType } = parseWeeks(weekStr);
  if (weeks.length === 0) return null;

  return {
    name,
    teacher,
    location,
    weeks,
    weekType,
  };
}

function parseCellContent(content: string, period: number, dayOfWeek: number): Course[] {
  const courses: Course[] = [];
  const blocks = content.split('\n\n').filter(block => block.trim());

  blocks.forEach(block => {
    const courseData = parseSingleCourse(block);
    if (courseData) {
      courses.push({
        ...courseData,
        dayOfWeek,
        period,
      });
    }
  });

  return courses;
}

export function parseExcelBuffer(buffer: ArrayBuffer): Schedule {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (rawData.length < 4) {
    throw new Error('课表文件格式不正确');
  }

  const courses: Course[] = [];
  const dayMapping: Record<number, number> = {
    1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7
  };

  for (let rowIndex = 3; rowIndex < rawData.length - 1; rowIndex++) {
    const row = rawData[rowIndex];
    if (!row || row.length === 0) continue;

    const periodCell = row[0];
    if (!periodCell || typeof periodCell !== 'string') continue;

    const period = PERIOD_MAPPING[rowIndex] || 1;

    for (let colIndex = 1; colIndex <= 7; colIndex++) {
      const cellValue = row[colIndex];
      if (!cellValue || (typeof cellValue === 'string' && cellValue.trim() === '')) {
        continue;
      }

      const cellContent = String(cellValue).trim();
      const dayOfWeek = dayMapping[colIndex];

      if (dayOfWeek) {
        const cellCourses = parseCellContent(cellContent, period, dayOfWeek);
        courses.push(...cellCourses);
      }
    }
  }

  if (courses.length === 0) {
    throw new Error('未能解析到任何课程');
  }

  const allWeeks = courses.flatMap(c => c.weeks);
  const totalWeeks = allWeeks.length > 0 ? Math.max(...allWeeks) : 16;
  const currentWeek = getCurrentWeek(totalWeeks);

  return { currentWeek, totalWeeks, courses };
}

export function parseExcelFile(file: File): Promise<Schedule> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const result = parseExcelBuffer(buffer);
        resolve(result);
      } catch (error) {
        reject(new Error('解析课表文件失败：' + (error instanceof Error ? error.message : '未知错误')));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function getCurrentWeek(totalWeeks: number): number {
  const today = new Date();
  const stored = localStorage.getItem('schedule-storage');
  const semesterStart = stored ? JSON.parse(stored)?.state?.semesterStart : '2026-03-09';
  const startOfSemester = new Date(semesterStart + 'T00:00:00');
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - startOfSemester.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentWeek = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(currentWeek, totalWeeks));
}
