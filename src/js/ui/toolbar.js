import { esc, toast, htmlToMarkdown, downloadBlob, slug } from '../core/utils.js';
import { fmt } from '../editor/editor.js';

export function initToolbar(store, persistEditor){
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

export function doExport(store, kind){
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
