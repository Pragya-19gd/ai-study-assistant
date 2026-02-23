const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    const { text } = req.body;
    // Model explicitly set to gemini-1.5-flash for PDF support
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a professional Academic Tutor. 
    Analyze the provided content and provide a detailed study guide in Markdown format.
    Include these sections: ## 📌 Executive Summary, ## 🧠 Key Concepts, ## 💡 Takeaways.
    Ensure the output is ONLY Markdown text.`;

    let result;
    if (req.file) {
      console.log("Backend: Received PDF", req.file.originalname);
      const pdfPart = {
        inlineData: { data: req.file.buffer.toString("base64"), mimeType: "application/pdf" },
      };
      result = await model.generateContent([prompt, pdfPart]);
    } else {
      console.log("Backend: Received Text");
      result = await model.generateContent([prompt, text]);
    }

    const response = await result.response;
    const outputText = response.text();

    console.log("AI Output Check:", outputText ? "Text Received" : "Empty Response");

    // Important: Always return a valid summary key
    res.json({
      summary: outputText || "AI could not generate text for this file. Try a different PDF.",
      keywords: ["Analysis", "Notes"],
      wordCount: "Document"
    });

  } catch (error) {
    console.error("Backend Crash Log:", error);
    res.status(500).json({ 
      summary: "Error: " + error.message, 
      keywords: ["Error"] 
    });
  }
});

module.exports = router;