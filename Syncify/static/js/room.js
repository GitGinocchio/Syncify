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
	const socket = io("/room");

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

	

	var progressInterval;
	let debounceTimeout;

	socket.on("connect", () => { });

	socket.on("disconnect", () => { });

	socket.on("member_join", function (member) {
		const memberElement = document.createElement("li");
		memberElement.id = member.id;
		memberElement.innerHTML = `
	  <img src="${member.image}" alt="account icon" class="member-icon">
	  <p class="member-name">${member.name}</p>
	`;
		membersContainer.appendChild(memberElement);
	});

	socket.on("member_leave", function (member) {
		const memberElement = document.getElementById(member.id);
		if (memberElement) {
			membersContainer.removeChild(memberElement);
		}
	});

	socket.on("new_message", function(message,sid) {
		// Successivamente il messaggio, dopo essere stato elaborato torna al client
		// Il client aggiunge (visivamente) il messaggio alla lista dei messaggi
		// Attenzione: Se si riaggiorna la pagina, questo metodo non viene chiamato
		// per ogni messaggio ma i messaggi vengono caricati dinamicamente utilizzando flask
		const messageElement = document.createElement("div");
		messageElement.classList.add("message");
		if (sid == socket.id) {
			messageElement.classList.add("my-message");
		} else if (sid == undefined) {
			messageElement.classList.add("system-message");
		} else {
			messageElement.classList.add("other-message");
		}
		messageElement.innerHTML = `
			<div class="sender">
				<img src="${message.sender.image}">
				<p>${message.sender.name}</p>
			</div>
			<p class="mess">${message.text}</p>
		`;
		messagesContainer.appendChild(messageElement);
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	});
	
	socket.on("del_room", function (room) {
		window.location.reload(true);
	});

	socket.on("search_results", function (results) {
		resultsContainer.innerHTML = "";
		results.forEach((song) => {
			const songElement = document.createElement("li");
			songElement.classList.add("song-info");
			songElement.id = song.id;
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
	});

	socket.on("add_song", function (container, song, index) {
		const songElement = document.createElement("li");
		songElement.classList.add("song-info");
		songElement.id = song.id;
		songElement.innerHTML = `
	  <img class="album-art" src="${song.album.images[2].url}">
	  <div class="details">
		<span class="song-title">${song.name}</span>
		<span class="song-artists">${song.artists
				.map(
					(artist) =>
						`<a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a>`
				)
				.join("<p>,</p>")}</span>
	  </div>
	  <span class="addedby-user">
		Added by:
		<a href="${song.addedby.url}" target="_blank">
		  <img src="${song.addedby.image}" class="member-icon">
		  ${song.addedby.name}
		</a>
	  </span>
	  <span class="song-duration">${song.duration}</span>
	`;

		if (container === "queue" && index === -1) {
			queueContainer.appendChild(songElement);
		} else if (container === "queue") {
			queueContainer.insertBefore(songElement, queueContainer.children[index]);
		} else if (container === "history" && index === -1) {
			historyContainer.appendChild(songElement);
		} else if (container == "history") {
			historyContainer.insertBefore(
				songElement,
				historyContainer.children[index]
			);
		}
	});

	socket.on("del_song", function (index) {
		if (queueContainer && queueContainer.children && index >= 0 && index < queueContainer.children.length) {
			const item = queueContainer.children[index];
			queueContainer.removeChild(item);
		}
	});

	socket.on("set_current_song_details", function (song) {
		if (song === undefined) {
			currentSongImageContainer.innerHTML = "<span></span>";
			currentSongDetailsContainer.innerHTML = `
			<span class="current-song-title-placeholder"></span>
			<span class="current-song-artists-placeholder"></span>
			`;
			currentSongTotalTime.textContent = "0:00";
		} else {
			currentSongImageContainer.innerHTML = "";

			currentSongImage = document.createElement("img");
			currentSongImage.src = song.album.images[1].url;
			currentSongImageContainer.appendChild(currentSongImage);

			currentSongDetailsContainer.innerHTML = `
			<span class="current-song-title" id="${song.id}">${song.name}</span>
			<span class="current-song-artists">${song.artists
						.map(
							(artist) =>
								`<a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a>`
						)
						.join("<p>,</p>")}
			</span>
	  		`;
			currentSongTotalTime.textContent = song.duration;
		}
	});

	socket.on("update_playpause_button", function (status) {
		var img = document.getElementById("playPauseImage");
		if (status === "playing") {
			img.src = "/static/images/pause.png";
			img.alt = "Pause";
		} else {
			img.src = "/static/images/play.png";
			img.alt = "Play";
		}
	});

	socket.on('set_update_progress_bar', function(started_at, paused_at, song_duration) {
		if (progressInterval) { clearInterval(progressInterval); }
	
		// Converti i secondi in millisecondi
		started_at = parseFloat(started_at) * 1000;
		paused_at = paused_at ? parseFloat(paused_at) * 1000 : null;
		song_duration = parseFloat(song_duration);
	
		progressInterval = setInterval(function() {
			let elapsed_time;
			
			if (paused_at !== null) {
				elapsed_time = paused_at - started_at;
			} else {
				elapsed_time = Date.now() - started_at;
			}

			var progress = (elapsed_time / song_duration) * 100;

			// Calcola il progresso e limita al 100%
			if (progress >= 100) {
				socket.emit("handle_skip_playback");
				clearInterval(progressInterval);
				return;
			}

			let clampedprogress = Math.min(progress, 100);
			progressBar.style.width = clampedprogress + '%';
			
			// Converti i millisecondi in secondi
			let totalSeconds = Math.floor(elapsed_time / 1000);
			let minutes = Math.floor(totalSeconds / 60);
			let seconds = totalSeconds % 60;
			minutes = minutes.toString().padStart(2, '0');
			seconds = seconds.toString().padStart(2, '0');

			currentSongCurrentTime.textContent = `${minutes}:${seconds}`;
		}, 1000);
	});

	socket.on('unset_update_progress_bar',function() {
		if (progressInterval) { clearInterval(progressInterval); }
	});

	socket.on('reset_progress_bar', function() {
		progressBar.style.width = '0%';
		currentSongCurrentTime.textContent = '0:00';
	});

	function handleSongClick(event) {
		var searchingBox = document.querySelector(".searching-box");
		const songElement = event.currentTarget;
		searchingBox.classList.remove("show");
		queueInput.value = "";
		socket.emit("handle_add_song", songElement.id);
	}

	playPauseButton.addEventListener("click", () => {
		var img = document.getElementById("playPauseImage");

		if (img.src.includes("play.png")) {
			socket.emit("handle_start_playback");
		} else {
			socket.emit("handle_stop_playback");
		}
	});

	skipButton.addEventListener("click", () => {
		socket.emit("handle_skip_playback");
	});

	backButton.addEventListener("click", () => {
		socket.emit("handle_back_playback");
	});

	addSongButton.addEventListener("click", () => {
		// Quando viene premuto il tasto 'Invio':
		// Se la input contiene 'https://' allora manda un segnale al server
		// Con il link della canzone da aggiungere
		let query = queueInput.value;
		if (query.trim() && query.startsWith("https://")) {
			socket.emit("handle_song_url", query);
			queueInput.value = "";
		}
	});

	queueInput.addEventListener("input", () => {
		// Ad ogni carattere inserito nel campo di input ad intervallo di n secondi
		// Se la query soddisfa certe condizioni invia la query al server
		clearTimeout(debounceTimeout);

		debounceTimeout = setTimeout(() => {
			let query = queueInput.value;
			if (query.trim() && !query.startsWith("https://")) {
				socket.emit("handle_search_song", query);
			}
		}, 500);
	});

	sendMessageButton.addEventListener("click", () => {
		// Al click del pulsante 'invio' il messaggio viene inviato al server che lo elabora
		// e salva nella lista dei messaggi gia' salvati
		const text = messageInput.value;
		if (text.trim()) {
			socket.emit("handle_message", text);
			
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

	queueInput.addEventListener("keypress", (e) => {
		// Metodo che traduce la pressione del tasto 'Enter' della tastiera
		// in un click del pulsante invio
		if (e.key === "Enter") {
			e.preventDefault(); // Previene l'invio del modulo, se presente
			addSongButton.click();
		}
	});

	if (clickableArrow) {
		clickableArrow.addEventListener("click", () => {
			arrows.forEach((arrow) => {
				arrow.classList.toggle("active");
			});
			devicesList.classList.toggle("show");
		});
	};

	document.getElementById("queue-input").addEventListener("input", function () {
		var searchingBox = document.querySelector(".searching-box");
		var query = this.value.trim();
		if (query && !query.startsWith("https://")) {
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
		} else {
			searchingBox.classList.remove("show");
			resultsContainer.innerHTML = "";
		}
	});

	document.getElementById("queue-button").addEventListener("click", function () {
		queueContainer.classList.remove("hide");
		historyContainer.classList.add("hide");
	});

	document.getElementById("history-button").addEventListener("click", function () {
		queueContainer.classList.add("hide");
		historyContainer.classList.remove("hide");
	});
});
