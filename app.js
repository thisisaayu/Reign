/* Reign — Writing Studio  app.js */
const LS_DOCS = 'reign-docs-v2';
const LS_SETTINGS = 'reign-settings-v2';

const TEMPLATES = {
  character: { title:'New Character', type:'character', content:`<h1>Character Name</h1><p><b>Role:</b> Protagonist / Antagonist / Supporting</p><p><b>Age:</b> — &nbsp; <b>Occupation:</b> —</p><blockquote>One-line essence of who they are.</blockquote><h2>Appearance</h2><p>Describe them…</p><h2>Backstory</h2><p>Where they came from…</p><h2>Arc</h2><p>Where they're going…</p><h2>Relationships</h2><ul><li>[[Another Character]] — description</li></ul>` },
  world: { title:'New Location', type:'world', content:`<h1>Place Name</h1><blockquote>A one-line evocation.</blockquote><h2>Geography</h2><p>…</p><h2>Culture</h2><p>…</p><h2>History</h2><p>…</p><h2>Connected</h2><p>[[Related Note]]</p>` },
  scene: { title:'New Scene', type:'scene', content:`<h1>Scene — Chapter —</h1><p><b>POV:</b> — &nbsp; <b>Goal:</b> — &nbsp; <b>Conflict:</b> — &nbsp; <b>Outcome:</b> —</p><hr><p>Write the scene…</p><p><em>Links: [[Chapter 1]] · [[Character Name]]</em></p>` },
  chapter: { title:'Chapter —', type:'manuscript', content:`<h1>Chapter One</h1><p>The story begins…</p><p>Reference other notes with [[double brackets]] and embed them with ![[Note Title]].</p>` },
};

const DEFAULT_DOCS = [
  { id:'welcome', title:'Welcome to Reign', type:'manuscript', folder:'Manuscripts', content:`<h1>Welcome to Reign ◈</h1><p><em>A writing studio for people who write books.</em></p><p><b>Reign</b> blends the precision of <b>LibreOffice</b> — rulers, styles, tables, full formatting — with the connected thinking of <b>Obsidian</b>: every note can reference every other note.</p><h2>Try it</h2><ul><li>Type <code>[[</code> to link another note — try <span class="wikilink">[[The Hollow Crown]]</span></li><li>Type <code>/</code> for the slash menu (headings, quotes, tables…)</li><li>Press <code>Ctrl+K</code> for the command palette</li><li>Switch to <b>Graph</b> to see how your notes connect</li><li>Switch to <b>Novel</b> to read your manuscript as a typeset book</li></ul><blockquote>“The page is a mirror. The graph is a map. The novel is the destination.”</blockquote><h2>Reference anything</h2><p>Every document has a <code>reign://</code> URI (see the Inspector → Reference ID). Other apps can open it. Inside Reign, use <code>![[Note Title]]</code> to transclude a note inline.</p><p>Tags like <span class="tag">#fantasy</span> <span class="tag">#draft</span> are searchable and clickable.</p><h2>Four themes</h2><p>Dark · AMOLED · Light · Bloom (pink-cyan). Toggle them in the toolbar — your choice is remembered.</p>`, created:Date.now(), updated:Date.now() },
  { id:'hollow', title:'The Hollow Crown', type:'manuscript', folder:'Manuscripts', content:`<h1>The Hollow Crown</h1><p><em>Chapter One — Ashes</em></p><p>The city of Karst had been built inside the ribcage of a dead god. Its avenues followed the curve of bone, its towers rose where marrow had once flowed. And now, on the night the crown went missing, rain fell through the open chest like tears.</p><p>Mira pressed her back against the basilica wall. In her palm, the thing they were all killing for — a circlet of black glass, warm to the touch, humming faintly. It had no business being beautiful.</p><blockquote>She thought of [[Elian Voss]] and the promise she'd made. She thought of [[Karst — The Bone City]] and whether any of it deserved saving.</blockquote><p>Somewhere above, a bell tolled. Not the hour — an alarm.</p><h2>Notes</h2><p>Links: [[Elian Voss]] · [[Karst — The Bone City]] · [[The Obsidian Sigil]]</p><p>Tags: <span class="tag">#draft</span> <span class="tag">#chapter1</span></p>`, created:Date.now()-100000, updated:Date.now()-50000 },
  { id:'elian', title:'Elian Voss', type:'character', folder:'Characters', content:`<h1>Elian Voss</h1><p><b>Role:</b> Antagonist &nbsp; <b>Age:</b> 41 &nbsp; <b>House:</b> Voss</p><blockquote>“A man who mistakes control for love.”</blockquote><h2>Appearance</h2><p>Tall, hollow-cheeked, silver at the temples. Wears the obsidian sigil openly — which in Karst is either piety or provocation.</p><h2>Drive</h2><p>Believes the god inside Karst is not dead, merely sleeping. Wants to wake it. Linked to [[The Obsidian Sigil]] and [[Karst — The Bone City]].</p>`, created:Date.now()-200000, updated:Date.now()-100000 },
  { id:'karst', title:'Karst — The Bone City', type:'world', folder:'World', content:`<h1>Karst — The Bone City</h1><blockquote>A city inside a god. Or a god inside a city.</blockquote><h2>Districts</h2><ul><li><b>The Sternum</b> — administrative heart</li><li><b>The Ribs</b> — residential arcs</li><li><b>The Marrow Deep</b> — forbidden</li></ul><p>Home to [[Elian Voss]]. Central artifact: [[The Obsidian Sigil]]. Featured in [[The Hollow Crown]].</p>`, created:Date.now()-300000, updated:Date.now()-80000 },
  { id:'sigil', title:'The Obsidian Sigil', type:'world', folder:'World', content:`<h1>The Obsidian Sigil</h1><p>A black-glass circlet, warm to the touch. Said to be a fragment of the dead god's crown.</p><p>Held at various times by [[Elian Voss]]. Sought in [[The Hollow Crown]]. Origin: [[Karst — The Bone City]].</p>`, created:Date.now()-400000, updated:Date.now()-60000 },
];

let docs = [];
let activeId = null;
let settings = { theme:'dark', syntax:true, focus:false, typewriter:false, zen:false, goal:500, zoom:100, novelWidth:'narrow', novelPaged:true };
let sessionWords = 0, sessionStartWords = 0, sessionTimer = null, sessionSeconds = 0;
let pomodoroTimer = null, pomodoroLeft = 25*60, pomodoroRunning = false;
let graphState = null;

