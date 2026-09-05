// snapshots + daily streak
const LS_SNAPS='reign-snaps-v1';
const LS_STREAK='reign-streak-v1';
export function pushSnapshot(store){
  const d=store.activeDoc(); if(!d) return;
  let snaps=[]; try{ snaps=JSON.parse(localStorage.getItem(LS_SNAPS)||'[]'); }catch{}
  snaps.push({ id:d.id, title:d.title, at:Date.now(), html:d.content.slice(0,8000) });
  if(snaps.length>120) snaps=snaps.slice(-120);
  localStorage.setItem(LS_SNAPS, JSON.stringify(snaps));
}
export function getSnapshots(id){
  try{ const all=JSON.parse(localStorage.getItem(LS_SNAPS)||'[]'); return all.filter(s=>s.id===id).reverse(); }catch{ return []; }
}
export function bumpStreak(){
  const key=new Date().toISOString().slice(0,10);
  let data={ streak:0, last:'', history:[] };
  try{ data=Object.assign(data, JSON.parse(localStorage.getItem(LS_STREAK)||'{}')); }catch{}
  if(data.last===key) return data;
  const y=new Date(); y.setDate(y.getDate()-1);
  const yKey=y.toISOString().slice(0,10);
  if(data.last===yKey) data.streak+=1; else if(data.last!==key) data.streak=1;
  data.last=key;
  data.history.push(key); if(data.history.length>60) data.history=data.history.slice(-60);
  localStorage.setItem(LS_STREAK, JSON.stringify(data));
  return data;
}
export function getStreak(){
  try{ return JSON.parse(localStorage.getItem(LS_STREAK)||'{"streak":0,"last":""}'); }catch{ return {streak:0,last:''}; }
}
