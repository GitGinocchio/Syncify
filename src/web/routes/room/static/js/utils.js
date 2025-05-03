

export function toBottom() {
	let messagesContainer = document.getElementById("chat-messages");
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

export function copyurl(roomid) {
	navigator.clipboard
	.writeText(`${window.location.protocol}//${window.location.host}/join/${roomid}`)
	.then(function () {
		alert("Link copiato!");
	})
	.catch(function (err) {
		console.error("Errore durante la copia del link: ", err);
	});
}

export function addMessage(data) {
	const messagesContainer = document.getElementById("chat-messages");

	const messageElement = document.createElement("div");
	messageElement.classList.add("message");
	
	if (data.sender.type == "me") { messageElement.classList.add("my-message"); }
	else if (data.sender.type == "user") { messageElement.classList.add("other-message"); }
	else { messageElement.classList.add("system-message"); }

	if (data.sender.type !== "system") {
		messageElement.innerHTML = `
		<div class="sender">
			<img src="${data.sender.image}">
			<p>${data.sender.name}</p>
		</div>
		`;
	}

	messageElement.innerHTML += `<p class="mess">${data.message}</p>`;
	
	messagesContainer.appendChild(messageElement);
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}