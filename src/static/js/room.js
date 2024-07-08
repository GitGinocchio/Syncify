function toBottom() {
  let messagesContainer = document.getElementById('chat-messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function copyurl() {
	var input = document.createElement('input');
	var url = window.location.href;
	input.setAttribute('value', url);
	document.body.appendChild(input);
	input.select();
	var risultato = document.execCommand('copy');
	document.body.removeChild(input);
	alert('Link copiato!');
	return risultato;
}

function togglePlayPause() {
  var img = document.getElementById("playPauseImage");
  if (img.src.includes("play.png")) {
	img.src = "/static/images/pause.png";
	img.alt = "Pause";
  } else {
	img.src = "/static/images/play.png";
	img.alt = "Play";
  }
}

document.addEventListener('DOMContentLoaded', (event) => {
	const socket = io('/room');
	const messageInput = document.getElementById('message-input');
	const messagesContainer = document.getElementById('chat-messages');
	const sendMessageButton = document.getElementById('send-message');

	// Gestisci l'evento 'update' ricevuto dal server
	socket.on('refresh_room', function() {
		window.location.reload(true);  // Ricarica la pagina
	});

	// Gestisci l'evento 'new_message' ricevuto dal server
	socket.on('new_message', function(message) {
		addMessageToChat(message);
	});

	// Funzione per aggiungere un messaggio alla chat
	function addMessageToChat(message) {
		const messageElement = document.createElement('div');
		messageElement.classList.add('message');
		if (message.sender_id == '{{ user.id }}') {
		  messageElement.classList.add('my-message');
		} else if (message.sender_name !== "system") {
		  messageElement.classList.add('other-message');
		} else {
		  messageElement.classList.add('system-message');
		}
		messageElement.innerHTML = `
			<div class="sender">
				<img src="${message.sender_image}">
				<p>${message.sender_name}</p>
			</div>
			<p>${message.text}</p>
		`;
		messagesContainer.appendChild(messageElement);
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}

	// Gestione del clic sul pulsante di invio
	sendMessageButton.addEventListener('click', () => {
		const message = messageInput.value;
		if (message.trim()) {
			socket.emit('handle_message', {text: message, 
										   sender_name: '{{ user.name }}', 
										   sender_id: '{{ user.id }}',
										   sender_url: '{{ user.url }}',
										   sender_image: '{{ user.image }}',
										  },
										  '{{ room.id }}',
					   );
			messageInput.value = '';
		}
	});

	// Gestione della pressione del tasto Enter
	messageInput.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault(); // Previene l'invio del modulo, se presente
			sendMessageButton.click();
		}
	});
});