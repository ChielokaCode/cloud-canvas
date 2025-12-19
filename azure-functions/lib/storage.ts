import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'photos';

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

export const getBlobServiceClient = (): BlobServiceClient => {
  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }
  return blobServiceClient;
};

export const getContainerClient = async (): Promise<ContainerClient> => {
  if (!containerClient) {
    const serviceClient = getBlobServiceClient();
    containerClient = serviceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: 'blob' });
  }
  return containerClient;
};

export const uploadPhoto = async (
  fileName: string,
  data: Buffer,
  contentType: string
): Promise<string> => {
  const container = await getContainerClient();
  const blobClient = container.getBlockBlobClient(fileName);
  
  await blobClient.uploadData(data, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
  
  return blobClient.url;
};

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
  
  // For public containers, just return the URL
  return blobClient.url;
};
