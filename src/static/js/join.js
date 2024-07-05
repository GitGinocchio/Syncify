const socket = io('/join');

// Gestisci l'evento 'update' ricevuto dal server
socket.on('refresh_rooms', function() {
    console.log('Received update signal, reloading page...');
    window.location.reload(true);  // Ricarica la pagina
});