import { z } from 'zod'

export const sanitizeString = (str: string) => {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
}

export const submitRegistrationSchema = z.object({
  projectId: z.union([z.string(), z.number()]).transform(String),
  formAnswers: z.array(
    z.object({
      fieldId: z.number().int().positive(),
      value: z.string().max(2000).transform(sanitizeString)
    })
  )
})
