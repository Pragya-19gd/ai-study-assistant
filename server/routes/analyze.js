const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    // 1. Initialize API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 2. Force 'v1' API Version (Ye 404 error ko khatam karega)
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash-latest" },
      { apiVersion: 'v1' } // 🔥 YEH LINE HI SOLUTION HAI
    );

    console.log("Using Stable v1 API...");

    let prompt = "Summarize this content properly:";
    let result;

    if (req.file) {
      result = await model.generateContent([
        prompt,
        { inlineData: { data: req.file.buffer.toString("base64"), mimeType: "application/pdf" } }
      ]);
    } else {
      const text = req.body.text || "No text";
      result = await model.generateContent(prompt + "\n\n" + text);
    }

    const response = await result.response;
    res.json({ summary: response.text() });

  } catch (error) {
    console.error("DETAILED ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;