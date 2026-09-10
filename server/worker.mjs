import {handleOnline} from './online-api.mjs';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/'))return handleOnline(request);
  if(env.ASSETS)return env.ASSETS.fetch(request);
  return new Response('Aset aplikasi belum tersedia.',{status:503});
 }
};
