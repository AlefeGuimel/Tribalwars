(function () {
    'use strict';

    const recursos = [
        { nome: 'wood', estoque: '#premium_exchange_stock_wood', capacidade: '#premium_exchange_capacity_wood', span: '#wood' },
        { nome: 'stone', estoque: '#premium_exchange_stock_stone', capacidade: '#premium_exchange_capacity_stone', span: '#stone' },
        { nome: 'iron', estoque: '#premium_exchange_stock_iron', capacidade: '#premium_exchange_capacity_iron', span: '#iron' }
    ];

    let emExecucao = false;
    let aguardandoConfirmacao = false;

    function parse(str) {
        return parseInt(str.replace(/\./g, ''), 10) || 0;
    }

    function venderRecurso(recurso, diferenca) {
        const input = document.querySelector(`input[name="sell_${recurso.nome}"]`);
        const botaoCalcular = document.querySelector('#premium_exchange_form > input');
        const spanEl = document.querySelector(recurso.span);

        if (!input || !botaoCalcular || !spanEl) return;

        const atual = parse(spanEl.textContent);
        if (atual < 500) return;

        let limite = atual - 500;
        if (limite < 1) limite = 1;

        const quantidadeFinal = Math.min(diferenca, limite);

        if (botaoCalcular.value !== 'Calcular melhor oferta ') return;

        input.value = quantidadeFinal;
        input.dispatchEvent(new Event('input'));

        setTimeout(() => {
            if (botaoCalcular.value === 'Calcular melhor oferta ') {
                botaoCalcular.click();
                emExecucao = true;
                aguardandoConfirmacao = true;
            }
        }, 100);
    }

    // Observa apenas UM clique de confirmação por venda
    const observer = new MutationObserver(() => {
        if (!aguardandoConfirmacao) return;

        const botaoConfirmar = document.querySelector(
            '#premium_exchange > div > div > div.confirmation-buttons > button.btn.evt-confirm-btn.btn-confirm-yes'
        );

        if (botaoConfirmar) {
            aguardandoConfirmacao = false;
            botaoConfirmar.click();

            // Aguarda 1 segundo para permitir nova venda
            setTimeout(() => {
                emExecucao = false;

                // Atualiza a página após 2 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 5000);
            }, 1000);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    function processarRecursos() {
        if (emExecucao || aguardandoConfirmacao) return;

        for (const recurso of recursos) {
            const estoqueEl = document.querySelector(recurso.estoque);
            const capacidadeEl = document.querySelector(recurso.capacidade);
            const spanEl = document.querySelector(recurso.span);

            if (!estoqueEl || !capacidadeEl || !spanEl) continue;

            const estoque = parse(estoqueEl.textContent);
            const capacidade = parse(capacidadeEl.textContent);
            const atual = parse(spanEl.textContent);

            if (atual < 500) continue;

            const diferenca = capacidade - estoque;
            if (diferenca > 10) {
                venderRecurso(recurso, diferenca);
                return; // processa apenas um por vez
            }
        }
    }

    // Verifica a cada 500ms
    setInterval(processarRecursos, 400);
})();
