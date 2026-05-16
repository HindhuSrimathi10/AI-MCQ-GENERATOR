const Groq = require('groq-sdk');
const aiConfig = require('../config/aiConfig');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt(notesContent, questionCount) {
  return `You are an expert educator. Read the following study notes carefully and generate exactly ${questionCount} multiple choice questions based only on the content provided.

Rules:
- Each question must be based strictly on the notes
- Each question must have exactly 4 options labeled a, b, c, d
- Only one option must be correct
- All options must be meaningful and plausible
- The reason must clearly explain why the answer is correct

IMPORTANT: Return ONLY a valid JSON array. No explanation, no markdown, no code blocks, no preamble. Just the raw JSON array starting with [ and ending with ].

Required format:
[
  {
    "question": "your question here?",
    "options": {
      "a": "first option",
      "b": "second option",
      "c": "third option",
      "d": "fourth option"
    },
    "answer": "b",
    "reason": "explanation of why b is correct"
  }
]

Study Notes:
${notesContent}`;
}

async function generateMCQFromNotes(notesContent, questionCount = aiConfig.questionCount) {
  const prompt = buildPrompt(notesContent, questionCount);

  const completion = await client.chat.completions.create({
    model: aiConfig.model,
    max_tokens: aiConfig.maxTokens,
    temperature: aiConfig.temperature,
    messages: [
      {
        role: 'system',
        content: 'You are an expert educator who generates multiple choice questions strictly in JSON format. Never include markdown, code blocks, or extra text in your response.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return completion.choices[0].message.content;
}

module.exports = { generateMCQFromNotes };