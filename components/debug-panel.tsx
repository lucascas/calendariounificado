"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadDebugInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug/user-relations")
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error("Error cargando debug info:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información de debug",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fixRelations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug/fix-relations", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Éxito",
          description: "Relaciones arregladas correctamente",
        })
        // Recargar la información
        await loadDebugInfo()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al arreglar relaciones",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error arreglando relaciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron arreglar las relaciones",
        variant: "destructive",
      })
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
              {loading ? "Cargando..." : "Cargar Info Debug"}
            </Button>
            <Button onClick={fixRelations} disabled={loading} variant="destructive">
              {loading ? "Arreglando..." : "Arreglar Relaciones"}
            </Button>
          </div>

          {debugInfo && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Usuario Actual:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.currentUser, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Todos los Usuarios:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.allUsers, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Invitaciones:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
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
