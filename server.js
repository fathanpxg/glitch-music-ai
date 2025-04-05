const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const FormData = require("form-data");
const { exec } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

app.post("/generate", async (req, res) => {
  const prompt = req.body.prompt || "Happy punk rock instrumental";
  console.log("Prompt diterima:", prompt);

  try {
    // 1. Request MusicGen
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
    console.log("Musik selesai");

    // 2. Request Bark (vokal TTS)
    const barkRes = await fetch("https://api-inference.huggingface.co/models/suno/bark", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt }) // Sama dengan teks
    });

    const vocalBuffer = await barkRes.buffer();
    fs.writeFileSync("vocal.wav", vocalBuffer);
    console.log("Vokal selesai");

    // 3. Gabungkan audio pakai ffmpeg
    exec(`${ffmpegPath} -i music.mp3 -i vocal.wav -filter_complex amix=inputs=2:duration=first -y output.mp3`, (err) => {
      if (err) {
        console.error("Gagal gabung audio:", err);
        return res.status(500).send("Gagal gabung audio");
      }

      const final = fs.readFileSync("output.mp3");
      res.set("Content-Type", "audio/mpeg");
      res.send(final);
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Terjadi kesalahan saat generate");
  }
});

app.listen(PORT, () => console.log("Server berjalan di port", PORT));
