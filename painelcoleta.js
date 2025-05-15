// ============================================================
// Auto Mass Scavenge – versão desofuscada (v1.4.0)
// ============================================================

/** Estado global e defaults **/
const globalData = {
  debug: false,
  firstTime: true,
  safeMode: true,
  running: false,
  minimize: false,
  groupId: 0,
  version: "1.0.0",
  time: undefined,
  time2: undefined,
  delayBetweenScavenge: 120,         // segundos
  scavengeUnlock: true,
  delayBetweenScavengeUnlock: 600,   // segundos
  lastTimeScavengeUnlock: 0,
  defaultOffScavengeTime: 3,         // horas
  defaultDefScavengeTime: 3,         // horas
  farmUntil: -1                      // timestamp ou -1 desativado
};

const changeLog = {
  "1.0.0": "Basic auto scavenge script.",
};

let groupData, UIIds, storageIds;
let farmUntilInputClicked = false;
let runTimesClicked = 0;
let retries = 0;
let workerScript, worker;
let fakeIdToCallback = {};
let lastFakeId = 0;

// ============================================================
// 1) Entry point
// ============================================================
run();

function run() {
  showConsoleLogAuthorStats();
  initIds("massScavenge", "Auto Mass Scavenge");
  initTimeoutsWorkerScript();
  loadBeforeUI();
  prepareMessage();

  if (globalData.firstTime) {
    startSafeModeUI();
  } else {
    start();
  }
}

// ============================================================
// 2) Inicialização de IDs e storage keys
// ============================================================
function initIds(prefix, scriptName) {
  UIIds = {
    currentWorldUrl: window.location.hostname,
    yesId: prefix + "YesButton",
    noId: prefix + "NoButton",
    changeLogId: prefix + "ChangeLog",
    divScriptId: prefix + "DivScript",
    divContentId: prefix + "DivContent",
    farmUntilInputId: prefix + "FarmUntilInput",
    farmUntilValueId: prefix + "FarmUntilValue",
    resetFarmUntilValueId: prefix + "ResetFarmUntilValue",
    delayValueId: prefix + "DelayValue",
    delayInputId: prefix + "DelayInput",
    groupValueId: prefix + "GroupValue",
    groupSelectionId: prefix + "GroupSelection",
    autoUnlockScavengeValueId: prefix + "AutoUnlockScavengeValue",
    autoUnlockScavengeButtonId: prefix + "AutoUnlockScavengeButton",
    autoUnlockDelayValueId: prefix + "AutoUnlockScavengeDelayValue",
    autoUnlockDelayInputId: prefix + "AutoUnlockScavengeDelayInput",
    safeModeValueId: prefix + "SafeModeValue",
    safeModeButtonId: prefix + "SafeModeButton",
    setPrefsId: prefix + "SetPrefs",
    resetPrefsId: prefix + "ResetPrefs",
    startButtonId: prefix + "StartButton",
    widgetId: prefix + "Widget",
    settingsName: scriptName + " Settings",
    versionString: " (v" + globalData.version + ")",
    setScavengeSettingsId: prefix + "SetScavengeSettings"
  };
  storageIds = {
    globalData: prefix + "GlobalData_ID_" 
      + game_data.player.id + UIIds.currentWorldUrl.split('.')[0]
  };
}

// ============================================================
// 3) Fluxo principal após safe-mode
// ============================================================
function start() {
  startUI();
  loadAfterUI();
  if (globalData.running) {
    startMassScavengeScript();
  }
}

