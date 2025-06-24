import type { WithId, Document } from "mongodb"
import { db } from "@/lib/db"

export interface User {
  _id?: unknown
  email: string
  name?: string
  createdAt: Date
}

/**
 * Finds a user by e-mail; if it doesn’t exist, creates it.
 */
export async function getOrCreateUser(email: string, name?: string): Promise<WithId<Document> & User> {
  const database = await db
  const users = database.collection<User>("users")

  const existing = await users.findOne({ email })
  if (existing) return existing as unknown as WithId<Document> & User

  const newUser: User = { email, name, createdAt: new Date() }
  const { insertedId } = await users.insertOne(newUser)

  return { ...newUser, _id: insertedId } as unknown as WithId<Document> & User
}
