function openUI() {
    html = '<head></head><body><h1>Tribe troop counter</h1><form><fieldset><legend>Settings</legend><p><input type="radio" name="mode" id="of" value="Read troops of the village" onchange="setMode(\'members_troops\')">Read troops of the village</input></p><p><input type="radio" name="mode" id="in" value="Read defenses in the village" onchange="setMode(\'members_defense\')">Read defenses in the village</input></p></fieldset><fieldset><legend>Filters</legend><select id="variable"><option value="x">x</option><option value="y">y</option>' + createUnitOption() + '</select><select id="kind"><option value=">">\></option><option value="<">\<</option></select><input type="text" id="value"></input><input type="button" class="btn evt-confirm-btn btn-confirm-yes" onclick="addFilter()" value="Save filter"></input><p><table><tr><th>Variable filtered</th><th>Operatore</th><th>Value</th><th></th></tr>' + createFilterTable() + '</form></p></fieldset><div><p><input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="run" onclick="readData()" value="Read data"></input></p></div></body>';
    Dialog.show("Troop counter", html);
    if (localStorage.troopCounterMode) {
        if (localStorage.troopCounterMode == "members_troops") {
            document.getElementById("of").checked = true;
        } else {
            document.getElementById("in").checked = true;
        }
    } else {
        document.getElementById("of").checked = true;
    }
}

