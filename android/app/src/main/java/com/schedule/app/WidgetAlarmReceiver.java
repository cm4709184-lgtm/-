package com.schedule.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.os.Build;
import java.util.Calendar;

public class WidgetAlarmReceiver extends BroadcastReceiver {

    private static final String ACTION_REFRESH = "com.schedule.app.WIDGET_ALARM_REFRESH";
    private static final int ALARM_REQUEST_CODE = 12345;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (ACTION_REFRESH.equals(intent.getAction()) || Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);

            int[] dailyIds = mgr.getAppWidgetIds(new ComponentName(context, ScheduleWidgetProvider.class));
            for (int id : dailyIds) {
                ScheduleWidgetProvider.updateAppWidget(context, mgr, id);
            }

            int[] weeklyIds = mgr.getAppWidgetIds(new ComponentName(context, WeeklyWidgetProvider.class));
            for (int id : weeklyIds) {
                WeeklyWidgetProvider.updateAppWidget(context, mgr, id);
            }

            scheduleAlarm(context);
        }
    }

    public static void scheduleAlarm(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, WidgetAlarmReceiver.class);
        intent.setAction(ACTION_REFRESH);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags);

        long interval = 30 * 60 * 1000;
        long triggerAt = System.currentTimeMillis() + interval;

        am.setRepeating(AlarmManager.RTC_WAKEUP, triggerAt, interval, pi);
    }

    public static void cancelAlarm(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(context, WidgetAlarmReceiver.class);
        intent.setAction(ACTION_REFRESH);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags);
        am.cancel(pi);
    }
}
