import { Request, Response } from 'express';
import { getAllData } from '../models/dataModel';

interface CustomRequest extends Request {
  db: any; // Đối tượng MongoDB Db
}

export const getData = async (req: CustomRequest, res: Response) => {
  try {
    const data = await getAllData(req.db); // Gọi hàm async từ model
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Controller error:', error);
    res.status(500).json({ error: 'Failed to fetch data: ' + error.message });
  }
};