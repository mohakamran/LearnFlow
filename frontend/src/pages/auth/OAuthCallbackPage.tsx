import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { useAuth } from '@/contexts/AuthContext'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem('token', token)
      refreshUser().then(() => navigate('/dashboard'))
    } else {
      navigate('/login?error=oauth_failed')
    }
  }, [])

  return <LoadingScreen />
}
