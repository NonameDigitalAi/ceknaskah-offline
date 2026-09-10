import mammoth from 'mammoth/mammoth.browser.js';
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import {LIMITS} from './engine.mjs';
pdfjs.GlobalWorkerOptions.workerSrc=new URL('./pdf.worker.min.mjs',import.meta.url).href;
export async function parseFile(file){
 if(file.size>LIMITS.fileBytes)throw Error('Berkas terlalu besar. Batas per berkas 10 MB.');
 const ext=file.name.split('.').pop().toLowerCase();let text='';
 if(ext==='txt')text=await file.text();
 else if(ext==='docx'){try{text=(await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;}catch{throw Error('DOCX tidak dapat dibaca. Berkas mungkin rusak atau bukan DOCX.');}}
 else if(ext==='pdf'){
  let task;
  try{task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),cMapUrl:new URL('./cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./standard_fonts/',import.meta.url).href,wasmUrl:new URL('./wasm/',import.meta.url).href,isEvalSupported:false});const pdf=await task.promise;const pages=[];if(pdf.numPages>500)throw Error('PDF melebihi batas 500 halaman.');for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const content=await page.getTextContent();pages.push(content.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join(''));page.cleanup();}text=pages.join('\n\n');}
  catch(e){if(e.name==='PasswordException')throw Error('PDF terkunci. Buka proteksi PDF terlebih dahulu.');throw Error(e.message.startsWith('PDF melebihi')?e.message:'PDF rusak atau tidak dapat dibaca.');}
  finally{await task?.destroy();}
  if(!text.trim())throw Error('PDF ini memerlukan OCR; tempelkan teks atau gunakan PDF dengan lapisan teks.');
 }else throw Error('Format tidak didukung. Gunakan TXT, DOCX, atau PDF dengan teks.');
 if(!text.trim())throw Error('Berkas tidak memiliki teks yang dapat diperiksa.');
 if(text.length>LIMITS.textChars)throw Error('Teks melebihi batas 1 juta karakter. Pisahkan dokumen menjadi beberapa bagian.');
 return {text,parseStatus:ext,filename:file.name};
}
