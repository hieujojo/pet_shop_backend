"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCollections = void 0;
const getAllCollections = async (db) => {
    try {
        const start = Date.now();
        const collections = await db.collection('collections').find().toArray();
        const serializedCollections = collections.map(collection => (Object.assign(Object.assign({}, collection), { _id: collection._id.toString() })));
        const duration = Date.now() - start;
        console.log(`Collections fetched successfully: [${serializedCollections.length} items] in ${duration}ms`, serializedCollections);
        return serializedCollections;
    }
    catch (error) {
        console.error('Error fetching collections:', error);
        throw error;
    }
};
exports.getAllCollections = getAllCollections;