// ── Persistence ──
function load() {
  try { docs = JSON.parse(localStorage.getItem(LS_DOCS)) || JSON.parse(JSON.stringify(DEFAULT_DOCS)); } catch { docs = JSON.parse(JSON.stringify(DEFAULT_DOCS)); }
  try { Object.assign(settings, JSON.parse(localStorage.getItem(LS_SETTINGS))||{}); } catch {}
  activeId = docs[0]?.id || null;
}
function save() {
  localStorage.setItem(LS_DOCS, JSON.stringify(docs));
  localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
}
function getDoc(id){ return docs.find(d=>d.id===id); }
function activeDoc(){ return getDoc(activeId); }
function slug(t){ return t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

// ── Theme / settings apply ──
function applySettings(){
  document.body.dataset.theme = settings.theme;
  document.querySelectorAll('.theme-dot').forEach(b=>b.classList.toggle('active', b.dataset.theme===settings.theme));
  document.getElementById('toggle-syntax').checked = settings.syntax;
  document.body.classList.toggle('syntax-on', settings.syntax);
  document.body.classList.toggle('focus-mode', settings.focus);
  document.body.classList.toggle('typewriter', settings.typewriter);
  document.body.classList.toggle('zen', settings.zen);
  document.getElementById('opt-focus').checked = settings.focus;
  document.getElementById('opt-typewriter').checked = settings.typewriter;
  document.getElementById('opt-zen').checked = settings.zen;
  document.getElementById('main').style.zoom = settings.zoom + '%';
  document.getElementById('status-zoom').textContent = settings.zoom + '%';
  document.getElementById('novel-pages').dataset.width = settings.novelWidth;
  document.getElementById('novel-pages').dataset.paged = String(settings.novelPaged);
}

// ── File tree ──
function renderFileTree(){
  const el = document.getElementById('file-tree');
  const folders = {};
  docs.forEach(d=>{ (folders[d.folder||'Unsorted'] ||= []).push(d); });
  let html='';
  for(const [folder, list] of Object.entries(folders)){
    html+=`<div class="tree-folder">${folder}</div>`;
    for(const d of list){
      const icon = d.type==='character'?'👤': d.type==='world'?'🌍': d.type==='scene'?'🎬':'📄';
      html+=`<div class="tree-item ${d.id===activeId?'active':''}" data-id="${d.id}"><span class="tree-icon">${icon}</span><span class="tree-name">${esc(d.title)}</span><button class="tree-del" data-del="${d.id}" title="Delete">✕</button></div>`;
    }
  }
  el.innerHTML = html;
  el.querySelectorAll('.tree-item').forEach(row=>{
    row.addEventListener('click', e=>{
      if(e.target.dataset.del) return;
      switchDoc(row.dataset.id);
    });
  });
  el.querySelectorAll('[data-del]').forEach(b=>{
    b.addEventListener('click', e=>{
      e.stopPropagation();
      const id=b.dataset.del;
      if(docs.length<=1) return alert('Cannot delete last document.');
      if(!confirm('Delete "'+getDoc(id).title+'"?')) return;
      docs = docs.filter(d=>d.id!==id);
      if(activeId===id) activeId=docs[0].id;
      save(); renderFileTree(); loadDoc(activeId); refreshAll();
    });
  });
}

function switchDoc(id){
  if(activeId) persistEditor();
  activeId=id;
  loadDoc(id);
  renderFileTree(); refreshAll();
  save();
}
function persistEditor(){
  const d=activeDoc(); if(!d) return;
  d.content = document.getElementById('editor').innerHTML;
  d.updated = Date.now();
  // update word count on doc
  d.words = countWords(document.getElementById('editor').innerText);
}
function loadDoc(id){
  const d=getDoc(id); if(!d) return;
  document.getElementById('doc-title').value = d.title;
  document.getElementById('doc-path').textContent = '/ '+(d.folder||'').toLowerCase()+' / '+slug(d.title)+'.md';
  document.getElementById('ref-id').textContent = 'reign://'+slug(d.title);
  document.getElementById('editor').innerHTML = d.content;
  sessionStartWords = countWords(d.content.replace(/<[^>]*>/g,' '));
  updateStats(); renderOutline(); renderBacklinks(); renderPreview(); renderNovel(); updateGoal();
}

// ── Editor events ──
function initEditor(){
  const ed=document.getElementById('editor');
  ed.addEventListener('input', ()=>{
    persistEditor(); save();
    updateStats(); renderOutline(); renderBacklinks(); renderPreview(); renderNovel(); updateGoal();
    handleWikilinkInput(); handleSlashInput();
  });
  ed.addEventListener('keyup', e=>{
    updateLineCol();
    if(e.key==='[') handleWikilinkInput();
    if(e.key==='/') handleSlashInput();
    if(e.key==='Escape'){ hideWikilinkMenu(); hideSlashMenu(); }
  });
  ed.addEventListener('click', e=>{
    if(e.target.classList.contains('wikilink')){
      const title=e.target.textContent.replace(/^\[\[|\]\]$/g,'').trim();
      const found=docs.find(d=>d.title.toLowerCase()===title.toLowerCase());
      if(found) switchDoc(found.id);
    }
  });
  ed.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && e.key==='b'){ e.preventDefault(); fmt('bold'); }
    if((e.ctrlKey||e.metaKey) && e.key==='i'){ e.preventDefault(); fmt('italic'); }
    if((e.ctrlKey||e.metaKey) && e.key==='u'){ e.preventDefault(); fmt('underline'); }
    if((e.ctrlKey||e.metaKey) && e.key==='k' && !e.shiftKey){ e.preventDefault(); showPalette(); }
    if((e.ctrlKey||e.metaKey) && e.key==='s'){ e.preventDefault(); persistEditor(); save(); toast('Saved ✓'); }
    if(e.key==='Tab'){ e.preventDefault(); document.execCommand('insertText',false,'    '); }
  });
  // Paste as plain handling for clean paste
  ed.addEventListener('paste', e=>{
    // let default happen but clean after? keep default for now
  });
}

// ── Formatting ──
function fmt(action){
  const ed=document.getElementById('editor'); ed.focus();
  const map={ bold:'bold', italic:'italic', underline:'underline', strike:'strikeThrough',
    alignLeft:'justifyLeft', alignCenter:'justifyCenter', alignRight:'justifyRight', justify:'justifyFull',
    ul:'insertUnorderedList', ol:'insertOrderedList' };
  if(map[action]) document.execCommand(map[action],false,null);
  else if(action==='blockquote') document.execCommand('formatBlock',false,'blockquote');
  else if(action==='code') document.execCommand('insertHTML',false,'<code>'+getSelText()+'</code>');
  else if(action==='link'){
    const url=prompt('Link URL:','https://');
    if(url) document.execCommand('createLink',false,url);
  }
  else if(action==='image'){
    const url=prompt('Image URL:','https://');
    if(url) document.execCommand('insertImage',false,url);
  }
  else if(action==='table'){
    document.execCommand('insertHTML',false,'<table><tr><th>Header</th><th>Header</th></tr><tr><td>Cell</td><td>Cell</td></tr></table>');
  }
  else if(action==='hr') document.execCommand('insertHorizontalRule',false,null);
  ed.dispatchEvent(new Event('input',{bubbles:true}));
}
function getSelText(){ const s=window.getSelection(); return s.toString()||'code'; }

