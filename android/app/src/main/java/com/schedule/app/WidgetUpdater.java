package com.schedule.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class WidgetUpdater {

    private static final String PREFS_NAME = "ScheduleWidgetPrefs";
    private static final String KEY_SCHEDULE_DATA = "schedule_data";
    private static final String KEY_LAST_UPDATED = "last_updated";
    private static final String KEY_FONT_SIZE = "font_size";
    private static final String KEY_OPACITY = "opacity";
    private static final String KEY_THEME = "theme";
    private static final String KEY_SEMESTER_START = "semester_start";
    private static final String KEY_TOTAL_WEEKS = "total_weeks";

    public static void updateWidgetData(Context context, String scheduleJson) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_SCHEDULE_DATA, scheduleJson);
        editor.putString(KEY_LAST_UPDATED, new java.text.SimpleDateFormat("MM/dd HH:mm", java.util.Locale.getDefault()).format(new java.util.Date()));

        try {
            org.json.JSONObject obj = new org.json.JSONObject(scheduleJson);
            if (obj.has("semesterStart")) {
                editor.putString(KEY_SEMESTER_START, obj.getString("semesterStart"));
            }
            if (obj.has("totalWeeks")) {
                editor.putInt(KEY_TOTAL_WEEKS, obj.getInt("totalWeeks"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        editor.apply();
        notifyWidgetUpdate(context);
    }

    public static void updateWidgetSettings(Context context, String settingsJson) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        try {
            org.json.JSONObject obj = new org.json.JSONObject(settingsJson);
            if (obj.has("fontSize")) {
                prefs.edit().putString(KEY_FONT_SIZE, obj.getString("fontSize")).apply();
            }
            if (obj.has("opacity")) {
                prefs.edit().putString(KEY_OPACITY, obj.getString("opacity")).apply();
            }
            if (obj.has("theme")) {
                prefs.edit().putString(KEY_THEME, obj.getString("theme")).apply();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        notifyWidgetUpdate(context);
    }

    public static void clearWidgetData(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().clear().apply();
        notifyWidgetUpdate(context);
    }

    private static void notifyWidgetUpdate(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);

        Intent dailyIntent = new Intent(context, ScheduleWidgetProvider.class);
        dailyIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] dailyIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, ScheduleWidgetProvider.class));
        dailyIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, dailyIds);
        context.sendBroadcast(dailyIntent);

        Intent weeklyIntent = new Intent(context, WeeklyWidgetProvider.class);
        weeklyIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] weeklyIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, WeeklyWidgetProvider.class));
        weeklyIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, weeklyIds);
        context.sendBroadcast(weeklyIntent);
    }
}
