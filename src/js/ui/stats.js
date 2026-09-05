import { countWords, parseWikilinks } from '../core/utils.js';
import { esc } from '../core/utils.js';

let sessionStartWords=0, sessionWords=0, sessionTimer=null, sessionSeconds=0;

export function setSessionStart(n){ sessionStartWords=n; sessionWords=0; }
export function updateStats(){
  const ed=document.getElementById('editor'); if(!ed) return;
  const text=ed.innerText||'';
  const words=countWords(text);
  const chars=text.length, charsNS=text.replace(/\s/g,'').length;
  const paras=text.split(/\n/).filter(p=>p.trim()).length || (ed.querySelectorAll('p').length||0);
  const sentences=text.split(/[.!?]+/).filter(s=>s.trim()).length;
  const reading=Math.max(1,Math.ceil(words/200)), speaking=Math.max(1,Math.ceil(words/130));
  const avg=sentences? (words/sentences).toFixed(1):0;
  const set=(id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  set('prop-words', words.toLocaleString());
  set('prop-chars', chars.toLocaleString());
  set('prop-reading', reading+' min');
  set('prop-paras', paras);
  set('status-words', words.toLocaleString()+' words');
  set('status-chars', chars.toLocaleString()+' characters');
  set('stat-words', words.toLocaleString());
  set('stat-chars-ns', charsNS.toLocaleString());
  set('stat-sentences', sentences);
  set('stat-paras', paras);
  set('stat-avg', avg);
  set('stat-reading', reading+' min');
  set('stat-speaking', speaking+' min');
  set('stat-today', Math.max(0, words - sessionStartWords + sessionWords));
}
export function updateGoal(store){
  const words=countWords(document.getElementById('editor')?.innerText||'');
  const pct=Math.min(100, Math.round(words/(store.settings.goal||500)*100));
  const fill=document.getElementById('goal-fill'), txt=document.getElementById('goal-text');
  if(fill) fill.style.width=pct+'%';
  if(txt) txt.textContent=words.toLocaleString()+' / '+(store.settings.goal||500)+' words';
}
export function updateLineCol(){
  const sel=window.getSelection(); if(!sel.rangeCount) return;
  const ed=document.getElementById('editor'); const r=sel.getRangeAt(0).cloneRange();
  r.selectNodeContents(ed); r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  const lines=r.toString().split('\n'); document.getElementById('status-linecol').textContent=`Ln ${lines.length}, Col ${lines[lines.length-1].length+1}`;
}
export function renderOutline(){
  const ed=document.getElementById('editor'), out=document.getElementById('outline-tree'); if(!ed||!out) return;
  const headings=[...ed.querySelectorAll('h1,h2,h3')];
  if(!headings.length){ out.innerHTML='<p class="hint-text">No headings yet. Add a Heading 1/2 to see outline.</p>'; return; }
  out.innerHTML=headings.map((h,i)=>{ const lvl=h.tagName==='H1'?1:h.tagName==='H2'?2:3; return `<div class="outline-item lvl-${lvl}" data-idx="${i}">${esc(h.textContent.slice(0,60))}</div>`; }).join('');
  out.querySelectorAll('.outline-item').forEach(el=> el.addEventListener('click', ()=>{
    const t=headings[+el.dataset.idx]; t.scrollIntoView({behavior:'smooth',block:'center'}); t.style.outline='2px solid var(--accent)'; setTimeout(()=> t.style.outline='',800);
  }));
}
export function renderCards(store, switchDoc){
  const board=document.getElementById('cards-board'); if(!board) return;
  const scenes=store.docs.filter(d=>d.type==='scene'); const list=scenes.length?scenes:store.docs;
  board.innerHTML=list.map(d=>`
    <div class="card" data-id="${d.id}">
      <div class="card-title">${esc(d.title)}</div>
      <div class="card-body">${esc(d.content.replace(/<[^>]*>/g,' ').slice(0,120))}</div>
      <div class="card-meta"><span>${d.folder||''}</span><span>${countWords(d.content.replace(/<[^>]*>/g,' '))} w</span></div>
    </div>`).join('');
  board.querySelectorAll('.card').forEach(c=> c.addEventListener('click', ()=> switchDoc(c.dataset.id)));
}
export function renderBacklinks(store, switchDoc, createDoc){
  const d=store.activeDoc(); if(!d) return;
  const outgoing=[...new Set(parseWikilinks(d.content))];
  const outEl=document.getElementById('outgoing-links');
  if(outEl) {
    outEl.innerHTML=outgoing.length? outgoing.map(t=>{
      const f=store.docs.find(x=>x.title.toLowerCase()===t.toLowerCase());
      return `<div class="link-entry" data-title="${esc(t)}">${f?'⬥':'⬡'} ${esc(t)} ${f?'':'<small style="color:var(--text-faint)">— not created</small>'}</div>`;
    }).join('') : '<p class="hint-text">No outgoing links. Type [[ to link.</p>';
    outEl.querySelectorAll('.link-entry').forEach(el=> el.addEventListener('click', ()=>{
      const t=el.dataset.title; let f=store.docs.find(x=>x.title.toLowerCase()===t.toLowerCase());
      if(!f){ if(confirm('Create "'+t+'"?')){ createDoc(); store.docs[store.docs.length-1].title=t; store.save(); switchDoc(store.docs[store.docs.length-1].id); } return; }
      switchDoc(f.id);
    }));
  }
  const backs=store.docs.filter(x=> x.id!==d.id && parseWikilinks(x.content).some(t=> t.toLowerCase()===d.title.toLowerCase()));
  const backEl=document.getElementById('backlinks-list');
  if(backEl){ backEl.innerHTML=backs.length? backs.map(b=>`<div class="link-entry" data-id="${b.id}">← ${esc(b.title)}</div>`).join('') : '<p class="hint-text">No backlinks yet.</p>';
    backEl.querySelectorAll('.link-entry').forEach(el=> el.addEventListener('click', ()=> switchDoc(el.dataset.id))); }
  const ulEl=document.getElementById('unlinked-list');
  if(ulEl){ const plain=d.title.toLowerCase(); const unl=store.docs.filter(x=> x.id!==d.id && x.content.toLowerCase().includes(plain) && !parseWikilinks(x.content).some(t=>t.toLowerCase()===plain));
    ulEl.innerHTML=unl.length? unl.map(b=>`<div class="link-entry" data-id="${b.id}">· ${esc(b.title)}</div>`).join('') : '<p class="hint-text">No unlinked mentions.</p>';
    ulEl.querySelectorAll('.link-entry').forEach(el=> el.addEventListener('click', ()=> switchDoc(el.dataset.id))); }
}
export function startSessionTimer(){
  sessionTimer=setInterval(()=>{ sessionSeconds++; const m=String(Math.floor(sessionSeconds/60)).padStart(2,'0'), s=String(sessionSeconds%60).padStart(2,'0'); const e=document.getElementById('stat-session-time'); if(e) e.textContent=`${m}:${s}`; },1000);
  document.getElementById('editor')?.addEventListener('input', ()=>{
    const ed=document.getElementById('editor'); sessionWords=Math.max(0, countWords(ed.innerText)-sessionStartWords);
  });
}