// ── Toolbar wiring ──
function initToolbar(){
  document.querySelectorAll('.tbtn[data-cmd]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const cmd=b.dataset.cmd;
      if(cmd==='new') createDoc();
      if(cmd==='open') document.getElementById('file-picker').click();
      if(cmd==='save'){ persistEditor(); save(); toast('Saved ✓'); }
      if(cmd==='undo') document.execCommand('undo');
      if(cmd==='redo') document.execCommand('redo');
    });
  });
  document.querySelectorAll('.tbtn[data-fmt]').forEach(b=> b.addEventListener('click', ()=> fmt(b.dataset.fmt)));
  document.getElementById('style-select').addEventListener('change', e=>{
    const v=e.target.value;
    if(v==='pre') document.execCommand('formatBlock',false,'pre');
    else if(v==='blockquote') document.execCommand('formatBlock',false,'blockquote');
    else document.execCommand('formatBlock',false,v);
    document.getElementById('editor').dispatchEvent(new Event('input',{bubbles:true}));
  });
  document.getElementById('font-select').addEventListener('change', e=>{
    document.getElementById('editor').style.fontFamily = e.target.value;
  });
  document.getElementById('size-select').addEventListener('change', e=>{
    document.getElementById('editor').style.fontSize = e.target.value+'px';
  });
  document.getElementById('toggle-syntax').addEventListener('change', e=>{
    settings.syntax=e.target.checked; applySettings(); save();
  });
  document.querySelectorAll('.theme-dot').forEach(b=> b.addEventListener('click', ()=>{
    settings.theme=b.dataset.theme; applySettings(); save();
  }));
  document.getElementById('file-picker').addEventListener('change', e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      const text=reader.result;
      const title=file.name.replace(/\.[^.]+$/,'');
      docs.push({ id:'doc-'+Date.now(), title, type:'manuscript', folder:'Imports', content:'<p>'+esc(text).replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')+'</p>', created:Date.now(), updated:Date.now() });
      activeId=docs[docs.length-1].id; save(); renderFileTree(); loadDoc(activeId); refreshAll(); toast('Imported '+title);
    };
    reader.readAsText(file);
  });
}

function createDoc(templateKey){
  const t = templateKey ? TEMPLATES[templateKey] : null;
  const id='doc-'+Date.now();
  const doc={
    id, title: t? t.title : 'Untitled Note',
    type: t? t.type : 'manuscript',
    folder: t? (t.type==='character'?'Characters': t.type==='world'?'World':'Manuscripts') : 'Manuscripts',
    content: t? t.content : '<p>Start writing… Type <code>[[</code> to link, <code>/</code> for commands.</p>',
    created:Date.now(), updated:Date.now()
  };
  docs.push(doc); activeId=id; save(); renderFileTree(); loadDoc(id); refreshAll();
  setTimeout(()=>{ document.getElementById('doc-title').focus(); document.getElementById('doc-title').select(); },50);
}

// ── View switcher ──
function initViews(){
  document.querySelectorAll('.vs-btn').forEach(b=> b.addEventListener('click', ()=> setView(b.dataset.view)));
  document.getElementById('btn-sidebar-left').addEventListener('click', ()=> document.getElementById('sidebar-left').classList.toggle('collapsed'));
  document.getElementById('btn-sidebar-right').addEventListener('click', ()=> document.getElementById('sidebar-right').classList.toggle('collapsed'));
  document.addEventListener('keydown', e=>{
    if(e.ctrlKey||e.metaKey){
      if(['1','2','3','4'].includes(e.key)){ e.preventDefault(); setView(['edit','preview','novel','graph'][parseInt(e.key)-1]); }
    }
    if(e.key==='Escape' && settings.zen){ settings.zen=false; applySettings(); save(); }
  });
}
function setView(v){
  document.body.dataset.view=v;
  document.querySelectorAll('.vs-btn').forEach(b=> b.classList.toggle('active', b.dataset.view===v));
  document.querySelectorAll('.view').forEach(el=> el.classList.toggle('active', el.id==='view-'+v));
  if(v==='graph') setTimeout(initGraph,50);
  if(v==='preview') renderPreview();
  if(v==='novel') renderNovel();
}

// ── Left sidebar tabs ──
function initSideTabs(){
  document.querySelectorAll('#sidebar-left .sb-tab').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelectorAll('#sidebar-left .sb-tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('#sidebar-left .sb-panel').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelector(`#sidebar-left .sb-panel[data-panel="${b.dataset.tab}"]`).classList.add('active');
  }));
  document.querySelectorAll('#sidebar-right .sb-tab').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelectorAll('#sidebar-right .sb-tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('#sidebar-right .sb-panel').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelector(`#sidebar-right .sb-panel[data-panel="${b.dataset.tab}"]`).classList.add('active');
  }));
  document.getElementById('btn-new-file').addEventListener('click', ()=> createDoc());
  document.getElementById('btn-new-folder').addEventListener('click', ()=>{
    const name=prompt('Folder name:'); if(!name) return;
    docs.push({ id:'doc-'+Date.now(), title:'Untitled', type:'manuscript', folder:name, content:'<p></p>', created:Date.now(), updated:Date.now() });
    save(); renderFileTree(); toast('Folder "'+name+'" created');
  });
  document.getElementById('btn-import').addEventListener('click', ()=> document.getElementById('file-picker').click());
  document.querySelectorAll('.template-btn').forEach(b=> b.addEventListener('click', ()=> createDoc(b.dataset.template)));
  document.getElementById('btn-add-card').addEventListener('click', ()=> createDoc('scene'));
}

