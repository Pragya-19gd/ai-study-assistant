const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    // UPDATED FOR 2026: Use gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this text for a student. Provide a summary and a list of 5 keywords. 
    Return the response as a JSON object:
    {
      "summary": "text summary here",
      "keywords": ["word1", "word2", "word3", "word4", "word5"]
    }`;

    const result = await model.generateContent([prompt, text]);
    const response = await result.response;
    let outputText = response.text();

    // Cleaning the AI output to ensure it's valid JSON
    const cleanJSON = outputText.substring(
      outputText.indexOf("{"),
      outputText.lastIndexOf("}") + 1
    );
    const aiData = JSON.parse(cleanJSON);

    res.json({
      summary: aiData.summary,
      keywords: aiData.keywords,
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    });

  } catch (error) {
    console.error("--- LOGGING FULL ERROR ---");
    console.error(error.message);
    res.status(500).json({ 
      error: "AI failed to respond", 
      keywords: ["Error"], 
      summary: "The AI model version might be outdated or the key is restricted. Please check Render logs." 
    });
  }
});

module.exports = router;