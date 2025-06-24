"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollections = void 0;
const collectionModel_1 = require("../../models/home/collectionModel");
const getCollections = async (req, res) => {
    try {
        if (!req.db) {
            console.log('req.db is undefined in getCollections');
            throw new Error('Database connection is not available');
        }
        console.log('req.db in getCollections:', req.db);
        const collections = await (0, collectionModel_1.getAllCollections)(req.db);
        res.status(200).json(collections);
    }
    catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({ error: 'Failed to fetch collections: ' + error.message });
    }
};
exports.getCollections = getCollections;
