let nowPlaying = document.querySelector(".now-playing");
let trackArt = document.querySelector(".track-art");
let trackName = document.querySelector(".track-name");
let trackArtist = document.querySelector(".track-artist");

let playpauseBtn = document.querySelector(".playpause-track");
let nextBtn = document.querySelector(".next-track");
let prevBtn = document.querySelector(".prev-track");
let repeatBtn = document.querySelector(".repeat-track");

let seekSlider = document.querySelector(".seek_slider");
let volumeSlider = document.querySelector(".volume_slider");
let currTime = document.querySelector(".current-time");
let totalDuration = document.querySelector(".total-duration");

let trackIndex = 0;
let isPlaying = false;
let isRepeat = false;
let updateTimer;

let currTrack = document.createElement('audio');

let trackList = [
  {
    name: "Track 1",
    artist: "Artist 1",
    path: "path/to/track1.mp3"
  },
  {
    name: "Track 2",
    artist: "Artist 2",
    path: "path/to/track2.mp3"
  }
  // Aggiungi altri brani qui
];

function loadTrack(index) {
  clearInterval(updateTimer);
  resetValues();

  currTrack.src = trackList[index].path;
  currTrack.load();

  trackArt.style.backgroundImage = "url('path/to/track-art.jpg')"; // Inserisci l'immagine del brano qui
  trackName.textContent = trackList[index].name;
  trackArtist.textContent = trackList[index].artist;
  nowPlaying.textContent = `PLAYING ${index + 1} OF ${trackList.length}`;

  updateTimer = setInterval(seekUpdate, 1000);

  currTrack.addEventListener("ended", nextTrack);
}

function resetValues() {
  currTime.textContent = "00:00";
  totalDuration.textContent = "00:00";
  seekSlider.value = 0;
}

function playpauseTrack() {
  isPlaying ? pauseTrack() : playTrack();
}

function playTrack() {
  currTrack.play();
  isPlaying = true;
  playpauseBtn.innerHTML = '<i class="fa fa-pause-circle fa-5x"></i>';
}

function pauseTrack() {
  currTrack.pause();
  isPlaying = false;
  playpauseBtn.innerHTML = '<i class="fa fa-play-circle fa-5x"></i>';
}

function nextTrack() {
  if (trackIndex < trackList.length - 1 && !isRepeat) {
    trackIndex += 1;
  } else if (isRepeat) {
    trackIndex = trackIndex;
  } else {
    trackIndex = 0;
  }
  loadTrack(trackIndex);
  playTrack();
}

function prevTrack() {
  if (trackIndex > 0) {
    trackIndex -= 1;
  } else {
    trackIndex = trackList.length - 1;
  }
  loadTrack(trackIndex);
  playTrack();
}

function seekTo() {
  let seekto = currTrack.duration * (seekSlider.value / 100);
  currTrack.currentTime = seekto;
}

function setVolume() {
  currTrack.volume = volumeSlider.value / 100;
}

function seekUpdate() {
  let seekPosition = 0;

  if (!isNaN(currTrack.duration)) {
    seekPosition = currTrack.currentTime * (100 / currTrack.duration);
    seekSlider.value = seekPosition;

    let currentMinutes = Math.floor(currTrack.currentTime / 60);
    let currentSeconds = Math.floor(currTrack.currentTime - currentMinutes * 60);
    let durationMinutes = Math.floor(currTrack.duration / 60);
    let durationSeconds = Math.floor(currTrack.duration - durationMinutes * 60);

    if (currentSeconds < 10) { currentSeconds = "0" + currentSeconds; }
    if (durationSeconds < 10) { durationSeconds = "0" + durationSeconds; }
    if (currentMinutes < 10) { currentMinutes = "0" + currentMinutes; }
    if (durationMinutes < 10) { durationMinutes = "0" + durationMinutes; }

    currTime.textContent = currentMinutes + ":" + currentSeconds;
    totalDuration.textContent = durationMinutes + ":" + durationSeconds;
  }
}

function repeatTrack() {
  isRepeat = !isRepeat;
  repeatBtn.style.color = isRepeat ? "green" : "white";
}

// Carica il primo brano all'avvio
loadTrack(trackIndex);
