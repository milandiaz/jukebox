import db from "#db/client";
import { faker } from "@faker-js/faker";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function addToPlaylist(playlistId, trackId) {
  const result = await db.query(
    "INSERT INTO playlists_tracks (playlist_id, track_id) VALUES ($1, $2) RETURNING *",
    [playlistId, trackId]
  );
}

async function createTrack(name, duration_ms) {
  const result = await db.query(
    "INSERT INTO tracks (name, duration_ms) VALUES ($1, $2) RETURNING *",
    [name, duration_ms]
  );
  return result.rows[0];
}

async function createPlaylist(name, description) {
  const result = await db.query(
    "INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *",
    [name, description]
  );
  return result.rows[0];
}

async function seed() {
  // TODO

  await db.query("DELETE FROM playlists_tracks");
  await db.query("DELETE FROM playlists");
  await db.query("DELETE FROM tracks");

  await db.query("ALTER SEQUENCE tracks_id_seq RESTART WITH 1");
  await db.query("ALTER SEQUENCE playlists_id_seq RESTART WITH 1");
  await db.query("ALTER SEQUENCE playlists_tracks_id_seq RESTART WITH 1");

  const tracks = [];
  for (let i = 0; i <= 19; i++) {
    const track = await createTrack(
      faker.music.songName(),
      faker.number.int({ min: 120000, max: 300000 })
    );
    tracks.push(track);
  }

  for (let i = 1; i <= 10; i++) {
    const playlist = await createPlaylist(
      faker.music.genre() + " " + faker.word.words(2),
      faker.lorem.sentence({ min: 5, max: 15 })
    );

    const shuffledTracks = [...tracks].sort(() => 0.5 - Math.random());
    const selectedTracks = shuffledTracks.slice(0, 5);

    for (let j = 0; j < selectedTracks.length; j++) {
      await addToPlaylist(playlist.id, selectedTracks[j].id);
    }
  }
}
