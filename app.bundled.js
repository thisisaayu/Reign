
/* === src/js/core/store.js === */
/* store.js — persistence + doc CRUD (browser + Electron) */
const LS_DOCS = 'reign-docs-v2';
const LS_SETTINGS = 'reign-settings-v2';
const TEMPLATES = {
  character: { title:'New Character', type:'character', content:`<h1>Character Name</h1><p><b>Role:</b> Protagonist / Antagonist / Supporting</p><p><b>Age:</b> — &nbsp; <b>Occupation:</b> —</p><blockquote>One-line essence of who they are.</blockquote><h2>Appearance</h2><p>Describe them…</p><h2>Backstory</h2><p>Where they came from…</p><h2>Arc</h2><p>Where they're going…</p><h2>Relationships</h2><ul><li>[[Another Character]] — description</li></ul>` },
  world: { title:'New Location', type:'world', content:`<h1>Place Name</h1><blockquote>A one-line evocation.</blockquote><h2>Geography</h2><p>…</p><h2>Culture</h2><p>…</p><h2>History</h2><p>…</p><h2>Connected</h2><p>[[Related Note]]</p>` },
  scene: { title:'New Scene', type:'scene', content:`<h1>Scene — Chapter —</h1><p><b>POV:</b> — &nbsp; <b>Goal:</b> — &nbsp; <b>Conflict:</b> — &nbsp; <b>Outcome:</b> —</p><hr><p>Write the scene…</p><p><em>Links: [[Chapter 1]] · [[Character Name]]</em></p>` },
  chapter: { title:'Chapter —', type:'manuscript', content:`<h1>Chapter One</h1><p>The story begins…</p><p>Reference other notes with [[double brackets]] and embed them with ![[Note Title]].</p>` },
};
const DEFAULT_DOCS = [
  { id:'welcome', title:'Welcome to Reign', type:'manuscript', folder:'Manuscripts', content:`<h1>Welcome to Reign ◈</h1><p><em>A writing studio for people who write books.</em></p><p><b>Reign</b> blends the precision of <b>LibreOffice</b> — rulers, styles, tables, full formatting — with the connected thinking of <b>Obsidian</b>: every note can reference every other note.</p><h2>Try it</h2><ul><li>Type <code>[[</code> to link another note — try <span class="wikilink">[[The Hollow Crown]]</span></li><li>Type <code>/</code> for the slash menu (headings, quotes, tables…)</li><li>Press <code>Ctrl+K</code> for the command palette</li><li>Switch to <b>Graph</b> to see how your notes connect</li><li>Switch to <b>Novel</b> to read your manuscript as a typeset book</li></ul><blockquote>"The page is a mirror. The graph is a map. The novel is the destination."</blockquote><h2>Reference anything</h2><p>Every document has a <code>reign://</code> URI (see the Inspector → Reference ID). Other apps can open it. Inside Reign, use <code>![[Note Title]]</code> to transclude a note inline.</p><p>Tags like <span class="tag">#fantasy</span> <span class="tag">#draft</span> are searchable and clickable.</p><h2>Four themes</h2><p>Dark · AMOLED · Light · Bloom (pink-cyan). Toggle them in the toolbar — your choice is remembered.</p>`, created:Date.now(), updated:Date.now() },
  { id:'hollow', title:'The Hollow Crown', type:'manuscript', folder:'Manuscripts', content:`<h1>The Hollow Crown</h1><p><em>Chapter One — Ashes</em></p><p>The city of Karst had been built inside the ribcage of a dead god. Its avenues followed the curve of bone, its towers rose where marrow had once flowed. And now, on the night the crown went missing, rain fell through the open chest like tears.</p><p>Mira pressed her back against the basilica wall. In her palm, the thing they were all killing for — a circlet of black glass, warm to the touch, humming faintly. It had no business being beautiful.</p><blockquote>She thought of [[Elian Voss]] and the promise she'd made. She thought of [[Karst — The Bone City]] and whether any of it deserved saving.</blockquote><p>Somewhere above, a bell tolled. Not the hour — an alarm.</p><h2>Notes</h2><p>Links: [[Elian Voss]] · [[Karst — The Bone City]] · [[The Obsidian Sigil]]</p><p>Tags: <span class="tag">#draft</span> <span class="tag">#chapter1</span></p>`, created:Date.now()-100000, updated:Date.now()-50000 },
  { id:'elian', title:'Elian Voss', type:'character', folder:'Characters', content:`<h1>Elian Voss</h1><p><b>Role:</b> Antagonist &nbsp; <b>Age:</b> 41 &nbsp; <b>House:</b> Voss</p><blockquote>"A man who mistakes control for love."</blockquote><h2>Appearance</h2><p>Tall, hollow-cheeked, silver at the temples. Wears the obsidian sigil openly — which in Karst is either piety or provocation.</p><h2>Drive</h2><p>Believes the god inside Karst is not dead, merely sleeping. Wants to wake it. Linked to [[The Obsidian Sigil]] and [[Karst — The Bone City]].</p>`, created:Date.now()-200000, updated:Date.now()-100000 },
  { id:'karst', title:'Karst — The Bone City', type:'world', folder:'World', content:`<h1>Karst — The Bone City</h1><blockquote>A city inside a god. Or a god inside a city.</blockquote><h2>Districts</h2><ul><li><b>The Sternum</b> — administrative heart</li><li><b>The Ribs</b> — residential arcs</li><li><b>The Marrow Deep</b> — forbidden</li></ul><p>Home to [[Elian Voss]]. Central artifact: [[The Obsidian Sigil]]. Featured in [[The Hollow Crown]].</p>`, created:Date.now()-300000, updated:Date.now()-80000 },
  { id:'sigil', title:'The Obsidian Sigil', type:'world', folder:'World', content:`<h1>The Obsidian Sigil</h1><p>A black-glass circlet, warm to the touch. Said to be a fragment of the dead god's crown.</p><p>Held at various times by [[Elian Voss]]. Sought in [[The Hollow Crown]]. Origin: [[Karst — The Bone City]].</p>`, created:Date.now()-400000, updated:Date.now()-60000 },
];
const DEFAULT_SETTINGS = { theme:'dark', syntax:true, focus:false, typewriter:false, zen:false, goal:500, zoom:100, novelWidth:'narrow', novelPaged:true };
function createStore() {
  let docs = [];
  let activeId = null;
  let settings = { ...DEFAULT_SETTINGS };

  function load() {
    try { docs = JSON.parse(localStorage.getItem(LS_DOCS)) || JSON.parse(JSON.stringify(DEFAULT_DOCS)); } catch { docs = JSON.parse(JSON.stringify(DEFAULT_DOCS)); }
    try { Object.assign(settings, JSON.parse(localStorage.getItem(LS_SETTINGS))||{}); } catch {}
    activeId = docs[0]?.id || null;
  }
  function save() {
    localStorage.setItem(LS_DOCS, JSON.stringify(docs));
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    window.reignAPI?.save?.({ docs, settings, activeId });
  }
  // Electron may hydrate from disk on boot
  async function hydrateFromDisk() {
    if (!window.reignAPI?.load) return;
    try {
      const disk = await window.reignAPI.load();
      if (disk?.docs?.length) { docs = disk.docs; activeId = disk.activeId || docs[0].id; }
      if (disk?.settings) Object.assign(settings, disk.settings);
    } catch {}
  }

  return {
    get docs(){ return docs; }, set docs(v){ docs=v; },
    get activeId(){ return activeId; }, set activeId(v){ activeId=v; },
    get settings(){ return settings; },
    load, save, hydrateFromDisk,
    getDoc(id){ return docs.find(d=>d.id===id); },
    activeDoc(){ return docs.find(d=>d.id===activeId); },
  };
}


