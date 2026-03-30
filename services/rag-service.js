// ============================================
// StudyVerse AI — RAG Pipeline Service
// Text extraction, chunking, TF-IDF vector search
// ============================================
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { roleChat } = require('./ai-service');

// In-memory document store (per-session)
const documentStore = {
  documents: [],  // { id, name, chunks: [{ text, vector }] }
};

/**
 * Extract text from uploaded file
 */
async function extractText(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    // Plain text
    return fs.readFileSync(filePath, 'utf-8');
  }
}

/**
 * Chunk text with sliding window
 */
function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = [];
  const sentences = text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Overlap: keep last portion
      const words = current.split(' ');
      const overlapWords = words.slice(Math.max(0, words.length - Math.floor(overlap / 5)));
      current = overlapWords.join(' ') + ' ' + sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Simple TF-IDF vectorization (no external library needed)
 * Demonstrates the concept of embeddings and vector search
 */
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function buildVocabulary(chunks) {
  const vocab = new Set();
  chunks.forEach(chunk => tokenize(chunk).forEach(t => vocab.add(t)));
  return [...vocab];
}

function computeTFIDF(chunk, vocabulary, idf) {
  const tokens = tokenize(chunk);
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const maxTf = Math.max(...Object.values(tf), 1);

  return vocabulary.map(word => {
    const termFreq = (tf[word] || 0) / maxTf;
    return termFreq * (idf[word] || 0);
  });
}

function computeIDF(chunks, vocabulary) {
  const idf = {};
  const N = chunks.length;
  vocabulary.forEach(word => {
    const docsWithWord = chunks.filter(c =>
      tokenize(c).includes(word)
    ).length;
    idf[word] = Math.log((N + 1) / (docsWithWord + 1)) + 1;
  });
  return idf;
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  return magA && magB ? dot / (magA * magB) : 0;
}

/**
 * Process and store a document
 */
async function processDocument(filePath, fileName, mimeType) {
  const text = await extractText(filePath, mimeType);
  const chunks = chunkText(text);

  // Build TF-IDF vectors
  const vocabulary = buildVocabulary(chunks);
  const idf = computeIDF(chunks, vocabulary);
  const vectorizedChunks = chunks.map(chunk => ({
    text: chunk,
    vector: computeTFIDF(chunk, vocabulary, idf),
  }));

  const docId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const doc = {
    id: docId,
    name: fileName,
    chunks: vectorizedChunks,
    vocabulary,
    idf,
    fullText: text.substring(0, 5000), // Store first 5000 chars for context
  };

  documentStore.documents.push(doc);
  return { id: docId, name: fileName, chunkCount: chunks.length, textLength: text.length };
}

/**
 * Query documents using vector search + RAG
 */
async function queryDocuments(query, topK = 3) {
  if (documentStore.documents.length === 0) {
    return { answer: 'No documents uploaded yet. Please upload study materials first.', sources: [] };
  }

  // Search across all documents
  const results = [];
  for (const doc of documentStore.documents) {
    const queryVector = computeTFIDF(query, doc.vocabulary, doc.idf);
    for (const chunk of doc.chunks) {
      const score = cosineSimilarity(queryVector, chunk.vector);
      results.push({ text: chunk.text, score, docName: doc.name });
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, topK);

  // Build context for RAG
  const context = topResults
    .map((r, i) => `[Source ${i + 1} - ${r.docName}]:\n${r.text}`)
    .join('\n\n');

  // Generate answer with context (RAG)
  const answer = await roleChat('tutor', query,
    `Answer based on the following study material excerpts. If the answer isn't in the provided material, say so but still try to help.\n\n${context}`
  );

  return {
    answer,
    sources: topResults.map(r => ({
      document: r.docName,
      excerpt: r.text.substring(0, 150) + '...',
      relevance: Math.round(r.score * 100),
    })),
  };
}

/**
 * Get all stored documents info
 */
function getDocuments() {
  return documentStore.documents.map(d => ({
    id: d.id,
    name: d.name,
    chunks: d.chunks.length,
  }));
}

/**
 * Clear all documents
 */
function clearDocuments() {
  documentStore.documents = [];
}

module.exports = {
  processDocument,
  queryDocuments,
  getDocuments,
  clearDocuments,
};
