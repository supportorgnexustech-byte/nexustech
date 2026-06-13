import React, { createContext, useContext, useState } from "react";
import { useLogin, useLogout, setAuthTokenGetter, User } from "@workspace/api-client-react";

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("nexus_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("nexus_token");
  });
  const [isLoading, setIsLoading] = useState(false);

  // Wire the token getter so every API call includes the Bearer header
  React.useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("nexus_token"));
    return () => setAuthTokenGetter(null);
  }, []);

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await loginMutation.mutateAsync({ data: { email, password } });
      setCurrentUser(data.user);
      setToken(data.token);
      localStorage.setItem("nexus_user", JSON.stringify(data.user));
      localStorage.setItem("nexus_token", data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      logoutMutation.mutate({});
    } catch (e) {
      console.error("Logout error", e);
    }
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("nexus_user");
    localStorage.removeItem("nexus_token");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser && !!token,
        token,
        login,
        logout: handleLogout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
