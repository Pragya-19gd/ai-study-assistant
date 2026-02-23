const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });

// Check API Key immediately
if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL: GEMINI_API_KEY is missing!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  const { text } = req.body;

  try {
    // FIX: Using 'gemini-1.5-flash' without the v1beta prefix or using 'latest'
    // Also, some regions require gemini-pro if flash is undergoing maintenance
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an Academic AI Tutor. 
    Analyze the provided content and provide a detailed study guide in Markdown.
    Include: ## 📌 Executive Summary, ## 🧠 Key Concepts, and ## 💡 Takeaways.`;

    let result;

    if (req.file) {
      console.log("Analyzing PDF...");
      const pdfPart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };
      // Important: Pass as an array
      result = await model.generateContent([prompt, pdfPart]);
    } else if (text) {
      console.log("Analyzing Text...");
      result = await model.generateContent([prompt, text]);
    } else {
      return res.status(400).json({ error: "No input provided" });
    }

    const response = await result.response;
    const outputText = response.text();

    if (!outputText) throw new Error("AI returned empty response");

    res.json({
      summary: outputText,
      keywords: ["Analysis", "Education"],
      wordCount: "Document"
    });

  } catch (error) {
    console.error("Gemini API Error Details:", error);
    
    // Detailed error for frontend
    res.status(500).json({ 
      error: "AI Error", 
      summary: "Error: " + error.message + ". Please ensure your API Key has access to Gemini 1.5 Flash."
    });
  }
});

module.exports = router;