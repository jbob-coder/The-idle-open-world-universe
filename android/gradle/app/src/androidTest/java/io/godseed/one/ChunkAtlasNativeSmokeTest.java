package io.godseed.one;

import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;

/** WLD-003: actual offline API29 WebView must load the optional chunk atlas. */
@RunWith(AndroidJUnit4.class)
public class ChunkAtlasNativeSmokeTest {
    private static WebView findWebView(View node) {
        if (node instanceof WebView) return (WebView) node;
        if (!(node instanceof ViewGroup)) return null;
        ViewGroup group=(ViewGroup) node;
        for (int i=0;i<group.getChildCount();i++) {
            WebView found=findWebView(group.getChildAt(i));
            if (found!=null) return found;
        }
        return null;
    }

    private static String evaluate(ActivityScenario<MainActivity> activity,String js)
            throws InterruptedException {
        final String[] result={null};
        CountDownLatch latch=new CountDownLatch(1);
        activity.onActivity(main -> {
            WebView web=findWebView(main.findViewById(android.R.id.content));
            assertNotNull("Native host must contain a WebView",web);
            web.evaluateJavascript(js,value->{result[0]=value;latch.countDown();});
        });
        assertTrue("Native WebView evaluation timed out",latch.await(10,TimeUnit.SECONDS));
        return result[0];
    }

    @Test public void optionalChunkAtlasWorksOnAndroidWithoutTakingOverNim() throws Exception {
        try (ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)) {
            String readiness="not started";
            boolean ready=false;
            for(int attempt=0;attempt<30;attempt++){
                readiness=evaluate(activity,
                    "(function(){return JSON.stringify({" +
                    "page:document.readyState,sim:typeof window.GodseedDebug," +
                    "chunks:typeof window.GodseedChunks,store:typeof window.GodseedChunkStore," +
                    "view:typeof window.GodseedChunkView,surface:typeof window.GodseedChunkSurface," +
                    "atlas:typeof window.GodseedChunkAtlas});})()");
                String flags=evaluate(activity,
                    "typeof window.GodseedDebug==='object' && " +
                    "typeof window.GodseedChunkAtlas==='object' && " +
                    "document.readyState==='complete'");
                if("true".equals(flags)){ready=true;break;}
                Thread.sleep(500);
            }
            assertTrue("Atlas module or core JS not ready: "+readiness,ready);
            String result=evaluate(activity,
                "(function(){var s=GodseedDebug.getState();" +
                "var oldX=s.bot.x,oldY=s.bot.y,oldTick=s.tick;" +
                "GodseedDebug.setSpeed(0);" +
                "var opened=GodseedChunkAtlas.open();" +
                "GodseedChunkAtlas.setCenter(-33,97);" +
                "GodseedChunkAtlas.setZoom(2);" +
                "var camera=GodseedChunkAtlas.stats().camera;" +
                "var canvas=document.getElementById('chunkAtlasCanvas');" +
                "var ok=opened && GodseedChunkAtlas.isOpen()" +
                " && camera.centerX===-33 && camera.centerY===97" +
                " && camera.width===16 && camera.height===10" +
                " && canvas.width===256 && canvas.height===160" +
                " && s.bot.x===oldX && s.bot.y===oldY && s.tick===oldTick" +
                " && document.getElementById('world').style.display==='none';" +
                "GodseedChunkAtlas.close();" +
                "return ok && document.getElementById('world').style.display==='block';})()");
            assertEquals("Actual WebView must render signed chunk atlas, preserve Nim and restore world",
                "true",result);
        }
    }
}
