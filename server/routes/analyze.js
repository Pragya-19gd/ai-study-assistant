const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const words = text
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2);

  const freq = {};
  words.forEach(w => freq[w.toLowerCase()] = (freq[w.toLowerCase()] || 0) + 1);

  const keywords = Object.keys(freq).sort((a,b) => freq[b]-freq[a]).slice(0,10);
  const summary = text.split(".").slice(0,2).join(".") + ".";

  res.json({ summary, wordCount: words.length, keywords });
});

module.exports = router;