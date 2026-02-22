const express = require("express");
const cors = require("cors");
const path = require("path");
const analyzeRoute = require("./routes/analyze");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/analyze", analyzeRoute);

// STATIC FILES SETUP
// __dirname /opt/render/project/src/server hota hai
// Hume ek step piche ja kar 'client/build' dhundna hai
const buildPath = path.join(__dirname, "..", "client", "build");

app.use(express.static(buildPath));

app.get("/*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("Build folder not found. Path: " + buildPath);
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});