"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTAINERS = exports.getContainer = exports.getDatabase = exports.getCosmosClient = void 0;
const cosmos_1 = require("@azure/cosmos");
const endpoint = process.env.AZURE_COSMOS_ENDPOINT || '';
const key = process.env.AZURE_COSMOS_KEY || '';
const databaseId = process.env.AZURE_COSMOS_DATABASE || 'photoshare';
let client = null;
let database = null;
const getCosmosClient = () => {
    if (!client) {
        client = new cosmos_1.CosmosClient({ endpoint, key });
    }
    return client;
};
exports.getCosmosClient = getCosmosClient;
const getDatabase = async () => {
    if (!database) {
        const client = (0, exports.getCosmosClient)();
        const { database: db } = await client.databases.createIfNotExists({ id: databaseId });
        database = db;
    }
    return database;
};
exports.getDatabase = getDatabase;
const getContainer = async (containerId) => {
    const db = await (0, exports.getDatabase)();
    const { container } = await db.containers.createIfNotExists({ id: containerId });
    return container;
};
exports.getContainer = getContainer;
// Container IDs
exports.CONTAINERS = {
    USERS: 'users',
    PHOTOS: 'photos',
    COMMENTS: 'comments',
    LIKES: 'likes',
};
//# sourceMappingURL=cosmos.js.map