import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const { token } = await login(data)
      setToken(token)
      navigate('/faktury')
    } catch {
      setError('root', { message: 'Neplatné přihlašovací údaje' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Přihlášení</h1>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input {...register('email')} type="email" className="w-full border rounded px-3 py-2 text-sm" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Heslo</label>
          <input {...register('password')} type="password" className="w-full border rounded px-3 py-2 text-sm" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        {errors.root && <p className="text-red-500 text-sm">{errors.root.message}</p>}
        <button disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          Přihlásit
        </button>
        <p className="text-sm text-center">
          Nemáte účet? <Link to="/register" className="text-blue-600 hover:underline">Registrace</Link>
        </p>
      </form>
    </div>
  )
}
