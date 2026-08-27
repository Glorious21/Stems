import { db, logTrack, setConfig } from './db.ts';

// Reset.
db.exec('DELETE FROM track_versions; DELETE FROM events; DELETE FROM sqlite_sequence;');

setConfig({
  producer_name: 'Tobi',
  storage_locations: [
    'Laptop SSD - D:/Music',
    'External HDD - E:/Archive',
    'Google Drive - /Beats2026',
  ],
  genres_moods: ['Afrobeats', 'Amapiano', 'Trap', 'R&B', 'Sad', 'Club'],
  daw: 'FL Studio',
});

logTrack({
  track_name: 'Lagos Nights',
  genre_mood: 'Afrobeats',
  bpm: '103',
  song_key: 'A minor',
  instruments_samples: 'Talking drum loop, Rhodes, live bass',
  status: 'demo',
  location: 'External HDD - E:/Archive/2026',
  project: 'Night Drive EP',
  notes: 'Late-night highlife feel. Ref: Wizkid - Come Closer',
  date: '2026-08-10',
});

logTrack({
  track_name: 'Cold Water',
  genre_mood: 'Amapiano',
  bpm: '112',
  song_key: 'F# minor',
  status: 'idea',
  location: 'not yet saved',
  project: 'Night Drive EP',
  notes: 'Log drum bounce idea, hummed the topline into my phone',
  date: '2026-08-18',
});

logTrack({
  track_name: 'Osupa',
  genre_mood: 'Afrobeats, Sad',
  bpm: '98',
  song_key: 'D minor',
  instruments_samples: 'Nylon guitar, choir pad, shaker',
  status: 'mixed',
  location: 'Laptop SSD - D:/Music/mixes',
  notes: 'For a Tems-type vocal. Moonlight theme.',
  date: '2026-08-20',
});

// New version of Lagos Nights — supersedes the E:/Archive demo.
logTrack({
  track_name: 'Lagos Nights',
  genre_mood: 'Afrobeats',
  bpm: '103',
  song_key: 'A minor',
  instruments_samples: 'Swapped drums, vocal up 2 dB, fresh 808',
  status: 'mixed',
  location: 'Laptop SSD - D:/Music/mixes',
  project: 'Night Drive EP',
  notes: 'This is the one to use now',
  date: '2026-08-25',
  is_new_version: true,
});

console.log('Seeded: 3 tracks, 1 supersession. Config set for "Tobi".');
