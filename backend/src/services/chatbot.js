"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeIndexes = exports.cleanupChatHistory = exports.chatWithAI = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const redis_1 = require("redis");
const zod_1 = require("zod");
dotenv_1.default.config();
const WitAI = process.env.WitAI;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '7200', 10); // 2 giờ
const CONTEXT_TTL = parseInt(process.env.CONTEXT_TTL || '86400', 10); // 24 giờ
if (!WitAI) {
    throw new Error('WitAI token is not defined in environment variables');
}
// Khởi tạo Redis client với xử lý lỗi
const redisClient = (0, redis_1.createClient)({ url: REDIS_URL });
let redisAvailable = true;
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    redisAvailable = false;
});
redisClient.connect().catch((err) => {
    console.error('Redis Connection Error:', err);
    redisAvailable = false;
});
// Schema để validate input
const MessageSchema = zod_1.z.array(zod_1.z.union([
    zod_1.z.string().min(1, 'Tin nhắn không được rỗng'),
    zod_1.z.object({
        role: zod_1.z.enum(['user', 'assistant']),
        content: zod_1.z.string().min(1, 'Nội dung tin nhắn không được rỗng'),
    }),
])).min(1, 'Messages không được rỗng');
const ChatInputSchema = zod_1.z.object({
    messages: MessageSchema,
    sessionId: zod_1.z.string().optional(),
    userId: zod_1.z.string().nullable().optional(),
});
// Intent đơn giản
const SIMPLE_INTENTS_KEYWORDS = {
    'chào hỏi': /^(xin chào|hello|hi|chào)$/i,
    'cảm ơn': /^(cảm ơn|thanks|thank you)$/i,
    'tạm biệt': /^(tạm biệt|bye|goodbye)$/i,
    'chỉ xem qua': /chỉ xem qua|xem qua|xem thử/i,
    'consult_pet_product': /tư vấn sản phẩm|cần tư vấn|gợi ý sản phẩm.*(thú cưng|chó|mèo)/i,
    'pet_name': /(mèo|chó).*(tên|gọi).*(là|gì)/i,
    'pet_disease': /(chó|mèo).*(bệnh|bị bệnh).*(gì|nào)/i,
    'product_usage': /(sử dụng|dùng).*(sản phẩm|này).*(thế nào|ra sao)/i,
    'pet_care': /(chăm sóc|nuôi).*(thú cưng|chó|mèo).*(thế nào|hiệu quả)/i,
    'find_cat_accessories': /tìm.*phụ kiện.*mèo/i,
    'find_dog_accessories': /tìm.*phụ kiện.*chó/i,
    'cat_food_usage': /(thức ăn|hạt).*(mèo).*(dùng|sử dụng).*(thế nào|ra sao|cách nào)/i,
    'litter_box_usage': /(sử dụng|dùng).*(khay vệ sinh|nhà vệ sinh).*(thế nào|ra sao|cách nào)/i,
    'confirm_product_search': /(tôi muốn tìm|tìm).*(thức ăn|hạt|phụ kiện).*(mèo|chó|cats on|whiskas|royal canin)/i,
};
// Định nghĩa SIMPLE_RESPONSES
const SIMPLE_RESPONSES = {
    'chào hỏi': 'Xin chào! 🐾 Rất vui được gặp bạn! Bạn đang tìm gì cho thú cưng của mình hôm nay?',
    'cảm ơn': 'Cảm ơn bạn! Nếu cần gì thêm cứ hỏi nhé!',
    'tạm biệt': 'Tạm biệt bạn! Hẹn gặp lại!',
    'chỉ xem qua': 'Cứ thoải mái xem nhé! Nếu cần tư vấn gì, cứ hỏi mình nha! 😊',
    'consult_pet_product': 'Mình sẽ gợi ý một số sản phẩm phổ biến cho bạn nhé!',
};
// Danh sách intent hợp lệ
const validIntents = [
    'chào hỏi', 'cảm ơn', 'tạm biệt', 'chỉ xem qua', 'consult_pet_product',
    'find_dog_accessories', 'find_cat_accessories', 'recommend_product', 'check_order',
    'place_order', 'find_article', 'find_menu', 'pet_name', 'pet_disease', 'product_usage', 'pet_care',
    'cat_food_usage', 'litter_box_usage', 'confirm_product_search'
];
const handleConfirmProductSearch = async (userMessage, intentData, db) => {
    var _a, _b, _c, _d;
    const productName = intentData.productName || ((_a = userMessage.match(/(?:tìm)?\s*(hạt\s*(cats on|whiskas|royal canin)|thức ăn)/i)) === null || _a === void 0 ? void 0 : _a[1]);
    if (productName) {
        try {
            console.log('Searching for product:', productName); // Debug log
            const products = await db
                .collection('products')
                .find({ title: { $regex: new RegExp(productName, 'i') } })
                .limit(1)
                .toArray();
            if (products.length > 0) {
                const product = products[0];
                return {
                    intent: 'confirm_product_search',
                    message: `Dựa trên yêu cầu của bạn, tôi tìm thấy sản phẩm này nè:  
**${product.title}**  
- **Thương hiệu**: ${product.brand || 'Không có thương hiệu'}  
- **Giá**: ${parseFloat(((_b = product.originalPrice) === null || _b === void 0 ? void 0 : _b.replace(/[^0-9]/g, '')) || '0')} VND  
- **Mô tả**: ${getProductDescription(product.title) || 'Sản phẩm chất lượng cao cho thú cưng của bạn.'}  
- **Link sản phẩm**: ${product.href || `/products/${product._id}`}  
- **Hình ảnh**: ${product.image || 'https://via.placeholder.com/150'}  
Nếu bạn muốn biết thêm chi tiết hoặc tìm loại khác, cứ nói mình nhé! 🐾`,
                    products: [{
                            id: ((_c = product._id) === null || _c === void 0 ? void 0 : _c.toString()) || '0',
                            name: product.title || 'Sản phẩm không tên',
                            brand: product.brand || 'Không có thương hiệu',
                            price: parseFloat(((_d = product.originalPrice) === null || _d === void 0 ? void 0 : _d.replace(/[^0-9]/g, '')) || '0'),
                            image: product.image || 'https://via.placeholder.com/150',
                            href: `/products/${product._id}`,
                        }],
                };
            }
            else {
                return {
                    intent: 'confirm_product_search',
                    message: `Hmmm, mình vừa tìm kiếm nhưng có vẻ shop mình hiện tại chưa có "${productName}" đâu bạn ơi. 😿 Bạn có muốn thử loại khác không? Cứ nói mình nhé! 😺`,
                };
            }
        }
        catch (error) {
            console.error('Error in handleConfirmProductSearch:', error);
            return {
                intent: 'confirm_product_search',
                message: 'Có lỗi khi tìm sản phẩm. Vui lòng thử lại sau!',
            };
        }
    }
    return {
        intent: 'confirm_product_search',
        message: 'Bạn có muốn mình tìm một sản phẩm cụ thể nào không? Ví dụ: "Hạt cho mèo Cats On" hoặc "Khay vệ sinh Richell".',
    };
};
// Từ khóa vi phạm (bạo lực, tình dục, v.v.)
const VIOLATION_KEYWORDS = ['đánh', 'đập', 'bạo lực', 'tình dục', 'giết', 'hành hung'];
const checkContentSafety = (message) => {
    const lowerCaseMessage = message.toLowerCase();
    return !VIOLATION_KEYWORDS.some(keyword => lowerCaseMessage.includes(keyword));
};
// Lấy intent từ Wit.ai với fallback nếu Redis lỗi
const getWitAIIntent = async (message) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    if (!redisAvailable) {
        console.log('Redis không khả dụng, bỏ qua cache.');
        try {
            const response = await axios_1.default.get('https://api.wit.ai/message', {
                params: { q: message },
                headers: { Authorization: `Bearer ${WitAI}` },
            });
            const intent = ((_a = response.data.intents[0]) === null || _a === void 0 ? void 0 : _a.name) || 'hỏi đáp';
            const entities = response.data.entities || {};
            const petType = ((_c = (_b = entities['pet_type:pet_type']) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.value) || '';
            const petName = ((_e = (_d = entities['pet_name:pet_name']) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.value) || '';
            const productType = ((_g = (_f = entities['product_type:product_type']) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.value) || '';
            const productName = ((_j = (_h = entities['product_name:product_name']) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.value) || '';
            const keywords = [petType, petName, productType, productName].filter(Boolean);
            return { intent, keywords, petType, petName, productType, productName };
        }
        catch (error) {
            console.error('Wit.ai error:', error);
            return { intent: 'hỏi đáp', keywords: [] };
        }
    }
    const cacheKey = `witai:${message}`;
    const cachedIntent = await redisClient.get(cacheKey);
    if (cachedIntent) {
        console.log('Lấy intent từ cache:', cachedIntent);
        return JSON.parse(cachedIntent);
    }
    try {
        const response = await axios_1.default.get('https://api.wit.ai/message', {
            params: { q: message },
            headers: { Authorization: `Bearer ${WitAI}` },
        });
        const intent = ((_k = response.data.intents[0]) === null || _k === void 0 ? void 0 : _k.name) || 'hỏi đáp';
        const entities = response.data.entities || {};
        const petType = ((_m = (_l = entities['pet_type:pet_type']) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.value) || '';
        const petName = ((_p = (_o = entities['pet_name:pet_name']) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.value) || '';
        const productType = ((_r = (_q = entities['product_type:product_type']) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.value) || '';
        const productName = ((_t = (_s = entities['product_name:product_name']) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.value) || '';
        const keywords = [petType, petName, productType, productName].filter(Boolean);
        const intentData = { intent, keywords, petType, petName, productType, productName };
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(intentData));
        return intentData;
    }
    catch (error) {
        console.error('Wit.ai error:', error);
        return { intent: 'hỏi đáp', keywords: [] };
    }
};
// Lưu và lấy context với fallback
const saveContext = async (identifier, messages, response, petName, petType) => {
    if (redisAvailable) {
        const contextKey = `chat_context:${identifier}`;
        const context = {
            messages,
            lastResponse: response,
            timestamp: Date.now(),
            petName,
            petType,
        };
        await redisClient.setEx(contextKey, CONTEXT_TTL, JSON.stringify(context));
    }
};
const getContext = async (identifier) => {
    if (redisAvailable) {
        const contextKey = `chat_context:${identifier}`;
        const context = await redisClient.get(contextKey);
        return context ? JSON.parse(context) : null;
    }
    return null;
};
// Hàm xử lý intent riêng biệt
const handleRecommendProduct = async (userMessage, intentData, db) => {
    let keywords = [intentData.productType, ...intentData.keywords].filter(Boolean);
    if (keywords.length === 0) {
        keywords = userMessage.split(' ').filter((word) => word.length > 2);
    }
    if (keywords.length === 0) {
        return {
            intent: 'recommend_product',
            message: 'Vui lòng cung cấp thêm thông tin về sản phẩm bạn muốn tìm (ví dụ: thức ăn cho chó).',
        };
    }
    try {
        const isForDog = userMessage.includes('chó');
        const isForCat = userMessage.includes('mèo');
        const isAccessory = userMessage.includes('phụ kiện');
        let query = { title: { $regex: keywords.join('|'), $options: 'i' } };
        if (isAccessory) {
            query = {
                $and: [
                    { title: { $regex: keywords.join('|'), $options: 'i' } },
                    { title: { $regex: 'phụ kiện|đồ chơi|vòng cổ|dây dắt|đệm|giường|khay|vệ sinh|cây cào|nhà', $options: 'i' } },
                    { title: { $not: { $regex: 'hạt|thức ăn', $options: 'i' } } },
                ]
            };
            if (isForDog) {
                query.$and.push({ title: { $regex: 'chó', $options: 'i' } });
            }
            else if (isForCat) {
                query.$and.push({ title: { $regex: 'mèo', $options: 'i' } });
            }
        }
        const products = await db
            .collection('products')
            .find(query)
            .limit(3)
            .toArray();
        return products.length > 0
            ? {
                intent: 'recommend_product',
                message: 'Dưới đây là một số sản phẩm phù hợp mà bạn có thể thích:',
                products: products.map((p) => {
                    var _a, _b;
                    return ({
                        id: ((_a = p._id) === null || _a === void 0 ? void 0 : _a.toString()) || '0',
                        name: p.title || 'Sản phẩm không tên',
                        brand: p.brand || 'Không có thương hiệu',
                        price: parseFloat(((_b = p.originalPrice) === null || _b === void 0 ? void 0 : _b.replace(/[^0-9]/g, '')) || '0'),
                        image: p.image || 'https://via.placeholder.com/150',
                        href: `/products/${p._id}`,
                    });
                }),
                buttons: [{ label: 'Return', action: 'return' }],
            }
            : {
                intent: 'recommend_product',
                message: 'Hiện tại chưa có sản phẩm phù hợp trong database. Bạn muốn thử từ khóa khác không?',
            };
    }
    catch (error) {
        console.error('Error in handleRecommendProduct:', error);
        return {
            intent: 'recommend_product',
            message: 'Có lỗi xảy ra khi tìm sản phẩm. Vui lòng thử lại sau.',
        };
    }
};
const handleCheckOrder = async (intentData, db) => {
    const orderCode = intentData.keywords[0];
    if (!orderCode) {
        return { intent: 'check_order', message: 'Vui lòng cung cấp mã đơn hàng (ví dụ: ORD123456).' };
    }
    try {
        const order = await db.collection('orders').findOne({ order_code: orderCode });
        return order
            ? {
                intent: 'check_order',
                message: `Đơn hàng ${order.order_id}: ${order.status}, Tổng: ${order.total} VND. Bạn cần thêm thông tin gì không?`,
            }
            : { intent: 'check_order', message: 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hàng.' };
    }
    catch (error) {
        console.error('Error in handleCheckOrder:', error);
        return {
            intent: 'check_order',
            message: 'Có lỗi xảy ra khi kiểm tra đơn hàng. Vui lòng thử lại sau.',
        };
    }
};
const handleFindDogAccessories = async (db) => {
    try {
        const products = await db
            .collection('products')
            .find({}) // Bỏ toàn bộ điều kiện lọc, lấy tất cả sản phẩm
            .limit(3) // Giới hạn 3 sản phẩm
            .toArray();
        return products.length > 0
            ? {
                intent: 'find_dog_accessories',
                message: 'Dưới đây là một số sản phẩm mà bạn có thể thích:',
                products: products.map((p) => {
                    var _a, _b;
                    return ({
                        id: ((_a = p._id) === null || _a === void 0 ? void 0 : _a.toString()) || '0',
                        name: p.title || 'Sản phẩm không tên',
                        brand: p.brand || 'Không có thương hiệu',
                        price: parseFloat(((_b = p.originalPrice) === null || _b === void 0 ? void 0 : _b.replace(/[^0-9]/g, '')) || '0'),
                        image: p.image || 'https://via.placeholder.com/150',
                        href: p.href || `/products/${p._id}`,
                    });
                }),
                buttons: [{ label: 'Return', action: 'return' }],
            }
            : {
                intent: 'find_dog_accessories',
                message: 'Hiện tại chưa có sản phẩm trong database. Bạn muốn tìm sản phẩm khác không?',
            };
    }
    catch (error) {
        console.error('Error in handleFindDogAccessories:', error);
        return {
            intent: 'find_dog_accessories',
            message: 'Có lỗi xảy ra khi tìm sản phẩm. Vui lòng thử lại sau.',
        };
    }
};
const handleFindCatAccessories = async (db) => {
    try {
        const products = await db
            .collection('products')
            .find({}) // Bỏ toàn bộ điều kiện lọc, lấy tất cả sản phẩm
            .limit(3) // Giới hạn 3 sản phẩm
            .toArray();
        return products.length > 0
            ? {
                intent: 'find_cat_accessories',
                message: 'Dưới đây là một số sản phẩm mà bạn có thể thích:',
                products: products.map((p) => {
                    var _a, _b;
                    return ({
                        id: ((_a = p._id) === null || _a === void 0 ? void 0 : _a.toString()) || '0',
                        name: p.title || 'Sản phẩm không tên',
                        brand: p.brand || 'Không có thương hiệu',
                        price: parseFloat(((_b = p.originalPrice) === null || _b === void 0 ? void 0 : _b.replace(/[^0-9]/g, '')) || '0'),
                        image: p.image || 'https://via.placeholder.com/150',
                        href: p.href || `/products/${p._id}`,
                    });
                }),
                buttons: [{ label: 'Return', action: 'return' }],
            }
            : {
                intent: 'find_cat_accessories',
                message: 'Hiện tại chưa có sản phẩm trong database. Bạn muốn tìm sản phẩm khác không?',
            };
    }
    catch (error) {
        console.error('Error in handleFindCatAccessories:', error);
        return {
            intent: 'find_cat_accessories',
            message: 'Có lỗi xảy ra khi tìm sản phẩm. Vui lòng thử lại sau.',
        };
    }
};
const handleConsultProduct = async (db) => {
    try {
        const products = await db
            .collection('products')
            .find({})
            .limit(3)
            .toArray();
        const productList = products.length > 0 ? products.map((p) => {
            var _a, _b;
            return ({
                id: ((_a = p._id) === null || _a === void 0 ? void 0 : _a.toString()) || '0',
                name: p.title || 'Sản phẩm không tên',
                description: getProductDescription(p.title),
                brand: p.brand || 'Không có thương hiệu',
                price: parseFloat(((_b = p.originalPrice) === null || _b === void 0 ? void 0 : _b.replace(/[^0-9]/g, '')) || '0'),
                image: p.image || 'https://via.placeholder.com/150',
                href: `/products/${p._id}`,
            });
        }) : [];
        return {
            intent: 'consult_pet_product',
            message: 'Mình sẽ gợi ý một số sản phẩm phổ biến cho bạn nhé!',
            products: productList.length > 0 ? productList : [
                {
                    id: '1',
                    name: 'Khay Vệ Sinh Thành Cao Cho Mèo Richell <8kg 41x50x31',
                    description: 'Khay vệ sinh thiết kế thành cao, phù hợp cho mèo dưới 8kg, kích thước 41x50x31 cm, dễ dàng vệ sinh.',
                    brand: 'Richell',
                    price: 400000,
                    image: 'https://paddy.vn/cdn/shop/files/1_d2b357e9-3a9b-4dd3-90c9-a728432acfd5_785x.png?v=1741147113',
                    href: '/products/67f80b979430271ff0b98cec',
                },
                {
                    id: '2',
                    name: 'Nhà Vệ Sinh Cho Mèo Kèm Xẻng Richell <6kg 40x51x38',
                    description: 'Nhà vệ sinh kín cho mèo dưới 6kg, kích thước 40x51x38 cm, đi kèm xẻng tiện lợi, giữ không gian sạch sẽ.',
                    brand: 'Richell',
                    price: 550000,
                    image: 'https://paddy.vn/cdn/shop/files/Hinh_cover_sp_785x.png?v=1741163616',
                    href: '/products/67f80b979430271ff0b98ced',
                },
                {
                    id: '3',
                    name: 'Hạt Cho Mèo Cats On Mix T 1.4kg',
                    description: 'Thức ăn hạt dinh dưỡng cho mèo, trọng lượng 1.4kg, hỗ trợ sức khỏe lông và hệ tiêu hóa, hương vị thơm ngon.',
                    brand: "Cat's On",
                    price: 220000,
                    image: 'https://paddy.vn/cdn/images/4_0dae6796-b143-40a4-8dd9-501730455a29_785x.png?v=1740383628',
                    href: '/products/67f80b979430271ff0b98cee',
                },
            ],
            buttons: [{ label: 'Return', action: 'return' }]
        };
    }
    catch (error) {
        console.error('Error in handleConsultProduct:', error);
        return {
            intent: 'consult_pet_product',
            message: 'Có lỗi xảy ra khi gợi ý sản phẩm. Vui lòng thử lại sau.',
            products: [
                {
                    id: '1',
                    name: 'Khay Vệ Sinh Thành Cao Cho Mèo Richell <8kg 41x50x31',
                    description: 'Khay vệ sinh thiết kế thành cao, phù hợp cho mèo dưới 8kg, kích thước 41x50x31 cm, dễ dàng vệ sinh.',
                    brand: 'Richell',
                    price: 400000,
                    image: 'https://paddy.vn/cdn/shop/files/1_d2b357e9-3a9b-4dd3-90c9-a728432acfd5_785x.png',
                    href: '/products/67f80b979430271ff0b98cec',
                },
                {
                    id: '2',
                    name: 'Nhà Vệ Sinh Cho Mèo Kèm Xẻng Richell <6kg 40x51x38',
                    description: 'Nhà vệ sinh kín cho mèo dưới 6kg, kích thước 40x51x38 cm, đi kèm xẻng tiện lợi, giữ không gian sạch sẽ.',
                    brand: 'Richell',
                    price: 550000,
                    image: 'https://paddy.vn/cdn/shop/files/Hinh_cover_sp_785x.png?v=1741163616',
                    href: '/products/67f80b979430271ff0b98ced',
                },
            ],
            buttons: [{ label: 'Return', action: 'return' }],
        };
    }
};
const handlePetName = async (userMessage, context, identifier, sessionId, messages, intentData) => {
    var _a;
    const petName = intentData.petName || ((_a = userMessage.match(/(?:mèo|chó).*(?:tên|gọi).*(?:là)\s*(\w+)/i)) === null || _a === void 0 ? void 0 : _a[1]);
    if (petName) {
        const response = {
            intent: 'pet_name',
            message: `Cute quá! Bé ${intentData.petType || 'mèo/chó'} nhà bạn tên là ${petName} đúng không?`,
            sessionId
        };
        await saveContext(identifier, messages, response, petName, intentData.petType);
        return response;
    }
    if (userMessage.match(/(?:mèo|chó).*(?:tên|gọi).*(?:gì|là ai)/i) && (context === null || context === void 0 ? void 0 : context.petName)) {
        return {
            intent: 'pet_name',
            message: `Bé ${context.petType || 'mèo/chó'} nhà bạn tên là ${context.petName} mà! 🐾`,
            sessionId
        };
    }
    return {
        intent: 'pet_name',
        message: 'Bạn có thể cho mình biết tên bé mèo/chó nhà bạn không? Ví dụ: "Bé mèo nhà tôi tên Zeros".',
        sessionId
    };
};
const handlePetDisease = async () => {
    return {
        intent: 'pet_disease',
        message: 'Chó có thể mắc một số bệnh phổ biến như: bệnh care (bệnh sài sốt), bệnh parvovirus, hoặc bệnh về đường tiêu hóa. Bạn nên đưa bé đến bác sĩ thú y để kiểm tra định kỳ và tiêm phòng đầy đủ nhé! Nếu muốn tìm hiểu thêm, bạn có muốn xem bài viết về chăm sóc sức khỏe không?',
    };
};
const handleProductUsage = async (userMessage, intentData, db) => {
    const productName = intentData.productName;
    if (productName) {
        try {
            const products = await db
                .collection('products')
                .find({ title: { $regex: productName, $options: 'i' } })
                .limit(1)
                .toArray();
            if (products.length > 0) {
                const product = products[0];
                const usageInstructions = product.usageInstructions || "Hiện tại chưa có hướng dẫn chi tiết. Vui lòng kiểm tra bao bì sản phẩm hoặc liên hệ nhà cung cấp.";
                return {
                    intent: 'product_usage',
                    message: `Sản phẩm "${product.title}": ${usageInstructions}`,
                };
            }
        }
        catch (error) {
            console.error('Error in handleProductUsage:', error);
            return {
                intent: 'product_usage',
                message: 'Có lỗi xảy ra khi tìm hướng dẫn sử dụng. Vui lòng thử lại sau.',
            };
        }
    }
    return {
        intent: 'product_usage',
        message: 'Vui lòng cung cấp tên sản phẩm cụ thể để mình hướng dẫn cách sử dụng nhé! Ví dụ: "Sử dụng Hạt Cho Mèo Cats On thế nào?"',
    };
};
const handlePetCare = async () => {
    return {
        intent: 'pet_care',
        message: 'Để chăm sóc thú cưng hiệu quả, bạn nên: \n1. Cung cấp chế độ ăn uống cân bằng (thức ăn chất lượng, nước sạch). \n2. Đưa bé đi khám sức khỏe định kỳ và tiêm phòng đầy đủ. \n3. Tạo không gian sống sạch sẽ, thoải mái. \n4. Dành thời gian chơi đùa và quan tâm đến bé. Bạn có muốn mình gợi ý thêm sản phẩm hỗ trợ không?',
    };
};
// Hàm lấy mô tả dựa trên tiêu đề sản phẩm
const getProductDescription = (title) => {
    switch (title) {
        case 'Khay Vệ Sinh Thành Cao Cho Mèo Richell <8kg 41x50x31':
            return 'Khay vệ sinh thiết kế thành cao, phù hợp cho mèo dưới 8kg, kích thước 41x50x31 cm, dễ dàng vệ sinh.';
        case 'Nhà Vệ Sinh Cho Mèo Kèm Xẻng Richell <6kg 40x51x38':
            return 'Nhà vệ sinh kín cho mèo dưới 6kg, kích thước 40x51x38 cm, đi kèm xẻng tiện lợi, giữ không gian sạch sẽ.';
        case 'Hạt Cho Mèo Cats On Mix T 1.4kg':
            return 'Thức ăn hạt dinh dưỡng cho mèo, trọng lượng 1.4kg, hỗ trợ sức khỏe lông và hệ tiêu hóa, hương vị thơm ngon.';
        default:
            return 'Sản phẩm chất lượng cao cho thú cưng của bạn.';
    }
};
// Thêm mới: Hàm xử lý câu hỏi về cách dùng thức ăn hạt cho mèo với câu trả lời sẵn
const handleCatFoodUsage = async (userMessage, intentData, db) => {
    // Trả lời sẵn cho câu hỏi chung
    return {
        intent: 'cat_food_usage',
        message: `Để dùng thức ăn hạt cho mèo, bạn làm theo các bước đơn giản này nhé:  
1. Xem kỹ hướng dẫn trên bao bì để biết lượng ăn phù hợp với cân nặng và độ tuổi của bé mèo.  
2. Chia khẩu phần thành 2-3 bữa mỗi ngày, tránh để thức ăn trong bát quá lâu kẻo mất ngon.  
3. Đảm bảo luôn có nước sạch bên cạnh để mèo uống.  
4. Nếu mèo mới dùng loại hạt này, bạn nên trộn dần với thức ăn cũ trong khoảng 7-10 ngày để bé thích nghi, tránh bị rối loạn tiêu hóa.  

Nếu bạn muốn tìm loại hạt cụ thể, cứ nói mình nhé! 😺`,
    };
};
// Thêm mới: Hàm xử lý câu hỏi về cách dùng khay vệ sinh
const handleLitterBoxUsage = async (userMessage, intentData, db) => {
    var _a, _b, _c;
    const productName = intentData.productName || ((_a = userMessage.match(/(?:khay vệ sinh|nhà vệ sinh)\s*(\w+)/i)) === null || _a === void 0 ? void 0 : _a[1]);
    if (productName) {
        try {
            const products = await db
                .collection('products')
                .find({ title: { $regex: productName, $options: 'i' } })
                .limit(1)
                .toArray();
            if (products.length > 0) {
                const product = products[0];
                const usageInstructions = product.usageInstructions || `Để sử dụng "${product.title}":
1. Đặt khay ở nơi yên tĩnh, dễ tiếp cận nhưng riêng tư cho mèo.
2. Đổ cát vệ sinh (khoảng 5-7 cm độ sâu) vào khay.
3. Dọn phân và cát bẩn hàng ngày bằng xẻng (nếu có).
4. Thay cát hoàn toàn và vệ sinh khay mỗi 1-2 tuần.
5. Nếu mèo chưa quen, đặt mèo vào khay sau khi ăn để khuyến khích sử dụng.`;
                return {
                    intent: 'litter_box_usage',
                    message: usageInstructions,
                    products: [{
                            id: ((_b = product._id) === null || _b === void 0 ? void 0 : _b.toString()) || '0',
                            name: product.title || 'Khay vệ sinh không tên',
                            brand: product.brand || 'Không có thương hiệu',
                            price: parseFloat(((_c = product.originalPrice) === null || _c === void 0 ? void 0 : _c.replace(/[^0-9]/g, '')) || '0'),
                            image: product.image || 'https://via.placeholder.com/150',
                            href: `/products/${product._id}`,
                        }],
                };
            }
        }
        catch (error) {
            console.error('Error in handleLitterBoxUsage:', error);
        }
    }
    return {
        intent: 'litter_box_usage',
        message: `Để sử dụng khay vệ sinh cho mèo:
1. Chọn vị trí yên tĩnh, riêng tư nhưng dễ tiếp cận.
2. Đổ cát vệ sinh vào khay (độ sâu khoảng 5-7 cm).
3. Dùng xẻng dọn phân và cát bẩn mỗi ngày.
4. Thay toàn bộ cát và rửa khay bằng xà phòng nhẹ mỗi 1-2 tuần.
5. Nếu mèo chưa quen, đặt mèo vào khay sau bữa ăn để tập thói quen.
Bạn có muốn mình tìm khay cụ thể như "Khay Richell" không?`,
    };
};
// Hàm chính xử lý chat
const chatWithAI = async (messages, sessionId, userId, db) => {
    var _a, _b, _c;
    try {
        const validatedMessages = MessageSchema.parse(messages);
        const normalizedMessages = validatedMessages.map((msg) => typeof msg === 'string' ? { role: 'user', content: msg } : msg);
        const lastMessage = normalizedMessages[normalizedMessages.length - 1];
        const userMessage = lastMessage.content.toLowerCase().trim();
        console.log('User message:', userMessage); // Thêm log để debug
        // Xóa cache trước khi xử lý để tránh lỗi từ cache cũ
        if (redisAvailable) {
            const cacheKey = `witai:${userMessage}`;
            await redisClient.del(cacheKey);
            console.log('Cache cleared for:', cacheKey);
        }
        // Kiểm tra nội dung vi phạm
        if (!checkContentSafety(userMessage)) {
            return {
                intent: 'invalid',
                message: 'Xin lỗi, mình không hỗ trợ các nội dung liên quan đến bạo lực hoặc không phù hợp. Hãy hỏi về thú cưng nhé!',
                sessionId
            };
        }
        const identifier = userId || sessionId;
        const context = await getContext(identifier);
        if (context) {
            console.log('Tải context cho nầy:', identifier);
        }
        // Kiểm tra intent đơn giản trước
        for (const [intent, keywordRegex] of Object.entries(SIMPLE_INTENTS_KEYWORDS)) {
            if (keywordRegex.test(userMessage)) {
                console.log('Intent recognized:', intent); // Thêm log để debug
                let response;
                if (intent === 'find_dog_accessories') {
                    response = await handleFindDogAccessories(db);
                }
                else if (intent === 'find_cat_accessories') {
                    response = await handleFindCatAccessories(db);
                }
                else if (intent === 'consult_pet_product') {
                    response = await handleConsultProduct(db);
                }
                else if (intent === 'pet_name') {
                    const intentData = await getWitAIIntent(userMessage);
                    response = await handlePetName(userMessage, context, identifier, sessionId, normalizedMessages, intentData);
                    await saveContext(identifier, normalizedMessages, response, intentData.petName || (context === null || context === void 0 ? void 0 : context.petName), intentData.petType || (context === null || context === void 0 ? void 0 : context.petType));
                }
                else if (intent === 'pet_disease') {
                    response = await handlePetDisease();
                }
                else if (intent === 'product_usage') {
                    const intentData = await getWitAIIntent(userMessage);
                    response = await handleProductUsage(userMessage, intentData, db);
                }
                else if (intent === 'pet_care') {
                    response = await handlePetCare();
                }
                else if (intent === 'cat_food_usage') {
                    const intentData = await getWitAIIntent(userMessage);
                    response = await handleCatFoodUsage(userMessage, intentData, db);
                }
                else if (intent === 'litter_box_usage') {
                    const intentData = await getWitAIIntent(userMessage);
                    response = await handleLitterBoxUsage(userMessage, intentData, db);
                }
                else if (intent === 'confirm_product_search') {
                    const intentData = await getWitAIIntent(userMessage);
                    response = await handleConfirmProductSearch(userMessage, intentData, db);
                }
                else {
                    response = { intent, message: SIMPLE_RESPONSES[intent], sessionId };
                }
                await saveContext(identifier, normalizedMessages, response, context === null || context === void 0 ? void 0 : context.petName, context === null || context === void 0 ? void 0 : context.petType);
                await db.collection('chat_history').insertMany([
                    { session_id: sessionId, user_id: userId || null, role: 'user', content: userMessage, created_at: new Date() },
                    { session_id: sessionId, user_id: userId || null, role: 'assistant', content: JSON.stringify(response), created_at: new Date() },
                ]);
                return response;
            }
        }
        // Nếu không match với intent đơn giản, gọi Wit.ai
        const intentData = await getWitAIIntent(userMessage);
        console.log('Intent from Wit.ai:', intentData.intent); // Thêm log để debug
        if (!validIntents.includes(intentData.intent)) {
            return {
                intent: 'invalid',
                message: 'Xin lỗi, mình chỉ hỗ trợ các câu hỏi liên quan đến thú cưng. Bạn có thể hỏi về sản phẩm, đơn hàng, hoặc cách chăm sóc thú cưng không?',
                sessionId
            };
        }
        let responseData;
        switch (intentData.intent) {
            case 'find_dog_accessories':
                responseData = await handleFindDogAccessories(db);
                break;
            case 'find_cat_accessories':
                responseData = await handleFindCatAccessories(db);
                break;
            case 'consult_pet_product':
                responseData = await handleConsultProduct(db);
                break;
            case 'recommend_product':
                responseData = await handleRecommendProduct(userMessage, intentData, db);
                break;
            case 'check_order':
                responseData = await handleCheckOrder(intentData, db);
                break;
            case 'place_order':
                responseData = userId
                    ? {
                        intent: 'place_order',
                        message: 'Vui lòng cung cấp tên sản phẩm để đặt hàng.',
                    }
                    : {
                        intent: 'place_order',
                        message: 'Xin lỗi, bạn cần đăng nhập để đặt hàng. Bạn có muốn tìm sản phẩm trước không?',
                    };
                break;
            case 'find_article': {
                let keywords = intentData.keywords;
                if (keywords.length === 0) {
                    keywords = userMessage.split(' ').filter((word) => word.length > 2);
                }
                if (keywords.length > 0) {
                    try {
                        const articles = await db
                            .collection('articles')
                            .find({ title: { $regex: keywords.join('|'), $options: 'i' } })
                            .limit(3)
                            .toArray();
                        responseData = articles.length > 0
                            ? {
                                intent: 'find_article',
                                message: 'Danh sách bài viết liên quan. Bạn muốn đọc bài nào?',
                                articles: articles.map((a) => {
                                    var _a;
                                    return ({
                                        id: ((_a = a._id) === null || _a === void 0 ? void 0 : _a.toString()) || '0',
                                        title: a.title || 'Bài viết không tên',
                                        content: (a.content || '').substring(0, 100) + '...',
                                        href: a.href || `/articles/${a._id}`,
                                    });
                                }),
                            }
                            : {
                                intent: 'find_article',
                                message: 'Không tìm thấy bài viết. Bạn có muốn thử từ khóa khác không?',
                            };
                    }
                    catch (error) {
                        console.error('Error in find_article:', error);
                        responseData = {
                            intent: 'find_article',
                            message: 'Có lỗi xảy ra khi tìm bài viết. Vui lòng thử lại sau.',
                        };
                    }
                }
                else {
                    responseData = {
                        intent: 'find_article',
                        message: 'Vui lòng cung cấp thêm thông tin về bài viết bạn muốn tìm.',
                    };
                }
                break;
            }
            case 'find_menu': {
                try {
                    const menuItems = await db
                        .collection('menu_items')
                        .find({ parent_id: null })
                        .limit(3)
                        .toArray();
                    responseData = menuItems.length > 0
                        ? {
                            intent: 'find_menu',
                            message: 'Danh sách menu chính. Bạn muốn khám phá mục nào?',
                            menuItems: menuItems.map((m) => {
                                var _a;
                                return ({
                                    id: ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) || '0',
                                    name: m.name || 'Menu không tên',
                                    description: m.description || '',
                                    href: m.href || `/menu/${m._id}`,
                                });
                            }),
                        }
                        : {
                            intent: 'find_menu',
                            message: 'Không tìm thấy menu. Vui lòng thử lại sau.',
                        };
                }
                catch (error) {
                    console.error('Error in find_menu:', error);
                    responseData = {
                        intent: 'find_menu',
                        message: 'Có lỗi xảy ra khi tìm menu. Vui lòng thử lại sau.',
                    };
                }
                break;
            }
            case 'pet_name':
                responseData = await handlePetName(userMessage, context, identifier, sessionId, normalizedMessages, intentData);
                await saveContext(identifier, normalizedMessages, responseData, intentData.petName || (context === null || context === void 0 ? void 0 : context.petName), intentData.petType || (context === null || context === void 0 ? void 0 : context.petType));
                break;
            case 'pet_disease':
                responseData = await handlePetDisease();
                break;
            case 'product_usage':
                responseData = await handleProductUsage(userMessage, intentData, db);
                break;
            case 'pet_care':
                responseData = await handlePetCare();
                break;
            case 'cat_food_usage':
                responseData = await handleCatFoodUsage(userMessage, intentData, db);
                break;
            case 'litter_box_usage':
                responseData = await handleLitterBoxUsage(userMessage, intentData, db);
                break;
            case 'confirm_product_search':
                responseData = await handleConfirmProductSearch(userMessage, intentData, db);
                break;
            default:
                responseData = {
                    intent: 'hỏi đáp',
                    message: 'Xin lỗi, mình chỉ hỗ trợ các câu hỏi về thú cưng, sản phẩm hoặc đơn hàng. Bạn có thể thử lại với câu hỏi khác không?',
                };
        }
        // Kiểm tra context để xử lý câu trả lời "Ừ, tìm Hạt Cats On đi"
        if (((_b = (_a = context === null || context === void 0 ? void 0 : context.lastResponse) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.includes('Bạn có muốn mình tìm sản phẩm cụ thể')) && /ừ|tìm|đi|okay|ok/i.test(userMessage)) {
            intentData.intent = 'confirm_product_search';
            intentData.productName = ((_c = userMessage.match(/(?:tìm)?\s*(hạt\s*(cats on|whiskas|royal canin)|thức ăn)/i)) === null || _c === void 0 ? void 0 : _c[1]) || 'Hạt cho mèo Cats On';
            responseData = await handleConfirmProductSearch(userMessage, intentData, db);
        }
        responseData.sessionId = sessionId;
        await saveContext(identifier, normalizedMessages, responseData);
        await db.collection('chat_history').insertMany([
            { session_id: sessionId, user_id: userId || null, role: 'user', content: userMessage, created_at: new Date() },
            { session_id: sessionId, user_id: userId || null, role: 'assistant', content: JSON.stringify(responseData), created_at: new Date() },
        ]);
        return responseData;
    }
    catch (error) {
        console.error('Chat error details:', error);
        return {
            intent: 'hỏi đáp',
            message: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.',
            sessionId,
            error: error.message,
        };
    }
};
exports.chatWithAI = chatWithAI;
// Dọn dẹp lịch sử chat
const cleanupChatHistory = async (db) => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await db
            .collection('chat_history')
            .deleteMany({ created_at: { $lt: oneDayAgo } });
        console.log(`Đã xóa ${result.deletedCount} tin nhắn cũ`);
    }
    catch (error) {
        console.error('Lỗi khi dọn dẹp chat_history:', error);
    }
};
exports.cleanupChatHistory = cleanupChatHistory;
// Khởi tạo index cho MongoDB
const initializeIndexes = async (db) => {
    try {
        await db.collection('products').createIndex({ title: 'text' });
        await db.collection('orders').createIndex({ order_code: 1 });
        await db.collection('articles').createIndex({ title: 'text' });
        await db.collection('chat_history').createIndex({ session_id: 1, created_at: 1 });
        await db.collection('chat_history').createIndex({ user_id: 1, created_at: 1 });
        console.log('Đã tạo index cho MongoDB');
    }
    catch (error) {
        console.error('Lỗi khi tạo index:', error);
    }
};
exports.initializeIndexes = initializeIndexes;
