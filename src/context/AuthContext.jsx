import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Configure axios interceptor
const api = axios.create()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user && !!token

  // Set up axios interceptor
  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`
      }
      return config
    })
    return () => api.interceptors.request.eject(interceptor)
  }, [])

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        setLoading(false)
        return
      }
      try {
        const res = await api.get('/api/auth/me')
        setUser(res.data.user)
        setToken(storedToken)
      } catch {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    validateToken()
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { token: newToken, user: userData } = res.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (name, email, password, role) => {
    const res = await api.post('/api/auth/register', { name, email, password, role })
    const { token: newToken, user: userData } = res.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { api }
export default AuthContext
