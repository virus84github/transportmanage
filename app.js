*/

window.state = {
  activeTab: 'prenotazione',
  selectedDate: getTodayDateString(),
  bookingType: 'ANDATA',
  variables: {
    personale: [],
    mezzi: [],
    fasce_orarie: [],
    github_config: { owner: "", repo: "transportmanage", token: "", branch: "main" }
  },
  bookings: [],
  isManageAuthenticated: false,
  activeVariableTab: 'personale',
  reportFilterDate: getTodayDateString(),
  githubSha: { bookings: null, variables: null }
};

function getDetectedOwner() {
  const host = window.location.hostname;
  if (host.endsWith('.github.io')) return host.split('.')[0];
  return "";
}

const GITHUB_CONFIG = {
  get owner() {
    return (window.state.variables && window.state.variables.github_config && window.state.variables.github_config.owner)
      || localStorage.getItem("TM_GH_OWNER") || getDetectedOwner();
  },
  set owner(val) {
    if (!window.state.variables.github_config) window.state.variables.github_config = {};
    window.state.variables.github_config.owner = val.trim();
    localStorage.setItem("TM_GH_OWNER", val.trim());
  },
  get repo() {
    return (window.state.variables && window.state.variables.github_config && window.state.variables.github_config.repo)
      || localStorage.getItem("TM_GH_REPO") || "transportmanage";
  },
  set repo(val) {
    if (!window.state.variables.github_config) window.state.variables.github_config = {};
    window.state.variables.github_config.repo = val.trim();
    localStorage.setItem("TM_GH_REPO", val.trim());
  },
  get token() {
    return (window.state.variables && window.state.variables.github_config && window.state.variables.github_config.token)
      || localStorage.getItem("TM_GH_TOKEN") || "";
  },
  set token(val) {
    if (!window.state.variables.github_config) window.state.variables.github_config = {};
    window.state.variables.github_config.token = val.trim();
    localStorage.setItem("TM_GH_TOKEN", val.trim());
  },
  get branch() {
    return (window.state.variables && window.state.variables.github_config && window.state.variables.github_config.branch)
      || localStorage.getItem("TM_GH_BRANCH") || "main";
  },
  set branch(val) {
    if (!window.state.variables.github_config) window.state.variables.github_config = {};
    window.state.variables.github_config.branch = val.trim();
    localStorage.setItem("TM_GH_BRANCH", val.trim());
  }
};

const PALETTE = [
  { border: 'border-l-emerald-400', tag: 'text-emerald-400' },
  { border: 'border-l-blue-400', tag: 'text-blue-400' },
  { border: 'border-l-amber-400', tag: 'text-amber-400' },
  { border: 'border-l-purple-400', tag: 'text-purple-400' },
  { border: 'border-l-cyan-400', tag: 'text-cyan-400' },
  { border: 'border-l-rose-400', tag: 'text-rose-400' },
  { border: 'border-l-indigo-400', tag: 'text-indigo-400' },
  { border: 'border-l-teal-400', tag: 'text-teal-400' }
];

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "--/--/----";
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function triggerLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    try { window.lucide.createIcons(); } catch (e) {}
  }
}

function updateSyncBadge(text, colorClass) {
  const badge = document.getElementById("syncStatusBadge");
  if (badge) {
    badge.innerText = text;
    badge.className = `text-[10px] tracking-wide font-mono uppercase ${colorClass}`;
  }
}

function utf8ToBase64(str) { return window.btoa(unescape(encodeURIComponent(str))); }
function base64ToUtf8(str) { return decodeURIComponent(escape(window.atob(str))); }

async function getFileSha(owner, repo, filename, token, branch) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=${branch}&_t=${Date.now()}`;
    const headers = { "Accept": "application/vnd.github.v3+json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.sha;
    }
  } catch (e) {}
  return null;
}

async function fetchFileFromGitHub(filename) {
  const owner = GITHUB_CONFIG.owner;
  const repo = GITHUB_CONFIG.repo;
  const token = GITHUB_CONFIG.token;
  const branch = GITHUB_CONFIG.branch;

  if (!owner) throw new Error("Owner GitHub non configurato");

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=${branch}&_t=${Date.now()}`;
  const headers = { "Accept": "application/vnd.github.v3+json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const data = await res.json();
  const fileKey = filename.replace('.json', '');
  window.state.githubSha[fileKey] = data.sha;
  return JSON.parse(base64ToUtf8(data.content.replace(/\n/g, '')));
}

