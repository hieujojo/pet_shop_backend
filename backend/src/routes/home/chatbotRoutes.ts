import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { chatWithAI } from '../../services/chatbot';
import { Db } from 'mongodb';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// Schema để validate request body
const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.union([
        z.string().min(1, 'Tin nhắn không được rỗng'),
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().min(1, 'Nội dung tin nhắn không được rỗng'),
        }),
      ])
    )
    .min(1, 'Messages không được rỗng'),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
});

interface CustomRequest extends Request {
  db: Db;
}

const router = express.Router();

// Khai báo chatWithAIHandler với kiểu RequestHandler
const chatWithAIHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { messages, sessionId, userId } = ChatRequestSchema.parse(req.body);

    const finalSessionId = sessionId || nanoid();

    const aiResponse = await chatWithAI(messages, finalSessionId, userId || null, req.db);
    res.json(aiResponse);
  } catch (error: any) {
    console.error('Chat API error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Dữ liệu đầu vào không hợp lệ', details: error.errors });
    } else {
      res.status(500).json({ error: 'Lỗi server, vui lòng thử lại sau' });
    }
  }
};

router.post('/', chatWithAIHandler as RequestHandler);

export default router;