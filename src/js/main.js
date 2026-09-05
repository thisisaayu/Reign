import { createStore } from './core/store.js';
import { countWords, toast } from './core/utils.js';
import { pushSnapshot, getSnapshots, bumpStreak, getStreak } from './core/snapshots.js';
import { initEditor, loadDoc, renderFileTree } from './editor/editor.js';
import { createWikilinkMenu, createSlashMenu } from './editor/menus.js';
import { renderPreview } from './views/preview.js';
import { renderNovel, bindNovelControls } from './views/novel.js';
import { initGraph } from './graph/graph.js';
import { updateStats, updateGoal, updateLineCol, renderOutline, renderCards, renderBacklinks, setSessionStart, startSessionTimer } from './ui/stats.js';
import { initToolbar, doExport } from './ui/toolbar.js';
import { createPalette } from './ui/palette.js';
import { initFind } from './ui/find.js';
import { initSearchPanel } from './ui/search.js';

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
