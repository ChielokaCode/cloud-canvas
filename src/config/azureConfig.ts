// Azure API Service Configuration
// This file contains the base configuration for Azure backend services

//const AZURE_API_BASE = import.meta.env.VITE_AZURE_API_ENDPOINT || '/api';
// const AZURE_STORAGE_ACCOUNT = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT;
// const AZURE_STORAGE_CONTAINER = import.meta.env.VITE_AZURE_STORAGE_CONTAINER;
// const AZURE_STORAGE_SAS = import.meta.env.VITE_AZURE_STORAGE_SAS_TOKEN;
const AZURE_AD_CLIENT_ID = import.meta.env.VITE_AZURE_AD_CLIENT_ID || '';
const AZURE_AD_TENANT = import.meta.env.VITE_AZURE_AD_TENANT || '';
const AZURE_AD_REDIRECT_URI = window.location.origin;


export const API_BASE_URL ='https://luminabackendfunctions.azurewebsites.net/api';

export const azureConfig = {
  api: {
    baseUrl: API_BASE_URL,
    endpoints: {
      getPhotos: `${API_BASE_URL}/get-photos`,
      getPhoto: `${API_BASE_URL}/get-photo`,
      createPhoto: `${API_BASE_URL}/create-photo`,
      deletePhotoHandler: `${API_BASE_URL}/delete-photo`,
      getComments: `${API_BASE_URL}/get-comments`,
      createComment: `${API_BASE_URL}/create-comment`,
      deleteComment: `${API_BASE_URL}/delete-comment`,
      getUserLikedPhotos: `${API_BASE_URL}/get-user-liked-photos`,
      likePhoto: `${API_BASE_URL}/like-photo`,
      unlikePhoto: `${API_BASE_URL}/unlike-photo`,
      getLikes: `${API_BASE_URL}/get-likes`,
      signIn: `${API_BASE_URL}/signin`,
      SignUpConsumer: `${API_BASE_URL}/signup-consumer`,
      signUpCreator: `${API_BASE_URL}/signup-creator`,
    },
  },
  // storage: {
  //   account: AZURE_STORAGE_ACCOUNT,
  //   container: AZURE_STORAGE_CONTAINER,
  //   sasToken: AZURE_STORAGE_SAS,
  //   getBlobUrl: (blobName: string) => {
  //     if (!AZURE_STORAGE_ACCOUNT) return '';
  //     return `https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${AZURE_STORAGE_CONTAINER}/${blobName}${AZURE_STORAGE_SAS ? `?${AZURE_STORAGE_SAS}` : ''}`;
  //   },
  // },
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

