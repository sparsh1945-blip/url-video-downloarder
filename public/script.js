const urlInput = document.getElementById('urlInput');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('list');
const emptyState = document.getElementById('emptyState');

const validExts = ['mp4', 'webm', 'mov', 'm4v', 'ogg'];

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

function updateEmptyState() {
  emptyState.style.display = list.children.length > 1 ? 'none' : 'block';
}

function addUrls(rawText) {
  const urls = rawText.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
  urls.forEach(url => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      addItem(url, url, 'error', 'Invalid link');
      return;
    }
    const ext = parsed.pathname.split('.').pop().toLowerCase();
    if (!validExts.includes(ext)) {
      addItem(url, parsed.pathname.split('/').pop() || url, 'error', 'Unsupported file type');
      return;
    }
    addItem(url, parsed.pathname.split('/').pop() || 'video.' + ext, 'queued', 'Starting...');
  });
  updateEmptyState();
}

function addItem(url, filename, state, label) {
  const item = document.createElement('div');
  item.className = 'item';
  item.innerHTML = `
    <div class="item-top">
      <span class="filename">${filename}</span>
      <button class="remove" aria-label="Remove">&times;</button>
    </div>
    <div class="bar-track"><div class="bar-fill"></div></div>
    <div class="item-bottom">
      <span class="status">${label}</span>
      <span class="filesize"></span>
    </div>
  `;
  list.appendChild(item);

  item.querySelector('.remove').addEventListener('click', () => {
    item.remove();
    updateEmptyState();
  });

  if (state === 'error') {
    item.querySelector('.status').classList.add('error');
    return;
  }

  downloadWithProgress(url, filename, item);
}

async function downloadWithProgress(url, filename, item) {
  const statusEl = item.querySelector('.status');
  const sizeEl = item.querySelector('.filesize');
  const barEl = item.querySelector('.bar-fill');

  try {
    const response = await fetch(url);
    if (!response.ok || !response.body) throw new Error('Bad response');

    const total = Number(response.headers.get('content-length')) || 0;
    if (total) sizeEl.textContent = formatBytes(total);

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;

      if (total) {
        const pct = Math.round((received / total) * 100);
        barEl.style.width = pct + '%';
        statusEl.textContent = pct + '%';
      } else {
        statusEl.textContent = formatBytes(received);
      }
    }

    const blob = new Blob(chunks);
    const blobUrl = URL.createObjectURL(blob);
    if (!total) sizeEl.textContent = formatBytes(blob.size);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);

    barEl.style.width = '100%';
    statusEl.textContent = 'Downloaded';
    statusEl.classList.add('done');
  } catch (err) {
    statusEl.textContent = 'Failed (blocked or unreachable)';
    statusEl.classList.add('error');
  }
}

addBtn.addEventListener('click', () => {
  if (!urlInput.value.trim()) return;
  addUrls(urlInput.value);
  urlInput.value = '';
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

document.body.addEventListener('dragover', e => e.preventDefault());
document.body.addEventListener('drop', async (e) => {
  e.preventDefault();
  if (e.dataTransfer.files && e.dataTransfer.files.length) {
    for (const file of e.dataTransfer.files) {
      const text = await file.text();
      addUrls(text);
    }
    return;
  }
  const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
  if (text) addUrls(text);
});

updateEmptyState();
async function downloadWithBackend(url) {

    const response = await fetch(
        "http://localhost:8080/download",
        {
            method: "POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                url:url
            })
        }
    );

    const result = await response.text();

    console.log(result);
}