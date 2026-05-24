import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Minimálně 6 znaků'),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const { token } = await apiRegister(data)
      setToken(token)
      navigate('/faktury')
    } catch {
      setError('root', { message: 'Registrace se nezdařila. Email může být obsazený.' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-8 rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold dark:text-gray-100">Registrace</h1>
        <div>
          <label className="block text-sm mb-1 dark:text-gray-300">Email</label>
          <input {...register('email')} type="email" className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1 dark:text-gray-300">Heslo</label>
          <input {...register('password')} type="password" className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2 text-sm" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        {errors.root && <p className="text-red-500 text-sm">{errors.root.message}</p>}
        <button disabled={isSubmitting} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
          Registrovat
        </button>
        <p className="text-sm text-center dark:text-gray-300">
          Máte účet? <Link to="/login" className="text-blue-400 hover:underline">Přihlásit</Link>
        </p>
      </form>
    </div>
  )
}
