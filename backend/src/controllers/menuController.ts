import { Request, Response } from 'express';
import menuModel from '../models/menuModel';

// Định nghĩa CustomRequest để có req.db
interface CustomRequest extends Request {
  db: any; // Đối tượng MongoDB Db
}

const getMenuItems = async (req: CustomRequest, res: Response) => {
  try {
    const { locale } = req.query as { locale: string };
    if (!locale) {
      return res.status(400).json({ error: 'Locale is required' });
    }
    const menuItems = await menuModel.getMenuItems(req.db, locale); // Truyền req.db
    res.status(200).json(menuItems);
  } catch (error: any) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Failed to fetch menu items: ' + error.message });
  }
};

export default { getMenuItems };