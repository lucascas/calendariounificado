import { DebugPanel } from "@/components/debug-panel"

export default function DebugPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Debug del Sistema</h1>
      <DebugPanel />
    </div>
  )
}
