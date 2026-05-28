package com.schedule.app;

import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.List;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class MainActivity extends BridgeActivity {
    private static OkHttpClient client;

    private static synchronized OkHttpClient getClient() {
        if (client == null) {
            client = new OkHttpClient.Builder()
                .followRedirects(false)
                .connectTimeout(6, TimeUnit.SECONDS)
                .readTimeout(8, TimeUnit.SECONDS)
                .writeTimeout(8, TimeUnit.SECONDS)
                .build();
        }
        return client;
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView wv = this.bridge.getWebView();
        if (wv != null) {
            WebSettings ws = wv.getSettings();
            ws.setJavaScriptEnabled(true);
            ws.setDomStorageEnabled(true);
            wv.addJavascriptInterface(new NB(), "NB");
        }
    }

    class NB {
        @JavascriptInterface public String req(String method, String url, String body, String cookie) {
            return run(() -> {
                Request.Builder rb = new Request.Builder().url(url)
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "*/*");
                if (cookie != null && !cookie.isEmpty()) rb.header("Cookie", cookie);
                if (url.contains("LoginToXk")) rb.header("Referer", "http://newjwxt.bjfu.edu.cn/jsxsd/");
                if ("GET".equals(method)) rb.get();
                else rb.post(RequestBody.create(body != null ? body : "",
                    MediaType.parse("application/x-www-form-urlencoded")));

                Response res = getClient().newCall(rb.build()).execute();
                int code = res.code();
                byte[] bytes = res.body().bytes();
                List<String> cookies = res.headers("Set-Cookie");
                res.close();

                StringBuilder result = new StringBuilder();
                result.append("STATUS:").append(code).append("\n");
                if (!cookies.isEmpty()) {
                    StringBuilder cookiePart = new StringBuilder();
                    for (String c : cookies) {
                        String main = c.split(";")[0].trim();
                        if (main.contains("=")) {
                            if (cookiePart.length() > 0) cookiePart.append("; ");
                            cookiePart.append(main);
                        }
                    }
                    if (cookiePart.length() > 0) {
                        result.append("COOKIE:").append(cookiePart).append("\n");
                    }
                }
                result.append(Base64.encodeToString(bytes, Base64.NO_WRAP));
                return result.toString();
            });
        }

        @JavascriptInterface public void updateWidget(String scheduleJson) {
            runOnUiThread(() -> WidgetUpdater.updateWidgetData(MainActivity.this, scheduleJson));
        }

        @JavascriptInterface public void updateWidgetSettings(String settings) {
            runOnUiThread(() -> WidgetUpdater.updateWidgetSettings(MainActivity.this, settings));
        }
    }

    private String run(java.util.concurrent.Callable<String> task) {
        final String[] out = {""};
        final CountDownLatch latch = new CountDownLatch(1);
        new Thread(() -> { try { out[0] = task.call(); } catch (Exception e) { out[0] = "ERR:" + e.getMessage(); } latch.countDown(); }).start();
        try { latch.await(10, TimeUnit.SECONDS); } catch (InterruptedException e) {}
        if (out[0].isEmpty()) out[0] = "ERR:连接超时，请检查网络";
        return out[0];
    }
}
