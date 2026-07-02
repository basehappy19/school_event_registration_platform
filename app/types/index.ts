import { Prisma, FieldType } from '@prisma/client'

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    quotas: true,
    formFields: true,
    registrations: {
      include: {
        studentProfile: true,
        answers: true
      }
    }
  }
}>

export type ProjectGridItem = Prisma.ProjectGetPayload<{
  include: {
    quotas: true,
    registrations: {
      include: {
        studentProfile: true
      }
    }
  }
}>

export type ProjectForWizard = Prisma.ProjectGetPayload<{
  include: {
    quotas: true,
    formFields: true
  }
}>

export interface UpdateProjectPayload {
  title?: string
  description?: string
  posterUrl?: string | null
  startDate?: Date
  endDate?: Date
  isPublished?: boolean
  isRegistrationOpen?: boolean
  isAnnouncementOpen?: boolean
  registrationStartDate?: Date | null
  registrationEndDate?: Date | null
  announcementStartDate?: Date | null
  announcementEndDate?: Date | null
  activityDate?: Date | null
  activityStartTime?: Date | null
  activityEndTime?: Date | null
  activityLocation?: string
  quotas?: { grade: string; capacity: number; waitlistCapacity?: number | null }[]
  formFields?: { id?: number; label: string; type: FieldType; options?: string; isRequired: boolean }[]
}
