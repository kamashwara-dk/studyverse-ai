# StudyVerse AI — Project Documentation

## 1. Use Case

**Problem**: Students juggle multiple academic tasks — understanding concepts, preparing for exams, organizing materials, managing assignments — using fragmented tools. No single platform unifies intelligent learning, research, and productivity.

**Solution**: StudyVerse AI is an intelligent, multimodal AI assistant that combines chat-based tutoring, document Q&A (RAG), voice interaction, image analysis, automated study tools, and an AI agent with multi-step reasoning into one unified web application.

## 2. Features Implemented

| Module | Feature | AI Concepts |
|--------|---------|------------|
| **AI Chat** | Role-based tutoring (Tutor/Researcher/Summarizer) | Role prompting, Prompt-response architecture |
| **Doc Q&A** | Upload PDF/DOCX/TXT → Ask questions with context | RAG pipeline, Embeddings, Vector search |
| **AI Agent** | Multi-step task execution with tool calling | Agent architecture, Planning-execution loop |
| **Summarizer** | Generate structured summaries from any topic | Generative AI, Output formatting |
| **Flashcards** | AI-generated Q&A flashcards with flip animation | Few-shot prompting, JSON output |
| **Quiz** | Interactive quizzes with scoring and explanations | Zero-shot prompting, Structured output |
| **Mind Map** | Visual concept maps rendered as SVG | Generative AI, Data visualization |
| **Vision AI** | Image analysis and captioning | Vision-language models, Multimodal AI |
| **Voice** | Speech-to-text input + text-to-speech output | Voice pipelines, Web Speech API |
| **Poster** | Study poster content generation | Creative AI, Content generation |

## 3. System Design

```
┌─────────────────────────────────────────────────────┐
│                     Frontend                        │
│  ┌──────────┐  ┌───────────┐  ┌─────────────────┐  │
│  │  Chat UI │  │ Study     │  │  Voice/Vision    │  │
│  │  + Voice │  │ Tools UI  │  │  Modules         │  │
│  └────┬─────┘  └─────┬─────┘  └───────┬─────────┘  │
│       └──────────────┼────────────────┘             │
│                      │ HTTP REST API                │
├──────────────────────┼──────────────────────────────┤
│                  Express Server                     │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │ AI       │  │ RAG         │  │ Agent        │   │
│  │ Service  │  │ Pipeline    │  │ Executor     │   │
│  │ (roles)  │  │ (TF-IDF)   │  │ (tools)      │   │
│  └────┬─────┘  └──────┬──────┘  └──────┬───────┘   │
│       └──────────────┬─┘               │            │
├──────────────────────┼─────────────────┼────────────┤
│          NavigateLabs Nexus AI (OpenAI-compatible)   │
└─────────────────────────────────────────────────────┘
```

## 4. Tech Stack

- **Frontend**: HTML5, CSS3 (custom dark theme + glassmorphism), Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI API**: NavigateLabs Nexus AI (OpenAI-compatible)
- **Libraries**: multer (uploads), pdf-parse (PDF), mammoth (DOCX), cors, dotenv
- **Browser APIs**: Web Speech API (STT/TTS)

## 5. How to Run

```bash
cd d:\Projects\Navlab
npm install
node server.js
# Open http://localhost:3000
```

## 6. Key Differentiators

1. **Not just a chatbot** — features multi-step AI agent with planning-execution loop
2. **RAG pipeline built from scratch** — TF-IDF vectorization + cosine similarity, no external vector DB
3. **10 integrated modules** in one unified UI
4. **Covers all 10 AI training concepts** systematically
5. **Premium, production-quality UI** with glassmorphism and micro-animations
