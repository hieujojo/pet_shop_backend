"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllData = void 0;
const getAllData = async (db) => {
    try {
        const data = await db.collection('data').find().toArray();
        console.log('Data fetched successfully:', data);
        return data;
    }
    catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};
exports.getAllData = getAllData;
