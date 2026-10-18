package pro.busspark.game;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.graphics.Color;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.io.ByteArrayInputStream;
import java.io.IOException;

/** Offline Android host. No network permission, accounts, trackers, or external pages. */
public final class MainActivity extends Activity {
    private WebView web;
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(Color.rgb(130,193,232));
        getWindow().setNavigationBarColor(Color.rgb(61,87,116));
        FrameLayout root=new FrameLayout(this); root.setBackgroundColor(Color.rgb(134,190,226));
        if(Build.VERSION.SDK_INT>=30){
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((v,insets)->{
                android.graphics.Insets safe=insets.getInsetsIgnoringVisibility(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());
                v.setPadding(safe.left,safe.top,safe.right,safe.bottom);return insets;
            });
        }else root.setFitsSystemWindows(true);
        web=new WebView(this);web.setBackgroundColor(Color.rgb(196,202,220));
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);settings.setMediaPlaybackRequiresUserGesture(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setTextZoom(100);settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);web.setVerticalScrollBarEnabled(false);web.setHorizontalScrollBarEnabled(false);
        web.addJavascriptInterface(new Bridge(),"Native");
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){return true;}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){
                if(!"game.bus.local".equals(request.getUrl().getHost()))return empty(403);
                String path=request.getUrl().getPath();if(path==null||path.equals("/"))path="/index.html";
                if(path.contains(".."))return empty(403);
                String mime=path.endsWith(".html")?"text/html":path.endsWith(".js")?"application/javascript":path.endsWith(".css")?"text/css":path.endsWith(".png")?"image/png":path.endsWith(".webp")?"image/webp":path.endsWith(".ttf")?"font/ttf":"application/octet-stream";
                try{return new WebResourceResponse(mime,mime.startsWith("text")||mime.contains("javascript")?"UTF-8":null,getAssets().open(path.substring(1)));}
                catch(IOException e){return empty(404);}
            }
            private WebResourceResponse empty(int code){return new WebResourceResponse("text/plain","UTF-8",code,"Unavailable",null,new ByteArrayInputStream(new byte[0]));}
        });
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));setContentView(root);
        web.loadUrl("https://game.bus.local/index.html");
    }
    @Override public void onBackPressed(){web.evaluateJavascript("window.handleBack && window.handleBack()",null);}
    @Override protected void onPause(){super.onPause();web.evaluateJavascript("window.BusGame && window.handleBack && !window.BusGame.snapshot().modal && window.BusGame.snapshot().screen==='game' && window.handleBack()",null);web.onPause();web.pauseTimers();}
    @Override protected void onResume(){super.onResume();if(web!=null){web.onResume();web.resumeTimers();}}
    @Override protected void onDestroy(){if(web!=null){web.removeJavascriptInterface("Native");web.destroy();}super.onDestroy();}
    private final class Bridge {
        @JavascriptInterface public void vibrate(){runOnUiThread(()->{try{Vibrator vib=(Vibrator)getSystemService(VIBRATOR_SERVICE);if(vib!=null&&vib.hasVibrator())vib.vibrate(VibrationEffect.createOneShot(15,VibrationEffect.DEFAULT_AMPLITUDE));}catch(Exception ignored){}});}
        @JavascriptInterface public void close(){runOnUiThread(()->finish());}
    }
}
