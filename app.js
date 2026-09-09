/**
 * Transport Manage - app.js
 * Sincronizzazione centralizzata con GitHub REST API
 * 
 * Caratteristiche:
 * 1. Token e configurazione salvati dall'amministratore in Pagina 3 (Manage)
 * 2. Condivisione automatica della configurazione via variables.json per tutti i dispositivi collegati al link
 * 3. Fallback locale su LocalStorage se non ancora sincronizzato
 * 4. Gestione CRUD completa: Autisti, Mezzi, Fasce Orarie (ordinate cronologicamente)
 * 5. Registrazione corse ANDATA / RITORNO con persistenza su bookings.json
 * 6. Report giornaliero con raggruppamento per colore ed esportazione CSV
 * 7. Esportazione globale su window per risposta immediata a tutti gli eventi onclick / onsubmit
 */

// 1. DATI PREDEFINITI DI BASE (Fallback iniziale immediato)
const DEFAULT_VARIABLES = {
  personale: [
    "Marco Rossi",
    "Luca Bianchi",
    "Alessandro Verdi",
    "Giulia Neri",
    "Roberto Ferrari"
  ],
  mezzi: [
    "Navetta Van 01 (Cap. 8p)",
    "Minibus B2 (Cap. 16p)",
    "Auto 04 (Cap. 4p)",
    "Bus GT (Cap. 50p)",
    "Van Cargo 02"
  ],
  fasce_orarie: [
    "06:30",
    "08:00",
    "14:00",
    "17:30",
    "19:15",
    "21:00"
  ],
  github_config: {
    owner: "",
    repo: "transportmanage",
    token: "",
    branch: "main"
  }
};

// 2. CONFIGURAZIONE GITHUB CENTRALIZZATA CON FALLBACK SU LOCALSTORAGE
const GITHUB_CONFIG = {
  get owner() {
    return (window.state && window.state.variables && window.state.variables.github_config && window.state.variables.github_config.owner) 
      || localStorage.getItem("TM_GH_OWNER") 
      || "";
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

// 3. STATO GLOBALE DELL'APPLICAZIONE
window.state = {
  activeTab: 'prenotazione',
  selectedDate: getTodayDateString(),
  bookingType: 'ANDATA',
  variables: JSON.parse(JSON.stringify(DEFAULT_VARIABLES)),
  bookings: [
    {
      id: "bk_demo_1",
      date: getTodayDateString(),
      personale: "Marco Rossi",
      mezzo: "Navetta Van 01 (Cap. 8p)",
      orario: "06:30",
      type: "ANDATA",
      createdAt: new Date().toISOString()
    },
    {
      id: "bk_demo_2",
      date: getTodayDateString(),
      personale: "Luca Bianchi",
      mezzo: "Navetta Van 01 (Cap. 8p)",
      orario: "06:30",
      type: "ANDATA",
      createdAt: new Date().toISOString()
    }
  ],
  isManageAuthenticated: false,
  activeVariableTab: 'personale',
  reportFilterDate: getTodayDateString(),
  githubSha: {
    bookings: null,
    variables: null
  }
};

// Palette cromatica per il raggruppamento report
const PALETTE = [
  { border: 'border-l-emerald-400', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800/60', tag: 'text-emerald-400' },
  { border: 'border-l-blue-400', badge: 'bg-blue-950 text-blue-300 border-blue-800/60', tag: 'text-blue-400' },
  { border: 'border-l-amber-400', badge: 'bg-amber-950 text-amber-300 border-amber-800/60', tag: 'text-amber-400' },
  { border: 'border-l-purple-400', badge: 'bg-purple-950 text-purple-300 border-purple-800/60', tag: 'text-purple-400' },
  { border: 'border-l-cyan-400', badge: 'bg-cyan-950 text-cyan-300 border-cyan-800/60', tag: 'text-cyan-400' },
  { border: 'border-l-rose-400', badge: 'bg-rose-950 text-rose-300 border-rose-800/60', tag: 'text-rose-400' },
  { border: 'border-l-indigo-400', badge: 'bg-indigo-950 text-indigo-300 border-indigo-800/60', tag: 'text-indigo-400' },
  { border: 'border-l-teal-400', badge: 'bg-teal-950 text-teal-300 border-teal-800/60', tag: 'text-teal-400' }
];

// ==================== DATE UTILITIES ====================
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "--/--/----";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function escapeHtml(str) {
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

function triggerLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    try {
      window.lucide.createIcons();
    } catch (e) {
      console.warn("Lucide warning:", e);
    }
  }
}

function updateSyncBadge(text, colorClass) {
  const badge = document.getElementById("syncStatusBadge");
  if (badge) {
    badge.innerText = text;
    badge.className = `text-[10px] tracking-wide font-mono uppercase ${colorClass}`;
  }
}

// ==================== GITHUB DIRECT REST API ====================
function utf8ToBase64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str) {
  return decodeURIComponent(escape(window.atob(str)));
}

async function fetchFileFromGitHub(filename) {
  const owner = GITHUB_CONFIG.owner;
  const repo = GITHUB_CONFIG.repo;
  const token = GITHUB_CONFIG.token;
  const branch = GITHUB_CONFIG.branch;

  if (!owner) {
    throw new Error("Repository GitHub non configurata");
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}?ref=${branch}&t=${Date.now()}`;
  const headers = {
    "Accept": "application/vnd.github.v3+json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const fileKey = filename.replace('.json', '');
  window.state.githubSha[fileKey] = data.sha;

  const content = base64ToUtf8(data.content.replace(/\n/g, ''));
  return JSON.parse(content);
}

async function saveFileToGitHub(filename, jsonData, commitMessage) {
  const owner = GITHUB_CONFIG.owner;
  const repo = GITHUB_CONFIG.repo;
  const token = GITHUB_CONFIG.token;
  const branch = GITHUB_CONFIG.branch;

  if (!owner || !token) {
    throw new Error("Credenziali GitHub (Owner e Token) obbligatorie per salvare le modifiche");
  }

  const fileKey = filename.replace('.json', '');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
  const jsonString = JSON.stringify(jsonData, null, 2);
  const base64Content = utf8ToBase64(jsonString);

  const bodyPayload = {
    message: commitMessage || `Update ${filename} via PWA Transport Manage`,
    content: base64Content,
    branch: branch
  };

  if (window.state.githubSha[fileKey]) {
    bodyPayload.sha = window.state.githubSha[fileKey];
  }

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
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Errore salvataggio ${res.status}`);
  }

  const resData = await res.json();
  if (resData.content && resData.content.sha) {
    window.state.githubSha[fileKey] = resData.content.sha;
  }
  return true;
}

