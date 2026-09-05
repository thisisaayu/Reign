import { esc } from '../core/utils.js';
export function initSearchPanel(store, switchDoc){
  const inp=document.getElementById('search-input'), res=document.getElementById('search-results');
  if(!inp||!res) return;
  function doSearch(){
    const q=inp.value.trim(); if(!q){ res.innerHTML=''; return; }
    const isRegex=document.getElementById('search-regex')?.checked;
    const caseSens=document.getElementById('search-case')?.checked;
    let re=null; if(isRegex){ try{ re=new RegExp(q, caseSens?'g':'gi'); }catch{ res.innerHTML='<p class="hint-text">Invalid regex</p>'; return; } }
    let html='';
    store.docs.forEach(d=>{
      const plain=d.content.replace(/<[^>]*>/g,' ');
      let idx=-1, snippet='';
      if(re){ const m=plain.match(re); if(m){ idx=plain.search(re); snippet=plain.slice(Math.max(0,idx-40), idx+80); snippet=snippet.replace(re, m=>`<mark>${esc(m)}</mark>`); } }
      else { const hay=caseSens?plain:plain.toLowerCase(); const needle=caseSens?q:q.toLowerCase(); idx=hay.indexOf(needle); if(idx!==-1){ snippet=plain.slice(Math.max(0,idx-40), idx+80); const escQ=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); snippet=esc(snippet).replace(new RegExp(escQ, caseSens?'g':'gi'), m=>`<mark>${m}</mark>`); } }
      if(idx!==-1) html+=`<div class="search-hit" data-id="${d.id}"><div class="search-hit-title">${esc(d.title)}</div><div class="search-hit-snippet">${snippet}…</div></div>`;
    });
    res.innerHTML = html||'<p class="hint-text">No results</p>';
    res.querySelectorAll('.search-hit').forEach(h=> h.addEventListener('click', ()=> switchDoc(h.dataset.id)));
  }
  inp.addEventListener('input', doSearch);
  document.getElementById('search-regex')?.addEventListener('change', doSearch);
  document.getElementById('search-case')?.addEventListener('change', doSearch);
}
