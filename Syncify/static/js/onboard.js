// Funzione per copiare il contenuto del tag <code> e mostrare il tooltip
document.getElementById('copyButton').addEventListener('click', function() {
    // Seleziona il testo all'interno del tag <code>
    const codeText = document.querySelector('.command-box code').textContent;
    
    // Copia il testo negli appunti
    navigator.clipboard.writeText(codeText).then(() => {
        // Mostra il tooltip
        const tooltip = document.getElementById('tooltip');
        tooltip.classList.add('show');
        
        // Nasconde il tooltip dopo 2 secondi
        setTimeout(() => {
            tooltip.classList.remove('show');
        }, 2000);
        
    }).catch(err => {
        console.error('Errore durante la copia:', err);
    });
});
