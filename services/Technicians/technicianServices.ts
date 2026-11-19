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
      throw new Error("Technician not found.")
    case 409:
      throw new Error("This technician conflicts with an existing record.")
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

// Get all technicians (Owner only)
export async function GetTechnicians(): Promise<Technician[]> {
  const res = await fetch(`${BaseUrl}/technicians`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Get all active technicians (Owner only)
export async function GetActiveTechnicians(): Promise<Technician[]> {
  const res = await fetch(`${BaseUrl}/technicians/active`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Get a single technician by id
export async function GetTechnicianById(
  id: string
): Promise<Technician | null> {
  const res = await fetch(`${BaseUrl}/technicians/${id}`, {
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

// Get the technician linked to a system account
export async function GetTechnicianByUserId(
  userId: string
): Promise<Technician | null> {
  const res = await fetch(`${BaseUrl}/technicians/by-user/${userId}`, {
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

// Create a new technician
export async function CreateTechnician(
  input: TechnicianInput
): Promise<Technician> {
  const res = await fetch(`${BaseUrl}/technicians`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Update a technician's full name and phone number
export async function UpdateTechnician(
  id: string,
  input: TechnicianUpdateInput
): Promise<void> {
  const res = await fetch(`${BaseUrl}/technicians/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    await handleError(res)
  }
}

// Activate / deactivate a technician (technicians are never deleted)
export async function SetTechnicianActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const res = await fetch(`${BaseUrl}/technicians/${id}/active`, {
    method: "PATCH",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ isActive }),
  })

  if (!res.ok) {
    await handleError(res)
  }
}

// Link or unlink (null) a system account to the technician
export async function SetTechnicianUserLink(
  id: string,
  userId: string | null
): Promise<void> {
  const res = await fetch(`${BaseUrl}/technicians/${id}/user-link`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) {
    await handleError(res)
  }
}
