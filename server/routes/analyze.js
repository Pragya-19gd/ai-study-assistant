const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// File size limit set to 10MB (Standard for PDFs)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY is missing!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  const { text } = req.body;
  
  try {
    // Gemini 1.5 Flash is best for speed and PDF analysis
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
        }
    });

    const prompt = `
      You are an expert Academic Tutor. Your task is to analyze the provided material and generate a high-quality, professional study guide.
      
      STRUCTURE YOUR RESPONSE USING THESE MARKDOWN HEADERS:
      
      ## 📌 Executive Summary
      Provide a 2-3 paragraph detailed overview of the material.
      
      ## 🧠 Key Concepts & Definitions
      List and explain the most important terms and theories in detail.
      
      ## 🛠️ Process Breakdown
      Detail the methodologies, steps, or "how-to" guides mentioned.
      
      ## 🎯 Strategic Goals & Outcomes
      Explain the primary objectives and intended results.
      
      ## 💡 Critical Analysis/Takeaways
      Give 3-5 high-level bullet points for exam preparation.

      INSTRUCTIONS:
      - Use professional and academic tone.
      - Use bold text for emphasis.
      - Use bullet points for all lists.
      - DO NOT wrap the response in code blocks or JSON.
    `;

    let result;

    // CASE 1: PDF Uploaded
    if (req.file) {
      console.log("Processing PDF:", req.file.originalname);
      const pdfPart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };
      // Sending prompt and PDF to Gemini
      result = await model.generateContent([prompt, pdfPart]);
    } 
    // CASE 2: Text Pasted
    else if (text && text.trim().length > 0) {
      console.log("Processing Text Input");
      result = await model.generateContent([prompt, text]);
    } 
    else {
      return res.status(400).json({ error: "Please upload a PDF or paste some text to analyze." });
    }

    // Await the full response
    const response = await result.response;
    const outputText = response.text();

    if (!outputText || outputText.length === 0) {
      console.error("Gemini returned empty text.");
      return res.status(500).json({ error: "AI produced an empty response. Please try again with different content." });
    }

    // Extract Keywords dynamically (picking nouns/technical terms)
    const keywords = outputText
      .match(/\*\*([^*]+)\*\*/g) // Picks text inside **bold**
      ?.map(k => k.replace(/\*\*/g, ''))
      .slice(0, 8) || ["Study Guide", "Project Management"];

    console.log("Analysis successful. Response length:", outputText.length);

    // Final JSON response to frontend
    res.json({
      summary: outputText, 
      keywords: keywords,
      wordCount: text ? text.split(/\s+/).length : "PDF Document"
    });

  } catch (error) {
    console.error("--- Detailed Backend Error ---");
    console.error(error);
    res.status(500).json({ 
      error: "AI analysis failed.", 
      details: error.message,
      suggestion: "Make sure your API key is active and the PDF is not password protected."
    });
  }
});

module.exports = router;