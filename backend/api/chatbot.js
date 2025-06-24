const { MongoClient } = require('mongodb');
const axios = require('axios');
const { createClient } = require('redis');
const { z } = require('zod');
const { nanoid } = require('nanoid');
const dotenv = require('dotenv');
dotenv.config();

const WitAI = process.env.WitAI;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '7200', 10); // 2 giờ
const CONTEXT_TTL = parseInt(process.env.CONTEXT_TTL || '86400', 10); // 24 giờ

if (!WitAI) {
  throw new Error('WitAI token is not defined in environment variables');
}

// Khởi tạo client Redis
const redisClient = createClient({ url: REDIS_URL });
let redisAvailable = true;
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
  redisAvailable = false;
});
redisClient.connect().catch((err) => {
  console.error('Redis Connection Error:', err);
  redisAvailable = false;
});

// Schema validation
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

const MessageSchema = z.array(
  z.union([
    z.string().min(1, 'Tin nhắn không được rỗng'),
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1, 'Nội dung tin nhắn không được rỗng'),
    }),
  ])
).min(1, 'Messages không được rỗng');

const ChatInputSchema = z.object({
  messages: MessageSchema,
  sessionId: z.string().optional(),
  userId: z.string().nullable().optional(),
});

module.exports = async (req, res) => {
  const { method, url, body } = req;

  // Cấu hình CORS cho Vercel
  res.setHeader('Access-Control-Allow-Origin', 'https://pet-shop-urk12.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Xử lý OPTIONS (cho CORS preflight)
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (method !== 'POST' || url !== '/') {
    return res.status(404).json({ message: 'Route not found' });
  }

  let client, db;
  try {
    // Kết nối MongoDB
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();

    const { messages, sessionId, userId } = ChatRequestSchema.parse(body);

    const finalSessionId = sessionId || nanoid();

    const aiResponse = await chatWithAI(messages, finalSessionId, userId || null, db);
    return res.json(aiResponse);
  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dữ liệu đầu vào không hợp lệ', details: error.errors });
    } else {
      return res.status(500).json({ error: 'Lỗi server, vui lòng thử lại sau' });
    }
  } finally {
    if (client) await client.close();
    if (redisAvailable) await redisClient.quit(); // Ngắt kết nối Redis
  }
};

