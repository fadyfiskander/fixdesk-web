
"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { Loader2, LogIn } from "lucide-react"
import { BaseUrl } from "@/services/baseUrl"
import { LoginUser } from "@/services/auth/authServices"

function Login() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading) return

    const form = event.currentTarget
    const formData = new FormData(form)

    const userName = String(formData.get("userName") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!userName || !password) {
      setError("Please enter both user name and password.")
      return
    }

    setLoading(true)
    setError(null)

    try {
        const authResult = await LoginUser(userName, password)
      localStorage.setItem("token", authResult.accessToken)

      window.location.assign("/")
    } catch (error) {
      console.error("Login error:", error)
      setError("Unable to connect to the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-md border bg-card p-8 shadow-md"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>

          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="userName"
            className="text-sm font-medium"
          >
            User Name
          </label>

          <input
            type="text"
            id="userName"
            name="userName"
            required
            autoComplete="username"
            disabled={loading}
            placeholder="Enter your user name"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-sm font-medium"
          >
            Password
          </label>

          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="current-password"
            disabled={loading}
            placeholder="Enter your password"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              Login
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default Login
