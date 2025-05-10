import { Router, RequestHandler } from 'express';
import { getOrderHandler, addToOrderHandler, updateOrderItemHandler, removeOrderItemHandler, placeOrderHandler } from '../../controllers/cart/orderController';
import { Request, Response, NextFunction } from 'express';

const router = Router();

const checkSession = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Không được phép truy cập, vui lòng đăng nhập' });
  }
};

const wrapHandler = (handler: (req: any, res: any) => Promise<any>): RequestHandler => {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
};

router.get('/', checkSession, wrapHandler(getOrderHandler));
router.post('/', checkSession, wrapHandler(addToOrderHandler));
router.put('/', checkSession, wrapHandler(updateOrderItemHandler));
router.delete('/:productId', checkSession, wrapHandler(removeOrderItemHandler));
router.post('/place', checkSession, wrapHandler(placeOrderHandler));

export default router;