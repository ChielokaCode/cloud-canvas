"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSasUrl = exports.deletePhoto = exports.uploadPhoto = exports.getContainerClient = exports.getBlobServiceClient = void 0;
const storage_blob_1 = require("@azure/storage-blob");
const storage_blob_2 = require("@azure/storage-blob");
const containerName = process.env.AZURE_CONTAINER_NAME || 'photos';
const sasToken = process.env.AZURE_BLOB_SAS_TOKEN || '';
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
let blobServiceClient = null;
let containerClient = null;
const getBlobServiceClient = () => {
    if (!blobServiceClient) {
        blobServiceClient = new storage_blob_1.BlobServiceClient(`https://${storageAccountName}.blob.core.windows.net?${sasToken}`);
    }
    return blobServiceClient;
};
exports.getBlobServiceClient = getBlobServiceClient;
const getContainerClient = async () => {
    if (!containerClient) {
        const serviceClient = (0, exports.getBlobServiceClient)();
        containerClient = serviceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists(); // ✅ PRIVATE
    }
    return containerClient;
};
exports.getContainerClient = getContainerClient;
// UPLOAD PHOTO
const uploadPhoto = async (fileName, data, contentType) => {
    const container = await (0, exports.getContainerClient)();
    const blobName = fileName + Date.now();
    const blockBlobClient = container.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(data, {
        blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlobClient.url;
};
exports.uploadPhoto = uploadPhoto;
// DELETE PHOTO
const deletePhoto = async (fileName) => {
    const container = await (0, exports.getContainerClient)();
    const blobClient = container.getBlockBlobClient(fileName);
    await blobClient.deleteIfExists();
};
exports.deletePhoto = deletePhoto;
const generateSasUrl = async (fileName, expiresInMinutes = 60) => {
    const container = await (0, exports.getContainerClient)();
    const blobClient = container.getBlockBlobClient(fileName);
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    if (!accountKey)
        throw new Error("AZURE_STORAGE_ACCOUNT_KEY not set");
    const credential = new storage_blob_2.StorageSharedKeyCredential(storageAccountName, accountKey);
    const sasToken = (0, storage_blob_2.generateBlobSASQueryParameters)({
        containerName: containerName,
        blobName: fileName,
        permissions: storage_blob_2.BlobSASPermissions.parse("r"), // read-only
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    }, credential).toString();
    return `${blobClient.url}?${sasToken}`;
};
exports.generateSasUrl = generateSasUrl;
//# sourceMappingURL=storage.js.map