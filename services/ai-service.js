// ============================================
// StudyVerse AI — AI Service Layer
// Wraps NavigateLabs Nexus AI (OpenAI-compatible)
// ============================================
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.navigatelabs.ai/v1';
const DEFAULT_MODEL = process.env.AI_MODEL || 'gpt-4.1-nano';

/**
 * Core chat completion call — supports role prompting, few-shot, and vision
 */
async function chatCompletion(messages, options = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    max_tokens = 2048,
    response_format,
  } = options;

  const body = {
    model,
    messages,
    temperature,
    max_tokens,
  };
  if (response_format) body.response_format = response_format;

  let res;
  try {
    res = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const e = new Error(`AI provider unreachable: ${err.message}`);
    e.statusCode = 502;
    throw e;
  }

  if (!res.ok) {
    let errText = '';
    try { errText = await res.text(); } catch (e) { /* ignore */ }
    const e = new Error(`AI API error ${res.status}: ${errText}`);
    e.statusCode = (res.status >= 500 ? 502 : res.status);
    throw e;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    const e = new Error(`Invalid AI response: ${err.message}`);
    e.statusCode = 502;
    throw e;
  }

  if (data && data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  if (data && data.output && Array.isArray(data.output)) {
    const found = data.output.find(o => o && (o.text || o.content));
    if (found) return found.text || found.content;
  }
  return JSON.stringify(data);
}

/**
 * Role-prompted chat — e.g. "tutor", "researcher", "quiz_master"
 */
const ROLE_PROMPTS = {
  tutor: `You are StudyVerse AI Tutor — a patient, encouraging academic tutor. 
Explain concepts clearly with examples. Use analogies. Break complex topics into digestible parts.
Format responses with markdown: use headers, bullet points, bold for key terms.
When appropriate, provide step-by-step explanations.`,

  researcher: `You are StudyVerse AI Researcher — a thorough academic research assistant.
Provide well-structured, evidence-based answers. Cite reasoning and methodologies.
Compare different perspectives. Suggest further reading areas.
Format with markdown headers and organized sections.`,

  quiz_master: `You are StudyVerse Quiz Master — an engaging quiz creator.
Create challenging but fair questions that test understanding, not just memorization.
Include a mix of question types. Provide detailed explanations for answers.
Always output valid JSON.`,

  summarizer: `You are StudyVerse Summarizer — an expert at distilling information.
Create concise, well-organized summaries that capture key points.
Use bullet points, numbered lists, and hierarchical structure.
Highlight important terms in bold. Never miss critical information.`,

  vision_analyst: `You are StudyVerse Vision Analyst — an expert at analyzing images.
Describe what you see in detail. Identify objects, text, diagrams, charts.
If it's a study-related image (diagram, formula, chart), explain the concept shown.
Provide educational context and explain any technical content visible.`,

  poster_creator: `You are StudyVerse Poster Creator — a creative educational content designer.
Create visually-structured study poster content with clear sections, key points, and engaging formatting.
Use emojis, icons (as text), clear headings, and organized layouts.
Make content memorable and revision-friendly.`,

  planner: `You are StudyVerse AI Planner — a strategic academic planning agent.
Break down complex tasks into clear, actionable steps.
Consider dependencies between steps. Estimate effort.
Output structured plans in JSON format with steps, tools needed, and expected outputs.`,
};

async function roleChat(role, userMessage, context = '') {
  const systemPrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS.tutor;
  const messages = [
    { role: 'system', content: systemPrompt },
  ];
  if (context) {
    messages.push({ role: 'system', content: `Context:\n${context}` });
  }
  messages.push({ role: 'user', content: userMessage });
  return chatCompletion(messages);
}

/**
 * Vision analysis — analyze an uploaded image (base64)
 */
async function analyzeImage(base64Image, userPrompt = 'Analyze this image in detail. If it contains academic content, explain the concepts shown.') {
  const messages = [
    { role: 'system', content: ROLE_PROMPTS.vision_analyst },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
      ],
    },
  ];
  return chatCompletion(messages, { model: DEFAULT_MODEL });
}

/**
 * Generate structured study content with few-shot prompting
 */
async function generateFlashcards(topic, content = '', count = 6) {
  const messages = [
    { role: 'system', content: ROLE_PROMPTS.quiz_master },
    {
      role: 'user', content: `Create 3 flashcards about "Photosynthesis"${content ? `\nSource material: Plants convert sunlight to energy...` : ''}`
    },
    {
      role: 'assistant', content: JSON.stringify({
        flashcards: [
          { front: "What is photosynthesis?", back: "The process by which plants convert light energy into chemical energy (glucose) using carbon dioxide and water, releasing oxygen as a byproduct." },
          { front: "What is the chemical equation for photosynthesis?", back: "6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂" },
          { front: "Where does photosynthesis primarily occur?", back: "In the chloroplasts of plant cells, specifically in the thylakoid membranes (light reactions) and stroma (Calvin cycle)." }
        ]
      })
    },
    {
      role: 'user', content: `Create ${count} flashcards about "${topic}"${content ? `\nSource material: ${content.substring(0, 2000)}` : ''}`
    },
  ];

  const result = await chatCompletion(messages, {
    temperature: 0.6,
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(result);
  } catch {
    return { flashcards: [{ front: 'Error', back: result }] };
  }
}

async function generateQuiz(topic, content = '', count = 5) {
  const messages = [
    { role: 'system', content: ROLE_PROMPTS.quiz_master },
    {
      role: 'user', content: `Create a quiz with ${count} multiple-choice questions about "${topic}".${content ? `\nSource: ${content.substring(0, 2000)}` : ''}
Output JSON with format: { "quiz": [{ "question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..." }] }`
    },
  ];

  const result = await chatCompletion(messages, {
    temperature: 0.6,
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(result);
  } catch {
    return { quiz: [] };
  }
}

async function generateMindMap(topic, content = '') {
  const messages = [
    { role: 'system', content: 'You are a mind map generator. Create hierarchical mind map data as JSON.' },
    {
      role: 'user', content: `Create a mind map for "${topic}".${content ? `\nSource: ${content.substring(0, 2000)}` : ''}
Output JSON: { "mindmap": { "center": "Topic", "branches": [{ "label": "Branch1", "children": [{ "label": "Sub1" }, { "label": "Sub2" }] }] } }`
    },
  ];

  const result = await chatCompletion(messages, {
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(result);
  } catch {
    return { mindmap: { center: topic, branches: [] } };
  }
}

async function generatePoster(topic, style = 'academic') {
  return roleChat('poster_creator',
    `Create a comprehensive study poster about "${topic}" in ${style} style. 
Include: Title, Key Concepts (5-7), Important Facts, Quick Summary, Memory Aids/Mnemonics, and a "Did You Know?" section.
Format it beautifully with sections, emojis and markers for visual appeal.`
  );
}

module.exports = {
  chatCompletion,
  roleChat,
  analyzeImage,
  generateFlashcards,
  generateQuiz,
  generateMindMap,
  generatePoster,
  ROLE_PROMPTS,
};
