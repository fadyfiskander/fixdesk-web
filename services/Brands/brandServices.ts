import { BaseUrl } from "@/services/baseUrl"

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return { authorization: `Bearer ${token}` }
}

async function handleError(res: Response): Promise<never> {
  let message: string | null = null
  try {
    const body = await res.json()
    if (typeof body?.detail === "string") message = body.detail
    else if (typeof body?.title === "string") message = body.title
    else if (typeof body?.message === "string") message = body.message
  } catch {
    // The response has no JSON body.
  }

  if (res.status === 401) window.location.assign("/login")
  if (res.status === 403) window.location.assign("/unauthorized")
  throw new Error(message ?? `Failed to load brands (HTTP ${res.status}).`)
}

export async function GetActiveBrands(): Promise<Brand[]> {
  const res = await fetch(`${BaseUrl}/brands/active`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}
