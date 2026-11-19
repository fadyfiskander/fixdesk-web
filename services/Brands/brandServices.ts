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

    if (typeof body === "string" && body.trim()) {
      return body
    }

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

      if (typeof message === "string" && message.trim()) {
        return message
      }
    }
  } catch {
    // The response has no JSON body.
  }

  return null
}

async function handleError(res: Response): Promise<never> {
  if (res.status === 401) {
    window.location.assign("/login")
  }

  if (res.status === 403) {
    window.location.assign("/unauthorized")
  }

  const message = await getErrorMessage(res)

  if (message) {
    throw new Error(message)
  }

  switch (res.status) {
    case 400:
      throw new Error("Bad request. Please check your request and try again.")
    case 404:
      throw new Error("Brand not found.")
    case 409:
      throw new Error("A brand with this name already exists.")
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

// Get all brands (Owner only)
export async function GetBrands(): Promise<Brand[]> {
  const res = await fetch(`${BaseUrl}/brands`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Get all active brands
export async function GetActiveBrands(): Promise<Brand[]> {
  const res = await fetch(`${BaseUrl}/brands/active`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Get a single brand by id
export async function GetBrandById(id: string): Promise<Brand | null> {
  const res = await fetch(`${BaseUrl}/brands/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (res.status === 404) {
    return null
  }

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Create a new brand
export async function CreateBrand(name: string): Promise<Brand> {
  const res = await fetch(`${BaseUrl}/brands`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Rename an existing brand
export async function RenameBrand(id: string, name: string): Promise<void> {
  const res = await fetch(`${BaseUrl}/brands/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    await handleError(res)
  }
}

// Activate / deactivate a brand (brands are never deleted)
export async function SetBrandActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const res = await fetch(`${BaseUrl}/brands/${id}/active`, {
    method: "PATCH",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ isActive }),
  })

  if (!res.ok) {
    await handleError(res)
  }
}
