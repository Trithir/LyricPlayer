import os
import json

SONGS_DIR = "songs"
OUTPUT_FILE = os.path.join(SONGS_DIR, "songs.json")

def title_from_filename(filename):
    return os.path.splitext(filename)[0].replace("-", " ").title()

def main():
    songs = []
    for filename in os.listdir(SONGS_DIR):
        if filename.endswith(".lrc"):
            songs.append({
                "title": title_from_filename(filename),
                "filename": filename
            })

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(songs, f, indent=2)

    print(f"Generated {OUTPUT_FILE} with {len(songs)} songs.")

if __name__ == "__main__":
    main()
