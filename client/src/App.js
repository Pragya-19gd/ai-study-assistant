import React, { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null); // 1. New state for PDF
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

  // 2. Updated analyze function to handle Text OR PDF
  const analyzeText = async () => {
    if (!text.trim() && !file) return alert("Please enter text or upload a PDF!");
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("pdf", file); // Send file if exists
      } else {
        formData.append("text", text); // Otherwise send text
      }

      const response = await fetch("/analyze", {
        method: "POST",
        // Note: Do NOT set Content-Type header when using FormData
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

  const getHighlightedText = () => {
    if (!result || !result.keywords || !Array.isArray(result.keywords)) return text;
    let highlighted = text;
    result.keywords.forEach(word => {
      if (word) {
        const regex = new RegExp(`\\b(${word})\\b`, "gi");
        highlighted = highlighted.replace(regex, `<mark style="background-color: #f1c40f; color: black; border-radius: 4px; padding: 0 2px;">$1</mark>`);
      }
    });
    return highlighted;
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    alert("Copied to clipboard! 📋");
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh", padding: "20px" }}>
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
            disabled={!!file} // Disable text if a file is selected
            placeholder={file ? `File selected: ${file.name}` : "Paste notes here..."}
            style={{ width: "100%", height: "150px", padding: "15px", borderRadius: "10px", border: `2px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: "16px", outline: "none", resize: "none", boxSizing: "border-box" }}
          />
          
          <div style={{ display: "flex", gap: "10px", marginTop: "15px", alignItems: "center" }}>
            {/* 3. The PDF Upload Button */}
            <label style={{
              backgroundColor: file ? theme.success : "#95a5a6",
              color: "white", padding: "10px 15px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold"
            }}>
              {file ? "✓ PDF Attached" : "📁 Attach PDF"}
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={(e) => setFile(e.target.files[0])} 
                style={{ display: "none" }} 
              />
            </label>
            {file && <span style={{ fontSize: "12px", color: theme.subtext }}>{file.name}</span>}
          </div>

          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            <button
              onClick={analyzeText}
              disabled={loading}
              style={{ flex: 2, padding: "15px", backgroundColor: theme.accent, color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Analyzing..." : "Analyze Study Material"}
            </button>
            <button
              onClick={() => { setText(""); setResult(null); setFile(null); }}
              style={{ flex: 1, padding: "15px", backgroundColor: "transparent", color: "#e74c3c", border: "1px solid #e74c3c", borderRadius: "8px", cursor: "pointer" }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results Sections remain the same as your code... */}
        {result && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div style={{ backgroundColor: theme.card, padding: "20px", borderRadius: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ marginTop: 0, color: theme.accent }}>Quick Summary</h3>
                <button onClick={() => copyToClipboard(result.summary)} style={{ background: "none", border: "none", cursor: "pointer" }}>📋</button>
              </div>
              <p style={{ lineHeight: "1.6", color: theme.subtext }}>{result.summary}</p>
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

            {/* Smart Highlight only shows if text was used (PDF doesn't show in textarea) */}
            {!file && (
              <div style={{ backgroundColor: theme.card, padding: "20px", borderRadius: "12px" }}>
                <h3 style={{ marginTop: 0, color: theme.accent }}>Smart Highlight View</h3>
                <div 
                  style={{ lineHeight: "1.8", whiteSpace: "pre-wrap", color: theme.text, backgroundColor: darkMode ? "#111" : "#f9f9f9", padding: "15px", borderRadius: "8px" }}
                  dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;