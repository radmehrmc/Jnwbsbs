const listEl = document.getElementById('binsList');
const contentEl = document.getElementById('contentArea');
const modal = document.getElementById('modal');
const createBtn = document.getElementById('createBtn');
const closeModal = document.getElementById('closeModal');
const publishBtn = document.getElementById('publish');

async function apiGetBins(){
  const res = await fetch('/api/bins');
  if(!res.ok) throw new Error('Failed to load');
  return res.json();
}

function makeCard(bin){
  const d = document.createElement('div');
  d.className = 'bin-card';
  d.innerHTML = `<div style="display:flex;justify-content:space-between;"><div style="font-weight:700">${escapeHtml(bin.title)}</div><div style="opacity:0.6;font-size:12px">${new Date(bin.createdAt).toLocaleString()}</div></div><div style="margin-top:8px;color:rgba(255,255,255,0.6);font-size:13px">${truncate(bin.content,120)}</div>`;
  d.onclick = () => {
    // navigate to /bin/{id}
    history.pushState({}, '', '/bin/' + bin.id);
    window.location.href = '/bin/' + bin.id;
  };
  return d;
}

function truncate(s,n){ if(!s) return ''; return s.length>n? s.slice(0,n)+'…': s; }
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function load(){
  listEl.innerHTML = 'Loading…';
  try {
    const bins = await apiGetBins();
    listEl.innerHTML = '';
    if(!bins || bins.length===0){ listEl.innerHTML = '<div style="padding:12px;color:rgba(255,255,255,0.6)">No bins yet</div>'; return;}
    bins.slice().reverse().forEach(bin => listEl.appendChild(makeCard(bin)));
  } catch (e){
    listEl.innerHTML = '<div style="padding:12px;color:#f88">Failed to load bins</div>';
    console.error(e);
  }
}

createBtn.onclick = () => { modal.setAttribute('aria-hidden','false'); };
closeModal && (closeModal.onclick = () => modal.setAttribute('aria-hidden','true'));
publishBtn && (publishBtn.onclick = async () => {
  const title = document.getElementById('binTitle').value.trim();
  const content = document.getElementById('binContent').value.trim();
  if(!title || !content) return alert('Title and content required');
  publishBtn.disabled = true;
  try {
    const res = await fetch('/api/bins', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, content }) });
    if(!res.ok) throw new Error('Publish failed');
    document.getElementById('binTitle').value=''; document.getElementById('binContent').value='';
    modal.setAttribute('aria-hidden','true');
    await load();
    // go to created bin
    const created = await res.json();
    window.location.href = '/bin/' + created.id;
  } catch (err) {
    alert('Publish failed: ' + err.message);
  } finally { publishBtn.disabled = false; }
});

load();
