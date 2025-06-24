"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getData = void 0;
const dataModel_1 = require("../models/dataModel");
const getData = async (req, res) => {
    try {
        const data = await (0, dataModel_1.getAllData)(req.db); // Gọi hàm async từ model
        res.status(200).json(data);
    }
    catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({ error: 'Failed to fetch data: ' + error.message });
    }
};
exports.getData = getData;
