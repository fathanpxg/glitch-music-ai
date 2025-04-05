const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const FormData = require("form-data");
const { exec } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

app.use(express.json());
app.use(express.static("public")); // Tempat index.html disimpan

// ROUTE UTAMA UNTUK TAMPILAN WEBSITE
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ROUTE UNTUK GENERATE MUSIK & VOKAL
app.post("/generate", async (req, res) => {
  const prompt = req.body.prompt || "Happy punk rock instrumental";
  console.log("Prompt:", prompt);

  try {
    // 1. Generate musik dari HuggingFace MusicGen
    const musicRes = await fetch("https://api-inference.huggingface.co/models/facebook/musicgen-small", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    const musicBuffer = await musicRes.buffer();
    fs.writeFileSync("music.mp3", musicBuffer);

    // 2. Generate vokal dari HuggingFace Bark
    const barkRes = await fetch("https://api-inference.huggingface.co/models/suno/bark", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    const vocalBuffer = await barkRes.buffer();
    fs.writeFileSync("vocal.wav", vocalBuffer);

    // 3. Gabungkan musik dan vokal pakai ffmpeg
    exec(`${ffmpegPath} -i music.mp3 -i vocal.wav -filter_complex amix=inputs=2:duration=first -y output.mp3`, (err) => {
      if (err) {
        console.error("FFMPEG error:", err);
        return res.status(500).send("Gagal gabungkan audio");
      }

      const final = fs.readFileSync("output.mp3");
      res.set("Content-Type", "audio/mpeg");
      res.send(final);
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Gagal generate");
  }
});

// JALANKAN SERVER
app.listen(PORT, () => console.log("Server jalan di http://localhost:" + PORT));
