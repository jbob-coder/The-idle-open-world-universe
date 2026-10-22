#!/usr/bin/env python3
"""SDK-free minimal offline Android WebView APK compiler.
Generates DEX and binary AndroidManifest.xml, packages a local asset, and
uses JDK keytool/jarsigner for v1 APK signing. For local experiments ONLY.
No internet, Android SDK, Gradle, third-party packages or runtime permissions.
"""
import hashlib, json, os, struct, subprocess, tempfile, zipfile, zlib
from pathlib import Path
P=Path(__file__).resolve().parents[1]
OUT=P/'dist';OUT.mkdir(exist_ok=True)
APK=OUT/'GODSEED-v1-experimental.apk'

U16=lambda n:struct.pack('<H',n)
U32=lambda n:struct.pack('<I',n)
NO=0xffffffff

def leb(v):
    out=bytearray()
    while True:
        b=v&127;v>>=7
        out.append(b|(128 if v else 0))
        if not v: return bytes(out)

def align(b,n=4):
    while len(b)%n:b.extend(b'\0')

class Dex:
    def __init__(self):
        self.owner='Lio/godseed/one/MainActivity;'
        self.methods=[
         ('Landroid/app/Activity;','<init>','V',()),
         ('Landroid/app/Activity;','onCreate','V',('Landroid/os/Bundle;',)),
         ('Landroid/app/Activity;','requestWindowFeature','Z',('I',)),
         ('Landroid/app/Activity;','setContentView','V',('Landroid/view/View;',)),
         ('Landroid/webkit/WebSettings;','setDomStorageEnabled','V',('Z',)),
         ('Landroid/webkit/WebSettings;','setJavaScriptEnabled','V',('Z',)),
         ('Landroid/webkit/WebView;','<init>','V',('Landroid/content/Context;',)),
         ('Landroid/webkit/WebView;','getSettings','Landroid/webkit/WebSettings;',()),
         ('Landroid/webkit/WebView;','loadUrl','V',('Ljava/lang/String;',)),
         (self.owner,'<init>','V',()),
         (self.owner,'onCreate','V',('Landroid/os/Bundle;',)),
        ]
        self.types=set([self.owner,'Landroid/app/Activity;','Landroid/os/Bundle;','Landroid/webkit/WebView;','Landroid/webkit/WebSettings;','Landroid/view/View;','Landroid/content/Context;','Ljava/lang/String;','V','I','Z'])
        self.protos=set()
        for c,n,ret,params in self.methods:
            self.types.add(c);self.types.add(ret);self.types.update(params);self.protos.add((ret,params))
        self.strings=set(self.types)|{n for _,n,_,_ in self.methods}|{'file:///android_asset/index.html','MainActivity.java'}
        for ret,params in self.protos:self.strings.add(('L' if ret.startswith('L') or ret.startswith('[') else ret)+''.join('L' if p.startswith('L') or p.startswith('[') else p for p in params))
        self.strings=sorted(self.strings);self.sid={s:i for i,s in enumerate(self.strings)}
        self.types=sorted(self.types,key=lambda s:self.sid[s]);self.tid={s:i for i,s in enumerate(self.types)}
        self.protos=sorted(self.protos,key=lambda p:(self.tid[p[0]], tuple(self.tid[x] for x in p[1])))
        self.pid={p:i for i,p in enumerate(self.protos)}
        self.methods=sorted(self.methods,key=lambda m:(self.tid[m[0]],self.sid[m[1]],self.pid[(m[2],m[3])]))
        self.mid={m:i for i,m in enumerate(self.methods)}
    def emit35(self,op,m,regs):
        k=self.mid[m];r=list(regs)+[0]*5
        return [op | (((len(regs)<<4)|r[4])<<8),k,r[0]|(r[1]<<4)|(r[2]<<8)|(r[3]<<12)]
    def code(self,which):
        if which=='ctor':
            ins=self.emit35(0x70,('Landroid/app/Activity;','<init>','V',()),[0])+[0x000e]
            regs,insargs,outs=1,1,1
        else:
            o=self.owner;v='Landroid/webkit/WebView;';settings='Landroid/webkit/WebSettings;'
            ins=[]
            ins+=self.emit35(0x6f,('Landroid/app/Activity;','onCreate','V',('Landroid/os/Bundle;',)),[3,4])
            ins+=[0x1012] # const/4 v0, #1 (for requestWindowFeature; overwritten below)
            ins+=self.emit35(0x6e,('Landroid/app/Activity;','requestWindowFeature','Z',('I',)),[3,0])
            ins+=[0x0022,self.tid[v]] # new-instance v0, WebView
            ins+=self.emit35(0x70,(v,'<init>','V',('Landroid/content/Context;',)),[0,3])
            ins+=self.emit35(0x6e,(v,'getSettings',settings,()),[0])
            ins+=[0x010c] # move-result-object v1
            ins+=[0x1212] # const/4 v2, #1
            ins+=self.emit35(0x6e,(settings,'setJavaScriptEnabled','V',('Z',)),[1,2])
            ins+=self.emit35(0x6e,(settings,'setDomStorageEnabled','V',('Z',)),[1,2])
            ins+=[0x011a,self.sid['file:///android_asset/index.html']]
            ins+=self.emit35(0x6e,(v,'loadUrl','V',('Ljava/lang/String;',)),[0,1])
            ins+=self.emit35(0x6e,('Landroid/app/Activity;','setContentView','V',('Landroid/view/View;',)),[3,0])
            ins+=[0x000e]
            regs,insargs,outs=5,2,2
        return struct.pack('<HHHHII',regs,insargs,outs,0,0,len(ins))+struct.pack('<'+'H'*len(ins),*ins)
    def build(self):
        # Header 0x70, followed by fixed ID tables and a single class definition.
        d=bytearray(b'\0'*0x70)
        offsets={}
        for name,count,stride in [('strings',len(self.strings),4),('types',len(self.types),4),('protos',len(self.protos),12),('methods',len(self.methods),8),('classes',1,32)]:
            offsets[name]=len(d);d.extend(b'\0'*(count*stride))
        align(d);data_off=len(d)
        type_lists={}
        for ret,params in self.protos:
            if params not in type_lists and params:
                align(d);type_lists[params]=len(d);d+=U32(len(params))+b''.join(U16(self.tid[t]) for t in params)
        code_off={}
        for m in (next(x for x in self.methods if x[0]==self.owner and x[1]=='<init>'),next(x for x in self.methods if x[0]==self.owner and x[1]=='onCreate')):
            align(d);code_off[m]=len(d);d+=self.code('ctor' if m[1]=='<init>' else 'main')
        class_data_off=len(d)
        ctor=next(x for x in code_off if x[1]=='<init>');main=next(x for x in code_off if x[1]=='onCreate')
        d+=b''.join([leb(0),leb(0),leb(1),leb(1),leb(self.mid[ctor]),leb(0x10001),leb(code_off[ctor]),leb(self.mid[main]),leb(0x0004),leb(code_off[main])])
        string_data_off=len(d);string_offsets=[]
        for text in self.strings:
            string_offsets.append(len(d));b=text.encode('utf8');d+=leb(len(text))+b+b'\0'
        align(d)
        map_off=len(d)
        maps=[(0x0000,1,0),(0x0001,len(self.strings),offsets['strings']),(0x0002,len(self.types),offsets['types']),(0x0003,len(self.protos),offsets['protos']),(0x0005,len(self.methods),offsets['methods']),(0x0006,1,offsets['classes'])]
        if type_lists:maps.append((0x1001,len(type_lists),min(type_lists.values())))
        maps.extend([(0x2001,2,min(code_off.values())),(0x2000,1,class_data_off),(0x2002,len(self.strings),string_data_off),(0x1000,1,map_off)])
        maps=sorted(maps,key=lambda r:r[2])
        d+=U32(len(maps))+b''.join(struct.pack('<HHII',kind,0,cnt,off) for kind,cnt,off in maps)
        for i,v in enumerate(string_offsets):struct.pack_into('<I',d,offsets['strings']+i*4,v)
        for i,t in enumerate(self.types):struct.pack_into('<I',d,offsets['types']+i*4,self.sid[t])
        for i,(ret,params) in enumerate(self.protos):
            sh=('L' if ret.startswith('L') or ret.startswith('[') else ret)+''.join('L' if p.startswith('L') or p.startswith('[') else p for p in params)
            struct.pack_into('<III',d,offsets['protos']+i*12,self.sid[sh],self.tid[ret],type_lists.get(params,0))
        for i,m in enumerate(self.methods):struct.pack_into('<HHI',d,offsets['methods']+i*8,self.tid[m[0]],self.pid[(m[2],m[3])],self.sid[m[1]])
        struct.pack_into('<IIIIIIII',d,offsets['classes'],self.tid[self.owner],1,self.tid['Landroid/app/Activity;'],0,self.sid['MainActivity.java'],0,class_data_off,0)
        d[0:8]=b'dex\n035\0'
        struct.pack_into('<I',d,32,len(d));struct.pack_into('<I',d,36,0x70);struct.pack_into('<I',d,40,0x12345678)
        struct.pack_into('<I',d,52,map_off)
        struct.pack_into('<IIIIIIIIIIII',d,56,len(self.strings),offsets['strings'],len(self.types),offsets['types'],len(self.protos),offsets['protos'],0,0,len(self.methods),offsets['methods'],1,offsets['classes'])
        struct.pack_into('<II',d,104,len(d)-data_off,data_off)
        d[12:32]=hashlib.sha1(d[32:]).digest()
        struct.pack_into('<I',d,8,zlib.adler32(d[12:])&0xffffffff)
        return bytes(d)