// ── Search ──
function initSearch(){
  const inp=document.getElementById('search-input');
  const res=document.getElementById('search-results');
  function doSearch(){
    const q=inp.value.trim(); if(!q){ res.innerHTML=''; return; }
    const isRegex=document.getElementById('search-regex').checked;
    const caseSens=document.getElementById('search-case').checked;
    let re=null; if(isRegex){ try{ re=new RegExp(q, caseSens?'g':'gi'); }catch{ res.innerHTML='<p class="hint-text">Invalid regex</p>'; return; } }
    let html='';
    docs.forEach(d=>{
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
  document.getElementById('search-regex').addEventListener('change', doSearch);
  document.getElementById('search-case').addEventListener('change', doSearch);
}

// ── Outline ──
function renderOutline(){
  const ed=document.getElementById('editor');
  const headings=[...ed.querySelectorAll('h1,h2,h3')];
  const out=document.getElementById('outline-tree');
  if(!headings.length){ out.innerHTML='<p class="hint-text">No headings yet. Add a Heading 1/2 to see outline.</p>'; return; }
  out.innerHTML = headings.map((h,i)=>{
    const lvl = h.tagName==='H1'?1: h.tagName==='H2'?2:3;
    return `<div class="outline-item lvl-${lvl}" data-idx="${i}">${esc(h.textContent.slice(0,60))}</div>`;
  }).join('');
  out.querySelectorAll('.outline-item').forEach(el=> el.addEventListener('click', ()=>{
    headings[+el.dataset.idx].scrollIntoView({behavior:'smooth', block:'center'});
    headings[+el.dataset.idx].style.outline='2px solid var(--accent)'; setTimeout(()=>headings[+el.dataset.idx].style.outline='',800);
  }));
}

// ── Cards ──
function renderCards(){
  const board=document.getElementById('cards-board');
  const scenes=docs.filter(d=>d.type==='scene');
  const list = scenes.length? scenes : docs;
  board.innerHTML = list.map(d=>`
    <div class="card" data-id="${d.id}">
      <div class="card-title">${esc(d.title)}</div>
      <div class="card-body">${esc(d.content.replace(/<[^>]*>/g,' ').slice(0,120))}</div>
      <div class="card-meta"><span>${d.folder||''}</span><span>${countWords(d.content.replace(/<[^>]*>/g,' '))} w</span></div>
    </div>`).join('');
  board.querySelectorAll('.card').forEach(c=> c.addEventListener('click', ()=> switchDoc(c.dataset.id)));
}

// ── Stats ──
function countWords(t){ const w=t.trim().split(/\s+/).filter(Boolean); return t.trim()? w.length:0; }
function updateStats(){
  const ed=document.getElementById('editor');
  const text=ed.innerText||'';
  const words=countWords(text);
  const chars=text.length;
  const charsNS=text.replace(/\s/g,'').length;
  const paras=text.split(/\n/).filter(p=>p.trim()).length || (ed.querySelectorAll('p').length||0);
  const sentences=text.split(/[.!?]+/).filter(s=>s.trim()).length;
  const reading=Math.max(1, Math.ceil(words/200));
  const speaking=Math.max(1, Math.ceil(words/130));
  const avg = sentences? (words/sentences).toFixed(1):0;
  document.getElementById('prop-words').textContent=words.toLocaleString();
  document.getElementById('prop-chars').textContent=chars.toLocaleString();
  document.getElementById('prop-reading').textContent=reading+' min';
  document.getElementById('prop-paras').textContent=paras;
  document.getElementById('status-words').textContent=words.toLocaleString()+' words';
  document.getElementById('status-chars').textContent=chars.toLocaleString()+' characters';
  document.getElementById('stat-words').textContent=words.toLocaleString();
  document.getElementById('stat-chars-ns').textContent=charsNS.toLocaleString();
  document.getElementById('stat-sentences').textContent=sentences;
  document.getElementById('stat-paras').textContent=paras;
  document.getElementById('stat-avg').textContent=avg;
  document.getElementById('stat-reading').textContent=reading+' min';
  document.getElementById('stat-speaking').textContent=speaking+' min';
  // session
  const todayWords = Math.max(0, words - sessionStartWords + sessionWords);
  document.getElementById('stat-today').textContent = todayWords;
  // back-compat goal uses current words
}
function updateGoal(){
  const words=countWords(document.getElementById('editor').innerText||'');
  const pct=Math.min(100, Math.round(words/settings.goal*100));
  document.getElementById('goal-fill').style.width=pct+'%';
  document.getElementById('goal-text').textContent=words.toLocaleString()+' / '+settings.goal+' words';
  document.getElementById('goal-edit').onclick=()=>{
    const v=prompt('Daily goal (words):', settings.goal); if(!v) return;
    settings.goal=parseInt(v)||500; save(); updateGoal();
  };
}
function updateLineCol(){
  const sel=window.getSelection(); if(!sel.rangeCount) return;
  const ed=document.getElementById('editor');
  const range=sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(ed); range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  const text=range.toString();
  const lines=text.split('\n'); const ln=lines.length; const col=lines[lines.length-1].length+1;
  document.getElementById('status-linecol').textContent=`Ln ${ln}, Col ${col}`;
}

// ── Backlinks ──
function parseWikilinks(html){
  const re=/\[\[([^\]]+)\]\]/g; const out=[]; let m; while(m=re.exec(html)) out.push(m[1].trim());
  return out;
}
function renderBacklinks(){
  const d=activeDoc(); if(!d) return;
  const outgoing=[...new Set(parseWikilinks(d.content))];
  const outEl=document.getElementById('outgoing-links');
  outEl.innerHTML = outgoing.length? outgoing.map(t=>{
    const found=docs.find(x=>x.title.toLowerCase()===t.toLowerCase());
    return `<div class="link-entry" data-title="${esc(t)}">${found?'⬥':'⬡'} ${esc(t)} ${found?'':'<small style="color:var(--text-faint)">— not created</small>'}</div>`;
  }).join('') : '<p class="hint-text">No outgoing links. Type [[ to link.</p>';
  outEl.querySelectorAll('.link-entry').forEach(el=> el.addEventListener('click', ()=>{
    const t=el.dataset.title; let found=docs.find(x=>x.title.toLowerCase()===t.toLowerCase());
    if(!found){ if(confirm('Create "'+t+'"?')){ createDoc(); docs[docs.length-1].title=t; save(); renderFileTree(); switchDoc(docs[docs.length-1].id); } return; }
    switchDoc(found.id);
  }));
  // backlinks
  const backs=docs.filter(x=> x.id!==d.id && parseWikilinks(x.content).some(t=> t.toLowerCase()===d.title.toLowerCase()));
  const backEl=document.getElementById('backlinks-list');
  backEl.innerHTML = backs.length? backs.map(b=>`<div class="link-entry" data-id="${b.id}">← ${esc(b.title)}</div>`).join('') : '<p class="hint-text">No backlinks yet.</p>';
  backEl.querySelectorAll('.link-entry').forEach(el=> el.addEventListener('click', ()=> switchDoc(el.dataset.id)));
  // unlinked mentions
  const plain=d.title.toLowerCase();
  const unlinked=docs.filter(x=> x.id!==d.id && x.content.toLowerCase().includes(plain) && !parseWikilinks(x.content).some(t=>t.toLowerCase()===plain));
  const ulEl=document.getElementById('unlinked-list');
  ulEl.innerHTML = unlinked.length? unlinked.map(b=>`<div class="link-entry" data-id="${b.id}">· ${esc(b.title)}</div>`).join('') : '<p class="hint-text">No unlinked mentions.</p>';
  ulEl.querySelectorAll('.link-entry').forEach(el=> el.addEventListener('click', ()=> switchDoc(el.dataset.id)));
}

// ── Preview ──
function renderPreview(){
  const ed=document.getElementById('editor');
  let html=ed.innerHTML;
  // wikilinks
  html=html.replace(/\[\[([^\]]+)\]\]/g, (m,title)=>{
    const found=docs.find(d=>d.title.toLowerCase()===title.trim().toLowerCase());
    return `<a class="wikilink ${found?'':'broken'}" data-title="${esc(title.trim())}">[[${esc(title.trim())}]]</a>`;
  });
  // transclusion ![[title]]
  html=html.replace(/!\[\[([^\]]+)\]\]/g, (m,title)=>{
    const found=docs.find(d=>d.title.toLowerCase()===title.trim().toLowerCase());
    if(!found) return `<em style="color:var(--text-faint)">![[${esc(title)}]] — not found</em>`;
    return `<div style="border:1px solid var(--border);border-left:3px solid var(--accent);padding:10px 14px;border-radius:var(--radius-sm);margin:8px 0;background:var(--bg-3)"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-faint);margin-bottom:4px">${esc(found.title)}</div>${found.content}</div>`;
  });
  // tags
  html=html.replace(/#(\w+)/g,'<span class="tag">#$1</span>');
  document.getElementById('preview-article').innerHTML=html;
}

// ── Novel view ──
function renderNovel(){
  const ed=document.getElementById('editor');
  const container=document.getElementById('novel-pages');
  const raw=ed.innerHTML;
  // split by h1/h2 into pages (approx 300 words per page)
  const tmp=document.createElement('div'); tmp.innerHTML=raw;
  const blocks=[...tmp.children];
  if(!blocks.length){ container.innerHTML='<div class="novel-page" data-page="—"><p style="color:var(--text-faint)">Nothing to display yet. Start writing in Edit view.</p></div>'; return; }
  let pages=[], cur=[], curWords=0;
  for(const b of blocks){
    const w=countWords(b.textContent||'');
    if(curWords + w > 280 && cur.length){ pages.push(cur); cur=[]; curWords=0; }
    cur.push(b.outerHTML); curWords+=w;
  }
  if(cur.length) pages.push(cur);
  if(!pages.length) pages=[[raw]];
  container.innerHTML = pages.map((p,i)=> `<div class="novel-page dropcap" data-page="— ${i+1} —">${p.join('')}</div>`).join('');
  // font controls
  document.getElementById('novel-font-minus').onclick=()=>{
    const el=document.querySelector('.novel-page'); if(!el) return;
    const s=parseFloat(getComputedStyle(el).fontSize); el.style.fontSize=Math.max(12,s-1)+'px';
    container.querySelectorAll('.novel-page').forEach(p=> p.style.fontSize=el.style.fontSize);
  };
  document.getElementById('novel-font-plus').onclick=()=>{
    const el=document.querySelector('.novel-page'); if(!el) return;
    const s=parseFloat(getComputedStyle(el).fontSize); el.style.fontSize=Math.min(24,s+1)+'px';
    container.querySelectorAll('.novel-page').forEach(p=> p.style.fontSize=el.style.fontSize);
  };
  document.getElementById('novel-narrow').onclick=()=>{ settings.novelWidth='narrow'; applySettings(); save(); };
  document.getElementById('novel-wide').onclick=()=>{ settings.novelWidth='wide'; applySettings(); save(); };
  document.getElementById('novel-paged').onclick=()=>{ settings.novelPaged=!settings.novelPaged; applySettings(); save(); };
}

// ── Graph (force-directed canvas) ──
function initGraph(){
  const canvas=document.getElementById('graph-canvas');
  const wrap=document.getElementById('view-graph');
  const dpr=window.devicePixelRatio||1;
  function resize(){
    canvas.width=wrap.clientWidth*dpr; canvas.height=(wrap.clientHeight - 40)*dpr;
    canvas.style.width=wrap.clientWidth+'px'; canvas.style.height=(wrap.clientHeight-40)+'px';
  }
  resize();
  const nodes=docs.map(d=>({
    id:d.id, label:d.title, type:d.type,
    x: Math.random()*canvas.width, y: Math.random()*canvas.height,
    vx:0, vy:0, r: d.type==='manuscript'? 14 : 11
  }));
  const idSet=new Set(docs.map(d=>d.id));
  const titleMap=new Map(docs.map(d=>[d.title.toLowerCase(), d.id]));
  const edges=[];
  docs.forEach(d=>{
    parseWikilinks(d.content).forEach(t=>{
      const tid=titleMap.get(t.toLowerCase());
      if(tid && idSet.has(tid) && tid!==d.id) edges.push({from:d.id,to:tid});
    });
  });
  // filter by depth if set
  graphState={ canvas, nodes, edges, hover:null, drag:null, offset:{x:0,y:0}, scale:1, showLabels:true, showOrphans:false, depth:2 };
  document.getElementById('graph-labels').onchange=e=>{ graphState.showLabels=e.target.checked; };
  document.getElementById('graph-orphans').onchange=e=>{ graphState.showOrphans=e.target.checked; };
  document.getElementById('graph-depth').oninput=e=>{ graphState.depth=+e.target.value; document.getElementById('graph-depth-label').textContent='depth '+e.target.value; };
  document.getElementById('graph-reset').onclick=()=>{ graphState.offset={x:0,y:0}; graphState.scale=1; };
  document.getElementById('graph-center').onclick=()=>{
    const act=nodes.find(n=>n.id===activeId); if(act){ graphState.offset.x=canvas.width/2/dpr - act.x/dpr; graphState.offset.y=canvas.height/2/dpr - act.y/dpr; }
  };

  let animId;
  function tick(){
    // physics
    const cx=canvas.width/2, cy=canvas.height/2;
    for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i], b=nodes[j]; const dx=a.x-b.x, dy=a.y-b.y; const dist=Math.hypot(dx,dy)||1;
      const rep= 8000/(dist*dist);
      const fx=dx/dist*rep, fy=dy/dist*rep;
      a.vx+=fx*0.02; a.vy+=fy*0.02; b.vx-=fx*0.02; b.vy-=fy*0.02;
    }
    edges.forEach(e=>{
      const a=nodes.find(n=>n.id===e.from), b=nodes.find(n=>n.id===e.to); if(!a||!b) return;
      const dx=b.x-a.x, dy=b.y-a.y; const dist=Math.hypot(dx,dy)||1; const ideal=140;
      const f=(dist-ideal)*0.008; const fx=dx/dist*f, fy=dy/dist*f;
      a.vx+=fx; a.vy+=fy; b.vx-=fx; b.vy-=fy;
    });
    nodes.forEach(n=>{
      if(graphState.drag===n) return;
      n.vx*=0.88; n.vy*=0.88;
      // gentle center
      n.vx+=(cx-n.x)*0.0006; n.vy+=(cy-n.y)*0.0006;
      n.x+=n.vx; n.y+=n.vy;
    });

    draw();
    animId=requestAnimationFrame(tick);
  }
  function draw(){
    const ctx=canvas.getContext('2d');
    ctx.save(); ctx.scale(dpr,dpr);
    const W=canvas.width/dpr, H=canvas.height/dpr;
    ctx.clearRect(0,0,W,H);
    // bg
    ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--bg').trim()||'#141420';
    ctx.fillRect(0,0,W,H);
    ctx.translate(graphState.offset.x, graphState.offset.y);
    ctx.scale(graphState.scale, graphState.scale);

    // filter orphans
    const deg=new Map(nodes.map(n=>[n.id,0])); edges.forEach(e=>{ deg.set(e.from,(deg.get(e.from)||0)+1); deg.set(e.to,(deg.get(e.to)||0)+1); });
    const visibleNodes = graphState.showOrphans? nodes : nodes.filter(n=> (deg.get(n.id)||0)>0 || n.id===activeId);
    const visSet=new Set(visibleNodes.map(n=>n.id));
    const visibleEdges = edges.filter(e=> visSet.has(e.from) && visSet.has(e.to));

    // edges
    ctx.strokeStyle=getComputedStyle(document.body).getPropertyValue('--graph-edge').trim()||'rgba(255,255,255,.08)';
    ctx.lineWidth=1;
    visibleEdges.forEach(e=>{
      const a=nodes.find(n=>n.id===e.from), b=nodes.find(n=>n.id===e.to);
      ctx.beginPath(); ctx.moveTo(a.x/dpr,a.y/dpr); ctx.lineTo(b.x/dpr,b.y/dpr); ctx.stroke();
    });
    // nodes
    visibleNodes.forEach(n=>{
      const isActive=n.id===activeId, isHover=graphState.hover===n;
      const color = n.type==='character'?'#ff6b9d': n.type==='world'?'#4ecdc4': n.type==='scene'?'#f0c040': getComputedStyle(document.body).getPropertyValue('--accent').trim()||'#7c6cf0';
      ctx.beginPath(); ctx.arc(n.x/dpr,n.y/dpr, isActive? n.r+3 : n.r, 0, Math.PI*2);
      ctx.fillStyle=color; ctx.globalAlpha=isActive?1:0.92; ctx.fill(); ctx.globalAlpha=1;
      if(isActive||isHover){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke(); }
      if(graphState.showLabels){
        ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--text').trim()||'#fff';
        ctx.font='11px Instrument Sans, sans-serif'; ctx.textAlign='center';
        ctx.fillText(n.label.slice(0,22), n.x/dpr, n.y/dpr + n.r + 14);
      }
    });
    ctx.restore();
  }

  // interactions
  function getNodeAt(x,y){
    const rect=canvas.getBoundingClientRect();
    const px=(x-rect.left - graphState.offset.x)/graphState.scale;
    const py=(y-rect.top - graphState.offset.y)/graphState.scale;
    return nodes.find(n=> Math.hypot(n.x/dpr - px, n.y/dpr - py) < n.r+6) || null;
  }
  canvas.onmousemove=e=>{
    const n=getNodeAt(e.clientX,e.clientY);
    graphState.hover=n; canvas.style.cursor=n?'pointer':'grab';
    const tip=document.getElementById('graph-tooltip');
    if(n){ tip.style.display='block'; tip.style.left=(e.clientX+12)+'px'; tip.style.top=(e.clientY+12)+'px'; tip.textContent=n.label+' · '+(n.type||'note'); }
    else tip.style.display='none';
    if(graphState.drag){ const rect=canvas.getBoundingClientRect(); graphState.drag.x=(e.clientX-rect.left - graphState.offset.x)/graphState.scale*dpr; graphState.drag.y=(e.clientY-rect.top - graphState.offset.y)/graphState.scale*dpr; }
  };
  canvas.onmousedown=e=>{
    const n=getNodeAt(e.clientX,e.clientY);
    if(n) graphState.drag=n;
    else { // pan
      const start={x:e.clientX - graphState.offset.x, y:e.clientY - graphState.offset.y};
      function onMove(ev){ graphState.offset.x=ev.clientX-start.x; graphState.offset.y=ev.clientY-start.y; }
      function onUp(){ window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); graphState.drag=null; }
      window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
    }
  };
  canvas.onmouseup=()=> graphState.drag=null;
  canvas.onclick=e=>{
    const n=getNodeAt(e.clientX,e.clientY); if(n && !graphState._dragged) switchDoc(n.id);
  };
  canvas.onwheel=e=>{ e.preventDefault(); const delta=e.deltaY>0?0.92:1.08; graphState.scale=Math.max(0.3,Math.min(3, graphState.scale*delta)); };

  // start loop, stop when view leaves
  if(canvas._anim) cancelAnimationFrame(canvas._anim);
  tick();
  const obs=new MutationObserver(()=>{
    if(!document.getElementById('view-graph').classList.contains('active')) cancelAnimationFrame(animId);
  });
  obs.observe(document.getElementById('view-graph'),{attributes:true});
}

