import { useState } from 'react'
import './index.css'

function App() {
  const [repo, setRepo] = useState('https://github.com/torvalds/linux')
  const [file, setFile] = useState('src/main.py')
  const [issue, setIssue] = useState('Division by zero on line 42')
  const [token, setToken] = useState('')
  const [groqKey, setGroqKey] = useState('')
  
  const [status, setStatus] = useState('IDLE')
  const [result, setResult] = useState(null)

  const handleFix = async () => {
    setStatus('PROCESSING')
    try {
      const res = await fetch('http://localhost:8000/api/fix-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_token: token,
          groq_api_key: groqKey,
          repo_url: repo,
          file_path: file,
          issue_desc: issue
        })
      });
      const data = await res.json();
      if(data.status === 'success') {
        setResult(data)
        setStatus('DONE')
      } else {
        throw new Error(data.detail)
      }
    } catch (e) {
      alert("Error: " + e.message)
      setStatus('IDLE')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', background: 'var(--sidebar-bg)', padding: '40px 20px', borderRight: '1px solid var(--grid-color)', zIndex: 10, height: '100vh', boxSizing: 'border-box' }}>
        <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>Project Metadata</h2>
        <a href="https://github.com" style={{ color: 'var(--text-light)', textDecoration: 'none', fontSize: '0.9rem' }}>github.com ↗</a>
        
        <div style={{ marginTop: '40px' }}>
          <div className="sidebar-label">GitHub Token</div>
          <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_..." />
          
          <div className="sidebar-label">Groq API Key</div>
          <input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_..." />

          <div className="sidebar-label">Repository</div>
          <input type="text" value={repo} onChange={e => setRepo(e.target.value)} />
          
          <div className="sidebar-label">File Path</div>
          <input type="text" value={file} onChange={e => setFile(e.target.value)} />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '60px', boxSizing: 'border-box' }}>
        <h1 className="pixel-font">NEXUS-PR</h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '60px' }}>
          A reference manual for people who design and build software. Written and illustrated by AI.
        </p>

        <div className="isometric-box" style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--blueprint-blue)', marginBottom: '10px' }}>[ FIG. 001 - ISSUE DESCRIPTION ]</div>
          <textarea rows={4} value={issue} onChange={e => setIssue(e.target.value)} />
          <button onClick={handleFix} disabled={status === 'PROCESSING'}>
            {status === 'PROCESSING' ? 'ANALYZING...' : 'INITIATE FIX'}
          </button>
        </div>

        {status === 'DONE' && result && (
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="isometric-box" style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--blueprint-blue)', marginBottom: '10px' }}>[ FIG. 002 - FIXED CODE ]</div>
              <pre style={{ fontSize: '0.8rem', overflowX: 'auto' }}>
                <code>{result.fixed_code}</code>
              </pre>
            </div>
            
            <div className="isometric-box" style={{ width: '300px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--blueprint-blue)', marginBottom: '10px' }}>[ RESULT: SUCCESS ]</div>
              <p style={{ fontSize: '0.9rem' }}>A Pull Request has been automatically generated with the proposed structural repairs.</p>
              <a href={result.pr_url} target="_blank" rel="noreferrer" style={{ color: 'var(--blueprint-blue)', fontWeight: 'bold' }}>
                VIEW PULL REQUEST ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