// Hàm chatWithAI (tách ra để dễ bảo trì)
async function chatWithAI(messages, sessionId, userId, db) {
  try {
    const validatedMessages = MessageSchema.parse(messages);

    const normalizedMessages = validatedMessages.map((msg) =>
      typeof msg === 'string' ? { role: 'user', content: msg } : msg
    );
    const lastMessage = normalizedMessages[normalizedMessages.length - 1];
    const userMessage = lastMessage.content.toLowerCase().trim();

    console.log('User message:', userMessage);

    if (redisAvailable) {
      const cacheKey = `witai:${userMessage}`;
      await redisClient.del(cacheKey); // Xóa cache cũ
      console.log('Cache cleared for:', cacheKey);
    }

    if (!checkContentSafety(userMessage)) {
      return {
        intent: 'invalid',
        message: 'Xin lỗi, mình không hỗ trợ các nội dung liên quan đến bạo lực hoặc không phù hợp. Hãy hỏi về thú cưng nhé!',
        sessionId,
      };
    }

    const identifier = userId || sessionId;
    const context = await getContext(identifier);

    for (const [intent, keywordRegex] of Object.entries(SIMPLE_INTENTS_KEYWORDS)) {
      if (keywordRegex.test(userMessage)) {
        let response;
        if (intent === 'find_dog_accessories') response = await handleFindDogAccessories(db);
        else if (intent === 'find_cat_accessories') response = await handleFindCatAccessories(db);
        else if (intent === 'consult_pet_product') response = await handleConsultProduct(db);
        else if (intent === 'pet_name') {
          const intentData = await getWitAIIntent(userMessage);
          response = await handlePetName(userMessage, context, identifier, sessionId, normalizedMessages, intentData);
          await saveContext(identifier, normalizedMessages, response, intentData.petName || context?.petName, intentData.petType || context?.petType);
        } else if (intent === 'pet_disease') response = await handlePetDisease();
        else if (intent === 'product_usage') {
          const intentData = await getWitAIIntent(userMessage);
          response = await handleProductUsage(userMessage, intentData, db);
        } else if (intent === 'pet_care') response = await handlePetCare();
        else if (intent === 'cat_food_usage') {
          const intentData = await getWitAIIntent(userMessage);
          response = await handleCatFoodUsage(userMessage, intentData, db);
        } else if (intent === 'litter_box_usage') {
          const intentData = await getWitAIIntent(userMessage);
          response = await handleLitterBoxUsage(userMessage, intentData, db);
        } else if (intent === 'confirm_product_search') {
          const intentData = await getWitAIIntent(userMessage);
          response = await handleConfirmProductSearch(userMessage, intentData, db);
        } else response = { intent, message: SIMPLE_RESPONSES[intent], sessionId };
        await saveContext(identifier, normalizedMessages, response, context?.petName, context?.petType);
        await db.collection('chat_history').insertMany([
          { session_id: sessionId, user_id: userId || null, role: 'user', content: userMessage, created_at: new Date() },
          { session_id: sessionId, user_id: userId || null, role: 'assistant', content: JSON.stringify(response), created_at: new Date() },
        ]);
        return response;
      }
    }

    const intentData = await getWitAIIntent(userMessage);
    if (!validIntents.includes(intentData.intent)) {
      return {
        intent: 'invalid',
        message: 'Xin lỗi, mình chỉ hỗ trợ các câu hỏi liên quan đến thú cưng. Bạn có thể hỏi về sản phẩm, đơn hàng, hoặc cách chăm sóc thú cưng không?',
        sessionId,
      };
    }

    let responseData;
    switch (intentData.intent) {
      case 'find_dog_accessories': responseData = await handleFindDogAccessories(db); break;
      case 'find_cat_accessories': responseData = await handleFindCatAccessories(db); break;
      case 'consult_pet_product': responseData = await handleConsultProduct(db); break;
      case 'recommend_product': responseData = await handleRecommendProduct(userMessage, intentData, db); break;
      case 'check_order': responseData = await handleCheckOrder(intentData, db); break;
      case 'place_order':
        responseData = userId
          ? { intent: 'place_order', message: 'Vui lòng cung cấp tên sản phẩm để đặt hàng.' }
          : { intent: 'place_order', message: 'Xin lỗi, bạn cần đăng nhập để đặt hàng. Bạn có muốn tìm sản phẩm trước không?' };
        break;
      case 'find_article': {
        let keywords = intentData.keywords;
        if (keywords.length === 0) keywords = userMessage.split(' ').filter((word) => word.length > 2);
        if (keywords.length > 0) {
          const articles = await db.collection('articles').find({ title: { $in: keywords } }).toArray();
          responseData = articles.length > 0
            ? { intent: 'find_article', message: 'Danh sách bài viết liên quan. Bạn muốn đọc bài nào?', articles: articles.map(a => ({ id: a._id?.toString() || '0', title: a.title || 'Bài viết không tên', content: (a.content || '').substring(0, 100) + '...', href: a.href || `/articles/${a._id}` })) }
            : { intent: 'find_article', message: 'Không tìm thấy bài viết. Bạn có muốn thử từ khóa khác không?' };
        } else {
          responseData = { intent: 'find_article', message: 'Vui lòng cung cấp thêm thông tin về bài viết bạn muốn tìm.' };
        }
        break;
      }
      case 'find_menu': {
        const menuItems = await db.collection('menu_items').find().toArray();
        responseData = menuItems.length > 0
          ? { intent: 'find_menu', message: 'Danh sách menu chính. Bạn muốn khám phá mục nào?', menuItems: menuItems.map(m => ({ id: m._id?.toString() || '0', name: m.name || 'Menu không tên', description: m.description || '', href: m.href || `/menu/${m._id}` })) }
          : { intent: 'find_menu', message: 'Không tìm thấy menu. Vui lòng thử lại sau.' };
        break;
      }
      case 'pet_name':
        responseData = await handlePetName(userMessage, context, identifier, sessionId, normalizedMessages, intentData);
        await saveContext(identifier, normalizedMessages, responseData, intentData.petName || context?.petName, intentData.petType || context?.petType);
        break;
      case 'pet_disease': responseData = await handlePetDisease(); break;
      case 'product_usage': responseData = await handleProductUsage(userMessage, intentData, db); break;
      case 'pet_care': responseData = await handlePetCare(); break;
      case 'cat_food_usage': responseData = await handleCatFoodUsage(userMessage, intentData, db); break;
      case 'litter_box_usage': responseData = await handleLitterBoxUsage(userMessage, intentData, db); break;
      case 'confirm_product_search': responseData = await handleConfirmProductSearch(userMessage, intentData, db); break;
      default: responseData = { intent: 'hỏi đáp', message: 'Xin lỗi, mình chỉ hỗ trợ các câu hỏi về thú cưng, sản phẩm hoặc đơn hàng. Bạn có thể thử lại với câu hỏi khác không?' };
    }

    if (context?.lastResponse?.message?.includes('Bạn có muốn mình tìm sản phẩm cụ thể') && /ừ|tìm|đi|okay|ok/i.test(userMessage)) {
      intentData.intent = 'confirm_product_search';
      intentData.productName = userMessage.match(/(?:tìm)?\s*(hạt\s*(cats on|whiskas|royal canin)|thức ăn)/i)?.[1] || 'Hạt cho mèo Cats On';
      responseData = await handleConfirmProductSearch(userMessage, intentData, db);
    }

    responseData.sessionId = sessionId;
    await saveContext(identifier, normalizedMessages, responseData);
    await db.collection('chat_history').insertMany([
      { session_id: sessionId, user_id: userId || null, role: 'user', content: userMessage, created_at: new Date() },
      { session_id: sessionId, user_id: userId || null, role: 'assistant', content: JSON.stringify(responseData), created_at: new Date() },
    ]);

    return responseData;
  } catch (error) {
    console.error('Chat error details:', error);
    return {
      intent: 'hỏi đáp',
      message: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.',
      sessionId,
      error: error.message,
    };
  }
}