// ── Wikilink menu ──
let wlActive=-1;
function handleWikilinkInput(){
  const sel=window.getSelection(); if(!sel.rangeCount) return hideWikilinkMenu();
  const node=sel.anchorNode; const text=(node.textContent||'').slice(0, sel.anchorOffset);
  const m=text.match(/\[\[([^\]]*)$/);
  if(!m) return hideWikilinkMenu();
  const q=m[1].toLowerCase();
  const matches=docs.filter(d=> d.title.toLowerCase().includes(q)).slice(0,6);
  if(!matches.length) return hideWikilinkMenu();
  const menu=document.getElementById('wikilink-menu');
  menu.innerHTML=matches.map((d,i)=> `<div class="wl-item ${i===0?'selected':''}" data-title="${esc(d.title)}">${esc(d.title)} <small>${d.folder||''}</small></div>`).join('');
  const rect=sel.getRangeAt(0).getBoundingClientRect();
  menu.style.left=rect.left+'px'; menu.style.top=(rect.bottom+6)+'px'; menu.classList.remove('hidden');
  wlActive=0;
  menu.querySelectorAll('.wl-item').forEach(el=> el.addEventListener('mousedown', e=>{
    e.preventDefault(); insertWikilink(el.dataset.title);
  }));
}
function hideWikilinkMenu(){ document.getElementById('wikilink-menu').classList.add('hidden'); wlActive=-1; }
function insertWikilink(title){
  const sel=window.getSelection(); if(!sel.rangeCount) return;
  const node=sel.anchorNode; const text=node.textContent||'';
  const before=text.slice(0, sel.anchorOffset); const after=text.slice(sel.anchorOffset);
  const idx=before.lastIndexOf('[[');
  if(idx===-1) return;
  const newText=before.slice(0,idx) + '[['+title+']] ' + after;
  node.textContent=newText;
  const range=document.createRange(); range.setStart(node, idx + title.length + 5); range.collapse(true);
  sel.removeAllRanges(); sel.addRange(range);
  hideWikilinkMenu();
  document.getElementById('editor').dispatchEvent(new Event('input',{bubbles:true}));
}

// ── Slash menu ──
const SLASH_ITEMS=[
  {label:'Heading 1', icon:'H1', action:()=> document.execCommand('formatBlock',false,'h1')},
  {label:'Heading 2', icon:'H2', action:()=> document.execCommand('formatBlock',false,'h2')},
  {label:'Heading 3', icon:'H3', action:()=> document.execCommand('formatBlock',false,'h3')},
  {label:'Bullet list', icon:'•', action:()=> document.execCommand('insertUnorderedList',false,null)},
  {label:'Numbered list', icon:'1.', action:()=> document.execCommand('insertOrderedList',false,null)},
  {label:'Quote', icon:'❝', action:()=> document.execCommand('formatBlock',false,'blockquote')},
  {label:'Code block', icon:'‹›', action:()=> document.execCommand('formatBlock',false,'pre')},
  {label:'Divider', icon:'—', action:()=> document.execCommand('insertHorizontalRule',false,null)},
  {label:'Table', icon:'⊞', action:()=> document.execCommand('insertHTML',false,'<table><tr><th>Header</th><th>Header</th></tr><tr><td>Cell</td><td>Cell</td></tr></table>')},
];
let slashQ='';
function handleSlashInput(){
  const sel=window.getSelection(); if(!sel.rangeCount) return;
  const node=sel.anchorNode; if(!node||node.nodeType!==3) return hideSlashMenu();
  const text=(node.textContent||'').slice(0, sel.anchorOffset);
  const m=text.match(/(?:^|\n)\/(\w*)$/);
  if(!m){ // also check if line starts with /
    const line=text.split('\n').pop();
    if(!line.startsWith('/')) return hideSlashMenu();
    slashQ=line.slice(1).toLowerCase();
  } else slashQ=m[1].toLowerCase();
  const filtered=SLASH_ITEMS.filter(i=> i.label.toLowerCase().includes(slashQ));
  if(!filtered.length) return hideSlashMenu();
  const menu=document.getElementById('slash-menu');
  menu.innerHTML=filtered.map((it,i)=> `<div class="sl-item ${i===0?'selected':''}" data-idx="${i}"><span>${it.icon}</span> ${it.label}</div>`).join('');
  const rect=sel.getRangeAt(0).getBoundingClientRect();
  menu.style.left=rect.left+'px'; menu.style.top=(rect.bottom+6)+'px'; menu.classList.remove('hidden');
  menu.querySelectorAll('.sl-item').forEach((el,i)=> el.addEventListener('mousedown', e=>{
    e.preventDefault(); execSlash(filtered[i]);
  }));
}
function hideSlashMenu(){ document.getElementById('slash-menu').classList.add('hidden'); }
function execSlash(item){
  const sel=window.getSelection(); if(!sel.rangeCount) return;
  const node=sel.anchorNode; const text=node.textContent||'';
  // remove the /query
  const before=text.slice(0, sel.anchorOffset); const after=text.slice(sel.anchorOffset);
  const lastSlash=before.lastIndexOf('/');
  node.textContent=before.slice(0,lastSlash)+after;
  const range=document.createRange(); range.setStart(node, lastSlash); range.collapse(true); sel.removeAllRanges(); sel.addRange(range);
  hideSlashMenu();
  document.getElementById('editor').focus();
  item.action();
  document.getElementById('editor').dispatchEvent(new Event('input',{bubbles:true}));
}

// ── Command palette ──
const COMMANDS=[
  {label:'New document', keys:'Ctrl+N', run:()=>createDoc()},
  {label:'Save', keys:'Ctrl+S', run:()=>{persistEditor();save();toast('Saved ✓');}},
  {label:'Toggle focus mode', run:()=>{settings.focus=!settings.focus;applySettings();save();}},
  {label:'Toggle typewriter', run:()=>{settings.typewriter=!settings.typewriter;applySettings();save();}},
  {label:'Toggle zen mode', run:()=>{settings.zen=!settings.zen;applySettings();save();}},
  {label:'Toggle syntax highlighting', run:()=>{settings.syntax=!settings.syntax;applySettings();save();}},
  {label:'View: Edit', keys:'Ctrl+1', run:()=>setView('edit')},
  {label:'View: Preview', keys:'Ctrl+2', run:()=>setView('preview')},
  {label:'View: Novel', keys:'Ctrl+3', run:()=>setView('novel')},
  {label:'View: Graph', keys:'Ctrl+4', run:()=>setView('graph')},
  {label:'Export as PDF', run:()=>doExport('pdf')},
  {label:'Export as HTML', run:()=>doExport('html')},
  {label:'Export as Markdown', run:()=>doExport('md')},
  {label:'Find & replace', keys:'Ctrl+F', run:()=>showFind()},
  {label:'Word count details', run:()=> document.querySelector('[data-tab="stats"]').click()},
];
function showPalette(){
  const overlay=document.getElementById('palette-overlay');
  const input=document.getElementById('palette-input');
  const list=document.getElementById('palette-list');
  overlay.classList.remove('hidden'); input.value=''; input.focus();
  let sel=0; let filtered=[...COMMANDS, ...docs.map(d=>({label:'Open: '+d.title, run:()=>switchDoc(d.id)}))];
  function render(){
    const q=input.value.toLowerCase();
    filtered=(q? [...COMMANDS, ...docs.map(d=>({label:'Open: '+d.title, run:()=>switchDoc(d.id)}))].filter(c=>c.label.toLowerCase().includes(q)) : [...COMMANDS, ...docs.map(d=>({label:'Open: '+d.title, run:()=>switchDoc(d.id)}))].slice(0,12));
    list.innerHTML=filtered.map((c,i)=> `<div class="palette-item ${i===sel?'selected':''}"><span>${esc(c.label)}</span>${c.keys?`<kbd>${c.keys}</kbd>`:''}</div>`).join('');
    list.querySelectorAll('.palette-item').forEach((el,i)=> el.addEventListener('click', ()=>{ overlay.classList.add('hidden'); filtered[i].run(); }));
  }
  render();
  input.oninput=()=>{ sel=0; render(); };
  input.onkeydown=e=>{
    if(e.key==='ArrowDown'){ sel=Math.min(sel+1, filtered.length-1); render(); e.preventDefault(); }
    else if(e.key==='ArrowUp'){ sel=Math.max(sel-1,0); render(); e.preventDefault(); }
    else if(e.key==='Enter'){ overlay.classList.add('hidden'); filtered[sel]?.run(); }
    else if(e.key==='Escape') overlay.classList.add('hidden');
  };
  overlay.onclick=e=>{ if(e.target===overlay) overlay.classList.add('hidden'); };
}
document.getElementById('btn-command').addEventListener('click', showPalette);
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.key==='k'){ e.preventDefault(); showPalette(); }
  if((e.ctrlKey||e.metaKey) && e.key==='f'){ e.preventDefault(); showFind(); }
  if((e.ctrlKey||e.metaKey) && e.key==='n'){ e.preventDefault(); createDoc(); }
});

