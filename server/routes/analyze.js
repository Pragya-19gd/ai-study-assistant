const express = require("express");
const router = express.Router();
const multer = require("multer");
const { createClient } = require("@google/genai"); // Nayi library ka sahi import

const upload = multer({ storage: multer.memoryStorage() });

// 1. Client ko sahi se initialize karein
const client = createClient({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    const promptText = "Analyze and summarize this clearly:";
    let response;

    if (req.file) {
      // 2. PDF handle karne ka sahi tarika (nayi SDK mein)
      response = await client.models.generateContent({
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
      // 3. Text handle karne ka sahi tarika
      response = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: promptText + "\n" + req.body.text }] }],
      });
    }

    // 4. Response nikalne ka sahi tarika
    const summary = response.value.content.parts[0].text;
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