const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    const { text } = req.body;
    // 1. Flash 1.5 is the best choice for PDF analysis
   // 'latest' suffix lagane se ye hamesha sahi version uthayega
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `You are a professional tutor. Provide a detailed study guide in Markdown. 
    Include headers: ## 📌 Executive Summary, ## 🧠 Key Concepts.`;

    let result;

    if (req.file) {
      console.log("Processing PDF for Gemini...");
      const pdfPart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };
      // Send both prompt and PDF
      result = await model.generateContent([prompt, pdfPart]);
    } else {
      console.log("Processing Text only...");
      result = await model.generateContent([prompt, text || "Provide analysis."]);
    }

    const response = await result.response;
    const outputText = response.text();

    res.json({
      summary: outputText,
      keywords: ["AI-Generated", "Study-Ready"],
      wordCount: outputText.split(' ').length // Dynamic word count
    });

  } catch (error) {
    console.error("GEMINI ERROR:", error.message);

    // Final Fallback for 404 or Overloaded errors
    try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); 
        const fallbackResult = await fallbackModel.generateContent("Create a summary for: " + (req.body.text || "attached material"));
        const fallbackText = await fallbackResult.response.text();
        
        return res.json({
            summary: fallbackText,
            keywords: ["Fallback-Active"],
            wordCount: "Document"
          });
    } catch (innerError) {
        res.status(500).json({ 
            error: "Gemini API Connection Failed", 
            details: "Please check if API Key is valid and Billing is active on Google Cloud." 
        });
    }
  }
});

module.exports = router;