// AI service: builds prompts, calls the model, and cleans model responses.
import OpenAI from "openai";

// One OpenAI-compatible client is enough because the base URL decides the provider.
const aiClient = new OpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_BASE_URL || "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.CLIENT_ORIGIN || "http://localhost:5173",
    "X-Title": "MidMind",
  },
});

// Chooses the configured model, with a default for local development.
function pickModel() {
  return process.env.AI_MODEL || process.env.OPENAI_MODEL || "llama-3.3-70b-versatile";
}

const TUTOR_PROMPT =
  "You are a Socratic tutor. Guide the student toward the answer with hints — never give the answer away.\n" +
  "Write one short hint (2-4 sentences) and end with a question aimed at the student.\n" +
  "Always say 'you' when addressing the student. Output only the hint text, nothing else.";

const EVALUATOR_PROMPT =
  "You are evaluating a student's answer for a guided learning app.\n" +
  "Write 2-3 sentences of feedback and decide if the answer is correct.\n" +
  "Speak directly to the student using 'you'. Return only valid JSON:\n" +
  '{"feedback": "...", "isCorrect": true|false}';

const SOLUTION_PROMPT =
  "You are a teacher revealing the final answer after a student has worked through a problem.\n" +
  "Return only valid JSON with no extra text:\n" +
  '{"finalAnswer": "...", "explanation": "..."}';

// Detects quota-specific provider errors so routes can show the right message.
export function isQuotaError(err) {
  const status = err?.status;
  const code = err?.code || err?.error?.code;
  return status === 429 && (code === "insufficient_quota" || code === "insufficient_quota_error");
}

