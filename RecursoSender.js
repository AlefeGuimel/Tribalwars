(function() {
    'use strict';

    // Configurações padrão
    const DEFAULT_SETTINGS = {
        targetCoordinate: "577|545",
        minDelay: 1 * 60 * 1000,    // 1 minuto
        maxDelay: 5 * 60 * 1000,    // 5 minutos
        minClickDelay: 500,         // 0.5s
        maxClickDelay: 1000,        // 1s
        enabled: false             // Inicia desativado
    };

    // Estado do script
    let settings = {...DEFAULT_SETTINGS};
    let isRunning = false;
    let isCaptchaPresent = false;
    let reloadTimeout;
    let captchaCheckInterval;
    let timerInterval;
    let timeLeft = 0;

    // Carrega configurações salvas
    function loadSettings() {
        const savedSettings = GM_getValue('senderSettings');
        if (savedSettings) {
            settings = {...DEFAULT_SETTINGS, ...savedSettings};
        }
    }

    // Salva configurações
    function saveSettings() {
        GM_setValue('senderSettings', settings);
    }

    // Função para tempo aleatório
    function getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Verifica CAPTCHA
    function checkForCaptcha() {
        const captchaElement = document.querySelector("#captcha_container, .captcha-container, iframe[src*='captcha']");
        if (captchaElement && captchaElement.offsetParent !== null) {
            isCaptchaPresent = true;
            updateStatus("CAPTCHA detectado! Pausado...", "red");
            clearInterval(captchaCheckInterval);
        } else {
            isCaptchaPresent = false;
        }
    }

    // Atualiza o status na UI
    function updateStatus(message, color = "black") {
        $("#senderStatus").text(message).css("color", color);
    }

    // Atualiza o timer na UI
    function updateTimer() {
        if (timeLeft > 0) {
            timeLeft -= 1000;
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            $("#senderTimer").text(`${minutes}m ${seconds}s`);
        }
    }

    // Clica em todos os botões de envio
    function clickAllSendButtons(callback) {
        const sendButtons = document.querySelectorAll("#sendResources");
        if (sendButtons.length === 0) {
            updateStatus("Nenhum botão de envio encontrado");
            if (callback) callback();
            return;
        }

        updateStatus(`Enviando recursos (${sendButtons.length} aldeias)...`, "blue");

        let currentIndex = 0;

        function clickNextButton() {
            if (!isRunning || currentIndex >= sendButtons.length || isCaptchaPresent) {
                if (callback) callback();
                return;
            }

            const button = sendButtons[currentIndex];
            if (button && button.offsetParent !== null) {
                button.click();
                currentIndex++;

                const delay = getRandomDelay(settings.minClickDelay, settings.maxClickDelay);
                setTimeout(clickNextButton, delay);
            } else {
                currentIndex++;
                clickNextButton();
            }
        }

        clickNextButton();
    }

    // Processo principal
    function startProcess() {
        if (!isRunning || isCaptchaPresent) return;

        updateStatus("Iniciando processo...", "green");

        // Carregar script externo
        $.getScript('https://media.innogamescdn.com/com_DS_BR/Scripts/Aprovados/UpdatedResourceSenderForMinting.js')
            .done(function() {
                updateStatus("Script carregado - Preenchendo coordenada...");

                setTimeout(function() {
                    // Preencher coordenada
                    const coordInput = document.querySelector("#coordinateTargetFirstTime");
                    if (coordInput) {
                        coordInput.value = settings.targetCoordinate;

                        setTimeout(function() {
                            // Salvar coordenada
                            const saveButton = document.querySelector("#saveCoord");
                            if (saveButton) {
                                saveButton.click();

                                setTimeout(function() {
                                    // Enviar recursos
                                    clickAllSendButtons(function() {
                                        // Verificar conclusão
                                        const checkButtonsInterval = setInterval(function() {
                                            const buttons = document.querySelectorAll("#sendResources");
                                            const visibleButtons = Array.from(buttons).filter(btn => btn.offsetParent !== null);

                                            if (visibleButtons.length === 0) {
                                                clearInterval(checkButtonsInterval);
                                                updateStatus("Recursos enviados - Agendando recarregamento", "orange");

                                                timeLeft = getRandomDelay(settings.minDelay, settings.maxDelay);
                                                reloadTimeout = setTimeout(function() {
                                                    location.reload();
                                                }, timeLeft);

                                                // Inicia o timer
                                                clearInterval(timerInterval);
                                                timerInterval = setInterval(updateTimer, 1000);
                                            }
                                        }, 1000);
                                    });
                                }, getRandomDelay(settings.minClickDelay, settings.maxClickDelay));
                            }
                        }, getRandomDelay(settings.minClickDelay, settings.maxClickDelay));
                    }
                }, getRandomDelay(settings.minClickDelay, settings.maxClickDelay));
            })
            .fail(function() {
                updateStatus("Falha ao carregar script - Tentando novamente...", "red");
                setTimeout(startProcess, getRandomDelay(settings.minClickDelay, settings.maxClickDelay));
            });
    }

    // Para o script
    function stopProcess() {
        isRunning = false;
        clearTimeout(reloadTimeout);
        clearInterval(timerInterval);
        clearInterval(captchaCheckInterval);
        updateStatus("Script desativado", "gray");
        $("#senderTimer").text("--:--");
    }

    // Cria a interface
    function createUI() {
        // Remove UI existente se houver
        $("#senderControlPanel").remove();

        // Cria o painel
        const panel = $(`
            <div id="senderControlPanel" style="
                position: fixed;
                top: 100px;
                right: 10px;
                width: 200px;
                background: white;
                border: 1px solid #ccc;
                padding: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
                z-index: 9999;
                font-family: Arial, sans-serif;
            ">
                <h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:5px;">
                    Controle de Envio
                </h3>
                <div>
                    <label>Coordenada:</label>
                    <input type="text" id="senderCoordinate" style="width:100%; margin-bottom:10px;" value="${settings.targetCoordinate}">
                </div>
                <div style="margin-bottom:10px;">
                    <button id="senderToggleBtn" style="width:100%; padding:5px; background-color:${settings.enabled ? '#4CAF50' : '#f44336'}; color:white; border:none;">
                        ${settings.enabled ? 'DESATIVAR' : 'ATIVAR'}
                    </button>
                </div>
                <div>
                    <strong>Status:</strong> <span id="senderStatus">Pronto</span><br>
                    <strong>Próxima atualização:</strong> <span id="senderTimer">--:--</span>
                </div>
            </div>
        `).appendTo("body");

        // Eventos
        $("#senderCoordinate").on("change", function() {
            settings.targetCoordinate = $(this).val();
            saveSettings();
        });

        $("#senderToggleBtn").click(function() {
            settings.enabled = !settings.enabled;
            saveSettings();

            if (settings.enabled) {
                isRunning = true;
                $(this).css("background-color", "#4CAF50").text("DESATIVAR");
                startProcess();
                captchaCheckInterval = setInterval(checkForCaptcha, 5000);
            } else {
                stopProcess();
                $(this).css("background-color", "#f44336").text("ATIVAR");
            }
        });

        // Arrastar o painel
        let isDragging = false;
        let offsetX, offsetY;

        panel.find("h3").css("cursor", "move").on("mousedown", function(e) {
            isDragging = true;
            offsetX = e.clientX - panel[0].getBoundingClientRect().left;
            offsetY = e.clientY - panel[0].getBoundingClientRect().top;
        });

        $(document).on("mousemove", function(e) {
            if (isDragging) {
                panel.css({
                    top: (e.clientY - offsetY) + "px",
                    left: (e.clientX - offsetX) + "px",
                    right: "auto"
                });
            }
        }).on("mouseup", function() {
            isDragging = false;
        });
    }

    // Inicialização
    loadSettings();
    createUI();

    // Se estava ativado, inicia o processo
    if (settings.enabled) {
        isRunning = true;
        startProcess();
        captchaCheckInterval = setInterval(checkForCaptcha, 5000);
    }
})();
