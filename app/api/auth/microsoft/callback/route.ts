import { authConfig } from "@/lib/auth-config"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { microsoft } from "@/lib/auth"
import { UserService } from "@/lib/db/services/user-service"

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const storedState = cookies().get("microsoft_oauth_state")?.value ?? null

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 })
  }

  try {
    const tokens = await microsoft.validateAuthorizationCode(code)
    const microsoftUserResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    })
    const microsoftUser: MicrosoftUser = await microsoftUserResponse.json()

    if (!microsoftUser.mail) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 })
    }

    const userService = new UserService()
    let user = await userService.getByEmail(microsoftUser.mail)

    if (!user) {
      user = await userService.createUser({
        email: microsoftUser.mail,
        name: microsoftUser.displayName,
        firstName: microsoftUser.givenName,
        lastName: microsoftUser.surname,
        profileImageUrl: "",
      })
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    const session = await authConfig.auth.createSession(user.id, {})

    cookies().set("auth_session", session.id, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      expires: session.expiration,
    })

    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("OAUTH ERROR", error)
    return NextResponse.json({ error: "OAUTH ERROR" }, { status: 500 })
  }
}

interface MicrosoftUser {
  displayName: string
  givenName: string
  surname: string
  mail: string
  id: string
}
