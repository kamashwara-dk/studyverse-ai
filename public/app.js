// ============================================
// StudyVerse AI — Main Application Logic
// Module Navigation, API Integration, Voice/Vision
// ============================================

const API_BASE = '';

// ============================================
// Theme Toggle
// ============================================

const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;

// Load saved theme or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
htmlElement.setAttribute('data-theme', savedTheme);

// Toggle theme
themeToggle.addEventListener('click', () => {
  const currentTheme = htmlElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  htmlElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Add animation
  themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
  setTimeout(() => {
    themeToggle.style.transform = '';
  }, 300);
});

// ============================================
// Utility Functions
// ============================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function showLoading(text = 'StudyVerse AI is thinking...') {
  const overlay = document.getElementById('loadingOverlay');
  overlay.querySelector('.loader-text').textContent = text;
  overlay.classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

async function apiCall(endpoint, data = {}, method = 'POST') {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Simple markdown to HTML renderer
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?:\s*<br>)*/g, '$1');
  html = html.replace(/((?:<li>[\s\S]*?<\/li>\s*)+)/g, '<ul>$1</ul>');

  return `<p>${html}</p>`;
}

// ============================================
// Navigation
// ============================================

const MODULE_INFO = {
  chat: { title: 'AI Chat', badge: 'Multimodal Tutor' },
  rag: { title: 'Document Q&A', badge: 'RAG Pipeline' },
  agent: { title: 'AI Agent', badge: 'Multi-Step Executor' },
  summary: { title: 'Summarizer', badge: 'Study Tool' },
  flashcards: { title: 'Flashcards', badge: 'Active Recall' },
  quiz: { title: 'Quiz', badge: 'Self Assessment' },
  mindmap: { title: 'Mind Map', badge: 'Visual Learning' },
  vision: { title: 'Vision AI', badge: 'Image Analysis' },
  voice: { title: 'Voice Assistant', badge: 'Speech Pipeline' },
  poster: { title: 'Study Poster', badge: 'Content Creator' },
};

