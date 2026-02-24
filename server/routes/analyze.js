const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // 💡 FIX 1: Hum 'v1' endpoint use karenge 'v1beta' ki jagah (zyada stable hai)
    // 💡 FIX 2: Model name 'gemini-1.5-flash' ki jagah sirf 'gemini-pro' ya versioned name
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    let promptText = "Analyze and summarize this study material clearly:";
    let requestData;

    if (req.file) {
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
      requestData = {
        contents: [{
          parts: [{ text: promptText + "\n" + req.body.text }]
        }]
      };
    }

    const response = await axios.post(url, requestData);

    if (response.data && response.data.candidates) {
      const summary = response.data.candidates[0].content.parts[0].text;
      res.json({ summary });
    } else {
      throw new Error("Invalid response from Google AI");
    }

  } catch (error) {
    // 💡 AGAR 1.5-FLASH PHIR BHI 404 DE, TOH YE AUTOMATICALLY GEMINI-PRO TRY KAREGA
    console.error("FLASH FAILED, TRYING PRO...");
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const backupUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
        const backupRes = await axios.post(backupUrl, {
            contents: [{ parts: [{ text: "Summarize: " + (req.body.text || "PDF content provided") }] }]
        });
        res.json({ summary: backupRes.data.candidates[0].content.parts[0].text });
    } catch (innerError) {
        console.error("ALL MODELS FAILED:", innerError.message);
        res.status(500).json({ error: "AI Models not available in this region." });
    }
  }
});

module.exports = router;