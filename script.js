// Removed scrollInterval, using rAF instead
let lyrics = [];
let currentLine = 0;
let isScrolling = false;
let scrollStartOffset = 0.33; // 1/3 down the display
let lineHeight = 32.66;

window.onload = async function () {
  const songList = document.getElementById("songList");
  const lyricContainer = document.getElementById("lyricContainer");
  lyricContainer.innerHTML = '<div style="text-align:center; padding-top: 3em; font-style: italic;">Select a song to begin</div>';

  try {
    const response = await fetch("songs/songs.json");
    const songsData = await response.json();
    window.songs = songsData;

    songsData.forEach((song, index) => {
      const item = document.createElement("li");
      item.textContent = song.title;
      item.dataset.index = index;
      item.style.cursor = "pointer";
      item.onclick = () => selectSong(index);
      songList.appendChild(item);
    });
  } catch (err) {
    console.error("Failed to load songs.json", err);
  }

  window.currentSongIndex = null;

  let lastKeyTime = 0;
  let keyPressCounts = {};

  function handleKeyPress(key) {
    const now = performance.now();
    const delta = now - (keyPressCounts[key]?.lastTime || 0);
    const threshold = 400; // ms for double-tap

    if (!keyPressCounts[key]) keyPressCounts[key] = { count: 0, timer: null };

    if (delta < threshold) {
      keyPressCounts[key].count++;
    } else {
      keyPressCounts[key].count = 1;
    }

    keyPressCounts[key].lastTime = now;

    clearTimeout(keyPressCounts[key].timer);
    keyPressCounts[key].timer = setTimeout(() => {
      const count = keyPressCounts[key].count;
      if (key === "ArrowLeft") {
        if (count === 2) toggleScroll();
        else goToPreviousSong();
      } else if (key === "ArrowRight") {
        if (count === 2) restartScroll();
        else goToNextSong();
      }
      keyPressCounts[key].count = 0;
    }, threshold);
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
      e.preventDefault();
      handleKeyPress(e.code);
    } else if (e.code === "Space") {
      e.preventDefault();
      toggleScroll();
    }
  });
};

function restartScroll() {
  currentLine = 0;
  scrollToLine(0);
}

let startTime = null;

function toggleScroll() {
  const scrollToggle = document.getElementById("scrollToggle");
  isScrolling = !isScrolling;
  scrollToggle.innerText = isScrolling ? "Pause" : "Play";

  if (isScrolling) {
    startTime = lyrics[currentLine]?.time ?? 0;
    startTime = performance.now() / 1000 - startTime;
    requestAnimationFrame(stepScroll);
  }
}

function scrollToLine(index) {
  // No longer used for smooth scroll, but keep for restart
  const display = document.getElementById("lyricDisplay");
  const container = document.getElementById("lyricContainer");
  const lines = container.querySelectorAll(".line");
  lines.forEach((line, i) => {
    line.classList.toggle("active", i === index);
  });
  // Set initial offset for smooth scroll
  const containerHeight = display.offsetHeight;
  const offset = containerHeight * scrollStartOffset - lineHeight / 4;
  container.style.transform = `translateY(${offset}px)`;
}

async function loadLRC(filename) {
  const response = await fetch(filename);
  const text = await response.text();
  console.log("Loading:", filename);
  console.log("Fetched text:", text);

  lyrics = parseLRC(text);
  console.log("Parsed lyrics:", lyrics);
  renderLyrics();
  restartScroll();
  if (scrollInterval) clearInterval(scrollInterval);
  // scroll now synced to .lrc timestamps using requestAnimationFrame
  // scrollInterval removed — timing now handled by timestamps
}

function parseLRC(text) {
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1); // Remove BOM if present
  }
  const lines = text.split("\n");
  const result = [];
  for (let line of lines) {
    line = line.trim();
    const match = line.match(/^\[(\d+):(\d+)[.](\d+)]\s?(.*)$/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const millis = parseInt(match[3]);
      const total = minutes * 60 + seconds + millis / 100;
      result.push({ time: total, text: match[4] });
    }
  }
  return result;
}

