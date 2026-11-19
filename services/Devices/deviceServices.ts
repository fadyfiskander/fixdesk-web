import { BaseUrl } from "@/services/baseUrl"

function getAuthHeaders(includeJson = false): HeadersInit {
  const token = localStorage.getItem("token")

  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    authorization: `Bearer ${token}`,
  }
}

async function getErrorMessage(res: Response): Promise<string | null> {
  try {
    const body = await res.json()

    if (typeof body === "string" && body.trim()) return body

    if (body && typeof body === "object") {
      const errors = (body as { errors?: Record<string, unknown> }).errors

      if (errors && typeof errors === "object") {
        for (const value of Object.values(errors)) {
          if (!Array.isArray(value)) continue
          const firstMessage = value.find((item) => typeof item === "string")
          if (typeof firstMessage === "string" && firstMessage.trim()) {
            return firstMessage
          }
        }
      }

      const message =
        (body as { detail?: unknown }).detail ??
        (body as { title?: unknown }).title ??
        (body as { message?: unknown }).message

      if (typeof message === "string" && message.trim()) return message
    }
  } catch {
    // The response has no JSON body.
  }

  return null
}

async function handleError(res: Response): Promise<never> {
  if (res.status === 401) window.location.assign("/login")
  if (res.status === 403) window.location.assign("/unauthorized")

  const message = await getErrorMessage(res)
  if (message) throw new Error(message)

  switch (res.status) {
    case 400:
      throw new Error("Bad request. Please check your request and try again.")
    case 404:
      throw new Error("Device not found.")
    case 409:
      throw new Error("This device conflicts with an existing record.")
    case 500:
      throw new Error("Internal server error. Please try again later.")
    case 503:
      throw new Error("Service unavailable. Please try again later.")
    case 504:
      throw new Error("Gateway timeout. Please try again later.")
    default:
      throw new Error(`HTTP Error: ${res.status}`)
  }
}

export async function GetDevices(): Promise<Device[]> {
  const res = await fetch(`${BaseUrl}/devices`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function GetDeviceById(id: string): Promise<Device | null> {
  const res = await fetch(`${BaseUrl}/devices/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (res.status === 404) return null
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function GetDevicesByCustomer(
  customerId: string
): Promise<DeviceSummary[]> {
  const res = await fetch(`${BaseUrl}/devices/by-customer/${customerId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function CreateDevice(input: DeviceInput): Promise<Device> {
  const res = await fetch(`${BaseUrl}/devices`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(input),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function UpdateDevice(
  id: string,
  input: DeviceInput
): Promise<void> {
  const res = await fetch(`${BaseUrl}/devices/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(input),
  })
  if (!res.ok) await handleError(res)
}

export async function DeleteDevice(id: string): Promise<void> {
  const res = await fetch(`${BaseUrl}/devices/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!res.ok) await handleError(res)
}

export async function RestoreDevice(id: string): Promise<void> {
  const res = await fetch(`${BaseUrl}/devices/${id}/restore`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  if (!res.ok) await handleError(res)
}
