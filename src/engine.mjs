export const VERSION='2.0.0';
export const LIMITS={fileBytes:10*1024*1024,textChars:1000000,sources:200,backupBytes:100*1024*1024};
export function tokenize(text){return Array.from(text.matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu),m=>({value:m[0].normalize('NFKC').toLowerCase(),start:m.index,end:m.index+m[0].length}));}
export async function checksum(text){const canonical=tokenize(text).map(x=>x.value).join(' ');return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function exactHash(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function analyze({text,sources,minMatch=8,exclusions=[]},progress=()=>{}){
 const start=performance.now();if(typeof text!=='string'||text.length>LIMITS.textChars)throw Error('Naskah terlalu besar atau tidak valid.');
 if(!Number.isInteger(minMatch)||minMatch<2||minMatch>100)throw Error('Panjang kecocokan harus 2–100 kata.');
 if(!Array.isArray(sources)||sources.length>LIMITS.sources)throw Error('Jumlah sumber melampaui batas.');
 const tokens=tokenize(text), eligible=tokens.map(t=>!exclusions.some(r=>t.start<r.end&&t.end>r.start)), denominator=eligible.filter(Boolean).length;
 const covered=new Set(),matches=[],failed=[],used=[];const n=Math.min(5,minMatch);
 for(let si=0;si<sources.length;si++){
  const source=sources[si];
  try{
   if(typeof source.text!=='string'||source.text.length>LIMITS.textChars)throw Error('Teks sumber tidak valid.');
   const st=tokenize(source.text);if(!st.length)throw Error('Sumber tidak memiliki teks.');
   const index=new Map();for(let j=0;j<=st.length-n;j++){const key=st.slice(j,j+n).map(t=>t.value).join('\0');if(!index.has(key))index.set(key,[]);index.get(key).push(j);}
   const diagonalEnd=new Map(),sourceCovered=new Set(),sourceMatches=[],spanKeys=new Set();let work=0;const step=()=>{if(++work>3000000)throw Error('Sumber terlalu repetitif untuk batas pemeriksaan ini. Pisahkan sumber menjadi bagian lebih kecil.');};
   for(let i=0;i<=tokens.length-n;i++){
    if(!eligible.slice(i,i+n).every(Boolean))continue;
    const key=tokens.slice(i,i+n).map(t=>t.value).join('\0');
    for(const j of index.get(key)||[]){step();
     const diagonal=j-i;if((diagonalEnd.get(diagonal)??-1)>i)continue;
     let a=i,b=j,z=i+n,w=j+n;
     while(a>0&&b>0&&eligible[a-1]&&tokens[a-1].value===st[b-1].value){step();a--;b--;}
     while(z<tokens.length&&w<st.length&&eligible[z]&&tokens[z].value===st[w].value){step();z++;w++;}
     diagonalEnd.set(diagonal,z);
     if(z-a<minMatch)continue;
     for(let k=a;k<z;k++){sourceCovered.add(k);}
     // Keep one verified source location for each identical manuscript span.
     if(!spanKeys.has(a+'-'+z)){spanKeys.add(a+'-'+z);sourceMatches.push({id:`${si}-${a}-${z}`,sourceId:source.id,sourceTitle:source.title,start:tokens[a].start,end:tokens[z-1].end,sourceStart:st[b].start,sourceEnd:st[w-1].end,tokenStart:a,tokenEnd:z,words:z-a,quote:source.text.slice(st[b].start,st[w-1].end),context:source.text.slice(Math.max(0,st[b].start-180),Math.min(source.text.length,st[w-1].end+180))});}
    }
   }
   if(sourceMatches.length>10000)throw Error('Terlalu banyak kecocokan. Pisahkan sumber atau naikkan panjang minimum.');
   for(const k of sourceCovered)covered.add(k);matches.push(...sourceMatches);
   used.push({id:source.id,title:source.title,hash:source.hash,version:source.version||1,parseStatus:source.parseStatus||'text',matchedTokens:sourceCovered.size});
  }catch(e){failed.push({id:source.id,title:source.title,error:e.message});}
  progress({completed:si+1,total:sources.length,percent:Math.round((si+1)/sources.length*100)});
 }
 matches.sort((a,b)=>a.start-b.start||b.end-a.end);
 const status=!denominator||!used.length?'unavailable':failed.length?'partial':'complete';
 return {appVersion:VERSION,status,score:status==='unavailable'?null:covered.size/denominator*100,totalTokens:tokens.length,eligibleTokens:denominator,matchedTokens:covered.size,matches,used,failed,exclusions,minMatch,durationMs:Math.round(performance.now()-start),policy:'100 × token cocok unik / token yang layak diperiksa. Rentang pengecualian mengeluarkan setiap token yang bersinggungan. Kontribusi sumber dapat tumpang tindih.'};
}