function renderLyrics() {
  const container = document.getElementById("lyricContainer");
  container.innerHTML = "";
  lyrics.forEach((line) => {
    const lineEl = document.createElement("div");
    lineEl.className = "line";
    lineEl.style.marginBottom = "16px"; // extra spacing between lines
    lineEl.appendChild(parseChordsDOM(line.text));
    container.appendChild(lineEl);
  });
  console.log("Rendering", lyrics.length, "lines");
}

function parseChordsDOM(line) {
  const wrapper = document.createElement("div");
  const parts = line.split(/(\[.*?])/g);
  let currentChord = null;

  for (const part of parts) {
    if (part.startsWith("[") && part.endsWith("]")) {
      currentChord = part.slice(1, -1);
    } else {
      const wordEl = document.createElement("div");
      wordEl.style.display = "flex";
      wordEl.style.flexDirection = "column";
      wordEl.style.alignItems = "center";
      wordEl.style.marginRight = "0.75em";

      if (currentChord) {
        const chordEl = document.createElement("div");
        chordEl.style.fontSize = "0.6em";
        chordEl.style.fontWeight = "bold";
        chordEl.style.lineHeight = "1";
        chordEl.textContent = currentChord;
        wordEl.appendChild(chordEl);
        currentChord = null;
      } else {
        const spacer = document.createElement("div");
        spacer.style.height = "0.6em";
        spacer.style.lineHeight = "1";
        wordEl.appendChild(spacer);
      }

      const textEl = document.createElement("div");
      textEl.textContent = part;
      wordEl.appendChild(textEl);

      wrapper.appendChild(wordEl);
    }
  }

  wrapper.style.display = "flex";
  wrapper.style.justifyContent = "center";
  wrapper.style.flexWrap = "wrap";
  return wrapper;
}

function selectSong(index) {
  if (window.songs && window.songs[index]) {
    loadLRC("songs/" + window.songs[index].filename);
    highlightSong(index);
    window.currentSongIndex = index;
  }
}

function goToNextSong() {
  let nextIndex = (window.currentSongIndex + 1) % window.songs.length;
  selectSong(nextIndex);
}

function goToPreviousSong() {
  let prevIndex =
    (window.currentSongIndex - 1 + window.songs.length) % window.songs.length;
  selectSong(prevIndex);
}

function highlightSong(index) {
  document.querySelectorAll("#songList li").forEach((el, i) => {
    el.style.fontWeight = i === index ? "bold" : "normal";
    el.style.background = i === index ? "#333" : "";
    el.style.padding = "4px 8px";
  });
}

function stepScroll() {
  if (!isScrolling) return;
  const display = document.getElementById("lyricDisplay");
  const container = document.getElementById("lyricContainer");
  const highlightBar = document.querySelector(".highlight-bar");
  const lines = container.querySelectorAll(".line");

  // Get the center of the highlight bar relative to the lyric display
  const displayRect = display.getBoundingClientRect();
  const barRect = highlightBar.getBoundingClientRect();
  const barCenter = barRect.top + barRect.height / 2 - displayRect.top;

  // Dynamically measure line height for best accuracy
  let measuredLineHeight = lineHeight;
  if (lines.length > 0) {
    const firstLineRect = lines[0].getBoundingClientRect();
    if (lines.length > 1) {
      const secondLineRect = lines[1].getBoundingClientRect();
      measuredLineHeight = secondLineRect.top - firstLineRect.top;
    } else {
      measuredLineHeight = firstLineRect.height;
    }
  }

  const currentTime = performance.now() / 1000 - startTime;
  // Find which two lines we're between
  let i = 0;
  while (i < lyrics.length - 1 && lyrics[i + 1].time <= currentTime) {
    i++;
  }
  currentLine = i;
  // Interpolate position between lines for smooth scroll
  let y = 0;
  if (i < lyrics.length - 1) {
    const t1 = lyrics[i].time;
    const t2 = lyrics[i + 1].time;
    const frac = (currentTime - t1) / (t2 - t1);
    y = (i + frac) * measuredLineHeight;
  } else {
    y = i * measuredLineHeight;
  }
  container.style.transform = `translateY(${barCenter - y}px)`;
  // Highlight the line that is at the highlight bar
  lines.forEach((line, idx) => {
    line.classList.toggle("active", idx === i);
  });
  requestAnimationFrame(stepScroll);
}
