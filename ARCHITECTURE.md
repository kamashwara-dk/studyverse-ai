# StudyVerse AI - Architecture Documentation

## Overview

This document provides comprehensive architectural documentation for StudyVerse AI, including system design, data flows, and component interactions.

---

## 1. System Architecture

### High-Level Components

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

### Key Architectural Patterns

#### 1. **Three-Tier Architecture**
- **Presentation Tier**: HTML5/CSS3 frontend with vanilla JavaScript
- **Application Tier**: Express.js backend with route handlers
- **Service Tier**: Business logic services (AI, RAG, Agent)
- **Integration Tier**: External API (NavigateLabs Nexus AI)

#### 2. **Service-Oriented Architecture (SOA)**
Each service has a specific responsibility:
- **AI Service**: Wraps all AI API calls with role prompting, vision, and structured output
- **RAG Service**: Manages document lifecycle and retrieval-augmented generation
- **Agent Service**: Orchestrates multi-step tasks with tool calling

#### 3. **REST API Design**
Clean, resource-based endpoints following REST conventions:
```
GET    /api/health              # Health check
POST   /api/chat                # Chat with roles
POST   /api/rag/upload          # Upload document
POST   /api/rag/query           # Query documents
GET    /api/rag/documents       # List documents
DELETE /api/rag/documents       # Clear documents
POST   /api/study/summarize     # Generate summary
POST   /api/study/flashcards    # Generate flashcards
POST   /api/study/quiz          # Generate quiz
POST   /api/study/mindmap       # Generate mind map
POST   /api/vision/analyze      # Analyze image
POST   /api/agent/execute       # Execute AI agent task
```

---

## 2. Data Flow Diagrams

### 2.1 Role-Based Chat Flow

```
User Input 
  ↓
Express Route (/api/chat)
  ├─ Extract: message, role (tutor/researcher/summarizer), context
  └─ Validate: message required
  ↓
AI Service (roleChat)
  ├─ Load role-specific system prompt
  ├─ Assemble messages array
  │  ├─ System message (role instruction)
  │  ├─ User context (if provided)
  │  └─ User message
  └─ Call chatCompletion
  ↓
NavigateLabs API
  ├─ Model: gpt-4.1-nano
  ├─ Temperature: 0.7 (balanced creativity)
  ├─ Max tokens: 2048
  └─ Streaming: optional
  ↓
Parse Response
  ├─ Extract completion text
  ├─ Handle errors gracefully
  └─ Format response
  ↓
Client Response
  {
    response: "...",
    role: "tutor"
  }
```

### 2.2 RAG Pipeline (Document Q&A)

#### Upload Phase
```
Document Upload (PDF/DOCX/TXT)
  ↓
Multer Middleware
  ├─ Validate file type
  ├─ Store to disk (/uploads or /tmp)
  └─ Pass file info to handler
  ↓
Extract Text
  ├─ if PDF: use pdf-parse
  ├─ if DOCX: use mammoth
  └─ if TXT: read directly
  ↓
Text Cleaning
  ├─ Remove extra whitespace
  ├─ Normalize line endings
  └─ Handle special characters
  ↓
Chunk Text (Sliding Window)
  ├─ Split on sentence boundaries
  ├─ Target size: 500 characters
  ├─ Overlap: 100 characters
  └─ Preserve context across chunks
  ↓
TF-IDF Vectorization
  ├─ Calculate term frequencies
  ├─ Calculate document frequencies
  ├─ Compute TF-IDF weights
  └─ Store vector per chunk
  ↓
Store in Document Store
  {
    documents: [
      {
        id: "uuid",
        name: "filename.pdf",
        uploadedAt: "timestamp",
        chunks: [
          { text: "...", vector: [...] },
          { text: "...", vector: [...] }
        ]
      }
    ]
  }
```

#### Query Phase
```
User Query
  ↓
Query Vectorization
  ├─ Apply same TF-IDF calculation
  ├─ Generate query vector
  └─ Normalize vector
  ↓
Similarity Search
  ├─ For each document in store:
  │  ├─ For each chunk:
  │  │  ├─ Calculate cosine similarity
  │  │  │  = (queryVector · chunkVector) / 
  │  │  │    (||queryVector|| × ||chunkVector||)
  │  │  └─ Score chunk
  │  └─ Sort by score
  ├─ Select Top-K (usually 3-5)
  └─ Return ranked results
  ↓
Context Assembly
  ├─ Collect top-K chunks
  ├─ Combine with user query
  ├─ Add system prompt
  └─ Create augmented prompt
  ↓
AI API Call
  {
    messages: [
      { role: "system", content: "Context-aware instruction" },
      { role: "user", content: "Query + Context" }
    ],
    model: "gpt-4.1-nano"
  }
  ↓
Augmented Response
  ├─ AI generates answer using injected context
  ├─ Include source information
  └─ Format with confidence
```

