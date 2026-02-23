const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Setup Multer to handle the file upload in memory
const upload = multer({ storage: multer.memoryStorage() });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  const { text } = req.body;
  
  try {
    // 2026 Model check: gemini-2.0-flash is the current stable choice
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Note: We use the available input (text or file) for the prompt
    const prompt = `
      You are an advanced Academic AI Tutor specializing in Project Management and Software Engineering.
      Analyze the provided material and provide a comprehensive study guide.
      
      Structure your response exactly like this:
      
      ## 📌 Executive Summary
      Provide a deep, 2-3 paragraph overview.
      
      ## 🧠 Key Concepts & Definitions
      Identify the main technical terms and explain them in detail.
      
      ## 🛠️ Process Breakdown
      Explain the "How-to" parts.
      
      ## 🎯 Strategic Goals & Outcomes
      What are the ultimate objectives?
      
      ## 💡 Critical Analysis/Takeaways
      Provide 3-5 high-level insights for an exam.

      Use Markdown (bolding, headers, and bullet points). Do NOT wrap your response in JSON tags.
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
      result = await model.generateContent([prompt, pdfPart]);
    } 
    // CASE 2: User pasted text
    else if (text) {
      result = await model.generateContent([prompt, text]);
    } 
    else {
      return res.status(400).json({ error: "Please provide text or a PDF file." });
    }

    const response = await result.response;
    const outputText = response.text();

    // FIXED: No JSON.parse needed because we want the Markdown text directly.
    // We send back the response that the frontend expects.
    res.json({
      summary: outputText, 
      keywords: ["Analysis Complete", "Study Guide Ready"], // Placeholder keywords
      wordCount: text ? text.split(/\s+/).length : "PDF Document"
    });

  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "AI failed to analyze the document. Check if API Key is valid." });
  }
});

module.exports = router;