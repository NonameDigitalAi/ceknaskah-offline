// Stateless proxy: credentials and manuscripts are neither logged nor persisted.
// Provider API: https://docs.gowinston.ai/api-reference/introduction
import {ONLINE_MAX_CHARS} from '../src/online-config.mjs';
const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const percent=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=100;
const count=x=>Number.isSafeInteger(x)&&x>=0?x:null;
const string=(x,max=1000)=>typeof x==='string'?x.slice(0,max):'';
export function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function normalizeResult(kind,raw){
 const meta={provider:'Winston AI',creditsUsed:count(raw.credits_used),creditsRemaining:count(raw.credits_remaining)};
 if(kind==='ai'){
  if(!percent(raw.score))throw Error('invalid-provider-result');
  return {...meta,kind,humanScore:raw.score,aiScore:100-raw.score,model:string(raw.version,80),language:string(raw.language,20),sentences:(Array.isArray(raw.sentences)?raw.sentences:[]).slice(0,20000).filter(s=>typeof s?.text==='string'&&percent(s.score)).map(s=>({text:s.text.slice(0,ONLINE_MAX_CHARS),humanScore:s.score,aiScore:100-s.score}))};
 }
 if(!percent(raw.result?.score)||!Array.isArray(raw.sources))throw Error('invalid-provider-result');
 return {...meta,kind,score:raw.result.score,wordCount:count(raw.result.textWordCounts),matchedWords:count(raw.result.totalPlagiarismWords),language:string(raw.scanInformation?.language,20),sources:raw.sources.slice(0,1000).map(s=>({title:string(s.title),url:safeUrl(s.url),score:percent(s.score)?s.score:null,matchedWords:count(s.plagiarismWords),excluded:s.is_excluded===true,description:string(s.description,4000),passages:(Array.isArray(s.plagiarismFound)?s.plagiarismFound:[]).slice(0,2000).map(p=>({text:string(p.sequence,ONLINE_MAX_CHARS)}))}))};
}
export async function limitedJson(request,maxBytes){
 if(Number(request.headers.get('content-length'))>maxBytes)throw Error('too-large');
 const reader=request.body?.getReader();if(!reader)throw Error('invalid-json');
 const parts=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw Error('too-large');}parts.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export async function handleOnline(request,fetchImpl=fetch){
 const url=new URL(request.url);
 if(url.pathname==='/api/online/status'&&request.method==='GET')return json({service:'ceknaskah-online',version:2,provider:'Winston AI',requiresPersonalKey:true});
 if(url.pathname!=='/api/online/scan')return json({error:'Alamat layanan tidak ditemukan.'},404);
 if(request.method!=='POST')return json({error:'Metode tidak tersedia.'},405);
 if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({error:'Permintaan lintas situs ditolak.'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Format permintaan harus JSON.'},415);
 const key=request.headers.get('x-winston-key')?.trim();
 if(!key||key.length<12||key.length>1024||/[\s\x00-\x1f\x7f]/.test(key))return json({error:'Masukkan API token Winston AI yang valid.'},401);
 let body;try{body=await limitedJson(request,800000);}catch(e){return json({error:e.message==='too-large'?'Naskah terlalu besar.':'Permintaan tidak valid.'},e.message==='too-large'?413:400);}
 if(!body||typeof body!=='object'||!['ai','plagiarism'].includes(body.kind)||!['id','en','auto'].includes(body.language)||body.consent!==true||typeof body.text!=='string')return json({error:'Pilih pemeriksaan, bahasa, dan persetujuan pengiriman naskah.'},400);
 const {kind,language}=body,text=body.text.trim(),minimum=kind==='ai'?300:100;
 if(text.length<minimum||text.length>ONLINE_MAX_CHARS)return json({error:`Pemeriksaan ini memerlukan ${minimum}–${ONLINE_MAX_CHARS} karakter.`},400);
 const endpoint=kind==='ai'?'ai-content-detection':'plagiarism';
 const payload=kind==='ai'?{text,language,version:'latest',sentences:true}:{text,language,country:language==='id'?'id':'us'};
 try{
  const response=await fetchImpl(`https://api.gowinston.ai/v2/${endpoint}`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(payload),redirect:'error',signal:AbortSignal.timeout(120000)});
  if(!response.ok){const messages={400:'Naskah atau bahasa ditolak layanan. Periksa panjang dan bahasa naskah.',401:'API token tidak valid atau telah dicabut.',402:'Kredit Winston AI tidak cukup. Tidak ada pembelian otomatis dari CekNaskah.',403:'Akun belum memiliki akses untuk pemeriksaan ini.',429:'Batas permintaan tercapai. Tunggu sebelum mencoba kembali.'};return json({error:messages[response.status]||'Winston AI belum dapat menyelesaikan pemeriksaan. Periksa riwayat penggunaan sebelum mencoba kembali.'},[400,401,402,403,429].includes(response.status)?response.status:502);}
  const raw=await limitedJson(response,12000000);
  if(raw.error||raw.status!==200)return json({error:'Layanan mengembalikan hasil yang tidak berhasil. Tidak ada skor yang dapat ditampilkan.'},502);
  return json(normalizeResult(kind,raw));
 }catch(e){return json({error:e.message==='invalid-provider-result'?'Hasil layanan tidak lengkap. Skor tidak ditampilkan.':'Koneksi layanan terputus atau waktu tunggu habis. Permintaan mungkin sudah menggunakan kredit; periksa dashboard Winston sebelum mengulang.'},502);}
}
