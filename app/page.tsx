"use client"

import { ClientCalendarApp } from "@/components/client-calendar-app"
import { OAuthDebug } from "@/components/oauth-debug"
import { GoogleAuthTest } from "@/components/google-auth-test"

export default function HomePage() {
  return (
    <>
      <ClientCalendarApp />
      <OAuthDebug />
      <GoogleAuthTest />
    </>
  )
}
