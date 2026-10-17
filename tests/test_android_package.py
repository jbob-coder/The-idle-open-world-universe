"""Independent structural checks for SDK-free APK and its Android binary formats."""
from pathlib import Path
import hashlib,struct,subprocess,zipfile,zlib,json
P=Path(__file__).resolve().parents[1]
A=P/'dist/GODSEED-v0.4-debug.apk'
assert A.exists(),A
with zipfile.ZipFile(A) as z:
    assert z.testzip() is None
    names=z.namelist()
    assert 'classes.dex' in names and 'AndroidManifest.xml' in names and 'assets/index.html' in names
    assert 'META-INF/MANIFEST.MF' in names
    assert any(n.endswith('.RSA') for n in names)
    dex=z.read('classes.dex');xml=z.read('AndroidManifest.xml');html=z.read('assets/index.html')
    assert html==(P/'GODSEED-Play.html').read_bytes()
    assert b'GodseedSim' in html and b'GodseedDebug' in html and b'androidDock' in html
    assert not any(n.startswith('lib/') for n in names)
# Header and pool sanity
u16=lambda b,o:struct.unpack_from('<H',b,o)[0]
u32=lambda b,o:struct.unpack_from('<I',b,o)[0]
assert dex[:8]==b'dex\n035\0'
assert u32(dex,32)==len(dex)
assert dex[12:32]==hashlib.sha1(dex[32:]).digest()
assert u32(dex,8)==(zlib.adler32(dex[12:])&0xffffffff)
assert u32(dex,40)==0x12345678
assert u32(dex,36)==112
nstr,offstr=u32(dex,56),u32(dex,60)
ntype,offtype=u32(dex,64),u32(dex,68)
nproto,offproto=u32(dex,72),u32(dex,76)
nmeth,offmeth=u32(dex,88),u32(dex,92)
assert 10<nstr<150 and ntype>=10 and nproto>=5 and nmeth>=10
assert offstr==112
strs=[]
for i in range(nstr):
    p=u32(dex,offstr+i*4)
    while dex[p]&128:p+=1
    p+=1
    q=dex.index(0,p)
    strs.append(dex[p:q].decode())
assert strs==sorted(strs)
assert 'Lio/godseed/one/MainActivity;' in strs
assert 'file:///android_asset/index.html' in strs
assert 'setJavaScriptEnabled' in strs
assert 'setDomStorageEnabled' in strs
assert 'loadUrl' in strs
# Ensure all indices in method table address valid type and string positions.
for i in range(nmeth):
    cls,proto,name=struct.unpack_from('<HHI',dex,offmeth+i*8)
    assert cls<ntype and proto<nproto and name<nstr
class_count,class_off=u32(dex,96),u32(dex,100)
assert class_count==1
assert u32(dex,class_off)<ntype
class_data_off=u32(dex,class_off+24)
assert class_data_off>class_off and class_data_off<len(dex)
# Decode chunks and XML text/string pool.
assert (u16(xml,0),u16(xml,2),u32(xml,4))==(3,8,len(xml))
def chunks(blob,off=8):
    while off<len(blob):
        typ,headersize,size=struct.unpack_from('<HHI',blob,off)
        assert size>=headersize>=8 and off+size<=len(blob)
        yield typ,off,size
        off+=size
    assert off==len(blob)
xchunks=list(chunks(xml))
assert xchunks[0][0]==1 and any(t==0x180 for t,_,_ in xchunks)
assert sum(t==0x102 for t,_,_ in xchunks)==7
assert sum(t==0x103 for t,_,_ in xchunks)==7
assert sum(t==0x100 for t,_,_ in xchunks)==1
pool_off=xchunks[0][1]
pool_count=u32(xml,pool_off+8)
pool_flags=u32(xml,pool_off+16)
assert pool_flags & 0x100
stringdata_base=pool_off+u32(xml,pool_off+20)
start=pool_off+28
text=[]
for i in range(pool_count):
    p=stringdata_base+u32(xml,start+i*4)
    def length(o):
        v=xml[o];return (v,o+1) if v<128 else (((v&127)<<8)|xml[o+1],o+2)
    nch,p=length(p);nbyte,p=length(p)
    text.append(xml[p:p+nbyte].decode())
assert {'manifest','uses-sdk','application','activity','intent-filter','action','category','io.godseed.one','io.godseed.one.MainActivity'}<=set(text)
assert 'android.intent.action.MAIN' in text and 'android.intent.category.LAUNCHER' in text
result=subprocess.run(['jarsigner','-verify',str(A)],capture_output=True,text=True)
assert result.returncode==0,result.stdout+result.stderr
print(json.dumps({'result':'PASS','apk_bytes':len(A.read_bytes()),'apk_sha256':hashlib.sha256(A.read_bytes()).hexdigest(),'dex_strings':nstr,'method_ids':nmeth,'binary_xml_chunks':len(xchunks),'signature':'JAR v1','web_assets_embedded':True},indent=2))