function switchModule(moduleName) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-module="${moduleName}"]`)?.classList.add('active');

  // Update panels
  document.querySelectorAll('.module-panel').forEach(panel => panel.classList.remove('active'));
  document.getElementById(`panel-${moduleName}`)?.classList.add('active');

  // Update topbar
  const info = MODULE_INFO[moduleName] || { title: moduleName, badge: '' };
  document.getElementById('pageTitle').textContent = info.title;
  document.getElementById('pageBadge').textContent = info.badge;

  // Show/hide role selector
  const roleSelector = document.querySelector('.ai-mode-selector');
  roleSelector.style.display = moduleName === 'chat' ? 'flex' : 'none';

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

// Nav click handlers
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => switchModule(item.dataset.module));
});

// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ============================================
// Chat Module
// ============================================

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

function addChatMessage(text, type = 'ai', container = chatMessages) {
  // Remove welcome message
  const welcome = container.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  msg.innerHTML = `
    <div class="message-avatar">${type === 'user' ? '👤' : '🧠'}</div>
    <div class="message-content">${type === 'ai' ? renderMarkdown(text) : text}</div>
  `;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addChatMessage(message, 'user');
  chatInput.value = '';
  chatInput.style.height = 'auto';

  showLoading();
  try {
    const role = document.getElementById('aiRole').value;
    const data = await apiCall('/api/chat', { message, role });
    addChatMessage(data.response, 'ai');
  } catch (error) {
    addChatMessage(`⚠️ Error: ${error.message}`, 'ai');
    showToast(error.message, 'error');
  }
  hideLoading();
}

document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});

// Auto-resize textarea
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

// Quick message buttons
window.sendQuickMessage = function(msg) {
  chatInput.value = msg;
  sendChatMessage();
};

// ============================================
// Voice Module (Chat + Standalone)
// ============================================

let recognition = null;
let isRecording = false;

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Speech recognition not supported in this browser', 'error');
    return null;
  }
  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = 'en-US';
  return rec;
}

// Chat voice button
document.getElementById('chatVoiceBtn').addEventListener('click', () => {
  if (isRecording) {
    recognition?.stop();
    return;
  }
  recognition = initSpeechRecognition();
  if (!recognition) return;

  const btn = document.getElementById('chatVoiceBtn');
  recognition.onstart = () => {
    isRecording = true;
    btn.classList.add('recording');
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
  };
  recognition.onend = () => {
    isRecording = false;
    btn.classList.remove('recording');
    if (chatInput.value.trim()) sendChatMessage();
  };
  recognition.onerror = () => {
    isRecording = false;
    btn.classList.remove('recording');
  };
  recognition.start();
});

// Standalone Voice Module
document.getElementById('voiceRecordBtn').addEventListener('click', () => {
  if (isRecording) {
    recognition?.stop();
    return;
  }
  recognition = initSpeechRecognition();
  if (!recognition) return;

  const btn = document.getElementById('voiceRecordBtn');
  const circle = document.getElementById('voiceCircle');
  const status = document.getElementById('voiceStatus');
  const transcriptDiv = document.getElementById('voiceTranscript');

  recognition.onstart = () => {
    isRecording = true;
    btn.classList.add('recording');
    circle.classList.add('recording');
    status.textContent = '🔴 Listening...';
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    transcriptDiv.innerHTML = `<strong>You said:</strong> ${transcript}`;
  };
  recognition.onend = async () => {
    isRecording = false;
    btn.classList.remove('recording');
    circle.classList.remove('recording');
    status.textContent = 'Processing...';

    const transcript = transcriptDiv.textContent.replace('You said: ', '');
    if (transcript) {
      showLoading('Processing voice query...');
      try {
        const data = await apiCall('/api/chat', { message: transcript, role: 'tutor' });
        const responseDiv = document.getElementById('voiceResponse');
        responseDiv.innerHTML = `<div class="rendered-content">${renderMarkdown(data.response)}</div>`;
        document.getElementById('voiceSpeakBtn').disabled = false;
        document.getElementById('voiceSpeakBtn').onclick = () => speakText(data.response);
        status.textContent = 'Response ready! Click 🔊 to hear it.';
      } catch (error) {
        status.textContent = 'Error processing query';
        showToast(error.message, 'error');
      }
      hideLoading();
    } else {
      status.textContent = 'No speech detected. Try again.';
    }
  };
  recognition.onerror = () => {
    isRecording = false;
    btn.classList.remove('recording');
    circle.classList.remove('recording');
    status.textContent = 'Error. Click to try again.';
  };
  recognition.start();
});

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`]/g, '').substring(0, 500));
  utterance.rate = 0.95;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
}

// ============================================
// RAG Module
// ============================================

const uploadZone = document.getElementById('uploadZone');
const ragFileInput = document.getElementById('ragFileInput');
const ragMessages = document.getElementById('ragMessages');

uploadZone.addEventListener('click', () => ragFileInput.click());
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) uploadDocument(e.dataTransfer.files[0]);
});

ragFileInput.addEventListener('change', () => {
  if (ragFileInput.files[0]) uploadDocument(ragFileInput.files[0]);
});

