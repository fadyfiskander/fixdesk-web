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
      throw new Error("User not found.")
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

// Get all system accounts (Owner only)
export async function GetUsers(): Promise<User[]> {
  const res = await fetch(`${BaseUrl}/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}