/* === src/js/core/utils.js === */
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function slug(t){ return t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function countWords(t){ const w=t.trim().split(/\s+/).filter(Boolean); return t.trim()? w.length:0; }
function parseWikilinks(html){
  const re=/\[\[([^\]]+)\]\]/g; const out=[]; let m; while(m=re.exec(html)) out.push(m[1].trim());
  return out;
}
function debounce(fn, ms){ let id; return (...a)=>{ clearTimeout(id); id=setTimeout(()=>fn(...a), ms); }; }
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
function toast(msg){
  let t=document.getElementById('_toast');
  if(!t){ t=document.createElement('div'); t.id='_toast'; Object.assign(t.style,{position:'fixed',bottom:'36px',left:'50%',transform:'translateX(-50%)',background:'var(--surface-2)',color:'var(--text)',border:'1px solid var(--border-strong)',padding:'8px 16px',borderRadius:'99px',fontSize:'13px',zIndex:'999',boxShadow:'var(--shadow)'}); document.body.appendChild(t); }
  t.textContent=msg; t.style.display='block'; clearTimeout(t._timer); t._timer=setTimeout(()=> t.style.display='none',2000);
}
function downloadBlob(blob, name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }


/* === src/js/core/snapshots.js === */
// snapshots + daily streak
const LS_SNAPS='reign-snaps-v1';
const LS_STREAK='reign-streak-v1';
function pushSnapshot(store){
  const d=store.activeDoc(); if(!d) return;
  let snaps=[]; try{ snaps=JSON.parse(localStorage.getItem(LS_SNAPS)||'[]'); }catch{}
  snaps.push({ id:d.id, title:d.title, at:Date.now(), html:d.content.slice(0,8000) });
  if(snaps.length>120) snaps=snaps.slice(-120);
  localStorage.setItem(LS_SNAPS, JSON.stringify(snaps));
}
function getSnapshots(id){
  try{ const all=JSON.parse(localStorage.getItem(LS_SNAPS)||'[]'); return all.filter(s=>s.id===id).reverse(); }catch{ return []; }
}
function bumpStreak(){
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
function getStreak(){
  try{ return JSON.parse(localStorage.getItem(LS_STREAK)||'{"streak":0,"last":""}'); }catch{ return {streak:0,last:''}; }
}


/* === src/js/graph/graph.js === */
/* Force-directed graph canvas (Obsidian-style) — upgraded:
   - filtered modes: all / local (neighbors of active doc)
   - search within graph
   - hover card with snippet + open
   - export PNG
*/
function initGraph(store, switchDoc) {
  const canvas=document.getElementById('graph-canvas');
  const wrap=document.getElementById('view-graph');
  if(!canvas || !wrap) return;
  const dpr=window.devicePixelRatio||1;

  function resize(){
    canvas.width=wrap.clientWidth*dpr; canvas.height=(wrap.clientHeight - 40)*dpr;
    canvas.style.width=wrap.clientWidth+'px'; canvas.style.height=(wrap.clientHeight-40)+'px';
  }
  resize();

  const nodes=store.docs.map(d=>({
    id:d.id, label:d.title, type:d.type||'manuscript',
    x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx:0, vy:0,
    r: d.type==='manuscript'? 14 : 11
  }));
  const titleMap=new Map(store.docs.map(d=>[d.title.toLowerCase(), d.id]));
  const edges=[];
  store.docs.forEach(d=>{
    parseWikilinks(d.content||'').forEach(t=>{
      const tid=titleMap.get(t.toLowerCase());
      if(tid && tid!==d.id) edges.push({from:d.id,to:tid});
    });
  });

  const state={ canvas, nodes, edges, hover:null, drag:null, offset:{x:0,y:0}, scale:1, showLabels:true, showOrphans:false, mode:'all', query:'' };

  const chkLabels=document.getElementById('graph-labels');
  const chkOrphans=document.getElementById('graph-orphans');
  const depthEl=document.getElementById('graph-depth');
  const depthLabel=document.getElementById('graph-depth-label');
  if(chkLabels) chkLabels.onchange=e=> state.showLabels=e.target.checked;
  if(chkOrphans) chkOrphans.onchange=e=> state.showOrphans=e.target.checked;
  if(depthEl) depthEl.oninput=e=>{ if(depthLabel) depthLabel.textContent='depth '+e.target.value; };

  document.getElementById('graph-reset')?.addEventListener('click', ()=>{ state.offset={x:0,y:0}; state.scale=1; });
  document.getElementById('graph-center')?.addEventListener('click', ()=>{
    const act=nodes.find(n=>n.id===store.activeId); if(act){ state.offset.x=canvas.width/2/dpr - act.x/dpr; state.offset.y=canvas.height/2/dpr - act.y/dpr; }
  });
  document.getElementById('graph-fit')?.addEventListener('click', ()=>{
    if(!nodes.length) return;
    const xs=nodes.map(n=>n.x), ys=nodes.map(n=>n.y);
    const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
    const pad=40; const W=canvas.width/dpr, H=canvas.height/dpr;
    const sx=(W-pad*2)/Math.max(1,(maxX-minX)/dpr), sy=(H-pad*2)/Math.max(1,(maxY-minY)/dpr);
    state.scale=Math.min(1.4, Math.min(sx,sy));
    state.offset.x=W/2 - ((minX+maxX)/2/dpr)*state.scale;
    state.offset.y=H/2 - ((minY+maxY)/2/dpr)*state.scale;
  });
  document.getElementById('graph-export')?.addEventListener('click', ()=>{
    const url=canvas.toDataURL('image/png'); const a=document.createElement('a'); a.href=url; a.download='reign-graph.png'; a.click();
  });
  document.getElementById('graph-search')?.addEventListener('input', e=>{ state.query=e.target.value.toLowerCase().trim(); });
  document.querySelectorAll('[data-graph-mode]').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelectorAll('[data-graph-mode]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); state.mode=b.dataset.graphMode;
  }));

  let animId;
  function tick(){
    const cx=canvas.width/2, cy=canvas.height/2;
    for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i], b=nodes[j]; const dx=a.x-b.x, dy=a.y-b.y; const dist=Math.hypot(dx,dy)||1;
      const rep= 8000/(dist*dist); const fx=dx/dist*rep, fy=dy/dist*rep;
      a.vx+=fx*0.02; a.vy+=fy*0.02; b.vx-=fx*0.02; b.vy-=fy*0.02;
    }
    edges.forEach(e=>{
      const a=nodes.find(n=>n.id===e.from), b=nodes.find(n=>n.id===e.to); if(!a||!b) return;
      const dx=b.x-a.x, dy=b.y-a.y; const dist=Math.hypot(dx,dy)||1; const ideal=140;
      const f=(dist-ideal)*0.008; const fx=dx/dist*f, fy=dy/dist*f;
      a.vx+=fx; a.vy+=fy; b.vx-=fx; b.vy-=fy;
    });
    nodes.forEach(n=>{
      if(state.drag===n) return;
      n.vx*=0.88; n.vy*=0.88;
      n.vx+=(cx-n.x)*0.0006; n.vy+=(cy-n.y)*0.0006;
      n.x+=n.vx; n.y+=n.vy;
    });
    draw();
    animId=requestAnimationFrame(tick);
  }
  function filtered(){
    let vis=nodes;
    // orphans filter
    if(!state.showOrphans){
      const deg=new Map(nodes.map(n=>[n.id,0])); edges.forEach(e=>{ deg.set(e.from,(deg.get(e.from)||0)+1); deg.set(e.to,(deg.get(e.to)||0)+1); });
      vis=vis.filter(n=> (deg.get(n.id)||0)>0 || n.id===store.activeId);
    }
    // local mode: only active + neighbors
    if(state.mode==='local'){
      const neigh=new Set([store.activeId]);
      edges.forEach(e=>{ if(e.from===store.activeId) neigh.add(e.to); if(e.to===store.activeId) neigh.add(e.from); });
      vis=vis.filter(n=> neigh.has(n.id));
    }
    // query highlight
    return vis;
  }
  function draw(){
    const ctx=canvas.getContext('2d');
    ctx.save(); ctx.scale(dpr,dpr);
    const W=canvas.width/dpr, H=canvas.height/dpr;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--bg').trim()||'#141420';
    ctx.fillRect(0,0,W,H);
    ctx.translate(state.offset.x, state.offset.y);
    ctx.scale(state.scale, state.scale);

    const vis=filtered();
    const visSet=new Set(vis.map(n=>n.id));
    const visEdges = edges.filter(e=> visSet.has(e.from) && visSet.has(e.to));

    ctx.strokeStyle=getComputedStyle(document.body).getPropertyValue('--graph-edge').trim()||'rgba(255,255,255,.08)';
    ctx.lineWidth=1;
    visEdges.forEach(e=>{
      const a=nodes.find(n=>n.id===e.from), b=nodes.find(n=>n.id===e.to);
      ctx.beginPath(); ctx.moveTo(a.x/dpr,a.y/dpr); ctx.lineTo(b.x/dpr,b.y/dpr); ctx.stroke();
    });
    vis.forEach(n=>{
      const isActive=n.id===store.activeId, isHover=state.hover===n;
      const isMatch=state.query && n.label.toLowerCase().includes(state.query);
      const color = isMatch? '#ffd54f' : n.type==='character'?'#ff6b9d': n.type==='world'?'#4ecdc4': n.type==='scene'?'#f0c040': getComputedStyle(document.body).getPropertyValue('--accent').trim()||'#7c6cf0';
      ctx.beginPath(); ctx.arc(n.x/dpr,n.y/dpr, isActive? n.r+3 : n.r, 0, Math.PI*2);
      ctx.fillStyle=color; ctx.globalAlpha=isActive?1:0.92; ctx.fill(); ctx.globalAlpha=1;
      if(isActive||isHover||isMatch){ ctx.strokeStyle='#fff'; ctx.lineWidth=isMatch?2:2; ctx.stroke(); }
      if(state.showLabels){
        ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--text').trim()||'#fff';
        ctx.font='11px Instrument Sans, sans-serif'; ctx.textAlign='center';
        ctx.fillText(n.label.slice(0,22), n.x/dpr, n.y/dpr + n.r + 14);
      }
    });
    ctx.restore();
  }

  function getNodeAt(x,y){
    const rect=canvas.getBoundingClientRect();
    const px=(x-rect.left - state.offset.x)/state.scale;
    const py=(y-rect.top - state.offset.y)/state.scale;
    const vis=filtered();
    return vis.find(n=> Math.hypot(n.x/dpr - px, n.y/dpr - py) < n.r+8) || null;
  }
  const tip=document.getElementById('graph-tooltip');
  canvas.onmousemove=e=>{
    const n=getNodeAt(e.clientX,e.clientY);
    state.hover=n; canvas.style.cursor=n?'pointer':'grab';
    if(tip){
      if(n){ tip.style.display='block'; tip.style.left=(e.clientX+12)+'px'; tip.style.top=(e.clientY+12)+'px'; tip.innerHTML=`<b>${n.label}</b> · ${n.type||'note'}<br><span style="color:var(--text-faint)">click to open</span>`; }
      else tip.style.display='none';
    }
    if(state.drag){ const rect=canvas.getBoundingClientRect(); state.drag.x=(e.clientX-rect.left - state.offset.x)/state.scale*dpr; state.drag.y=(e.clientY-rect.top - state.offset.y)/state.scale*dpr; }
  };
  canvas.onmousedown=e=>{
    const n=getNodeAt(e.clientX,e.clientY);
    if(n) state.drag=n;
    else {
      const start={x:e.clientX - state.offset.x, y:e.clientY - state.offset.y};
      const onMove=ev=>{ state.offset.x=ev.clientX-start.x; state.offset.y=ev.clientY-start.y; };
      const onUp=()=>{ window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); state.drag=null; };
      window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
    }
  };
  canvas.onmouseup=()=> state.drag=null;
  canvas.onclick=e=>{
    const n=getNodeAt(e.clientX,e.clientY); if(n) switchDoc(n.id);
  };
  canvas.onwheel=e=>{ e.preventDefault(); const delta=e.deltaY>0?0.92:1.08; state.scale=Math.max(0.3,Math.min(3, state.scale*delta)); };
  canvas.addEventListener('contextmenu', e=> e.preventDefault());

  if(canvas._anim) cancelAnimationFrame(canvas._anim);
  tick();
  canvas._anim=animId;
  const obs=new MutationObserver(()=>{
    if(!document.getElementById('view-graph').classList.contains('active')) cancelAnimationFrame(animId);
  });
  obs.observe(document.getElementById('view-graph'),{attributes:true, attributeFilter:['class']});
}