// Các hàm xử lý intent (giả định giữ nguyên từ file của bạn)
const SIMPLE_INTENTS_KEYWORDS = { /* ... */ };
const SIMPLE_RESPONSES = { /* ... */ };
const validIntents = [/* ... */];

function checkContentSafety(message) { /* ... */ }
async function getWitAIIntent(message) { /* ... */ }
async function saveContext(identifier, messages, response, petName, petType) { /* ... */ }
async function getContext(identifier) { /* ... */ }
async function handleRecommendProduct(userMessage, intentData, db) { /* ... */ }
async function handleCheckOrder(intentData, db) { /* ... */ }
async function handleFindDogAccessories(db) { /* ... */ }
async function handleFindCatAccessories(db) { /* ... */ }
async function handleConsultProduct(db) { /* ... */ }
async function handlePetName(userMessage, context, identifier, sessionId, messages, intentData) { /* ... */ }
async function handlePetDisease() { /* ... */ }
async function handleProductUsage(userMessage, intentData, db) { /* ... */ }
async function handlePetCare() { /* ... */ }
async function handleCatFoodUsage(userMessage, intentData, db) { /* ... */ }
async function handleLitterBoxUsage(userMessage, intentData, db) { /* ... */ }
async function handleConfirmProductSearch(userMessage, intentData, db) { /* ... */ }
function getProductDescription(title) { /* ... */ }
async function cleanupChatHistory(db) { /* ... */ }
async function initializeIndexes(db) { /* ... */ }