import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "./button"

interface BackButtonProps {
  href: string
  children: React.ReactNode
}

export function BackButton({ href, children }: BackButtonProps) {
  return (
    <Button variant="outline" asChild>
      <Link href={href}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {children}
      </Link>
    </Button>
  )
}