### 2.3 AI Agent Execution Flow

```
User Task Request
  e.g., "Create a comprehensive study plan for Chemistry"
  ↓
Parse & Understand
  ├─ Extract task objective
  ├─ Identify complexity level
  └─ Determine required tools
  ↓
Planning Phase (AI-Driven)
  ├─ AI analyzes task using system prompt
  ├─ Breaks into logical sub-tasks
  ├─ Plans tool calling sequence
  └─ Defines success criteria
  ↓
Tool Execution Loop
  ├─ Tool 1: Summarize topic
  │  └─ Call roleChat("summarizer", task)
  ├─ Tool 2: Generate flashcards
  │  └─ Call generateFlashcards(topic)
  ├─ Tool 3: Generate quiz
  │  └─ Call generateQuiz(topic)
  ├─ Tool 4: Create mind map
  │  └─ Call generateMindMap(topic)
  └─ Tool 5: Detailed explanation
     └─ Call roleChat("tutor", topic)
  ↓
Result Aggregation
  ├─ Collect all tool outputs
  ├─ Validate results
  ├─ Format consistently
  └─ Assemble package
  ↓
Response Assembly
  {
    plan: [...],
    results: {
      summary: "...",
      flashcards: [...],
      quiz: [...],
      mindmap: {...},
      explanation: "..."
    },
    toolsCalled: ["summarize", "flashcards", "quiz", "mindmap", "explain"]
  }
```

### 2.4 Vision Analysis Flow

```
User Image Input
  ├─ User uploads image (JPEG/PNG/WebP)
  ├─ Optional prompt provided
  └─ Image converted to base64 in browser
  ↓
Express Route (/api/vision/analyze)
  ├─ Receive base64 + optional prompt
  ├─ Validate image data
  └─ Strip data URL prefix
  ↓
AI Service (analyzeImage)
  ├─ Prepare vision request
  ├─ Image: base64 encoded
  ├─ Prompt: user provided or default
  └─ Model: gpt-4.1-nano (multimodal)
  ↓
NavigateLabs Vision API
  ├─ Send: { image: "base64", prompt: "..." }
  ├─ Process multimodal input
  └─ Generate understanding
  ↓
Detailed Analysis
  ├─ Object identification
  ├─ Text extraction (OCR)
  ├─ Context understanding
  ├─ Detailed description
  └─ Educational insights
  ↓
Client Response
  {
    response: "Detailed analysis...",
    imageUrl: "data:image/...;base64,...",
    timestamp: "2024-01-01T00:00:00Z"
  }
```

---

## 3. Service Layer Architecture

### 3.1 AI Service (`services/ai-service.js`)

**Responsibilities:**
- Wrap NavigateLabs API calls
- Implement role-based prompting
- Handle vision analysis
- Generate structured outputs (JSON mode)
- Manage streaming responses

**Key Functions:**

```javascript
// Core API call wrapper
async function chatCompletion(messages, options = {})
  - Handles authentication
  - Error handling & retry logic
  - Response parsing
  - Supports JSON mode for structured output

// Role-based chat
async function roleChat(role, message, context = '')
  - Tutor: Education-focused explanations
  - Researcher: Research-oriented responses
  - Summarizer: Concise summaries

// Vision analysis
async function analyzeImage(base64, prompt = '')
  - Multimodal image understanding
  - Optional custom prompt
  - Detailed scene analysis

// Study tools generation
async function generateFlashcards(topic, content, count)
async function generateQuiz(topic, content, count)
async function generateMindMap(topic)
  - JSON-structured outputs
  - Consistent formatting
  - Multiple use cases
```

**Error Handling:**
- API unreachable → 502 error
- Invalid API key → 401 error
- Rate limiting → 429 error (with retry)
- Parse errors → 500 error with context

### 3.2 RAG Service (`services/rag-service.js`)

**Responsibilities:**
- Document text extraction
- Text chunking with overlap
- TF-IDF vectorization
- Vector similarity search
- Document store management

**In-Memory Document Store:**
```javascript
const documentStore = {
  documents: [
    {
      id: "uuid",
      name: "file.pdf",
      uploadedAt: "2024-01-01T00:00:00Z",
      mimetype: "application/pdf",
      chunks: [
        {
          text: "chunk content",
          vector: [0.12, 0.45, -0.23, ...],
          index: 0
        }
      ]
    }
  ]
}
```

