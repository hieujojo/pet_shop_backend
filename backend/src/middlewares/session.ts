import session from 'express-session';
import MongoStore from 'connect-mongo';
import { Express } from 'express';

export const sessionMiddleware = (app: Express) => {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET không được định nghĩa trong biến môi trường');
  }

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions',
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 ngày
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );
};