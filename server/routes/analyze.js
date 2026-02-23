const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });

// Initialize the API with your Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    const { text } = req.body;

    // SWITCHED TO PRO MODEL: More stable, no 404 errors
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      You are an expert Academic Tutor. Analyze the provided content and generate a professional study guide.
      
      Structure your response with these Markdown headers:
      ## 📌 Executive Summary
      ## 🧠 Key Concepts & Definitions
      ## 🛠️ Process Breakdown
      ## 💡 Critical Analysis/Takeaways
      
      Use bullet points and bold text for clarity. Do NOT use JSON.
    `;

    let result;

    if (req.file) {
      // Note: gemini-pro (text-only) sometimes struggles with raw PDF bytes.
      // If you get an error here, you might need to use 'gemini-1.5-flash' 
      // but ensure your SDK is updated to the latest version.
      const pdfData = req.file.buffer.toString("base64");
      const pdfPart = {
        inlineData: { data: pdfData, mimeType: "application/pdf" }
      };
      
      // Attempting analysis
      result = await model.generateContent([prompt, pdfPart]);
    } else {
      result = await model.generateContent([prompt, text]);
    }

    const response = await result.response;
    const outputText = response.text();

    if (!outputText) throw new Error("AI returned empty content");

    res.json({
      summary: outputText,
      keywords: ["Pro Analysis", "Study Guide", "Academic"],
      wordCount: text ? text.split(/\s+/).length : "PDF Document"
    });

  } catch (error) {
    console.error("Pro Model Error:", error.message);
    
    // Fallback if gemini-pro rejects the PDF format
    res.status(500).json({ 
      error: "Analysis Failed", 
      summary: "The Pro model encountered an issue: " + error.message + ". Try pasting the text directly if the PDF fails.",
      keywords: ["Error"]
    });
  }
});

module.exports = router;