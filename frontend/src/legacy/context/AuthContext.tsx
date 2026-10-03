import { createContext, useContext } from 'react'
export interface User { id: string; email: string; full_name: string; is_verified: boolean; profile_picture: string | null }
/** Migration placeholder. Legacy mock authentication has been removed. */
const unavailable = async () => { throw new Error('Use the active FinSpark Account view for authentication.') }
const AuthContext = createContext({
  user: null as User | null, token: null as string | null, isAuthenticated: false,
  isLoading: false, error: null as string | null, adminLogin: unavailable, login: unavailable,
  logout: async () => {}, clearError: () => {},
  setUser: (_user: User | null, _token?: string | null) => { throw new Error('Legacy authentication is disabled.') },
})
export const useAuth = () => useContext(AuthContext)
export const AuthProvider = ({children}: {children: React.ReactNode}) => <>{children}</>
