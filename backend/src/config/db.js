"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoUri = process.env.MONGO_URI;
const client = new mongodb_1.MongoClient(mongoUri);
let db = null;
let isConnecting = false;
const connectDB = async (retries = 3, delay = 5000) => {
    if (isConnecting) {
        console.log('Đang kết nối MongoDB, chờ hoàn tất...');
        while (isConnecting) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (!db)
            throw new Error('Database not initialized after connection attempt');
        return db;
    }
    isConnecting = true;
    try {
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in .env');
        }
        await client.connect();
        db = client.db("petshop_mongo");
        console.log('Kết nối MongoDB thành công. Database:', db.namespace);
        return db;
    }
    catch (error) {
        console.error('Lỗi kết nối MongoDB:', error);
        if (retries > 0) {
            console.log(`Thử kết nối lại sau ${delay}ms... (${retries} lần thử còn lại)`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return connectDB(retries - 1, delay);
        }
        console.error('Hết số lần thử kết nối, thoát ứng dụng.');
        process.exit(1);
    }
    finally {
        isConnecting = false;
    }
};
async function getDb() {
    console.log('Calling getDb, db exists:', !!db);
    if (!db) {
        throw new Error("Database not initialized. Call connectDB first.");
    }
    try {
        await client.db("petshop_mongo").command({ ping: 1 });
        return db;
    }
    catch (error) {
        console.error('Kết nối MongoDB bị gián đoạn, đang thử kết nối lại...');
        db = null;
        await connectDB();
        if (!db)
            throw new Error('Failed to reconnect to MongoDB');
        return db;
    }
}
client.on('connectionClosed', () => {
    console.error('Kết nối MongoDB bị ngắt, đang thử kết nối lại...');
    db = null;
    connectDB();
});
process.on('SIGINT', async () => {
    await client.close();
    console.log('Đã đóng kết nối MongoDB');
    process.exit(0);
});
exports.default = connectDB;
