import { MongoClient } from "mongodb"

/**
 * Singleton Mongo client so we don’t open a new connection on every request.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI
if (!uri) throw new Error("Missing MONGODB_URI environment variable")

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri)
  clientPromise = client.connect()
}

/**
 * `db` resolves to the default database for the connection string.
 *     const users = (await db).collection("users")
 */
export const db = clientPromise.then((c) => c.db())

export { clientPromise as client }
