/**
 * Transport Manage - app.js (Auto-Configurazione Immediata Multi-Dispositivo)
 */

const DEFAULT_VARIABLES = {
  personale: ["Marco Rossi", "Luca Bianchi", "Alessandro Verdi", "Giulia Neri", "Roberto Ferrari"],
  mezzi: ["Navetta Van 01 (Cap. 8p)", "Minibus B2 (Cap. 16p)", "Auto 04 (Cap. 4p)", "Bus GT (Cap. 50p)", "Van Cargo 02"],
  fasce_orarie: ["06:30", "08:00", "14:00", "17:30", "19:15", "21:00"],
  github_config: { owner: "", repo: "transportmanage", token: "", branch: "main" }
};

// Ricava automaticamente l'owner se siamo su github.io (es. username.github.io)
function detectDefaultOwner() {
  const host = window.location.hostname;
  if (host.endsWith('.github.io')) {
    return host.replace('.github.io', '');
  }
  return "";
}

const GITHUB_CONFIG = {
  get owner() {
    return (window.state && window.state.variables && window.state.variables.github_config && window.state.variables.github_config.owner)
      || localStorage.getItem("TM_GH_OWNER")
      || detectDefaultOwner();
  },
  set owner(val) {
    if (!window.state.variables.github_config) window.state.variables.github_config = {};
    window.state.variables.github_config.owner = val.trim();
    localStorage.setItem("TM_GH_OWNER", val.trim());
  },
  get repo() {
    return (window.state && window.state.variables && window.state.variables.github_config && window.state.variables.github_config.repo)
      || localStorage.getItem("TM_GH_REPO")
      || "transportmanage";
  },
  set repo(val) {
    if (!window.state.variables.github_config) window.state.variables.github_config = {};
    window.state.variables.github_config.repo = val.trim();
    localStorage.setItem("TM_GH_REPO", val.trim());
  },
  get token() {
    return (window.state && window.state.variables && window.state.variables.github_config && window.state.variables.github_config.token)
      || localStorage.getItem("TM_GH_TOKEN")
      || "";
  },
  set token(val) {
    if (!window.state.variables.github_config) window.state.variables.github_config = {};
    window.state.variables.github_config.token = val.trim();
    localStorage.setItem("TM_GH_TOKEN", val.trim());
  },
  get branch() {
    return (window.state && window.state.variables && window.state.variables.github_config && window.state.variables.github_config.branch)
      || localStorage.getItem("TM_GH_BRANCH")
      || "main";
  },
  set branch(val) {
    if (!window.state.variables.github_config) window.state.variables.github_config = {};
    window.state.variables.github_config.branch = val.trim();
    localStorage.setItem("TM_GH_BRANCH", val.trim());
  }
};

