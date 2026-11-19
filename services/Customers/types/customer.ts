type Customer = {
  id: string
  name: string
  phoneNumber: string
  secondaryPhoneNumber: string | null
  email: string | null
  address: string | null
  notes: string | null
  isDeleted: boolean
}

type CustomerSummary = {
  id: string
  name: string
  phoneNumber: string
  secondaryPhoneNumber: string | null
  email: string | null
  notes: string | null
}

type CustomerInput = {
  name: string
  phoneNumber: string
  secondaryPhoneNumber?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
}
