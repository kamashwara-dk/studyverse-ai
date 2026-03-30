// ============================================
// StudyVerse AI — Express Server
// Main API server with all routes
// ============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const aiService = require('./services/ai-service');
const ragService = require('./services/rag-service');
const agentService = require('./services/agent-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function handleError(res, error, label = '') {
  if (label) console.error(label, error);
  else console.error(error);
  const status = error && error.statusCode ? error.statusCode : 500;
  res.status(status).json({ error: error.message || 'Internal server error' });
}

// File upload config (use /tmp for Vercel serverless)
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'StudyVerse AI', version: '1.0.0' });
});

// Root route for Vercel
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- General Chat ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, role = 'tutor', context = '' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const response = await aiService.roleChat(role, message, context);
    res.json({ response, role });
  } catch (error) {
    handleError(res, error, 'Chat error:');
  }
});

// --- RAG: Upload Document ---
app.post('/api/rag/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await ragService.processDocument(
      req.file.path,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      message: 'Document processed successfully',
      document: result,
    });
  } catch (error) {
    handleError(res, error, 'Upload error:');
  }
});

// --- RAG: Query Documents ---
app.post('/api/rag/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const result = await ragService.queryDocuments(query);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'RAG query error:');
  }
});

// --- RAG: List Documents ---
app.get('/api/rag/documents', (req, res) => {
  res.json({ documents: ragService.getDocuments() });
});

// --- RAG: Clear Documents ---
app.delete('/api/rag/documents', (req, res) => {
  ragService.clearDocuments();
  res.json({ message: 'All documents cleared' });
});

// --- Vision: Analyze Image ---
app.post('/api/vision/analyze', async (req, res) => {
  try {
    const { image, prompt } = req.body;
    if (!image) return res.status(400).json({ error: 'Image data is required' });

    // Strip data URL prefix if present
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const response = await aiService.analyzeImage(base64, prompt);
    res.json({ response });
  } catch (error) {
    handleError(res, error, 'Vision error:');
  }
});

// --- Study Tools: Summarize ---
app.post('/api/study/summarize', async (req, res) => {
  try {
    const { topic, content = '' } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const response = await aiService.roleChat('summarizer',
      `Create a comprehensive summary for: "${topic}"${content ? `\n\nUsing this content:\n${content}` : ''}`
    );
    res.json({ response });
  } catch (error) {
    handleError(res, error, 'Summarize error:');
  }
});

// --- Study Tools: Flashcards ---
app.post('/api/study/flashcards', async (req, res) => {
  try {
    const { topic, content = '', count = 6 } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const result = await aiService.generateFlashcards(topic, content, count);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Flashcards error:');
  }
});

// --- Study Tools: Quiz ---
app.post('/api/study/quiz', async (req, res) => {
  try {
    const { topic, content = '', count = 5 } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const result = await aiService.generateQuiz(topic, content, count);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Quiz error:');
  }
});

// --- Study Tools: Mind Map ---
app.post('/api/study/mindmap', async (req, res) => {
  try {
    const { topic, content = '' } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const result = await aiService.generateMindMap(topic, content);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Mindmap error:');
  }
});

// --- AI Agent: Execute Task ---
app.post('/api/agent/execute', async (req, res) => {
  try {
    const { task } = req.body;
    if (!task) return res.status(400).json({ error: 'Task is required' });

    const result = await agentService.executeAgent(task);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Agent error:');
  }
});

// --- Poster Generator ---
app.post('/api/poster/generate', async (req, res) => {
  try {
    const { topic, style = 'academic' } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const response = await aiService.generatePoster(topic, style);
    res.json({ response });
  } catch (error) {
    handleError(res, error, 'Poster error:');
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server (only in local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🚀 StudyVerse AI is running at http://localhost:${PORT}`);
    console.log(`📚 API Base: ${process.env.API_BASE_URL}`);
    console.log(`🔑 API Key: ${process.env.API_KEY ? '✓ Configured' : '✗ Missing'}\n`);
  });
}

// Export for Vercel serverless
module.exports = app;
