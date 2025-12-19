import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { AccountInfo, InteractionStatus } from '@azure/msal-browser';
import { User, UserRole, AuthState } from '@/types';
import { loginRequest } from '@/config/authConfig';
import { isAzureConfigured } from '@/config/azureConfig';
import { userService } from '@/services/azureApi';
import { mockUsers } from '@/services/mockData';

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  loginAsRole: (role: UserRole) => void;
  getAccessToken: () => Promise<string | null>;
  account: AccountInfo | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const account = accounts[0] || null;

  // Convert MSAL account to our User type
  const mapAccountToUser = useCallback(async (account: AccountInfo): Promise<User> => {
    const userId = account.localAccountId || account.homeAccountId;
    
    // Try to get role from Azure backend
    let role: UserRole = 'consumer';
    try {
      if (isAzureConfigured()) {
        const token = await getAccessToken();
        if (token) {
          role = await userService.getUserRole(userId, token);
        }
      }
    } catch (error) {
      console.warn('Could not fetch user role, defaulting to consumer');
    }

    // Check claims for role (if set in Azure AD B2C)
    const claims = account.idTokenClaims as Record<string, unknown> | undefined;
    if (claims?.extension_role) {
      role = claims.extension_role as UserRole;
    }

    return {
      id: userId,
      email: account.username || '',
      name: account.name || account.username || 'User',
      avatar: undefined,
      role,
      createdAt: new Date(),
    };
  }, []);

  // Get access token for API calls
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!account) return null;

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch (error) {
      // If silent token acquisition fails, try interactive
      try {
        const response = await instance.acquireTokenPopup(loginRequest);
        return response.accessToken;
      } catch (popupError) {
        console.error('Failed to acquire token:', popupError);
        return null;
      }
    }
  }, [instance, account]);

  // Initialize auth state from MSAL
  useEffect(() => {
    const initAuth = async () => {
      if (inProgress !== InteractionStatus.None) {
        return; // Wait for MSAL to finish
      }

      if (isAuthenticated && account) {
        const user = await mapAccountToUser(account);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, [isAuthenticated, account, inProgress, mapAccountToUser]);

  // Login with Azure AD B2C
  const login = useCallback(async () => {
    if (!isAzureConfigured()) {
      // If Azure is not configured, show a warning
      console.warn('Azure AD B2C is not configured. Using mock login.');
      loginAsRole('consumer');
      return;
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [instance]);

  // Logout
  const logout = useCallback(() => {
    if (isAzureConfigured() && account) {
      instance.logoutRedirect({
        account,
      });
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, [instance, account]);

  // Mock login for development (when Azure is not configured)
  const loginAsRole = useCallback((role: UserRole) => {
    const user = mockUsers.find(u => u.role === role);
    if (user) {
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        loginAsRole,
        getAccessToken,
        account,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