// Pulls a JSON object out of model responses that include extra text.
function extractJSON(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

// Safely parses model JSON without crashing when the model returns malformed text.
function safeParseJSON(raw) {
  const jsonStr = extractJSON(raw);
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// Extracts the assistant message content from the OpenAI-compatible response.
function extractContent(resp) {
  return (resp?.choices?.[0]?.message?.content || "").trim();
}

// Keeps hints clean when a model adds private reasoning or a preamble.
function cleanHint(text) {
  if (!text) return text;

  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "").trim();

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const thinkingPrefixes = /^(we need to|we must|i should|i need to|the student|actually,|hmm,|let me|okay,|so,|wait,|alright,|first,? let)/i;
  const firstCleanLine = lines.findIndex((line) => !thinkingPrefixes.test(line));

  if (firstCleanLine > 0) {
    text = lines.slice(firstCleanLine).join(" ");
  }

  return text.trim();
}

// Calls the model with the tutor prompt to generate a hint.
async function callTutor(userContent) {
  const resp = await aiClient.chat.completions.create({
    model: pickModel(),
    messages: [
      { role: "system", content: TUTOR_PROMPT },
      { role: "user", content: userContent },
    ],
    max_tokens: 350,
    temperature: 0.5,
  });
  return cleanHint(extractContent(resp));
}

// Calls the model with the evaluator prompt to grade an attempt.
async function callEvaluator(userContent) {
  const resp = await aiClient.chat.completions.create({
    model: pickModel(),
    messages: [
      { role: "system", content: EVALUATOR_PROMPT },
      { role: "user", content: userContent },
    ],
    max_tokens: 300,
    temperature: 0.3,
  });
  return extractContent(resp);
}

// Calls the model with the solution prompt to produce the final answer.
async function callSolutionWriter(userContent) {
  const resp = await aiClient.chat.completions.create({
    model: pickModel(),
    messages: [
      { role: "system", content: SOLUTION_PROMPT },
      { role: "user", content: userContent },
    ],
    max_tokens: 500,
    temperature: 0.4,
  });
  return extractContent(resp);
}

// Provides a safe first hint if the model returns empty text.
function fallbackFirstHint() {
  return "Think about what the question is asking before jumping to an answer. What do you already know that might be relevant?";
}

// Provides a safe follow-up hint if the model returns empty text.
function fallbackNextHint() {
  return "Try breaking it down — what's one smaller piece you can figure out first?";
}

// Generates the first hint shown immediately after a student asks a question.
export async function generateFirstHint(question) {
  const userContent = [
    "A student has just submitted this question to start a learning session.",
    "Generate the first hint following your tutor role.",
    "",
    `Question: ${question}`,
  ].join("\n");

  const hintText = await callTutor(userContent);
  return hintText || fallbackFirstHint();
}

// Generates a follow-up hint using recent hints and attempts as context.
export async function generateNextHint({ question, previousHints, attempts, hintNumber }) {
  const previousHintsSummary = previousHints?.length
    ? `Previous hints given (${previousHints.length}):\n${previousHints
        .slice(-3)
        .map((hint, index) => `  ${index + 1}. ${hint}`)
        .join("\n")}`
    : "";

  const attemptsSummary = attempts?.length
    ? `Student attempts so far (${attempts.length}):\n${attempts
        .slice(-2)
        .map((attempt, index) => `  ${index + 1}. ${attempt.content}`)
        .join("\n")}`
    : "";

  const userContent = [
    `A student is on hint #${hintNumber}. Build on what they know so far.`,
    "",
    `Question: ${question}`,
    previousHintsSummary,
    attemptsSummary,
    "",
    "Generate the next hint. Do not repeat prior hints or reveal the answer.",
  ]
    .filter(Boolean)
    .join("\n");

  const hintText = await callTutor(userContent);
  return hintText || fallbackNextHint();
}

// Evaluates one student attempt and returns feedback plus correctness.
export async function evaluateAttempt({
  question,
  attempt,
  hints,
  previousAttempts,
  attemptNumber,
}) {
  try {
    const hintsSummary = hints?.length
      ? `Hints the student received:\n${hints.map((hint, index) => `  ${index + 1}. ${hint}`).join("\n")}`
      : "No hints given yet.";

    const priorAttemptsSummary = previousAttempts?.length
      ? `Prior attempts:\n${previousAttempts
          .slice(-3)
          .map((priorAttempt, index) => `  ${index + 1}. "${priorAttempt.content}" -> ${priorAttempt.feedback}`)
          .join("\n")}`
      : "";

    const userContent = [
      `Evaluate attempt #${attemptNumber} for the following question.`,
      "",
      `Question: ${question}`,
      "",
      hintsSummary,
      priorAttemptsSummary,
      "",
      `Student's current attempt: "${attempt}"`,
      "",
      "Respond ONLY with this JSON (no other text):",
      '{"feedback": "<2-3 sentence evaluation>", "isCorrect": <true|false>}',
      "",
      "Set isCorrect to true only if the attempt correctly and completely answers the question.",
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await callEvaluator(userContent);
    const parsed = safeParseJSON(raw);

    if (parsed && typeof parsed.feedback === "string") {
      return {
        feedback: parsed.feedback,
        isCorrect: parsed.isCorrect === true,
      };
    }

    return {
      feedback: raw || "Keep refining your reasoning and make your steps clearer.",
      isCorrect: false,
    };
  } catch (err) {
    console.error("[ai] evaluateAttempt failed:", err?.status, err?.message);
    return {
      feedback: isQuotaError(err)
        ? "AI feedback is temporarily unavailable because the API quota is exceeded."
        : "We could not evaluate the attempt right now. Please try again.",
      isCorrect: false,
    };
  }
}

// Generates the final solution after success, give-up, or max attempts.
export async function generateFinalSolution({ question, hints, attempts, studentSolvedIt = false }) {
  try {
    const hintsSummary = hints?.length
      ? `Hints given:\n${hints.slice(-3).map((hint, index) => `  ${index + 1}. ${hint}`).join("\n")}`
      : "";

    const attemptsSummary = attempts?.length
      ? `Student attempts:\n${attempts
          .slice(-3)
          .map((attempt, index) => `  ${index + 1}. "${attempt.content}" -> ${attempt.feedback}`)
          .join("\n")}`
      : "";

    const intro = studentSolvedIt
      ? "The student correctly answered the question. Confirm their answer and provide a clear educational explanation."
      : "The student has used all their guided attempts. Provide the complete final solution.";

    const userContent = [
      intro,
      "",
      `Question: ${question}`,
      "",
      hintsSummary,
      attemptsSummary,
      "",
      "Respond ONLY with this JSON (no other text):",
      '{"finalAnswer": "<the complete correct answer>", "explanation": "<clear educational explanation of why this is correct, 2-4 sentences>"}',
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await callSolutionWriter(userContent);
    const parsed = safeParseJSON(raw);

    if (parsed && typeof parsed.finalAnswer === "string") {
      return {
        finalAnswer: parsed.finalAnswer,
        explanation: parsed.explanation || "Explanation unavailable.",
      };
    }

    return {
      finalAnswer: raw.slice(0, 400) || "Complete solution unavailable.",
      explanation: "See the answer above.",
    };
  } catch (err) {
    console.error("[ai] generateFinalSolution failed:", err?.status, err?.message);
    return {
      finalAnswer: "Final answer could not be generated.",
      explanation: isQuotaError(err)
        ? "The OpenAI API quota is currently exceeded."
        : `Could not generate the final solution: ${err.message || "Unknown error"}.`,
    };
  }
}
