import { esc, parseWikilinks } from '../core/utils.js';
export function renderPreview(store){
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
