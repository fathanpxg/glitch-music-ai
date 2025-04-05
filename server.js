const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.static("public"));
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  const response = await fetch("https://api-inference.huggingface.co/models/facebook/musicgen-small", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_HUGGINGFACE_TOKEN",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ inputs: prompt })
  });

  const audio = await response.buffer();
  res.set("Content-Type", "audio/mpeg");
  res.send(audio);
});

app.listen(3000, () => console.log("Running on port 3000"));