// ── Find bar ──
function showFind(){ document.getElementById('find-bar').classList.remove('hidden'); document.getElementById('find-input').focus(); }
function hideFind(){ document.getElementById('find-bar').classList.add('hidden'); }
document.getElementById('btn-find-close').addEventListener('click', hideFind);
document.getElementById('find-input').addEventListener('input', doFind);
document.getElementById('btn-find-next').addEventListener('click', ()=> doFind(1));
document.getElementById('btn-find-prev').addEventListener('click', ()=> doFind(-1));
document.getElementById('btn-replace-one').addEventListener('click', doReplaceOne);
document.getElementById('btn-replace-all').addEventListener('click', doReplaceAll);
let findMatches=[], findIdx=-1;
function doFind(dir){
  const q=document.getElementById('find-input').value; if(!q) return;
  const caseSens=document.getElementById('find-case').checked;
  const whole=document.getElementById('find-word').checked;
  const text=document.getElementById('editor').innerText;
  const flags=caseSens?'g':'gi';
  const escQ=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=whole?`\\b${escQ}\\b`:escQ;
  const re=new RegExp(pattern, flags);
  findMatches=[...text.matchAll(re)];
  if(!findMatches.length) return toast('No matches');
  if(dir) findIdx=(findIdx+dir+findMatches.length)%findMatches.length; else findIdx=0;
  toast(`${findIdx+1} / ${findMatches.length}`);
  // highlight via selection - use window.find
  window.find(q, caseSens, false, true, whole, false, false);
}
function doReplaceOne(){
  const q=document.getElementById('find-input').value;
  const rep=document.getElementById('replace-input').value;
  if(!q) return;
  if(window.find(q, document.getElementById('find-case').checked, false, true, document.getElementById('find-word').checked, false, false)){
    document.execCommand('insertText',false,rep);
    document.getElementById('editor').dispatchEvent(new Event('input',{bubbles:true}));
  }
}
function doReplaceAll(){
  const q=document.getElementById('find-input').value;
  const rep=document.getElementById('replace-input').value;
  if(!q) return;
  const ed=document.getElementById('editor');
  const escQ=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const flags=document.getElementById('find-case').checked?'g':'gi';
  const pattern=document.getElementById('find-word').checked?`\\b${escQ}\\b`:escQ;
  ed.innerHTML=ed.innerHTML.replace(new RegExp(pattern, flags), rep);
  ed.dispatchEvent(new Event('input',{bubbles:true}));
  toast('Replaced all');
}

