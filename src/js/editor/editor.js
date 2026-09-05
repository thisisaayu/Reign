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
  store.activeFolder = d.folder || null;
}

export function renderFileTree(store, refreshAll, persistEditor){
  const el = document.getElementById('file-tree');
  if(!el) return;
  const grouped = {};
  store.docs.forEach(d=>{ (grouped[d.folder||'Unsorted'] ||= []).push(d); });
  const allFolders = store.allFolders ? store.allFolders() : Object.keys(grouped).sort();
  let html='';
  for(const folder of allFolders){
    const list = grouped[folder] || [];
    const isSelected = store.activeFolder === folder;
    const isEmpty = list.length === 0;
    html+=`<div class="tree-folder${isSelected?' is-selected':''}${isEmpty?' is-empty':''}" data-folder="${esc(folder)}" title="${isEmpty?'Empty — click to select':''}"><span class="tree-folder-name">${esc(folder)}</span><span class="tree-folder-count">${list.length || '·'}</span><span class="tree-folder-actions"><button class="tree-folder-add" data-folder-add="${esc(folder)}" title="New document in ${esc(folder)}">＋</button><button class="tree-folder-rename" data-folder-rename="${esc(folder)}" title="Rename folder">✎</button><button class="tree-folder-del" data-folder-del="${esc(folder)}" title="${isEmpty?'Delete empty folder':'Folder not empty'}">✕</button></span></div>`;
    if(isEmpty){
      html+=`<div class="tree-empty-hint" data-folder="${esc(folder)}">Empty — <button class="tree-empty-new" data-folder-add="${esc(folder)}">＋ New document</button></div>`;
    }
    for(const d of list){
      const icon = d.type==='character'?'👤': d.type==='world'?'🌍': d.type==='scene'?'🎬':'📄';
      html+=`<div class="tree-item ${d.id===store.activeId?'active':''}" data-id="${d.id}"><span class="tree-icon">${icon}</span><span class="tree-name">${esc(d.title)}</span><button class="tree-del" data-del="${d.id}" title="Delete">✕</button></div>`;
    }
  }
  el.innerHTML = html;
  // folder header click → select folder
  el.querySelectorAll('.tree-folder').forEach(row=>{
    row.addEventListener('click', e=>{
      if(e.target.closest('[data-folder-add],[data-folder-rename],[data-folder-del]')) return;
      store.activeFolder=row.dataset.folder;
      store.save();
      renderFileTree(store, refreshAll, persistEditor);
    });
  });
  el.querySelectorAll('[data-folder-add]').forEach(b=>{
    b.addEventListener('click', e=>{
      e.stopPropagation();
      const folder=b.dataset.folderAdd;
      store.activeFolder=folder;
      window.__reignCreateDocInFolder?.(folder);
    });
  });
  el.querySelectorAll('[data-folder-rename]').forEach(b=>{
    b.addEventListener('click', e=>{
      e.stopPropagation();
      const oldName=b.dataset.folderRename;
      const next=prompt('Rename folder:', oldName);
      if(next==null) return;
      const nn=next.trim();
      if(!nn || nn===oldName) return;
      if(store.allFolders().includes(nn)) return alert('A folder named "'+nn+'" already exists.');
      store.renameFolder(oldName, nn);
      store.save();
      renderFileTree(store, refreshAll, persistEditor);
      refreshAll();
    });
  });
  el.querySelectorAll('[data-folder-del]').forEach(b=>{
    b.addEventListener('click', e=>{
      e.stopPropagation();
      const name=b.dataset.folderDel;
      const hasDocs=(grouped[name]||[]).length>0;
      if(hasDocs) return alert('Cannot delete "'+name+'": folder is not empty. Move or delete its documents first.');
      if(!confirm('Delete empty folder "'+name+'"?')) return;
      store.deleteFolder(name);
      store.save();
      renderFileTree(store, refreshAll, persistEditor);
    });
  });
  el.querySelectorAll('.tree-item').forEach(row=>{
    row.addEventListener('click', e=>{
      if(e.target.dataset.del) return;
      if(persistEditor) persistEditor();
      store.activeId=row.dataset.id;
      const doc=store.getDoc(row.dataset.id);
      if(doc) store.activeFolder=doc.folder || null;
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
      const nextActive=store.activeDoc();
      store.activeFolder=nextActive ? (nextActive.folder||null) : (store.allFolders()[0]||null);
      store.save(); renderFileTree(store, refreshAll, persistEditor); loadDoc(store); refreshAll();
    });
  });
}
