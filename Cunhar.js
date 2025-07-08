// @version 1.5
(function () {
    let cunhado = false;

    function atualizarPaginaAleatoriamente() {
        const tempoAleatorio = Math.floor(Math.random() * (60 - 30 + 1) + 30);
        console.log(`⏳ Atualiza em: ${tempoAleatorio} segundos...`);
        mostrarContagemRegressiva(tempoAleatorio);
        setTimeout(() => {
            location.reload();
        }, tempoAleatorio * 1000);
    }

    function cunharMoedas() {
        const botaoMax = document.getElementById("coin_mint_fill_max");
        if (botaoMax) {
            botaoMax.click();
        }

        const botoes = document.getElementsByTagName("input");
        for (let i = 0; i < botoes.length; i++) {
            if (botoes[i].className === "btn btn-default") {
                botoes[i].click();
                console.log("Clique em botão de cunhar executado.");
                break;
            }
        }
    }

   function verificarValorViaXPath() {
    setInterval(() => {
        const xpath = "/html/body/table/tbody/tr[2]/td[2]/table[3]/tbody/tr/td/table/tbody/tr/td/table/tbody/tr/td/table[2]/tbody/tr/td[2]/table[4]/tbody/tr[10]/td[2]/form/a";
        const resultado = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const elemento = resultado.singleNodeValue;

        if (!elemento) {
            console.warn("❌ Elemento via XPath não encontrado.");
            return;
        }

        const valorTexto = elemento.textContent.trim();
        console.log("📌 Valor lido do XPath:", valorTexto);

        const valorLimpo = valorTexto.replace(/[()]/g, '');
        const valor = parseInt(valorLimpo, 10);

        if (!isNaN(valor)) {
            console.log("🔢 Valor numérico limpo:", valor);
        } else {
            console.warn("⚠️ Ainda não é um número:", valorTexto);
        }

        if (!isNaN(valor) && valor > 1 && !cunhado) {
            console.log(`✅ Valor > 1 (${valor}). Executando cunharMoedas().`);
            cunharMoedas();
            cunhado = true;
            setTimeout(() => {
                cunhado = false;
            }, 5000);
        }
    }, 2000);
}



    function mostrarContagemRegressiva(segundos) {
        let div = document.createElement("div");
        div.id = "contadorAtualizacao";
        div.style.position = "fixed";
        div.style.top = "120px";
        div.style.left = "20px";
        div.style.padding = "10px 15px";
        div.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
        div.style.color = "white";
        div.style.fontSize = "16px";
        div.style.borderRadius = "8px";
        div.style.zIndex = "9999";
        div.style.fontWeight = "bold";
        div.style.fontFamily = "Arial, sans-serif";
        document.body.appendChild(div);

        function atualizarTexto() {
            div.textContent = `⏳ Atualiza em: ${segundos}s`;
            segundos--;
            if (segundos >= 0) {
                setTimeout(atualizarTexto, 1000);
            }
        }

        atualizarTexto();
    }

    // Execuções
    cunharMoedas();
    verificarValorViaXPath();  // ← nova função baseada no valor visível
    atualizarPaginaAleatoriamente();
})();
