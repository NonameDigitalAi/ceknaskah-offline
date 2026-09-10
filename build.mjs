import {build} from 'esbuild';
import {mkdir,cp,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('dist',{recursive:true});
for(const name of ['client','server','.openai'])await rm('dist/'+name,{recursive:true,force:true});
await rm('dist/chunks',{recursive:true,force:true});
await build({entryPoints:{app:'src/App.jsx',parser:'src/parser.mjs',worker:'src/worker.mjs'},bundle:true,outdir:'dist',format:'esm',splitting:true,chunkNames:'chunks/[name]-[hash]',minify:true,legalComments:'eof',loader:{'.css':'css'}});
await writeFile('dist/pdf.worker.min.mjs',await readFile('node_modules/pdfjs-dist/build/pdf.worker.min.mjs'));
async function copyTree(from,to){await mkdir(to,{recursive:true});for(const entry of await readdir(from,{withFileTypes:true})){if(entry.isDirectory())await copyTree(`${from}/${entry.name}`,`${to}/${entry.name}`);else await writeFile(`${to}/${entry.name}`,await readFile(`${from}/${entry.name}`));}}
for(const folder of ['cmaps','standard_fonts','wasm'])await copyTree(`node_modules/pdfjs-dist/${folder}`,`dist/${folder}`);
async function files(dir){const out=[];for(const f of await readdir(dir,{withFileTypes:true})){if(f.isDirectory())out.push(...await files(`${dir}/${f.name}`));else out.push(`${dir}/${f.name}`);}return out;}
const assets=(await files('dist')).filter(p=>!p.endsWith('/sw.js')&&!/ \d+\./.test(p)&&!p.split('/').some(x=>x.startsWith('.'))).sort();
const hash=createHash('sha256');for(const path of assets)hash.update(await readFile(path));
const version=hash.digest('hex').slice(0,16);
const template=await readFile('src/sw-template.js','utf8');
await writeFile('dist/sw.js',template.replace('__VERSION__',version).replace('__ASSETS__',JSON.stringify(['./',...assets.map(p=>'./'+p.slice(5))])));
console.log(`Built ${assets.length} local assets. Offline version ${version}.`);

// Publish only the public client directory to GitHub Pages; Sites also gets the Worker.
await mkdir('dist/client',{recursive:true});
for(const entry of await readdir('dist',{withFileTypes:true})){
 if(['client','server','.openai'].includes(entry.name))continue;
 await cp('dist/'+entry.name,'dist/client/'+entry.name,{recursive:true});
}
await build({entryPoints:['server/worker.mjs'],bundle:true,outfile:'dist/server/index.js',format:'esm',platform:'browser',target:'es2022',minify:true});
await mkdir('dist/.openai',{recursive:true});
let hosting={};try{hosting=JSON.parse(await readFile('.openai/hosting.json','utf8'));}catch{}
delete hosting.static;
await writeFile('dist/.openai/hosting.json',JSON.stringify(hosting));
