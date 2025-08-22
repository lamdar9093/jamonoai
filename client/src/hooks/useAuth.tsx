import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface User {
  id: number;
  name: string;
  email: string;
  tenantId?: number;
  role?: string;
  permissions?: any;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem("auth_token")
  );
  const queryClient = useQueryClient();

  // Query pour récupérer les informations utilisateur
  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  // Mise à jour du user quand les données arrivent
  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (!isLoading && token) {
      // Token invalide, on le supprime
      setToken(null);
      localStorage.removeItem("auth_token");
    }
  }, [userData, isLoading, token]);

  // Fonction de login
  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("auth_token", authToken);
    
    // Invalider le cache pour forcer le refetch
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  };

  // Fonction de logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    
    // Clear all cached queries
    queryClient.clear();
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    refetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}