**TF-IDF Algorithm:**
```
TF(term, document) = count(term) / total_terms_in_document
IDF(term) = log(total_documents / documents_containing_term)
TF-IDF(term, document) = TF(term, document) × IDF(term)

Cosine Similarity = (A · B) / (||A|| × ||B||)
  where A = query vector, B = document chunk vector
```

**Key Functions:**

```javascript
async function processDocument(filePath, fileName, mimeType)
  - Extract text from file
  - Chunk text intelligently
  - Vectorize chunks
  - Store in memory

async function queryDocuments(query)
  - Vectorize query
  - Search across all chunks
  - Retrieve top-K results
  - Assemble context

function getDocuments()
  - Return list of uploaded documents
  - Include metadata

function clearDocuments()
  - Reset in-memory store
  - Remove all documents
```

### 3.3 Agent Service (`services/agent-service.js`)

**Responsibilities:**
- Tool registry management
- Planning-execution loop orchestration
- Multi-step task coordination
- Result assembly and formatting

**Tool Registry:**
```javascript
const TOOLS = {
  summarize: { /* Execute summarization */ },
  explain: { /* Detailed explanation */ },
  flashcards: { /* Generate flashcards */ },
  quiz: { /* Generate quiz */ },
  mindmap: { /* Generate mind map */ },
  compare: { /* Comparison analysis */ },
  brainstorm: { /* Brainstorming ideas */ }
}
```

**Execution Pattern:**
1. **Analysis**: AI understands task requirements
2. **Planning**: AI determines tool sequence
3. **Execution**: Tools called in order
4. **Aggregation**: Results collected and formatted
5. **Response**: Package assembled for client

---

## 4. Frontend Architecture

### Component Structure

```
public/
├── index.html              # Main entry point
├── app.js                  # All JavaScript functionality
│   ├── Initialize DOM
│   ├── Event listeners
│   ├── API communication
│   ├── UI updates
│   └─ Feature modules:
│       ├─ Chat Module
│       ├─ RAG Module
│       ├─ Study Tools Module
│       ├─ Vision Module
│       ├─ Voice Module
│       └─ Agent Module
└── styles.css              # Glassmorphism UI design
    ├─ Dark theme variables
    ├─ Responsive grid
    ├─ Animations
    └─ Component styles
```

### Frontend Data Flow

```
User Interaction
  ↓
Event Listener (click, change, submit)
  ↓
Validate Input
  ├─ Check required fields
  ├─ Validate file types
  └─ Check data format
  ↓
API Request (fetch)
  ├─ POST to Express endpoint
  ├─ JSON body or FormData
  └─ Handle response
  ↓
Receive Response
  ├─ Parse JSON
  ├─ Check for errors
  └─ Extract data
  ↓
Update UI
  ├─ Render results
  ├─ Animate transitions
  ├─ Update state
  └─ Clear loading states
  ↓
User Feedback
```

### UI/UX Features

- **Glassmorphism Design**: Frosted glass effect with transparency
- **Dark Theme**: Reduces eye strain, modern aesthetic
- **Responsive Layout**: Mobile, tablet, desktop support
- **Smooth Animations**: Transitions and micro-interactions
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages
- **Voice Interface**: Speech recognition input

---

## 5. Deployment Architecture

### Vercel Serverless Deployment

```
GitHub Repository
  ↓
Push to main branch
  ↓
Vercel Webhook Trigger
  ↓
Build Process
  ├─ npm install
  ├─ Build (if build step defined)
  └─ Prepare serverless functions
  ↓
api/index.js (Vercel Function)
  ├─ Wraps Express app
  ├─ Exports as handler
  └─ Runs on serverless runtime
  ↓
Environment Variables (from Vercel dashboard)
  ├─ API_KEY
  ├─ API_BASE_URL
  ├─ NODE_ENV: production
  └─ PORT: (ignored on Vercel)
  ↓
File Upload Handling
  ├─ Use /tmp directory
  ├─ Auto-cleanup after request
  └─ No persistent storage
  ↓
Deployed at: https://your-project.vercel.app
```

### Environment Detection

```javascript
// Vercel detection
if (process.env.VERCEL) {
  uploadDir = '/tmp/uploads'
} else {
  uploadDir = path.join(__dirname, 'uploads')
}
```

### Cold Start Optimization

- No dependencies installed on each request
- Minimal initialization overhead
- Express app initialized once per container
- Connection pooling for API calls

---

## 6. Error Handling & Resilience

### Error Hierarchy

```
UserError (400-series)
├─ Bad Request (400): Invalid input
├─ Unauthorized (401): Auth failure
└─ Not Found (404): Resource not found

ServerError (500-series)
├─ Internal Error (500): Unexpected error
├─ Bad Gateway (502): External API failure
└─ Service Unavailable (503): Temp unavailable
```

### Retry Strategy

