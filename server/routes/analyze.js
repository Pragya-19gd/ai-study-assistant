const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Setup Multer to handle the file upload in memory
const upload = multer({ storage: multer.memoryStorage() });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// We change this to handle BOTH text and PDF files
router.post("/", upload.single("pdf"), async (req, res) => {
  const { text } = req.body;
  
  try {
    // 2026 Model check: gemini-2.5-flash is currently the standard
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
  You are an advanced Academic AI Tutor specializing in Project Management and Software Engineering.
  Based on the following text, provide a comprehensive and highly detailed study guide.
  
  Please structure your response exactly like this:
  
  1. ## 📌 Executive Summary
     Provide a deep, 2-3 paragraph overview of the core themes.
  
  2. ## 🧠 Key Concepts & Definitions
     Identify the main technical terms (like Configuration Management, QA, etc.) and explain them in detail.
  
  3. ## 🛠️ Process Breakdown
     Explain the "How-to" parts. For example, how does Monitoring & Control actually work according to the text?
  
  4. ## 🎯 Strategic Goals & Outcomes
     What are the ultimate objectives regarding budget, time, and quality?
  
  5. ## 💡 Critical Analysis/Takeaways
     Provide 3-5 high-level insights that a student must remember for an exam.

  Use Markdown (bolding, headers, and bullet points) to make it professional and easy to read.
  
  Text to analyze:
  ${extractedText}
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

    // Clean JSON parsing
    const jsonStart = outputText.indexOf("{");
    const jsonEnd = outputText.lastIndexOf("}") + 1;
    const aiData = JSON.parse(outputText.substring(jsonStart, jsonEnd));

    res.json({
      summary: aiData.summary,
      keywords: aiData.keywords,
      // If it's a PDF, we can't easily count words here, so we return a default
      wordCount: text ? text.split(/\s+/).length : "PDF Document"
    });

  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "AI failed to analyze the document." });
  }
});

module.exports = router;