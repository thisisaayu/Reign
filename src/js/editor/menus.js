import { esc } from '../core/utils.js';

/* Wikilink autocomplete */
export function createWikilinkMenu(store) {
  let active=-1;
  function handle(){
    const sel=window.getSelection(); if(!sel.rangeCount) return hide();
    const node=sel.anchorNode; const text=(node.textContent||'').slice(0, sel.anchorOffset);
    const m=text.match(/\[\[([^\]]*)$/);
    if(!m) return hide();
    const q=m[1].toLowerCase();
    const matches=store.docs.filter(d=> d.title.toLowerCase().includes(q)).slice(0,6);
    if(!matches.length) return hide();
    const menu=document.getElementById('wikilink-menu');
    menu.innerHTML=matches.map((d,i)=> `<div class="wl-item ${i===0?'selected':''}" data-title="${esc(d.title)}">${esc(d.title)} <small>${d.folder||''}</small></div>`).join('');
    const rect=sel.getRangeAt(0).getBoundingClientRect();
    menu.style.left=rect.left+'px'; menu.style.top=(rect.bottom+6)+'px'; menu.classList.remove('hidden');
    active=0;
    menu.querySelectorAll('.wl-item').forEach(el=> el.addEventListener('mousedown', e=>{ e.preventDefault(); insert(el.dataset.title); }));
  }
  function hide(){ document.getElementById('wikilink-menu').classList.add('hidden'); active=-1; }
  function insert(title){
    const sel=window.getSelection(); if(!sel.rangeCount) return;
    const node=sel.anchorNode; const text=node.textContent||'';
    const before=text.slice(0, sel.anchorOffset); const after=text.slice(sel.anchorOffset);
    const idx=before.lastIndexOf('[['); if(idx===-1) return;
    node.textContent=before.slice(0,idx) + '[['+title+']] ' + after;
    const range=document.createRange(); range.setStart(node, idx + title.length + 5); range.collapse(true);
    sel.removeAllRanges(); sel.addRange(range);
    hide(); document.getElementById('editor').dispatchEvent(new Event('input',{bubbles:true}));
  }
  function onKey(e){
    const wl=document.getElementById('wikilink-menu');
    if(wl.classList.contains('hidden')) return false;
    const items=[...wl.querySelectorAll('.wl-item')];
    if(e.key==='ArrowDown'){ e.preventDefault(); active=(active+1)%items.length; items.forEach((el,i)=> el.classList.toggle('selected', i===active)); return true; }
    if(e.key==='ArrowUp'){ e.preventDefault(); active=(active-1+items.length)%items.length; items.forEach((el,i)=> el.classList.toggle('selected', i===active)); return true; }
    if(e.key==='Enter' || e.key==='Tab'){ e.preventDefault(); if(items[active]) insert(items[active].dataset.title); return true; }
    if(e.key==='Escape') hide();
    return false;
  }
  return { handle, hide, onKey };
}

/* Slash menu */
export function createSlashMenu() {
  const ITEMS=[
    {label:'Heading 1', icon:'H1', action:()=> document.execCommand('formatBlock',false,'h1')},
    {label:'Heading 2', icon:'H2', action:()=> document.execCommand('formatBlock',false,'h2')},
    {label:'Heading 3', icon:'H3', action:()=> document.execCommand('formatBlock',false,'h3')},
    {label:'Bullet list', icon:'•', action:()=> document.execCommand('insertUnorderedList',false,null)},
    {label:'Numbered list', icon:'1.', action:()=> document.execCommand('insertOrderedList',false,null)},
    {label:'Quote', icon:'❝', action:()=> document.execCommand('formatBlock',false,'blockquote')},
    {label:'Code block', icon:'‹›', action:()=> document.execCommand('formatBlock',false,'pre')},
    {label:'Divider', icon:'—', action:()=> document.execCommand('insertHorizontalRule',false,null)},
    {label:'Table 2×2', icon:'⊞', action:()=> document.execCommand('insertHTML',false,'<table><tr><th>Header</th><th>Header</th></tr><tr><td>Cell</td><td>Cell</td></tr></table>')},
    {label:'Callout', icon:'ⓘ', action:()=> document.execCommand('insertHTML',false,'<blockquote style="border-left-color:var(--warn);background:var(--bg-3)">ⓘ — </blockquote>')},
  ];
  function handle(){
    const sel=window.getSelection(); if(!sel.rangeCount) return hide();
    const node=sel.anchorNode; if(!node||node.nodeType!==3) return hide();
    const text=(node.textContent||'').slice(0, sel.anchorOffset);
    const line=text.split('\n').pop();
    let q=null;
    const m=text.match(/(?:^|\n)\/(\w*)$/);
    if(m) q=m[1].toLowerCase();
    else if(line.startsWith('/')) q=line.slice(1).toLowerCase();
    else return hide();
    const filtered=ITEMS.filter(i=> i.label.toLowerCase().includes(q));
    if(!filtered.length) return hide();
    const menu=document.getElementById('slash-menu');
    menu.innerHTML=filtered.map((it,i)=> `<div class="sl-item ${i===0?'selected':''}"><span>${it.icon}</span> ${it.label}</div>`).join('');
    const rect=sel.getRangeAt(0).getBoundingClientRect();
    menu.style.left=rect.left+'px'; menu.style.top=(rect.bottom+6)+'px'; menu.classList.remove('hidden');
    menu.querySelectorAll('.sl-item').forEach((el,i)=> el.addEventListener('mousedown', e=>{ e.preventDefault(); exec(filtered[i]); }));
  }
  function hide(){ document.getElementById('slash-menu').classList.add('hidden'); }
  function exec(item){
    const sel=window.getSelection(); if(!sel.rangeCount) return;
    const node=sel.anchorNode; const text=node.textContent||'';
    const before=text.slice(0, sel.anchorOffset); const after=text.slice(sel.anchorOffset);
    const lastSlash=before.lastIndexOf('/'); if(lastSlash===-1) return;
    node.textContent=before.slice(0,lastSlash)+after;
    const range=document.createRange(); range.setStart(node, lastSlash); range.collapse(true); sel.removeAllRanges(); sel.addRange(range);
    hide(); document.getElementById('editor').focus(); item.action();
    document.getElementById('editor').dispatchEvent(new Event('input',{bubbles:true}));
  }
  return { handle, hide };
}
