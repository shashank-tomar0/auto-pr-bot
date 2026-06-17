import { useState, useEffect } from 'react'
import './index.css'

function App() {
  // Try to load credentials from localStorage, fallback to empty (uses backend .env)
  const [token, setToken] = useState(() => {
    return localStorage.getItem('cosmos_github_token') || ''
  })
  const [groqKey, setGroqKey] = useState(() => {
    return localStorage.getItem('cosmos_groq_key') || ''
  })
  
  const [repo, setRepo] = useState('https://github.com/shashank-tomar0/auto-pr-bot')
  const [filePath, setFilePath] = useState('')
  const [branch, setBranch] = useState('main')
  const [issueDesc, setIssueDesc] = useState('')
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [status, setStatus] = useState('IDLE') // IDLE, PROCESSING, DONE, ERROR
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState(null)
  
  // Progress stepper states
  const [currentStep, setCurrentStep] = useState(0)
  
  const steps = [
    "Establishing connection to GitHub and verifying credentials...",
    "Scanning repository directory layout...",
    "Locating primary application file for analysis...",
    "Performing AST review & scanning code for flaws...",
    "Engineering optimal solution using Groq Llama-3...",
    "Creating patch branch and committing updates...",
    "Publishing Pull Request to GitHub base repository...",
    "Deployment successful! Pull Request is ready."
  ]

  // Proactively clear the old fine-grained token from localStorage to force fallback to the new classic token
  useEffect(() => {
    const cachedToken = localStorage.getItem('cosmos_github_token')
    if (cachedToken && cachedToken.startsWith('github_pat_')) {
      localStorage.removeItem('cosmos_github_token')
      setToken('')
    }
  }, [])

  // Save keys to localStorage when changed
  useEffect(() => {
    if (token) {
      localStorage.setItem('cosmos_github_token', token)
    } else {
      localStorage.removeItem('cosmos_github_token')
    }
  }, [token])

  useEffect(() => {
    if (groqKey) {
      localStorage.setItem('cosmos_groq_key', groqKey)
    } else {
      localStorage.removeItem('cosmos_groq_key')
    }
  }, [groqKey])

  // Simple step advancement simulation during processing
  useEffect(() => {
    let interval;
    if (status === 'PROCESSING') {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < 5) {
            return prev + 1;
          }
          return prev;
        });
      }, 3000); // Advance step every 3 seconds
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleInitiateCosmos = async (e) => {
    e.preventDefault()
    if (!repo) {
      alert("Please enter a repository URL.")
      return
    }

    setStatus('PROCESSING')
    setCurrentStep(0)
    setErrorMsg('')
    setResult(null)

    try {
      // Simulate steps 1-2 quickly
      setTimeout(() => setCurrentStep(1), 1000)
      setTimeout(() => setCurrentStep(2), 2200)

      const res = await fetch('http://127.0.0.1:8080/api/fix-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_token: token || null,
          groq_api_key: groqKey || null,
          repo_url: repo,
          file_path: filePath || null,
          branch: branch,
          issue_desc: issueDesc || null
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        setCurrentStep(6)
        setTimeout(() => {
          setCurrentStep(7)
          setResult(data)
          setStatus('DONE')
        }, 1200)
      } else {
        throw new Error(data.detail || "An error occurred during scanning.")
      }
    } catch (e) {
      console.error(e)
      setErrorMsg(e.message)
      setStatus('ERROR')
    }
  }

  return (
    <div className="cosmos-app">
      <div className="radial-glow-back"></div>

      {/* Floating Gear Settings */}
      <button 
        className="settings-trigger" 
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
        </svg>
        <span>Configuration</span>
      </button>

      {/* Settings Drawer Panel */}
      <div className={`cosmos-panel ${isSettingsOpen ? 'visible' : 'hidden'}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="panel-title" style={{ margin: 0, border: 'none', padding: 0 }}>System Settings</h3>
          <button 
            onClick={() => setIsSettingsOpen(false)}
            style={{ background: 'none', color: 'var(--text-secondary)', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0 5px' }}
          >
            &times;
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">GitHub Access Token (Optional)</label>
          <input 
            type="password" 
            className="cosmos-input" 
            value={token} 
            onChange={(e) => setToken(e.target.value)} 
            placeholder="Uses backend .env if empty" 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Groq API Key (Optional)</label>
          <input 
            type="password" 
            className="cosmos-input" 
            value={groqKey} 
            onChange={(e) => setGroqKey(e.target.value)} 
            placeholder="Uses backend .env if empty" 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Git Branch (Target)</label>
          <input 
            type="text" 
            className="cosmos-input" 
            value={branch} 
            onChange={(e) => setBranch(e.target.value)} 
            placeholder="main" 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Target File (Optional override)</label>
          <input 
            type="text" 
            className="cosmos-input" 
            value={filePath} 
            onChange={(e) => setFilePath(e.target.value)} 
            placeholder="e.g. main.py" 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Issue/Refactor Prompt (Optional)</label>
          <textarea 
            rows={3}
            className="cosmos-input" 
            value={issueDesc} 
            onChange={(e) => setIssueDesc(e.target.value)} 
            placeholder="Leave empty for zero-click autonomous analysis, or specify instructions here..." 
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Landing Center */}
      <h1 className="cosmos-title">Cosmos PR</h1>
      <p className="cosmos-subtitle">
        Deploy autonomous AI code repair across repositories. Paste your repository link and witness zero-click diagnosis, fixing, and pull requests.
      </p>

      {/* Main Search Bar Form */}
      <form onSubmit={handleInitiateCosmos} className="search-pill-container">
        <input 
          type="text" 
          className="search-pill-input"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="https://github.com/username/repository"
          disabled={status === 'PROCESSING'}
        />
        <button 
          type="submit" 
          className="search-pill-button"
          disabled={status === 'PROCESSING'}
        >
          {status === 'PROCESSING' ? (
            <>
              <div className="spinner"></div>
              <span>Processing...</span>
            </>
          ) : (
            <span>Initiate Cosmos</span>
          )}
        </button>
      </form>

      {/* Stepper Status Area */}
      {status === 'PROCESSING' && (
        <div className="status-container">
          {steps.map((step, idx) => {
            let stepClass = "";
            if (idx < currentStep) stepClass = "completed";
            else if (idx === currentStep) stepClass = "active";

            return (
              <div key={idx} className={`status-step ${stepClass}`}>
                <div className="step-indicator"></div>
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Error state */}
      {status === 'ERROR' && (
        <div className="status-container" style={{ borderColor: 'rgba(255, 69, 58, 0.3)', background: 'rgba(255, 69, 58, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--error-color)' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Cosmos Failed</span>
          </div>
          <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {errorMsg}
          </p>
        </div>
      )}

      {/* Results View */}
      {status === 'DONE' && result && (
        <div className="results-container">
          <div className="results-grid">
            
            {/* Explanation Summary */}
            <div className="results-card summary-panel">
              <div className="summary-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontFamily: 'Instrument Serif', fontSize: '2.5rem', fontWeight: '400', fontStyle: 'italic' }}>
                    Diagnosis Completed
                  </h3>
                  <span className="card-badge after" style={{ background: 'rgba(48, 209, 88, 0.1)', color: 'var(--success-color)' }}>
                    PR Opened
                  </span>
                </div>
                
                <p className="summary-text" style={{ whiteSpace: 'pre-line', marginTop: '10px', color: 'var(--text-secondary)' }}>
                  <strong>Target File:</strong> <code>{result.file_path}</code>
                  <br /><br />
                  <strong>AI Analysis:</strong> {result.explanation}
                </p>

                <div className="pr-box">
                  <div className="pr-info">
                    <h4>Patch Submissions Ready</h4>
                    <p>Autonomously refactored and merged into a new feature branch.</p>
                  </div>
                  <a 
                    href={result.pr_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="pr-link-btn"
                  >
                    <span>View Pull Request</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Original Code */}
            <div className="results-card">
              <div className="card-header">
                <h4 className="card-title">Original Code</h4>
                <span className="card-badge before">Before</span>
              </div>
              <pre className="code-viewer">
                <code>{result.original_code}</code>
              </pre>
            </div>

            {/* Fixed Code */}
            <div className="results-card">
              <div className="card-header">
                <h4 className="card-title">AI Optimizations</h4>
                <span className="card-badge after">After</span>
              </div>
              <pre className="code-viewer">
                <code>{result.fixed_code}</code>
              </pre>
            </div>

          </div>
        </div>
      )}

      <div className="cosmos-footer">
        Cosmos Engine v1.0.0 • AI-Driven Repository Maintenance
      </div>
    </div>
  )
}

export default App
