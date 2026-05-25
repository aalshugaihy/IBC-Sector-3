import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { listSettings, setSetting, deleteSetting, getSetting } from '../lib/settings.js';
import { logAudit } from '../lib/audit.js';

const router = Router();

// Public branding (no auth) — lightweight subset needed before login
router.get('/public', async (_req, res: Response) => {
  try {
    const [nameAr, nameEn, organization, publicSignup] = await Promise.all([
      getSetting('app.name_ar'),
      getSetting('app.name_en'),
      getSetting('app.organization'),
      getSetting('feature.public_signup'),
    ]);
    res.json({
      app: {
        nameAr: nameAr ?? 'قطاع الاستثمار وخدمات الأعمال',
        nameEn: nameEn ?? 'Investment & Business Services Sector',
        organization: organization ?? '',
      },
      features: {
        publicSignup: publicSignup !== false,
      },
    });
  } catch (err) {
    console.error('Public settings error:', err);
    res.status(500).json({ error: 'Failed to load public settings' });
  }
});

// Everything below requires authenticated admin
router.use(authMiddleware);

// Admin: full settings list
router.get('/', authorize('users:manage'), async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await listSettings();
    res.json({ settings });
  } catch (err) {
    console.error('List settings error:', err);
    res.status(500).json({ error: 'Failed to list settings' });
  }
});

// Admin: upsert a setting
router.put('/:key', authorize('users:manage'), async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const { value, isSecret, description } = req.body ?? {};

  if (typeof key !== 'string' || key.length === 0 || key.length > 100) {
    res.status(400).json({ error: 'Invalid key' });
    return;
  }

  try {
    await setSetting(key, value, {
      isSecret: !!isSecret,
      description,
      updatedBy: req.user!.uid,
    });
    await logAudit(req, {
      action: 'settings.update',
      entityType: 'setting',
      entityId: key,
      details: { isSecret: !!isSecret },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Admin: delete a setting
router.delete('/:key', authorize('users:manage'), async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  try {
    await deleteSetting(key);
    await logAudit(req, { action: 'settings.delete', entityType: 'setting', entityId: key });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete setting error:', err);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Admin: test if a key works (used to validate integrations)
router.post('/test/:key', authorize('users:manage'), async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  try {
    if (key === 'gemini.api_key') {
      const { GoogleGenAI } = await import('@google/genai');
      const apiKey = (await getSetting('gemini.api_key')) as string | null;
      if (!apiKey) {
        res.json({ ok: false, error: 'No key configured' });
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      });
      res.json({ ok: true, sample: (r.text ?? '').slice(0, 80) });
    } else {
      res.json({ ok: false, error: 'Unknown test target' });
    }
  } catch (err) {
    console.error('Test setting error:', err);
    res.json({ ok: false, error: err instanceof Error ? err.message : 'Test failed' });
  }
});

export default router;
