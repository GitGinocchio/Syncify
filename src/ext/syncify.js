const reconnectionAttempts = 3;
const Addresses = [
    `http://127.0.0.1:8787`,
    `https://syncify.ginocchio.workers.dev/`
];

let customButton;
let syncify_observer;
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
        socket = new WebSocket(`${url.replace("https", "ws").replace("http", "ws")}/auth/${user_data.id}`);

        socket.addEventListener("open", (event) => {
            const data = JSON.stringify({
                user : user_data,
                platform  : Spicetify.Platform.PlatformData, 
                locale    : Spicetify.Platform.Session.locale,
                type : 'auth'
            });

            socket.send(data);
        });

        socket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);

            if (data.status == 'success') {
                window.open(`${url}/challenge?code=${data.id}`, '_blank');
                resolve(socket); 
            }

            reject({'type' : 'connection-error', 'title' : "Syncify Server Connection Error", 'message' : event.reason, 'fatal' : true})
        });

        socket.addEventListener("close", (event) => {
            console.log("disconnected");
            if (socket) { socket.close(); }
            disconnect();
            reject({'type' : 'connection-error', 'title' : "Syncify Server Connection Error", 'message' : event.reason, 'fatal' : true});
        });
    });
};

async function findAvailableConnection() {
    const user_data = await Spicetify.CosmosAsync.get("https://api.spotify.com/v1/me");
    for (const url of Addresses) {
        try {
            socket = await attemptConnection(url,user_data);
            console.log(`WebSocket connection established at: ${url}`);
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

syncify_observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => { createButton(); });
});

// Configura l'observer per monitorare le modifiche nel DOM
syncify_observer.observe(document.body, { childList: true, subtree: true });