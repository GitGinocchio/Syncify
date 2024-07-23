(function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.0.0/socket.io.min.js';
    document.head.appendChild(script);

    const reconnectionAttempts = 3
    const Addresses = [
        `http://localhost:5000/room`,
        `https://975a5844-c932-4a93-861e-435e7007b6c2-00-329tdlss1bik9.janeway.replit.dev:5000/room`
    ]

    // Usa un MutationObserver per rilevare quando il DOM è pronto
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const controlBar = document.querySelector('.main-nowPlayingBar-extraControls');
                if (controlBar && (!document.querySelector('.custom-button'))) {
                    const controlBar = document.querySelector('.main-nowPlayingBar-extraControls'); // Selettore per la barra di controllo

                    const customButton = document.createElement('button');
                    customButton.textContent = 'Connect to Room';
                    customButton.className = 'custom-button';
                    customButton.style.margin = '0 10px';
            
                    customButton.addEventListener('click', () => {
                        showRoomIdDialog();
                    });
            
                    controlBar.appendChild(customButton);
                    observer.disconnect(); // Disconnetti l'observer dopo aver aggiunto il bottone
                }
            }
        });
    });

    // Configura l'observer per monitorare le modifiche nel DOM
    observer.observe(document.body, { childList: true, subtree: true });

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
                Spicetify.PopupModal.hide();
                Connect(roomid)
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

    function tryConnect(url, roomid) {
        return new Promise((resolve, reject) => {
            const socket = io(url, {reconnectionAttempts: reconnectionAttempts});

            socket.on('connect', () => {
                socket.emit('register_spotify_client', roomid)
                resolve(socket); 
            });
        
            socket.on('connect_error', (error) => { 
                socket.close(); 
                reject(error); 
            });
        });
    }

    async function ConnectToFirstAvailableWebSocket(urls, roomid) {
        for (const url of urls) {
            try {
              const socket = await tryConnect(url, roomid);
              console.log(`Socket.IO connection established at: ${url}`);
              return socket;
            } catch (error) {
              // console.error(`Failed to connect to ${url}: ${error.message}`);
            }
          }
          throw new Error('Failed to connect to all provided URLs');
    }

    function Connect(roomid) {
        ConnectToFirstAvailableWebSocket(Addresses, roomid)
        .then((socket) => {
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
                if (Spicetify.Player.isPlaying) {
                    console.log('Pausing playback');
                    Spicetify.Player.pause();
                } else {
                    console.log('Playback is already paused or stopped');
                }
            });
    
            socket.on('connect_error', (error) => {
                console.error('Socket.IO connection error:', error);
                if (Spicetify.Player.isPlaying) {
                    console.log('Pausing playback');
                    Spicetify.Player.pause();
                } else {
                    console.log('Playback is already paused or stopped');
                }
                showErrorDialog('Failed to connect to the room. Please check the Room ID and try again.');
            });
        })
        .catch((error) => {
            console.error('Error connecting to any socket:', error);
        });
    }
})();
