const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.0.0/socket.io.min.js';
document.head.appendChild(script);

const reconnectionAttempts = 3;
const Addresses = [
    `http://localhost:5000`,
    `https://syncify.replit.app`,
    `https://975a5844-c932-4a93-861e-435e7007b6c2-00-329tdlss1bik9.janeway.replit.dev`
];


let customButton;
let observer;
let socket;

function createButton() {
    const controlBar = document.querySelector('.main-nowPlayingBar-extraControls');
    if (controlBar && (!document.querySelector('.custom-button'))) {
        customButton = document.createElement('button');
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
                disconnect();
            } else {
                connect();
            }
        });

        controlBar.appendChild(customButton);
        observer.disconnect();
    }
};

function setButtonStatus(connected) {
    if (connected) {
        customButton.textContent = 'Disconnect';
        customButton.style.backgroundColor = '#ff0000';
        customButton.classList.add('connected')
    }
    else {
        customButton.textContent = 'Connect to \nSyncify Room';
        customButton.style.backgroundColor = '#1DB954';
        customButton.classList.remove('connected');
    }
};

function showDialog(title, message) {
    const content = document.createElement('div');
    content.textContent = message;

    Spicetify.PopupModal.display({
        title: title,
        content: content,
        isLarge: false
    });
};

async function attemptConnection(url, user_data) {
    return new Promise((resolve, reject) => {
        const socket = io(url + '/spotifyclient', { reconnectionAttempts: reconnectionAttempts });
        let registered = false;

        socket.on('connect', () => {
            if (registered) { return; }

            socket.emit('register_spotify_client',user_data);
        });

        socket.on('syncify-spicetify-send-challenge', (userid, challengeid) => {
            window.open(url + '/challenge?userid=' + userid + '&code=' + challengeid , '_blank');
        });

        socket.on('syncify-spicetify-registered', (trackid, seekTime) => {
            registered = true;
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
        
            const seekTimeMilliseconds = parseFloat(seekTime) * 1000; // Converti il minutaggio in secondi

            if (currentTrackUri === trackUri) {
                // Se la canzone è già in corso, vai al minutaggio specificato
                Spicetify.Player.play();
                Spicetify.Player.seek(parseInt(seekTimeMilliseconds));
            } else {
                // Altrimenti, riprova la canzone dal principio
                Spicetify.Player.playUri(trackUri);
                Spicetify.Player.pause();
                Spicetify.Player.play();
                Spicetify.Player.seek(parseInt(seekTimeMilliseconds));
            }
        
            resolve(socket);
        });

        socket.on('syncify-spicetify-server-error', (error) => {
            socket.close();
            reject({'type' : 'invalid-roomid','title' : "Syncify Server Error", 'message' : error, 'fatal' : true});
        });

        socket.on('connect_error', (error) => {
            socket.close();
            reject({'type' : 'connection-error', 'title' : "Syncify Server Connection Error", 'message' : error, 'fatal' : false});
        });
    });
};

async function findAvailableConnection() {
    const user_data = await Spicetify.CosmosAsync.get("https://api.spotify.com/v1/me");
    for (const url of Addresses) {
        try {
            socket = await attemptConnection(url,user_data);
            console.log(`Socket.IO connection established at: ${url}`);
            setButtonStatus(true);
            return socket;
        } catch (error) {
            if (error.fatal) { throw new Error(error.message); }
        }
    }
    throw new Error('Failed to connect to any Syncify Server. Try again later...');
};

async function connect() {
    findAvailableConnection()
       .then((socket) => {
        socket.on('syncify-spicetify-play', (trackid, seekTime) => {
            console.log(`Play request received with trackid: ${trackid} and seektime: ${seekTime}`);

            const trackUri = `spotify:track:${trackid}`;
            const currentTrackUri = Spicetify.Player.data?.item.uri;

            if (Spicetify.Player.isPlaying) {
                Spicetify.Player.pause();
            }

            const seekTimeMilliseconds = parseFloat(seekTime) * 1000; // Converti il minutaggio in secondi

            if (currentTrackUri === trackUri) {
                // Se la canzone è già in corso, vai al minutaggio specificato
                Spicetify.Player.play();
                Spicetify.Player.seek(parseInt(seekTimeMilliseconds));
            } else {
                // Altrimenti, riprova la canzone dal principio
                Spicetify.Player.playUri(trackUri);
                Spicetify.Player.pause();
                Spicetify.Player.play();
                Spicetify.Player.seek(parseInt(seekTimeMilliseconds));
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
            disconnect();
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
            disconnect();
        });
       })
       .catch((error) => {
            showDialog('Syncify Error:', error);
            console.log('Syncify Error:', error);
            disconnect();
       })
};

function disconnect() {
    setButtonStatus(false);
    if (socket) { socket.close(); socket = null; }
}

observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => { createButton(); });
});

// Configura l'observer per monitorare le modifiche nel DOM
observer.observe(document.body, { childList: true, subtree: true });