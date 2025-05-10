import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import path from 'path';
import { EventEmitter } from 'events';
import { logRequestTime, logResponse, errorHandler, checkAndSetDb } from './middlewares/middleware';
import passport from 'passport';
import { sessionMiddleware } from './middlewares/session';

EventEmitter.defaultMaxListeners = 15;

const app = express();
const port = process.env.PORT || 5000;

dotenv.config();

// Cấu hình CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

app.use(logRequestTime);

sessionMiddleware(app);

app.use(passport.initialize());
app.use(passport.session());

app.use(checkAndSetDb);

app.use(logResponse);

import authRoutes from './routes/auth/authRoutes';
import dataRoutes from './routes/dataRoutes';
import chatbotRoutes from './routes/home/chatbotRoutes';
import menuRoutes from './routes/menuRoutes';
import productRoutes from './routes/home/productRoutes';
import articleRoutes from './routes/home/articleRoutes';
import brandRoutes from './routes/home/brandRoutes';
import collectionRoutes from './routes/home/collectionRoutes';
import orderRoutes from './routes/cart/orderRoutes';
import reviewRoutes from './routes/review/reviewRoutes';

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
app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to PetShop API. Use /api/products to get products.' });
});

app.use(errorHandler);

async function startServer() {
  try {
    const dbInstance = await connectDB();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Lỗi khởi động server:', error);
    process.exit(1);
  }
}

startServer();