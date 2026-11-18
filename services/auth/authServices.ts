import { BaseUrl } from "../baseUrl";

export async function LoginUser(userName: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${BaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userName,
      password,
    }),
  })

    if (!res.ok) {
        if (res.status === 401 || res.status === 400) {
            throw new Error("Invalid username or password.");
        } else {
            throw new Error("Something went wrong. Please try again.");
        }
    }

  const data: LoginResult = await res.json();

    if (
        !data ||
        typeof data.accessToken !== "string" ||
        !data.accessToken.trim()
    ) {
        throw new Error("Invalid response received from the server.");
    }

    return data;
}