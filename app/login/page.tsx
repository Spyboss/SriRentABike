import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage({ searchParams }: { searchParams?: { redirect?: string } }) {
  const redirectTo = searchParams?.redirect
  return (
    <div className="mx-auto max-w-md py-10">
      <LoginForm redirectTo={redirectTo} />
    </div>
  )
}