async function saveFileToGitHub(filename, jsonData, commitMessage) {
  const owner = GITHUB_CONFIG.owner;
  const repo = GITHUB_CONFIG.repo;
  const token = GITHUB_CONFIG.token;
  const branch = GITHUB_CONFIG.branch;

  if (!owner || !token) throw new Error("Credenziali GitHub mancanti in variables.json");

  const fileKey = filename.replace('.json', '');
  let sha = await getFileSha(owner, repo, filename, token, branch) || window.state.githubSha[fileKey];

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
  const base64Content = utf8ToBase64(JSON.stringify(jsonData, null, 2));

  const bodyPayload = {
    message: commitMessage || `Update ${filename}`,
    content: base64Content,
    branch: branch
  };
  if (sha) bodyPayload.sha = sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  const resData = await res.json();
  if (resData.content && resData.content.sha) {
    window.state.githubSha[fileKey] = resData.content.sha;
  }
  return true;
}

// BOOTSTRAP ALL'AVVIO
async function loadVariablesAndSync() {
  updateSyncBadge("Caricamento configurazione...", "text-blue-400");

  const baseUrl = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  const targetUrl = `${window.location.origin}${baseUrl}variables.json?_nocache=${Date.now()}`;
  let loadedFromVariables = false;

  try {
    const res = await fetch(targetUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        window.state.variables = data;
        loadedFromVariables = true;
        if (data.github_config && data.github_config.token) {
          if (data.github_config.owner) localStorage.setItem("TM_GH_OWNER", data.github_config.owner.trim());
          if (data.github_config.repo) localStorage.setItem("TM_GH_REPO", data.github_config.repo.trim());
          if (data.github_config.token) localStorage.setItem("TM_GH_TOKEN", data.github_config.token.trim());
          if (data.github_config.branch) localStorage.setItem("TM_GH_BRANCH", data.github_config.branch.trim());
        }
      }
    }
  } catch (err) {
    console.warn("Caricamento variables.json locale:", err);
  }

  if (!loadedFromVariables || !window.state.variables.personale || window.state.variables.personale.length === 0) {
    const savedOwner = localStorage.getItem("TM_GH_OWNER");
    const savedToken = localStorage.getItem("TM_GH_TOKEN");
    if (savedOwner && savedToken && (!window.state.variables.github_config || !window.state.variables.github_config.token)) {
      if (!window.state.variables.github_config) window.state.variables.github_config = {};
      window.state.variables.github_config.owner = savedOwner;
      window.state.variables.github_config.repo = localStorage.getItem("TM_GH_REPO") || "transportmanage";
      window.state.variables.github_config.token = savedToken;
      window.state.variables.github_config.branch = localStorage.getItem("TM_GH_BRANCH") || "main";
    }
  }

  if (Array.isArray(window.state.variables.fasce_orarie)) {
    window.state.variables.fasce_orarie.sort((a, b) => a.localeCompare(b));
  }

  renderAllViews();

  const token = GITHUB_CONFIG.token;
  const owner = GITHUB_CONFIG.owner;

  if (!token || !owner) {
    updateSyncBadge("Configura Token in variables.json", "text-amber-400");
    return;
  }

  updateSyncBadge("Sync GitHub Cloud...", "text-blue-400");

  try {
    const bookingsData = await fetchFileFromGitHub("bookings.json");
    if (Array.isArray(bookingsData)) {
      window.state.bookings = bookingsData;
      renderQuickRecent();
      renderReportList();
    }
  } catch (err) {}

  try {
    const remoteVars = await fetchFileFromGitHub("variables.json");
    if (remoteVars && Array.isArray(remoteVars.personale)) {
      window.state.variables = remoteVars;
      if (Array.isArray(window.state.variables.fasce_orarie)) {
        window.state.variables.fasce_orarie.sort((a, b) => a.localeCompare(b));
      }
      renderAllViews();
    }
  } catch (err) {}

  updateSyncBadge("Sync Attivo (GitHub)", "text-emerald-400");
}

