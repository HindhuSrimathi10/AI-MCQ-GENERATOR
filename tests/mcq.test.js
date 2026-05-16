const request = require('supertest');
const app = require('../src/app');
const { readMarkdownFile } = require('../src/utils/fileReader');
const { generateMCQFromNotes } = require('../src/services/aiService');
const { parseAndValidateMCQ } = require('../src/controllers/mcqController');


jest.mock('../src/services/aiService');

const VALID_MCQ_JSON = JSON.stringify([
  {
    question: 'What does REST stand for?',
    options: {
      a: 'Remote Execution State Transfer',
      b: 'Representational State Transfer',
      c: 'Request State Technology',
      d: 'Resource Sharing Transfer',
    },
    answer: 'b',
    reason: 'REST stands for Representational State Transfer.',
  },
]);

const SAMPLE_MD_BUFFER = Buffer.from(
  '# REST API\nREST stands for Representational State Transfer.'
);


describe('fileReader utility', () => {
  test('returns content from a valid buffer', () => {
    const result = readMarkdownFile(Buffer.from('# Notes\nSome content'));
    expect(result).toBe('# Notes\nSome content');
  });

  test('throws on empty buffer', () => {
    expect(() => readMarkdownFile(Buffer.from(''))).toThrow('File is empty');
  });

  test('throws on null', () => {
    expect(() => readMarkdownFile(null)).toThrow('File is empty');
  });

  test('throws on whitespace-only content', () => {
    expect(() => readMarkdownFile(Buffer.from('   \n  '))).toThrow('no readable text');
  });
});


describe('parseAndValidateMCQ', () => {
  test('parses valid JSON correctly', () => {
    const result = parseAndValidateMCQ(VALID_MCQ_JSON);
    expect(result).toHaveLength(1);
    expect(result[0].answer).toBe('b');
    expect(result[0]).toHaveProperty('question');
    expect(result[0]).toHaveProperty('options');
    expect(result[0]).toHaveProperty('reason');
  });

  test('strips markdown code fences before parsing', () => {
    const fenced = '```json\n' + VALID_MCQ_JSON + '\n```';
    const result = parseAndValidateMCQ(fenced);
    expect(result).toHaveLength(1);
  });

  test('throws on invalid JSON', () => {
    expect(() => parseAndValidateMCQ('not json')).toThrow('invalid JSON');
  });

  test('throws when answer is not a/b/c/d', () => {
    const bad = JSON.stringify([
      {
        question: 'What is X?',
        options: { a: '1', b: '2', c: '3', d: '4' },
        answer: 'e',
        reason: 'reason',
      },
    ]);
    expect(() => parseAndValidateMCQ(bad)).toThrow('invalid answer');
  });

  test('throws when option is missing', () => {
    const bad = JSON.stringify([
      {
        question: 'What is X?',
        options: { a: '1', b: '2' },
        answer: 'a',
        reason: 'reason',
      },
    ]);
    expect(() => parseAndValidateMCQ(bad)).toThrow('missing option');
  });

  test('throws when result is not an array', () => {
    expect(() => parseAndValidateMCQ('{"question":"x"}')).toThrow('not a valid MCQ array');
  });
});


describe('POST /api/generate-mcq', () => {
  test('returns 400 when no file uploaded', async () => {
    const res = await request(app).post('/api/generate-mcq');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No file uploaded/);
  });

  test('returns 400 for wrong file type', async () => {
    const res = await request(app)
      .post('/api/generate-mcq')
      .attach('file', Buffer.from('hello'), {
        filename: 'notes.txt',
        contentType: 'application/octet-stream',
      });
    expect(res.status).toBe(400);
  });

  test('returns 200 with valid .md file', async () => {
    generateMCQFromNotes.mockResolvedValue(VALID_MCQ_JSON);

    const res = await request(app)
      .post('/api/generate-mcq')
      .attach('file', SAMPLE_MD_BUFFER, {
        filename: 'notes.md',
        contentType: 'text/markdown',
      });

    expect(res.status).toBe(200);
    expect(res.body.total_questions).toBe(1);
    expect(res.body.questions[0].answer).toBe('b');
  });

  test('returns 502 when Groq AI throws error', async () => {
    generateMCQFromNotes.mockRejectedValue(new Error('Groq unavailable'));

    const res = await request(app)
      .post('/api/generate-mcq')
      .attach('file', SAMPLE_MD_BUFFER, {
        filename: 'notes.md',
        contentType: 'text/markdown',
      });

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/AI service failed/);
  });

  test('returns 422 when AI returns bad JSON', async () => {
    generateMCQFromNotes.mockResolvedValue('this is not json');

    const res = await request(app)
      .post('/api/generate-mcq')
      .attach('file', SAMPLE_MD_BUFFER, {
        filename: 'notes.md',
        contentType: 'text/markdown',
      });

    expect(res.status).toBe(422);
  });
});