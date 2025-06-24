"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

// Colores predefinidos para elegir
const predefinedColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#64748b", // slate
]

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [color, setColor] = useState(value || "#3b82f6")

  useEffect(() => {
    if (value && value !== color) {
      setColor(value)
    }
  }, [value])

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    onChange(newColor)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-10 h-10 p-0 border-2" style={{ backgroundColor: color }}>
          <span className="sr-only">Elegir color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-4 gap-2">
          {predefinedColors.map((presetColor) => (
            <Button
              key={presetColor}
              variant="outline"
              className="w-10 h-10 p-0 relative"
              style={{ backgroundColor: presetColor }}
              onClick={() => handleColorChange(presetColor)}
            >
              {color === presetColor && <Check className="h-4 w-4 text-white absolute" />}
              <span className="sr-only">{presetColor}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
