import { toBottom, copyurl, addMessage } from './utils.js';

document.addEventListener("DOMContentLoaded", (event) => {
    const socket = new WebSocket((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/room');

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

	const inviteButton = document.getElementById("invite-button");
	const sendMessageButton = document.getElementById("send-message");
	const addSongButton = document.getElementById("send-song");
	const playPauseButton = document.getElementById("playPauseButton");
	const skipButton = document.getElementById("skipButton");
	const backButton = document.getElementById("backButton");
	const progressBar = document.getElementById("progress");

	messagesContainer.scrollTop = messagesContainer.scrollHeight;

	var rateLimited = false;
	var progressInterval;

	let debounceTimeout;

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

	function onAddSong(data) {
		const songElement = document.createElement("li");
		songElement.classList.add("song-info");
		songElement.id = data.song.id;
		songElement.innerHTML = `
			<img class="album-art" src="${data.song.album.images[2].url}">
			<div class="details">
				<span class="song-title">${data.song.name}</span>
				<span class="song-artists">
					${data.song.artists
					.map((artist) =>`<a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a>`)
					.join(",")}
				</span>
			</div>
			<span class="addedby-user">
				Added by:
				<a href="${data.song.addedby.url}" target="_blank">
					<img src="${data.song.addedby.image}" class="member-icon">
					${data.song.addedby.name}
				</a>
			</span>
			<span class="song-duration">${data.song.duration_string}</span>
		`;

		if (data.container === "queue" && data.index === -1) {
			queueContainer.appendChild(songElement);
		} else if (container === "queue") {
			queueContainer.insertBefore(songElement, queueContainer.children[data.index]);
		} else if (container === "history" && data.index === -1) {
			historyContainer.appendChild(songElement);
		} else if (container == "history") {
			historyContainer.insertBefore(songElement, historyContainer.children[data.index]);
		}
	}

	function onSearchResults(data) {
		const results = [
			...data.results.tracks.items, 
			//...data.results.albums.items, 
			//...data.results.episodes.items, 
			//...data.results.playlists.items, 
			//...data.results.shows.items
		];

		resultsContainer.innerHTML = "";
		results.forEach((song) => {
			const songElement = document.createElement("li");
			songElement.classList.add("song-info");
			songElement.setAttribute("data-songdata", JSON.stringify(song));
			songElement.innerHTML = `
				<img class="album-art" src="${song.album.images[2].url}">
				<div class="details">
				<span class="song-title">${song.name}</span>
				<span class="song-artists">${song.artists
						.map((artist) => artist.name)
						.join(", ")}</span>
				</div>
				<span class="song-duration">${song.duration}</span>
	  		`;
			songElement.addEventListener("click", handleSongClick);
			resultsContainer.appendChild(songElement);
		});
	}

	function onRateLimitReached(data) {
		addMessage({
			sender : { "type" : "system" },
			message : "Rate limit reached. Please wait a few seconds before sending another message."
		})

		if (rateLimited) { return; }

		rateLimited = true;
		setTimeout(() => {
			addMessage({
				sender : { "type" : "system" },
				message : "Rate limit lifted. You can now send messages again!"
			})
			rateLimited = false;
		}, (data.cooldown + 20) * 1000);
	}

	function handleSongClick(event) {
		var searchingBox = document.querySelector(".searching-box");
		const songElement = event.currentTarget;
		searchingBox.classList.remove("show");
		queueInput.value = "";

		const data = {
			type : "add-song",
			song : songElement.getAttribute("data-songdata")
		}

		socket.send(JSON.stringify(data));
	}

    socket.addEventListener("open", (event) => {
        console.log("WebSocket connection opened: ", event);
    });

    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case "message":
				addMessage(data)
				break;
			case "member-joined":
				onMemberJoined(data);
				break;
			case "member-left":
				onMemberLeft(data);
				break;
			case "search-results":
				onSearchResults(data);
				break;
			case "add-song":
				onAddSong(data);
				break;
			case "rate-limit-reached":
				onRateLimitReached(data);
				break;
			case "default":
				console.log("WebSocket message not recognized: ", data);
				break;
        }
    });

	socket.addEventListener("close", (event) => {
		console.log("WebSocket connection closed: ", event);
	});

	addSongButton.addEventListener("click", () => {
		// Quando viene premuto il tasto 'Invio':
		// Se la input contiene 'https://' allora manda un segnale al server
		// Con il link della canzone da aggiungere
		let url = queueInput.value;
		if (url.trim() && url.startsWith("https://")) {
			queueInput.value = "";
			const data = {
				type : "add-song",
				url : url
			}
			socket.send(JSON.stringify(data));
		}
	});

	queueInput.addEventListener("input", () => {
		// Ad ogni carattere inserito nel campo di input ad intervallo di n secondi
		// Se la query soddisfa certe condizioni invia la query al server
		clearTimeout(debounceTimeout);

		var searchingBox = document.querySelector(".searching-box");
		let query = queueInput.value;

		if (query.trim() && !query.startsWith("https://")) {
			if (!searchingBox.classList.contains("show")) {
				searchingBox.classList.add("show");
				resultsContainer.innerHTML = "";
				for (let i = 0; i < 10; i++) {
					const placeholderSongElement = document.createElement("li");
					placeholderSongElement.classList.add("song-info");
					placeholderSongElement.innerHTML = `
						<span class="album-art-load"></span>
						<div class="details">
						<span class="song-title-load"></span>
						<span class="song-artist-load"></span>
						</div>
						<span class="song-duration-load"></span>
					`;
					resultsContainer.appendChild(placeholderSongElement);
				}
			}

			debounceTimeout = setTimeout(() => {
				const data = {
					type : "search-song",
					query : query
				};
	
				socket.send(JSON.stringify(data));
			}, 600);
			
		}
		else {
			searchingBox.classList.remove("show");
			resultsContainer.innerHTML = "";
		}
	});

	sendMessageButton.addEventListener("click", () => {
		// Al click del pulsante 'invio' il messaggio viene inviato al server che lo elabora
		// e salva nella lista dei messaggi gia' salvati

		if (rateLimited) {
			// alert("Rate limit reached. Please wait a few seconds before sending another message.");
			return;
		}

		const text = messageInput.value;
		if (text.trim()) {
            const data = JSON.stringify({ 
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

	inviteButton.addEventListener("click", () => {
		copyurl(inviteButton.getAttribute("data-roomid"));
	});
});