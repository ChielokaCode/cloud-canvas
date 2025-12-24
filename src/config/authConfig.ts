import { Configuration, LogLevel } from '@azure/msal-browser';

// Azure AD B2C Configuration

const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_AZURE_AD_TENANT || '';
const redirectUri = window.location.origin

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