// Sincronizzazione automatica all'avvio
async function syncWithGitHub() {
  // Prova prima a leggere il file variables.json dal repository
  try {
    const localVarsRes = await fetch(`./variables.json?t=${Date.now()}`).catch(() => null);
    if (localVarsRes && localVarsRes.ok) {
      const parsed = await localVarsRes.json();
      if (parsed && parsed.github_config && parsed.github_config.token) {
        window.state.variables = parsed;
      }
    }
  } catch (e) {
    console.log("Controllo variables.json completato.");
  }

  if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.token) {
    updateSyncBadge("Configura in Manage", "text-amber-400");
    renderAllViews();
    return;
  }

  updateSyncBadge("Sync GitHub...", "text-blue-400");

  try {
    try {
      const vars = await fetchFileFromGitHub("variables.json");
      if (vars && Array.isArray(vars.personale)) {
        window.state.variables = vars;
        if (Array.isArray(window.state.variables.fasce_orarie)) {
          window.state.variables.fasce_orarie.sort((a, b) => a.localeCompare(b));
        }
      }
    } catch (e) {
      console.warn("Impossibile caricare variables.json da GitHub:", e);
    }

    try {
      const books = await fetchFileFromGitHub("bookings.json");
      if (Array.isArray(books)) {
        window.state.bookings = books;
      }
    } catch (e) {
      console.warn("Impossibile caricare bookings.json da GitHub:", e);
    }

    updateSyncBadge("Sync Attivo (GitHub)", "text-emerald-400");
  } catch (err) {
    console.error("Errore sincronizzazione GitHub:", err);
    updateSyncBadge("Errore Connessione", "text-rose-400");
  }

  renderAllViews();
}

async function pushBookingsToGitHub() {
  if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.token) return;
  try {
    updateSyncBadge("Invio corsa...", "text-amber-400");
    await saveFileToGitHub("bookings.json", window.state.bookings, `Nuova corsa registrata: ${window.state.selectedDate}`);
    updateSyncBadge("Sync Attivo (GitHub)", "text-emerald-400");
  } catch (err) {
    console.error("Errore salvataggio corse GitHub:", err);
    updateSyncBadge("Errore Salvataggio", "text-rose-400");
    alert("Salvataggio locale completato, ma errore su GitHub: " + err.message);
  }
}

