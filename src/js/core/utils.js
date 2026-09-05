export function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
export function slug(t){ return t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
export function countWords(t){ const w=t.trim().split(/\s+/).filter(Boolean); return t.trim()? w.length:0; }
export function parseWikilinks(html){
  const re=/\[\[([^\]]+)\]\]/g; const out=[]; let m; while(m=re.exec(html)) out.push(m[1].trim());
  return out;
}
export function debounce(fn, ms){ let id; return (...a)=>{ clearTimeout(id); id=setTimeout(()=>fn(...a), ms); }; }
export function htmlToMarkdown(html){
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
export function toast(msg){
  let t=document.getElementById('_toast');
  if(!t){ t=document.createElement('div'); t.id='_toast'; Object.assign(t.style,{position:'fixed',bottom:'36px',left:'50%',transform:'translateX(-50%)',background:'var(--surface-2)',color:'var(--text)',border:'1px solid var(--border-strong)',padding:'8px 16px',borderRadius:'99px',fontSize:'13px',zIndex:'999',boxShadow:'var(--shadow)'}); document.body.appendChild(t); }
  t.textContent=msg; t.style.display='block'; clearTimeout(t._timer); t._timer=setTimeout(()=> t.style.display='none',2000);
}
export function downloadBlob(blob, name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
