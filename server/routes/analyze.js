const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });

// 1. Simple initialization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    // 2. IMPORTANT: Version ko yahan second argument mein daala hai
    // Model name ko ek dum simple rakha hai: "gemini-1.5-flash"
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" }, 
      { apiVersion: "v1" } 
    );

    const prompt = "Analyze and summarize this clearly:";
    let result;

    if (req.file) {
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: req.file.buffer.toString("base64"),
            mimeType: "application/pdf",
          },
        },
      ]);
    } else {
      result = await model.generateContent(prompt + "\n" + req.body.text);
    }

    res.json({ summary: result.response.text() });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({
      error: "AI processing failed",
      details: error.message,
    });
  }
});

module.exports = router;