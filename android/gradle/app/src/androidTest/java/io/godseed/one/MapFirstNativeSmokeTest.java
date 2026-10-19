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

/** ART-007: map-first UI on a real offline Android API29 WebView. */
@RunWith(AndroidJUnit4.class)
public class MapFirstNativeSmokeTest {
    private static WebView find(View node) {
        if (node instanceof WebView) return (WebView)node;
        if (!(node instanceof ViewGroup)) return null;
        ViewGroup group=(ViewGroup)node;
        for (int i=0;i<group.getChildCount();i++) {
            WebView found=find(group.getChildAt(i));
            if (found!=null)return found;
        }
        return null;
    }

    private static String eval(ActivityScenario<MainActivity> activity,String js)
            throws InterruptedException {
        CountDownLatch latch=new CountDownLatch(1);
        final String[] value={null};
        activity.onActivity(a->{
            WebView web=find(a.findViewById(android.R.id.content));
            assertNotNull("Real Android host must provide WebView",web);
            web.evaluateJavascript(js,result->{value[0]=result;latch.countDown();});
        });
        assertTrue("WebView evaluation timed out",latch.await(10,TimeUnit.SECONDS));
        return value[0];
    }

    @Test public void mapFirstTabsAreRealReadOnlyAndPreserveNativeWorld() throws Exception {
        try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)) {
            String diagnostic="no page loaded";
            boolean ready=false;
            for(int n=0;n<30;n++){
                diagnostic=eval(activity,
                    "JSON.stringify({state:document.readyState,sim:typeof window.GodseedDebug,"+
                    "map:typeof window.GodseedMapFirst,observer:typeof window.GodseedObservatory,"+
                    "module:typeof window.GodseedObserver,domReset:typeof document.createElement('div').replaceChildren})");
                if("true".equals(eval(activity,
                    "document.readyState==='complete'"+
                    " && typeof window.GodseedDebug==='object'"+
                    " && typeof window.GodseedMapFirst==='object'"+
                    " && typeof window.GodseedObservatory==='object'"))){
                    ready=true;break;
                }
                Thread.sleep(500);
            }
            assertTrue("Map-first modules absent on native WebView: "+diagnostic,ready);
            String answer=eval(activity,
                "(function(){"+
                "GodseedDebug.setSpeed(0);"+
                "var s=GodseedDebug.getState();var before=GodseedSim.serialize(s);"+
                "var world=document.getElementById('world');"+
                "var dock=document.getElementById('androidDock');"+
                "var tabCount=document.querySelectorAll('#godviewTabs button').length;"+
                "var initially=GodseedMapFirst.current()==='world' && "+
                "document.getElementById('godviewDrawer').hidden && world.width===512 && "+
                "getComputedStyle(world).display!=='none' && "+
                "getComputedStyle(dock).display==='none';"+
                "GodseedMapFirst.open('lives');"+
                "var lives=GodseedMapFirst.current()==='lives' && "+
                "!document.getElementById('godviewDrawer').hidden && "+
                "document.getElementById('observerTarget')!==null && "+
                "document.getElementById('portrait')!==null;"+
                "GodseedMapFirst.open('villages');"+
                "var towns=document.getElementById('townStatus').textContent.indexOf('Briarford')>=0;"+
                "GodseedMapFirst.open('settings');"+
                "var backups=document.getElementById('save')!==null"+
                " && document.getElementById('import')!==null;"+
                "GodseedMapFirst.close();"+
                "var closed=GodseedMapFirst.current()==='world'"+
                " && document.getElementById('godviewDrawer').hidden;"+
                "return initially && tabCount===7 && lives && towns && backups && closed"+
                " && GodseedSim.serialize(GodseedDebug.getState())===before;})()");
            assertEquals("Native God-view must render, inspect read-only, retain save and return to world",
                "true",answer);
        }
    }
}