// ── Pomodoro ──
function initPomodoro(){
  const btn=document.getElementById('btn-pomodoro');
  function render(){ const m=String(Math.floor(pomodoroLeft/60)).padStart(2,'0'), s=String(pomodoroLeft%60).padStart(2,'0'); btn.textContent=`◷ ${m}:${s}`; }
  btn.addEventListener('click', ()=>{
    pomodoroRunning=!pomodoroRunning;
    if(pomodoroRunning){
      pomodoroTimer=setInterval(()=>{ pomodoroLeft--; render(); if(pomodoroLeft<=0){ clearInterval(pomodoroTimer); pomodoroRunning=false; pomodoroLeft=25*60; render(); toast('Pomodoro done — take a break ☕'); try{ new Notification('Reign — Pomodoro done'); }catch{} } },1000);
      try{ Notification.requestPermission(); }catch{}
    } else clearInterval(pomodoroTimer);
  });
  render();
}

// ── Export ──
function doExport(kind){
  const d=activeDoc(); if(!d) return;
  const html=document.getElementById('editor').innerHTML;
  if(kind==='pdf'){ window.print(); return; }
  if(kind==='html'){
    const blob=new Blob([`<!doctype html><meta charset="utf-8"><title>${esc(d.title)}</title><style>body{max-width:720px;margin:40px auto;font-family:Georgia,serif;line-height:1.7;color:#1a1a1e;padding:0 20px}h1{font-size:2em}</style><h1>${esc(d.title)}</h1>${html}`],{type:'text/html'});
    download(blob, slug(d.title)+'.html');
  }
  if(kind==='md'){
    const md=htmlToMarkdown(html);
    const blob=new Blob([`# ${d.title}\n\n`+md],{type:'text/markdown'}); download(blob, slug(d.title)+'.md');
  }
  if(kind==='txt'){
    const txt=document.getElementById('editor').innerText;
    const blob=new Blob([txt],{type:'text/plain'}); download(blob, slug(d.title)+'.txt');
  }
}
function download(blob, name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
function htmlToMarkdown(html){
  let md=html;
  md=md.replace(/<h1[^>]*>(.*?)<\/h1>/gi,'# $1\n\n');
  md=md.replace(/<h2[^>]*>(.*?)<\/h2>/gi,'## $1\n\n');
  md=md.replace(/<h3[^>]*>(.*?)<\/h3>/gi,'### $1\n\n');
  md=md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis,'> $1\n\n');
  md=md.replace(/<strong[^>]*>(.*?)<\/strong>/gi,'**$1**');
  md=md.replace(/<b[^>]*>(.*?)<\/b>/gi,'**$1**');
  md=md.replace(/<em[^>]*>(.*?)<\/em>/gi,'*$1*');
  md=md.replace(/<i[^>]*>(.*?)<\/i>/gi,'*$1*');
  md=md.replace(/<code[^>]*>(.*?)<\/code>/gi,'`$1`');
  md=md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,'[$2]($1)');
  md=md.replace(/<li[^>]*>(.*?)<\/li>/gi,'- $1\n');
  md=md.replace(/<hr[^>]*>/gi,'\n---\n');
  md=md.replace(/<[^>]+>/g,'');
  md=md.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  return md.trim();
}
document.querySelectorAll('[data-export]').forEach(b=> b.addEventListener('click', ()=> doExport(b.dataset.export)));

