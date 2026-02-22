const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Use the key name you saved in Render (GEMINI_API_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // We ask Gemini to give us JSON so your React app can read it easily
    const prompt = `Analyze this text for a student. Provide a summary and a list of the 5 most important keywords. 
    Return the response in this JSON format:
    {
      "summary": "text summary here",
      "keywords": ["word1", "word2", "word3", "word4", "word5"]
    }`;

    const result = await model.generateContent([prompt, text]);
    const response = await result.response;
    let outputText = response.text();

    // Clean up Gemini's response (sometimes it adds markdown backticks)
    const cleanJSON = outputText.replace(/```json|```/g, "").trim();
    const aiData = JSON.parse(cleanJSON);

    res.json({
      summary: aiData.summary,
      keywords: aiData.keywords,
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length
    });

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ 
      error: "AI failed to respond", 
      keywords: [], // Keeps React from crashing
      summary: "Sorry, I couldn't process that right now. Please check the API key." 
    });
  }
});

module.exports = router;