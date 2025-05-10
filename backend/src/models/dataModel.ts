import { Db } from 'mongodb';

export const getAllData = async (db: Db): Promise<any[]> => {
  try {
    const data = await db.collection('data').find().toArray();
    console.log('Data fetched successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error);
    throw error; 
  }
};