async function pushVariablesToGitHub() {
  if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.token) return;
  try {
    updateSyncBadge("Salvataggio su GitHub...", "text-amber-400");
    await saveFileToGitHub("variables.json", window.state.variables, "Aggiornamento flotta, orari o credenziali");
    updateSyncBadge("Sync Attivo (GitHub)", "text-emerald-400");
  } catch (err) {
    console.error("Errore variabili GitHub:", err);
    updateSyncBadge("Errore Salvataggio", "text-rose-400");
    alert("Errore salvataggio su GitHub: " + err.message);
  }
}

// ==================== NAVIGAZIONE TAB ====================
function navigateToPage(pageId) {
  window.state.activeTab = pageId;

  const pagePrenotazione = document.getElementById("page-prenotazione");
  const pageReport = document.getElementById("page-report");
  const pageManage = document.getElementById("page-manage");

  if (pagePrenotazione) pagePrenotazione.classList.toggle("hidden", pageId !== 'prenotazione');
  if (pageReport) pageReport.classList.toggle("hidden", pageId !== 'report');
  if (pageManage) pageManage.classList.toggle("hidden", pageId !== 'manage');

  const titleMap = {
    prenotazione: "Prenotazione",
    report: "Report",
    manage: "Manage (Admin)"
  };
  const headerTitle = document.getElementById("headerPageTitle");
  if (headerTitle) headerTitle.innerText = titleMap[pageId] || "App";

  ['prenotazione', 'report', 'manage'].forEach(tab => {
    const btn = document.getElementById(`navBtn${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (btn) {
      if (tab === pageId) {
        btn.className = "py-1.5 flex flex-col items-center gap-1 text-blue-400 transition cursor-pointer";
      } else {
        btn.className = "py-1.5 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition cursor-pointer";
      }
    }
  });

  if (pageId === 'report') renderReportList();
  if (pageId === 'manage') checkManageAuthState();
  triggerLucideIcons();
}

// ==================== TAB 1: PRENOTAZIONE ====================
function selectDateShortcut(type) {
  const d = new Date();
  if (type === 'domani') {
    d.setDate(d.getDate() + 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  window.state.selectedDate = `${y}-${m}-${day}`;

  const display = document.getElementById("displaySelectedDate");
  if (display) display.innerText = formatDateDisplay(window.state.selectedDate);

  const btnOggi = document.getElementById("btnDateOggi");
  const btnDomani = document.getElementById("btnDateDomani");
  const btnCal = document.getElementById("btnDateCalendar");

  if (btnOggi && btnDomani) {
    if (type === 'oggi') {
      btnOggi.className = "py-2 px-1 text-center rounded-xl border text-xs font-semibold transition bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20";
      btnDomani.className = "py-2 px-1 text-center rounded-xl border text-xs font-medium transition bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700";
    } else {
      btnDomani.className = "py-2 px-1 text-center rounded-xl border text-xs font-semibold transition bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20";
      btnOggi.className = "py-2 px-1 text-center rounded-xl border text-xs font-medium transition bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700";
    }
  }
  if (btnCal) {
    btnCal.className = "w-full py-2 px-1 flex items-center justify-center gap-1 rounded-xl border text-xs font-medium transition bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700";
  }
}

function onCustomDateChange(val) {
  if (!val) return;
  window.state.selectedDate = val;
  const display = document.getElementById("displaySelectedDate");
  if (display) display.innerText = formatDateDisplay(val);

  const btnOggi = document.getElementById("btnDateOggi");
  const btnDomani = document.getElementById("btnDateDomani");
  const btnCal = document.getElementById("btnDateCalendar");

  if (btnOggi) btnOggi.className = "py-2 px-1 text-center rounded-lg border text-xs font-medium transition bg-slate-800 text-slate-300 border-slate-700";
  if (btnDomani) btnDomani.className = "py-2 px-1 text-center rounded-lg border text-xs font-medium transition bg-slate-800 text-slate-300 border-slate-700";
  if (btnCal) btnCal.className = "w-full py-2 px-1 flex items-center justify-center gap-1 rounded-lg border text-xs font-medium transition bg-blue-600 text-white border-blue-500 shadow-sm";
}

function setBookingType(type) {
  window.state.bookingType = type;
  const btnAndata = document.getElementById("btnTypeAndata");
  const btnRitorno = document.getElementById("btnTypeRitorno");

  if (btnAndata && btnRitorno) {
    if (type === 'ANDATA') {
      btnAndata.className = "py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20";
      btnRitorno.className = "py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600";
    } else {
      btnRitorno.className = "py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20";
      btnAndata.className = "py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600";
    }
  }
  triggerLucideIcons();
}

function populateDropdowns() {
  const selP = document.getElementById("selectPersonale");
  const selM = document.getElementById("selectMezzo");
  const selO = document.getElementById("selectOrario");

  if (selP) {
    const curP = selP.value;
    selP.innerHTML = '<option value="">Seleziona operatore conducente...</option>' +
      window.state.variables.personale.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
    if (curP) selP.value = curP;
  }

  if (selM) {
    const curM = selM.value;
    selM.innerHTML = '<option value="">Assegna veicolo flotta...</option>' +
      window.state.variables.mezzi.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
    if (curM) selM.value = curM;
  }

  if (selO) {
    const curO = selO.value;
    const sortedTimes = [...window.state.variables.fasce_orarie].sort((a, b) => a.localeCompare(b));
    selO.innerHTML = '<option value="">Fascia oraria di partenza autorizzata...</option>' +
      sortedTimes.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
    if (curO) selO.value = curO;
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
    alert("Compila tutti i campi obbligatori del servizio (Personale, Mezzo, Fascia Oraria).");
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
    const origHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4 inline-block mr-1"></i> SALVATO CON SUCCESSO!`;
    submitBtn.classList.replace("bg-blue-600", "bg-emerald-600");
    triggerLucideIcons();

    setTimeout(() => {
      submitBtn.innerHTML = origHtml;
      submitBtn.classList.replace("bg-emerald-600", "bg-blue-600");
      triggerLucideIcons();
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

  container.innerHTML = recent.map(b => {
    const isAndata = b.type === 'ANDATA';
    return `
      <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between shadow-sm">
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${isAndata ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50' : 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'}">${b.type}</span>
            <span class="text-xs font-semibold text-slate-100">${escapeHtml(b.personale)}</span>
          </div>
          <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
            <i data-lucide="truck" class="w-3 h-3 text-slate-500"></i> ${escapeHtml(b.mezzo)}
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-mono font-bold text-white">${b.orario}</span>
          <div class="text-[10px] text-emerald-400 font-mono flex items-center justify-end gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ${formatDateDisplay(b.date)}
          </div>
        </div>
      </div>
    `;
  }).join("");
  triggerLucideIcons();
}

// ==================== TAB 2: REPORT ====================
function getGroupingColor(orario, tipo, mezzo) {
  const key = `${(orario||'').trim()}_${(tipo||'').trim()}_${(mezzo||'').trim()}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
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
    container.innerHTML = `
      <div class="py-8 text-center text-xs text-slate-500">
        Nessuna corsa registrata per il ${formatDateDisplay(window.state.reportFilterDate)}
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const style = getGroupingColor(b.orario, b.type, b.mezzo);
    const isAndata = b.type === 'ANDATA';
    return `
      <div class="grid grid-cols-12 items-center px-3 py-3 text-xs border-l-4 ${style.border} hover:bg-slate-800/40 transition">
        <div class="col-span-4 font-semibold text-slate-100 truncate pr-1">
          ${escapeHtml(b.personale)}
        </div>
        <div class="col-span-3 text-center font-mono font-bold text-slate-200">
          ${b.orario}
        </div>
        <div class="col-span-2 text-center">
          <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${isAndata ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50' : 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'}">
            ${isAndata ? 'AND' : 'RIT'}
          </span>
        </div>
        <div class="col-span-3 text-right font-medium text-[11px] truncate ${style.tag}">
          ${escapeHtml(b.mezzo)}
        </div>
      </div>
    `;
  }).join("");
}

function exportReportToCsv() {
  const filtered = window.state.bookings.filter(b => b.date === window.state.reportFilterDate);
  if (filtered.length === 0) {
    alert("Nessuna corsa da esportare per la data selezionata.");
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
  URL.revokeObjectURL(url);
}

// ==================== TAB 3: MANAGE ("strongroom") ====================
function handleManageAuth(e) {
  if (e && e.preventDefault) e.preventDefault();
  const pwdInput = document.getElementById("managePasswordInput");
  const pwd = pwdInput ? pwdInput.value : "";

  if (pwd === "strongroom") {
    window.state.isManageAuthenticated = true;
    sessionStorage.setItem("manage_auth", "true");
    checkManageAuthState();
  } else {
    alert("Password errata. Accesso negato (Default: strongroom).");
    if (pwdInput) pwdInput.value = "";
  }
}

function lockManageArea() {
  window.state.isManageAuthenticated = false;
  sessionStorage.removeItem("manage_auth");
  checkManageAuthState();
}

function checkManageAuthState() {
  if (sessionStorage.getItem("manage_auth") === "true") {
    window.state.isManageAuthenticated = true;
  }

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
  const ownerInput = document.getElementById("adminGhOwner");
  const repoInput = document.getElementById("adminGhRepo");
  const tokenInput = document.getElementById("adminGhToken");
  const branchInput = document.getElementById("adminGhBranch");

  if (ownerInput) ownerInput.value = GITHUB_CONFIG.owner;
  if (repoInput) repoInput.value = GITHUB_CONFIG.repo;
  if (tokenInput) tokenInput.value = GITHUB_CONFIG.token;
  if (branchInput) branchInput.value = GITHUB_CONFIG.branch;
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
    alert("Inserisci sia l'utente GitHub che il Personal Access Token (PAT).");
    return;
  }

  GITHUB_CONFIG.owner = owner;
  GITHUB_CONFIG.repo = repo;
  GITHUB_CONFIG.token = token;
  GITHUB_CONFIG.branch = branch;

  if (!window.state.variables.github_config) {
    window.state.variables.github_config = {};
  }
  window.state.variables.github_config.owner = owner;
  window.state.variables.github_config.repo = repo;
  window.state.variables.github_config.token = token;
  window.state.variables.github_config.branch = branch;

  const btn = document.getElementById("btnSaveAdminConfig");
  if (btn) {
    btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 inline-block mr-1"></i> SALVATAGGIO IN CORSO...`;
    btn.className = "w-full py-2.5 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold transition";
    triggerLucideIcons();
  }

  try {
    await pushVariablesToGitHub();
    alert("✅ Configurazione GitHub salvata con successo!\nTutti i dispositivi con il link avranno ora la sincronizzazione attiva automaticamente.");
  } catch (err) {
    alert("Configurazione memorizzata nel dispositivo locale, ma salvataggio su variables.json fallito: " + err.message);
  } finally {
    if (btn) {
      btn.innerHTML = `<i data-lucide="save" class="w-4 h-4 inline-block mr-1"></i> Salva e Condividi con Tutti i Dispositivi`;
      btn.className = "w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer";
      triggerLucideIcons();
    }
  }

  syncWithGitHub();
}

function switchVariableTab(tabKey) {
  window.state.activeVariableTab = tabKey;

  const tabs = ['personale', 'mezzi', 'fasce'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabVar${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) {
      if (t === tabKey) {
        btn.className = "py-2 text-[11px] font-semibold rounded-lg bg-blue-600 text-white transition shadow-sm";
      } else {
        btn.className = "py-2 text-[11px] font-semibold rounded-lg text-slate-400 hover:text-white transition";
      }
    }
  });

  const title = document.getElementById("variableFormTitle");
  const hint = document.getElementById("variableFormHint");
  const input = document.getElementById("variableTextInput");
  const editIdx = document.getElementById("variableEditIndex");

  if (editIdx) editIdx.value = "-1";
  if (input) input.value = "";

  if (title && hint && input) {
    if (tabKey === 'personale') {
      title.innerText = "Nuovo Autista/Operatore";
      hint.innerText = "Variabile 1";
      input.placeholder = "Nome e Cognome (es. Sara Colombo)...";
      input.type = "text";
    } else if (tabKey === 'mezzi') {
      title.innerText = "Nuovo Mezzo di Trasporto";
      hint.innerText = "Variabile 2";
      input.placeholder = "Nome mezzo (es. Shuttle Van 05)...";
      input.type = "text";
    } else {
      title.innerText = "Nuova Fascia Oraria";
      hint.innerText = "Variabile 3 (Ordinamento automatico)";
      input.placeholder = "HH:MM (es. 10:15)";
      input.type = "time";
    }
  }

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

  if (window.state.activeVariableTab === 'fasce') {
    currentList.sort((a, b) => a.localeCompare(b));
  }

  const label = document.getElementById("variableListLabel");
  if (label) {
    label.innerText = `Elenco ${window.state.activeVariableTab.toUpperCase()} (${currentList.length})`;
  }

  if (currentList.length === 0) {
    container.innerHTML = `<div class="p-3 text-center text-xs text-slate-500 bg-slate-900/60 rounded-xl border border-slate-800">Nessun elemento configurato</div>`;
    return;
  }

  container.innerHTML = currentList.map((item, index) => {
    return `
      <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
            ${window.state.activeVariableTab === 'personale' ? '<i data-lucide="user" class="w-3.5 h-3.5"></i>' : window.state.activeVariableTab === 'mezzi' ? '<i data-lucide="truck" class="w-3.5 h-3.5"></i>' : '<i data-lucide="clock" class="w-3.5 h-3.5"></i>'}
          </div>
          <span class="text-xs font-semibold text-slate-100 ${window.state.activeVariableTab === 'fasce' ? 'font-mono text-blue-300' : ''}">${escapeHtml(item)}</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="editVariableItem(${index})" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer" title="Modifica">
            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="deleteVariableItem(${index})" class="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition cursor-pointer" title="Elimina">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  triggerLucideIcons();
}

async function handleVariableSave(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById("variableTextInput");
  const editIndexElem = document.getElementById("variableEditIndex");
  if (!input || !editIndexElem) return;

  const editIndex = parseInt(editIndexElem.value, 10);
  const val = input.value.trim();
  if (!val) return;

  let targetArray = window.state.activeVariableTab === 'personale'
    ? window.state.variables.personale
    : window.state.activeVariableTab === 'mezzi'
      ? window.state.variables.mezzi
      : window.state.variables.fasce_orarie;

  if (editIndex >= 0) {
    targetArray[editIndex] = val;
  } else {
    targetArray.push(val);
  }

  if (window.state.activeVariableTab === 'fasce') {
    window.state.variables.fasce_orarie.sort((a, b) => a.localeCompare(b));
  }

  input.value = "";
  editIndexElem.value = "-1";

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
  const editIdx = document.getElementById("variableEditIndex");
  if (input && editIdx) {
    input.value = item;
    editIdx.value = index;
    input.focus();
  }
}

async function deleteVariableItem(index) {
  if (!confirm("Sei sicuro di voler eliminare questo elemento?")) return;

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

// ==================== MODALE & TEST CONNESSIONE ====================
function openApiModal() {
  navigateToPage('manage');
}

function closeApiModal() {
  const modal = document.getElementById("apiConfigModal");
  if (modal) modal.classList.add("hidden");
}

async function testWorkerConnection() {
  const owner = GITHUB_CONFIG.owner;
  const repo = GITHUB_CONFIG.repo;
  const token = GITHUB_CONFIG.token;

  if (!owner || !token) {
    alert("Inserisci prima l'Utente GitHub e il Token PAT nei campi di configurazione sottostanti.");
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
      const data = await res.json();
      alert(`✅ Connessione GitHub Riuscita!\nRepository trovato: ${data.full_name}\nPermessi di lettura/scrittura verificati.`);
    } else if (res.status === 401) {
      alert("❌ Token GitHub non valido o scaduto.");
    } else if (res.status === 404) {
      alert(`❌ Repository "${owner}/${repo}" non trovato. Verifica il nome o i permessi del token.`);
    } else {
      alert(`Errore risposta GitHub: HTTP ${res.status}`);
    }
  } catch (err) {
    alert("Errore rete nel contattare le API di GitHub: " + err.message);
  }
}

// ==================== INIZIALIZZAZIONE GLOBALE ====================
function renderAllViews() {
  populateDropdowns();
  renderQuickRecent();
  renderReportList();
  renderVariableManagement();
}

function initApp() {
  const displaySelected = document.getElementById("displaySelectedDate");
  if (displaySelected) displaySelected.innerText = formatDateDisplay(window.state.selectedDate);

  const reportDateFormatted = document.getElementById("reportCurrentDateFormatted");
  if (reportDateFormatted) reportDateFormatted.innerText = formatDateDisplay(window.state.reportFilterDate);

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

// ESPORTAZIONE ESPLICITA SU WINDOW PER TUTTI I TRIGGER INLINE HTML
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
window.editVariableItem = editVariableItem;
window.deleteVariableItem = deleteVariableItem;
window.openApiModal = openApiModal;
window.closeApiModal = closeApiModal;
window.saveAdminGitHubConfig = saveAdminGitHubConfig;
window.testWorkerConnection = testWorkerConnection;
