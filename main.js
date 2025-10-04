document.addEventListener('DOMContentLoaded', () => {
  const songList = document.querySelector('.songs-list');
  const playBtn = document.querySelector('.play-btn');

    let songs = [
  { title: "Smells Like Teen Spirit", artist: "Nirvana", album: "Nevermind", genre: "Grunge", duration: "5:01" },
  { title: "Enter Sandman", artist: "Metallica", album: "Metallica", genre: "Metal", duration: "5:32" },
  { title: "Seven Nation Army", artist: "The White Stripes", album: "Elephant", genre: "Rock", duration: "3:52" },
  { title: "Do I Wanna Know?", artist: "Arctic Monkeys", album: "AM", genre: "Alternative", duration: "4:32" },
  { title: "Killing in the Name", artist: "Rage Against The Machine", album: "RATM", genre: "Rap Metal", duration: "5:14" }
];


  let currentSongIndex = 0;
  let isPlaying = false;
  let progressInterval = null;

  function renderSongs() {
    songList.innerHTML = "";
    songs.forEach((s, index) => {
      const song = document.createElement('div');
      song.classList.add('song');
    song.innerHTML = `
  <span>${s.title}</span>
  <span>${s.artist}</span>
  <span>${s.album}</span>
  <span>${s.genre}</span>
  <span>${s.duration}</span>
  <button class="remove material-symbols-outlined">close</button>
`;

      songList.appendChild(song);

      song.addEventListener('click', () => selectSong(index));
      song.querySelector('.remove').addEventListener('click', (e) => {
        e.stopPropagation();
        songs.splice(index, 1);
        renderSongs();
      });
    });
  }

  function selectSong(index) {
    currentSongIndex = index;
    document.querySelectorAll('.song').forEach((el, i) => {
      el.style.background = i === index ? 'var(--accent-2)' : 'var(--panel)';
    });
  }

  // --- Play / pause simulation ---
  function togglePlay() {
    if (!songs.length) return;
    isPlaying = !isPlaying;
    playBtn.querySelector('.material-symbols-outlined').textContent =
      isPlaying ? 'pause' : 'play_arrow';
    clearInterval(progressInterval);
    if (isPlaying) startProgress();
  }

  playBtn.addEventListener('click', togglePlay);
  renderSongs();
});
