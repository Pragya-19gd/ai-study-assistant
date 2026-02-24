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
    // Basic Validation
    if (!text.trim() && !file) return alert("Please provide text or a PDF!");
    
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    
    // Agar file hai toh file bhejo, warna text bhejo
    if (file) {
      formData.append("pdf", file);
    } else {
      formData.append("text", text);
    }

    try {
      // 🚀 IMPORTANT: URL changed to /api/analyze to match backend
      const response = await fetch("/api/analyze", { 
        method: "POST", 
        body: formData 
      });

      if (!response.ok) {
        throw new Error("Server Error: " + response.statusText);
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("System Busy or Build Folder issues. Please check Render logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: "100vh", padding: "20px", transition: "all 0.3s ease" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ color: theme.accent }}>StudyAI <span style={{fontWeight: '300'}}>Pro</span></h2>
          <button onClick={() => setDarkMode(!darkMode)} style={{ cursor: 'pointer', background: 'none', border: `1px solid ${theme.border}`, color: theme.text, padding: '5px 15px', borderRadius: '20px' }}>
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </header>

        <div style={{ backgroundColor: theme.card, padding: "20px", borderRadius: "12px", border: `1px solid ${theme.border}`, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!!file} // Agar file selected hai toh text disable kar do
            placeholder={file ? "PDF selected! Remove file to paste text..." : "Paste your study notes here..."}
            style={{ width: "100%", height: "120px", marginBottom: "10px", padding: "10px", borderRadius: "8px", border: `1px solid ${theme.border}`, backgroundColor: darkMode ? '#2c2c2c' : '#fff', color: theme.text, resize: 'none' }}
          />
          
          <div style={{ marginBottom: "15px" }}>
             <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Or upload PDF:</label>
             <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} style={{ color: theme.text }} />
             {file && <button onClick={() => setFile(null)} style={{ marginLeft: '10px', color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>Remove</button>}
          </div>
          
          <button onClick={analyzeText} disabled={loading} style={{ width: "100%", padding: "12px", backgroundColor: theme.accent, color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "AI is Thinking... Please wait" : "Generate Pro Analysis"}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: "30px", textAlign: "left" }}>
            <div style={{ backgroundColor: theme.card, padding: "25px", borderRadius: "12px", border: `1px solid ${theme.border}`, boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
              <h3 style={{ color: theme.accent, borderBottom: `2px solid ${theme.accent}`, paddingBottom: "10px", marginBottom: "20px" }}>Detailed Analysis</h3>
              <div className="pro-markdown" style={{ lineHeight: "1.8", color: theme.text }}>
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