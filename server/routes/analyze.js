const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

const upload = multer({ storage: multer.memoryStorage() });

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1"
});

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    const prompt = "Analyze and summarize this clearly:";

    let result;

    if (req.file) {
      result = await genAI.models.generateContent({
        model: "gemini-1.0-pro",  // Use stable model
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
      result = await genAI.models.generateContent({
        model: "gemini-1.0-pro",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt + "\n" + req.body.text }],
          },
        ],
      });
    }

    const summary =
      result.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

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