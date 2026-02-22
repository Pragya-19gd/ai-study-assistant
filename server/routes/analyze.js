const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai"); // You need to run 'npm install openai' in your server folder

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This pulls from your Render Environment Variables
});

router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    // 1. The AI Call
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful study assistant. Summarize the text and extract key concepts." },
        { role: "user", content: `Analyze this text: ${text}` }
      ],
    });

    const aiResponse = completion.choices[0].message.content;

    // 2. Your original logic (kept as a bonus)
    const words = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 2);
    const freq = {};
    words.forEach(w => freq[w.toLowerCase()] = (freq[w.toLowerCase()] || 0) + 1);
    const keywords = Object.keys(freq).sort((a,b) => freq[b]-freq[a]).slice(0,5);

    // 3. Send back the AI response + your keywords
    res.json({ 
      summary: aiResponse, 
      wordCount: words.length, 
      keywords: keywords 
    });

  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ 
    error: "AI failed to respond", 
    keywords: [], // <--- This prevents the .map() crash!
    summary: "Sorry, I couldn't process that right now." 
  });
  }
});

module.exports = router;