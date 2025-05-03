const MAX_CONNECTIONS_ATTEMPTS = 3;
const Addresses = [
    `http://127.0.0.1:8787`,
    `https://syncify.giulioo.workers.dev`,
];

let customButton;
let syncify_observer;
let socket;
let disconnectedByUser = false;
let attempts = 0;

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
                showDialog("Disconnected", "Successfully disconnected from Syncify servers!")
                disconnectedByUser = true;
                disconnect();
            } else {
                disconnectedByUser = false;
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
        socket = new WebSocket(`${url.replace("https", "wss").replace("http", "ws")}/auth/${user_data.id}`);

        socket.addEventListener("open", (event) => {
            const data = JSON.stringify({
                user : user_data,
                platform  : Spicetify.Platform.PlatformData, 
                locale    : Spicetify.Platform.Session.locale,
                type : 'auth'
            });

            socket.send(data);
            console.log("Attempting to connect to Syncify server...")
        });

        socket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);

            if (data.status == 'finalize') {
                window.open(`${url}/challenge?code=${data.id}`, '_blank');
                console.log("Syncify server connection successful and finalization needed.")
                resolve(socket);
            }
            else if (data.status == 'success') {
                console.log("Syncify server connection successful and finalization NOT needed.")
                resolve(socket); 
            }

            reject({'type' : 'connection-error', 'title' : "Syncify Server Connection Error", 'message' : event.reason, 'fatal' : true})
        });

        socket.addEventListener("close", (event) => {
            disconnect();
            if (!disconnectedByUser && attempts < MAX_CONNECTIONS_ATTEMPTS) {
                showDialog("Connection Closed",`Socket closed: ${event.reason}, trying to establish a new connection...`);
                attempts += 1;
                resolve(attemptConnection(url, user_data));
            }
            else if (!disconnectedByUser) {
                showDialog("Connection Closed",`Socket closed: ${event.reason}, no more attempts left.`);
                reject({'type' : 'connection-error', 'title' : "Syncify Server Connection Error", 'message' : event.reason, 'fatal' : true});
            }
            // reject({'type' : 'connection-error', 'title' : "Syncify Server Connection Error", 'message' : event.reason, 'fatal' : true});
        });
    });
};

async function findAvailableConnection() {
    const user_data = await Spicetify.CosmosAsync.get("https://api.spotify.com/v1/me");
    for (const url of Addresses) {
        try {
            socket = await attemptConnection(url,user_data);
            //showDialog('Success', "You are now successfully connected to Syncify\nlets listen to some good music together!");
            showDialog('Success', "You are now successfully connected to Syncify\nlets listen to some good music together!");
            return socket;
        } catch (error) {
            if (error.fatal) { throw new Error(error.message); }
        }
    }
    throw new Error('Failed to connect to any selected Syncify Server. Try again later...');
};

async function searchSong(socket, event, data) {
    console.log(data);
    console.log(`https://api.spotify.com/v1/search?q=${data.query}&type=track,album,playlist,show,episode,audiobook&market=${Spicetify.Platform.Session.locale}`);
    
    const search_results = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q=${data.query}&type=track,album,playlist,show,episode,audiobook&limit=10&market=${Spicetify.Platform.Session.locale}`);

    const response = {
        type : "search-results",
        results : search_results,
        roomid : data.roomid,
        userid : data.userid
    }

    socket.send(JSON.stringify(response));
}

async function connect() {
    showDialog("Alomost there!", `Just a moment while we try to connect you with Syncify Servers...`);
    setButtonStatus(true);
    findAvailableConnection()
    .then(
    (socket) => {
        socket.addEventListener("message",async (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'search-song':
                    await searchSong(socket, event, data);
                    break;
            }
        });

        // We need to implement the logic to handle the connection here
    }, 
    (reason) => {
        console.log(reason);
        if (reason.fatal) showDialog(reason.title, reason.message);
    })
    .catch((error) => {
        showDialog('Syncify Error', error.message);
        disconnect();
    })
};

function disconnect() {
    setButtonStatus(false);
    if (socket) { socket.close(); socket = null; }
}

syncify_observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => { createButton(); });
});

// Configura l'observer per monitorare le modifiche nel DOM
syncify_observer.observe(document.body, { childList: true, subtree: true });