async function uploadDocument(file) {
  showLoading('Processing document...');
  try {
    const formData = new FormData();
    formData.append('document', file);

    const res = await fetch(`${API_BASE}/api/rag/upload`, { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    const docList = document.getElementById('docList');
    docList.innerHTML += `
      <div class="doc-item">
        <span class="doc-icon">📄</span>
        <span class="doc-name">${data.document.name}</span>
        <span class="doc-chunks">${data.document.chunkCount} chunks</span>
      </div>
    `;
    showToast(`Document "${data.document.name}" processed (${data.document.chunkCount} chunks)`);
  } catch (error) {
    showToast(`Upload failed: ${error.message}`, 'error');
  }
  hideLoading();
}

async function sendRagQuery() {
  const query = document.getElementById('ragInput').value.trim();
  if (!query) return;

  addChatMessage(query, 'user', ragMessages);
  document.getElementById('ragInput').value = '';

  showLoading('Searching documents...');
  try {
    const data = await apiCall('/api/rag/query', { query });

    let sourceHTML = '';
    if (data.sources && data.sources.length > 0) {
      sourceHTML = `<div class="rag-sources"><h4>📎 Sources</h4>`;
      data.sources.forEach(s => {
        sourceHTML += `<div class="source-item">
          <span class="source-name">📄 ${s.document}</span>
          <span class="source-relevance">${s.relevance}% match</span>
        </div>`;
      });
      sourceHTML += '</div>';
    }

    // Custom message with sources
    const welcome = ragMessages.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    const msg = document.createElement('div');
    msg.className = 'message ai';
    msg.innerHTML = `
      <div class="message-avatar">🧠</div>
      <div class="message-content">${renderMarkdown(data.answer)}${sourceHTML}</div>
    `;
    ragMessages.appendChild(msg);
    ragMessages.scrollTop = ragMessages.scrollHeight;
  } catch (error) {
    addChatMessage(`⚠️ Error: ${error.message}`, 'ai', ragMessages);
    showToast(error.message, 'error');
  }
  hideLoading();
}

document.getElementById('ragSendBtn').addEventListener('click', sendRagQuery);
document.getElementById('ragInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRagQuery(); }
});

// ============================================
// Agent Module
// ============================================

document.getElementById('agentExecuteBtn').addEventListener('click', async () => {
  const task = document.getElementById('agentInput').value.trim();
  if (!task) return;

  const resultsDiv = document.getElementById('agentResults');
  resultsDiv.innerHTML = `
    <div class="agent-step">
      <div class="agent-step-header">
        <span class="step-number">⏳</span>
        <span class="step-tool">Planning Phase</span>
        <span class="step-status running">analyzing task...</span>
      </div>
    </div>
  `;

  showLoading('AI Agent is executing your task...');
  try {
    const data = await apiCall('/api/agent/execute', { task });

    let stepsHTML = '';

    // Show plan understanding
    stepsHTML += `
      <div class="agent-step">
        <div class="agent-step-header">
          <span class="step-number">📋</span>
          <span class="step-tool">Task Understanding</span>
          <span class="step-status completed">✓ planned</span>
        </div>
        <div class="step-output">${data.plan.task_understanding}</div>
      </div>
    `;

    // Show each step
    data.steps.forEach((step) => {
      const statusClass = step.status === 'completed' ? 'completed' : 'error';
      const statusText = step.status === 'completed' ? '✓ completed' : '✗ ' + (step.reason || 'failed');
      stepsHTML += `
        <div class="agent-step">
          <div class="agent-step-header">
            <span class="step-number">${step.step}</span>
            <span class="step-tool">${step.tool}</span>
            <span class="step-purpose">${step.purpose || ''}</span>
            <span class="step-status ${statusClass}">${statusText}</span>
          </div>
          ${step.output ? `<div class="step-output"><div class="rendered-content">${renderMarkdown(step.output.substring(0, 1000))}</div></div>` : ''}
        </div>
      `;
    });

    // Final response
    stepsHTML += `
      <div class="agent-final">
        <h3>🎯 Final Synthesized Response</h3>
        <div class="rendered-content">${renderMarkdown(data.response)}</div>
      </div>
    `;

    resultsDiv.innerHTML = stepsHTML;
  } catch (error) {
    resultsDiv.innerHTML = `<div class="agent-step">
      <div class="agent-step-header">
        <span class="step-number">❌</span>
        <span class="step-tool">Error</span>
        <span class="step-status error">${error.message}</span>
      </div>
    </div>`;
    showToast(error.message, 'error');
  }
  hideLoading();
});

// ============================================
// Study Tools
// ============================================

// Summarizer
document.getElementById('summaryBtn').addEventListener('click', async () => {
  const topic = document.getElementById('summaryTopic').value.trim();
  const content = document.getElementById('summaryContent').value.trim();
  if (!topic) return showToast('Enter a topic', 'error');

  showLoading('Generating summary...');
  try {
    const data = await apiCall('/api/study/summarize', { topic, content });
    document.getElementById('summaryOutput').innerHTML =
      `<div class="rendered-content">${renderMarkdown(data.response)}</div>`;
  } catch (error) {
    showToast(error.message, 'error');
  }
  hideLoading();
});

// Flashcards
document.getElementById('flashcardBtn').addEventListener('click', async () => {
  const topic = document.getElementById('flashcardTopic').value.trim();
  if (!topic) return showToast('Enter a topic', 'error');

  showLoading('Generating flashcards...');
  try {
    const data = await apiCall('/api/study/flashcards', { topic });
    const grid = document.getElementById('flashcardGrid');
    grid.innerHTML = '';

    (data.flashcards || []).forEach((card, i) => {
      const el = document.createElement('div');
      el.className = 'flashcard';
      el.innerHTML = `
        <div class="flashcard-inner">
          <div class="flashcard-front">
            <p>${card.front}</p>
            <span class="flashcard-hint">Click to flip</span>
          </div>
          <div class="flashcard-back">
            <p>${card.back}</p>
            <span class="flashcard-hint">Click to flip</span>
          </div>
        </div>
      `;
      el.addEventListener('click', () => el.classList.toggle('flipped'));
      grid.appendChild(el);
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
  hideLoading();
});

// Quiz
let quizScore = 0;
let quizTotal = 0;
let quizAnswered = 0;

document.getElementById('quizBtn').addEventListener('click', async () => {
  const topic = document.getElementById('quizTopic').value.trim();
  if (!topic) return showToast('Enter a topic', 'error');

  showLoading('Generating quiz...');
  quizScore = 0;
  quizAnswered = 0;

  try {
    const data = await apiCall('/api/study/quiz', { topic });
    const container = document.getElementById('quizContainer');
    container.innerHTML = '';
    const questions = data.quiz || [];
    quizTotal = questions.length;

    questions.forEach((q, qi) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'quiz-question';
      let optionsHTML = '';
      (q.options || []).forEach((opt, oi) => {
        optionsHTML += `
          <div class="quiz-option" data-qi="${qi}" data-oi="${oi}" data-correct="${q.correct}">
            <span class="opt-letter">${String.fromCharCode(65 + oi)}</span>
            <span>${opt}</span>
          </div>
        `;
      });

      qDiv.innerHTML = `
        <div class="quiz-question-text">
          <span class="q-number">${qi + 1}</span>
          <span>${q.question}</span>
        </div>
        <div class="quiz-options">${optionsHTML}</div>
        <div class="quiz-explanation" id="explanation-${qi}">${q.explanation || ''}</div>
      `;
      container.appendChild(qDiv);
    });

    // Click handlers for quiz options
    container.querySelectorAll('.quiz-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const qi = parseInt(opt.dataset.qi);
        const oi = parseInt(opt.dataset.oi);
        const correct = parseInt(opt.dataset.correct);
        const questionDiv = opt.closest('.quiz-question');

        // Prevent re-answering
        if (questionDiv.classList.contains('answered')) return;
        questionDiv.classList.add('answered');
        quizAnswered++;

        if (oi === correct) {
          opt.classList.add('correct');
          quizScore++;
        } else {
          opt.classList.add('wrong');
          // Highlight correct
          questionDiv.querySelectorAll('.quiz-option')[correct]?.classList.add('correct');
        }

        // Show explanation
        const exp = document.getElementById(`explanation-${qi}`);
        if (exp) exp.style.display = 'block';

        // Check if quiz complete
        if (quizAnswered === quizTotal) {
          const scoreDiv = document.createElement('div');
          scoreDiv.className = 'quiz-score';
          scoreDiv.innerHTML = `
            <div class="score-value">${quizScore}/${quizTotal}</div>
            <p style="color: var(--text-secondary); margin-top: 8px;">
              ${quizScore === quizTotal ? '🌟 Perfect Score!' :
                quizScore >= quizTotal * 0.7 ? '👏 Great job!' :
                quizScore >= quizTotal * 0.5 ? '📚 Good effort! Review the explanations.' :
                '💪 Keep studying! Review the concepts and try again.'}
            </p>
          `;
          container.appendChild(scoreDiv);
        }
      });
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
  hideLoading();
});

// Mind Map
document.getElementById('mindmapBtn').addEventListener('click', async () => {
  const topic = document.getElementById('mindmapTopic').value.trim();
  if (!topic) return showToast('Enter a topic', 'error');

  showLoading('Generating mind map...');
  try {
    const data = await apiCall('/api/study/mindmap', { topic });
    renderMindMap(data.mindmap || data);
  } catch (error) {
    showToast(error.message, 'error');
  }
  hideLoading();
});

function renderMindMap(mindmap) {
  const container = document.getElementById('mindmapContainer');
  if (!mindmap || !mindmap.center) {
    container.innerHTML = '<div class="empty-state">Could not generate mind map</div>';
    return;
  }

  const branches = mindmap.branches || [];
  const branchCount = branches.length;
  const width = Math.max(800, branchCount * 200);
  const height = Math.max(500, branchCount * 80);
  const cx = width / 2;
  const cy = height / 2;

  let svg = `<svg class="mindmap-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs><linearGradient id="mmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#a78bfa;stop-opacity:0.3" />
    <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:0.3" />
  </linearGradient></defs>`;

  // Draw branches
  branches.forEach((branch, i) => {
    const angle = (i / branchCount) * 2 * Math.PI - Math.PI / 2;
    const bx = cx + Math.cos(angle) * 180;
    const by = cy + Math.sin(angle) * 140;

    // Line from center to branch
    svg += `<line class="mm-line" x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke-dasharray="4,4" />`;

    // Branch node
    const label = branch.label || '';
    const bw = Math.max(100, label.length * 8 + 20);
    svg += `<rect class="mm-branch" x="${bx - bw/2}" y="${by - 18}" width="${bw}" height="36" stroke-width="1"/>`;
    svg += `<text class="mm-text mm-text-branch" x="${bx}" y="${by}">${escapeXml(label)}</text>`;

    // Children
    const children = branch.children || [];
    children.forEach((child, ci) => {
      const childAngle = angle + ((ci - (children.length - 1) / 2) * 0.4);
      const childX = bx + Math.cos(childAngle) * 130;
      const childY = by + Math.sin(childAngle) * 90;

      svg += `<line class="mm-line" x1="${bx}" y1="${by}" x2="${childX}" y2="${childY}" />`;

      const clabel = child.label || '';
      const cw = Math.max(80, clabel.length * 7 + 16);
      svg += `<rect class="mm-leaf" x="${childX - cw/2}" y="${childY - 14}" width="${cw}" height="28" stroke-width="1"/>`;
      svg += `<text class="mm-text mm-text-leaf" x="${childX}" y="${childY}">${escapeXml(clabel)}</text>`;
    });
  });

  // Center node
  const centerLabel = mindmap.center;
  const cw = Math.max(120, centerLabel.length * 9 + 30);
  svg += `<rect class="mm-center" x="${cx - cw/2}" y="${cy - 22}" width="${cw}" height="44"/>`;
  svg += `<text class="mm-text mm-text-center" x="${cx}" y="${cy}" fill="white">${escapeXml(centerLabel)}</text>`;

  svg += '</svg>';
  container.innerHTML = svg;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================
// Vision Module
// ============================================

let visionImageData = null;

const visionDropzone = document.getElementById('visionDropzone');
const visionFileInput = document.getElementById('visionFileInput');
const visionPreview = document.getElementById('visionPreview');
const visionAnalyzeBtn = document.getElementById('visionAnalyzeBtn');

visionDropzone.addEventListener('click', () => visionFileInput.click());
visionDropzone.addEventListener('dragover', (e) => e.preventDefault());
visionDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer.files[0]) loadVisionImage(e.dataTransfer.files[0]);
});

visionFileInput.addEventListener('change', () => {
  if (visionFileInput.files[0]) loadVisionImage(visionFileInput.files[0]);
});

function loadVisionImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    visionImageData = e.target.result;
    visionPreview.src = visionImageData;
    visionPreview.classList.remove('hidden');
    visionAnalyzeBtn.disabled = false;
    visionDropzone.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

visionAnalyzeBtn.addEventListener('click', async () => {
  if (!visionImageData) return;

  const prompt = document.getElementById('visionPrompt').value.trim() || undefined;
  showLoading('Analyzing image...');
  try {
    const data = await apiCall('/api/vision/analyze', { image: visionImageData, prompt });
    document.getElementById('visionOutput').innerHTML =
      `<div class="rendered-content">${renderMarkdown(data.response)}</div>`;
  } catch (error) {
    showToast(error.message, 'error');
  }
  hideLoading();
});

// ============================================
// Poster Module
// ============================================

document.getElementById('posterBtn').addEventListener('click', async () => {
  const topic = document.getElementById('posterTopic').value.trim();
  const style = document.getElementById('posterStyle').value;
  if (!topic) return showToast('Enter a topic', 'error');

  showLoading('Creating study poster...');
  try {
    const data = await apiCall('/api/poster/generate', { topic, style });
    document.getElementById('posterOutput').innerHTML =
      `<div class="rendered-content">${renderMarkdown(data.response)}</div>`;
  } catch (error) {
    showToast(error.message, 'error');
  }
  hideLoading();
});

// ============================================
// Initialize
// ============================================

// Hero Landing Page Animation
const heroLanding = document.getElementById('heroLanding');
const mainApp = document.getElementById('mainApp');
const heroEnterBtn = document.getElementById('heroEnterBtn');
const heroParticles = document.getElementById('heroParticles');

// Create floating particles
function createParticles() {
  const colors = ['#737373', '#525252', '#a3a3a3', '#d4d4d4', '#404040'];
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 20 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    heroParticles.appendChild(particle);
  }
}

