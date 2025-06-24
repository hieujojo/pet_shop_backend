"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
const middleware_1 = require("./middlewares/middleware");
const passport_1 = __importDefault(require("passport"));
const session_1 = require("./middlewares/session");
events_1.EventEmitter.defaultMaxListeners = 15;
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
dotenv_1.default.config();
// Cấu hình CORS
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(middleware_1.logRequestTime);
(0, session_1.sessionMiddleware)(app);
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(middleware_1.checkAndSetDb);
app.use(middleware_1.logResponse);
const authRoutes_1 = __importDefault(require("./routes/auth/authRoutes"));
const dataRoutes_1 = __importDefault(require("./routes/dataRoutes"));
const chatbotRoutes_1 = __importDefault(require("./routes/home/chatbotRoutes"));
const menuRoutes_1 = __importDefault(require("./routes/menuRoutes"));
const productRoutes_1 = __importDefault(require("./routes/home/productRoutes"));
const articleRoutes_1 = __importDefault(require("./routes/home/articleRoutes"));
const brandRoutes_1 = __importDefault(require("./routes/home/brandRoutes"));
const collectionRoutes_1 = __importDefault(require("./routes/home/collectionRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/cart/orderRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/review/reviewRoutes"));
app.use('/data', dataRoutes_1.default);
app.use('/auth', authRoutes_1.default);
app.use('/chatbot', chatbotRoutes_1.default);
app.use('/api/order_products', orderRoutes_1.default);
app.use('/api/menu', menuRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/articles', articleRoutes_1.default);
app.use('/api/brands', brandRoutes_1.default);
app.use('/api/collections', collectionRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
app.use('/images', express_1.default.static(path_1.default.join(__dirname, '../public/images')));
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to PetShop API. Use /api/products to get products.' });
});
app.use(middleware_1.errorHandler);
async function startServer() {
    try {
        const dbInstance = await (0, db_1.default)();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Lỗi khởi động server:', error);
        process.exit(1);
    }
}
startServer();
