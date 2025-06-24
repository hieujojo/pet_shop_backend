"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatbot_1 = require("../../services/chatbot");
const zod_1 = require("zod");
const nanoid_1 = require("nanoid");
// Schema để validate request body
const ChatRequestSchema = zod_1.z.object({
    messages: zod_1.z
        .array(zod_1.z.union([
        zod_1.z.string().min(1, 'Tin nhắn không được rỗng'),
        zod_1.z.object({
            role: zod_1.z.enum(['user', 'assistant']),
            content: zod_1.z.string().min(1, 'Nội dung tin nhắn không được rỗng'),
        }),
    ]))
        .min(1, 'Messages không được rỗng'),
    sessionId: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
});
const router = express_1.default.Router();
// Khai báo chatWithAIHandler với kiểu RequestHandler
const chatWithAIHandler = async (req, res, next) => {
    try {
        const { messages, sessionId, userId } = ChatRequestSchema.parse(req.body);
        const finalSessionId = sessionId || (0, nanoid_1.nanoid)();
        const aiResponse = await (0, chatbot_1.chatWithAI)(messages, finalSessionId, userId || null, req.db);
        res.json(aiResponse);
    }
    catch (error) {
        console.error('Chat API error:', error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Dữ liệu đầu vào không hợp lệ', details: error.errors });
        }
        else {
            res.status(500).json({ error: 'Lỗi server, vui lòng thử lại sau' });
        }
    }
};
router.post('/', chatWithAIHandler);
exports.default = router;
