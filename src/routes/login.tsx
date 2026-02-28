import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { FileText, Loader2, Eye, EyeOff, Shield, Clock, Users } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '#/lib/auth'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const loginSchema = z.object({
  pegawai_nip: z.string().min(1, 'NIP wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated) {
    navigate({ to: '/' })
  }

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { pegawai_nip: '', password: '' },
  })

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values)
      toast.success('Login berhasil')
      navigate({ to: '/' })
    } catch (error: any) {
      const message = error?.response?.data?.message || 'NIP atau password salah'
      toast.error(message)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel - hidden on mobile */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 text-white">
        {/* Decorative background circles */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 h-[30rem] w-[30rem] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15 shadow-2xl backdrop-blur-sm ring-1 ring-white/20">
            <FileText className="h-12 w-12 text-white" />
          </div>

          <h1 className="mb-2 text-4xl font-bold tracking-tight">E-Cuti</h1>
          <p className="mb-1 text-lg font-medium text-blue-100">Sistem Manajemen Cuti Elektronik</p>
          <p className="mb-10 text-sm text-blue-200">Pemerintah Kabupaten Tabalong</p>

          {/* Feature highlights */}
          <div className="mt-4 w-full max-w-xs space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Aman &amp; Terpercaya</p>
                <p className="text-xs text-blue-200">Data cuti terlindungi</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Proses Cepat</p>
                <p className="text-xs text-blue-200">Pengajuan cuti real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Mudah Dikelola</p>
                <p className="text-xs text-blue-200">Manajemen pegawai terpadu</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">
          {/* Mobile logo - only shown on mobile */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">E-Cuti</h1>
            <p className="text-sm text-muted-foreground">Sistem Manajemen Cuti Elektronik</p>
            <p className="text-xs text-muted-foreground">Kabupaten Tabalong</p>
          </div>

          {/* Form card area */}
          <div className="w-full max-w-sm">
            {/* Heading */}
            <div className="mb-8 hidden lg:block">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Selamat Datang
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>
            <div className="mb-6 block lg:hidden">
              <h2 className="text-center text-xl font-semibold text-gray-900 dark:text-white">
                Masuk ke Akun Anda
              </h2>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="pegawai_nip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        NIP
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan NIP Anda"
                          className="h-11 transition-shadow focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Masukkan password"
                            className="h-11 pr-10 transition-shadow focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                            tabIndex={-1}
                            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="mt-2 h-11 w-full bg-blue-600 text-sm font-semibold hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Pemerintah Kabupaten Tabalong. Hak cipta dilindungi.
          </p>
        </footer>
      </div>
    </div>
  )
}
