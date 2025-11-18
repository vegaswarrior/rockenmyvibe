"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  const handleClick = async () => {
    try {
      await signOut({ callbackUrl: '/sign-in' })
      // Optionally refresh client state
      router.refresh()
    } catch (error) {
      console.error('Sign out failed', error)
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant='ghost'
      className='w-full py-4 px-2 h-4 justify-start'
    >
      Sign Out
    </Button>
  )
}