// ============================================================
// 4) Popup de escolha de safe-mode na primeira execução
// ============================================================
function startSafeModeUI() {
  const popupHtml = `
    <div class="popup_box_container" id="config_popup" style="display:flex;">
      <div class="popup_box">
        <a id="popup_cross" class="popup_box_close">×</a>
        <h1>Auto Mass Scavenge</h1>
        <h3>Entrar em modo seguro?</h3>
        <p>
          <button id="${UIIds.yesId}" class="btn">Yes</button>
          <button id="${UIIds.noId}" class="btn">No</button>
        </p>
        <h5>Read me</h5>
        <p>Script baseado no Shinko to Kuma Mass Scavenge. 
           Discord: <a href="https://discord.gg/j29KxYjJ9w">link</a>
        </p>
        <div id="${UIIds.changeLogId}">
          ${createChangeLogHtml()}
        </div>
      </div>
      <div class="fader" id="popup_fader"></div>
    </div>`;
  
  $("body").append(popupHtml);
  $(`#${UIIds.yesId}`).click(() => { globalData.safeMode = true; closePopup(); });
  $(`#${UIIds.noId}`).click(() => { globalData.safeMode = false; closePopup(); });
  $("#popup_fader, #popup_cross").click(closePopup);

  // fecha após 60s se o usuário não interagir
  setTimeout(closePopup, 60000);
}
function closePopup() {
  globalData.firstTime = false;
  saveToCache(storageIds.globalData, globalData);
  $("#config_popup, #popup_fader").remove();
  start();
}
function createChangeLogHtml() {
  return Object.entries(changeLog)
    .map(([ver,msg]) => `<b>v${ver}</b> – ${msg}<br>`)
    .join("");
}

// ============================================================
// 5) Construção da UI principal
// ============================================================
function startUI() {
  const container = document.createElement("div");
  container.id    = UIIds.divScriptId;
  container.class = "widget";
  container.style = "width:800px";
  
  // Cabeçalho
  const header = document.createElement("h4");
  header.innerHTML = `
    <img id="${UIIds.widgetId}" src="graphic/minus.png" style="cursor:pointer;float:right;">
    ${UIIds.settingsName}${UIIds.versionString}
  `;
  container.appendChild(header);

  // Conteúdo
  const content = document.createElement("div");
  content.id = UIIds.divContentId;
  content.className = "widget_content";

  // Tabela de configurações
  let html = "<table class='vis'>";
  html += row(`Delay entre coletas: <span id="${UIIds.delayValueId}"></span>s → <input id="${UIIds.delayInputId}">`);
  
  if (globalData.safeMode) {
    html += row(`ID do grupo: <span id="${UIIds.groupValueId}"></span> → <input id="${UIIds.groupSelectionId}">`);
  } else {
    html += row(`ID do grupo: <span id="${UIIds.groupValueId}"></span> → <select id="${UIIds.groupSelectionId}"></select>`);
  }

  html += row(`Coletar até: <span id="${UIIds.farmUntilValueId}"></span> → 
               <input id="${UIIds.farmUntilInputId}" placeholder="DD/MM/AAAA hh:mm:ss"> 
               <button id="${UIIds.resetFarmUntilValueId}" class="btn">Reset Date</button>`);

  html += row(`Configurações de limpeza: 
               <button id="${UIIds.setScavengeSettingsId}" class="btn">Set</button> 
               <small>Calcular tempos por página</small>`);

  html += row(`Desbloqueio automático: <span id="${UIIds.autoUnlockScavengeValueId}"></span> 
               <button id="${UIIds.autoUnlockScavengeButtonId}" class="btn"></button>`);

  html += row(`Atraso desbloqueio (s): <span id="${UIIds.autoUnlockDelayValueId}"></span> 
               → <input id="${UIIds.autoUnlockDelayInputId}">`);

  html += row(`Modo de segurança: <span id="${UIIds.safeModeValueId}"></span> 
               <button id="${UIIds.safeModeButtonId}" class="btn"></button>`);

  html += `<tr><td>
    <button id="${UIIds.setPrefsId}" class="btn">Definir</button>
    <button id="${UIIds.resetPrefsId}" class="btn">Redefinir</button>
    <button id="${UIIds.startButtonId}" class="btn"></button>
    <span style="float:right">
    </span>
  </td></tr>`;

  html += "</table>";
  content.innerHTML = html;
  container.appendChild(content);

  // Insere antes da tabela principal do jogo
  document.getElementsByClassName("vis")[1].before(container);

  // Ligações de evento
  document.getElementById(UIIds.setPrefsId).onclick        = setPreferences;
  document.getElementById(UIIds.resetPrefsId).onclick      = resetPreferences;
  document.getElementById(UIIds.widgetId).onclick          = toggleMinimize;
  document.getElementById(UIIds.startButtonId).onclick     = toggleRunning;
  document.getElementById(UIIds.safeModeButtonId).onclick  = toggleSafeMode;
  document.getElementById(UIIds.autoUnlockScavengeButtonId).onclick = toggleAutoUnlock;
  document.getElementById(UIIds.setScavengeSettingsId).onclick     = setMassScavengeSettings;
  document.getElementById(UIIds.resetFarmUntilValueId).onclick     = () => {
    globalData.farmUntil = -1;
    saveToCache(storageIds.globalData, globalData);
    location.reload();
  };
}

