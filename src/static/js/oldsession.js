document.addEventListener('DOMContentLoaded', (event) => {
    const socket = io(); // Assicurati che socket.io sia correttamente importato

    const messageInput = document.getElementById('message-input');
    const messagesContainer = document.getElementById('messages');
    const sendMessageButton = document.getElementById('send-message');

    // Gestione dei messaggi in arrivo
    socket.on('message', (msg) => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message other-message';

        const nameElement = document.createElement('div');
        nameElement.className = 'name';
        nameElement.textContent = 'Other';

        const textElement = document.createElement('div');
        textElement.className = 'text';
        textElement.textContent = msg;

        messageElement.appendChild(nameElement);
        messageElement.appendChild(textElement);

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });

    // Gestione del clic sul pulsante di invio
    sendMessageButton.addEventListener('click', () => {
        const message = messageInput.value;
        if (message.trim()) {
            socket.send(message);
            const messageElement = document.createElement('div');
            messageElement.className = 'message my-message';

            const nameElement = document.createElement('div');
            nameElement.className = 'name';
            nameElement.textContent = 'You';
            

            const textElement = document.createElement('div');
            textElement.className = 'text';
            textElement.textContent = message;

            messageElement.appendChild(nameElement);
            messageElement.appendChild(textElement);

            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
