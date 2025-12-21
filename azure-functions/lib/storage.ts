import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';

const containerName = process.env.AZURE_CONTAINER_NAME || 'photos';
const sasToken = process.env.AZURE_BLOB_SAS_TOKEN || '';
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

export const getBlobServiceClient = (): BlobServiceClient => {
  if (!blobServiceClient) {
    blobServiceClient = new BlobServiceClient(`https://${storageAccountName}.blob.core.windows.net?${sasToken}`);
  }
  return blobServiceClient;
};

export const getContainerClient = async (): Promise<ContainerClient> => {
  if (!containerClient) {
    const serviceClient = getBlobServiceClient();
    containerClient = serviceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists(); // ✅ PRIVATE
  }
  return containerClient;
};

// UPLOAD PHOTO
export const uploadPhoto = async (
  fileName: string,
  data: Buffer,
  contentType: string
): Promise<string> => {
  const container = await getContainerClient();
  const blobName = fileName + Date.now();
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  await blockBlobClient.uploadData(data, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
  
  return blockBlobClient.url;
};

// DELETE PHOTO
export const deletePhoto = async (fileName: string): Promise<void> => {
  const container = await getContainerClient();
  const blobClient = container.getBlockBlobClient(fileName);
  await blobClient.deleteIfExists();
};


export const generateSasUrl = async (
  fileName: string,
  expiresInMinutes: number = 60
): Promise<string> => {
  const container = await getContainerClient();
  const blobClient = container.getBlockBlobClient(fileName);

  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (!accountKey) throw new Error("AZURE_STORAGE_ACCOUNT_KEY not set");

  const credential = new StorageSharedKeyCredential(storageAccountName, accountKey);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: containerName,
      blobName: fileName,
      permissions: BlobSASPermissions.parse("r"), // read-only
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    },
    credential
  ).toString();

  return `${blobClient.url}?${sasToken}`;
};