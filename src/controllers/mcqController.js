const { readMarkdownFile } = require('../utils/fileReader');
const { generateMCQFromNotes } = require('../services/aiService');

function parseAndValidateMCQ(rawText) {
  
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('AI returned invalid JSON. Please try again.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('AI response is not a valid MCQ array');
  }

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    const num = i + 1;

    if (!item.question || typeof item.question !== 'string') {
      throw new Error(`Question ${num} is missing the "question" field`);
    }

    if (!item.options || typeof item.options !== 'object') {
      throw new Error(`Question ${num} is missing the "options" field`);
    }

    for (const key of ['a', 'b', 'c', 'd']) {
      if (!item.options[key]) {
        throw new Error(`Question ${num} is missing option "${key}"`);
      }
    }

    if (!['a', 'b', 'c', 'd'].includes(item.answer)) {
      throw new Error(`Question ${num} has an invalid answer. Must be a, b, c, or d`);
    }

    if (!item.reason || typeof item.reason !== 'string') {
      throw new Error(`Question ${num} is missing the "reason" field`);
    }
  }

  return parsed;
}

async function generateMCQ(req, res, next) {
  try {
    // Step 1: Check file uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please upload a .md file using the "file" field.',
      });
    }

    // Step 2: Read file content
    let notesContent;
    try {
      notesContent = readMarkdownFile(req.file.buffer);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // Step 3: Call Groq AI
    let rawAIResponse;
    try {
      rawAIResponse = await generateMCQFromNotes(notesContent);
    } catch (err) {
      console.error('Groq AI Error:', err.message);

      if (err.status === 401) {
        return res.status(500).json({ error: 'Invalid GROQ_API_KEY. Check your .env file.' });
      }
      if (err.status === 429) {
        return res.status(429).json({ error: 'Groq rate limit reached. Please wait and try again.' });
      }

      return res.status(502).json({
        error: 'AI service failed. Check your GROQ_API_KEY or try again.',
        details: err.message,
      });
    }

    // Step 4: Parse and validate
    let questions;
    try {
      questions = parseAndValidateMCQ(rawAIResponse);
    } catch (err) {
      return res.status(422).json({
        error: 'AI returned an unexpected format: ' + err.message,
      });
    }

    // Step 5: Return response
    return res.status(200).json({
      total_questions: questions.length,
      questions,
    });

  } catch (error) {
    next(error);
  }
}

module.exports = { generateMCQ, parseAndValidateMCQ };