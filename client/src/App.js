import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

function App() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const theme = {
    bg: darkMode ? "#121212" : "#f8f9fa",
    card: darkMode ? "#1e1e1e" : "#ffffff",
    text: darkMode ? "#ffffff" : "#212529",
    accent: "#007bff",
    border: darkMode ? "#333" : "#dee2e6"
  };

  const analyzeText = async () => {
    if (!text.trim() && !file) return alert("Please provide text or a PDF!");
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    if (file) formData.append("pdf", file);
    else formData.append("text", text);

    try {
      const response = await fetch("/analyze", { method: "POST", body: formData });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert("System Busy. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ color: theme.accent }}>StudyAI <span style={{fontWeight: '300'}}>Pro</span></h2>
          <button onClick={() => setDarkMode(!darkMode)} style={{ cursor: 'pointer', background: 'none', border: `1px solid ${theme.border}`, color: theme.text, padding: '5px 15px', borderRadius: '20px' }}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </header>

        <div style={{ backgroundColor: theme.card, padding: "20px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your study notes here or attach a PDF..."
            style={{ width: "100%", height: "120px", marginBottom: "10px", padding: "10px", borderRadius: "8px", border: `1px solid ${theme.border}`, backgroundColor: darkMode ? '#2c2c2c' : '#fff', color: theme.text }}
          />
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} style={{ marginBottom: "15px" }} />
          
          <button onClick={analyzeText} disabled={loading} style={{ width: "100%", padding: "12px", backgroundColor: theme.accent, color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            {loading ? "Processing with Pro AI..." : "Generate Pro Analysis"}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: "30px", textAlign: "left" }}>
            <div style={{ backgroundColor: theme.card, padding: "25px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
              <h3 style={{ color: theme.accent, borderBottom: `1px solid ${theme.border}`, paddingBottom: "10px" }}>Detailed Analysis</h3>
              <div className="pro-markdown" style={{ lineHeight: "1.8" }}>
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;