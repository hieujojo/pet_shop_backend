import { Request, Response } from 'express';
import { getAllBrands } from '../../models/home/brandModel';

interface CustomRequest extends Request {
  db: any;
}

export const getBrands = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.db) {
      throw new Error('Database connection is not available');
    }
    const brands = await getAllBrands(req.db);
    res.status(200).json(brands);
  } catch (error: any) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Failed to fetch brands: ' + error.message });
  }
};