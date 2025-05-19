import { Upload } from "@/components/upload"
import { Features } from "@/components/features"
import { Hero } from "@/components/hero"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <Hero />
        <Upload />
        <Features />
      </main>
    </div>
  )
}
