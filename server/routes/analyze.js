const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

const upload = multer({ storage: multer.memoryStorage() });

// Initialize new Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    const prompt = "Analyze and summarize this clearly:";

    let result;

    if (req.file) {
      // PDF input
      result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
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
      // Text input
      result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt + "\n" + req.body.text,
      });
    }

    res.json({ summary: result.text });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({
      error: "AI processing failed",
      details: error.message,
    });
  }
});

module.exports = router;