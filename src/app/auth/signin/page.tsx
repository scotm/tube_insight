'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">TubeInsight</h1>
      <Button onClick={() => signIn('google')}>Sign in with Google</Button>
    </div>
  )
}
