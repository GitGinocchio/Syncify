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

document.addEventListener('DOMContentLoaded', (event) => {
  const resultsContainer = document.getElementById('results-search-box');
  const queueContainer = document.getElementById('queue-list');
  const historyContainer = document.getElementById('history-list');
  
  document.getElementById('queue-input').addEventListener('input', function() {
      var searchingBox = document.querySelector('.searching-box');
      var query = this.value.trim();
      if (query && !(query.startsWith('https://'))) {
        searchingBox.classList.add('show');
        resultsContainer.innerHTML = '';
        for (let i = 0; i < 10; i++) {
          const placeholderSongElement = document.createElement('li');
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
        searchingBox.classList.remove('show');
        resultsContainer.innerHTML = '';
      }
  });

  document.getElementById('queue-button').addEventListener('click', function() {
    queueContainer.classList.remove('hide')
    historyContainer.classList.add('hide')
  });

  document.getElementById('history-button').addEventListener('click', function() {
    queueContainer.classList.add('hide')
    historyContainer.classList.remove('hide')
  });

});

