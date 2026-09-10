import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const dist=new URL('../dist/',import.meta.url);

test('Every offline asset resolves under a GitHub Pages repository subpath',async()=>{
 const sw=await readFile(new URL('sw.js',dist),'utf8');
 const assets=JSON.parse(sw.match(/const ASSETS=(.*);/)[1]);
 const origin=new URL('https://example.github.io/ceknaskah-offline/');
 assert.ok(assets.includes('./index.html'));
 assert.ok(assets.includes('./parser.js'));
 assert.ok(assets.includes('./worker.js'));
 assert.ok(assets.includes('./pdf.worker.min.mjs'));
 for(const asset of assets){
  const url=new URL(asset,origin);
  assert.equal(url.origin,origin.origin);
  assert.ok(url.pathname.startsWith(origin.pathname),asset);
  assert.ok((await stat(new URL(asset==='./'?'index.html':asset,dist))).isFile(),asset);
 }
});

test('HTML and PWA entrypoints use relative URLs for project Pages',async()=>{
 const html=await readFile(new URL('index.html',dist),'utf8');
 for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  assert.ok(match[1].startsWith('./'),match[1]);
  assert.ok((await stat(new URL(match[1],dist))).isFile(),match[1]);
 }
 const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',dist),'utf8'));
 assert.equal(manifest.scope,'./');
 assert.equal(manifest.start_url,'./');
 assert.equal(manifest.id,'./');
});
