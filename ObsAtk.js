/*
 * Script Name: Get Incs for Player
 * Version: v1.5.6
 * Last Updated: 2025-04-23
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: N/A
 * Approved Date: 2021-04-21
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'getIncsForPlayer',
        name: 'Get Incs for Player',
        version: 'v1.5.6',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/get-incomings-for-player.286977/',
    },
    translations: {
        en_DK: {
            'Get Incs for Player': 'Get Incs for Player',
            Help: 'Help',
            'There was an error!': 'There was an error!',
            'Script must be executed from Player Info screen!':
                'Script must be executed from Player Info screen!',
            Fetching: 'Fetching',
            'Fetching incomings for each village...':
                'Fetching incomings for each village...',
            'Error fetching village incomings!':
                'Error fetching village incomings!',
            'Total Attacks:': 'Total Attacks:',
            'Total Large Attacks:': 'Total Large Attacks:',
            'Total Noble Attacks:': 'Total Noble Attacks:',
            'Total Villages:': 'Total Villages:',
            'Average attacks per village:': 'Average attacks per village:',
            'Could not find villages being attacked!':
                'Could not find villages being attacked!',
            'Player:': 'Player:',
            Village: 'Village',
            Coords: 'Coords',
            'Total Medium Attacks:': 'Total Medium Attacks:',
            'Total Small Attacks:': 'Total Small Attacks:',
            Players: 'Players',
            "You can't sort elements if any one is a descendant of another.":
                "You can't sort elements if any one is a descendant of another.",
            'sort this column': 'sort this column',
        },
      pt_BR: {
    'Get Incs for Player': 'Obter ataques para o jogador',
    Help: 'Ajuda',
    'There was an error!': 'Ocorreu um erro!',
    'Script must be executed from Player Info screen!':
        'O script deve ser executado a partir da tela de informações do jogador!',
    Fetching: 'Carregando',
    'Fetching incomings for each village...':
        'Buscando ataques recebidos para cada aldeia...',
    'Error fetching village incomings!':
        'Erro ao buscar ataques recebidos da aldeia!',
    'Total Attacks:': 'Total de ataques:',
    'Total Large Attacks:': 'Total de ataques grandes:',
    'Total Noble Attacks:': 'Total de ataques com nobre:',
    'Total Villages:': 'Total de aldeias:',
    'Average attacks per village:': 'Média de ataques por aldeia:',
    'Could not find villages being attacked!':
        'Não foi possível encontrar aldeias sendo atacadas!',
    'Player:': 'Jogador:',
    Village: 'Aldeia',
    Coords: 'Coordenadas',
    'Total Medium Attacks:': 'Total de ataques médios:',
    'Total Small Attacks:': 'Total de ataques pequenos:',
    Players: 'Jogadores',
    "You can't sort elements if any one is a descendant of another.":
        "Não é possível ordenar elementos se algum for descendente de outro.",
    'sort this column': 'ordenar esta coluna',
},
        fr_FR: {
            'Get Incs for Player':
                'RÃ©cupÃ©rer les attaques entrantes pour le Joueur',
            Help: 'Aide',
            'There was an error!': 'There was an error!',
            'Script must be executed from Player Info screen!':
                "Le script doit Ãªtre executÃ© depuis le profil d'un joueur!",
            Fetching: 'Chargement',
            'Fetching incomings for each village...':
                'Chargement des ordres pour chaque village ...',
            'Error fetching village incomings!':
                'Erreur dans le chargement des ordres!',
            'Total Attacks:': 'Total - Attaque envoyÃ©es:',
            'Total Large Attacks:': 'Total - Attaque de grande envergure:',
            'Total Noble Attacks:': 'Total - Attaque de noble:',
            'Total Villages:': 'Total - Villages:',
            'Average attacks per village:': 'Moyenne - Attaque par village:',
            'Could not find villages being attacked!':
                'Impossible de trouver les villages attaquÃ©s!',
            'Player:': 'Joueur:',
            Village: 'Village',
            Coords: 'CoordonnÃ©es',
            'Total Medium Attacks:': 'Total - Attaque de moyenne envergure:',
            'Total Small Attacks:': 'Total - Attaque de petite envergure::',
            Players: 'Joueurs',
            "You can't sort elements if any one is a descendant of another.":
                "You can't sort elements if any one is a descendant of another.",
            'sort this column': 'sort this column',
        },
    },
    allowedMarkets: [],
    allowedScreens: ['info_player'],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();
        const isValidScreen = twSDK.checkValidLocation('screen');

        // Entry point
        if (isValidScreen) {
            try {
                initGetIncsForPlayer();
            } catch (error) {
                UI.ErrorMessage(twSDK.tt('There was an error!'));
                console.error(`${scriptInfo} Error:`, error);
            }
        } else {
            UI.ErrorMessage(
                twSDK.tt('Script must be executed from Player Info screen!')
            );
        }

        // Inititialize script logic
        function initGetIncsForPlayer() {
            // get all player villages
            if (jQuery('#villages_list tr:last a').attr('href') === '#') {
                jQuery('#villages_list tr:last a').trigger('click');
            }

            setTimeout(() => {
                // collect village links to fetch
                let villagesLinks = [];
                const links = jQuery('#villages_list td a').not('.ctx');

                links.each(function () {
                    const hasIncsOrNot = jQuery(this)
                        .parent()
                        .parent()
                        .parent()
                        .parent()
                        .parent()
                        .parent()
                        .parent()
                        .find('> td:eq(1)')
                        .find('span.command-attack-ally, span.command-attack');

                    // only add village on the to be fetched list if there are incs going on this village
                    if (hasIncsOrNot.length) {
                        const villageLink = jQuery(this).attr('href');
                        villagesLinks.push(villageLink);
                    }
                });

                if (villagesLinks.length) {
                    // Show progress bar and notify user
                    twSDK.startProgressBar(villagesLinks.length);
                    UI.SuccessMessage(
                        twSDK.tt('Fetching incomings for each village...')
                    );

                    // fetch all data
                    const villageIncs = [];
                    twSDK.getAll(
                        villagesLinks,
                        function (index, data) {
                            twSDK.updateProgressBar(
                                index,
                                villagesLinks.length
                            );

                            const htmlDoc = jQuery.parseHTML(data);
                            const commandsOutgoingVillageId = parseInt(
                                jQuery(htmlDoc)
                                    .find('#commands_outgoings')
                                    .attr('data-village')
                            );

                            const villageName = jQuery(htmlDoc)
                                .find('#content_value h2')
                                .text()
                                .trim();
                            const villageCoords = jQuery(htmlDoc)
                                .find(
                                    '#content_value > table > tbody > tr > td:nth-child(1) > table:nth-child(1) > tbody > tr:nth-child(3) > td:nth-child(2)'
                                )
                                .text()
                                .trim();

                            const commands = [];

                            const commandsEl = jQuery(htmlDoc).find(
                                '#commands_outgoings tr.command-row'
                            );
                            commandsEl.each(function () {
                                const commandImg = jQuery(this)
                                    ?.find('img:eq(0)')
                                    ?.attr('src')
                                    ?.split('/')
                                    ?.pop()
                                    ?.split('#')[0]
                                    ?.split('?')[0];
                                const nobleImg = jQuery(this)
                                    ?.find('img:eq(1)')
                                    ?.attr('src')
                                    ?.split('/')
                                    ?.pop()
                                    ?.split('#')[0]
                                    ?.split('?')[0];

                                let attackingPlayer = jQuery(this)
                                    .find('.quickedit-label')
                                    .text()
                                    .trim();
                                attackingPlayer = attackingPlayer.split(':')[0];

                                commands.push({
                                    commandImg: commandImg,
                                    nobleImg: nobleImg,
                                    attackingPlayer: attackingPlayer,
                                });
                            });

                            const attacksType = commands.map(
                                (item) => item.commandImg
                            );
                            const nobleAttacks = commands.map(
                                (item) => item.nobleImg
                            );

                            const commandsFrequency =
                                frequencyCounter(attacksType);
                            const noblesFrequency =
                                frequencyCounter(nobleAttacks);

                            let commandsAttack = !isNaN(
                                commandsFrequency['attack.webp']
                            )
                                ? commandsFrequency['attack.webp']
                                : 0;
                            let commandsAttackSmall = !isNaN(
                                commandsFrequency['attack_small.webp']
                            )
                                ? commandsFrequency['attack_small.webp']
                                : 0;
                            let commandsAttackMedium = !isNaN(
                                commandsFrequency['attack_medium.webp']
                            )
                                ? commandsFrequency['attack_medium.webp']
                                : 0;
                            let commandsAttackLarge = !isNaN(
                                commandsFrequency['attack_large.webp']
                            )
                                ? commandsFrequency['attack_large.webp']
                                : 0;

                            const attackingPlayersList = commands.map(
                                (command) => command.attackingPlayer
                            );

                            const attacks =
                                commandsAttack +
                                commandsAttackSmall +
                                commandsAttackMedium +
                                commandsAttackLarge;

                            if (!isNaN(attacks)) {
                                villageIncs.push({
                                    villageId: parseInt(
                                        commandsOutgoingVillageId
                                    ),
                                    villageName: villageName,
                                    villageCoords: villageCoords,
                                    attacksCount: attacks,
                                    largeAttacksCount:
                                        commandsAttackLarge > 0
                                            ? commandsAttackLarge
                                            : 0,
                                    mediumAttacksCount:
                                        commandsAttackMedium > 0
                                            ? commandsAttackMedium
                                            : 0,
                                    smallAttacksCount:
                                        commandsAttackSmall > 0
                                            ? commandsAttackSmall
                                            : 0,
                                    nobleAttacksCount:
                                        noblesFrequency['snob.webp'] > 0
                                            ? noblesFrequency['snob.webp']
                                            : 0,
                                    attackingPlayers: attackingPlayersList,
                                });
                            }

                            let largeAttacksCount = ``;
                            if (commandsFrequency['attack_large.webp'] > 0) {
                                largeAttacksCount = `
                                    <span style="width:30px;display:inline-block;">
                                        <img src="/graphic/command/attack_large.webp" style="transform: translateY(2px);">
                                        ${commandsFrequency['attack_large.webp']}
                                    </span>
                                `;
                            }

                            let mediumAttacksCount = ``;
                            if (commandsFrequency['attack_medium.webp'] > 0) {
                                mediumAttacksCount = `
                                    <span style="width:30px;display:inline-block;">
                                        <img src="/graphic/command/attack_medium.webp" style="transform: translateY(2px);">
                                        ${commandsFrequency['attack_medium.webp']}
                                    </span>
                                `;
                            }

                            let smallAttacksCount = ``;
                            if (commandsFrequency['attack_small.webp'] > 0) {
                                smallAttacksCount = `
                                    <span style="width:30px;display:inline-block;">
                                        <img src="/graphic/command/attack_small.webp" style="transform: translateY(2px);">
                                        ${commandsFrequency['attack_small.webp']}
                                    </span>
                                `;
                            }

                            let nobleAttacksCount = ``;
                            if (noblesFrequency['snob.webp'] > 0) {
                                nobleAttacksCount = `
                                    <span style="width:30px;display:inline-block;">
                                        <img src="/graphic/command/snob.webp" style="transform: translateY(2px);">
                                        ${noblesFrequency['snob.webp']}
                                    </span>
                                `;
                            }

                            const placeToBeAdded = jQuery(
                                `#villages_list tr span.village_anchor[data-id="${commandsOutgoingVillageId}"]`
                            )
                                .parent()
                                .parent()
                                .parent()
                                .parent()
                                .parent()
                                .parent()
                                .find('> td:eq(1)');
                            jQuery(placeToBeAdded).append(`
                                <span>
                                    (${attacks})
                                </span>
						        ${nobleAttacksCount}
						        ${largeAttacksCount}
						        ${mediumAttacksCount}
						        ${smallAttacksCount}
					        `);
                        },
                        function () {
                            let attacksCountList = [];
                            let largeAttacksCountList = [];
                            let mediumAttacksCountList = [];
                            let smallAttacksCountList = [];
                            let nobleAttacksCountList = [];

                            const villagesWithRealIncomings =
                                villageIncs.filter((village) => {
                                    return (
                                        village.largeAttacksCount > 0 ||
                                        village.nobleAttacksCount > 0 ||
                                        village.mediumAttacksCount > 0
                                    );
                                });

                            const villagesWithRealIncomingsTable =
                                buildVillageIncomingsTable(
                                    villagesWithRealIncomings
                                );

                            villageIncs.forEach((item) => {
                                const {
                                    attacksCount,
                                    largeAttacksCount,
                                    mediumAttacksCount,
                                    smallAttacksCount,
                                    nobleAttacksCount,
                                } = item;
                                attacksCountList.push(attacksCount);
                                largeAttacksCountList.push(largeAttacksCount);
                                mediumAttacksCountList.push(mediumAttacksCount);
                                smallAttacksCountList.push(smallAttacksCount);
                                nobleAttacksCountList.push(nobleAttacksCount);
                            });

                            const totalIncs =
                                calculateTotalIncs(attacksCountList);
                            const totalLargeAttacks = calculateTotalIncs(
                                largeAttacksCountList
                            );
                            const totalMediumAttacks = calculateTotalIncs(
                                mediumAttacksCountList
                            );
                            const totalSmallAttacks = calculateTotalIncs(
                                smallAttacksCountList
                            );
                            const totalNobleAttacks = calculateTotalIncs(
                                nobleAttacksCountList
                            );
                            const averageIncsPerVillage = parseFloat(
                                totalIncs / villageIncs.length
                            ).toFixed(2);
                            const playerName = jQuery('#content_value h2')
                                .text()
                                .trim();

                            const content = `
                                <table class="ra-table ra-table-v3" width="100%">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <b>${twSDK.tt('Player:')}</b>
                                            </td>
                                            <td>
                                                <b>${playerName}</b>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <b>${twSDK.tt(
                                                    'Total Villages:'
                                                )}</b>
                                            </td>
                                            <td>
                                                <b>${villageIncs.length}</b>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <b>${twSDK.tt(
                                                    'Total Attacks:'
                                                )}</b>
                                            </td>
                                            <td>
                                                <b>${twSDK.formatAsNumber(
                                                    totalIncs
                                                )}</b>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <b>${twSDK.tt(
                                                    'Total Noble Attacks:'
                                                )}</b>
                                            </td>
                                            <td>
                                                <b>${twSDK.formatAsNumber(
                                                    totalNobleAttacks
                                                )}</b>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <b>${twSDK.tt(
                                                    'Total Large Attacks:'
                                                )}</b>
                                            </td>
                                            <td>
                                                <b>${twSDK.formatAsNumber(
                                                    totalLargeAttacks
                                                )}</b>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <b>${twSDK.tt(
                                                    'Total Medium Attacks:'
                                                )}</b>
                                            </td>
                                            <td>
                                                <b>${twSDK.formatAsNumber(
                                                    totalMediumAttacks
                                                )}</b>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <b>${twSDK.tt(
                                                    'Total Small Attacks:'
                                                )}</b>
                                            </td>
                                            <td>
                                                <b>${twSDK.formatAsNumber(
                                                    totalSmallAttacks
                                                )}</b>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <b>${twSDK.tt(
                                                    'Average attacks per village:'
                                                )}</b>
                                            </td>
                                            <td>
                                                <b>${averageIncsPerVillage}</b>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div class="ra-table-container ra-mt15 ra-mb15">
                                    ${villagesWithRealIncomingsTable}
                                </div>
                            `;

                            twSDK.renderFixedWidget(
                                content,
                                scriptConfig.scriptData.prefix,
                                'ra-get-incomings-player',
                                null,
                                '440px'
                            );
                            addIncommingTableSorting();
                        },
                        function (error) {
                            UI.ErrorMessage(
                                twSDK.tt('Error fetching village incomings!')
                            );
                            console.error(`${scriptInfo} Error:`, error);
                        }
                    );
                } else {
                    UI.InfoMessage(
                        twSDK.tt('Could not find villages being attacked!')
                    );
                }
            }, 2000);
        }

        // Adds basic sorting to IncommingsTable
        function addIncommingTableSorting() {
            jQuery.fn.sortElements = (function () {
                var t = [].sort;
                return function (e, n) {
                    n =
                        n ||
                        function () {
                            return this;
                        };
                    var r = this.map(function () {
                        var t = n.call(this),
                            e = t.parentNode,
                            r = e.insertBefore(
                                document.createTextNode(''),
                                t.nextSibling
                            );
                        return function () {
                            if (e === this)
                                throw Error(
                                    tt(
                                        "You can't sort elements if any one is a descendant of another."
                                    )
                                );
                            e.insertBefore(this, r), e.removeChild(r);
                        };
                    });
                    return t.call(this, e).each(function (t) {
                        r[t].call(n.call(this));
                    });
                };
            })();
            var table = $('.ra-table');
            $('.ra-table th')
                .wrapInner(`<span title="${twSDK.tt('sort this column')}"/>`)
                .each(function () {
                    var t = $(this),
                        e = t.index(),
                        n = !1;
                    t.click(function () {
                        table
                            .find('td')
                            .filter(function () {
                                return $(this).index() === e;
                            })
                            .sortElements(
                                function (t, e) {
                                    let r, i;
                                    return (
                                        isNaN(parseInt($.text([t]).trim()))
                                            ? ((r = $.text([t])),
                                              (i = $.text([e])))
                                            : ((r = parseInt(
                                                  $.text([t]).trim()
                                              )),
                                              (i = parseInt(
                                                  $.text([e]).trim()
                                              ))),
                                        r > i ? (n ? -1 : 1) : n ? 1 : -1
                                    );
                                },
                                function () {
                                    return this.parentNode;
                                }
                            ),
                            (n = !n);
                    });
                });
        }

        // Build the table of villages with real incomings
        function buildVillageIncomingsTable(villages) {
            if (villages.length === 0) return '';

            let tableRows = ``;

            villages.forEach((village) => {
                const {
                    villageId,
                    villageName,
                    villageCoords,
                    attacksCount,
                    largeAttacksCount,
                    mediumAttacksCount,
                    smallAttacksCount,
                    nobleAttacksCount,
                    attackingPlayers,
                } = village;

                const attackingPlayerWithFrequencies =
                    frequencyCounter(attackingPlayers);

                let attackingPlayersHtml = ``;

                for (let [key, value] of Object.entries(
                    attackingPlayerWithFrequencies
                )) {
                    attackingPlayersHtml += `${key} (${value})<br>`;
                }

                tableRows += `
                    <tr>
                        <td class="ra-tal">
                            <a href="/game.php?screen=info_village&id=${villageId}" target="_blank" rel="noopener noreferrer">
                                ${villageName}
                            </a>
                        </td>
                        <td>
                            ${villageCoords}
                        </td>
                        <td>
                            ${twSDK.formatAsNumber(attacksCount)}
                        </td>
                        <td>
                            ${twSDK.formatAsNumber(nobleAttacksCount)}
                        </td>
                        <td>
                            ${twSDK.formatAsNumber(largeAttacksCount)}
                        </td>
                        <td>
                            ${twSDK.formatAsNumber(mediumAttacksCount)}
                        </td>
                        <td>
                            ${twSDK.formatAsNumber(smallAttacksCount)}
                        </td>
                        <td>
                            ${attackingPlayersHtml}
                        </td>
                    </tr>
                `;
            });

            return `
                <table class="ra-table ra-table-v3" width="100%">
                    <thead>
                        <tr>
                            <th class="ra-tal">
                                ${twSDK.tt('Village')}
                            </th>
                            <th>
                                ${twSDK.tt('Coords')}
                            </th>
                            <th>
                                <img src="/graphic/command/attack.webp">
                            </th>
                            <th>
                                <img src="/graphic/command/snob.webp">
                            </td>
                            <th>
                                <img src="/graphic/command/attack_large.webp">
                            </td>
                            <th>
                                <img src="/graphic/command/attack_medium.webp">
                            </td>
                            <th>
                                <img src="/graphic/command/attack_small.webp">
                            </td>
                            <th>
                                ${twSDK.tt('Players')}
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            `;
        }

        // Helper: Count how many times an item appears on an array
        function frequencyCounter(array) {
            return array.reduce(function (acc, curr) {
                if (typeof acc[curr] == 'undefined') {
                    acc[curr] = 1;
                } else {
                    acc[curr] += 1;
                }
                return acc;
            }, {});
        }

        // Helper: Calculate total incomings
        function calculateTotalIncs(villageIncs) {
            return villageIncs.reduce(function (prev, cur) {
                return prev + cur;
            }, 0);
        }
    }
);
