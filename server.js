const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.static("public"));
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/facebook/musicgen-small", {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_HUGGINGFACE_TOKEN",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) {
      return res.status(500).send("Gagal mengakses API Hugging Face.");
    }

    const audio = await response.buffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(audio);
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan saat menghasilkan musik.");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
