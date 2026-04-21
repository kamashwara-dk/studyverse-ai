# 📚 StudyVerse AI

> **Smart AI Academic Command Center for Students**

A comprehensive, production-ready web application that combines multiple AI capabilities into a unified platform for intelligent learning, research, and academic productivity.

---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Architecture & Working Concept](#architecture--working-concept)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Installation & Setup](#installation--setup)
7. [Deployment](#deployment)
8. [API Endpoints](#api-endpoints)
9. [Environment Variables](#environment-variables)

---

## 🎯 Project Overview

### Problem Statement
Students struggle with fragmented tools for academic tasks—understanding concepts, preparing for exams, organizing materials, and managing assignments. There's no unified platform that intelligently combines tutoring, research, and productivity features.

### Solution
StudyVerse AI is an **intelligent, multimodal AI assistant** that unifies:
- 🤖 AI-powered tutoring with role-based reasoning
- 📄 Document Q&A with Retrieval-Augmented Generation (RAG)
- 🧠 Interactive study tools (flashcards, quizzes, mind maps)
- 👁️ Computer vision for image analysis
- 🎤 Voice interaction (speech-to-text, text-to-speech)
- 🤖 AI Agent with multi-step planning and task execution
- 🎨 Automated content generation (summaries, posters)

All in one beautiful, responsive web interface with a premium glassmorphism UI design.

---

## ✨ Core Features

| Feature | Description | AI Technique |
|---------|-------------|---------------|
| **AI Tutor Chat** | Role-based conversational tutoring with 3 modes: Tutor, Researcher, Summarizer | Role prompting, context-aware responses |
| **Document Q&A (RAG)** | Upload PDF/DOCX/TXT files → ask questions with AI-augmented context retrieval | TF-IDF vectorization, cosine similarity, context injection |
| **Flashcard Generator** | AI-generated Q&A flashcards with interactive flip animation | Few-shot prompting, JSON structured output |
| **Quiz Generator** | Interactive quizzes with scoring, explanations, and multiple choice questions | Zero-shot prompting, structured output parsing |
| **Mind Map Creator** | Visual concept mapping rendered as interactive SVG diagrams | Hierarchical prompt design, SVG rendering |
| **Vision AI** | Image upload and AI-powered analysis with detailed captions | Vision-language models, multimodal understanding |
| **Summarizer** | Generate comprehensive summaries from any topic or content | Generative AI, prompt engineering |
| **Study Poster Generator** | Create study posters with formatted content for visual learning | Content generation, formatting |
| **Voice Interface** | Speech-to-text input and text-to-speech output for hands-free interaction | Web Speech API, audio processing |
| **AI Agent** | Multi-step task execution with planning-execution loop and tool calling | Agent architecture, reasoning chains, tool orchestration |

---

## 🏗️ Architecture & Working Concept

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Frontend)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │   Chat UI   │  │  Study Tools │  │ Voice/Vision/Agent │ │
│  │  (vanilla   │  │   UI         │  │ Modules            │ │
│  │  JS + CSS3) │  │              │  │                    │ │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────────┘ │
└─────────┼──────────────────┼────────────────────┼───────────┘
          │                  │                    │
          └──────────────────┼────────────────────┘
                    REST API (HTTP)
┌─────────────────────────────────────────────────────────────┐
│              EXPRESS SERVER LAYER (Node.js)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes & Middleware                                  │   │
│  │ • /api/chat          (role-based chat)              │   │
│  │ • /api/rag/*         (document upload & query)       │   │
│  │ • /api/study/*       (flashcards, quiz, mind map)   │   │
│  │ • /api/vision/*      (image analysis)                │   │
│  │ • /api/agent/*       (multi-step task execution)     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │                  │                    │
          ├──────────────────┼────────────────────┤
          │                  │                    │
┌─────────▼──────┐  ┌─────────▼──────┐  ┌────────▼─────────┐
│  AI SERVICE    │  │  RAG SERVICE   │  │ AGENT SERVICE    │
│                │  │                │  │                  │
│ • Role prompts │  │ • Text extract │  │ • Tool registry  │
│ • Vision calls │  │ • TF-IDF       │  │ • Planning loop  │
│ • Streaming    │  │   vectorize    │  │ • Tool execution │
│                │  │ • Cosine sim   │  │ • Reasoning      │
│                │  │ • Context inj  │  │                  │
└─────────┬──────┘  └────────┬───────┘  └────────┬─────────┘
          │                  │                    │
          └──────────────────┼────────────────────┘
                    ▼ ▼ ▼ HTTP Requests
      ┌───────────────────────────────────────┐
      │ NavigateLabs Nexus AI                 │
      │ (OpenAI-compatible API)               │
      │ Model: gpt-4.1-nano                   │
      │ - Chat completions                    │
      │ - Vision analysis                     │
      │ - Structured output (JSON mode)       │
      └───────────────────────────────────────┘
```

### Data Flow & Processing Pipelines

#### 1. **Role-Based Chat Flow**
```
User Input 
  ↓
Express Route (/api/chat)
  ↓
AI Service (roleChat)
  ├─ Tutor mode: Education-focused prompting
  ├─ Researcher mode: Research-focused prompting
  └─ Summarizer mode: Concise summary prompting
  ↓
NavigateLabs AI API (Chat Completion)
  ↓
Response → Frontend
```

#### 2. **RAG Pipeline (Document Q&A)**
```
Document Upload 
  ↓
File Extraction (PDF/DOCX/TXT)
  ↓
Text Chunking (500 chars, 100 char overlap)
  ↓
TF-IDF Vectorization (Term Frequency-Inverse Document Frequency)
  ↓
Vector Store (In-memory document store)
  ├─ Storage: documents[].chunks[].vector
  └─ Lifecycle: Per-session (cleared on app restart)
  ↓
User Query 
  ↓
Query Processing
  ├─ Vectorize query using same TF-IDF
  ├─ Cosine similarity search against document vectors
  └─ Top-K retrieval (usually top 3-5 chunks)
  ↓
Context Assembly
  ├─ Retrieved chunks + query
  └─ System prompt for context-aware answering
  ↓
AI API Call with Injected Context
  ↓
Augmented Response → User
```

#### 3. **AI Agent Execution Flow**
```
User Task Request
  ↓
Plan Generation (Multi-step reasoning)
  ├─ AI analyzes task
  ├─ Breaks into sub-tasks
  └─ Selects appropriate tools
  ↓
Tool Execution Loop
  ├─ Tool: summarize → AI Service
  ├─ Tool: flashcards → AI Service (JSON mode)
  ├─ Tool: quiz → AI Service (JSON mode)
  ├─ Tool: mindmap → AI Service (JSON mode)
  └─ Tool: explain → AI Service
  ↓
Result Assembly
  ├─ Collect tool outputs
  ├─ Format results
  └─ Return to user
  ↓
Structured Response → Frontend
```

#### 4. **Vision Analysis Flow**
```
User Image Upload
  ↓
Base64 Encoding (in-browser)
  ↓
Express Route (/api/vision/analyze)
  ├─ Strip data URL prefix
  ├─ Extract base64 payload
  └─ Optional user prompt
  ↓
AI Service (analyzeImage)
  ↓
NavigateLabs Vision API
  ├─ Image: base64 data
  ├─ Prompt: user prompt or default
  └─ Model: gpt-4.1-nano (multimodal)
  ↓
Detailed Image Analysis → Frontend
```

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup with accessibility features
- **CSS3** - Custom design system with glassmorphism, gradients, and animations
- **Vanilla JavaScript (ES6+)** - No framework overhead, pure DOM manipulation
- **Web APIs**: Speech Recognition API, Web Audio API, Canvas API

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js 4.21** - Lightweight HTTP server framework
- **Multer 1.4** - Multipart file upload handling with disk storage

### Document Processing
- **pdf-parse 1.1** - PDF text extraction and parsing
- **mammoth 1.8** - DOCX to HTML/text conversion

### AI & ML
- **NavigateLabs Nexus AI** - OpenAI-compatible API provider
  - Model: `gpt-4.1-nano` (efficient, production-grade)
  - Supports: Chat, Vision, JSON mode (structured output)
- **TF-IDF Vectorization** - Custom implementation for RAG (no external dependencies)

### Infrastructure & Deployment
- **Vercel** - Serverless platform (main deployment)
- **Express Static Server** - Development & fallback
- **Environment Variables** - dotenv for config management
- **CORS** - Cross-origin request handling

### Supporting Libraries
- **cors** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable loading
- **Express.json** - Request body parsing (up to 50MB)

---

## 📁 Project Structure

```
📦 StudyVerse AI
├── 📄 README.md                    # This file
├── 📄 DOCUMENTATION.md             # Detailed technical documentation
├── 📄 package.json                 # Dependencies & scripts
├── 📄 server.js                    # Main Express server
├── 📄 vercel.json                  # Vercel deployment config
│
├── 📁 api/
│   └── index.js                    # Vercel serverless function wrapper
│
├── 📁 public/                      # Frontend assets (static)
│   ├── index.html                  # Main HTML page
│   ├── app.js                      # Frontend JavaScript (all features)
│   └── styles.css                  # Custom CSS (glassmorphism UI)
│
├── 📁 services/                    # Backend business logic
│   ├── ai-service.js               # AI API wrapper (chat, vision, etc)
│   ├── rag-service.js              # RAG pipeline (document Q&A)
│   └── agent-service.js            # AI Agent (multi-step tasks)
│
├── 📁 scripts/
│   └── update-env.ps1              # PowerShell env setup script
│
└── 📁 uploads/                     # Temporary file storage (Vercel: /tmp)
    └── [uploaded documents]
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** 16+ and **npm** 7+
- **API Key** from NavigateLabs Nexus AI (get from admin dashboard)
- **API Base URL** (e.g., https://apidev.navigatelabsai.com)

### Local Development

#### 1. Clone & Install
```bash
cd d:\Projects\Navlab
npm install
```

#### 2. Configure Environment
Create a `.env` file in the root directory:
```env
# AI Configuration
API_KEY=your_navigatelabs_api_key_here
API_BASE_URL=https://apidev.navigatelabsai.com
AI_MODEL=gpt-4.1-nano

# Server Configuration
PORT=3000
NODE_ENV=development
```

#### 3. Start Development Server
```bash
npm start
# or
node server.js
```

#### 4. Access Application
Open your browser and navigate to:
```
http://localhost:3000
```

### Troubleshooting
- **Port already in use**: Change `PORT` in `.env` to an available port
- **API Key invalid**: Verify your API key in NavigateLabs dashboard
- **Document upload fails**: Ensure `/uploads` directory exists and has write permissions
- **CORS errors**: Check that API_BASE_URL is correct

---

## 🌐 Deployment

### Deploy to Vercel (Production)

#### 1. Prepare GitHub Repository
```bash
git add .
git commit -m "Production release: StudyVerse AI"
git push origin main
```

#### 2. Import in Vercel
- Go to [Vercel Dashboard](https://vercel.com)
- Click "Add New" → "Project"
- Import your GitHub repository
- Select your project

#### 3. Configure Environment Variables
In **Vercel Dashboard** → **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `API_KEY` | Your NavigateLabs API key |
| `API_BASE_URL` | https://apidev.navigatelabsai.com |
| `AI_MODEL` | gpt-4.1-nano |
| `NODE_ENV` | production |

#### 4. Deploy
- Vercel auto-deploys on `main` branch push
- Or manually trigger in dashboard
- Your app is now live at: `https://your-project.vercel.app`

#### 5. File Upload Handling
- Vercel uses `/tmp` for temporary files
- Server automatically detects Vercel environment
- Uploaded files are temp and cleared after request

---

## 📡 API Endpoints

### Health & Status
```
GET /api/health
Response: { status: "ok", service: "StudyVerse AI", version: "1.0.0" }
```

### Chat & Tutoring
```
POST /api/chat
Body: {
  "message": "Explain quantum computing",
  "role": "tutor",           // "tutor" | "researcher" | "summarizer"
  "context": "optional context"
}
Response: { response: "...", role: "tutor" }
```

### Document Q&A (RAG)
```
POST /api/rag/upload
Body: multipart/form-data { document: File }
Response: { message: "...", document: { id, name, chunks_count } }

POST /api/rag/query
Body: { "query": "What is the main topic?" }
Response: { query: "...", results: [{text, source, confidence}], context: "..." }

GET /api/rag/documents
Response: { documents: [{id, name, chunk_count}] }

DELETE /api/rag/documents
Response: { message: "All documents cleared" }
```

### Study Tools
```
POST /api/study/summarize
Body: { "topic": "Machine Learning", "content": "optional content" }
Response: { response: "..." }

POST /api/study/flashcards
Body: { "topic": "Biology", "content": "optional", "count": 5 }
Response: { flashcards: [{question, answer, hint}], topic: "..." }

POST /api/study/quiz
Body: { "topic": "History", "content": "optional", "count": 4 }
Response: { quiz: [{question, options, correct_answer, explanation}] }

POST /api/study/mindmap
Body: { "topic": "Programming Languages" }
Response: { mindmap: {svg, title, nodes} }
```

### Vision & Image Analysis
```
POST /api/vision/analyze
Body: { 
  "image": "data:image/png;base64,...",
  "prompt": "What's in this image?"
}
Response: { response: "..." }
```

### AI Agent
```
POST /api/agent/execute
Body: { "task": "Create a study plan for Physics" }
Response: {
  plan: [...],
  results: {...},
  toolsCalled: [...]
}
```

---

## 🔐 Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `API_KEY` | ✅ | NavigateLabs API authentication key | `sk-xxx...` |
| `API_BASE_URL` | ✅ | AI provider endpoint | `https://apidev.navigatelabsai.com` |
| `AI_MODEL` | ❌ | LLM model to use | `gpt-4.1-nano` |
| `PORT` | ❌ | Server listening port | `3000` |
| `NODE_ENV` | ❌ | Environment type | `development` or `production` |

---

## 🎓 Key Concepts Implemented

This project systematically demonstrates AI/ML concepts:

1. **Role Prompting** - Different roles (tutor, researcher, summarizer) via prompt engineering
2. **RAG (Retrieval-Augmented Generation)** - TF-IDF + cosine similarity for context injection
3. **Structured Output** - JSON mode for consistent, parsable responses
4. **Vision-Language Models** - Multimodal AI for image understanding
5. **Agent Architecture** - Planning-execution loop with tool calling and reasoning
6. **Few-Shot Learning** - Example-based prompting for consistent outputs
7. **Vector Search** - Custom TF-IDF implementation without external vector DBs
8. **Context Management** - Effective context injection for relevant responses
9. **Error Handling** - Graceful fallbacks and user-friendly error messages
10. **Multimodal Interaction** - Voice, text, image, and structured outputs

---

## 🔄 How It Works: Complete User Journey

### Example: Student learning Calculus
1. **Chat**: "Explain derivatives" → Tutor role explains with examples
2. **Upload**: Student uploads textbook PDF
3. **Q&A**: "What's the chain rule?" → RAG retrieves relevant section from PDF + AI generates answer
4. **Study**: "Generate flashcards on calculus" → 6 interactive flashcards created
5. **Quiz**: "Create a quiz" → 4 questions with scoring and explanations
6. **Visual**: "Create mind map of calculus topics" → SVG mind map generated
7. **Agent**: "Create a study plan" → Multi-step plan with summaries, flashcards, and quiz

All powered by AI, all in one interface.

---

## 📊 Performance & Scalability

- **Response Time**: ~1-3s for most requests (AI API dependent)
- **File Upload**: Supports up to 20MB files (configurable)
- **Concurrent Users**: Vercel auto-scales serverless functions
- **Storage**: Temporary files in `/tmp` (cleared on request completion)
- **Request Body**: Up to 50MB for base64 images

---

## 🎨 UI/UX Highlights

- **Glassmorphism Design** - Modern, premium look with frosted glass effects
- **Dark Theme** - Easy on eyes, reduces strain during long study sessions
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Smooth Animations** - Micro-interactions for better feedback
- **Keyboard Shortcuts** - Power users can work faster
- **Voice Interface** - Hands-free interaction with speech recognition

---

## 🤝 Contributing

To improve StudyVerse AI:
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test locally
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push and create a Pull Request

---

## 📝 License

This project is proprietary. All rights reserved © 2024.

---

## 📞 Support

For issues, questions, or feedback:
- Check [DOCUMENTATION.md](DOCUMENTATION.md) for technical details
- Review API endpoints above
- Check environment variables are correctly configured

---

## 🚀 Version History

- **v1.0.0** (Current) - Full launch with all 10 features
  - AI Chat (3 roles)
  - RAG Pipeline
  - Study Tools (flashcards, quiz, mind map)
  - Vision AI
  - Voice Interface
  - AI Agent
  - Deployed to Vercel

---

**Built with ❤️ for students by the StudyVerse Team**
- TF-IDF Vector Search for RAG
- PDF & DOCX parsing
- Vanilla JavaScript frontend
