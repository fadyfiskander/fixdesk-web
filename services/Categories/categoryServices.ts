import { BaseUrl } from "@/services/baseUrl"

// Get all categories
export async function GetCategories() {
  const token = localStorage.getItem("token")
  const res = await fetch(`${BaseUrl}/categories`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      window.location.assign("/login")
    }
    if (res.status === 403) {
      window.location.assign("/unauthorized")
    }
    if (res.status === 404) {
      throw new Error("Categories not found.")
    }
    if (res.status === 500) {
      throw new Error("Internal server error. Please try again later.")
    }
    if (res.status === 503) {
      throw new Error("Service unavailable. Please try again later.")
    }
    if (res.status === 504) {
      throw new Error("Gateway timeout. Please try again later.")
    }
    if (res.status === 400) {
      throw new Error("Bad request. Please check your request and try again.")
    }
  }

  if (!res.ok) {
    throw new Error(`HTTP Error: ${res.status}`)
  }

  const data: Category[] = await res.json()
  return data
}

// Create a new category
export async function CreateCategory(name: string) {
  const token = localStorage.getItem("token")

  const res = await fetch(`${BaseUrl}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: name }),
  })

  if (!res.ok) {
    if (res.status === 401) {
      window.location.assign("/login")
    }
    if (res.status === 403) {
      window.location.assign("/unauthorized")
    }
    if (res.status === 404) {
      throw new Error("Categories not found.")
    }
    if (res.status === 500) {
      throw new Error("Internal server error. Please try again later.")
    }
    if (res.status === 503) {
      throw new Error("Service unavailable. Please try again later.")
    }
  }

  if (!res.ok) {
    throw new Error(`HTTP Error: ${res.status}`)
  }

  const data: string = await res.json()

  return data
}


export async function Rename(name: string, id: string) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BaseUrl}/categories/${id}`, {
    method: "PUT",
    headers: {  
      "authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: name }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.location.assign("/login");
    }
    if (res.status === 403) {
      window.location.assign("/unauthorized");
    }
    if (res.status === 404) {
      throw new Error("Category not found.");
    }
    if (res.status === 500) {
      throw new Error("Internal server error. Please try again later.");
    }
    if (res.status === 503) {
      throw new Error("Service unavailable. Please try again later.");
    }
  }

  if (!res.ok) {
    throw new Error(`HTTP Error: ${res.status}`);
  }

  const data: string = await res.json();

  return data;
}