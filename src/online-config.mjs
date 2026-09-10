export const ONLINE_SITE_URL = 'https://ceknaskah-online.sri-ismulyati.chatgpt.site';
export const WINSTON_DASHBOARD = 'https://dev.gowinston.ai/';
export const ONLINE_MAX_CHARS = 120000;
export const wordCount = text => (text.match(/[\p{L}\p{N}\p{M}]+/gu)||[]).length;
export const estimateCredits = (text,mode) => wordCount(text)*(mode==='both'?3:mode==='plagiarism'?2:1);
