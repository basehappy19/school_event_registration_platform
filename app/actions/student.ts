'use server'

import prisma from "@/lib/prisma"

export async function getStudentProfile(studentId: string, nationalIdSuffix: string) {
  if (!studentId || !nationalIdSuffix) return { error: "Missing credentials" }

  const student = await prisma.studentProfile.findUnique({
    where: { studentId }
  })

  if (!student) return { error: "Student not found" }

  if (!student.nationalId.endsWith(nationalIdSuffix)) {
    return { error: "Invalid National ID suffix" }
  }

  return { success: true, data: student }
}
