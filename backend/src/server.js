const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { logRequestTime, logResponse, errorHandler } = require('./middlewares/middleware');
const passport = require('passport');
const sessionMiddleware = require('./middlewares/session');

dotenv.config();

const app = express();

app.use(cors({
    origin: 'https://pet-shop-urk12.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());
app.use(logRequestTime);
app.use(sessionMiddleware()); // Gọi sessionMiddleware và dùng kết quả
app.use(passport.initialize());
app.use(passport.session());

const authRoutes = require('./routes/auth/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const chatbotRoutes = require('./routes/home/chatbotRoutes');
const menuRoutes = require('./routes/menuRoutes');
const productRoutes = require('./routes/home/productRoutes');
const articleRoutes = require('./routes/home/articleRoutes');
const brandRoutes = require('./routes/home/brandRoutes');
const collectionRoutes = require('./routes/home/collectionRoutes');
const orderRoutes = require('./routes/cart/orderRoutes');
const reviewRoutes = require('./routes/review/reviewRoutes');

app.use('/data', dataRoutes);
app.use('/auth', authRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/api/order_products', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/products', productRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/images', express.static(require('path').join(__dirname, '../public/images')));

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to PetShop API. Use /api/products to get products.' });
});

app.use(errorHandler);

module.exports = app;