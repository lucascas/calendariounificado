"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadDebugInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug/user-relations")
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
      } else {
        throw new Error("Error al cargar información de debug")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información de debug",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const manualFix = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug/manual-fix", { method: "POST" })
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Éxito",
          description: "Relaciones arregladas manualmente",
          variant: "default",
        })
        console.log("Resultado del arreglo:", data)
        // Recargar info
        await loadDebugInfo()
      } else {
        throw new Error("Error al arreglar relaciones")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron arreglar las relaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testSharedAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/calendar-accounts/shared")
      if (response.ok) {
        const data = await response.json()
        console.log("🧪 Test de cuentas compartidas:", data)
        toast({
          title: "Test completado",
          description: `Se encontraron ${data.accounts?.length || 0} cuentas. Ver consola para detalles.`,
          variant: "default",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error en test de cuentas compartidas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Panel de Debug</CardTitle>
        <CardDescription>Herramientas para diagnosticar y arreglar problemas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={loadDebugInfo} disabled={loading}>
            Cargar Info Debug
          </Button>
          <Button onClick={manualFix} disabled={loading} variant="destructive">
            ARREGLO MANUAL
          </Button>
          <Button onClick={testSharedAccounts} disabled={loading} variant="outline">
            Test Cuentas Compartidas
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Usuario Actual:</h3>
              <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.currentUser, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Todos los Usuarios:</h3>
              <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.allUsers, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Invitaciones:</h3>
              <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.invitations, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
