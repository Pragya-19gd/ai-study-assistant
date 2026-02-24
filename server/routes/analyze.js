const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    // 1. Initialize API with specific version v1
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 2. Specify model with explicit v1 support
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" } // 🔥 This line is the MAGIC fix for 404
    );

    const prompt = "Analyze and summarize this clearly:";

    if (req.file) {
      console.log("Processing PDF...");
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: req.file.buffer.toString("base64"), mimeType: "application/pdf" } }
      ]);
      return res.json({ summary: result.response.text() });
    } else {
      console.log("Processing Text...");
      const result = await model.generateContent(prompt + "\n" + (req.body.text || ""));
      return res.json({ summary: result.response.text() });
    }
  } catch (error) {
    console.error("FINAL ERROR LOG:", error.message);
    res.status(500).json({ 
      error: "AI processing failed", 
      details: error.message 
    });
  }
});

module.exports = router;