/* === src/js/editor/editor.js === */
function initEditor(store, refreshAll, { handleWikilinkInput, handleSlashInput, hideWikilinkMenu, hideSlashMenu, showPalette, showFind, createDoc, toast }) {
  const ed=document.getElementById('editor');
  function persistEditor(){
    const d=store.activeDoc(); if(!d) return;
    d.content = ed.innerHTML;
    d.updated = Date.now();
    d.words = countWords(ed.innerText);
  }
  ed.addEventListener('input', ()=>{
    persistEditor(); store.save();
    refreshAll(); handleWikilinkInput(); handleSlashInput();
  });
  ed.addEventListener('keyup', e=>{
    if(e.key==='[') handleWikilinkInput();
    if(e.key==='/') handleSlashInput();
    if(e.key==='Escape'){ hideWikilinkMenu(); hideSlashMenu(); }
  });
  ed.addEventListener('click', e=>{
    if(e.target.classList.contains('wikilink')){
      const title=e.target.textContent.replace(/^\[\[|\]\]$/g,'').trim();
      const found=store.docs.find(d=>d.title.toLowerCase()===title.toLowerCase());
      if(found){ persistEditor(); store.activeId=found.id; loadDoc(store); refreshAll(); store.save(); renderFileTree(store, refreshAll, persistEditor); }
    }
  });
  ed.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && e.key==='b'){ e.preventDefault(); fmt('bold'); }
    if((e.ctrlKey||e.metaKey) && e.key==='i'){ e.preventDefault(); fmt('italic'); }
    if((e.ctrlKey||e.metaKey) && e.key==='u'){ e.preventDefault(); fmt('underline'); }
    if((e.ctrlKey||e.metaKey) && e.key==='k' && !e.shiftKey){ e.preventDefault(); showPalette(); }
    if((e.ctrlKey||e.metaKey) && e.key==='s'){ e.preventDefault(); persistEditor(); store.save(); toast('Saved ✓'); }
    if(e.key==='Tab'){ e.preventDefault(); document.execCommand('insertText',false,'    '); }
  });
  return { persistEditor };
}
function fmt(action, getSelText=()=> window.getSelection().toString()||'code'){
  const ed=document.getElementById('editor'); ed.focus();
  const map={ bold:'bold', italic:'italic', underline:'underline', strike:'strikeThrough',
    alignLeft:'justifyLeft', alignCenter:'justifyCenter', alignRight:'justifyRight', justify:'justifyFull',
    ul:'insertUnorderedList', ol:'insertOrderedList' };
  if(map[action]) document.execCommand(map[action],false,null);
  else if(action==='blockquote') document.execCommand('formatBlock',false,'blockquote');
  else if(action==='code') document.execCommand('insertHTML',false,'<code>'+esc(getSelText())+'</code>');
  else if(action==='link'){ const url=prompt('Link URL:','https://'); if(url) document.execCommand('createLink',false,url); }
  else if(action==='image'){ const url=prompt('Image URL:','https://'); if(url) document.execCommand('insertImage',false,url); }
  else if(action==='table'){ document.execCommand('insertHTML',false,'<table><tr><th>Header</th><th>Header</th></tr><tr><td>Cell</td><td>Cell</td></tr></table>'); }
  else if(action==='hr') document.execCommand('insertHorizontalRule',false,null);
  ed.dispatchEvent(new Event('input',{bubbles:true}));
}
function loadDoc(store){
  const d=store.activeDoc(); if(!d) return;
  const slug = d.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  document.getElementById('doc-title').value = d.title;
  document.getElementById('doc-path').textContent = '/ '+(d.folder||'').toLowerCase()+' / '+slug+'.md';
  document.getElementById('ref-id').textContent = 'reign://'+slug;
  document.getElementById('editor').innerHTML = d.content;
}
function renderFileTree(store, refreshAll, persistEditor){
  const el = document.getElementById('file-tree');
  if(!el) return;
  const folders = {};
  store.docs.forEach(d=>{ (folders[d.folder||'Unsorted'] ||= []).push(d); });
  let html='';
  for(const [folder, list] of Object.entries(folders)){
    html+=`<div class="tree-folder">${folder}</div>`;
    for(const d of list){
      const icon = d.type==='character'?'👤': d.type==='world'?'🌍': d.type==='scene'?'🎬':'📄';
      html+=`<div class="tree-item ${d.id===store.activeId?'active':''}" data-id="${d.id}"><span class="tree-icon">${icon}</span><span class="tree-name">${esc(d.title)}</span><button class="tree-del" data-del="${d.id}" title="Delete">✕</button></div>`;
    }
  }
  el.innerHTML = html;
  el.querySelectorAll('.tree-item').forEach(row=>{
    row.addEventListener('click', e=>{
      if(e.target.dataset.del) return;
      if(persistEditor) persistEditor();
      store.activeId=row.dataset.id;
      loadDoc(store); refreshAll(); store.save(); renderFileTree(store, refreshAll, persistEditor);
    });
  });
  el.querySelectorAll('[data-del]').forEach(b=>{
    b.addEventListener('click', e=>{
      e.stopPropagation();
      const id=b.dataset.del;
      if(store.docs.length<=1) return alert('Cannot delete last document.');
      const doc=store.getDoc(id);
      if(!confirm('Delete "'+doc.title+'"?')) return;
      store.docs = store.docs.filter(d=>d.id!==id);
      if(store.activeId===id) store.activeId=store.docs[0].id;
      store.save(); renderFileTree(store, refreshAll, persistEditor); loadDoc(store); refreshAll();
    });
  });
}