// ── Inspector toggles & ref copy ──
document.getElementById('opt-focus').addEventListener('change', e=>{ settings.focus=e.target.checked; applySettings(); save(); });
document.getElementById('opt-typewriter').addEventListener('change', e=>{ settings.typewriter=e.target.checked; applySettings(); save(); });
document.getElementById('opt-zen').addEventListener('change', e=>{ settings.zen=e.target.checked; applySettings(); save(); });
document.getElementById('btn-copy-ref').addEventListener('click', ()=>{
  const t=document.getElementById('ref-id').textContent;
  navigator.clipboard.writeText(t).then(()=> toast('Copied '+t));
});
document.getElementById('doc-title').addEventListener('change', e=>{
  const d=activeDoc(); if(!d) return; d.title=e.target.value.trim()||'Untitled';
  document.getElementById('ref-id').textContent='reign://'+slug(d.title);
  document.getElementById('doc-path').textContent='/ '+(d.folder||'').toLowerCase()+' / '+slug(d.title)+'.md';
  save(); renderFileTree();
});
document.getElementById('doc-title').addEventListener('input', ()=> document.getElementById('doc-dirty').classList.remove('hidden'));
document.getElementById('btn-zoom-in').addEventListener('click', ()=>{ settings.zoom=Math.min(200, settings.zoom+10); applySettings(); save(); });
document.getElementById('btn-zoom-out').addEventListener('click', ()=>{ settings.zoom=Math.max(60, settings.zoom-10); applySettings(); save(); });

// ── Helpers ──
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function toast(msg){
  let t=document.getElementById('_toast');
  if(!t){ t=document.createElement('div'); t.id='_toast'; Object.assign(t.style,{position:'fixed',bottom:'36px',left:'50%',transform:'translateX(-50%)',background:'var(--surface-2)',color:'var(--text)',border:'1px solid var(--border-strong)',padding:'8px 16px',borderRadius:'99px',fontSize:'13px',zIndex:'999',boxShadow:'var(--shadow)'}); document.body.appendChild(t); }
  t.textContent=msg; t.style.display='block'; clearTimeout(t._timer); t._timer=setTimeout(()=> t.style.display='none',2000);
}
function refreshAll(){ renderCards(); updateStats(); renderOutline(); renderBacklinks(); renderPreview(); renderNovel(); updateGoal(); }

// ── Session timer ──
function startSessionTimer(){
  sessionTimer=setInterval(()=>{ sessionSeconds++; const m=String(Math.floor(sessionSeconds/60)).padStart(2,'0'), s=String(sessionSeconds%60).padStart(2,'0'); document.getElementById('stat-session-time').textContent=`${m}:${s}`; },1000);
  document.getElementById('editor').addEventListener('input', ()=>{ sessionWords = Math.max(0, countWords(document.getElementById('editor').innerText) - sessionStartWords); },{once:false});
}

// ── Boot ──
load(); applySettings();
renderFileTree(); loadDoc(activeId); refreshAll();
initEditor(); initToolbar(); initViews(); initSideTabs(); initSearch(); initPomodoro();
startSessionTimer();
setInterval(()=>{ document.getElementById('stat-saved').textContent='just now'; }, 30000);

// save on unload
window.addEventListener('beforeunload', ()=>{ persistEditor(); save(); });

// global click to close menus
document.addEventListener('mousedown', e=>{
  if(!e.target.closest('#wikilink-menu') && !e.target.closest('#editor')) hideWikilinkMenu();
  if(!e.target.closest('#slash-menu')) hideSlashMenu();
});
document.addEventListener('keydown', e=>{
  // wikilink nav
  const wl=document.getElementById('wikilink-menu');
  if(!wl.classList.contains('hidden')){
    const items=[...wl.querySelectorAll('.wl-item')];
    if(e.key==='ArrowDown'){ e.preventDefault(); wlActive=(wlActive+1)%items.length; items.forEach((el,i)=> el.classList.toggle('selected', i===wlActive)); }
    if(e.key==='ArrowUp'){ e.preventDefault(); wlActive=(wlActive-1+items.length)%items.length; items.forEach((el,i)=> el.classList.toggle('selected', i===wlActive)); }
    if(e.key==='Enter' || e.key==='Tab'){ e.preventDefault(); if(items[wlActive]) insertWikilink(items[wlActive].dataset.title); }
    if(e.key==='Escape') hideWikilinkMenu();
  }
});