async function pushBookingsToGitHub() {
  if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.token) return;
  try {
    updateSyncBadge("Invio corsa...", "text-amber-400");
    await saveFileToGitHub("bookings.json", window.state.bookings, `Nuova corsa: ${window.state.selectedDate}`);
    updateSyncBadge("Sync Attivo (GitHub)", "text-emerald-400");
  } catch (err) {
    console.error("Errore push corse:", err);
    updateSyncBadge("Errore Sync", "text-rose-400");
  }
}

async function pushVariablesToGitHub() {
  if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.token) return;
  try {
    updateSyncBadge("Salvataggio su GitHub...", "text-amber-400");
    await saveFileToGitHub("variables.json", window.state.variables, "Aggiornamento flotta e orari");
    updateSyncBadge("Sync Attivo (GitHub)", "text-emerald-400");
  } catch (err) {
    console.error("Errore push variabili:", err);
    updateSyncBadge("Errore Sync", "text-rose-400");
    throw err;
  }
}

async function testWorkerConnection() {
  const ownerInput = document.getElementById("adminGhOwner");
  const repoInput = document.getElementById("adminGhRepo");
  const tokenInput = document.getElementById("adminGhToken");

  const owner = (ownerInput ? ownerInput.value.trim() : "") || GITHUB_CONFIG.owner;
  const repo = (repoInput ? repoInput.value.trim() : "") || GITHUB_CONFIG.repo || "transportmanage";
  const token = (tokenInput ? tokenInput.value.trim() : "") || GITHUB_CONFIG.token;

  if (!owner || !token) {
    alert("⚠️ Inserisci Username e Token PAT prima del test.");
    return;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}?_t=${Date.now()}`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github.v3+json" }
    });
    if (res.ok) {
      const data = await res.json();
      alert(`✅ Connessione Riuscita!\nRepository: ${data.full_name}\nPermessi verificati.`);
    } else {
      alert(`❌ Errore HTTP ${res.status}: Token o repository errati.`);
    }
  } catch (err) {
    alert("Errore rete: " + err.message);
  }
}

async function saveAdminGitHubConfig(e) {
  if (e && e.preventDefault) e.preventDefault();
  const owner = document.getElementById("adminGhOwner")?.value.trim() || "";
  const repo = document.getElementById("adminGhRepo")?.value.trim() || "transportmanage";
  const token = document.getElementById("adminGhToken")?.value.trim() || "";
  const branch = document.getElementById("adminGhBranch")?.value.trim() || "main";

  if (!owner || !token) {
    alert("Inserisci Username e Token PAT.");
    return;
  }

  GITHUB_CONFIG.owner = owner;
  GITHUB_CONFIG.repo = repo;
  GITHUB_CONFIG.token = token;
  GITHUB_CONFIG.branch = branch;

  if (!window.state.variables.github_config) window.state.variables.github_config = {};
  window.state.variables.github_config.owner = owner;
  window.state.variables.github_config.repo = repo;
  window.state.variables.github_config.token = token;
  window.state.variables.github_config.branch = branch;

  try {
    await pushVariablesToGitHub();
    alert("🎉 Configurazione salvata su variables.json nel repository GitHub!");
  } catch (err) {
    alert("Errore salvataggio: " + err.message);
  }
  loadVariablesAndSync();
}

function navigateToPage(pageId) {
  window.state.activeTab = pageId;
  const p1 = document.getElementById("page-prenotazione");
  const p2 = document.getElementById("page-report");
  const p3 = document.getElementById("page-manage");
  if (p1) p1.classList.toggle("hidden", pageId !== 'prenotazione');
  if (p2) p2.classList.toggle("hidden", pageId !== 'report');
  if (p3) p3.classList.toggle("hidden", pageId !== 'manage');

  const titleMap = { prenotazione: "Prenotazione", report: "Report", manage: "Manage (Admin)" };
  const h = document.getElementById("headerPageTitle");
  if (h) h.innerText = titleMap[pageId] || "App";

  ['prenotazione', 'report', 'manage'].forEach(tab => {
    const btn = document.getElementById(`navBtn${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (btn) {
      btn.className = (tab === pageId)
        ? "py-1.5 flex flex-col items-center gap-1 text-blue-400 transition cursor-pointer"
        : "py-1.5 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition cursor-pointer";
    }
  });

  if (pageId === 'report') renderReportList();
  if (pageId === 'manage') checkManageAuthState();
  triggerLucideIcons();
}

