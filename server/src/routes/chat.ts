import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatSchema } from '../middleware/schemas.js';

const router = Router();
router.use(authMiddleware);

router.post('/', validate(chatSchema), async (req: AuthRequest, res: Response) => {
  const { message, history, taskContext } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Chat service not configured' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const contents: { role: string; parts: { text: string }[] }[] = [];

    // Add system context if provided
    if (taskContext) {
      contents.push({
        role: 'user',
        parts: [{ text: `Context about the tasks:\n${taskContext}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'I understand the task context. How can I help?' }],
      });
    }

    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const entry of history) {
        contents.push({
          role: entry.role === 'user' ? 'user' : 'model',
          parts: [{ text: entry.text }],
        });
      }
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    const text = response.text ?? '';

    res.json({ text });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat request failed' });
  }
});

export default router;
