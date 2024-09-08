(function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.0.0/socket.io.min.js';
    document.head.appendChild(script);

    const reconnectionAttempts = 3;
    const Addresses = [
        `http://localhost:5000/client`,
        `https://975a5844-c932-4a93-861e-435e7007b6c2-00-329tdlss1bik9.janeway.replit.dev:5000/client`,
        `https://syncify-4trj.onrender.com/client`,
        `https://syncify.replit.app/client`
    ];

    // Usa un MutationObserver per rilevare quando il DOM è pronto
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const controlBar = document.querySelector('.main-nowPlayingBar-extraControls');
                if (controlBar && (!document.querySelector('.custom-button'))) {
                    const customButton = document.createElement('button');
                    customButton.textContent = 'Connect to \nSyncify Room';
                    customButton.className = 'custom-button';
                    customButton.style.margin = '10px';

                    customButton.style.fontWeight = 'bold';
                    customButton.style.backgroundColor = '#1DB954'; 
                    customButton.style.color = 'white'; 
                    customButton.style.border = 'none'; 
                    customButton.style.borderRadius = '4px'; 
                    customButton.style.padding = '10px 20px';
                    customButton.style.cursor = 'pointer'; 
                    customButton.style.fontSize = '15px'; 
                    customButton.style.whiteSpace = 'pre';

                    customButton.addEventListener('mouseover', () => {
                        if (customButton.classList.contains('connected')) {
                            customButton.style.backgroundColor = '#ff4d4d';
                        } else {
                            customButton.style.backgroundColor = '#1ed760'; 
                        }
                    });

                    customButton.addEventListener('mouseout', () => {
                        if (customButton.classList.contains('connected')) {
                            customButton.style.backgroundColor = '#ff0000';
                        } else {
                            customButton.style.backgroundColor = '#1DB954'; 
                        }
                    });

                    customButton.addEventListener('click', () => {
                        if (customButton.classList.contains('connected')) {
                            Disconnect();
                        } else {
                            Connect();
                        }
                    });

                    controlBar.appendChild(customButton);
                    observer.disconnect(); // Disconnetti l'observer dopo aver aggiunto il bottone
                }
            }
        });
    });

    // Configura l'observer per monitorare le modifiche nel DOM
    observer.observe(document.body, { childList: true, subtree: true });

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

    function tryConnect(url) {
        return new Promise((resolve, reject) => {
            const socket = io(url, { reconnectionAttempts: reconnectionAttempts });
            let registered = false;

            socket.on('connect', () => {
                if (!registered) {
                    socket.emit('register_spotify_client',Spicetify.Platform.LocalStorageAPI.namespace);
                    registered = true;
                }
            });

            socket.on('syncify-spicetify-registered', (trackid, seekTime) => {
                if (trackid === undefined) {
                    if (Spicetify.Player.isPlaying) { Spicetify.Player.pause(); }
                    resolve(socket); return; 
                }

                console.log(`Play request received with trackid: ${trackid} and seektime: ${seekTime}`);
            
                const trackUri = `spotify:track:${trackid}`;
                const currentTrackUri = Spicetify.Player.data?.item.uri;
            
                if (Spicetify.Player.isPlaying) {
                    Spicetify.Player.pause();
                }
            
                if (currentTrackUri === trackUri) {
                    // Se la canzone è già in corso, vai al minutaggio specificato
                    const seekTimeSeconds = parseInt(seekTime) * 60; // Converti il minutaggio in secondi
                    Spicetify.Player.playUri(trackUri);
                    Spicetify.Player.seek(seekTimeSeconds);
                } else {
                    // Altrimenti, riprova la canzone dal principio
                    Spicetify.Player.playUri(trackUri);
                } 
            
                resolve(socket);
            });

            socket.on('syncify-spicetify-server-error', (error) => {
                socket.close();
                reject({'type' : 'invalid-roomid', 'message' : error, 'fatal' : true});
            });

            socket.on('connect_error', (error) => {
                socket.close();
                reject({'type' : 'connection-error', 'message' : error, 'fatal' : false});
            });
        });
    }

    async function ConnectToFirstAvailableWebSocket(urls) {
        for (const url of urls) {
            try {
                const socket = await tryConnect(url);
                console.log(`Socket.IO connection established at: ${url}`);
                return socket;
            } catch (error) {
                if (error.fatal) { throw new Error(error.message); }
            }
        }
        throw new Error('Failed to connect to Syncify. try again later.');
    }

    let socket = null; // Variabile per memorizzare il socket

    function Connect() {
        ConnectToFirstAvailableWebSocket(Addresses)
            .then((s) => {
                socket = s; // Memorizza il socket;
                const customButton = document.querySelector('.custom-button');
                customButton.textContent = 'Disconnect';
                customButton.style.backgroundColor = '#ff0000';
                customButton.classList.add('connected')

                socket.on('syncify-spicetify-play', (trackid, seekTime) => {
                    console.log(`Play request received with trackid: ${trackid} and seektime: ${seekTime}`);

                    const trackUri = `spotify:track:${trackid}`;
                    const currentTrackUri = Spicetify.Player.data?.item.uri;

                    if (Spicetify.Player.isPlaying) {
                        Spicetify.Player.pause();
                    }

                    if (currentTrackUri === trackUri) {
                        // Se la canzone è già in corso, vai al minutaggio specificato
                        const seekTimeSeconds = parseInt(seekTime) * 60; // Converti il minutaggio in secondi
                        Spicetify.Player.playUri(trackUri);
                        Spicetify.Player.seek(seekTimeSeconds);
                    } else {
                        // Altrimenti, riprova la canzone dal principio
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

                socket.on('syncify-spicetify-deleted-room', () => {
                    console.error('Room connection error: Failed to connect to the room. The room has been deleted.');
                    if (Spicetify.Player.isPlaying) {
                        console.log('Pausing playback');
                        Spicetify.Player.pause();
                    } else {
                        console.log('Playback is already paused or stopped');
                    }
                    showErrorDialog('Failed to connect to the room. The room has been deleted.');
                    resetButton();
                });

                socket.on('disconnect', () => {
                    console.log('Socket.IO connection closed');
                    if (Spicetify.Player.isPlaying) {
                        console.log('Pausing playback');
                        Spicetify.Player.pause();
                    } else {
                        console.log('Playback is already paused or stopped');
                    }
                    showErrorDialog('Disconnected from the room.');
                    resetButton();
                });

                socket.on('connect_error', (error) => {
                    console.error('Socket.IO connection error:', error);
                    if (Spicetify.Player.isPlaying) {
                        console.log('Pausing playback');
                        Spicetify.Player.pause();
                    } else {
                        console.log('Playback is already paused or stopped');
                    }
                    showErrorDialog('Failed to connect to the room.');
                    resetButton();
                });
            })
            .catch((error) => {
                showErrorDialog(error);
            });
    }

    function Disconnect() {
        if (socket) { socket.close(); socket = null; }
        resetButton();
    }

    function resetButton() {
        const customButton = document.querySelector('.custom-button');
        customButton.textContent = 'Connect to \nSyncify Room';
        customButton.style.backgroundColor = '#1DB954';
        customButton.classList.remove('connected');
    }
})();
