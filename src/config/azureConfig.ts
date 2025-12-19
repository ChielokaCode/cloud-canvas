// Azure API Service Configuration
// This file contains the base configuration for Azure backend services

const AZURE_API_BASE = import.meta.env.VITE_AZURE_API_ENDPOINT || '/api';
const AZURE_STORAGE_ACCOUNT = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT || '';
const AZURE_STORAGE_CONTAINER = import.meta.env.VITE_AZURE_STORAGE_CONTAINER || 'photos';
const AZURE_STORAGE_SAS = import.meta.env.VITE_AZURE_STORAGE_SAS_TOKEN || '';

export const azureConfig = {
  api: {
    baseUrl: AZURE_API_BASE,
    endpoints: {
      photos: `${AZURE_API_BASE}/photos`,
      users: `${AZURE_API_BASE}/users`,
      comments: `${AZURE_API_BASE}/comments`,
      likes: `${AZURE_API_BASE}/likes`,
    },
  },
  storage: {
    account: AZURE_STORAGE_ACCOUNT,
    container: AZURE_STORAGE_CONTAINER,
    sasToken: AZURE_STORAGE_SAS,
    getBlobUrl: (blobName: string) => {
      if (!AZURE_STORAGE_ACCOUNT) return '';
      return `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${AZURE_STORAGE_CONTAINER}/${blobName}${AZURE_STORAGE_SAS ? `?${AZURE_STORAGE_SAS}` : ''}`;
    },
  },
};

// Check if Azure services are configured
export const isAzureConfigured = () => {
  return !!(
    import.meta.env.VITE_AZURE_API_ENDPOINT &&
    import.meta.env.VITE_AZURE_AD_B2C_CLIENT_ID
  );
};
