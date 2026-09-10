import http from 'node:http';
import {Readable} from 'node:stream';
import {handleOnline} from './server/online-api.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const port=Number(process.env.PORT||4173);
const root=path.resolve(import.meta.dirname,'dist');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.wasm':'application/wasm','.bcmap':'application/octet-stream','.ttf':'font/ttf'};
http.createServer(async(req,res)=>{try{if(req.url.startsWith('/api/')){const request=new Request('http://localhost:'+port+req.url,{method:req.method,headers:req.headers,...(req.method==='GET'||req.method==='HEAD'?{}:{body:Readable.toWeb(req),duplex:'half'})});const response=await handleOnline(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;}const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));if(!file.startsWith(root+path.sep))throw Error();const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);}catch{res.writeHead(404);res.end('Tidak ditemukan');}}).listen(port,'127.0.0.1',()=>console.log('CekNaskah: http://localhost:'+port));
