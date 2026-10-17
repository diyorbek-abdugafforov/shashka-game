import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const parsed = schema.parse(req.body);
    req.body = parsed;
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const parsed = schema.parse(req.query);
    req.query = parsed as any;
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const parsed = schema.parse(req.params);
    req.params = parsed as any;
  };
}