function setMode(a) {
    localStorage.troopCounterMode = a;
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function downloadInfo(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send(null);
    return request.response;
}

function getPlayerDict() {
    playerDict = {};
    now = new Date();
    server = window.location.host;
    if (localStorage.playerDictFake) {
        if (localStorage.playerDictFake.split(":::")[0] == server) {
            savedDate = new Date(localStorage.playerDictFake.split(":::")[1])
            if (now - savedDate < 1000 * 60 * 60) {
                playerDict = JSON.parse(localStorage.playerDictFake.split(":::")[2]);
                return playerDict;
            }
        }
    }
    playerUrl = "https://" + window.location.host + "/map/player.txt";
    playerList = downloadInfo(playerUrl).split("\n");
    for (i = 0; i < playerList.length; i++) {
        if (playerList[i] != "") {
            row = playerList[i].split(",");
            playerDict[row[0]] = row[1].replace(/\+/g, " ");
        }
    }
    localStorage.playerDictFake = server + ":::" + now + ":::" + JSON.stringify(playerDict);
    return playerDict;
}

function addFilter() {
    filters = {};
    if (localStorage.troopCounterFilter) {
        filters = JSON.parse(localStorage.troopCounterFilter);
    }
    if (filters[document.getElementById("variable").value]) {
        if (isNaN(document.getElementById("value").value)) {
            UI.ErrorMessage("Insert a valid value", 3000);
        } else {
            filters[document.getElementById("variable").value].push([document.getElementById("kind").value, document.getElementById("value").value]);
        }
    } else {
        if (isNaN(document.getElementById("value").value)) {
            UI.ErrorMessage("Insert a valid value", 3000);
        } else {
            filters[document.getElementById("variable").value] = [[document.getElementById("kind").value, document.getElementById("value").value]];
        }
    }
    localStorage.troopCounterFilter = JSON.stringify(filters);
    openUI();
}

function createUnitOption() {
    unitsList = game_data.units;
    menu = "";
    for (i = 0; i < unitsList.length; i++) {
        menu = menu + '<option value="' + unitsList[i] + '">' + unitsList[i] + '</option>';
    }
    return menu;
}

function createFilterTable() {
    filters = {};
    if (localStorage.troopCounterFilter) {
        filters = JSON.parse(localStorage.troopCounterFilter);
    }
    rows = ""
    for (filter in filters) {
        for (i = 0; i < filters[filter].length; i++) {
            rows = rows + '<tr><td>' + filter + '</td><td>' + filters[filter][i][0] + '</td><td>' + filters[filter][i][1] + '</td><td><input type="image" src="https://dsit.innogamescdn.com/asset/cbd6f76/graphic/delete.png" onclick="deleteFilter(\'' + filter + '\',\'' + i.toString() + '\')"></input></td></tr>';
        }
    }
    return rows;
}

function deleteFilter(filter, i) {
    if (localStorage.troopCounterFilter) {
        filtres = JSON.parse(localStorage.troopCounterFilter);
        if (filter in filtres) {
            if (parseInt(i) < filtres[filter].length) {
                filtres[filter].splice(parseInt(i), 1);
            }
        }
    }
    localStorage.troopCounterFilter = JSON.stringify(filtres);
    openUI();
}

// ===================== LEITURA DE DADOS =====================

function readData() {
    if (game_data.mode !== "members") return;

    console.log("[TP] Iniciando readData()", new Date().toISOString());

    var html = '<label>Lendo…</label><progress id="bar" max="1" value="0"></progress>';
    Dialog.show("Progress bar", html);

    var filtres = {};
    if (localStorage.troopCounterFilter) filtres = JSON.parse(localStorage.troopCounterFilter);

    var table = document.getElementsByClassName("vis");
    var nMembers = table[2].rows.length;
    var playerInfoList = [];
    for (var iRow = 1; iRow < nMembers - 1; iRow++) {
        let playerId = table[2].rows[iRow].innerHTML.split("[")[1].split("]")[0];
        let villageAmount = table[2].rows[iRow].innerHTML.split('<td class="lit-item">')[4].split("</td>")[0];
        playerInfoList.push({ playerId: playerId, villageAmount: Number(villageAmount) || 0 });
    }

    console.log("[TP] Jogadores detectados:", playerInfoList.length);

    var mode = localStorage.troopCounterMode;
    var data = "Coords,Player,";
    var unitsList = game_data.units;
    for (var k = 0; k < unitsList.length; k++) data += unitsList[k] + ",";
    var players = getPlayerDict();
    data += "\n";

    var i = 0;
    var pageNumber = 1;

    (function loop() {
        if (i >= playerInfoList.length) {
            console.log("[TP] Fim da lista de jogadores. Chamando showData()");
            showData(data, mode);
            return;
        }

        var current = playerInfoList[i];
        var url = "https://" + window.location.host + "/game.php?screen=ally&mode=" + mode + "&player_id=" + current.playerId + "&page=" + pageNumber;
        console.log("[TP] Requisitando jogador", i + 1, "/", playerInfoList.length, "id=", current.playerId, "page=", pageNumber);

        var page = $.ajax({ url: url, async: false });
        var html = page.responseText || "";

        // Pega a tabela dentro de .table-responsive
        var idxWrap = html.indexOf('<div class="table-responsive">');
        var segment = idxWrap !== -1 ? html.slice(idxWrap) : html;
        var idxTable = segment.indexOf('<table class="vis w100">');
        var rows = segment.slice(idxTable).split("<tr>");

        var step = (mode === "members_defense") ? 2 : 1;
        var parsedCount = 0;

        for (var j = 2; j + step < rows.length; j += step) {
            var rowHtml = rows[j];
            var coordMatch = rowHtml.match(/\d{1,3}\|\d{1,3}/);
            if (!coordMatch) continue;
            var coords = coordMatch[0].split("|");

            var units = rowHtml.split(/<td class="">|<td class="hidden">/g);
            var villageData = { x: coords[0], y: coords[1] };
            for (var u = 1; u < units.length; u++) {
                var clean = (units[u].split("</td>")[0] || "")
                    .replace(/ /g, "")
                    .replace(/\n/g, "")
                    .replace(/<span class="grey">\.<\/span>/g, "");
                villageData[unitsList[u - 1]] = clean;
            }

            // aplica filtros
            var filtered = true;
            for (var key in filtres) {
                for (var f = 0; f < filtres[key].length; f++) {
                    var op = filtres[key][f][0];
                    var val = parseInt(filtres[key][f][1], 10);
                    var cur = parseInt(villageData[key] || "0", 10);
                    if (op === ">" && cur < val) filtered = false;
                    else if (op === "<" && cur > val) filtered = false;
                }
            }

            if (filtered) {
                data += villageData.x + "|" + villageData.y + ",";
                data += (players[current.playerId] || "Unknown") + ",";
                for (var z = 0; z < unitsList.length; z++) data += (villageData[unitsList[z]] || "0") + ",";
                data += "\n";
            }

            parsedCount++;
        }

        console.log("[TP] Parseados", parsedCount, "vilas para jogador", current.playerId, "page=", pageNumber);

        // Verifica se tem pagina seguinte
        var hasNext = /rel\s*=\s*["']?\s*next\s*["']?/i.test(html);
        if (hasNext) {
            pageNumber++;
        } else {
            pageNumber = 1;
            i++;
        }

        document.getElementById("bar").value = (i / playerInfoList.length);
        setTimeout(loop, 200);
    })();
}

function showData(data, mode) {
    console.log("[TP] showData() chamado. mode=", mode, "tamanho do CSV=", (data || "").length);
    var html = '<head></head><body><p><h2>Tribe data</h2>Mode selected: ' + mode + '</p><p><textarea readonly=true style="width:100%;height:300px;">' + data + '</textarea></p><p><input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="download" onclick="download(\'tribe_info.csv\',data)" value="Download as csv"></input><input type="button" class="btn evt-confirm-btn btn-confirm-no" onclick="openUI()" value="Back to main menu"></input></p></body>';
    Dialog.show("Tribe data", html);
}

openUI();
