import {writeFile} from 'node:fs/promises';import {checksum,exactHash,analyze} from '../src/engine.mjs';
const text='satu dua tiga empat lima enam tujuh delapan sembilan sepuluh';const source={id:'restore-source',title:'Uji pemulihan',text,hash:await checksum(text),active:true,version:1,parseStatus:'txt',note:'Sumber uji cadangan'};
const report={...analyze({text,sources:[source]}),id:'restore-report',title:'Laporan pemulihan',text,hash:await exactHash(text),createdAt:new Date().toISOString(),parentId:null,notes:[]};
const state={schemaVersion:1,sources:[source],reports:[report],draft:{title:'Draf pulih',text,exclusions:[],parentId:'restore-report'},settings:{lang:'id',minMatch:8}};
await writeFile('../../work/fixtures/cadangan-uji.json',JSON.stringify({format:'ceknaskah-backup',schemaVersion:1,state}));
