"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadDebugInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/user-relations")
      const data = await response.json()
      setDebugInfo(data)
      console.log("Debug info:", data)
    } catch (error) {
      console.error("Error loading debug info:", error)
    } finally {
      setLoading(false)
    }
  }

  const fixRelations = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/fix-relations", { method: "POST" })
      const data = await response.json()
      console.log("Fix result:", data)
      // Recargar debug info
      await loadDebugInfo()
    } catch (error) {
      console.error("Error fixing relations:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Panel de Debug - Relaciones de Usuario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={loadDebugInfo} disabled={loading}>
            {loading ? "Cargando..." : "Cargar Info Debug"}
          </Button>
          <Button onClick={fixRelations} disabled={loading} variant="destructive">
            {loading ? "Arreglando..." : "Arreglar Relaciones"}
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Usuario Actual:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.currentUser, null, 2)}
              </pre>
            </div>

            {debugInfo.invitedByUser && (
              <div>
                <h3 className="font-semibold">Invitado Por:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.invitedByUser, null, 2)}
                </pre>
              </div>
            )}

            {debugInfo.usersInvitedByMe.length > 0 && (
              <div>
                <h3 className="font-semibold">Usuarios que he invitado:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.usersInvitedByMe, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <h3 className="font-semibold">Todos los Usuarios:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
                {JSON.stringify(debugInfo.allUsers, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">Invitaciones:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-60">
                {JSON.stringify(debugInfo.invitations, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
