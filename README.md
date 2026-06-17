# ⚡ Nexus-PR

An autonomous AI agent that automatically detects and fixes bugs in your GitHub repositories. 

## Features
- **Blueprint Aesthetic UI**: A stunning, custom-built React frontend featuring an isometric graph-paper design and retro typography.
- **FastAPI Backend**: A highly optimized Python backend that orchestrates the AI logic.
- **Autonomous Fixes**: Provide a repository URL and an issue description, and the bot will:
  1. Clone the buggy file using the GitHub API.
  2. Analyze and rewrite the code using `llama3-70b-8192` via Groq.
  3. Create a new branch, commit the fix, and automatically open a Pull Request.

## Architecture Stack
- **Frontend**: React, Vite, Vanilla CSS
- **Backend**: FastAPI, Python, PyGithub
- **AI/LLM**: LangChain, Groq API

## Local Development

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Create a `.env` file in the backend with:
```env
GITHUB_TOKEN=your_pat_token
GROQ_API_KEY=your_groq_key
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to view the UI.
