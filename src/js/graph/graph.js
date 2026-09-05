import { parseWikilinks } from '../core/utils.js';

/* Force-directed graph canvas (Obsidian-style) — upgraded:
   - filtered modes: all / local (neighbors of active doc)
   - search within graph
   - hover card with snippet + open
   - export PNG
*/
export function initGraph(store, switchDoc) {
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
