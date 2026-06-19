"use client"

import { useEffect } from "react"

export default function AutoPrint() {
  useEffect(() => {
    if (window.location.search.includes('print=true')) {
      // Small delay to ensure styles and fonts are loaded
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [])

  return null
}
