function toBottom() {
	let messagesContainer = document.getElementById("chat-messages");
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function copyurl(roomid) {
	navigator.clipboard
	.writeText(`${window.location.host}/join/${roomid}`)
	.then(function () {
		alert("Link copiato!");
	})
	.catch(function (err) {
		console.error("Errore durante la copia del link: ", err);
	});
}

document.addEventListener("DOMContentLoaded", (event) => {
    const socket = new WebSocket(`ws://${window.location.host}/room`);

	const messageInput = document.getElementById("message-input");
	const queueInput = document.getElementById("queue-input");

	const clickableArrow = document.querySelector(".arrow");
	const arrows = document.querySelectorAll(".arrow");
	const devicesList = document.getElementById("devices-list");

	const messagesContainer = document.getElementById("chat-messages");
	const membersContainer = document.getElementById("members-container");
	const resultsContainer = document.getElementById("results-search-box");
	const queueContainer = document.getElementById("queue-list");
	const historyContainer = document.getElementById("history-list");
	const currentSongImageContainer = document.getElementById("current-song-image");
	const currentSongDetailsContainer = document.getElementById("current-song-details");
	const currentSongCurrentTime = document.getElementById("current-time");
	const currentSongTotalTime = document.getElementById("total-time");

	const sendMessageButton = document.getElementById("send-message");
	const addSongButton = document.getElementById("send-song");
	const playPauseButton = document.getElementById("playPauseButton");
	const skipButton = document.getElementById("skipButton");
	const backButton = document.getElementById("backButton");
	const progressBar = document.getElementById("progress");

	messagesContainer.scrollTop = messagesContainer.scrollHeight;

	var progressInterval;
	let debounceTimeout;

	function onMessage(data) {
		const messageElement = document.createElement("div");
		messageElement.classList.add("message");
		if (data.sender.type == "me") {
			messageElement.classList.add("my-message");
		}
		else if (data.sender.type == "user") {
			messageElement.classList.add("other-message");
		}
		else {
			messageElement.classList.add("system-message");
		}
		messageElement.innerHTML = `
			<div class="sender">
				<img src="${data.sender.image}">
				<p>${data.sender.name}</p>
			</div>
			<p class="mess">${data.message}</p>
		`;
		messagesContainer.appendChild(messageElement);
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}

	function onMemberJoined(data) {
		const memberElement = document.createElement("li");
		memberElement.id = data.id;
		memberElement.innerHTML = `
	  		<img src="${data.image}" alt="account icon" class="member-icon">
	  		<p class="member-name">${data.name}</p>
		`;
		membersContainer.appendChild(memberElement);
	}

	function onMemberLeft(data) {
		const memberElement = document.getElementById(data.id);
		if (memberElement) {
			membersContainer.removeChild(memberElement);
		}
	}

    socket.addEventListener("open", (event) => {
        console.log(`Connected to the server: ${window.location.pathname}`);
    });

    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case "message":
				onMessage(data);
				break;
			case "member_joined":
				onMemberJoined(data);
				break;
			case "member_left":
				onMemberLeft(data);
				break;
			case "default":
				console.log("WebSocket message not recognized: ", data);
				break;
        }
    });

	sendMessageButton.addEventListener("click", () => {
		// Al click del pulsante 'invio' il messaggio viene inviato al server che lo elabora
		// e salva nella lista dei messaggi gia' salvati

		const text = messageInput.value;
		if (text.trim()) {
            data = JSON.stringify({ 
                type : "message",
                text : text
            });
            
            socket.send(data);
			
			messageInput.value = "";
		}
	});

	messageInput.addEventListener("keypress", (e) => {
		// Metodo che traduce la pressione del tasto 'Enter' della tastiera
		// in un click del pulsante invio
		if (e.key === "Enter") {
			e.preventDefault(); // Previene l'invio del modulo, se presente
			sendMessageButton.click();
		}
	});

});