import { toast } from '../core/utils.js';
export function initFind(){
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
