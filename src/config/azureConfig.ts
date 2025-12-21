// Azure API Service Configuration
// This file contains the base configuration for Azure backend services


const AZURE_API_BASE = import.meta.env.VITE_AZURE_API_ENDPOINT || '/api';
const AZURE_STORAGE_ACCOUNT = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT || '';
const AZURE_STORAGE_CONTAINER = import.meta.env.VITE_AZURE_STORAGE_CONTAINER || 'photos';
const AZURE_STORAGE_SAS = import.meta.env.VITE_AZURE_STORAGE_SAS_TOKEN || '';
const AZURE_AD_CLIENT_ID = '5c90d1bc-43ce-4737-ba5e-659583441194';
const AZURE_AD_TENANT = '87902317-6752-4f33-8bfc-1f73e9287d66';
const AZURE_AD_REDIRECT_URI = 'http://localhost:8080';

export const azureConfig = {
  api: {
    baseUrl: AZURE_API_BASE,
    endpoints: {
      getPhotos: `${AZURE_API_BASE}/api/get-photos`,
      getPhoto: `${AZURE_API_BASE}/api/get-photo`,
      createPhoto: `${AZURE_API_BASE}/api/create-photo`,
      deletePhotoHandler: `${AZURE_API_BASE}/api/delete-photo`,
      getComments: `${AZURE_API_BASE}/api/get-comments`,
      createComment: `${AZURE_API_BASE}/api/create-comment`,
      deleteComment: `${AZURE_API_BASE}/api/delete-comment`,
      getUserLikedPhotos: `${AZURE_API_BASE}/api/get-user-liked-photos`,
      likePhoto: `${AZURE_API_BASE}/api/like-photo`,
      unlikePhoto: `${AZURE_API_BASE}/api/unlike-photo`,
      getLikes: `${AZURE_API_BASE}/api/get-likes`,
      signIn: `${AZURE_API_BASE}/api/signin`,
      SignUpConsumer: `${AZURE_API_BASE}/api/signup-consumer`,
      signUpCreator: `${AZURE_API_BASE}/api/signup-creator`,
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
    //import.meta.env.VITE_AZURE_API_ENDPOINT &&
    AZURE_AD_CLIENT_ID &&
    AZURE_AD_TENANT &&
    AZURE_AD_REDIRECT_URI
  );
};
