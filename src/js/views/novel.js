import { countWords } from '../core/utils.js';
export function renderNovel(store){
  const ed=document.getElementById('editor');
  const container=document.getElementById('novel-pages'); if(!ed||!container) return;
  const tmp=document.createElement('div'); tmp.innerHTML=ed.innerHTML;
  const blocks=[...tmp.children];
  if(!blocks.length){ container.innerHTML='<div class="novel-page" data-page="—"><p style="color:var(--text-faint)">Nothing to display yet. Start writing in Edit view.</p></div>'; return; }
  let pages=[], cur=[], curWords=0;
  for(const b of blocks){ const w=countWords(b.textContent||''); if(curWords+w>280 && cur.length){ pages.push(cur); cur=[]; curWords=0; } cur.push(b.outerHTML); curWords+=w; }
  if(cur.length) pages.push(cur);
  if(!pages.length) pages=[[ed.innerHTML]];
  container.innerHTML = pages.map((p,i)=> `<div class="novel-page dropcap" data-page="— ${i+1} —">${p.join('')}</div>`).join('');
}
export function bindNovelControls(store, applySettings){
  document.getElementById('novel-font-minus')?.addEventListener('click', ()=>{
    const el=document.querySelector('.novel-page'); if(!el) return;
    const s=parseFloat(getComputedStyle(el).fontSize); const ns=Math.max(12,s-1)+'px';
    document.querySelectorAll('.novel-page').forEach(p=> p.style.fontSize=ns);
  });
  document.getElementById('novel-font-plus')?.addEventListener('click', ()=>{
    const el=document.querySelector('.novel-page'); if(!el) return;
    const s=parseFloat(getComputedStyle(el).fontSize); const ns=Math.min(24,s+1)+'px';
    document.querySelectorAll('.novel-page').forEach(p=> p.style.fontSize=ns);
  });
  document.getElementById('novel-narrow')?.addEventListener('click', ()=>{ store.settings.novelWidth='narrow'; applySettings(); store.save(); });
  document.getElementById('novel-wide')?.addEventListener('click', ()=>{ store.settings.novelWidth='wide'; applySettings(); store.save(); });
  document.getElementById('novel-paged')?.addEventListener('click', ()=>{ store.settings.novelPaged=!store.settings.novelPaged; applySettings(); store.save(); });
}
