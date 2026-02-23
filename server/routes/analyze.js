const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Setup Multer to handle the file upload in memory
const upload = multer({ storage: multer.memoryStorage() });

// Check API Key
if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY is missing in Env variables!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  const { text } = req.body;
  
  try {
    // Model selection
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Improved Prompt for better structured Markdown
    const prompt = `
      You are an advanced Academic AI Tutor. 
      Analyze the provided content and generate a highly detailed study guide.
      
      IMPORTANT: Structure your response using these EXACT Markdown headers:
      
      ## 📌 Executive Summary
      (Provide a deep, 2-3 paragraph overview)
      
      ## 🧠 Key Concepts & Definitions
      (Identify the main technical terms and explain them in detail)
      
      ## 🛠️ Process Breakdown
      (Explain the methodology or "How-to" parts found in the text)
      
      ## 🎯 Strategic Goals & Outcomes
      (What are the ultimate objectives discussed?)
      
      ## 💡 Critical Analysis/Takeaways
      (Provide 3-5 high-level insights for an exam)

      Guidelines:
      - Use professional language.
      - Use bullet points for readability.
      - DO NOT use JSON formatting; return only Markdown text.
    `;

    let result;

    // CASE 1: User uploaded a PDF
    if (req.file) {
      const pdfPart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };
      // Important: Send prompt first, then the file part
      result = await model.generateContent([prompt, pdfPart]);
    } 
    // CASE 2: User pasted text
    else if (text && text.trim().length > 0) {
      result = await model.generateContent([prompt, text]);
    } 
    else {
      return res.status(400).json({ error: "No content found. Please upload a PDF or paste text." });
    }

    const response = await result.response;
    const outputText = response.text();

    // Safety check if AI returned empty text
    if (!outputText) {
      throw new Error("Gemini returned an empty response.");
    }

    // Dynamic Keyword Extraction (Simple logic to pick capitalized words as keywords)
    const words = outputText.split(/\s+/);
    const potentialKeywords = [...new Set(words.filter(w => w.length > 5 && /^[A-Z]/.test(w)).slice(0, 6))];

    // Sending the response
    res.json({
      summary: outputText, 
      keywords: potentialKeywords.length > 0 ? potentialKeywords : ["Study Notes", "Analysis"], 
      wordCount: text ? text.split(/\s+/).length : "PDF Document"
    });

  } catch (error) {
    console.error("--- Analysis Error Log ---");
    console.error(error.message);
    res.status(500).json({ 
      error: "AI failed to analyze the document.",
      details: error.message 
    });
  }
});

module.exports = router;