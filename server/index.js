const express = require("express");
const cors = require("cors");
const path = require("path");
const analyzeRoute = require("./routes/analyze");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/analyze", analyzeRoute);

// 🚨 Path Adjustment for your structure
// Server folder se bahar nikal kar client/build tak pahunchna hai
const buildPath = path.resolve(__dirname, "../client/build"); 
app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("Build folder issue. Make sure 'npm run build' ran in client folder.");
    }
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});