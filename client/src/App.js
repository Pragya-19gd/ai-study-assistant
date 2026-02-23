import React, { useState } from "react";
import ReactMarkdown from "react-markdown"; // 1. Import Markdown library

function App() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const theme = {
    bg: darkMode ? "#121212" : "#f0f2f5",
    card: darkMode ? "#1e1e1e" : "#ffffff",
    text: darkMode ? "#ffffff" : "#333333",
    subtext: darkMode ? "#bbbbbb" : "#666666",
    inputBg: darkMode ? "#2c2c2c" : "#ffffff",
    border: darkMode ? "#333333" : "#dddddd",
    accent: "#3498db",
    success: "#2ecc71"
  };

  const analyzeText = async () => {
    if (!text.trim() && !file) return alert("Please enter text or upload a PDF!");
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("pdf", file);
      } else {
        formData.append("text", text);
      }

      const response = await fetch("/analyze", {
        method: "POST",
        body: formData, 
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert("Error connecting to backend. Check Render logs!");
    } finally {
      setLoading(false);
    }
  };

  // ... (getHighlightedText and copyToClipboard same as your code)

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh", padding: "20px", transition: "all 0.3s ease" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>StudyAI <span style={{color: theme.accent}}>Assistant</span></h1>
          <button onClick={() => setDarkMode(!darkMode)} style={{ padding: "10px 15px", borderRadius: "50px", border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, cursor: "pointer" }}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </header>

        <div style={{ backgroundColor: theme.card, padding: "25px", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", marginBottom: "30px" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!!file}
            placeholder={file ? `File selected: ${file.name}` : "Paste notes here..."}
            style={{ width: "100%", height: "150px", padding: "15px", borderRadius: "10px", border: `2px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: "16px", outline: "none", resize: "none", boxSizing: "border-box" }}
          />
          
          <div style={{ display: "flex", gap: "10px", marginTop: "15px", alignItems: "center" }}>
            <label style={{
              backgroundColor: file ? theme.success : "#95a5a6",
              color: "white", padding: "10px 15px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold"
            }}>
              {file ? "✓ PDF Attached" : "📁 Attach PDF"}
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} style={{ display: "none" }} />
            </label>
            {file && <span style={{ fontSize: "12px", color: theme.subtext }}>{file.name}</span>}
          </div>

          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            <button onClick={analyzeText} disabled={loading} style={{ flex: 2, padding: "15px", backgroundColor: theme.accent, color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Analyzing..." : "Analyze Study Material"}
            </button>
            <button onClick={() => { setText(""); setResult(null); setFile(null); }} style={{ flex: 1, padding: "15px", backgroundColor: "transparent", color: "#e74c3c", border: "1px solid #e74c3c", borderRadius: "8px", cursor: "pointer" }}>
              Clear
            </button>
          </div>
        </div>

        {result && (
          <div style={{ display: "grid", gap: "20px" }}>
            {/* UPDATED: Summary Section with ReactMarkdown */}
            <div style={{ backgroundColor: theme.card, padding: "25px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <h3 style={{ marginTop: 0, color: theme.accent }}>Detailed Analysis</h3>
                <button onClick={() => copyToClipboard(result.summary)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>📋</button>
              </div>
              
              {/* ReactMarkdown handles the bolding and headings from Gemini */}
              <div style={{ lineHeight: "1.7", color: theme.text, textAlign: "left" }} className="markdown-content">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
            </div>
            
            <div style={{ backgroundColor: theme.card, padding: "20px", borderRadius: "12px" }}>
              <h3 style={{ marginTop: 0, color: theme.accent }}>Core Concepts</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {result.keywords?.map((word, i) => (
                  <span key={i} style={{ backgroundColor: theme.accent + "22", color: theme.accent, padding: "8px 15px", borderRadius: "50px", fontSize: "14px", fontWeight: "600", border: `1px solid ${theme.accent}` }}>
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;