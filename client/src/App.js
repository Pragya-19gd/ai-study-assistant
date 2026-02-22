import React, { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Dynamic Theme Object
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
    if (!text.trim()) return alert("Please enter some text!");
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert("Error connecting to backend. Ensure server is running on port 5000!");
    } finally {
      setLoading(false);
    }
  };

  const getHighlightedText = () => {
  // Add a safety check: if result or result.keywords is missing, just return the text
  if (!result || !result.keywords || !Array.isArray(result.keywords)) return text;
  
  let highlighted = text;
  result.keywords.forEach(word => {
    if (word) { // Only highlight if the word exists
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
    <div style={{ 
      backgroundColor: theme.bg, 
      color: theme.text, 
      minHeight: "100vh", 
      transition: "all 0.3s ease",
      padding: "20px"
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Navbar / Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>StudyAI <span style={{color: theme.accent}}>Assistant</span></h1>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: "10px 15px",
              borderRadius: "50px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.card,
              color: theme.text,
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
            }}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </header>

        {/* Main Input Card */}
        <div style={{ 
          backgroundColor: theme.card, 
          padding: "25px", 
          borderRadius: "15px", 
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          marginBottom: "30px"
        }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your textbook notes or lecture transcript here..."
            style={{
              width: "100%",
              height: "200px",
              padding: "15px",
              borderRadius: "10px",
              border: `2px solid ${theme.border}`,
              backgroundColor: theme.inputBg,
              color: theme.text,
              fontSize: "16px",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box"
            }}
          />
          
          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            <button
               type="button"
              onClick={analyzeText}
              disabled={loading}
              style={{
                flex: 2,
                padding: "15px",
                backgroundColor: theme.accent,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "transform 0.1s"
              }}
              onMouseEnter={(e) => e.target.style.filter = "brightness(1.1)"}
              onMouseLeave={(e) => e.target.style.filter = "brightness(1)"}
            >
              {loading ? "Processing..." : "Generate Analysis"}
            </button>
            <button
              onClick={() => { setText(""); setResult(null); }}
              style={{
                flex: 1,
                padding: "15px",
                backgroundColor: "transparent",
                color: "#e74c3c",
                border: "1px solid #e74c3c",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results Sections */}
        {result && (
          <div style={{ display: "grid", gap: "20px", animation: "fadeIn 0.5s ease" }}>
            
            {/* Summary Card */}
            <div style={{ backgroundColor: theme.card, padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ marginTop: 0, color: theme.accent }}>Quick Summary</h3>
                <button onClick={() => copyToClipboard(result.summary)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>📋</button>
              </div>
              <p style={{ lineHeight: "1.6", color: theme.subtext }}>{result.summary}</p>
            </div>

            {/* Keyword Chips */}
            <div style={{ backgroundColor: theme.card, padding: "20px", borderRadius: "12px" }}>
              <h3 style={{ marginTop: 0, color: theme.accent }}>Core Concepts</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {result.keywords && result.keywords.map((word, i) => (
                  <span key={i} style={{
                    backgroundColor: theme.accent + "22", // adds transparency
                    color: theme.accent,
                    padding: "8px 15px",
                    borderRadius: "50px",
                    fontSize: "14px",
                    fontWeight: "600",
                    border: `1px solid ${theme.accent}`
                  }}>
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Highlighted View */}
            <div style={{ backgroundColor: theme.card, padding: "20px", borderRadius: "12px" }}>
              <h3 style={{ marginTop: 0, color: theme.accent }}>Smart Highlight View</h3>
              <div 
                style={{ 
                  lineHeight: "1.8", 
                  whiteSpace: "pre-wrap", 
                  color: theme.text,
                  backgroundColor: darkMode ? "#111" : "#f9f9f9",
                  padding: "15px",
                  borderRadius: "8px"
                }}
                dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
              />
            </div>

          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;