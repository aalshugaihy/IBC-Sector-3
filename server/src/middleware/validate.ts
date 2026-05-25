import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Express middleware that validates req.body against a Zod schema.
 * Returns 400 with validation errors if invalid.
 */
export function validate(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        message: issue.message,
      }));
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    req.body = result.data;
    next();
  };
}
