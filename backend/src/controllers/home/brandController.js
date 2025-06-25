"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrands = void 0;
const brandModel_1 = require("../../models/home/brandModel");
const getBrands = async (req, res) => {
    try {
        if (!req.db) {
            throw new Error('Database connection is not available');
        }
        const brands = await (0, brandModel_1.getAllBrands)(req.db);
        res.status(200).json(brands);
    }
    catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({ error: 'Failed to fetch brands: ' + error.message });
    }
};
exports.getBrands = getBrands;
