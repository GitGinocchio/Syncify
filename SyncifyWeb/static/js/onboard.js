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

const messages = [
    "Welcome to Syncify",  // English
    "Benvenuto su Syncify", // Italian
    "Bienvenue sur Syncify", // French
    "Willkommen bei Syncify" // German
];
  
  let messageIndex = 0;
  const typingSpeed = 150;
  const pauseAfterTyping = 2000;  // Pausa prima di cancellare
  const titleElement = document.getElementById('title-text');
  
  function typeMessage() {
    let currentMessage = messages[messageIndex];
    let charIndex = 0;
    titleElement.style.width = "100%"; // Reset della larghezza prima della scrittura
  
    function typeChar() {
      if (charIndex < currentMessage.length) {
        titleElement.textContent += currentMessage.charAt(charIndex);
        charIndex++;
        setTimeout(typeChar, typingSpeed);
      } else {
        setTimeout(startDeletion, pauseAfterTyping); // Pausa prima della cancellazione
      }
    }
  
    function startDeletion() {
      titleElement.style.width = "0"; // Riduce la larghezza a 0 con una transizione fluida
      setTimeout(() => {
        titleElement.textContent = ''; // Pulisci il testo dopo la transizione
        messageIndex = (messageIndex + 1) % messages.length;
        typeMessage(); // Inizia il prossimo messaggio
      }, 1000); // Tempo corrispondente alla durata della transizione
    }
  
    typeChar();
  }
  
  window.onload = typeMessage;
  