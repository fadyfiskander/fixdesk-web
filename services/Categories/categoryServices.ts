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
      throw new Error("Category not found.")
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

// Get all categories (Owner only)
export async function GetCategories(): Promise<Category[]> {
  const res = await fetch(`${BaseUrl}/categories`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Get all active categories
export async function GetActiveCategories(): Promise<Category[]> {
  const res = await fetch(`${BaseUrl}/categories/active`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Get a single category by id
export async function GetCategoryById(id: string): Promise<Category | null> {
  const res = await fetch(`${BaseUrl}/categories/${id}`, {
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

// Create a new category
export async function CreateCategory(name: string): Promise<Category> {
  const res = await fetch(`${BaseUrl}/categories`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Rename an existing category
export async function RenameCategory(name: string, id: string): Promise<void> {
  const res = await fetch(`${BaseUrl}/categories/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    await handleError(res)
  }
}

// Activate / deactivate a category (categories are never deleted)
export async function SetCategoryActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const res = await fetch(`${BaseUrl}/categories/${id}/active`, {
    method: "PATCH",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ isActive }),
  })

  if (!res.ok) {
    await handleError(res)
  }
}
