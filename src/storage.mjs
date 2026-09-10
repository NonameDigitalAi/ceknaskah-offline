import {LIMITS,tokenize} from './engine.mjs';
const DB='ceknaskah-v1';
export function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Tutup tab CekNaskah lain lalu coba lagi.'));});}
export async function readState(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction('state');const r=tx.objectStore('state').get('main');r.onsuccess=()=>resolve(r.result||{schemaVersion:1,sources:[],reports:[],draft:{title:'',text:'',exclusions:[],parentId:null},settings:{minMatch:8,lang:'id'}});r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
export async function saveState(state){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'main');tx.oncomplete=()=>{db.close();resolve();};tx.onabort=tx.onerror=()=>{db.close();reject(Error('Data belum tersimpan. Penyimpanan penuh atau tidak tersedia; ekspor cadangan Anda.'));};});}
const str=(v,max=LIMITS.textChars)=>typeof v==='string'&&v.length<=max;
export function validateBackup(value){
 if(!value||value.format!=='ceknaskah-backup'||value.schemaVersion!==1)throw Error('Format atau versi cadangan tidak didukung.');
 const s=value.state;if(!s||s.schemaVersion!==1||!Array.isArray(s.sources)||s.sources.length>LIMITS.sources||!Array.isArray(s.reports)||s.reports.length>500)throw Error('Struktur cadangan tidak valid atau terlalu besar.');
 const ids=new Set();for(const x of s.sources){if(!str(x.id,100)||ids.has(x.id)||!str(x.title,500)||!str(x.text)||!str(x.hash,64)||typeof x.active!=='boolean')throw Error('Data sumber dalam cadangan tidak valid.');ids.add(x.id);}
 const ranges=(r,text)=>Array.isArray(r)&&r.length<=10000&&r.every(e=>Number.isInteger(e.start)&&Number.isInteger(e.end)&&e.start>=0&&e.end>e.start&&e.end<=text.length);
 if(!s.draft||!str(s.draft.text)||!str(s.draft.title,500)||!ranges(s.draft.exclusions||[],s.draft.text))throw Error('Naskah cadangan tidak valid.');
 const rids=new Set();for(const r of s.reports){
  if(!str(r.id,100)||rids.has(r.id)||!str(r.text)||!str(r.title,500)||!str(r.createdAt,100)||!str(r.hash,64)||!['complete','partial','unavailable','interrupted','running'].includes(r.status)||!Array.isArray(r.matches)||!Array.isArray(r.used)||!Array.isArray(r.failed)||!Number.isInteger(r.minMatch)||r.minMatch<2||r.minMatch>100||!ranges(r.exclusions||[],r.text))throw Error('Laporan cadangan tidak valid.');
  rids.add(r.id);const sourceIds=new Set(r.used.map(x=>x.id));
  for(const x of r.used)if(!str(x.id,100)||!str(x.title,500)||!Number.isInteger(x.matchedTokens)||x.matchedTokens<0)throw Error('Snapshot sumber tidak valid.');
  for(const m of r.matches)if(!ranges([m],r.text)||!sourceIds.has(m.sourceId)||!str(m.quote)||!str(m.context)||!str(m.sourceTitle,500)||!str(m.id,150))throw Error('Relasi atau kutipan laporan tidak valid.');
  if(r.notes&&(!Array.isArray(r.notes)||!r.notes.every(x=>str(x.matchId,150)&&str(x.text,10000)&&r.matches.some(m=>m.id===x.matchId))))throw Error('Catatan tidak valid.');
  if(r.score!==null&&(!Number.isFinite(r.score)||r.score<0||r.score>100))throw Error('Skor tidak valid.');
  for(const k of ['totalTokens','eligibleTokens','matchedTokens'])if(!Number.isInteger(r[k])||r[k]<0)throw Error('Jumlah token tidak valid.');
  if(['complete','partial','unavailable'].includes(r.status)){
   const tokens=tokenize(r.text),eligible=tokens.map(t=>!(r.exclusions||[]).some(x=>t.start<x.end&&t.end>x.start)),covered=new Set(),perSource=new Map();
   for(const m of r.matches){
    const a=tokens.findIndex(t=>t.start===m.start),b=tokens.findIndex(t=>t.end===m.end);
    if(a<0||b<a||b-a+1<r.minMatch||m.words!==b-a+1||!Number.isInteger(m.sourceStart)||!Number.isInteger(m.sourceEnd)||m.sourceStart<0||m.sourceEnd<=m.sourceStart||tokenize(m.quote).map(t=>t.value).join(' ')!==tokens.slice(a,b+1).map(t=>t.value).join(' '))throw Error('Bukti kecocokan cadangan tidak konsisten.');
    if(!perSource.has(m.sourceId))perSource.set(m.sourceId,new Set());
    for(let i=a;i<=b;i++){if(!eligible[i])throw Error('Kecocokan bersinggungan dengan pengecualian.');covered.add(i);perSource.get(m.sourceId).add(i);}
   }
   const count=eligible.filter(Boolean).length,score=!count||!r.used.length?null:covered.size/count*100;
   if(r.totalTokens!==tokens.length||r.eligibleTokens!==count||r.matchedTokens!==covered.size||(score===null?r.score!==null:r.score===null||Math.abs(r.score-score)>0.000001))throw Error('Skor cadangan tidak konsisten dengan bukti.');
   for(const source of r.used)if(source.matchedTokens!==(perSource.get(source.id)?.size||0))throw Error('Kontribusi sumber tidak konsisten.');
  }
 }
 for(const r of s.reports)if(r.parentId&&(!rids.has(r.parentId)||r.parentId===r.id))throw Error('Versi induk tidak ditemukan atau tidak valid.');
 if(s.draft.parentId&&!rids.has(s.draft.parentId))throw Error('Versi induk draf tidak ditemukan.');
 if(!s.settings||!['id','en'].includes(s.settings.lang)||!Number.isInteger(s.settings.minMatch)||s.settings.minMatch<2||s.settings.minMatch>100)throw Error('Pengaturan cadangan tidak valid.');
 return structuredClone(s);
}
export function mergeBackup(current,incoming){
 const merged=structuredClone(current),sourceMap=new Map(),reportMap=new Map();
 for(const s of incoming.sources){const existing=merged.sources.find(x=>x.hash===s.hash);if(existing){sourceMap.set(s.id,existing.id);continue;}const id=crypto.randomUUID();sourceMap.set(s.id,id);merged.sources.push({...s,id});}
 if(merged.sources.length>LIMITS.sources)throw Error('Gabungan sumber melampaui batas 200.');
 for(const r of incoming.reports)reportMap.set(r.id,crypto.randomUUID());
 for(const r of incoming.reports)merged.reports.push({...r,id:reportMap.get(r.id),parentId:reportMap.get(r.parentId)||null,status:r.status==='running'?'interrupted':r.status});
 if(merged.reports.length>500)throw Error('Gabungan riwayat melampaui batas 500; gunakan arsip terpisah.');
 // Preserve report snapshots, including the original source IDs and excerpts.
 merged.draft={...incoming.draft,parentId:reportMap.get(incoming.draft.parentId)||null};merged.settings=incoming.settings;return merged;
}