function selectDateShortcut(type) {
  const d = new Date();
  if (type === 'domani') d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  window.state.selectedDate = `${y}-${m}-${day}`;

  const display = document.getElementById("displaySelectedDate");
  if (display) display.innerText = formatDateDisplay(window.state.selectedDate);

  const btnOggi = document.getElementById("btnDateOggi");
  const btnDomani = document.getElementById("btnDateDomani");
  if (btnOggi && btnDomani) {
    if (type === 'oggi') {
      btnOggi.className = "py-2 px-1 text-center rounded-xl border text-xs font-semibold transition bg-blue-600 text-white border-blue-500 shadow-sm";
      btnDomani.className = "py-2 px-1 text-center rounded-xl border text-xs font-medium transition bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700";
    } else {
      btnDomani.className = "py-2 px-1 text-center rounded-xl border text-xs font-semibold transition bg-blue-600 text-white border-blue-500 shadow-sm";
      btnOggi.className = "py-2 px-1 text-center rounded-xl border text-xs font-medium transition bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700";
    }
  }
}

function onCustomDateChange(val) {
  if (!val) return;
  window.state.selectedDate = val;
  const display = document.getElementById("displaySelectedDate");
  if (display) display.innerText = formatDateDisplay(val);
}

function setBookingType(type) {
  window.state.bookingType = type;
  const b1 = document.getElementById("btnTypeAndata");
  const b2 = document.getElementById("btnTypeRitorno");
  if (b1 && b2) {
    if (type === 'ANDATA') {
      b1.className = "py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20";
      b2.className = "py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600";
    } else {
      b2.className = "py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20";
      b1.className = "py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600";
    }
  }
  triggerLucideIcons();
}

function populateDropdowns() {
  const selP = document.getElementById("selectPersonale");
  const selM = document.getElementById("selectMezzo");
  const selO = document.getElementById("selectOrario");

  const personaleList = window.state.variables.personale || [];
  const mezziList = window.state.variables.mezzi || [];
  const fasceList = [...(window.state.variables.fasce_orarie || [])].sort((a, b) => a.localeCompare(b));

  if (selP) {
    const cur = selP.value;
    selP.innerHTML = '<option value="">Seleziona operatore...</option>' +
      personaleList.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
    if (cur) selP.value = cur;
  }
  if (selM) {
    const cur = selM.value;
    selM.innerHTML = '<option value="">Assegna mezzo...</option>' +
      mezziList.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
    if (cur) selM.value = cur;
  }
  if (selO) {
    const cur = selO.value;
    selO.innerHTML = '<option value="">Fascia oraria...</option>' +
      fasceList.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
    if (cur) selO.value = cur;
  }
}

async function handleBookingSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const selP = document.getElementById("selectPersonale");
  const selM = document.getElementById("selectMezzo");
  const selO = document.getElementById("selectOrario");

  const personale = selP ? selP.value.trim() : "";
  const mezzo = selM ? selM.value.trim() : "";
  const orario = selO ? selO.value.trim() : "";

  if (!personale || !mezzo || !orario) {
    alert("Compila tutti i campi obbligatori.");
    return;
  }

  const newBooking = {
    id: "bk_" + Date.now(),
    date: window.state.selectedDate,
    personale,
    mezzo,
    orario,
    type: window.state.bookingType,
    createdAt: new Date().toISOString()
  };

  window.state.bookings.unshift(newBooking);
  if (selP) selP.value = "";

  const submitBtn = document.getElementById("btnSubmitBooking");
  if (submitBtn) {
    const orig = submitBtn.innerHTML;
    submitBtn.innerHTML = `CORSA REGISTRATA!`;
    submitBtn.classList.replace("bg-blue-600", "bg-emerald-600");
    setTimeout(() => {
      submitBtn.innerHTML = orig;
      submitBtn.classList.replace("bg-emerald-600", "bg-blue-600");
    }, 1500);
  }

  renderQuickRecent();
  renderReportList();
  await pushBookingsToGitHub();
}