/* === src/js/editor/menus.js === */
/* Wikilink autocomplete */
function createWikilinkMenu(store) {
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
function createSlashMenu() {
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


/* === src/js/views/preview.js === */
function renderPreview(store){
  const ed=document.getElementById('editor'); if(!ed) return;
  let html=ed.innerHTML;
  html=html.replace(/!\[\[([^\]]+)\]\]/g, (m,title)=>{
    const found=store.docs.find(d=>d.title.toLowerCase()===title.trim().toLowerCase());
    if(!found) return `<em style="color:var(--text-faint)">![[${esc(title)}]] — not found</em>`;
    return `<div style="border:1px solid var(--border);border-left:3px solid var(--accent);padding:10px 14px;border-radius:var(--radius-sm);margin:8px 0;background:var(--bg-3)"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-faint);margin-bottom:4px">${esc(found.title)}</div>${found.content}</div>`;
  });
  html=html.replace(/\[\[([^\]]+)\]\]/g, (m,title)=>{
    const found=store.docs.find(d=>d.title.toLowerCase()===title.trim().toLowerCase());
    return `<a class="wikilink ${found?'':'broken'}" data-title="${esc(title.trim())}">[[${esc(title.trim())}]]</a>`;
  });
  html=html.replace(/#(\w+)/g,'<span class="tag">#$1</span>');
  document.getElementById('preview-article').innerHTML=html;
}


/* === src/js/views/novel.js === */
function renderNovel(store){
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
function bindNovelControls(store, applySettings){
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


/* === src/js/ui/stats.js === */
let sessionStartWords=0, sessionWords=0, sessionTimer=null, sessionSeconds=0;
function setSessionStart(n){ sessionStartWords=n; sessionWords=0; }
function updateStats(){
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
function updateGoal(store){
  const words=countWords(document.getElementById('editor')?.innerText||'');
  const pct=Math.min(100, Math.round(words/(store.settings.goal||500)*100));
  const fill=document.getElementById('goal-fill'), txt=document.getElementById('goal-text');
  if(fill) fill.style.width=pct+'%';
  if(txt) txt.textContent=words.toLocaleString()+' / '+(store.settings.goal||500)+' words';
}
function updateLineCol(){
  const sel=window.getSelection(); if(!sel.rangeCount) return;
  const ed=document.getElementById('editor'); const r=sel.getRangeAt(0).cloneRange();
  r.selectNodeContents(ed); r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  const lines=r.toString().split('\n'); document.getElementById('status-linecol').textContent=`Ln ${lines.length}, Col ${lines[lines.length-1].length+1}`;
}
function renderOutline(){
  const ed=document.getElementById('editor'), out=document.getElementById('outline-tree'); if(!ed||!out) return;
  const headings=[...ed.querySelectorAll('h1,h2,h3')];
  if(!headings.length){ out.innerHTML='<p class="hint-text">No headings yet. Add a Heading 1/2 to see outline.</p>'; return; }
  out.innerHTML=headings.map((h,i)=>{ const lvl=h.tagName==='H1'?1:h.tagName==='H2'?2:3; return `<div class="outline-item lvl-${lvl}" data-idx="${i}">${esc(h.textContent.slice(0,60))}</div>`; }).join('');
  out.querySelectorAll('.outline-item').forEach(el=> el.addEventListener('click', ()=>{
    const t=headings[+el.dataset.idx]; t.scrollIntoView({behavior:'smooth',block:'center'}); t.style.outline='2px solid var(--accent)'; setTimeout(()=> t.style.outline='',800);
  }));
}
function renderCards(store, switchDoc){
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
function renderBacklinks(store, switchDoc, createDoc){
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
function startSessionTimer(){
  sessionTimer=setInterval(()=>{ sessionSeconds++; const m=String(Math.floor(sessionSeconds/60)).padStart(2,'0'), s=String(sessionSeconds%60).padStart(2,'0'); const e=document.getElementById('stat-session-time'); if(e) e.textContent=`${m}:${s}`; },1000);
  document.getElementById('editor')?.addEventListener('input', ()=>{
    const ed=document.getElementById('editor'); sessionWords=Math.max(0, countWords(ed.innerText)-sessionStartWords);
  });
}


/* === src/js/ui/toolbar.js === */
function initToolbar(store, persistEditor){
  document.querySelectorAll('.tbtn[data-cmd]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const cmd=b.dataset.cmd;
      if(cmd==='new') window.__reignCreateDoc?.();
      if(cmd==='open') document.getElementById('file-picker').click();
      if(cmd==='save'){ persistEditor(); store.save(); toast('Saved ✓'); }
      if(cmd==='undo') document.execCommand('undo');
      if(cmd==='redo') document.execCommand('redo');
    });
  });
  document.querySelectorAll('.tbtn[data-fmt]').forEach(b=> b.addEventListener('click', ()=> fmt(b.dataset.fmt)));
  document.getElementById('style-select')?.addEventListener('change', e=>{
    const v=e.target.value;
    if(v==='pre') document.execCommand('formatBlock',false,'pre');
    else if(v==='blockquote') document.execCommand('formatBlock',false,'blockquote');
    else document.execCommand('formatBlock',false,v);
    document.getElementById('editor')?.dispatchEvent(new Event('input',{bubbles:true}));
  });
  document.getElementById('font-select')?.addEventListener('change', e=>{
    const ed=document.getElementById('editor'); if(ed) ed.style.fontFamily=e.target.value;
  });
  document.getElementById('size-select')?.addEventListener('change', e=>{
    const ed=document.getElementById('editor'); if(ed) ed.style.fontSize=e.target.value+'px';
  });
  document.getElementById('toggle-syntax')?.addEventListener('change', e=>{
    store.settings.syntax=e.target.checked; window.__reignApplySettings?.(); store.save();
  });
  document.querySelectorAll('.theme-dot').forEach(b=> b.addEventListener('click', ()=>{
    store.settings.theme=b.dataset.theme; window.__reignApplySettings?.(); store.save();
  }));
  document.getElementById('file-picker')?.addEventListener('change', e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      const text=reader.result, title=file.name.replace(/\.[^.]+$/,'');
      store.docs.push({ id:'doc-'+Date.now(), title, type:'manuscript', folder:'Imports', content:'<p>'+esc(text).replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')+'</p>', created:Date.now(), updated:Date.now() });
      store.activeId=store.docs[store.docs.length-1].id; store.save(); window.__reignRefresh?.(); toast('Imported '+title);
    };
    reader.readAsText(file);
  });
  document.getElementById('doc-title')?.addEventListener('change', e=>{
    const d=store.activeDoc(); if(!d) return; d.title=e.target.value.trim()||'Untitled';
    document.getElementById('ref-id').textContent='reign://'+slug(d.title);
    document.getElementById('doc-path').textContent='/ '+(d.folder||'').toLowerCase()+' / '+slug(d.title)+'.md';
    store.save(); window.__reignRenderFileTree?.();
  });
  document.getElementById('doc-title')?.addEventListener('input', ()=> document.getElementById('doc-dirty')?.classList.remove('hidden'));
  document.getElementById('opt-focus')?.addEventListener('change', e=>{ store.settings.focus=e.target.checked; window.__reignApplySettings?.(); store.save(); });
  document.getElementById('opt-typewriter')?.addEventListener('change', e=>{ store.settings.typewriter=e.target.checked; window.__reignApplySettings?.(); store.save(); });
  document.getElementById('opt-zen')?.addEventListener('change', e=>{ store.settings.zen=e.target.checked; window.__reignApplySettings?.(); store.save(); });
  document.getElementById('btn-copy-ref')?.addEventListener('click', ()=>{
    const t=document.getElementById('ref-id').textContent; navigator.clipboard.writeText(t).then(()=> toast('Copied '+t));
  });
  document.getElementById('btn-zoom-in')?.addEventListener('click', ()=>{ store.settings.zoom=Math.min(200, store.settings.zoom+10); window.__reignApplySettings?.(); store.save(); });
  document.getElementById('btn-zoom-out')?.addEventListener('click', ()=>{ store.settings.zoom=Math.max(60, store.settings.zoom-10); window.__reignApplySettings?.(); store.save(); });
  document.querySelectorAll('[data-export]').forEach(b=> b.addEventListener('click', ()=> doExport(store, b.dataset.export)));
  document.getElementById('goal-edit')?.addEventListener('click', ()=>{
    const v=prompt('Daily goal (words):', store.settings.goal); if(!v) return;
    store.settings.goal=parseInt(v)||500; store.save(); window.__reignRefresh?.();
  });
}
function doExport(store, kind){
  const d=store.activeDoc(); if(!d) return;
  const html=document.getElementById('editor')?.innerHTML||'';
  if(kind==='pdf'){ window.print(); return; }
  if(kind==='html'){
    const blob=new Blob([`<!doctype html><meta charset="utf-8"><title>${esc(d.title)}</title><style>body{max-width:720px;margin:40px auto;font-family:Georgia,serif;line-height:1.7;color:#1a1a1e;padding:0 20px}h1{font-size:2em}</style><h1>${esc(d.title)}</h1>${html}`],{type:'text/html'});
    downloadBlob(blob, slug(d.title)+'.html');
  }
  if(kind==='md'){
    const md=htmlToMarkdown(html);
    const blob=new Blob([`# ${d.title}\n\n`+md],{type:'text/markdown'}); downloadBlob(blob, slug(d.title)+'.md');
  }
  if(kind==='txt'){
    const txt=document.getElementById('editor')?.innerText||'';
    const blob=new Blob([txt],{type:'text/plain'}); downloadBlob(blob, slug(d.title)+'.txt');
  }
}


/* === src/js/ui/palette.js === */
function createPalette(store, { switchDoc, setView, doExport, showFind, toast, persistEditor }){
  const COMMANDS=()=>{
    const s=store.settings;
    return [
      {label:'New document', keys:'Ctrl+N', run:()=> window.__reignCreateDoc?.()},
      {label:'Save', keys:'Ctrl+S', run:()=>{ persistEditor(); store.save(); toast('Saved ✓');}},
      {label:'Toggle focus mode', run:()=>{ s.focus=!s.focus; window.__reignApplySettings?.(); store.save();}},
      {label:'Toggle typewriter', run:()=>{ s.typewriter=!s.typewriter; window.__reignApplySettings?.(); store.save();}},
      {label:'Toggle zen mode', run:()=>{ s.zen=!s.zen; window.__reignApplySettings?.(); store.save();}},
      {label:'Toggle syntax highlighting', run:()=>{ s.syntax=!s.syntax; window.__reignApplySettings?.(); store.save();}},
      {label:'View: Edit', keys:'Ctrl+1', run:()=>setView('edit')},
      {label:'View: Preview', keys:'Ctrl+2', run:()=>setView('preview')},
      {label:'View: Novel', keys:'Ctrl+3', run:()=>setView('novel')},
      {label:'View: Graph', keys:'Ctrl+4', run:()=>setView('graph')},
      {label:'Export as PDF', run:()=> doExport('pdf')},
      {label:'Export as HTML', run:()=> doExport('html')},
      {label:'Export as Markdown', run:()=> doExport('md')},
      {label:'Find & replace', keys:'Ctrl+F', run:()=> showFind()},
      {label:'Word count details', run:()=> document.querySelector('[data-tab="stats"]')?.click()},
    ];
  };
  function show(){
    const overlay=document.getElementById('palette-overlay'), input=document.getElementById('palette-input'), list=document.getElementById('palette-list');
    if(!overlay||!input||!list) return;
    overlay.classList.remove('hidden'); input.value=''; input.focus();
    let sel=0, filtered=[];
    const all=()=> [...COMMANDS(), ...store.docs.map(d=>({label:'Open: '+d.title, run:()=>switchDoc(d.id)}))];
    function render(){
      const q=input.value.toLowerCase();
      const src=all();
      filtered=q? src.filter(c=>c.label.toLowerCase().includes(q)) : src.slice(0,12);
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
  return { show };
}


/* === src/js/ui/find.js === */
function initFind(){
  let findMatches=[], findIdx=-1;
  function show(){ document.getElementById('find-bar')?.classList.remove('hidden'); document.getElementById('find-input')?.focus(); }
  function hide(){ document.getElementById('find-bar')?.classList.add('hidden'); }
  function doFind(dir){
    const q=document.getElementById('find-input')?.value||''; if(!q) return;
    const caseSens=document.getElementById('find-case')?.checked;
    const whole=document.getElementById('find-word')?.checked;
    const text=document.getElementById('editor')?.innerText||'';
    const escQ=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const pattern=whole?`\\b${escQ}\\b`:escQ;
    const re=new RegExp(pattern, caseSens?'g':'gi');
    findMatches=[...text.matchAll(re)];
    if(!findMatches.length) return toast('No matches');
    if(dir) findIdx=(findIdx+dir+findMatches.length)%findMatches.length; else findIdx=0;
    toast(`${findIdx+1} / ${findMatches.length}`);
    window.find(q, caseSens, false, true, whole, false, false);
  }
  function doReplaceOne(){
    const q=document.getElementById('find-input')?.value; const rep=document.getElementById('replace-input')?.value||'';
    if(!q) return;
    if(window.find(q, document.getElementById('find-case')?.checked, false, true, document.getElementById('find-word')?.checked, false, false)){
      document.execCommand('insertText',false,rep);
      document.getElementById('editor')?.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }
  function doReplaceAll(){
    const q=document.getElementById('find-input')?.value; const rep=document.getElementById('replace-input')?.value||'';
    if(!q) return;
    const ed=document.getElementById('editor'); if(!ed) return;
    const escQ=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const flags=document.getElementById('find-case')?.checked?'g':'gi';
    const pattern=document.getElementById('find-word')?.checked?`\\b${escQ}\\b`:escQ;
    ed.innerHTML=ed.innerHTML.replace(new RegExp(pattern, flags), rep);
    ed.dispatchEvent(new Event('input',{bubbles:true})); toast('Replaced all');
  }
  document.getElementById('btn-find-close')?.addEventListener('click', hide);
  document.getElementById('find-input')?.addEventListener('input', ()=>doFind());
  document.getElementById('btn-find-next')?.addEventListener('click', ()=> doFind(1));
  document.getElementById('btn-find-prev')?.addEventListener('click', ()=> doFind(-1));
  document.getElementById('btn-replace-one')?.addEventListener('click', doReplaceOne);
  document.getElementById('btn-replace-all')?.addEventListener('click', doReplaceAll);
  return { show, hide, doFind };
}


/* === src/js/ui/search.js === */
function initSearchPanel(store, switchDoc){
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


/* === src/js/main.js === */
const store = createStore();
store.load();
// hydrate from disk if Electron
store.hydrateFromDisk().then(()=>{ applySettings(); renderFileTree(store, refreshAll, persistEditor); loadDoc(store); refreshAll(); });

function applySettings(){
  document.body.dataset.theme = store.settings.theme;
  document.querySelectorAll('.theme-dot').forEach(b=>b.classList.toggle('active', b.dataset.theme===store.settings.theme));
  const ts=document.getElementById('toggle-syntax'); if(ts) ts.checked=store.settings.syntax;
  document.body.classList.toggle('syntax-on', store.settings.syntax);
  document.body.classList.toggle('focus-mode', store.settings.focus);
  document.body.classList.toggle('typewriter', store.settings.typewriter);
  document.body.classList.toggle('zen', store.settings.zen);
  const of=document.getElementById('opt-focus'); if(of) of.checked=store.settings.focus;
  const ot=document.getElementById('opt-typewriter'); if(ot) ot.checked=store.settings.typewriter;
  const oz=document.getElementById('opt-zen'); if(oz) oz.checked=store.settings.zen;
  const main=document.getElementById('main'); if(main) main.style.zoom=(store.settings.zoom||100)+'%';
  const z=document.getElementById('status-zoom'); if(z) z.textContent=(store.settings.zoom||100)+'%';
  const np=document.getElementById('novel-pages'); if(np){ np.dataset.width=store.settings.novelWidth||'narrow'; np.dataset.paged=String(store.settings.novelPaged??true); }
}
window.__reignApplySettings = applySettings;

function createDoc(templateKey){
  const { TEMPLATES } = { TEMPLATES: (awaitImportHack()) };
  // fallback inline to avoid async import complexity
  return _createDoc(templateKey);
}
function _createDoc(templateKey){
  // inline templates to avoid circular
  const MAP={
    character: { title:'New Character', type:'character', content:`<h1>Character Name</h1><p><b>Role:</b> —</p><blockquote>One-line essence.</blockquote><h2>Appearance</h2><p>…</p><h2>Backstory</h2><p>…</p><h2>Relationships</h2><ul><li>[[Another Character]] — description</li></ul>` },
    world: { title:'New Location', type:'world', content:`<h1>Place Name</h1><blockquote>A one-line evocation.</blockquote><h2>Geography</h2><p>…</p><h2>Culture</h2><p>…</p><h2>Connected</h2><p>[[Related Note]]</p>` },
    scene: { title:'New Scene', type:'scene', content:`<h1>Scene — Chapter —</h1><p><b>POV:</b> — &nbsp; <b>Goal:</b> — &nbsp; <b>Conflict:</b> — &nbsp; <b>Outcome:</b> —</p><hr><p>Write the scene…</p>` },
    chapter: { title:'Chapter —', type:'manuscript', content:`<h1>Chapter One</h1><p>The story begins…</p><p>Reference other notes with [[double brackets]].</p>` },
  };
  const t = templateKey ? MAP[templateKey] : null;
  const id='doc-'+Date.now();
  const doc={ id, title: t? t.title : 'Untitled Note', type: t? t.type : 'manuscript', folder: t? (t.type==='character'?'Characters': t.type==='world'?'World':'Manuscripts') : 'Manuscripts', content: t? t.content : '<p>Start writing… Type <code>[[</code> to link, <code>/</code> for commands.</p>', created:Date.now(), updated:Date.now(), words:0 };
  store.docs.push(doc); store.activeId=id; store.save(); renderFileTree(store, refreshAll, persistEditor); loadDoc(store); refreshAll();
  setTimeout(()=>{ const el=document.getElementById('doc-title'); if(el){ el.focus(); el.select(); } },50);
}
function awaitImportHack(){ return null; }
window.__reignCreateDoc = _createDoc;

let persistEditorRef = ()=>{};
function refreshAll(){ renderCards(store, switchDoc); updateStats(); updateGoal(store); renderOutline(); renderBacklinks(store, switchDoc, _createDoc); renderPreview(store); renderNovel(store); }
window.__reignRefresh = refreshAll;
window.__reignRenderFileTree = ()=> renderFileTree(store, refreshAll, persistEditorRef);
function switchDoc(id){
  if(persistEditorRef) persistEditorRef();
  store.activeId=id;
  loadDoc(store); refreshAll(); store.save(); renderFileTree(store, refreshAll, persistEditorRef);
  const plain=(store.activeDoc()?.content||'').replace(/<[^>]*>/g,' '); setSessionStart(countWords(plain));
}
function setView(v){
  document.body.dataset.view=v;
  document.querySelectorAll('.vs-btn').forEach(b=> b.classList.toggle('active', b.dataset.view===v));
  document.querySelectorAll('.view').forEach(el=> el.classList.toggle('active', el.id==='view-'+v));
  if(v==='graph') setTimeout(()=> initGraph(store, switchDoc),50);
  if(v==='preview') renderPreview(store);
  if(v==='novel') renderNovel(store);
}
function initViews(){
  document.querySelectorAll('.vs-btn').forEach(b=> b.addEventListener('click', ()=> setView(b.dataset.view)));
  document.getElementById('btn-sidebar-left')?.addEventListener('click', ()=> document.getElementById('sidebar-left')?.classList.toggle('collapsed'));
  document.getElementById('btn-sidebar-right')?.addEventListener('click', ()=> document.getElementById('sidebar-right')?.classList.toggle('collapsed'));
  document.addEventListener('keydown', e=>{
    if(e.ctrlKey||e.metaKey){
      if(['1','2','3','4'].includes(e.key)){ e.preventDefault(); setView(['edit','preview','novel','graph'][parseInt(e.key)-1]); }
    }
    if(e.key==='Escape' && store.settings.zen){ store.settings.zen=false; applySettings(); store.save(); }
  });
}
function initSideTabs(){
  document.querySelectorAll('#sidebar-left .sb-tab').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelectorAll('#sidebar-left .sb-tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('#sidebar-left .sb-panel').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelector(`#sidebar-left .sb-panel[data-panel="${b.dataset.tab}"]`)?.classList.add('active');
  }));
  document.querySelectorAll('#sidebar-right .sb-tab').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelectorAll('#sidebar-right .sb-tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('#sidebar-right .sb-panel').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelector(`#sidebar-right .sb-panel[data-panel="${b.dataset.tab}"]`)?.classList.add('active');
  }));
  document.getElementById('btn-new-file')?.addEventListener('click', ()=> _createDoc());
  document.getElementById('btn-new-folder')?.addEventListener('click', ()=>{
    const name=prompt('Folder name:'); if(!name) return;
    store.docs.push({ id:'doc-'+Date.now(), title:'Untitled', type:'manuscript', folder:name, content:'<p></p>', created:Date.now(), updated:Date.now(), words:0 });
    store.save(); renderFileTree(store, refreshAll, persistEditorRef); toast('Folder "'+name+'" created');
  });
  document.getElementById('btn-import')?.addEventListener('click', ()=> document.getElementById('file-picker')?.click());
  document.querySelectorAll('.template-btn').forEach(b=> b.addEventListener('click', ()=> _createDoc(b.dataset.template)));
  document.getElementById('btn-add-card')?.addEventListener('click', ()=> _createDoc('scene'));
}

function initPomodoro(){
  let left=25*60, running=false, timer=null;
  const btn=document.getElementById('btn-pomodoro'); if(!btn) return;
  function render(){ const m=String(Math.floor(left/60)).padStart(2,'0'), s=String(left%60).padStart(2,'0'); btn.textContent=`◷ ${m}:${s}`; }
  btn.addEventListener('click', ()=>{
    running=!running;
    if(running){
      timer=setInterval(()=>{ left--; render(); if(left<=0){ clearInterval(timer); running=false; left=25*60; render(); toast('Pomodoro done — take a break ☕'); try{ new Notification('Reign — Pomodoro done'); }catch{} } },1000);
      try{ Notification.requestPermission(); }catch{}
    } else clearInterval(timer);
  });
  render();
}

// boot
applySettings();
renderFileTree(store, refreshAll, ()=>{});
loadDoc(store); refreshAll();

// snapshots: periodic + streak + heatmap stub
setInterval(()=> pushSnapshot(store), 60000);
bumpStreak();
renderStreakbar();

function renderStreakbar(){
  const data=getStreak();
  let bar=document.getElementById('streak-bar');
  if(!bar){
    const goal=document.getElementById('daily-goal');
    if(!goal) return;
    bar=document.createElement('div'); bar.id='streak-bar';
    bar.style.cssText='margin-top:8px;display:flex;gap:3px;flex-wrap:wrap';
    goal.appendChild(bar);
  }
  bar.innerHTML=`<span style="font-size:10px;color:var(--text-faint);width:100%">Streak · ${data.streak||0} day${(data.streak||1)>1?'s':''} · 🔥</span>` + (data.history||[]).slice(-14).map(d=>`<span title="${d}" style="width:14px;height:14px;border-radius:3px;background:var(--accent);opacity:.85;display:inline-block"></span>`).join('');
}

// snapshots UI: add under Stats panel
(function injectSnapshots(){
  const stats=document.getElementById('stats-panel'); if(!stats) return;
  const wrap=document.createElement('div'); wrap.id='snapshots-wrap'; wrap.style.marginTop='10px';
  wrap.innerHTML=`<div class="sb-section-label">SNAPSHOTS</div><div id="snap-list" style="display:flex;flex-direction:column;gap:4px"></div><button class="mini-btn" id="btn-snapshot" style="margin-top:6px">＋ Snapshot now</button>`;
  stats.appendChild(wrap);
  const render=()=>{
    const list=document.getElementById('snap-list');
    const snaps=getSnapshots(store.activeId);
    if(!snaps.length){ list.innerHTML='<span class="hint-text">No snapshots — one is taken every minute while you write.</span>'; return; }
    list.innerHTML=snaps.slice(0,8).map((s,i)=>`<button class="mini-btn" data-snap="${i}" style="text-align:left">${new Date(s.at).toLocaleTimeString()} · ${s.title.slice(0,18)}</button>`).join('');
    list.querySelectorAll('[data-snap]').forEach(b=> b.addEventListener('click', ()=>{
      const s=snaps[+b.dataset.snap]; if(!s) return;
      if(!confirm('Restore snapshot from '+new Date(s.at).toLocaleString()+'?')) return;
      const doc=store.getDoc(s.id); if(doc){ doc.content=s.html; store.save(); loadDoc(store); refreshAll(); }
    }));
  };
  render();
  document.getElementById('btn-snapshot')?.addEventListener('click', ()=>{ pushSnapshot(store); render(); toast('Snapshot saved'); });
  // re-render on doc switch
  const origSwitch=switchDoc;
  switchDoc=function(id){ origSwitch(id); setTimeout(render,50); };
  window.__reignSwitchDoc=switchDoc;
})();

// menus
const wikilinkMenu = createWikilinkMenu(store);
const slashMenu = createSlashMenu();
const finder = initFind();
const palette = createPalette(store, { switchDoc, setView, doExport: (k)=> doExport(store,k), showFind: ()=> finder.show(), toast, persistEditor: ()=> persistEditorRef() });

const edApi = initEditor(store, refreshAll, {
  handleWikilinkInput: ()=> wikilinkMenu.handle(),
  handleSlashInput: ()=> slashMenu.handle(),
  hideWikilinkMenu: ()=> wikilinkMenu.hide(),
  hideSlashMenu: ()=> slashMenu.hide(),
  showPalette: ()=> palette.show(),
  showFind: ()=> finder.show(),
  createDoc: _createDoc, toast
});
persistEditorRef = edApi.persistEditor;

initToolbar(store, persistEditorRef);
initViews(); initSideTabs(); initSearchPanel(store, switchDoc); initPomodoro();
bindNovelControls(store, applySettings);
startSessionTimer();

document.getElementById('btn-command')?.addEventListener('click', ()=> palette.show());
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.key==='k'){ e.preventDefault(); palette.show(); }
  if((e.ctrlKey||e.metaKey) && e.key==='f'){ e.preventDefault(); finder.show(); }
  if((e.ctrlKey||e.metaKey) && e.key==='n'){ e.preventDefault(); _createDoc(); }
  if((e.ctrlKey||e.metaKey) && e.key==='s'){ e.preventDefault(); persistEditorRef(); store.save(); toast('Saved ✓'); }
});
document.addEventListener('mousedown', e=>{
  if(!e.target.closest('#wikilink-menu') && !e.target.closest('#editor')) wikilinkMenu.hide();
  if(!e.target.closest('#slash-menu')) slashMenu.hide();
});
document.addEventListener('keydown', e=>{
  wikilinkMenu.onKey(e);
});
document.getElementById('editor')?.addEventListener('keyup', updateLineCol);
setInterval(()=>{ const el=document.getElementById('stat-saved'); if(el) el.textContent='just now'; }, 30000);
window.addEventListener('beforeunload', ()=>{ persistEditorRef(); store.save(); });

// expose for debugging
window.__reignStore = store;
window.__reignSwitchDoc = switchDoc;
window.__reignSetView = setView;

