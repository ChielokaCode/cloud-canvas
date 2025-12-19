import { Configuration, LogLevel } from '@azure/msal-browser';

// Azure AD B2C Configuration
// These values should come from your .env file
const b2cTenant = import.meta.env.VITE_AZURE_AD_B2C_TENANT || 'your-tenant.onmicrosoft.com';
const clientId = import.meta.env.VITE_AZURE_AD_B2C_CLIENT_ID || '';
const signInPolicy = import.meta.env.VITE_AZURE_AD_B2C_POLICY_SIGNIN || 'B2C_1_signupsignin';
const redirectUri = import.meta.env.VITE_AZURE_AD_B2C_REDIRECT_URI || window.location.origin;

// B2C authority URLs
const b2cPolicies = {
  names: {
    signUpSignIn: signInPolicy,
  },
  authorities: {
    signUpSignIn: {
      authority: `https://${b2cTenant.split('.')[0]}.b2clogin.com/${b2cTenant}/${signInPolicy}`,
    },
  },
  authorityDomain: `${b2cTenant.split('.')[0]}.b2clogin.com`,
};

// MSAL Configuration
export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: b2cPolicies.authorities.signUpSignIn.authority,
    knownAuthorities: [b2cPolicies.authorityDomain],
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
  scopes: ['openid', 'profile', 'offline_access'],
};

// API scopes (add your Azure Function/API scopes here)
export const apiConfig = {
  scopes: [`https://${b2cTenant}/api/read`, `https://${b2cTenant}/api/write`],
  uri: import.meta.env.VITE_AZURE_API_ENDPOINT || '',
};

export { b2cPolicies };