class Axml:
    URI='http://schemas.android.com/apk/res/android'
    RES={'theme':0x01010000,'label':0x01010001,'name':0x01010003,'exported':0x01010010,'screenOrientation':0x0101001e,'versionCode':0x0101021b,'versionName':0x0101021c,'minSdkVersion':0x0101020c,'targetSdkVersion':0x01010270,'allowBackup':0x01010280,'hardwareAccelerated':0x010102d3,'usesCleartextTraffic':0x010104ec}
    def __init__(self):self.ss=[]
    def sid(self,s):
        if s not in self.ss:self.ss.append(s)
        return self.ss.index(s)
    def chunk(self,kind,header,size,data):return struct.pack('<HHI',kind,header,size)+data
    def pool(self):
        raw=b'';offs=[]
        def u8length(x):return bytes([x]) if x<128 else bytes([(x>>8)|0x80,x&0xff])
        for s in self.ss:
            offs.append(len(raw));b=s.encode('utf8');raw+=u8length(len(s))+u8length(len(b))+b+b'\0'
        raw+=bytes((-len(raw))%4)
        head=struct.pack('<IIIII',len(self.ss),0,0x100,28+len(offs)*4,0)
        return self.chunk(1,28,8+len(head)+len(offs)*4+len(raw),head+b''.join(U32(o) for o in offs)+raw)
    def node(self,kind,extra):return self.chunk(kind,16,16+len(extra),U32(0)+U32(NO)+extra)
    def ns(self,start):return self.node(0x0100 if start else 0x0101,U32(self.sid('android'))+U32(self.sid(self.URI)))
    def start(self,tag,attrs=None):
        attrs=attrs or []; attrs=sorted(attrs,key=lambda a:(self.RES.get(a[0],9999999),a[0]))
        vals=b''
        for key,value,typ in attrs:
            ns=self.sid(self.URI) if key in self.RES else NO
            name=self.sid(key)
            raw=self.sid(value) if typ=='string' else NO
            data=self.sid(value) if typ=='string' else (value&0xffffffff)
            t={'string':3,'int':16,'bool':18,'ref':1}[typ]
            vals+=struct.pack('<IIIHBBI',ns,name,raw,8,0,t,data)
        ext=struct.pack('<IIHHHHHH',NO,self.sid(tag),20,20,len(attrs),0,0,0)+vals
        return self.node(0x0102,ext)
    def end(self,tag):return self.node(0x0103,U32(NO)+U32(self.sid(tag)))
    def build(self):
        # Collect indices up front, because pool must be first serialized XML chunk.
        chunks=[self.ns(True)]
        chunks.append(self.start('manifest',[('package','io.godseed.one','string'),('versionCode',5,'int'),('versionName','1.0-experimental','string')]))
        chunks.extend([self.start('uses-sdk',[('minSdkVersion',26,'int'),('targetSdkVersion',28,'int')]),self.end('uses-sdk')])
        chunks.append(self.start('application',[('label','GODSEED','string'),('theme',0x01030007,'ref'),('allowBackup',False,'bool'),('hardwareAccelerated',True,'bool'),('usesCleartextTraffic',False,'bool')]))
        chunks.append(self.start('activity',[('name','io.godseed.one.MainActivity','string'),('exported',True,'bool'),('screenOrientation',0,'int')]))
        chunks.append(self.start('intent-filter'))
        chunks.extend([self.start('action',[('name','android.intent.action.MAIN','string')]),self.end('action')])
        chunks.extend([self.start('category',[('name','android.intent.category.LAUNCHER','string')]),self.end('category')])
        chunks.extend([self.end('intent-filter'),self.end('activity'),self.end('application'),self.end('manifest'),self.ns(False)])
        # The resource map associates attribute names with Android framework resource IDs.
        max_idx=max(self.sid(x) for x in self.RES if x in self.ss)
        ids=[0]*(max_idx+1)
        for k,v in self.RES.items():
            if k in self.ss:ids[self.sid(k)]=v
        m=self.chunk(0x0180,8,8+len(ids)*4,b''.join(U32(x) for x in ids))
        combined=self.pool()+m+b''.join(chunks)
        return self.chunk(0x0003,8,8+len(combined),combined)

