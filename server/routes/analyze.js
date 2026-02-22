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

    const prompt = `Analyze this study material. 
    Return ONLY a JSON object:
    {
      "summary": "a helpful 3-4 sentence summary",
      "keywords": ["key1", "key2", "key3", "key4", "key5"]
    }`;

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