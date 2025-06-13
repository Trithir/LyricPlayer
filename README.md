# LyricPlayer

LyricPlayer is a lightweight, offline-friendly lyric scroller for `.lrc` files with optional chord support. Perfect for live performance, rehearsal, or karaoke-style playback.

---

## 🎵 How to Use

1. **Add Songs**  
   Place your `.lrc` files in the `/songs/` folder.  
   Chords like `[G]Hello [C]world` are supported — chords will be shown above the words they apply to.

2. **Generate Song List**  
   Run `generate_songs_json.py` on your computer to update `songs.json`.  
   This file powers the song menu in the app.

3. **Package for Use**  
   Zip the following files and folders together:
    /songs/
    index.html
    script.js
    README.md

You can exclude `generate_songs_json.py` if it won’t be used on the target device.

4. **Open the App**  
Open `index.html` in a browser (desktop or mobile).  
Recommended mobile browsers:
- **Android**: Firefox or Kiwi Browser
- **iOS**: Safari or Firefox (files must be unzipped first)

---

## 🎚️ Footswitch Controls

Supports basic Bluetooth foot pedal navigation:

- **Single Tap**  
- **Left** → Previous song  
- **Right** → Next song  

- **Double Tap**  
- **Left** → Play / Pause  
- **Right** → Restart song  

---

No installs, no internet needed. Just open and play.