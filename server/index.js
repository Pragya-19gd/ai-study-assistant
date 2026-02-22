const express = require("express");
const cors = require("cors");
const path = require("path");
const analyzeRoute = require("./routes/analyze");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API route - This handles your AI logic
app.use("/analyze", analyzeRoute);

// Serve frontend static files from the React build folder
app.use(express.static(path.join(__dirname, "../client/build")));

/**
 * FIXED: Changed "*" to "/*any"
 * This prevents the PathError [TypeError]: Missing parameter name at index 1
 * while still allowing your React Router to handle client-side routing.
 */
app.get("/*any", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 AI Study Assistant Server running on port ${PORT}`);
});