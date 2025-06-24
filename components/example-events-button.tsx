"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface ExampleEventsButtonProps {
  onAddExampleEvents: () => void
}

export function ExampleEventsButton({ onAddExampleEvents }: ExampleEventsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)
    setTimeout(() => {
      onAddExampleEvents()
      setIsLoading(false)
    }, 500)
  }

  return (
    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={handleClick} disabled={isLoading}>
      <Calendar className="mr-2 h-4 w-4" />
      {isLoading ? "Cargando ejemplos..." : "Mostrar eventos de ejemplo"}
    </Button>
  )
}
