const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios"); // Axios use karenge seedha API call ke liye

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    // Direct Google API Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    let promptText = "Analyze and summarize this clearly:";
    let requestData;

    if (req.file) {
      // PDF handling for Direct API
      requestData = {
        contents: [{
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: "application/pdf",
                data: req.file.buffer.toString("base64")
              }
            }
          ]
        }]
      };
    } else {
      // Text handling
      requestData = {
        contents: [{
          parts: [{ text: promptText + "\n" + req.body.text }]
        }]
      };
    }

    // Seedha Google ko request bhejna
    const response = await axios.post(url, requestData, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Response structure direct API mein aisa hota hai:
    const summary = response.data.candidates[0].content.parts[0].text;
    res.json({ summary });

  } catch (error) {
    console.error("API ERROR:", error.response ? error.response.data : error.message);
    res.status(500).json({
      error: "AI processing failed",
      details: error.response ? error.response.data.error.message : error.message
    });
  }
});

module.exports = router;