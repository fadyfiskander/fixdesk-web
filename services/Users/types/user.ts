type User = {
  id: string
  username: string
  displayName: string
  role: "Owner" | "Staff" | "Technician"
  isActive: boolean
  createdAtUtc: string
}
