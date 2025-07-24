'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to TubeInsight, {session?.user?.name}!</h1>
      <Button onClick={() => signOut()}>Sign out</Button>
    </div>
  )
}
