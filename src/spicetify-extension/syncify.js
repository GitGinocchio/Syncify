(function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.0.0/socket.io.min.js';
    document.head.appendChild(script);

    // Funzione per aggiungere un bottone alla UI di Spotify
    function addCustomButton() {
        const controlBar = document.querySelector('.main-nowPlayingBar-extraControls'); // Selettore per la barra di controllo
        // Crea un nuovo bottone
        const customButton = document.createElement('button');
        customButton.textContent = 'Connect to Room';
        customButton.className = 'custom-button'; // Aggiungi una classe per lo stile
        customButton.style.margin = '0 10px'; // Aggiungi qualche stile per il margine

        // Aggiungi un listener per il click
        customButton.addEventListener('click', () => {
            // Mostra una finestra di dialogo per l'inserimento del roomid
            showRoomIdDialog();
        });

        // Aggiungi il bottone alla barra di controllo
        controlBar.appendChild(customButton);
    }

    // Funzione per mostrare la finestra di dialogo per inserire il roomid
    function showRoomIdDialog() {
        const modalContent = document.createElement('div');
        
        // Crea un campo di input per il roomid
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter Room ID';
        input.style.width = '100%';
        input.style.marginBottom = '10px';
        
        modalContent.appendChild(input);

        // Crea un bottone per confermare l'inserimento
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Connect';
        submitButton.addEventListener('click', () => {
            const roomid = input.value.trim();
            if (roomid) {
                Spicetify.PopupModal.hide(); // Nascondi il modale
                initSocketIO(roomid); // Avvia la connessione Socket.IO con il roomid fornito
            }
        });

        modalContent.appendChild(submitButton);

        // Mostra il modale
        Spicetify.PopupModal.display({
            title: 'Enter Room ID',
            content: modalContent,
            isLarge: true
        });
    }

    // Funzione per mostrare una finestra di dialogo personalizzata per gli errori
    function showErrorDialog(message) {
        const errorContent = document.createElement('div');
        errorContent.textContent = message;

        // Mostra la finestra di dialogo per l'errore
        Spicetify.PopupModal.display({
            title: 'Error',
            content: errorContent,
            isLarge: false
        });
    }

    // Funzione per inizializzare la connessione Socket.IO
    function initSocketIO(roomid) {
        const socket = io(`https://975a5844-c932-4a93-861e-435e7007b6c2-00-329tdlss1bik9.janeway.replit.dev:5000`); // `https://975a5844-c932-4a93-861e-435e7007b6c2-00-329tdlss1bik9.janeway.replit.dev:5000` `http://localhost:5000`

        socket.on('connect', () => {
            console.log('Socket.IO connection established');
        });

        socket.on('syncify-spicetify-play', (trackid) => {
            console.log('Play request received');
            
            const trackUri = `spotify:track:${trackid}`;
            const currentTrackUri = Spicetify.Player.data?.item.uri;

            if (Spicetify.Player.isPlaying) {
                Spicetify.Player.pause();
            }

            if (currentTrackUri === trackUri) {
                Spicetify.Player.play()
            } else {
                Spicetify.Player.playUri(trackUri);
            }
        });

        socket.on('syncify-spicetify-stop', () => {
            console.log('Stop request received');
            if (Spicetify.Player.isPlaying) {
                console.log('Pausing playback');
                Spicetify.Player.pause();
            } else {
                console.log('Playback is already paused or stopped');
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO connection closed');
        });

        // Gestisci gli errori di connessione
        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            showErrorDialog('Failed to connect to the room. Please check the Room ID and try again.');
        });
    }

    // Usa un MutationObserver per rilevare quando il DOM è pronto
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const controlBar = document.querySelector('.main-nowPlayingBar-extraControls');
                if (controlBar && (!document.querySelector('.custom-button'))) {
                    addCustomButton();
                    observer.disconnect(); // Disconnetti l'observer dopo aver aggiunto il bottone
                }
            }
        });
    });

    // Configura l'observer per monitorare le modifiche nel DOM
    observer.observe(document.body, { childList: true, subtree: true });
})();