function renderQuickRecent() {
  const container = document.getElementById("quickRecentBookings");
  if (!container) return;
  const recent = window.state.bookings.slice(0, 4);
  if (recent.length === 0) {
    container.innerHTML = `<div class="p-3 text-center text-xs text-slate-500 bg-slate-900/60 rounded-xl border border-slate-800">Nessuna corsa registrata</div>`;
    return;
  }

  container.innerHTML = recent.map(b => `
    <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between shadow-sm">
      <div class="space-y-0.5">
        <div class="flex items-center gap-2">
          <span class="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${b.type === 'ANDATA' ? 'bg-blue-900/60 text-blue-300' : 'bg-indigo-900/60 text-indigo-300'}">${b.type}</span>
          <span class="text-xs font-semibold text-slate-100">${escapeHtml(b.personale)}</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(b.mezzo)}</div>
      </div>
      <div class="text-right">
        <span class="text-xs font-mono font-bold text-white">${b.orario}</span>
        <div class="text-[10px] text-emerald-400 font-mono">${formatDateDisplay(b.date)}</div>
      </div>
    </div>
  `).join("");
  triggerLucideIcons();
}

function getGroupingColor(orario, tipo, mezzo) {
  const key = `${(orario||'').trim()}_${(tipo||'').trim()}_${(mezzo||'').trim()}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

function shiftReportDate(deltaDays) {
  const cur = new Date(window.state.reportFilterDate);
  cur.setDate(cur.getDate() + deltaDays);
  const y = cur.getFullYear();
  const m = String(cur.getMonth() + 1).padStart(2, '0');
  const d = String(cur.getDate()).padStart(2, '0');
  window.state.reportFilterDate = `${y}-${m}-${d}`;

  const reportDate = document.getElementById("reportCurrentDateFormatted");
  if (reportDate) reportDate.innerText = formatDateDisplay(window.state.reportFilterDate);
  renderReportList();
}

function setReportFilterDate(val) {
  if (!val) return;
  window.state.reportFilterDate = val;
  const reportDate = document.getElementById("reportCurrentDateFormatted");
  if (reportDate) reportDate.innerText = formatDateDisplay(val);
  renderReportList();
}

function renderReportList() {
  const container = document.getElementById("reportListRows");
  if (!container) return;

  const filtered = window.state.bookings.filter(b => b.date === window.state.reportFilterDate);
  filtered.sort((a, b) => (a.orario || '').localeCompare(b.orario || ''));

  const totalBadge = document.getElementById("reportTotalBadge");
  if (totalBadge) totalBadge.innerText = `${filtered.length} corse registrate`;

  if (filtered.length === 0) {
    container.innerHTML = `<div class="py-8 text-center text-xs text-slate-500">Nessuna corsa per il ${formatDateDisplay(window.state.reportFilterDate)}</div>`;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const style = getGroupingColor(b.orario, b.type, b.mezzo);
    const isAndata = b.type === 'ANDATA';
    return `
      <div class="grid grid-cols-12 items-center px-3 py-3 text-xs border-l-4 ${style.border} hover:bg-slate-800/40 transition">
        <div class="col-span-4 font-semibold text-slate-100 truncate pr-1">${escapeHtml(b.personale)}</div>
        <div class="col-span-3 text-center font-mono font-bold text-slate-200">${b.orario}</div>
        <div class="col-span-2 text-center">
          <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${isAndata ? 'bg-blue-900/60 text-blue-300' : 'bg-indigo-900/60 text-indigo-300'}">
            ${isAndata ? 'AND' : 'RIT'}
          </span>
        </div>
        <div class="col-span-3 text-right font-medium text-[11px] truncate ${style.tag}">${escapeHtml(b.mezzo)}</div>
      </div>
    `;
  }).join("");
}

function exportReportToCsv() {
  const filtered = window.state.bookings.filter(b => b.date === window.state.reportFilterDate);
  if (filtered.length === 0) {
    alert("Nessuna corsa da esportare.");
    return;
  }
  let csv = "DATA,PERSONALE,ORARIO,TIPO,MEZZO\n";
  filtered.forEach(b => {
    csv += `"${b.date}","${(b.personale||'').replace(/"/g, '""')}","${b.orario}","${b.type}","${(b.mezzo||'').replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_corse_${window.state.reportFilterDate}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function handleManageAuth(e) {
  if (e && e.preventDefault) e.preventDefault();
  const pwd = document.getElementById("managePasswordInput")?.value;
  if (pwd === "strongroom") {
    window.state.isManageAuthenticated = true;
    sessionStorage.setItem("manage_auth", "true");
    checkManageAuthState();
  } else {
    alert("Password errata (strongroom).");
  }
}

function lockManageArea() {
  window.state.isManageAuthenticated = false;
  sessionStorage.removeItem("manage_auth");
  checkManageAuthState();
}

function checkManageAuthState() {
  if (sessionStorage.getItem("manage_auth") === "true") window.state.isManageAuthenticated = true;
  const gate = document.getElementById("manageAuthGate");
  const dash = document.getElementById("manageDashboard");
  if (gate && dash) {
    if (window.state.isManageAuthenticated) {
      gate.classList.add("hidden");
      dash.classList.remove("hidden");
      populateAdminConfigFields();
      renderVariableManagement();
    } else {
      gate.classList.remove("hidden");
      dash.classList.add("hidden");
    }
  }
  triggerLucideIcons();
}

function populateAdminConfigFields() {
  const o = document.getElementById("adminGhOwner");
  const r = document.getElementById("adminGhRepo");
  const t = document.getElementById("adminGhToken");
  const b = document.getElementById("adminGhBranch");
  if (o) o.value = GITHUB_CONFIG.owner;
  if (r) r.value = GITHUB_CONFIG.repo;
  if (t) t.value = GITHUB_CONFIG.token;
  if (b) b.value = GITHUB_CONFIG.branch;
}

function switchVariableTab(tabKey) {
  window.state.activeVariableTab = tabKey;
  ['personale', 'mezzi', 'fasce'].forEach(t => {
    const btn = document.getElementById(`tabVar${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.className = (t === tabKey) ? "py-2 text-[11px] font-semibold rounded-lg bg-blue-600 text-white" : "py-2 text-[11px] font-semibold rounded-lg text-slate-400";
  });
  renderVariableManagement();
}

function renderVariableManagement() {
  const container = document.getElementById("variableItemsList");
  if (!container) return;

  const currentList = window.state.activeVariableTab === 'personale'
    ? window.state.variables.personale
    : window.state.activeVariableTab === 'mezzi'
      ? window.state.variables.mezzi
      : window.state.variables.fasce_orarie;

  if (window.state.activeVariableTab === 'fasce' && Array.isArray(currentList)) {
    currentList.sort((a, b) => a.localeCompare(b));
  }

  const label = document.getElementById("variableListLabel");
  if (label) label.innerText = `Elenco ${window.state.activeVariableTab.toUpperCase()} (${(currentList||[]).length})`;

  if (!currentList || currentList.length === 0) {
    container.innerHTML = `<div class="p-3 text-center text-xs text-slate-500 bg-slate-900/60 rounded-xl border border-slate-800">Nessun elemento</div>`;
    return;
  }

  container.innerHTML = currentList.map((item, index) => `
    <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
          ${window.state.activeVariableTab === 'personale' ? '<i data-lucide="user" class="w-3.5 h-3.5"></i>' : window.state.activeVariableTab === 'mezzi' ? '<i data-lucide="truck" class="w-3.5 h-3.5"></i>' : '<i data-lucide="clock" class="w-3.5 h-3.5"></i>'}
        </div>
        <span class="text-xs font-semibold text-slate-100 ${window.state.activeVariableTab === 'fasce' ? 'font-mono text-blue-300' : ''}">${escapeHtml(item)}</span>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="editVariableItem(${index})" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><i data-lucide="edit-2" class="w-3.5 h-3.5"></i></button>
        <button onclick="deleteVariableItem(${index})" class="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
      </div>
    </div>
  `).join("");
  triggerLucideIcons();
}

async function handleVariableSave(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById("variableTextInput");
  if (!input || !input.value.trim()) return;

  const val = input.value.trim();
  if (!window.state.variables.personale) window.state.variables.personale = [];
  if (!window.state.variables.mezzi) window.state.variables.mezzi = [];
  if (!window.state.variables.fasce_orarie) window.state.variables.fasce_orarie = [];

  let targetArray = window.state.activeVariableTab === 'personale'
    ? window.state.variables.personale
    : window.state.activeVariableTab === 'mezzi'
      ? window.state.variables.mezzi
      : window.state.variables.fasce_orarie;

  targetArray.push(val);
  if (window.state.activeVariableTab === 'fasce') targetArray.sort((a, b) => a.localeCompare(b));

  input.value = "";
  renderVariableManagement();
  populateDropdowns();
  await pushVariablesToGitHub();
}

function editVariableItem(index) {
  const currentList = window.state.activeVariableTab === 'personale'
    ? window.state.variables.personale
    : window.state.activeVariableTab === 'mezzi'
      ? window.state.variables.mezzi
      : window.state.variables.fasce_orarie;

  const item = currentList[index];
  const input = document.getElementById("variableTextInput");
  if (input) {
    input.value = item;
    input.focus();
  }
}

async function deleteVariableItem(index) {
  if (!confirm("Eliminare questo elemento?")) return;
  let targetArray = window.state.activeVariableTab === 'personale'
    ? window.state.variables.personale
    : window.state.activeVariableTab === 'mezzi'
      ? window.state.variables.mezzi
      : window.state.variables.fasce_orarie;

  targetArray.splice(index, 1);
  renderVariableManagement();
  populateDropdowns();
  await pushVariablesToGitHub();
}

function openApiModal() { navigateToPage('manage'); }
function closeApiModal() { document.getElementById("apiConfigModal")?.classList.add("hidden"); }

function renderAllViews() {
  populateDropdowns();
  renderQuickRecent();
  renderReportList();
  renderVariableManagement();
}

function initApp() {
  const d = document.getElementById("displaySelectedDate");
  if (d) d.innerText = formatDateDisplay(window.state.selectedDate);
  const r = document.getElementById("reportCurrentDateFormatted");
  if (r) r.innerText = formatDateDisplay(window.state.reportFilterDate);

  selectDateShortcut('oggi');
  setBookingType('ANDATA');

  loadVariablesAndSync();
  triggerLucideIcons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Esportazione globale window
window.navigateToPage = navigateToPage;
window.selectDateShortcut = selectDateShortcut;
window.onCustomDateChange = onCustomDateChange;
window.setBookingType = setBookingType;
window.handleBookingSubmit = handleBookingSubmit;
window.shiftReportDate = shiftReportDate;
window.setReportFilterDate = setReportFilterDate;
window.exportReportToCsv = exportReportToCsv;
window.refreshCloudData = loadVariablesAndSync;
window.handleManageAuth = handleManageAuth;
window.lockManageArea = lockManageArea;
window.switchVariableTab = switchVariableTab;
window.handleVariableSave = handleVariableSave;
window.editVariableItem = editVariableItem;
window.deleteVariableItem = deleteVariableItem;
window.openApiModal = openApiModal;
window.closeApiModal = closeApiModal;
window.saveAdminGitHubConfig = saveAdminGitHubConfig;
window.testWorkerConnection = testWorkerConnection;
