import { useCustomContext } from '@hooks';
import { createContext, type PropsWithChildren } from 'react';
import { useAuthLogic, type UseAuthLogicContent } from './useAuthLogic';

export type AuthContextValue = UseAuthLogicContent;

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const useAuthLogicContent = useAuthLogic();

  return <AuthContext.Provider value={useAuthLogicContent}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useCustomContext({ context: AuthContext, contextName: 'AuthContext' });
