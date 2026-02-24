const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    // 🔥 DYNAMIC IMPORT: Ye line 404 aur Import errors ko jad se khatam kar degi
    const { createClient } = await import("@google/genai");
    
    const client = createClient({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const promptText = "Analyze and summarize this clearly:";
    let result;

    if (req.file) {
      result = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: req.file.buffer.toString("base64"),
                },
              },
            ],
          },
        ],
      });
    } else {
      result = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: promptText + "\n" + req.body.text }] }],
      });
    }

    const summary = result.candidates[0].content.parts[0].text;
    res.json({ summary });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({
      error: "AI processing failed",
      details: error.message,
    });
  }
});

module.exports = router;