import express from "express";
import db from "#db/client";
const app = express();
app.use(express.json());

function isValidId(id) {
  return !isNaN(id) && !isNaN(parseFloat(id)) && parseInt(id) > 0;
}

app.get("/tracks", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tracks ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

////////////////////////////////////////////////////////////////////////////////////

app.get("/tracks/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ error: "Invalid track ID" });
  }

  try {
    const result = await db.query("SELECT * FROM tracks WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Track not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching track:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

////////////////////////////////////////////////////////////////////////////////////

app.get("/playlists", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM playlists ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

////////////////////////////////////////////////////////////////////////////////////

app.post("/playlists", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "Request body not provided" });
  }

  const { name, description } = req.body;
  if (!name || !description) {
    return res
      .status(400)
      .json({ error: "Request body is missing required fields" });
  }

  try {
    const result = await db.query(
      "INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

////////////////////////////////////////////////////////////////////////////////////

app.get("/playlists/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ error: "Invalid playlist ID" });
  }

  try {
    const result = await db.query("SELECT * FROM playlists WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

////////////////////////////////////////////////////////////////////////////////////

app.get("/playlists/:id/tracks", async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ error: "Invalid playlist ID" });
  }

  try {
    const playlistCheck = await db.query(
      "SELECT id FROM playlists WHERE id = $1",
      [id]
    );

    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const result = await db.query(
      `SELECT t.* FROM tracks t 
       JOIN playlists_tracks pt ON t.id = pt.track_id 
       WHERE pt.playlist_id = $1 
       ORDER BY t.id`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching playlist tracks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

////////////////////////////////////////////////////////////////////////////////////

app.post("/playlists/:id/tracks", async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).json({ error: "Invalid playlist ID" });
  }
  if (!req.body) {
    return res.status(400).json({ error: "Request body not provided" });
  }

  const { trackId } = req.body;
  if (!trackId || !isValidId(trackId)) {
    return res
      .status(400)
      .json({ error: "Request body is missing required fields" });
  }

  try {
    const playlistCheck = await db.query(
      "SELECT id FROM playlists WHERE id = $1",
      [id]
    );

    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: "Playlist doesn't exist" });
    }

    const trackCheck = await db.query("SELECT id FROM tracks WHERE id = $1", [
      trackId,
    ]);

    if (trackCheck.rows.length === 0) {
      return res.status(400).json({ error: "Track doesn't exist" });
    }

    const result = await db.query(
      "INSERT INTO playlists_tracks (playlist_id, track_id) VALUES ($1, $2) RETURNING *",
      [id, trackId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "Track is already in this playlist" });
    }

    console.error("Error adding track to playlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
