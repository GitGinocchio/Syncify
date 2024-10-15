setInterval(function() {
    var countSpan = document.querySelector("#count");
    var count = countSpan.textContent * 1 - 1;
    countSpan.textContent = count;
    if (count <= 0) {
        window.location.href = '/user'; // URL della pagina dove reindirizzare l'utente
    }
}, 1000); // Intervallo di tempo in millisecondi (1000 ms = 1 secondo)