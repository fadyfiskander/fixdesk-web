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
      throw new Error("Customer not found.")
    case 409:
      throw new Error("This customer conflicts with an existing record.")
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

// Get all customers
export async function GetCustomers(): Promise<Customer[]> {
  const res = await fetch(`${BaseUrl}/customers`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Get a single customer by id
export async function GetCustomerById(id: string): Promise<Customer | null> {
  const res = await fetch(`${BaseUrl}/customers/${id}`, {
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

// Search customers by name or phone number
export async function SearchCustomers(
  term: string
): Promise<CustomerSummary[]> {
  const res = await fetch(
    `${BaseUrl}/customers/search?term=${encodeURIComponent(term)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  )

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Create a new customer
export async function CreateCustomer(input: CustomerInput): Promise<Customer> {
  const res = await fetch(`${BaseUrl}/customers`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    await handleError(res)
  }

  return res.json()
}

// Update an existing customer
export async function UpdateCustomer(
  id: string,
  input: CustomerInput
): Promise<void> {
  const res = await fetch(`${BaseUrl}/customers/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    await handleError(res)
  }
}

// Soft delete a customer
export async function DeleteCustomer(id: string): Promise<void> {
  const res = await fetch(`${BaseUrl}/customers/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    await handleError(res)
  }
}

// Restore a soft-deleted customer
export async function RestoreCustomer(id: string): Promise<void> {
  const res = await fetch(`${BaseUrl}/customers/${id}/restore`, {
    method: "POST",
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    await handleError(res)
  }
}
