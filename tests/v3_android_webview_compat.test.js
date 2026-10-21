"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const modules=[
  "sim","frontier","society","world","world_travel","infrastructure",
  "agency","discovery","social","projects","expedition","world_sim",
  "atlas","view","fallback","app"
];
test("offline V3 modules remain parsable on old Android 10 WebViews",()=>{
  // Android API 29's stock WebView can ship Chromium 74, which cannot parse
  // optional chaining or nullish coalescing. A single parse error prevents
  // the bundled offline app and its save lifecycle from initializing.
  for(const name of modules){
    const source=fs.readFileSync(path.join(root,"src/v3",name+".js"),"utf8");
    assert.equal(/\?\.|\?\?/.test(source),false,
      name+" introduced JavaScript syntax unsupported by Chromium 74");
  }
});
test("native V3 host launches the large world rather than the tiny solo demo",()=>{
  const host=fs.readFileSync(path.join(root,
    "android/v3/app/src/main/java/io/godseed/v3preview/MainActivity.java"),"utf8");
  assert.match(host,/GAME_URL\s*=\s*BASE_URL\s*\+\s*"\?mode=world"/);
  assert.match(host,/web\.loadUrl\(GAME_URL\)/);
});
