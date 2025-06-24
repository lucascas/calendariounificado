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
      const response = await fetch("/api/debug/database-state")
      const data = await response.json()
      setDebugInfo(data)
      console.log("Debug info:", data)
    } catch (error) {
      console.error("Error cargando debug info:", error)
    } finally {
      setLoading(false)
    }
  }

  const forceFixRelations = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/force-fix", { method: "POST" })
      const data = await response.json()
      console.log("Force fix result:", data)
      alert(data.message || "Operación completada")
      // Recargar info después del arreglo
      await loadDebugInfo()
    } catch (error) {
      console.error("Error forzando arreglo:", error)
      alert("Error al forzar arreglo")
    } finally {
      setLoading(false)
    }
  }

  const testSharedAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/calendar-accounts/shared")
      const data = await response.json()
      console.log("Shared accounts test:", data)
      alert(`Cuentas cargadas: ${data.accounts?.length || 0}`)
    } catch (error) {
      console.error("Error probando cuentas compartidas:", error)
      alert("Error al probar cuentas compartidas")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Panel de Debug - Relaciones de Usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={loadDebugInfo} disabled={loading}>
              Ver Estado de BD
            </Button>
            <Button onClick={forceFixRelations} disabled={loading} variant="destructive">
              FORZAR Arreglo
            </Button>
            <Button onClick={testSharedAccounts} disabled={loading} variant="outline">
              Probar Cuentas Compartidas
            </Button>
          </div>

          {debugInfo && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold">Usuarios:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.users, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-bold">Invitaciones:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.invitations, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
