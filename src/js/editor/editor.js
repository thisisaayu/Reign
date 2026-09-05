import { countWords, esc, parseWikilinks } from '../core/utils.js';
import { initGraph } from '../graph/graph.js';

export function initEditor(store, refreshAll, { handleWikilinkInput, handleSlashInput, hideWikilinkMenu, hideSlashMenu, showPalette, showFind, createDoc, toast }) {
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

export function fmt(action, getSelText=()=> window.getSelection().toString()||'code'){
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

export function loadDoc(store){
  const d=store.activeDoc(); if(!d) return;
  const slug = d.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  document.getElementById('doc-title').value = d.title;
  document.getElementById('doc-path').textContent = '/ '+(d.folder||'').toLowerCase()+' / '+slug+'.md';
  document.getElementById('ref-id').textContent = 'reign://'+slug;
  document.getElementById('editor').innerHTML = d.content;
}

export function renderFileTree(store, refreshAll, persistEditor){
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