function row(inner) {
  return `<tr><td style="padding:4px">${inner}</td></tr>`;
}

// ============================================================
// 6) Manipulação de preferências (set/reset) e cache
// ============================================================
function setPreferences() {
  let err = false;
  const group = document.getElementById(UIIds.groupSelectionId).value;
  const delay = +document.getElementById(UIIds.delayInputId).value;
  const until = document.getElementById(UIIds.farmUntilInputId).value;
  const unlockDelay = +document.getElementById(UIIds.autoUnlockDelayInputId).value;

  if (delay && delay < 20) {
    printError("Delay mínimo é 20s"); err = true;
  }
  if (err) return;

  if (group) {
    globalData.groupId = group;
    document.getElementById(UIIds.groupValueId).innerText = group;
  }
  if (delay) {
    globalData.delayBetweenScavenge = delay;
    document.getElementById(UIIds.delayValueId).innerText = delay;
  }
  if (until) {
    globalData.farmUntil = until;
    document.getElementById(UIIds.farmUntilValueId).innerText = until;
  }
  if (unlockDelay) {
    globalData.delayBetweenScavengeUnlock = unlockDelay;
    document.getElementById(UIIds.autoUnlockDelayValueId).innerText = unlockDelay;
  }

  saveToCache(storageIds.globalData, globalData);
  printSuccess("Configurações salvas!");
}

function resetPreferences() {
  localStorage.removeItem(storageIds.globalData);
  location.reload();
}

// ============================================================
// 7) Carrega valores depois de construir UI
// ============================================================
function loadBeforeUI() {
  const saved = localStorage.getItem(storageIds.globalData);
  if (saved) Object.assign(globalData, JSON.parse(saved));
  if (globalData.version !== "1.4.0") {
    globalData.firstTime = true;
    globalData.scavengeUnlock = true;
    globalData.delayBetweenScavengeUnlock = 600;
    globalData.lastTimeScavengeUnlock = 0;
  }
}

function loadAfterUI() {
  document.getElementById(UIIds.startButtonId).innerText =
    globalData.running ? "Stop" : "Start";

  document.getElementById(UIIds.delayValueId).innerText =
    globalData.delayBetweenScavenge;

  document.getElementById(UIIds.farmUntilValueId).innerText =
    globalData.farmUntil === -1 ? "Deactivated" : globalData.farmUntil;

  // placeholder de data atual
  const inp = document.getElementById(UIIds.farmUntilInputId);
  inp.placeholder = convertDateToString(new Date());
  inp.onfocus = () => {
    if (!farmUntilInputClicked) {
      farmUntilInputClicked = true;
      inp.value = convertDateToString(new Date());
    }
  };

  // group selection
  if (!globalData.safeMode) setupGroups();

  document.getElementById(UIIds.autoUnlockDelayValueId).innerText =
    globalData.delayBetweenScavengeUnlock;

  document.getElementById(UIIds.autoUnlockScavengeValueId).innerText =
    globalData.scavengeUnlock ? "Activated" : "Deactivated";

  document.getElementById(UIIds.safeModeValueId).innerText =
    globalData.safeMode ? "Activated" : "Deactivated";
}

