"use client"

import { useEffect } from "react"

export default function AutoPrint({ title }: { title?: string }) {
  useEffect(() => {
    if (window.location.search.includes('print=true')) {
      // Small delay to ensure styles and fonts are loaded
      setTimeout(async () => {
        try {
          window.print()
        } catch (error) {
          console.error("Print failed", error)
        }
      }, 500)
    }
  }, [title])

  return null
}
