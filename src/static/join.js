const socket = io('/join');

// Gestisci l'evento 'update' ricevuto dal server
socket.on('refresh_rooms', function() {
    console.log('Received update signal, reloading page...');
    window.location.reload(true);  // Ricarica la pagina
});

// JavaScript per mostrare/nascondere il menu a tendina
document.getElementById('profile-icon').addEventListener('click', function() {
  const menu = document.getElementById('dropdown-menu');
  menu.classList.toggle('show');
});

// Nascondi il menu quando si clicca fuori
window.onclick = function(event) {
  if (!event.target.matches('.account-icon')) {
    const dropdowns = document.getElementsByClassName('dropdown-menu');
    for (let i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}