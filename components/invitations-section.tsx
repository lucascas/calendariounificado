"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2, RefreshCw, Mail, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Invitation {
  _id: string
  email: string
  status: "pending" | "accepted" | "expired"
  createdAt: string
  expiresAt: string
  acceptedAt?: string
}

export function InvitationsSection() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadInvitations = async () => {
    try {
      setError(null)
      const response = await fetch("/api/invitations")

      if (!response.ok) {
        throw new Error("Error al cargar las invitaciones")
      }

      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error("Error al cargar invitaciones:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
      toast({
        title: "Error",
        description: "No se pudieron cargar las invitaciones.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const deleteInvitation = async (invitationId: string, email: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar la invitación")
      }

      // Actualizar la lista local
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId))

      toast({
        title: "Invitación eliminada",
        description: `La invitación para ${email} ha sido eliminada.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error al eliminar invitación:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la invitación.",
        variant: "destructive",
      })
    }
  }

  const refreshInvitations = () => {
    setIsRefreshing(true)
    loadInvitations()
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date()

    if (status === "accepted") {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aceptada
        </Badge>
      )
    }

    if (status === "expired" || isExpired) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Expirada
        </Badge>
      )
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    )
  }

  const getStatusIcon = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date()

    if (status === "accepted") {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }

    if (status === "expired" || isExpired) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }

    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const pendingInvitations = invitations.filter((inv) => {
    const isExpired = new Date(inv.expiresAt) < new Date()
    return inv.status === "pending" && !isExpired
  })

  const acceptedInvitations = invitations.filter((inv) => inv.status === "accepted")

  const expiredInvitations = invitations.filter((inv) => {
    const isExpired = new Date(inv.expiresAt) < new Date()
    return inv.status === "expired" || isExpired
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitaciones
          </CardTitle>
          <CardDescription>Gestiona las invitaciones que has enviado</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={refreshInvitations} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : invitations.length === 0 ? (
          <div className="text-center py-6">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No has enviado ninguna invitación aún</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{pendingInvitations.length}</div>
                <div className="text-sm text-muted-foreground">Pendientes</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{acceptedInvitations.length}</div>
                <div className="text-sm text-muted-foreground">Aceptadas</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{expiredInvitations.length}</div>
                <div className="text-sm text-muted-foreground">Expiradas</div>
              </div>
            </div>

            {/* Tabla de invitaciones */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Enviada</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead>Aceptada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invitation.status, invitation.expiresAt)}
                          {invitation.email}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invitation.status, invitation.expiresAt)}</TableCell>
                      <TableCell>
                        {format(new Date(invitation.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>{format(new Date(invitation.expiresAt), "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell>
                        {invitation.acceptedAt
                          ? format(new Date(invitation.acceptedAt), "dd/MM/yyyy HH:mm", { locale: es })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar invitación?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente la invitación para{" "}
                                <strong>{invitation.email}</strong>. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteInvitation(invitation._id, invitation.email)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
