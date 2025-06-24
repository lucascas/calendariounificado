"use client"

import { useState, useEffect, useCallback } from "react"
import { format, addDays } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Utensils, Coffee, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface Meal {
  name: string
  description?: string
}

interface DayMeals {
  date: string
  dayOfWeek: string
  meals: {
    lunch?: string
    dinner?: string
  }
}

interface MealPlanDisplayProps {
  date: Date
}

export function MealPlanDisplay({ date }: MealPlanDisplayProps) {
  const [meals, setMeals] = useState<DayMeals | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos de comidas desde nuestra API proxy
  const fetchMeals = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Formatear la fecha actual y el día siguiente para la API
      const startDate = format(date, "yyyy-MM-dd")
      const endDate = format(addDays(date, 1), "yyyy-MM-dd")

      console.log(`Obteniendo comidas para el rango: ${startDate} a ${endDate}`)

      // Hacer la solicitud a nuestra API proxy
      const response = await fetch(`/api/planneat/meals?startDate=${startDate}&endDate=${endDate}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Datos recibidos de PlannEat:", data)

      // Buscar la comida para la fecha actual
      const todayMeal = data.find((meal: DayMeals) => meal.date === startDate)

      if (todayMeal) {
        setMeals(todayMeal)
      } else {
        console.log("No se encontraron comidas para la fecha seleccionada")
        setMeals(null)
      }
    } catch (error) {
      console.error("Error al obtener comidas:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar el plan de comidas")
    } finally {
      setIsLoading(false)
    }
  }, [date])

  // Usar datos simulados si estamos en desarrollo o si hay un error
  const useFallbackData = useCallback(() => {
    // Simulación de datos para demostración
    const dayOfWeek = date.getDay()
    const mockMeal: DayMeals = {
      date: format(date, "yyyy-MM-dd"),
      dayOfWeek: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][dayOfWeek],
      meals: {
        lunch: [
          "Ensalada César",
          "Bowl de quinoa",
          "Wrap de pollo",
          "Ensalada de atún",
          "Sándwich de pavo",
          "Hamburguesa vegetariana",
          "Paella de mariscos",
        ][dayOfWeek],
        dinner: [
          "Salmón al horno",
          "Pasta integral",
          "Curry de garbanzos",
          "Pollo al limón",
          "Pizza casera",
          "Tacos de pescado",
          "Sopa de verduras",
        ][dayOfWeek],
      },
    }
    setMeals(mockMeal)
    setIsLoading(false)
  }, [date])

  useEffect(() => {
    // Intentar obtener datos reales, con fallback a datos simulados
    fetchMeals().catch(() => {
      console.log("Usando datos simulados debido a un error")
      useFallbackData()
    })
  }, [date, fetchMeals, useFallbackData])

  if (isLoading) {
    return (
      <Card className="mb-4 border-dashed border-muted">
        <CardContent className="p-3">
          <div className="flex items-center justify-center h-16">
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-4 border-dashed border-muted">
        <CardContent className="p-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error al cargar el plan de comidas: {error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!meals || (!meals.meals.lunch && !meals.meals.dinner)) {
    return (
      <Card className="mb-4 bg-muted/20 border-muted">
        <CardContent className="p-3">
          <div className="flex items-center justify-center h-16">
            <p className="text-sm text-muted-foreground">No hay comidas planificadas para este día</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-4 bg-muted/20 border-muted">
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-medium">Almuerzo:</h3>
            </div>
            <p className="text-sm">{meals.meals.lunch || "No planificado"}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-medium">Cena:</h3>
            </div>
            <p className="text-sm">{meals.meals.dinner || "No planificado"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