createParticles();

// Enter app function
function enterApp() {
  heroLanding.classList.add('hidden');
  setTimeout(() => {
    heroLanding.style.display = 'none';
    mainApp.style.display = 'flex';
    setTimeout(() => {
      mainApp.classList.add('visible');
    }, 50);
  }, 800);
}

// Button click to enter
heroEnterBtn.addEventListener('click', enterApp);

// Scroll to enter (Apple-style)
let scrollTimeout;
let scrollCount = 0;

window.addEventListener('wheel', (e) => {
  if (heroLanding.style.display !== 'none') {
    e.preventDefault();
    
    clearTimeout(scrollTimeout);
    scrollCount++;
    
    scrollTimeout = setTimeout(() => {
      scrollCount = 0;
    }, 1000);
    
    // Enter after 3 scroll actions
    if (scrollCount >= 3) {
      enterApp();
      scrollCount = 0;
    }
  }
}, { passive: false });

// Touch swipe to enter (mobile)
let touchStartY = 0;
let touchEndY = 0;

heroLanding.addEventListener('touchstart', (e) => {
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

heroLanding.addEventListener('touchend', (e) => {
  touchEndY = e.changedTouches[0].screenY;
  const swipeDistance = touchStartY - touchEndY;
  
  // Swipe up to enter
  if (swipeDistance > 100) {
    enterApp();
  }
}, { passive: true });

// Auto-enter after 10 seconds (optional)
setTimeout(() => {
  if (heroLanding.style.display !== 'none') {
    // Uncomment to enable auto-enter
    // enterApp();
  }
}, 10000);

// Fix viewport height on mobile (accounts for browser address bar)
function setMobileVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

if (window.innerWidth <= 768) {
  setMobileVH();
  window.addEventListener('resize', setMobileVH);
  window.addEventListener('orientationchange', setMobileVH);
}

// Check API health
fetch(`${API_BASE}/api/health`)
  .then(r => r.json())
  .then(() => {
    document.querySelector('.status-dot').style.background = 'var(--accent-green)';
    document.querySelector('.status-badge span').textContent = 'AI Connected';
  })
  .catch(() => {
    document.querySelector('.status-dot').style.background = 'var(--accent-red)';
    document.querySelector('.status-badge span').textContent = 'Disconnected';
  });

console.log('🚀 StudyVerse AI loaded');