- **API Calls**: Automatic retry on transient failures
- **Rate Limiting**: Exponential backoff (retry-after)
- **Timeout**: 30s default timeout for API calls

### Logging

```javascript
// Error logging structure
console.error(label, error)
// Returns: { code, message, stack, statusCode }

// User-friendly error response
{
  error: "User-friendly message",
  code: "ERROR_CODE",
  timestamp: "2024-01-01T00:00:00Z"
}
```

---

## 7. Performance Considerations

### Optimization Strategies

1. **Request Caching**
   - Store frequently retrieved documents
   - Cache vectorization results
   - Session-based caching

2. **Response Streaming**
   - Stream large text responses
   - Support partial updates
   - Real-time feedback to user

3. **File Upload Optimization**
   - Limit file size to 20MB
   - Compress documents on client if possible
   - Async processing for large files

4. **Database Query Optimization**
   - Index documents by ID
   - Efficient similarity search algorithm
   - Limit results (Top-K retrieval)

### Benchmarks

- **Chat Response**: ~1-2s (API dependent)
- **Document Upload**: ~2-5s (file size dependent)
- **RAG Query**: ~1-3s (document size dependent)
- **Flashcard Generation**: ~2-3s
- **Mind Map Creation**: ~2-3s
- **Image Analysis**: ~2-4s

---

## 8. Security Considerations

### API Authentication
- Bearer token authentication with API_KEY
- Secrets stored in environment variables
- No secrets in client-side code

### Input Validation
- File type validation (PDF, DOCX, TXT)
- File size limits (20MB)
- Request body size limits (50MB)
- XSS protection through content sanitization

### Data Privacy
- No persistent document storage (in-memory only)
- No data retention on Vercel (temp files cleared)
- CORS configuration for API access
- HTTPS-only in production

### Error Information
- Generic error messages to clients
- Detailed logging for debugging
- No sensitive info in error responses

---

## 9. Scalability

### Horizontal Scaling (Vercel)
- Auto-scales serverless functions
- No shared state between instances
- Independent request processing

### Limitations & Considerations
- In-memory document store (not scalable across instances)
- No persistent database for documents
- Per-request session management only

### Recommendations for Production Scale
- Implement persistent vector database (e.g., Pinecone, Weaviate)
- Add Redis for session management
- Implement distributed caching
- Use message queue for async tasks
- Monitor API rate limits and implement throttling

---

## 10. Tech Stack Deep Dive

### Frontend
- **HTML5**: Semantic markup for accessibility
- **CSS3**: Custom design system, no CSS framework
- **JavaScript ES6+**: Modern features, fetch API
- **Web APIs**: Speech Recognition, Canvas, Audio

### Backend
- **Node.js**: JavaScript runtime, async I/O
- **Express.js**: Lightweight HTTP framework
- **Multer**: Multipart form data handling
- **cors**: Cross-origin resource sharing

### Document Processing
- **pdf-parse**: PDF text extraction
- **mammoth**: DOCX to HTML/text conversion

### AI/ML
- **NavigateLabs Nexus AI**: OpenAI-compatible LLM API
- **TF-IDF**: Custom vector space model for search
- **Cosine Similarity**: Vector similarity metric

### Infrastructure
- **Vercel**: Serverless deployment platform
- **Environment Variables**: dotenv for config
- **GitHub**: Version control and CI/CD

---

## 11. Future Architecture Enhancements

### Recommended Improvements

1. **Persistent Storage**
   - Add PostgreSQL for documents metadata
   - Implement vector database for RAG scaling

2. **Advanced Caching**
   - Redis for session management
   - CDN for static assets

3. **Monitoring & Analytics**
   - Real-time error tracking (Sentry)
   - Performance monitoring (DataDog)
   - Usage analytics

4. **Advanced Security**
   - JWT token authentication
   - Rate limiting middleware
   - DDoS protection

5. **Enhanced RAG**
   - Hybrid search (lexical + semantic)
   - Multi-model embeddings
   - Semantic caching

---

## 12. References

- **Express.js Documentation**: https://expressjs.com/
- **NavigateLabs API Docs**: https://api.navigatelabs.ai/docs
- **TF-IDF Algorithm**: https://en.wikipedia.org/wiki/Tf%E2%80%93idf
- **Cosine Similarity**: https://en.wikipedia.org/wiki/Cosine_similarity
- **Vercel Deployment**: https://vercel.com/docs
- **RAG Pattern**: https://aws.amazon.com/what-is/retrieval-augmented-generation/
- **Agent Architecture**: https://en.wikipedia.org/wiki/Intelligent_agent

---

**Last Updated:** April 21, 2026  
**Architecture Version:** 1.0.0  
**Status:** Production Ready
