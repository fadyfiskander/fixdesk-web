type Device = {
  id: string
  model: string
  serialNumber: string | null
  categoryId: string
  categoryName: string
  brandId: string
  brandName: string
  customerId: string
  customerName: string
  isDeleted: boolean
}

type DeviceSummary = {
  id: string
  model: string
  serialNumber: string | null
  brandName: string
  categoryName: string
  customerId: string
  customerName: string
  isDeleted?: boolean
}

type DeviceInput = {
  model: string
  brandId: string
  categoryId: string
  customerId: string
  serialNumber?: string | null
}
