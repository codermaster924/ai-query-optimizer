⚡ QueryMind — AI-Powered SQL Query Optimizer
QueryMind is a full-stack AI-powered database query optimization assistant. It connects to a live MySQL database, analyzes your SQL queries for inefficiencies using both rule-based static analysis and schema-aware checks, and generates optimized query rewrites with detailed explanations using a locally running AI model.

What It Does
QueryMind runs two layers of analysis on every query:
Layer 1 — Rule-Based Static Analysis (instant)

Detects SELECT * usage
Flags NATURAL JOIN (unpredictable, silently breaks on schema changes)
Detects cartesian products (JOIN without ON condition)
Flags unnecessary DISTINCT
Catches leading wildcard LIKE '%value' that prevent index usage
Detects subqueries in IN() that could be rewritten as JOINs
Flags OR in WHERE clause that can prevent index usage
Checks for unindexed ORDER BY columns

Layer 2 — Schema-Aware Analysis (requires DB connection)

Fetches real metadata from your database — columns, indexes, foreign keys
Detects unindexed WHERE clause columns
Validates that every column in the query actually exists in the schema
Suggests similar column names or primary keys when a column is not found
Uses lazy loading — only fetches metadata for tables in the current query
Caches schema metadata for reuse across queries

Layer 3 — AI Recommendation (Ollama llama3.2, local)

Generates an optimized rewrite of your query
Explains every change and why it helps performance
Suggests index creation statements
Tailors recommendations based on your optimization goal (speed, memory, read-heavy, etc.)


Tech Stack
LayerTechnologyFrontendNext.js + Tailwind CSSBackendFastAPI (Python)SQL ParsingsqlglotDatabaseMySQLAI RuntimeOllamaAI Modelllama3.2 (runs locally)

Prerequisites
Before running QueryMind, make sure you have:

Python 3.10+
Node.js 18+
MySQL running locally
Ollama installed from ollama.com


Setup
1. Clone the repository
bashgit clone https://github.com/codermaster924/ai-query-optimizer.git
cd ai-query-optimizer
2. Set up the backend
bashcd backend
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1

# Mac/Linux
source .venv/bin/activate

pip install fastapi uvicorn sqlglot mysql-connector-python openai
3. Set up the frontend
bashcd frontend
npm install
4. Set up Ollama
Download and install Ollama from ollama.com, then pull the model:
bashollama pull llama3.2

Running the Project
You need three things running simultaneously:
Terminal 1 — Ollama (runs in background automatically after install, or run manually):
bashollama serve
Verify it's running at: http://localhost:11434
Terminal 2 — Backend:
bashcd backend
.venv\Scripts\Activate.ps1      # Windows
source .venv/bin/activate        # Mac/Linux
python -m uvicorn main:app --reload
Backend runs at: http://localhost:8000
Swagger docs at: http://localhost:8000/docs
Terminal 3 — Frontend:
bashcd frontend
npm run dev
Frontend runs at: http://localhost:3000

How to Use
Option 1 — Full Analysis (with database)

Open http://localhost:3000
Enter your MySQL credentials in the Full Analysis panel
Click Connect & Analyze — a tick appears and you're redirected to the analyzer
Type any SQL query in the text area
Optionally select an Optimization Goal from the dropdown
Click Analyze Query — results open in a new tab showing:

Issues detected
AI-optimized query (with copy button)
Detailed explanation



Option 2 — Static Analysis (no database needed)

Open http://localhost:3000
Click Analyze Without DB →
Type any SQL query
Click Analyze Query — get instant rule-based analysis + AI recommendation without needing a database connection


Test Queries
Try these queries to see different rules fire:
SELECT * detection + unindexed WHERE:
sqlSELECT * FROM students WHERE major = 'English'
NATURAL JOIN warning:
sqlSELECT sname FROM student NATURAL JOIN enrolled WHERE major = 'English'
Cartesian product (JOIN without ON):
sqlSELECT sname FROM student JOIN faculty WHERE major = 'English'
Leading wildcard LIKE:
sqlSELECT sname FROM student WHERE sname LIKE '%din'
Subquery in IN clause:
sqlSELECT sname FROM student WHERE snum IN (SELECT snum FROM enrolled)
OR in WHERE clause:
sqlSELECT sname FROM student WHERE major = 'English' OR major = 'History'
Non-existent column (column validator):
sqlSELECT sname FROM student WHERE sid = 101
Multiple issues at once:
sqlSELECT DISTINCT * FROM student NATURAL JOIN enrolled WHERE major LIKE '%En' OR standing = 'SR'

Project Structure
ai-query-optimizer/
│
├── backend/
│   ├── main.py                    API routes, CORS, connection store
│   ├── analyzer/
│   │   ├── query_analyzer.py      Core analysis engine (10 rules)
│   │   ├── table_extractor.py     AST-based table name extraction
│   │   └── column_validator.py    Schema column validation
│   ├── ai/
│   │   └── ai_optimizer.py        Ollama LLM integration
│   └── db/
│       ├── db_connection.py       Connection store + get_connection()
│       ├── schema_cache.py        In-memory metadata cache
│       └── schema_extractor.py    MySQL metadata fetcher
│
└── frontend/
    └── app/
        ├── page.js                Home page
        ├── analyzer/
        │   └── page.js            Query analyzer page
        └── results/
            └── page.js            Results page

API Endpoints
MethodEndpointPurposeGET/Health checkPOST/connect-dbConnect to MySQL databasePOST/analyzeAnalyze SQL queryPOST/clear-cacheClear schema metadata cache

Key Architecture Decisions
Lazy Schema Loading
Metadata is fetched only for tables mentioned in the current query — not the entire database. This makes the system scalable to any database size.
In-Memory Schema Caching
Fetched metadata is cached in a Python module-level dictionary. Repeated queries on the same tables hit the cache instantly with no database round-trip.
Two-Layer Analysis
Rule-based analysis catches definite issues instantly. AI analysis adds contextual rewriting and natural language explanation. The rule layer feeds its findings into the AI prompt.
Local AI via Ollama
No API key, no cost, no internet dependency. Ollama runs llama3.2 locally. The OpenAI Python library points to http://localhost:11434 instead of OpenAI's servers.
AST Parsing via sqlglot
SQL is parsed into an Abstract Syntax Tree rather than matched with strings. This correctly handles all syntactic variations and scales to detect complex patterns.

Notes

AI responses take 10-30 seconds on CPU — this is normal for local LLM inference
Schema cache persists for the server session — hit /clear-cache if you modify your database schema
The system currently supports MySQL only
Ollama must be running before starting the backend