const express = require("express");
const router = express.Router();
const multer = require("multer");
// YAHAN DHAYAN DEIN: Nayi library ka sahi import ye hai
const { Gemini } = require("@google/genai/server"); 

const upload = multer({ storage: multer.memoryStorage() });

// 1. Client ko initialize karein (Nayi SDK ke tarike se)
const client = new Gemini(process.env.GEMINI_API_KEY);

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    const promptText = "Analyze and summarize this clearly:";
    let response;

    // 2. Nayi SDK (genai) mein model call aise hoti hai
    if (req.file) {
      response = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: req.file.buffer.toString("base64"),
                },
              },
            ],
          },
        ],
      });
    } else {
      response = await client.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: promptText + "\n" + req.body.text }] }],
      });
    }

    // 3. Response nikalne ka sahi tarika (nayi SDK ke liye)
    const summary = response.content.parts[0].text;
    res.json({ summary });

  } catch (error) {
    console.error("API ERROR:", error);
    res.status(500).json({
      error: "AI processing failed",
      details: error.message,
    });
  }
});

module.exports = router;