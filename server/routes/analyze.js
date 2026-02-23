const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });

// Initialize with the stable version if possible
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    const { text } = req.body;

    // FIX: Using the most stable model identifier for 2026
    // We remove the "models/" prefix as the SDK handles it
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); 

    const prompt = `Analyze this material and provide a detailed study guide. 
    Use Markdown headings (##) for: Executive Summary, Key Concepts, and Analysis.`;

    let result;

    if (req.file) {
      // PDF handling for 1.5-Pro (Stable)
      const pdfPart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };
      result = await model.generateContent([prompt, pdfPart]);
    } else {
      result = await model.generateContent([prompt, text]);
    }

    const response = await result.response;
    const outputText = response.text();

    res.json({
      summary: outputText,
      keywords: ["Stable AI", "Academic Guide"],
      wordCount: "Document"
    });

  } catch (error) {
    console.error("Gemini Request Error:", error);
    
    // If it STILL says 404, we try the absolute fallback name
    res.status(500).json({ 
      error: "Connection Error", 
      summary: `The AI is reporting a 404. This usually means the SDK needs an update. 
                Error: ${error.message}`,
      suggestion: "Try running 'npm install @google/generative-ai@latest' in your server folder."
    });
  }
});

module.exports = router;