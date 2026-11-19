type Technician = {
  id: string
  fullName: string
  phoneNumber: string | null
  userId: string | null
  isActive: boolean
}

type TechnicianInput = {
  fullName: string
  phoneNumber?: string | null
  userId?: string | null
}

type TechnicianUpdateInput = {
  fullName: string
  phoneNumber?: string | null
}
