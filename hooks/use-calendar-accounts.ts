"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import type { CalendarAccount } from "@/lib/db/models/calendar-account"

export function useCalendarAccounts() {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar cuentas de calendario (incluyendo compartidas)
  const loadAccounts = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Cargando cuentas de calendario...")
      const response = await fetch("/api/calendar-accounts/shared")

      if (!response.ok) {
        throw new Error("Error al cargar las cuentas de calendario")
      }

      const data = await response.json()
      console.log("📊 Cuentas recibidas:", data.accounts)

      setAccounts(data.accounts || [])

      // Debug logging
      const ownAccounts = (data.accounts || []).filter((acc: any) => acc.isOwn)
      const sharedAccounts = (data.accounts || []).filter((acc: any) => !acc.isOwn)

      console.log(`✅ Cuentas cargadas: ${data.accounts?.length || 0} total`)
      console.log(`   - Propias: ${ownAccounts.length}`)
      console.log(`   - Compartidas: ${sharedAccounts.length}`)

      if (sharedAccounts.length > 0) {
        console.log("📋 Cuentas compartidas:")
        sharedAccounts.forEach((acc: any, index: number) => {
          console.log(`   ${index + 1}. ${acc.email} (${acc.provider}) - Propietario: ${acc.ownerEmail}`)
        })
      }
    } catch (error) {
      console.error("❌ Error al cargar cuentas de calendario:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")

      toast({
        title: "Error",
        description: "No se pudieron cargar las cuentas de calendario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Añadir o actualizar una cuenta de calendario
  const addOrUpdateAccount = async (account: CalendarAccount): Promise<boolean> => {
    try {
      const response = await fetch("/api/calendar-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar la cuenta de calendario")
      }

      const data = await response.json()
      setAccounts(data.accounts)

      toast({
        title: "Cuenta guardada",
        description: "La cuenta de calendario se ha guardado correctamente",
      })

      return true
    } catch (error) {
      console.error("Error al guardar cuenta de calendario:", error)

      toast({
        title: "Error",
        description: "No se pudo guardar la cuenta de calendario",
        variant: "destructive",
      })

      return false
    }
  }

  // Eliminar una cuenta de calendario
  const removeAccount = async (accountId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/calendar-accounts/${accountId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar la cuenta de calendario")
      }

      const data = await response.json()
      setAccounts(data.accounts)

      toast({
        title: "Cuenta eliminada",
        description: "La cuenta de calendario se ha eliminado correctamente",
      })

      return true
    } catch (error) {
      console.error("Error al eliminar cuenta de calendario:", error)

      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta de calendario",
        variant: "destructive",
      })

      return false
    }
  }

  // Cargar cuentas al montar el componente
  useEffect(() => {
    loadAccounts()
  }, [])

  return {
    accounts,
    loading,
    error,
    loadAccounts,
    addOrUpdateAccount,
    removeAccount,
  }
}