window.state = {
  activeTab: 'prenotazione',
  selectedDate: getTodayDateString(),
  bookingType: 'ANDATA',
  variables: JSON.parse(JSON.stringify(DEFAULT_VARIABLES)),
  bookings: [],
  isManageAuthenticated: false,
  activeVariableTab: 'personale',
  reportFilterDate: getTodayDateString(),
  githubSha: { bookings: null, variables: null }
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
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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

// ==================== COMUNICAZIONE GITHUB DIRETTA ====================
async function getFileSha(owner, repo, filename, token, branch) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=${branch}&nocache=${Date.now()}`;
    const headers = { "Accept": "application/vnd.github.v3+json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
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

  if (!owner) throw new Error("Owner mancante");

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=${branch}&nocache=${Date.now()}`;
  const headers = { "Accept": "application/vnd.github.v3+json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

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

  if (!owner || !token) throw new Error("Credenziali mancanti");

  const fileKey = filename.replace('.json', '');
  let sha = await getFileSha(owner, repo, filename, token, branch) || window.state.githubSha[fileKey];

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
  const bodyPayload = {
    message: commitMessage,
    content: utf8ToBase64(JSON.stringify(jsonData, null, 2)),
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

// SINCRONIZZAZIONE INTELLIGENTE ALL'AVVIO
async function syncWithGitHub() {
  updateSyncBadge("Verifica dati...", "text-blue-400");

  // 1. Legge il file variables.json bypassando qualsiasi cache (con timestamp casuale)
  try {
    const localRes = await fetch(`./variables.json?_t=${Date.now()}&nocache=true`, { cache: 'no-store' });
    if (localRes.ok) {
      const parsed = await localRes.json();
      if (parsed && parsed.github_config && parsed.github_config.token) {
        window.state.variables = parsed;
        // Salva anche nel LocalStorage del dispositivo mobile per le prossime aperture offline!
        localStorage.setItem("TM_GH_OWNER", parsed.github_config.owner || "");
        localStorage.setItem("TM_GH_REPO", parsed.github_config.repo || "transportmanage");
        localStorage.setItem("TM_GH_TOKEN", parsed.github_config.token || "");
        localStorage.setItem("TM_GH_BRANCH", parsed.github_config.branch || "main");
      }
    }
  } catch (e) {
    console.log("Controllo locale completato");
  }

  // 2. Se non ha il token, mostra l'avviso
  if (!GITHUB_CONFIG.token) {
    updateSyncBadge("Configura in Manage", "text-amber-400");
    renderAllViews();
    return;
  }

  // 3. Se il token c'è (letto da variables.json o da LocalStorage), sincronizza le corse e le variabili da GitHub API!
  try {
    const vars = await fetchFileFromGitHub("variables.json");
    if (vars && Array.isArray(vars.personale)) {
      window.state.variables = vars;
      if (Array.isArray(window.state.variables.fasce_orarie)) {
        window.state.variables.fasce_orarie.sort((a, b) => a.localeCompare(b));
      }
    }
    const books = await fetchFileFromGitHub("bookings.json");
    if (Array.isArray(books)) {
      window.state.bookings = books;
    }
    updateSyncBadge("Sync Attivo (GitHub)", "text-emerald-400");
  } catch (err) {
    console.warn("Sync GitHub:", err);
    updateSyncBadge("Sync Locale Attivo", "text-amber-400");
  }

  renderAllViews();
}

async function pushBookingsToGitHub() {
  if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.token) return;
  try {
    updateSyncBadge("Invio corsa...", "text-amber-400");
    await saveFileToGitHub("bookings.json", window.state.bookings, `Nuova corsa: ${window.state.selectedDate}`);
    updateSyncBadge("Sync Attivo (GitHub)", "text-emerald-400");
  } catch (err) {
    console.error(err);
    updateSyncBadge("Errore Salvataggio", "text-rose-400");
    alert("Errore salvataggio GitHub: " + err.message);
  }
}

async function pushVariablesToGitHub() {
  if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.token) return;
  try {
    updateSyncBadge("Salvataggio variabili...", "text-amber-400");
    await saveFileToGitHub("variables.json", window.state.variables, "Aggiornamento flotta e orari");
    updateSyncBadge("Sync Attivo (GitHub)", "text-emerald-400");
  } catch (err) {
    console.error(err);
    updateSyncBadge("Errore Salvataggio", "text-rose-400");
    throw err;
  }
}

// ==================== GESTIONE TEST E SALVATAGGIO ADMIN ====================
async function testWorkerConnection() {
  const ownerInput = document.getElementById("adminGhOwner") || document.getElementById("ghOwnerInput");
  const repoInput = document.getElementById("adminGhRepo") || document.getElementById("ghRepoInput");
  const tokenInput = document.getElementById("adminGhToken") || document.getElementById("ghTokenInput");

  const owner = (ownerInput ? ownerInput.value.trim() : "") || GITHUB_CONFIG.owner;
  const repo = (repoInput ? repoInput.value.trim() : "") || GITHUB_CONFIG.repo || "transportmanage";
  const token = (tokenInput ? tokenInput.value.trim() : "") || GITHUB_CONFIG.token;

  if (!owner || !token) {
    alert("⚠️ Inserisci Username e Personal Access Token (PAT) prima di testare.");
    return;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (res.ok) {
      const d = await res.json();
      alert(`✅ CONNESSIONE RIUSCITA!\n\nRepository: ${d.full_name}\nPermessi verificati.`);
    } else {
      alert(`❌ Errore HTTP ${res.status}: Token non valido o repository non trovato.`);
    }
  } catch (e) {
    alert("Errore di connessione: " + e.message);
  }
}

async function saveAdminGitHubConfig(e) {
  if (e && e.preventDefault) e.preventDefault();

  const ownerInput = document.getElementById("adminGhOwner");
  const repoInput = document.getElementById("adminGhRepo");
  const tokenInput = document.getElementById("adminGhToken");
  const branchInput = document.getElementById("adminGhBranch");

  const owner = ownerInput ? ownerInput.value.trim() : "";
  const repo = repoInput ? repoInput.value.trim() : "transportmanage";
  const token = tokenInput ? tokenInput.value.trim() : "";
  const branch = branchInput ? branchInput.value.trim() : "main";

  if (!owner || !token) {
    alert("⚠️ Inserisci sia l'Username che il Token PAT.");
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

  const btn = document.getElementById("btnSaveAdminConfig");
  if (btn) {
    btn.innerHTML = `SALVATAGGIO SU GITHUB...`;
    btn.className = "w-full py-2.5 px-3 bg-amber-600 text-white rounded-xl text-xs font-bold transition";
  }

  try {
    await pushVariablesToGitHub();
    alert("🎉 CONFIGURAZIONE SALVATA SU GITHUB!\n\nIl token è ora memorizzato nel file variables.json.");
  } catch (err) {
    alert("⚠️ Errore salvataggio: " + err.message);
  } finally {
    if (btn) {
      btn.innerHTML = `<i data-lucide="save" class="w-4 h-4 inline-block mr-1"></i> Salva e Condividi con Tutti i Dispositivi`;
      btn.className = "w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer";
      triggerLucideIcons();
    }
  }

  syncWithGitHub();
}

// ==================== INTERFACCIA E NAVIGAZIONE ====================
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

  ['prenotazione', 'report', 'manage'].forEach(t => {
    const btn = document.getElementById(`navBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      btn.className = (t === pageId)
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

  const disp = document.getElementById("displaySelectedDate");
  if (disp) disp.innerText = formatDateDisplay(window.state.selectedDate);

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
  const disp = document.getElementById("displaySelectedDate");
  if (disp) disp.innerText = formatDateDisplay(val);
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

  if (selP) {
    const cur = selP.value;
    selP.innerHTML = '<option value="">Seleziona operatore...</option>' +
      window.state.variables.personale.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
    if (cur) selP.value = cur;
  }
  if (selM) {
    const cur = selM.value;
    selM.innerHTML = '<option value="">Assegna veicolo...</option>' +
      window.state.variables.mezzi.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
    if (cur) selM.value = cur;
  }
  if (selO) {
    const cur = selO.value;
    const sorted = [...window.state.variables.fasce_orarie].sort((a, b) => a.localeCompare(b));
    selO.innerHTML = '<option value="">Fascia oraria...</option>' +
      sorted.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
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
    personale: personale,
    mezzo: mezzo,
    orario: orario,
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
  const c = document.getElementById("quickRecentBookings");
  if (!c) return;
  const recent = window.state.bookings.slice(0, 4);
  if (recent.length === 0) {
    c.innerHTML = `<div class="p-3 text-center text-xs text-slate-500 bg-slate-900/60 rounded-xl border border-slate-800">Nessuna corsa</div>`;
    return;
  }
  c.innerHTML = recent.map(b => `
    <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between shadow-sm">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${b.type === 'ANDATA' ? 'bg-blue-900/60 text-blue-300' : 'bg-indigo-900/60 text-indigo-300'}">${b.type}</span>
          <span class="text-xs font-semibold text-slate-100">${escapeHtml(b.personale)}</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-1">${escapeHtml(b.mezzo)}</div>
      </div>
      <div class="text-right">
        <span class="text-xs font-mono font-bold text-white">${b.orario}</span>
        <div class="text-[10px] text-emerald-400 font-mono">${formatDateDisplay(b.date)}</div>
      </div>
    </div>
  `).join("");
  triggerLucideIcons();
}

function shiftReportDate(deltaDays) {
  const cur = new Date(window.state.reportFilterDate);
  cur.setDate(cur.getDate() + deltaDays);
  const y = cur.getFullYear();
  const m = String(cur.getMonth() + 1).padStart(2, '0');
  const d = String(cur.getDate()).padStart(2, '0');
  window.state.reportFilterDate = `${y}-${m}-${d}`;
  const r = document.getElementById("reportCurrentDateFormatted");
  if (r) r.innerText = formatDateDisplay(window.state.reportFilterDate);
  renderReportList();
}

function setReportFilterDate(val) {
  if (!val) return;
  window.state.reportFilterDate = val;
  const r = document.getElementById("reportCurrentDateFormatted");
  if (r) r.innerText = formatDateDisplay(val);
  renderReportList();
}

function renderReportList() {
  const c = document.getElementById("reportListRows");
  if (!c) return;
  const filtered = window.state.bookings.filter(b => b.date === window.state.reportFilterDate);
  filtered.sort((a, b) => (a.orario || '').localeCompare(b.orario || ''));

  const t = document.getElementById("reportTotalBadge");
  if (t) t.innerText = `${filtered.length} corse`;

  if (filtered.length === 0) {
    c.innerHTML = `<div class="py-8 text-center text-xs text-slate-500">Nessuna corsa registrata</div>`;
    return;
  }

  c.innerHTML = filtered.map(b => `
    <div class="grid grid-cols-12 items-center px-3 py-3 text-xs border-l-4 border-l-blue-500 hover:bg-slate-800/40 transition">
      <div class="col-span-4 font-semibold text-slate-100 truncate pr-1">${escapeHtml(b.personale)}</div>
      <div class="col-span-3 text-center font-mono font-bold text-slate-200">${b.orario}</div>
      <div class="col-span-2 text-center">
        <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${b.type === 'ANDATA' ? 'bg-blue-900/60 text-blue-300' : 'bg-indigo-900/60 text-indigo-300'}">${b.type}</span>
      </div>
      <div class="col-span-3 text-right font-medium text-[11px] truncate text-slate-300">${escapeHtml(b.mezzo)}</div>
    </div>
  `).join("");
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
  a.download = `report_${window.state.reportFilterDate}.csv`;
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
  const c = document.getElementById("variableItemsList");
  if (!c) return;
  const list = window.state.activeVariableTab === 'personale'
    ? window.state.variables.personale
    : window.state.activeVariableTab === 'mezzi'
      ? window.state.variables.mezzi
      : window.state.variables.fasce_orarie;

  if (window.state.activeVariableTab === 'fasce') list.sort((a, b) => a.localeCompare(b));

  c.innerHTML = list.map((item, idx) => `
    <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
      <span class="text-xs text-slate-100 font-semibold">${escapeHtml(item)}</span>
      <button onclick="deleteVariableItem(${idx})" class="text-rose-400 p-1 text-xs">Elimina</button>
    </div>
  `).join("");
}

async function handleVariableSave(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById("variableTextInput");
  if (!input || !input.value.trim()) return;
  const val = input.value.trim();
  const list = window.state.activeVariableTab === 'personale'
    ? window.state.variables.personale
    : window.state.activeVariableTab === 'mezzi'
      ? window.state.variables.mezzi
      : window.state.variables.fasce_orarie;
  list.push(val);
  input.value = "";
  renderVariableManagement();
  populateDropdowns();
  await pushVariablesToGitHub();
}

async function deleteVariableItem(idx) {
  if (!confirm("Eliminare elemento?")) return;
  const list = window.state.activeVariableTab === 'personale'
    ? window.state.variables.personale
    : window.state.activeVariableTab === 'mezzi'
      ? window.state.variables.mezzi
      : window.state.variables.fasce_orarie;
  list.splice(idx, 1);
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
  renderAllViews();
  syncWithGitHub();
  triggerLucideIcons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Global window exposure
window.navigateToPage = navigateToPage;
window.selectDateShortcut = selectDateShortcut;
window.onCustomDateChange = onCustomDateChange;
window.setBookingType = setBookingType;
window.handleBookingSubmit = handleBookingSubmit;
window.shiftReportDate = shiftReportDate;
window.setReportFilterDate = setReportFilterDate;
window.exportReportToCsv = exportReportToCsv;
window.refreshCloudData = syncWithGitHub;
window.handleManageAuth = handleManageAuth;
window.lockManageArea = lockManageArea;
window.switchVariableTab = switchVariableTab;
window.handleVariableSave = handleVariableSave;
window.deleteVariableItem = deleteVariableItem;
window.openApiModal = openApiModal;
window.closeApiModal = closeApiModal;
window.saveAdminGitHubConfig = saveAdminGitHubConfig;
window.testWorkerConnection = testWorkerConnection;
