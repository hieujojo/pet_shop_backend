import express, { RequestHandler } from 'express';
import { Request, Response, NextFunction } from 'express';
import { getData } from '../controllers/dataController'; // Bỏ addData vì không tồn tại

// Định nghĩa CustomRequest để khớp với controller
interface CustomRequest extends Request {
  db: any; // Đối tượng MongoDB Db
}

// Tạo handler để xử lý lỗi
const getDataHandler: RequestHandler = async (req, res, next) => {
  try {
    const customReq = req as CustomRequest; // Type assertion to CustomRequest
    await getData(customReq, res);
  } catch (error) {
    next(error);
  }
};

const router = express.Router();

router.get('/data', getDataHandler);

export default router;