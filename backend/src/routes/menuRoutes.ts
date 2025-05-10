import { Router, RequestHandler } from 'express';
import { Request, Response, NextFunction } from 'express';
import menuController from '../controllers/menuController';

// Định nghĩa CustomRequest để khớp với controller
interface CustomRequest extends Request {
  db: any; // Đối tượng MongoDB Db
}

// Tạo handler để xử lý lỗi
const getMenuItemsHandler: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const customReq = req as CustomRequest;
    await menuController.getMenuItems(customReq, res);
  } catch (error) {
    next(error);
  }
};

const router = Router();

router.get('/', getMenuItemsHandler);

export default router;