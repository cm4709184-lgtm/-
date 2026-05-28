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
import java.util.ArrayList;
import java.util.List;

public class ScheduleWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "ScheduleWidgetPrefs";
    private static final String KEY_FONT_SIZE = "font_size";
    private static final String KEY_OPACITY = "opacity";
    private static final String KEY_THEME = "theme";
    private static final String KEY_SEMESTER_START = "semester_start";
    private static final String KEY_TOTAL_WEEKS = "total_weeks";

    private static final float[] FONT_SIZES = {10f, 11f, 12f, 13f, 14f};

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
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.schedule_widget);

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String scheduleJson = prefs.getString("schedule_data", "");
            String lastUpdated = prefs.getString("last_updated", "");
            String fontSizeStr = prefs.getString(KEY_FONT_SIZE, "md");
            String opacityStr = prefs.getString(KEY_OPACITY, "");
            String theme = prefs.getString(KEY_THEME, "light");
            String semesterStart = prefs.getString(KEY_SEMESTER_START, "");
            int totalWeeks = prefs.getInt(KEY_TOTAL_WEEKS, 30);
            boolean isDark = "dark".equals(theme);

            int fontIndex = getFontIndex(fontSizeStr);
            float titleSize = FONT_SIZES[fontIndex] + 2;
            float contentSize = FONT_SIZES[fontIndex];
            float smallSize = FONT_SIZES[fontIndex] - 1;

            views.setTextViewTextSize(R.id.title_text, TypedValue.COMPLEX_UNIT_SP, titleSize);
            views.setTextViewTextSize(R.id.content_text, TypedValue.COMPLEX_UNIT_SP, contentSize);
            views.setTextViewTextSize(R.id.next_text, TypedValue.COMPLEX_UNIT_SP, smallSize);
            views.setTextViewTextSize(R.id.time_text, TypedValue.COMPLEX_UNIT_SP, smallSize - 1);

            if (isDark) {
                boolean opaque = true;
                if (!opacityStr.isEmpty() && getAlphaValue(opacityStr) < 255) opaque = false;
                if (opaque) {
                    views.setInt(R.id.widget_root, "setBackgroundColor", Color.parseColor("#121212"));
                } else {
                    views.setInt(R.id.widget_root, "setBackgroundColor", Color.TRANSPARENT);
                }
                views.setTextColor(R.id.title_text, Color.WHITE);
                views.setTextColor(R.id.content_text, Color.parseColor("#E5E7EB"));
                views.setTextColor(R.id.next_text, Color.parseColor("#10B981"));
                views.setTextColor(R.id.time_text, Color.parseColor("#6B7280"));
            } else {
                boolean opaque = true;
                int textColor = Color.parseColor("#333333");
                if (!opacityStr.isEmpty() && getAlphaValue(opacityStr) < 255) {
                    opaque = false;
                    textColor = Color.parseColor("#000000");
                }
                if (opaque) {
                    views.setInt(R.id.widget_root, "setBackgroundColor", Color.WHITE);
                } else {
                    views.setInt(R.id.widget_root, "setBackgroundColor", Color.TRANSPARENT);
                }
                views.setTextColor(R.id.title_text, Color.parseColor("#1e40af"));
                views.setTextColor(R.id.content_text, textColor);
                views.setTextColor(R.id.next_text, Color.parseColor("#059669"));
                views.setTextColor(R.id.time_text, Color.parseColor("#999999"));
            }

            String dayName = getDayName();
            views.setTextViewText(R.id.title_text, dayName + " 课表");
            views.setTextViewText(R.id.time_text, "更新: " + lastUpdated);
            String courseText = parseTodaySchedule(scheduleJson, semesterStart, totalWeeks);
            if (courseText.length() > 0 && !courseText.startsWith("暂无") && !courseText.startsWith("今日无")) {
                courseText = "\n" + courseText + "\n";
            }
            views.setTextViewText(R.id.content_text, courseText);
            views.setTextViewText(R.id.next_text, "下一节: " + parseNextClass(scheduleJson, semesterStart, totalWeeks));

            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

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

    private static int getFontIndex(String size) {
        switch (size) {
            case "xs": return 0;
            case "sm": return 1;
            case "md": return 2;
            case "lg": return 3;
            case "xl": return 4;
            default: return 2;
        }
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

    private static String getDayName() {
        int day = Calendar.getInstance().get(Calendar.DAY_OF_WEEK);
        String[] names = {"周日", "周一", "周二", "周三", "周四", "周五", "周六"};
        return names[day - 1];
    }

    private static String parseTodaySchedule(String json, String semesterStart, int totalWeeks) {
        if (json == null || json.isEmpty()) return "暂无课表，请在App中登录";
        try {
            JSONObject obj = new JSONObject(json);
            JSONArray courses = obj.optJSONArray("courses");
            if (courses == null || courses.length() == 0) return "今日无课程";

            int dayOfWeek = Calendar.getInstance().get(Calendar.DAY_OF_WEEK);
            dayOfWeek = dayOfWeek == Calendar.SUNDAY ? 7 : dayOfWeek - 1;
            int currentWeek = calculateCurrentWeek(semesterStart, totalWeeks);

            StringBuilder sb = new StringBuilder();
            String[] periodLabels = {
                "1-2节", "1-2节", "3-4节", "3-4节", "5节",
                "6-7节", "6-7节", "8-9节", "8-9节", "10-11节",
                "10-11节", "12节", "12节"
            };
            String[] periodTimes = {
                "08:00-09:35", "08:00-09:35", "09:50-11:25", "09:50-11:25", "11:30-12:15",
                "13:30-15:05", "13:30-15:05", "15:20-16:55", "15:20-16:55", "18:30-20:05",
                "18:30-20:05", "20:10-20:55", "20:10-20:55"
            };

            for (int i = 0; i < courses.length(); i++) {
                JSONObject c = courses.getJSONObject(i);
                if (c.optInt("dayOfWeek", 0) != dayOfWeek) continue;

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

                String name = c.optString("name", "未知");
                String location = c.optString("location", "");
                int period = c.optInt("period", 1);
                String pLabel = period >= 1 && period <= 13 ? periodLabels[period - 1] : "第" + period + "节";
                String pTime = period >= 1 && period <= 13 ? periodTimes[period - 1] : "";

                if (sb.length() > 0) sb.append("\n");
                sb.append(pLabel).append(" ").append(pTime).append("\n").append(name);
                if (!location.isEmpty()) {
                    sb.append(" @").append(location);
                }
            }
            return sb.length() > 0 ? sb.toString() : "今日无课程";
        } catch (Exception e) {
            return "解析失败";
        }
    }

    private static String parseNextClass(String json, String semesterStart, int totalWeeks) {
        if (json == null || json.isEmpty()) return "无";
        try {
            JSONObject obj = new JSONObject(json);
            JSONArray courses = obj.optJSONArray("courses");
            if (courses == null) return "无";

            int dayOfWeek = Calendar.getInstance().get(Calendar.DAY_OF_WEEK);
            dayOfWeek = dayOfWeek == Calendar.SUNDAY ? 7 : dayOfWeek - 1;
            int currentWeek = calculateCurrentWeek(semesterStart, totalWeeks);
            int currentTime = Calendar.getInstance().get(Calendar.HOUR_OF_DAY) * 60
                + Calendar.getInstance().get(Calendar.MINUTE);

            int[] starts = {480, 530, 600, 650, 700, 840, 890, 950, 1000, 1050, 1140, 1190, 1240};
            String nextName = "无";
            int nextTime = 24 * 60;

            for (int i = 0; i < courses.length(); i++) {
                JSONObject c = courses.getJSONObject(i);
                if (c.optInt("dayOfWeek", 0) != dayOfWeek) continue;

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

                int period = c.optInt("period", 1) - 1;
                if (period < 0 || period >= starts.length) continue;

                int classTime = starts[period];
                if (classTime > currentTime && classTime < nextTime) {
                    nextTime = classTime;
                    nextName = c.optString("name", "未知");
                }
            }
            return nextName;
        } catch (Exception e) {
            return "无";
        }
    }
}
