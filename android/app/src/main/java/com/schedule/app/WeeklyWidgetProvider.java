package com.schedule.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.util.TypedValue;
import android.widget.RemoteViews;
import android.app.PendingIntent;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;

public class WeeklyWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "ScheduleWidgetPrefs";
    private static final String KEY_SEMESTER_START = "semester_start";
    private static final String KEY_TOTAL_WEEKS = "total_weeks";
    private static final String KEY_THEME = "theme";
    private static final String KEY_OPACITY = "opacity";

    private static final int[][] CELL_IDS = {
        {R.id.c1_1, R.id.c1_2, R.id.c1_3, R.id.c1_4, R.id.c1_5, R.id.c1_6, R.id.c1_7},
        {R.id.c3_1, R.id.c3_2, R.id.c3_3, R.id.c3_4, R.id.c3_5, R.id.c3_6, R.id.c3_7},
        {R.id.c5_1, R.id.c5_2, R.id.c5_3, R.id.c5_4, R.id.c5_5, R.id.c5_6, R.id.c5_7},
        {R.id.c6_1, R.id.c6_2, R.id.c6_3, R.id.c6_4, R.id.c6_5, R.id.c6_6, R.id.c6_7},
        {R.id.c8_1, R.id.c8_2, R.id.c8_3, R.id.c8_4, R.id.c8_5, R.id.c8_6, R.id.c8_7},
        {R.id.c10_1, R.id.c10_2, R.id.c10_3, R.id.c10_4, R.id.c10_5, R.id.c10_6, R.id.c10_7},
        {R.id.c12_1, R.id.c12_2, R.id.c12_3, R.id.c12_4, R.id.c12_5, R.id.c12_6, R.id.c12_7},
    };

    private static final int[] PERIODS = {1, 3, 5, 6, 8, 10, 12};

    private static final int[] DAY_IDS = {R.id.day1, R.id.day2, R.id.day3, R.id.day4, R.id.day5, R.id.day6, R.id.day7};
    private static final int[] TIME_IDS = {R.id.time1, R.id.time3, R.id.time5, R.id.time6, R.id.time8, R.id.time10, R.id.time12};

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
        WidgetAlarmReceiver.scheduleAlarm(context);
    }

    @Override
    public void onEnabled(Context context) {
        super.onEnabled(context);
        WidgetAlarmReceiver.scheduleAlarm(context);
    }

    @Override
    public void onDisabled(Context context) {
        super.onDisabled(context);
        WidgetAlarmReceiver.cancelAlarm(context);
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.weekly_widget);

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String scheduleJson = prefs.getString("schedule_data", "");
            String lastUpdated = prefs.getString("last_updated", "");
            String semesterStart = prefs.getString(KEY_SEMESTER_START, "");
            int totalWeeks = prefs.getInt(KEY_TOTAL_WEEKS, 30);
            String theme = prefs.getString(KEY_THEME, "light");
            String opacityStr = prefs.getString(KEY_OPACITY, "");
            boolean isDark = "dark".equals(theme);

            if (isDark) {
                boolean opaque = true;
                if (!opacityStr.isEmpty() && getAlphaValue(opacityStr) < 255) opaque = false;
                if (opaque) {
                    views.setInt(R.id.weekly_root, "setBackgroundColor", Color.parseColor("#121212"));
                } else {
                    views.setInt(R.id.weekly_root, "setBackgroundColor", Color.TRANSPARENT);
                }
                views.setTextColor(R.id.weekly_title, Color.WHITE);
                views.setTextColor(R.id.weekly_time, Color.parseColor("#6B7280"));
            } else {
                boolean opaque = true;
                if (!opacityStr.isEmpty() && getAlphaValue(opacityStr) < 255) {
                    opaque = false;
                }
                if (opaque) {
                    views.setInt(R.id.weekly_root, "setBackgroundColor", Color.WHITE);
                } else {
                    views.setInt(R.id.weekly_root, "setBackgroundColor", Color.TRANSPARENT);
                }
                views.setTextColor(R.id.weekly_title, Color.parseColor("#1e40af"));
                views.setTextColor(R.id.weekly_time, Color.parseColor("#9CA3AF"));
            }

            int currentWeek = calculateCurrentWeek(semesterStart, totalWeeks);

            boolean isTransparent = !opacityStr.isEmpty() && getAlphaValue(opacityStr) < 255;

            int todayDow = Calendar.getInstance().get(Calendar.DAY_OF_WEEK);
            todayDow = todayDow == Calendar.SUNDAY ? 7 : todayDow - 1;

            for (int i = 0; i < 7; i++) {
                boolean isToday = (i + 1) == todayDow;
                if (isToday) {
                    views.setInt(DAY_IDS[i], "setBackgroundColor", Color.parseColor("#10B981"));
                    views.setTextColor(DAY_IDS[i], Color.WHITE);
                } else if (isTransparent) {
                    views.setInt(DAY_IDS[i], "setBackgroundColor", Color.TRANSPARENT);
                    views.setTextColor(DAY_IDS[i], isDark ? Color.WHITE : Color.parseColor("#374151"));
                } else {
                    views.setInt(DAY_IDS[i], "setBackgroundColor", Color.parseColor("#F9FAFB"));
                    views.setTextColor(DAY_IDS[i], Color.parseColor("#374151"));
                }
            }

            if (isTransparent) {
                views.setInt(R.id.header_corner, "setBackgroundColor", Color.TRANSPARENT);
                views.setTextColor(R.id.header_corner, isDark ? Color.parseColor("#9CA3AF") : Color.parseColor("#6B7280"));
            }

            String[][] grid = parseWeeklySchedule(scheduleJson, currentWeek);

            for (int row = 0; row < PERIODS.length; row++) {
                if (isTransparent) {
                    views.setInt(TIME_IDS[row], "setBackgroundColor", Color.TRANSPARENT);
                    views.setTextColor(TIME_IDS[row], isDark ? Color.parseColor("#9CA3AF") : Color.parseColor("#6B7280"));
                }
                for (int col = 0; col < 7; col++) {
                    String text = grid[row][col];
                    views.setTextViewText(CELL_IDS[row][col], text);
                    if (isDark) {
                        views.setTextColor(CELL_IDS[row][col], Color.parseColor("#E5E7EB"));
                    } else {
                        views.setTextColor(CELL_IDS[row][col], Color.parseColor("#374151"));
                    }
                }
            }

            views.setTextViewText(R.id.weekly_title, "第" + currentWeek + "周 课表");
            views.setTextViewText(R.id.weekly_time, "更新: " + lastUpdated);

            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.weekly_root, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static int getAlphaValue(String opacity) {
        try {
            int val = Integer.parseInt(opacity);
            if (val <= 0) return 0;
            if (val >= 100) return 255;
            return (val * 255) / 100;
        } catch (Exception e) { return 255; }
    }

    private static int calculateCurrentWeek(String semesterStart, int totalWeeks) {
        if (semesterStart == null || semesterStart.isEmpty()) return 1;
        try {
            String[] parts = semesterStart.split("-");
            if (parts.length != 3) return 1;
            Calendar start = Calendar.getInstance();
            start.set(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]) - 1, Integer.parseInt(parts[2]), 0, 0, 0);
            start.set(Calendar.MILLISECOND, 0);
            Calendar now = Calendar.getInstance();
            now.set(Calendar.HOUR_OF_DAY, 0);
            now.set(Calendar.MINUTE, 0);
            now.set(Calendar.SECOND, 0);
            now.set(Calendar.MILLISECOND, 0);
            long diffMs = now.getTimeInMillis() - start.getTimeInMillis();
            if (diffMs < 0) return 1;
            int diffDays = (int) (diffMs / (1000L * 60 * 60 * 24));
            int week = diffDays / 7 + 1;
            if (week < 1) return 1;
            if (week > totalWeeks) return totalWeeks;
            return week;
        } catch (Exception e) {
            return 1;
        }
    }

    private static String[][] parseWeeklySchedule(String json, int currentWeek) {
        String[][] grid = new String[PERIODS.length][7];
        for (int i = 0; i < PERIODS.length; i++) {
            for (int j = 0; j < 7; j++) {
                grid[i][j] = "";
            }
        }

        if (json == null || json.isEmpty()) return grid;
        try {
            JSONObject obj = new JSONObject(json);
            JSONArray courses = obj.optJSONArray("courses");
            if (courses == null) return grid;

            for (int i = 0; i < courses.length(); i++) {
                JSONObject c = courses.getJSONObject(i);
                int dayOfWeek = c.optInt("dayOfWeek", 0);
                if (dayOfWeek < 1 || dayOfWeek > 7) continue;

                JSONArray weeks = c.optJSONArray("weeks");
                if (weeks == null) continue;

                boolean hasWeek = false;
                for (int j = 0; j < weeks.length(); j++) {
                    if (weeks.getInt(j) == currentWeek) { hasWeek = true; break; }
                }
                if (!hasWeek) continue;

                String weekType = c.optString("weekType", "all");
                if (!weekType.equals("all")) {
                    if (weekType.equals("odd") && currentWeek % 2 == 0) continue;
                    if (weekType.equals("even") && currentWeek % 2 == 1) continue;
                }

                int period = c.optInt("period", 1);
                int rowIdx = -1;
                for (int r = 0; r < PERIODS.length; r++) {
                    if (PERIODS[r] == period) { rowIdx = r; break; }
                }
                if (rowIdx < 0) continue;

                String name = c.optString("name", "");
                if (name.length() > 5) name = name.substring(0, 5);
                String location = c.optString("location", "");

                String cellText = name;
                if (!location.isEmpty()) {
                    cellText = name + "\n" + location;
                }

                int colIdx = dayOfWeek - 1;
                String existing = grid[rowIdx][colIdx];
                if (existing.isEmpty()) {
                    grid[rowIdx][colIdx] = cellText;
                } else {
                    grid[rowIdx][colIdx] = existing + "\n" + cellText;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return grid;
    }
}
