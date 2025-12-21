import { Configuration, LogLevel } from '@azure/msal-browser';

// Azure AD B2C Configuration
// These values should come from your .env file
// const tenantId = import.meta.env.VITE_AZURE_AD_TENANT || '';
// const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID || '';
const clientId = '5c90d1bc-43ce-4737-ba5e-659583441194';
const tenantId = '87902317-6752-4f33-8bfc-1f73e9287d66';
//const signInPolicy = import.meta.env.VITE_AZURE_AD_B2C_POLICY_SIGNIN || 'B2C_1_signupsignin';
const redirectUri = 'http://localhost:8080';

// B2C authority URLs
// const b2cPolicies = {
//   names: {
//     signUpSignIn: signInPolicy,
//   },
//   authorities: {
//     signUpSignIn: {
//       authority: `https://${b2cTenant.split('.')[0]}.b2clogin.com/${b2cTenant}/${signInPolicy}`,
//     },
//   },
//   authorityDomain: `${b2cTenant.split('.')[0]}.b2clogin.com`,
// };

// MSAL Configuration
export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    // knownAuthorities: [b2cPolicies.authorityDomain],
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

// Scopes for API access
export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
};


// API scopes (add your Azure Function/API scopes here)
export const apiConfig = {
  scopes: [`https://${tenantId}/api/read`, `https://${tenantId}/api/write`],
  uri: import.meta.env.VITE_AZURE_API_ENDPOINT || '',
};
