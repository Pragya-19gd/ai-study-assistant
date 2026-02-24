const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    console.log("API KEY EXISTS:", !!process.env.GEMINI_API_KEY);

    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel(
      { model: "gemini-1.0-pro" }
    );

    const prompt = "Analyze and summarize this clearly:";

    let result;

    if (req.file) {
      console.log("Processing PDF...");
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
      console.log("Processing Text...");
      result = await model.generateContent(
        prompt + "\n" + req.body.text
      );
    }

    res.json({ summary: result.response.text() });

  } catch (error) {
    console.error("FINAL ERROR LOG:", error);
    res.status(500).json({
      error: "AI processing failed",
      details: error.message,
    });
  }
});

module.exports = router;