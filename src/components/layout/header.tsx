'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="flex justify-between items-center p-4 border-b">
      <Link href="/">
        <h1 className="text-2xl font-bold">TubeInsight</h1>
      </Link>
      {session && (
        <Button onClick={() => signOut()}>Sign out</Button>
      )}
    </header>
  )
}