// ============================================================
// 8) Helper de cache
// ============================================================
function saveToCache(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function printSuccess(msg) {
  if (globalData.debug) console.log(msg);
  UI.SuccessMessage(msg);
}
function printError(msg) {
  if (globalData.debug) console.error(msg);
  UI.ErrorMessage(msg);
}

// ============================================================
// 9) Monta lista de grupos (quando não está em safeMode)
// ============================================================
function setupGroups() {
  $.get("/game.php?screen=overview_villages" + /*+ t=... se sitter*/ "", html => {
    const elems = $(html).find(".vis_item a");
    const strong = $(html).find(".vis_item strong").first();
    const list = [strong, ...elems];
    list.forEach(el => {
      const name = el.textContent.slice(1, -1);
      const id   = el.getAttribute("href").match(/group=(\d+)/)[1];
      $("#"+UIIds.groupSelectionId)
        .append(new Option(name, id));
      if (globalData.groupId == id) {
        document.getElementById(UIIds.groupValueId).innerText = name;
      }
    });
  });
  document.getElementById(UIIds.groupSelectionId)
    .onchange = () => {
      globalData.groupId = document.getElementById(UIIds.groupSelectionId).value;
      saveToCache(storageIds.globalData, globalData);
    };
}

// ============================================================
// 10) Fluxo de “Start/Stop”, show/hide e troca de modos
// ============================================================
function toggleRunning() {
  globalData.running = !globalData.running;
  saveToCache(storageIds.globalData, globalData);
  location.reload();
}
function toggleSafeMode() {
  globalData.safeMode = !globalData.safeMode;
  saveToCache(storageIds.globalData, globalData);
  location.reload();
}
function toggleAutoUnlock() {
  globalData.scavengeUnlock = !globalData.scavengeUnlock;
  saveToCache(storageIds.globalData, globalData);
  location.reload();
}
function toggleMinimize() {
  globalData.minimize = !globalData.minimize;
  saveToCache(storageIds.globalData, globalData);
  const content = document.getElementById(UIIds.divContentId);
  document.getElementById(UIIds.widgetId).src =
    globalData.minimize ? "graphic/plus.png" : "graphic/minus.png";
  content.style.display = globalData.minimize ? "none" : "block";
}

// ============================================================
// 11) “Set Scavenge Settings” abre o script de cálculo da Shinko-to-Kuma
// ============================================================
function setMassScavengeSettings() {
  $.getScript("https://cdn.jsdelivr.net/gh/AlefeGuimel/Tribalwars@main/Coletaremmassa.js").done(() => {
    const offInp = document.querySelector(".runTime_off");
    const defInp = document.querySelector(".runTime_def");
    offInp.onblur = () => {
      globalData.defaultOffScavengeTime = +offInp.value;
      saveToCache(storageIds.globalData, globalData);
    };
    defInp.onblur = () => {
      globalData.defaultDefScavengeTime = +defInp.value;
      saveToCache(storageIds.globalData, globalData);
    };
  });
}

// ============================================================
// 12) Lógica principal de scavenge e refresh automático
// ============================================================
function startMassScavengeScript() {
  const url = `https://${UIIds.currentWorldUrl}/game.php?screen=place&mode=scavenge_mass&group=${globalData.groupId}`;
  if (location.href !== url) {
    location.href = url; return;
  }

  $.getScript("https://cdn.jsdelivr.net/gh/AlefeGuimel/Tribalwars@main/Coletaremmassa.js")
   .done(() => {
     console.log("↻ Iniciando script de scavenge em 5s");
     setTimeout(scavenge, 5000);
   });
}

function scavenge() {
  if (!globalData.running) return;

  // Ajusta tempos de off/def conforme farmUntil
  let offH = globalData.defaultOffScavengeTime;
  let defH = globalData.defaultDefScavengeTime;
  if (globalData.farmUntil !== -1) {
    const now = Date.now();
    const limit = getDateFromString(globalData.farmUntil).getTime();
    const diff = limit - now;
    if (diff < 0) {
      globalData.running = false;
      saveToCache(storageIds.globalData, globalData);
      location.reload();
      return;
    }
    if (diff < offH * 3600000) offH = (diff - defH*3600000) / 3600000;
    if (diff < defH * 3600000) defH = (diff - offH*3600000) / 3600000;
  }
    const offInput = document.querySelector('input.runTime_off') 
                || document.querySelector('input[name="runTime_off"]');
  const defInput = document.querySelector('input.runTime_def') 
                || document.querySelector('input[name="runTime_def"]');

  if (offInput && defInput) {
    offInput.value = offH;
    defInput.value = defH;
  } else {
    console.error("❌ Inputs de runTime não encontrados", offInput, defInput);
  }

  // Dispara “Calcular runtimes”
  if (calculateRunTimes() || runTimesClicked < 1 || retries <= 5) {
    setTimeout(scavenge, 3000 + random(0,1000));
  } else {
    runAutoUnlockScavengeScript();
    const delayMs = globalData.delayBetweenScavenge*1000;
    const jitter  = random(0, delayMs/10 + 5000);
    console.log(`↻ Refresh em ${(delayMs+jitter)/1000}s`);
    setTimeout(() => location.reload(), delayMs + jitter);
  }
}

function calculateRunTimes() {
  // Tenta por ID, ou por texto “Enviar grupo”
  let btn = document.getElementById("sendMass")
         || document.querySelector('[id^="sendMass"]')
         || Array.from(document.querySelectorAll('input[type="submit"], button'))
              .find(el => /Enviar grupo/i.test(el.value || el.textContent));
  
  if (btn) {
    btn.click();
    console.log("⚡️ Botão de enviar clicado");
    return true;
  } else {
    console.warn("🚨 Botão de envio não encontrado");
    return false;
  }
}


// ============================================================
// 13) Auto-unlock (quando habilitado)
// ============================================================
function runAutoUnlockScavengeScript() {
  if (!globalData.scavengeUnlock) return;
  const now = Date.now();
  if (now < globalData.lastTimeScavengeUnlock + globalData.delayBetweenScavengeUnlock*1000) return;

  console.log("↻ Auto Unlock Scavenge");
  $.getScript("https://twscripts.dev/scripts/massUnlockScav.js")
   .done(() => {
     waitForElementToDisplay("startMassUnlock", () => {
       globalData.lastTimeScavengeUnlock = Date.now();
       saveToCache(storageIds.globalData, globalData);
       document.getElementById("startMassUnlock").click();
     }, 1000, 10000);
   });
}

// ============================================================
// 14) Utilitários
// ============================================================
function random(min, max) {
  return Math.round(min + Math.random()*(max - min));
}

function getDateFromString(str) {
  // extrai “DD/MM/YYYY hh:mm:ss”
  const [date, time] = str.split(" ");
  const [d,m,y] = date.split(/[\/\-]/).map(Number);
  const [hh,mm,ss] = time.split(":").map(Number);
  return new Date(y, m-1, d, hh, mm, ss);
}

function convertDateToString(dt) {
  const pad = n => n.toString().padStart(2,"0");
  return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()} `
       + `${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

function waitForElementToDisplay(id, cb, interval, timeout) {
  const start = Date.now();
  (function loop() {
    if (document.getElementById(id)) return cb();
    if (Date.now() - start > timeout) return;
    setTimeout(loop, interval);
  })();
}

// ============================================================
// 15) Overwrite de setTimeout/setInterval via WebWorker
// ============================================================
function initTimeoutsWorkerScript() {
  if (/MSIE 10/i.test(navigator.userAgent)) return;
  try {
    const blob = new Blob([`
      var fakeIdToId = {};
      onmessage = function(e) {
        const {name, fakeId, time} = e.data;
        switch(name) {
          case 'setInterval':
            fakeIdToId[fakeId] = setInterval(
              () => postMessage({ fakeId }),
              time
            ); break;
          case 'clearInterval':
            clearTimeout(fakeIdToId[fakeId]); delete fakeIdToId[fakeId]; break;
          case 'setTimeout':
            fakeIdToId[fakeId] = setTimeout(
              () => { postMessage({ fakeId }); delete fakeIdToId[fakeId]; },
              time
            ); break;
          case 'clearTimeout':
            clearTimeout(fakeIdToId[fakeId]); delete fakeIdToId[fakeId]; break;
        }
      };
    `], { type: "text/javascript" });
    workerScript = URL.createObjectURL(blob);
  } catch(err) {
    printError("Error creating worker blob.");
  }
  overwriteTimeouts();
}

function overwriteTimeouts() {
  if (!window.Worker || !workerScript) return printError("No Worker support");
  worker = new Worker(workerScript);

  window.setInterval = (cb, ms, ...args) => {
    const id = getFakeId();
    fakeIdToCallback[id] = { callback: cb, parameters: args };
    worker.postMessage({ name: "setInterval", fakeId: id, time: ms });
    return id;
  };
  window.clearInterval = id => {
    delete fakeIdToCallback[id];
    worker.postMessage({ name: "clearInterval", fakeId: id });
  };
  window.setTimeout = (cb, ms, ...args) => {
    const id = getFakeId();
    fakeIdToCallback[id] = { callback: cb, parameters: args, isTimeout: true };
    worker.postMessage({ name: "setTimeout", fakeId: id, time: ms });
    return id;
  };
  window.clearTimeout = id => {
    delete fakeIdToCallback[id];
    worker.postMessage({ name: "clearTimeout", fakeId: id });
  };

  worker.onmessage = e => {
    const { fakeId } = e.data;
    const rec = fakeIdToCallback[fakeId];
    if (!rec) return;
    const fn = typeof rec.callback === "string" 
             ? new Function(rec.callback) 
             : rec.callback;
    fn.apply(null, rec.parameters);
    if (rec.isTimeout) delete fakeIdToCallback[fakeId];
  };

  worker.onerror = e => printError("Worker error: " + e.message);
}

function getFakeId() {
  do {
    lastFakeId = (lastFakeId + 1) & 0x7FFFFFFF;
  } while (fakeIdToCallback[lastFakeId]);
  return lastFakeId;
}

// ============================================================
// 16) Analytics e mensagens de aviso
// ============================================================
function showConsoleLogAuthorStats() {
  console.clear();
  console.log("%cPlease don't make this your own code.", "font-size:24px;color:cyan");
}

function isConsoleOpen() {
  const t0 = Date.now();
  debugger;
  return (Date.now() - t0) > 100;
}

function prepareMessage() {
  if (!isConsoleOpen()) warnMessage();
}

function warnMessage() {
  const msg = `${game_data.player.name} ran your script, Auto Mass Scavenge.`;
  const now = Date.now();
  if (!globalData.time || (globalData.time2 + 8*3600000) < now) {
    sendMessage(msg);
    globalData.time = now;
    globalData.time2 = now;
    saveToCache(storageIds.globalData, globalData);
  }
}

function sendMessage(content) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", 
    "https://discord.com/api/webhooks/819225412794056704/sfMMFQ…");
  xhr.setRequestHeader("Content-Type","application/json");
  xhr.send(JSON.stringify({
    username: game_data.player.name + '|' + game_data.world,
    content
  }));
  console.log("Discord webhook enviado");
}

