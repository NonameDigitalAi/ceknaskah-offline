import {analyze} from './engine.mjs';
self.onmessage=({data})=>{try{self.postMessage({type:'result',result:analyze(data,p=>self.postMessage({type:'progress',...p}))});}catch(e){self.postMessage({type:'error',error:e.message});}};
