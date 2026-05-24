# QueryMind — AI-Powered SQL Query Optimizer

An intelligent database query optimization assistant that analyzes SQL queries, detects inefficiencies, and generates optimized queries using local AI.

## Features
- 🔍 Static analysis — detects SELECT *, missing indexes, unindexed WHERE columns
- 🧠 Schema-aware analysis — fetches real table metadata from your database
- ⚡ Lazy schema loading — only fetches metadata for tables in the query
- 💾 Metadata caching — reuses schema for repeated queries
- 🤖 AI recommendations — generates optimized queries using Ollama llama3.2 locally
- 🎨 Clean UI — Next.js frontend with real-time analysis results

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js + Tailwind CSS |
| Backend | FastAPI |
| SQL Parsing | sqlglot |
| Database | MySQL |
| AI | Ollama llama3.2 (local) |

## Setup

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install fastapi uvicorn sqlglot mysql-connector-python openai
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### AI
Install Ollama from ollama.com then:
```bash
ollama pull llama3.2
```

## Usage
1. Open http://localhost:3000
2. Enter your MySQL credentials and connect
3. Type any SQL query
4. Click Analyze — get issues + AI optimized query
