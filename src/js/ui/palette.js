import { esc } from '../core/utils.js';
export function createPalette(store, { switchDoc, setView, doExport, showFind, toast, persistEditor }){
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
