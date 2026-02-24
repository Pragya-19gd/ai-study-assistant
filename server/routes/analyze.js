const express = require("express");
const router = express.Router();
const multer = require("multer");
// Nayi GenAI library ko aise import karein
const { createClient } = require("@google/genai"); 

const upload = multer({ storage: multer.memoryStorage() });

// Client initialize karein (API Key check ke saath)
const client = createClient({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    const promptText = "Analyze and summarize this clearly:";
    let result;

    if (req.file) {
      // PDF handling
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
      // Text handling
      result = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: promptText + "\n" + req.body.text }] }],
      });
    }

    // Response extraction (GenAI SDK format)
    // dhyan dein: result.candidates[0] se data nikalta hai
    const summary = result.candidates[0].content.parts[0].text;
    res.json({ summary });

  } catch (error) {
    console.error("API ERROR DETAILS:", error);
    res.status(500).json({
      error: "AI processing failed",
      details: error.message,
    });
  }
});

module.exports = router;