import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import { Db } from 'mongodb';
import { getDb } from '../config/db';

interface CustomRequest extends Request {
  db: Db;
  user?: { userId: string; email: string };
}

// Middleware để log thời gian xử lý request
export const logRequestTime: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const customReq = req as CustomRequest;
  console.log(`Starting logRequestTime for ${customReq.method} ${customReq.url}`);
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${customReq.method} ${customReq.url} took ${duration}ms`);
  });
  next();
};

// Middleware để kiểm tra và gán req.db
export const checkAndSetDb: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const customReq = req as CustomRequest;
  try {
    console.log(`Setting db for ${customReq.method} ${customReq.url}`);
    const dbInstance = await getDb();
    customReq.db = dbInstance;
    console.log(`Db set for ${customReq.method} ${customReq.url}, Namespace:`, dbInstance.namespace);
    next();
  } catch (error) {
    console.error('Database not ready for request:', customReq.method, customReq.url, error);
    res.status(503).json({ error: 'Service unavailable: Database not ready' });
  }
};

// Middleware để log response trước khi gửi
export const logResponse: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const customReq = req as CustomRequest;
  console.log(`Processing response for ${customReq.method} ${customReq.url}`);
  const originalJson = res.json;
  res.json = function (data) {
    try {
      console.log(`Sending response for ${customReq.method} ${customReq.url}:`, data);
      return originalJson.call(this, data);
    } catch (error) {
      console.error(`Error sending response for ${customReq.method} ${customReq.url}:`, error);
      res.status(500).json({ error: 'Failed to send response' });
      return this;
    }
  };
  next();
};

// Middleware xử lý lỗi
export const errorHandler: ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
};