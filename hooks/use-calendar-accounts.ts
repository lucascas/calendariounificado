"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import type { CalendarAccount } from "@/lib/db/models/calendar-account"

export function useCalendarAccounts() {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar cuentas de calendario
  const loadAccounts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/calendar-accounts")

      if (!response.ok) {
        throw new Error("Error al cargar las cuentas de calendario")
      }

      const data = await response.json()
      setAccounts(data.accounts)
    } catch (error) {
      console.error("Error al cargar cuentas de calendario:", error)
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
