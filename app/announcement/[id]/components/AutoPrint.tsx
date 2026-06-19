"use client"

import { useEffect } from "react"

export default function AutoPrint({ title }: { title?: string }) {
  useEffect(() => {
    if (window.location.search.includes('print=true')) {
      // Small delay to ensure styles and fonts are loaded
      setTimeout(async () => {
        try {
          const html2pdf = (await import('html2pdf.js')).default
          const element = document.getElementById('print-content') || document.body
          const opt = {
            margin:       15,
            filename:     `${title || 'document'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          
          await html2pdf().set(opt).from(element).save()
          window.close() // Close the print tab after download
        } catch (error) {
          console.error("PDF generation failed, fallback to print", error)
          window.print()
        }
      }, 500)
    }
  }, [title])

  return null
}