def main():
    raw=Dex().build();xml=Axml().build()
    (OUT/'classes.dex').write_bytes(raw)
    (OUT/'AndroidManifest.binary.xml').write_bytes(xml)
    unsigned=OUT/'GODSEED-unsigned.apk'
    with zipfile.ZipFile(unsigned,'w') as z:
        z.writestr('AndroidManifest.xml',xml,compress_type=zipfile.ZIP_STORED)
        z.writestr('classes.dex',raw,compress_type=zipfile.ZIP_STORED)
        z.write(P/'GODSEED-Play.html','assets/index.html',compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
    # Debug signing key created locally and provided with source for reproducible prototype builds.
    keydir=P/'android'/'debug-only';keydir.mkdir(exist_ok=True)
    key=keydir/'godseed-debug.jks'
    if not key.exists():
        subprocess.run(['keytool','-genkeypair','-alias','godseed','-keyalg','RSA','-keysize','2048','-validity','3650','-keystore',str(key),'-storepass','godseed-demo','-keypass','godseed-demo','-dname','CN=GODSEED Prototype, O=Local Development, C=US','-noprompt'],check=True,stdout=subprocess.DEVNULL)
    APK.write_bytes(unsigned.read_bytes())
    subprocess.run(['jarsigner','-keystore',str(key),'-storepass','godseed-demo','-keypass','godseed-demo','-digestalg','SHA-256','-sigalg','SHA256withRSA',str(APK),'godseed'],check=True,stdout=subprocess.DEVNULL)
    verify=subprocess.run(['jarsigner','-verify','-verbose','-certs',str(APK)],capture_output=True,text=True)
    assert verify.returncode==0,verify.stdout+verify.stderr
    checks={'apk':APK.name,'size':APK.stat().st_size,'sha256':hashlib.sha256(APK.read_bytes()).hexdigest(),'dex_sha1':hashlib.sha1(raw).hexdigest(),'min_sdk':26,'target_sdk':28,'signature':'JAR v1 debug', 'verified_with':'jarsigner -verify'}
    (OUT/'manifest.json').write_text(json.dumps(checks,indent=2)+'\n')
    print(json.dumps(checks,indent=2))
if __name__=='__main__':main()
