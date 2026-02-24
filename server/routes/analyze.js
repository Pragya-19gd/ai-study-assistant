const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    // 1. Input Validation
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    // 2. Dynamic Import (Fixes "createClient is not a function" and ESM errors)
    const genaiModule = await import("@google/genai");
    const createClient = genaiModule.createClient;
    
    if (!createClient) {
      throw new Error("Could not find createClient in @google/genai module");
    }

    // 3. Client Initialization
    const client = createClient({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const promptText = "Analyze and summarize this study material clearly and professionally:";
    let result;

    // 4. AI Content Generation
    if (req.file) {
      // PDF Processing
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
      // Text Processing
      result = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          { 
            role: "user", 
            parts: [{ text: promptText + "\n" + req.body.text }] 
          }
        ],
      });
    }

    // 5. Extract Summary from Gemini Response
    // Nayi SDK ka response structure: result.candidates[0].content.parts[0].text
    if (result && result.candidates && result.candidates[0].content.parts[0]) {
      const summary = result.candidates[0].content.parts[0].text;
      res.json({ summary });
    } else {
      throw new Error("Empty response from Gemini AI");
    }

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({
      error: "AI processing failed",
      details: error.message,
    });
  }
});

module.exports = router;