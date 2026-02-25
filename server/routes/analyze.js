const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("pdf"), async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. Sabse pehle available models ki list mangwao
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResponse = await axios.get(listUrl);
    
    // 2. Filter karein wo models jo 'generateContent' support karte hain
    const availableModels = listResponse.data.models
      .filter(m => m.supportedGenerationMethods.includes("generateContent"))
      .map(m => m.name);

    console.log("AVAILABLE MODELS ON THIS SERVER:", availableModels);

    if (availableModels.length === 0) {
      throw new Error("No usable models found for this API Key.");
    }

    // 3. Pehla available model uthao (e.g., models/gemini-1.5-flash-latest)
    const selectedModel = availableModels[0]; 
    const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`;

    const promptText = "Analyze and summarize this study material clearly:";
    let requestData = {
      contents: [{
        parts: [{ text: promptText + "\n" + (req.body.text || "PDF content") }]
      }]
    };

    if (req.file) {
      requestData.contents[0].parts.push({
        inline_data: {
          mime_type: "application/pdf",
          data: req.file.buffer.toString("base64")
        }
      });
    }

    const response = await axios.post(url, requestData);
    const summary = response.data.candidates[0].content.parts[0].text;
    
    res.json({ summary, modelUsed: selectedModel });

  } catch (error) {
    console.error("FINAL ATTEMPT FAILED:", error.response ? error.response.data : error.message);
    res.status(500).json({ 
      error: "AI Service Unavailable", 
      details: error.response ? error.response.data.error.message : error.message 
    });
  }
});

module.exports = router;