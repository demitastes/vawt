import { Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate';

describe('validateRequest middleware', () => {
  const simpleSchema = z.object({
    email: z.string().email(),
    age: z.number().int().positive(),
  });

  const strictSchema = z.object({
    name: z.string().min(1),
    tags: z.array(z.string()),
  }).strict();

  it('should pass validation when data is valid', async () => {
    const middleware = validateRequest('body', simpleSchema);
    const req = {
      body: {
        email: 'test@example.com',
        age: 25,
      },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should reject invalid email', async () => {
    const middleware = validateRequest('body', simpleSchema);
    const req = {
      body: {
        email: 'not-an-email',
        age: 25,
      },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
  });

  it('should reject negative age', async () => {
    const middleware = validateRequest('body', simpleSchema);
    const req = {
      body: {
        email: 'test@example.com',
        age: -5,
      },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should validate query parameters', async () => {
    const querySchema = z.object({
      limit: z.coerce.number().int().positive(),
    });

    const middleware = validateRequest('query', querySchema);
    const req = {
      query: {
        limit: '10',
      },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should validate route parameters', async () => {
    const paramSchema = z.object({
      id: z.coerce.number().int().positive(),
    });

    const middleware = validateRequest('params', paramSchema);
    const req = {
      params: {
        id: '123',
      },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should coerce types when schema specifies coerce', async () => {
    const coerceSchema = z.object({
      count: z.coerce.number(),
      active: z.coerce.boolean(),
    });

    const middleware = validateRequest('body', coerceSchema);
    const req = {
      body: {
        count: '42',
        active: 'true',
      },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should reject extra fields with strict schema', async () => {
    const middleware = validateRequest('body', strictSchema);
    const req = {
      body: {
        name: 'Test',
        tags: ['a', 'b'],
        extra: 'field',
      },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should include validation errors in details', async () => {
    const middleware = validateRequest('body', simpleSchema);
    const req = {
      body: {
        email: 'invalid',
        age: 'not-a-number',
      },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toHaveProperty('details');
    expect(error.details.errors).toBeDefined();
    expect(Array.isArray(error.details.errors)).toBe(true);
  });

  it('should handle missing required fields', async () => {
    const middleware = validateRequest('body', simpleSchema);
    const req = {
      body: {
        email: 'test@example.com',
        // age is missing
      },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});
