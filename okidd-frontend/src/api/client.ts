import axios from 'axios'

const BASE_URL = 'https://claude-git-test-production.up.railway.app'

const client = axios.create({ baseURL: BASE_URL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/okidd-frontend/login'
    }
    return Promise.reject(err)
  }
)

export default client

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || err.response?.data?.message || err.message
  }
  return 'خطای ناشناخته'
}
