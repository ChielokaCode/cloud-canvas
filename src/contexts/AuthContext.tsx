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
  loginWithRole: (role: UserRole) => Promise<void>;
  loginWithUser: (user: User) => void;
  // logoutLocal: () => void;
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

 const getAccessToken = () => {
  return localStorage.getItem("token");
};
  // Convert MSAL account to our User type
  const mapAccountToUser = useCallback(async (account: AccountInfo): Promise<User> => {
    const userId = account.localAccountId || account.homeAccountId;
    
    // Try to get role from Azure backend
    let role: string = 'consumer';
    try {
      if (isAzureConfigured()) {
        const token = getAccessToken();
        if (token) {
          role = await userService.getUserRole();
        }
      }
    } catch (error) {
      console.warn('Could not fetch user role, defaulting to consumer');
    }

    // Check claims for role (if set in Azure AD B2C)
   const claims = account.idTokenClaims as any;

if (claims?.roles?.includes('creator')) {
  role = 'creator';
} else {
  role = 'consumer';
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

 


  // Initialize auth state from MSAL
  useEffect(() => {
  if (inProgress !== InteractionStatus.None) return;

  if (!accounts.length) {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    return;
  }

  const account = accounts[0];
  const pendingRole = localStorage.getItem("pendingRole") as UserRole | null;
  console.log("Pending role from localStorage:", pendingRole);

  (async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    const user = await mapAccountToUser(account);

    setAuthState({
      user: pendingRole ? { ...user, role: pendingRole } : user,
      isAuthenticated: true,
      isLoading: false,
    });

    // if (pendingRole) {
    //   localStorage.removeItem("pendingRole");
    // }
  })();
}, [accounts, inProgress, mapAccountToUser]);


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

  const loginWithUser = useCallback((user: User) => {
  setAuthState({
    user,
    isAuthenticated: true,
    isLoading: false,
  });
}, []);


  // Logout
  // const logout = useCallback(() => {
  //   if (isAzureConfigured() && account) {
  //     instance.logoutRedirect({
  //       account,
  //     });
  //   } else {
  //     setAuthState({
  //       user: null,
  //       isAuthenticated: false,
  //       isLoading: false,
  //     });
  //   }
  // }, [instance, account]);

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


//   const logoutLocal = useCallback(() => {
//   // Clear persisted auth
//   localStorage.removeItem("token");
//   localStorage.removeItem("userId");
//   localStorage.removeItem("userName");
//   localStorage.removeItem("userRole");
//   localStorage.removeItem("pendingRole");

//   setAuthState({
//     user: null,
//     isAuthenticated: false,
//     isLoading: false,
//   });
// }, []);

const logout = useCallback(() => {
  // Always clear local auth first (safe for both cases)
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  localStorage.removeItem("pendingRole");

  // If Azure AD user, let MSAL handle the redirect
  if (isAzureConfigured() && account) {
    instance.logoutRedirect({
      account,
    });
    return; // MSAL redirect takes over
  }

  // Local/JWT user fallback
  setAuthState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
}, [instance, account]);



const loginWithRole = useCallback(
  async (role: UserRole) => {
    try {
      // Persist role before redirect
      localStorage.setItem("pendingRole", role);

      // Trigger Microsoft login (redirect stops execution)
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
    }
  },
  [instance]
);



  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        loginAsRole,
        loginWithRole,
        loginWithUser,
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

