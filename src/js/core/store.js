/* store.js — persistence + doc CRUD (browser + Electron) */
export const LS_DOCS = 'reign-docs-v2';
export const LS_SETTINGS = 'reign-settings-v2';

export const TEMPLATES = {
  character: { title:'New Character', type:'character', content:`<h1>Character Name</h1><p><b>Role:</b> Protagonist / Antagonist / Supporting</p><p><b>Age:</b> — &nbsp; <b>Occupation:</b> —</p><blockquote>One-line essence of who they are.</blockquote><h2>Appearance</h2><p>Describe them…</p><h2>Backstory</h2><p>Where they came from…</p><h2>Arc</h2><p>Where they're going…</p><h2>Relationships</h2><ul><li>[[Another Character]] — description</li></ul>` },
  world: { title:'New Location', type:'world', content:`<h1>Place Name</h1><blockquote>A one-line evocation.</blockquote><h2>Geography</h2><p>…</p><h2>Culture</h2><p>…</p><h2>History</h2><p>…</p><h2>Connected</h2><p>[[Related Note]]</p>` },
  scene: { title:'New Scene', type:'scene', content:`<h1>Scene — Chapter —</h1><p><b>POV:</b> — &nbsp; <b>Goal:</b> — &nbsp; <b>Conflict:</b> — &nbsp; <b>Outcome:</b> —</p><hr><p>Write the scene…</p><p><em>Links: [[Chapter 1]] · [[Character Name]]</em></p>` },
  chapter: { title:'Chapter —', type:'manuscript', content:`<h1>Chapter One</h1><p>The story begins…</p><p>Reference other notes with [[double brackets]] and embed them with ![[Note Title]].</p>` },
};

export const DEFAULT_DOCS = [
  { id:'welcome', title:'Welcome to Reign', type:'manuscript', folder:'Manuscripts', content:`<h1>Welcome to Reign ◈</h1><p><em>A writing studio for people who write books.</em></p><p><b>Reign</b> blends the precision of <b>LibreOffice</b> — rulers, styles, tables, full formatting — with the connected thinking of <b>Obsidian</b>: every note can reference every other note.</p><h2>Try it</h2><ul><li>Type <code>[[</code> to link another note — try <span class="wikilink">[[The Hollow Crown]]</span></li><li>Type <code>/</code> for the slash menu (headings, quotes, tables…)</li><li>Press <code>Ctrl+K</code> for the command palette</li><li>Switch to <b>Graph</b> to see how your notes connect</li><li>Switch to <b>Novel</b> to read your manuscript as a typeset book</li></ul><blockquote>"The page is a mirror. The graph is a map. The novel is the destination."</blockquote><h2>Reference anything</h2><p>Every document has a <code>reign://</code> URI (see the Inspector → Reference ID). Other apps can open it. Inside Reign, use <code>![[Note Title]]</code> to transclude a note inline.</p><p>Tags like <span class="tag">#fantasy</span> <span class="tag">#draft</span> are searchable and clickable.</p><h2>Four themes</h2><p>Dark · AMOLED · Light · Bloom (pink-cyan). Toggle them in the toolbar — your choice is remembered.</p>`, created:Date.now(), updated:Date.now() },
  { id:'hollow', title:'The Hollow Crown', type:'manuscript', folder:'Manuscripts', content:`<h1>The Hollow Crown</h1><p><em>Chapter One — Ashes</em></p><p>The city of Karst had been built inside the ribcage of a dead god. Its avenues followed the curve of bone, its towers rose where marrow had once flowed. And now, on the night the crown went missing, rain fell through the open chest like tears.</p><p>Mira pressed her back against the basilica wall. In her palm, the thing they were all killing for — a circlet of black glass, warm to the touch, humming faintly. It had no business being beautiful.</p><blockquote>She thought of [[Elian Voss]] and the promise she'd made. She thought of [[Karst — The Bone City]] and whether any of it deserved saving.</blockquote><p>Somewhere above, a bell tolled. Not the hour — an alarm.</p><h2>Notes</h2><p>Links: [[Elian Voss]] · [[Karst — The Bone City]] · [[The Obsidian Sigil]]</p><p>Tags: <span class="tag">#draft</span> <span class="tag">#chapter1</span></p>`, created:Date.now()-100000, updated:Date.now()-50000 },
  { id:'elian', title:'Elian Voss', type:'character', folder:'Characters', content:`<h1>Elian Voss</h1><p><b>Role:</b> Antagonist &nbsp; <b>Age:</b> 41 &nbsp; <b>House:</b> Voss</p><blockquote>"A man who mistakes control for love."</blockquote><h2>Appearance</h2><p>Tall, hollow-cheeked, silver at the temples. Wears the obsidian sigil openly — which in Karst is either piety or provocation.</p><h2>Drive</h2><p>Believes the god inside Karst is not dead, merely sleeping. Wants to wake it. Linked to [[The Obsidian Sigil]] and [[Karst — The Bone City]].</p>`, created:Date.now()-200000, updated:Date.now()-100000 },
  { id:'karst', title:'Karst — The Bone City', type:'world', folder:'World', content:`<h1>Karst — The Bone City</h1><blockquote>A city inside a god. Or a god inside a city.</blockquote><h2>Districts</h2><ul><li><b>The Sternum</b> — administrative heart</li><li><b>The Ribs</b> — residential arcs</li><li><b>The Marrow Deep</b> — forbidden</li></ul><p>Home to [[Elian Voss]]. Central artifact: [[The Obsidian Sigil]]. Featured in [[The Hollow Crown]].</p>`, created:Date.now()-300000, updated:Date.now()-80000 },
  { id:'sigil', title:'The Obsidian Sigil', type:'world', folder:'World', content:`<h1>The Obsidian Sigil</h1><p>A black-glass circlet, warm to the touch. Said to be a fragment of the dead god's crown.</p><p>Held at various times by [[Elian Voss]]. Sought in [[The Hollow Crown]]. Origin: [[Karst — The Bone City]].</p>`, created:Date.now()-400000, updated:Date.now()-60000 },
];

export const DEFAULT_SETTINGS = { theme:'dark', syntax:true, focus:false, typewriter:false, zen:false, goal:500, zoom:100, novelWidth:'narrow', novelPaged:true };

export function createStore() {
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
