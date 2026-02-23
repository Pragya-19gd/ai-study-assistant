const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });

// Initialization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    const { text } = req.body;

    // FIX: Kuch regions mein sirf 'gemini-1.5-flash' 404 deta hai.
    // Hum 'models/gemini-1.5-flash' use karenge jo absolute path hai.
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

    const prompt = `You are an Academic Tutor. Analyze this and provide a study guide in Markdown. 
    Use headers: ## 📌 Executive Summary, ## 🧠 Key Concepts.`;

    let result;

    if (req.file) {
      console.log("Analyzing PDF...");
      const pdfPart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };
      // Important: prompt aur file ko array mein bhejna
      result = await model.generateContent([prompt, pdfPart]);
    } else {
      console.log("Analyzing Text...");
      result = await model.generateContent([prompt, text || "No text provided"]);
    }

    const response = await result.response;
    const outputText = response.text();

    if (!outputText) throw new Error("AI returned empty content");

    res.json({
      summary: outputText,
      keywords: ["Stable-Update", "2026-Ready"],
      wordCount: "Document"
    });

  } catch (error) {
    console.error("Gemini Error Debug:", error);
    
    // Agar Models/ Flash fail ho, toh final fallback Gemini-Pro par
    try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const fallbackResult = await fallbackModel.generateContent(text || "Please analyze this document.");
        const fallbackText = fallbackResult.response.text();
        
        return res.json({
            summary: fallbackText,
            keywords: ["Fallback-Active"],
            wordCount: "Document"
        });
    } catch (innerError) {
        res.status(500).json({ 
            error: "API Access Error", 
            summary: "404 persistent. Possible Region Lock or API Key restriction. Error: " + error.message 
        });
    }
  }
});

module.exports = router;