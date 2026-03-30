// ============================================
// StudyVerse AI — Agent Service
// Planning-Execution Loop with Tool Calling
// ============================================
const { roleChat, chatCompletion, generateFlashcards, generateQuiz, generateMindMap } = require('./ai-service');

/**
 * Tool Registry — available tools the agent can call
 * Demonstrates: Agent architecture, tool calling, planning-execution loop
 */
const TOOLS = {
  summarize: {
    name: 'summarize',
    description: 'Summarize a given text or topic concisely',
    execute: async (params) => {
      return roleChat('summarizer', `Summarize the following:\n${params.input}`);
    },
  },
  explain: {
    name: 'explain',
    description: 'Explain a concept in detail with examples',
    execute: async (params) => {
      return roleChat('tutor', `Explain in detail: ${params.input}`);
    },
  },
  flashcards: {
    name: 'flashcards',
    description: 'Generate flashcards for a topic',
    execute: async (params) => {
      const result = await generateFlashcards(params.input, '', 5);
      return JSON.stringify(result, null, 2);
    },
  },
  quiz: {
    name: 'quiz',
    description: 'Generate a quiz for a topic',
    execute: async (params) => {
      const result = await generateQuiz(params.input, '', 4);
      return JSON.stringify(result, null, 2);
    },
  },
  mindmap: {
    name: 'mindmap',
    description: 'Generate a mind map structure for a topic',
    execute: async (params) => {
      const result = await generateMindMap(params.input);
      return JSON.stringify(result, null, 2);
    },
  },
  compare: {
    name: 'compare',
    description: 'Compare and contrast two or more concepts',
    execute: async (params) => {
      return roleChat('researcher', `Compare and contrast: ${params.input}. Provide a detailed analysis with similarities, differences, and use cases.`);
    },
  },
  research: {
    name: 'research',
    description: 'Conduct in-depth research on a topic',
    execute: async (params) => {
      return roleChat('researcher', `Conduct thorough research on: ${params.input}. Cover history, current state, key findings, and future directions.`);
    },
  },
  calculate: {
    name: 'calculate',
    description: 'Solve a math problem step by step',
    execute: async (params) => {
      return roleChat('tutor', `Solve this step-by-step, showing all work: ${params.input}`);
    },
  },
};

/**
 * Planning Phase — LLM creates an execution plan
 */
async function createPlan(userTask) {
  const toolList = Object.values(TOOLS)
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');

  const messages = [
    {
      role: 'system',
      content: `You are a task planning agent. Given a user's academic task, create a step-by-step execution plan.
Available tools:
${toolList}

Output a JSON object with this format:
{
  "task_understanding": "Brief description of what the user wants",
  "steps": [
    { "step": 1, "tool": "tool_name", "input": "specific input for this tool", "purpose": "why this step" }
  ],
  "expected_outcome": "What the user will get"
}

Choose 2-4 relevant steps. Be strategic — combine tools for maximal learning value.`
    },
    { role: 'user', content: userTask },
  ];

  const result = await chatCompletion(messages, {
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(result);
  } catch {
    return {
      task_understanding: userTask,
      steps: [{ step: 1, tool: 'explain', input: userTask, purpose: 'Direct explanation' }],
      expected_outcome: 'Explanation of the topic',
    };
  }
}

/**
 * Execution Phase — iterate through plan steps and call tools
 */
async function executePlan(plan) {
  const results = [];

  for (const step of plan.steps) {
    const tool = TOOLS[step.tool];
    if (!tool) {
      results.push({
        step: step.step,
        tool: step.tool,
        status: 'skipped',
        reason: 'Tool not found',
        output: null,
      });
      continue;
    }

    try {
      const output = await tool.execute({ input: step.input });
      results.push({
        step: step.step,
        tool: step.tool,
        purpose: step.purpose,
        status: 'completed',
        output,
      });
    } catch (error) {
      results.push({
        step: step.step,
        tool: step.tool,
        status: 'error',
        reason: error.message,
        output: null,
      });
    }
  }

  return results;
}

/**
 * Aggregation Phase — combine all results into final response
 */
async function aggregateResults(plan, results) {
  const resultsSummary = results
    .filter(r => r.status === 'completed')
    .map(r => `### Step ${r.step}: ${r.tool} (${r.purpose})\n${r.output}`)
    .join('\n\n---\n\n');

  const messages = [
    {
      role: 'system',
      content: `You are a results aggregator. The AI agent executed a multi-step plan. 
Synthesize all step results into a coherent, well-structured final response.
Add a brief intro about what was done and organize the information logically.
Use markdown formatting with clear headers and sections.`
    },
    {
      role: 'user',
      content: `Task: ${plan.task_understanding}\n\nExecution Results:\n${resultsSummary}\n\nPlease synthesize these into a comprehensive, well-organized response.`
    },
  ];

  return chatCompletion(messages);
}

/**
 * Full Agent Execution Pipeline
 * Plan → Execute → Aggregate
 */
async function executeAgent(userTask) {
  // Phase 1: Planning
  const plan = await createPlan(userTask);

  // Phase 2: Execution
  const results = await executePlan(plan);

  // Phase 3: Aggregation
  const finalResponse = await aggregateResults(plan, results);

  return {
    plan,
    steps: results,
    response: finalResponse,
  };
}

module.exports = {
  executeAgent,
  createPlan,
  executePlan,
  TOOLS,
};
