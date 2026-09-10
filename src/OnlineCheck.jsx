import React,{useState,useEffect,useRef} from 'react';
import {ONLINE_SITE_URL,WINSTON_DASHBOARD,ONLINE_MAX_CHARS,wordCount,estimateCredits} from './online-config.mjs';
import {download} from './reports.mjs';
import {readReports,putReport,onlineReportHtml} from './online-reports.mjs';
const pct=x=>typeof x==='number'?`${x.toFixed(1)}%`:'—';
const label={ai:'Indikasi tulisan AI',plagiarism:'Kemiripan sumber internet'};

export default function OnlineCheck({draft,setDraft,openFile,importBusy,visible}){
 const [key,setKey]=useState(''),[mode,setMode]=useState('both'),[language,setLanguage]=useState('id'),[consent,setConsent]=useState(false),[server,setServer]=useState('checking'),[running,setRunning]=useState(false),[report,setReport]=useState(null),[error,setError]=useState(''),[history,setHistory]=useState([]),[saveError,setSaveError]=useState('');
 const busyRef=useRef(false);
 const words=wordCount(draft.text),credits=estimateCredits(draft.text,mode),min=mode==='plagiarism'?100:300;
 useEffect(()=>{let active=true;fetch('./api/online/status',{cache:'no-store',signal:AbortSignal.timeout(8000)}).then(r=>r.json()).then(r=>{if(active)setServer(r.service==='ceknaskah-online'?'ready':'missing');}).catch(()=>{if(active)setServer('missing');});return()=>{active=false;};},[]);
 useEffect(()=>{const handler=e=>{if(busyRef.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[]);
 useEffect(()=>{readReports().then(setHistory).catch(()=>setSaveError('Riwayat online belum dapat dibuka. Hasil tetap bisa diunduh.'));},[]);
 useEffect(()=>{setConsent(false);},[draft.text,mode,language]);
 async function run(){
  if(busyRef.current)return;
  if(!key.trim()||!consent||draft.text.trim().length<min||draft.text.length>ONLINE_MAX_CHARS){setError('Lengkapi token, naskah, dan persetujuan pengiriman.');return;}
  busyRef.current=true;setRunning(true);setError('');setSaveError('');
  const kinds=mode==='both'?['ai','plagiarism']:[mode];
  let current={id:crypto.randomUUID(),format:'ceknaskah-online-report',version:1,title:draft.title.trim()||'Naskah tanpa judul',text:draft.text.trim(),createdAt:new Date().toISOString(),language,wordCount:wordCount(draft.text),provider:'Winston AI',estimatedCredits:credits,results:Object.fromEntries(kinds.map(k=>[k,{status:'running'}]))};
  setReport(current);
  // Each request is sent once. There are no automatic retries of credit-consuming scans.
  for(const kind of kinds){
   let result;
   try{const res=await fetch('./api/online/scan',{method:'POST',headers:{'Content-Type':'application/json','X-Winston-Key':key.trim()},body:JSON.stringify({kind,text:current.text,language,consent:true}),signal:AbortSignal.timeout(135000)});let body;try{body=await res.json();}catch{throw Error('Server tidak mengembalikan hasil. Periksa dashboard Winston sebelum mengulang.');}if(!res.ok)throw Error(body.error||'Pemeriksaan gagal.');result={status:'complete',...body};}
   catch(e){result={status:'error',error:e.name==='TimeoutError'?'Waktu tunggu habis. Periksa penggunaan kredit sebelum mengulang.':e.message};}
   current={...current,results:{...current.results,[kind]:result}};setReport(current);
   // Bad credentials or credit exhaustion will usually affect both checks.
   if(result.status==='error'&&/token|Kredit|kredit.*cukup/i.test(result.error)){
    for(const pending of kinds)if(current.results[pending].status==='running')current={...current,results:{...current.results,[pending]:{status:'skipped',error:'Belum dijalankan. Selesaikan kendala akun terlebih dahulu.'}}};
    setReport(current);break;
   }
  }
  current={...current,finishedAt:new Date().toISOString()};setReport(current);
  try{await putReport(current);setHistory(await readReports());}catch{setSaveError('Hasil belum tersimpan di perangkat. Unduh laporan sebelum menutup tab.');}
  busyRef.current=false;setRunning(false);
 }
 const exportJson=()=>download(JSON.stringify(report,null,2),`CekNaskah-online-${report.id}.json`,'application/json');
 return <section className="online-view" hidden={!visible}>
  <div className="page-title"><div><div className="eyebrow">TELITI SEBELUM TERBIT · ONLINE</div><h1>Periksa AI & plagiarisme.</h1><p>Telusuri sumber tulisan dan tinjau indikasi teks buatan AI.</p></div><span className="tag">BAHASA INDONESIA</span></div>
  {server==='missing'&&<div className="info"><strong>Pemeriksaan online membutuhkan server CekNaskah.</strong><p>Jika sedang offline, sambungkan internet lalu muat ulang. Halaman GitHub Pages hanya menyediakan pemeriksaan lokal.</p>{location.origin!==new URL(ONLINE_SITE_URL).origin&&<a className="primary link-button" href={ONLINE_SITE_URL}>Buka CekNaskah Online →</a>}</div>}
  {error&&<div className="error" role="alert">{error}</div>}
  <div className="workspace online-workspace"><section className="panel"><div className="panel-heading"><h2>Naskah pemeriksaan</h2><span className="tag">TXT · DOCX · PDF</span></div><div className="panel-body">
   <label>Judul naskah<input maxLength={500} disabled={running} value={draft.title} onChange={e=>setDraft({title:e.target.value})} placeholder="Judul jurnal atau artikel…"/></label>
   <button className="dropzone online-drop" disabled={running||importBusy} onClick={()=>openFile('draft')}><strong>↥ Pilih dokumen</strong><span>PDF dengan teks, DOCX, atau TXT · maks. 10 MB</span></button>
   <label htmlFor="online-text">Isi naskah</label><textarea id="online-text" disabled={running} maxLength={ONLINE_MAX_CHARS} value={draft.text} onChange={e=>setDraft({text:e.target.value,exclusions:[]})} placeholder="Tempelkan abstrak atau artikel yang ingin diperiksa…"/>
   <div className="editor-footer"><span>{words.toLocaleString('id-ID')} kata · {draft.text.length.toLocaleString('id-ID')} karakter</span><span>Draf di perangkat</span></div>
   {draft.text.length>ONLINE_MAX_CHARS&&<p className="error">Naskah hasil impor terlalu panjang. Maksimal 120.000 karakter untuk pemeriksaan online.</p>}
   {draft.text.trim().length>0&&draft.text.trim().length<min&&<p className="statsline">Tambahkan teks hingga minimal {min} karakter.</p>}
   {mode!=='plagiarism'&&draft.text.length>=300&&draft.text.length<600&&<p className="info">Teks di bawah 600 karakter kurang andal untuk deteksi AI. Gunakan bagian naskah yang lebih panjang.</p>}
   {draft.exclusions?.length>0&&<p className="info">Pengecualian pada pemeriksaan lokal tidak berlaku di sini. Seluruh teks dalam editor akan dikirim.</p>}
  </div></section>
  <div className="right-stack"><section className="panel"><div className="panel-heading"><h2>Pilih pemeriksaan</h2><span className="tag">WINSTON AI</span></div><div className="panel-body">
   <label>Jenis pemeriksaan<select disabled={running} value={mode} onChange={e=>setMode(e.target.value)}><option value="both">AI + plagiarisme</option><option value="ai">Tulisan AI saja</option><option value="plagiarism">Plagiarisme saja</option></select></label>
   <label>Bahasa naskah<select disabled={running} value={language} onChange={e=>setLanguage(e.target.value)}><option value="id">Bahasa Indonesia</option><option value="en">English</option><option value="auto">Deteksi otomatis</option></select></label>
   <div className="credit-estimate"><span>Perkiraan pemakaian</span><strong>≈ {credits.toLocaleString('id-ID')} <small>kredit</small></strong><p>AI: 1 kredit/kata · plagiarisme: 2 kredit/kata. Pemakaian akhir mengikuti hitungan Winston.</p></div>
  </div></section>
  <section className="panel"><div className="panel-heading"><h2>Akses uji coba</h2></div><div className="panel-body"><p>Winston menawarkan 2.000 kredit awal tanpa kartu kredit. Daftar di dashboard API, lalu buat token pribadi.</p><a href={WINSTON_DASHBOARD} target="_blank" rel="noreferrer" className="secondary link-button">Daftar / buka Winston ↗</a>
   <label className="section-gap">API token Winston<input type="password" autoComplete="off" spellCheck="false" maxLength={1024} disabled={running} value={key} onChange={e=>setKey(e.target.value)} placeholder="Tempel token pribadi Anda"/></label>
   <p className="statsline">Token hanya berada di memori tab dan diteruskan melalui server ke Winston saat memeriksa. Token tidak disimpan dalam riwayat atau cadangan.</p>
   {key&&<button disabled={running} className="subtle" onClick={()=>setKey('')}>Hapus token dari sesi</button>}
  </div></section></div></div>
  <div className="online-consent"><label><input type="checkbox" checked={consent} disabled={running} onChange={e=>setConsent(e.target.checked)}/><span>Saya setuju mengirim teks naskah ke Winston AI dan menggunakan kredit akun saya untuk pemeriksaan ini. <a href="https://gowinston.ai/privacy-policy/" target="_blank" rel="noreferrer">Privasi penyedia ↗</a></span></label></div>
  <div className="actionbar"><p>{server==='checking'?'Memeriksa koneksi server…':running?'Pemeriksaan sedang berlangsung. Tetap buka tab ini.':'Mulai dengan 300–500 kata untuk mencoba kedua pemeriksaan.'}</p><button className="primary" disabled={running||importBusy||server!=='ready'||!key.trim()||!consent||draft.text.trim().length<min||draft.text.length>ONLINE_MAX_CHARS} onClick={run}>{running?'Memeriksa…':'Periksa naskah online →'}</button></div>
  {saveError&&<p role="alert" className="error">{saveError}</p>}
  {report&&<section className="online-report section-gap" aria-live="polite"><div className="page-title"><div><div className="eyebrow">HASIL PEMERIKSAAN · WINSTON AI</div><h2>{report.title}</h2><p>{new Date(report.createdAt).toLocaleString('id-ID')} · {report.wordCount} kata</p></div>{!running&&<div className="toolbar"><button className="secondary" onClick={exportJson}>Unduh JSON</button><button className="secondary" onClick={()=>download(onlineReportHtml(report),`CekNaskah-online-${report.id}.html`,'text/html')}>Laporan / PDF</button></div>}</div>
   <div className="online-results">{['ai','plagiarism'].map(kind=><ResultCard key={kind} kind={kind} result={report.results[kind]}/>)}</div>
   <div className="info"><strong>Dua skor, dua arti.</strong><p>Skor AI adalah indikasi model tentang asal tulisan, bukan persentase kata yang pasti dibuat AI. Kemiripan menunjukkan kecocokan sumber; kutipan dan daftar pustaka tetap perlu ditinjau. CekNaskah tidak memakai database atau sertifikasi Turnitin.</p></div>
   {report.results.ai?.status==='complete'&&<section className="panel section-gap"><div className="panel-heading"><h2>Tinjauan per kalimat</h2><span className="tag">INDIKASI AI</span></div><div className="panel-body"><p className="statsline">Skor per kalimat kurang andal daripada penilaian keseluruhan naskah.</p>{report.results.ai.sentences.length?report.results.ai.sentences.map((s,i)=><div className="sentence-row" key={i}><span className={s.aiScore>=50?'sentence-score elevated':'sentence-score'}>{pct(s.aiScore)}</span><p>{s.text}</p></div>):<p>Layanan tidak mengembalikan rincian per kalimat.</p>}</div></section>}
   {report.results.plagiarism?.status==='complete'&&<section className="section-gap"><h2>Sumber yang ditemukan</h2>{report.results.plagiarism.sources.length?report.results.plagiarism.sources.map((s,i)=><article className="match section-gap" key={i}><div className="source-result-title"><h3>{s.title||`Sumber ${i+1}`}</h3><span className="tag">{pct(s.score)} kemiripan</span></div>{s.excluded&&<p>Dikecualikan penyedia dari skor.</p>}{s.url?<a href={s.url} target="_blank" rel="noreferrer">{s.url}</a>:<p>Tautan sumber tidak tersedia.</p>}<p>{s.matchedWords??'—'} kata cocok · {s.description}</p>{s.passages.map((p,j)=><blockquote key={j}>{p.text}</blockquote>)}</article>):<div className="info">Tidak ada sumber cocok yang dikembalikan penyedia. Ini tidak menjamin bebas plagiarisme.</div>}</section>}
   <details className="section-gap"><summary>Naskah yang diperiksa</summary><div className="reading panel-body">{report.text}</div></details>
  </section>}
  <section className="section-gap"><h2>Riwayat online di perangkat ini</h2><p className="statsline">50 laporan terbaru disimpan otomatis, terpisah dari pemeriksaan lokal. Unduh tiap laporan untuk membuat salinan; menghapus data situs akan menghapus arsip.</p>{history.length?<div className="panel">{history.map(r=><div className="history-row" key={r.id}><div><strong>{r.title}</strong><p>{new Date(r.createdAt).toLocaleString('id-ID')}</p></div><button disabled={running} className="secondary" onClick={()=>setReport(r)}>Lihat laporan</button></div>)}</div>:<p>Belum ada pemeriksaan online tersimpan.</p>}</section>
 </section>;
}
function ResultCard({kind,result}){
 return <section className="panel panel-body"><div className="eyebrow">{label[kind]}</div>{result?.status==='complete'?<><strong className="online-score">{pct(kind==='ai'?result.aiScore:result.score)}</strong><p>{kind==='ai'?`Human Score penyedia: ${pct(result.humanScore)} · model ${result.model||'tidak disebutkan'}`:`${result.matchedWords??'—'} kata cocok dari ${result.wordCount??'—'} kata`}</p><p className="statsline">{result.creditsUsed??'—'} kredit dipakai · sisa saat respons: {result.creditsRemaining??'—'}</p></>:<><strong className="online-score">—</strong><p role={result?.status==='error'?'alert':undefined}>{result?.status==='running'?'Menunggu hasil layanan…':result?.error||'Tidak dipilih untuk pemeriksaan ini.'}</p></>}</section>;
}
