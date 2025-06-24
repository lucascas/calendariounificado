import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || ""

// Variable para rastrear el estado de la conexión
let cachedConnection: typeof mongoose | null = null

export async function connectToDatabase() {
  if (cachedConnection) {
    console.log("=> Using existing database connection")
    return cachedConnection
  }

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable")
  }

  try {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout después de 5 segundos
      maxPoolSize: 10, // Mantener hasta 10 conexiones
    }

    const connection = await mongoose.connect(MONGODB_URI, opts)
    cachedConnection = connection
    console.log("=> Connected to MongoDB")
    return connection
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)
    throw error
  }
}

// Desconectar de la base de datos (útil para pruebas)
export async function disconnectFromDatabase() {
  if (!cachedConnection) {
    return
  }

  try {
    await mongoose.disconnect()
    cachedConnection = null
    console.log("=> Disconnected from MongoDB")
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error)
    throw error
  }
}
