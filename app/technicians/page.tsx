"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import {
  Check,
  Link2,
  Link2Off,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react"

import AppShell from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CreateTechnician,
  GetActiveTechnicians,
  GetTechnicianById,
  GetTechnicians,
  SetTechnicianActive,
  SetTechnicianUserLink,
  UpdateTechnician,
} from "@/services/Technicians/technicianServices"
import { GetUsers } from "@/services/Users/userServices"

type TechnicianFilter = "all" | "active"

const skeletonRows = [0, 1, 2]

type TechnicianFormValues = {
  fullName: string
  phoneNumber: string
  userId: string
}

const emptyForm: TechnicianFormValues = {
  fullName: "",
  phoneNumber: "",
  userId: "",
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function TechnicianStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "bg-green-500/10 text-green-600"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  )
}

function TechnicianDetailItem({
  label,
  children,
  breakAll = false,
}: {
  label: string
  children: ReactNode
  breakAll?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={breakAll ? "break-all" : "break-words"}>{children}</dd>
    </div>
  )
}

function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [filter, setFilter] = useState<TechnicianFilter>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [users, setUsers] = useState<User[]>([])
  const [usersError, setUsersError] = useState<string | null>(null)
  const [usersReloadToken, setUsersReloadToken] = useState(0)

  const [createIsOpen, setCreateIsOpen] = useState(false)
  const [formValues, setFormValues] = useState<TechnicianFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [renameError, setRenameError] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)

  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null)
  const [phoneValue, setPhoneValue] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isSavingPhone, setIsSavingPhone] = useState(false)

  const [technicianToDeactivate, setTechnicianToDeactivate] =
    useState<Technician | null>(null)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const [activatingId, setActivatingId] = useState<string | null>(null)

  const [accountTechnician, setAccountTechnician] = useState<Technician | null>(
    null
  )
  const [accountUserId, setAccountUserId] = useState<string | null>(null)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [isSavingAccount, setIsSavingAccount] = useState(false)

  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [details, setDetails] = useState<Technician | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsIsLoading, setDetailsIsLoading] = useState(false)

  const latestRequestId = useRef(0)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let isCancelled = false

    GetUsers()
      .then((data) => {
        if (isCancelled) return

        setUsers(data)
        setUsersError(null)
      })
      .catch((error) => {
        if (isCancelled) return

        setUsers([])
        setUsersError(
          getErrorMessage(
            error,
            "Failed to load system accounts for linking. Please retry."
          )
        )
      })

    return () => {
      isCancelled = true
    }
  }, [usersReloadToken])

  useEffect(() => {
    const requestId = ++latestRequestId.current
    const request =
      filter === "active" ? GetActiveTechnicians() : GetTechnicians()

    request
      .then((data) => {
        if (requestId !== latestRequestId.current) return

        setTechnicians(data)
        setLoadError(null)
      })
      .catch((error) => {
        if (requestId !== latestRequestId.current) return

        setTechnicians([])
        setLoadError(
          getErrorMessage(
            error,
            "Failed to load technicians. Please try again."
          )
        )
      })
      .finally(() => {
        if (requestId === latestRequestId.current) {
          setIsLoading(false)
        }
      })
  }, [filter, reloadToken])

  useEffect(() => {
    if (!detailsId) return

    let isCancelled = false

    const loadTechnician = async () => {
      try {
        const data = await GetTechnicianById(detailsId)

        if (isCancelled) return

        if (data) {
          setDetails(data)
        } else {
          setDetailsError("Technician not found.")
        }
      } catch (error) {
        if (isCancelled) return

        setDetailsError(
          getErrorMessage(error, "Failed to load the technician details.")
        )
      } finally {
        if (!isCancelled) {
          setDetailsIsLoading(false)
        }
      }
    }

    void loadTechnician()

    return () => {
      isCancelled = true
    }
  }, [detailsId])

  const changeFilter = (nextFilter: TechnicianFilter) => {
    if (nextFilter === filter) return

    setIsLoading(true)
    setLoadError(null)
    setActionError(null)
    setRenamingId(null)
    setRenameValue("")
    setRenameError(null)
    setEditingPhoneId(null)
    setPhoneValue("")
    setPhoneError(null)
    setFilter(nextFilter)
  }

  const retryLoadTechnicians = () => {
    setIsLoading(true)
    setLoadError(null)
    setReloadToken((token) => token + 1)
  }

  const retryLoadUsers = () => {
    setUsersError(null)
    setUsersReloadToken((token) => token + 1)
  }

  const openDetails = (id: string) => {
    setDetails(null)
    setDetailsError(null)
    setDetailsIsLoading(true)
    setDetailsId(id)
  }

  const closeDetails = () => {
    setDetailsId(null)
    setDetails(null)
    setDetailsError(null)
    setDetailsIsLoading(false)
  }

  const openCreateDialog = () => {
    setFormValues({ ...emptyForm })
    setFormError(null)
    setActionError(null)
    setCreateIsOpen(true)
  }

  const updateFormValue = (
    field: keyof TechnicianFormValues,
    value: string
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  const handleCreateTechnician = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isCreating) return

    const fullName = formValues.fullName.trim()

    if (!fullName) {
      setFormError("Please enter the technician's full name.")
      return
    }

    const input: TechnicianInput = {
      fullName,
      phoneNumber: formValues.phoneNumber.trim() || null,
      userId: formValues.userId || null,
    }

    setIsCreating(true)
    setFormError(null)

    try {
      const createdTechnician = await CreateTechnician(input)

      if (filter === "all" || createdTechnician.isActive) {
        setTechnicians((current) => [...current, createdTechnician])
      }

      setCreateIsOpen(false)
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          "Failed to create the technician. Please try again."
        )
      )
    } finally {
      setIsCreating(false)
    }
  }

  const startRename = (technician: Technician) => {
    setRenamingId(technician.id)
    setRenameValue(technician.fullName)
    setRenameError(null)
    setActionError(null)
    setEditingPhoneId(null)
    setPhoneValue("")
    setPhoneError(null)
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue("")
    setRenameError(null)
  }

  const handleRename = async (
    event: FormEvent<HTMLFormElement>,
    technician: Technician
  ) => {
    event.preventDefault()

    if (isRenaming) return

    const fullName = renameValue.trim()

    if (!fullName) {
      setRenameError("Please enter the technician's full name.")
      return
    }

    if (fullName === technician.fullName) {
      cancelRename()
      return
    }

    setIsRenaming(true)
    setRenameError(null)

    try {
      // The update endpoint takes both fields, so keep the current phone.
      await UpdateTechnician(technician.id, {
        fullName,
        phoneNumber: technician.phoneNumber,
      })

      setTechnicians((current) =>
        current.map((item) =>
          item.id === technician.id ? { ...item, fullName } : item
        )
      )

      setRenamingId(null)
      setRenameValue("")
    } catch (error) {
      setRenameError(
        getErrorMessage(
          error,
          "Failed to rename the technician. Please try again."
        )
      )
    } finally {
      setIsRenaming(false)
    }
  }

  const startPhoneEdit = (technician: Technician) => {
    setEditingPhoneId(technician.id)
    setPhoneValue(technician.phoneNumber ?? "")
    setPhoneError(null)
    setActionError(null)
    setRenamingId(null)
    setRenameValue("")
    setRenameError(null)
  }

  const cancelPhoneEdit = () => {
    setEditingPhoneId(null)
    setPhoneValue("")
    setPhoneError(null)
  }

  const handleSavePhone = async (
    event: FormEvent<HTMLFormElement>,
    technician: Technician
  ) => {
    event.preventDefault()

    if (isSavingPhone) return

    const phoneNumber = phoneValue.trim()

    if (phoneNumber === (technician.phoneNumber ?? "")) {
      cancelPhoneEdit()
      return
    }

    setIsSavingPhone(true)
    setPhoneError(null)

    try {
      // The update endpoint takes both fields, so keep the current name.
      await UpdateTechnician(technician.id, {
        fullName: technician.fullName,
        phoneNumber: phoneNumber || null,
      })

      setTechnicians((current) =>
        current.map((item) =>
          item.id === technician.id
            ? { ...item, phoneNumber: phoneNumber || null }
            : item
        )
      )

      setEditingPhoneId(null)
      setPhoneValue("")
    } catch (error) {
      setPhoneError(
        getErrorMessage(
          error,
          "Failed to update the phone number. Please try again."
        )
      )
    } finally {
      setIsSavingPhone(false)
    }
  }

  const handleDeactivate = async () => {
    if (!technicianToDeactivate || isDeactivating) return

    const { id } = technicianToDeactivate

    setIsDeactivating(true)
    setDeactivateError(null)

    try {
      await SetTechnicianActive(id, false)

      setTechnicians((current) =>
        filter === "active"
          ? current.filter((item) => item.id !== id)
          : current.map((item) =>
              item.id === id ? { ...item, isActive: false } : item
            )
      )

      setTechnicianToDeactivate(null)
    } catch (error) {
      setDeactivateError(
        getErrorMessage(
          error,
          "Failed to deactivate the technician. Please try again."
        )
      )
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleActivate = async (technician: Technician) => {
    if (activatingId) return

    setActivatingId(technician.id)
    setActionError(null)

    try {
      await SetTechnicianActive(technician.id, true)

      setTechnicians((current) =>
        current.map((item) =>
          item.id === technician.id ? { ...item, isActive: true } : item
        )
      )
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "Failed to activate the technician. Please try again."
        )
      )
    } finally {
      setActivatingId(null)
    }
  }

  const openAccountDialog = (technician: Technician) => {
    setAccountTechnician(technician)
    setAccountUserId(technician.userId)
    setAccountError(null)
    setActionError(null)
  }

  const closeAccountDialog = () => {
    setAccountTechnician(null)
    setAccountUserId(null)
    setAccountError(null)
  }

  const handleSaveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!accountTechnician || isSavingAccount) return

    if (accountUserId === accountTechnician.userId) {
      closeAccountDialog()
      return
    }

    const technicianId = accountTechnician.id
    const nextUserId = accountUserId

    setIsSavingAccount(true)
    setAccountError(null)

    try {
      await SetTechnicianUserLink(technicianId, nextUserId)

      setTechnicians((current) =>
        current.map((item) =>
          item.id === technicianId ? { ...item, userId: nextUserId } : item
        )
      )

      closeAccountDialog()
    } catch (error) {
      setAccountError(
        getErrorMessage(
          error,
          "Failed to update the account link. Please try again."
        )
      )
    } finally {
      setIsSavingAccount(false)
    }
  }

  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${user.displayName} — ${user.username} (${user.role})`,
  }))

  const createAccountOptions = [
    { value: null, label: "No linked account" },
    ...userOptions,
  ]

  const accountOptions = [
    { value: null, label: "No linked account" },
    ...userOptions,
    ...(accountUserId && !users.some((user) => user.id === accountUserId)
      ? [{ value: accountUserId, label: "Current linked account" }]
      : []),
  ]

  return (
    <TooltipProvider delay={300}>
      <div className="w-full">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Technicians
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage your repair technicians and their system accounts.
            </p>
          </div>

          <Button
            type="button"
            className="h-9 px-3.5"
            onClick={openCreateDialog}
          >
            <Plus className="size-4" />
            Add Technician
          </Button>
        </div>

        {/* Technicians Table */}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold">Technicians</h2>

              <p className="mt-1 text-xs text-muted-foreground">
                View and manage all your repair technicians.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                <Button
                  type="button"
                  size="xs"
                  variant={filter === "all" ? "secondary" : "ghost"}
                  aria-pressed={filter === "all"}
                  onClick={() => changeFilter("all")}
                >
                  All
                </Button>

                <Button
                  type="button"
                  size="xs"
                  variant={filter === "active" ? "secondary" : "ghost"}
                  aria-pressed={filter === "active"}
                  onClick={() => changeFilter("active")}
                >
                  Active
                </Button>
              </div>

              <span className="text-xs text-muted-foreground">
                {isLoading ? "Loading…" : `${technicians.length} Technicians`}
              </span>
            </div>
          </div>

          {actionError && (
            <div
              role="alert"
              className="border-b border-border bg-destructive/10 px-4 py-2.5 text-xs text-destructive sm:px-5"
            >
              {actionError}
            </div>
          )}

          {usersError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-destructive/10 px-4 py-2.5 text-xs text-destructive sm:px-5"
            >
              <span>{usersError}</span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retryLoadUsers}
              >
                <RefreshCw />
                Retry accounts
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-start">
              <thead>
                <tr className="bg-muted/40 text-xs font-medium text-muted-foreground">
                  <th className="px-5 py-3 text-start">ID</th>
                  <th className="px-4 py-3 text-start">Name</th>
                  <th className="px-4 py-3 text-start">Phone</th>
                  <th className="px-4 py-3 text-start">Linked account</th>
                  <th className="px-4 py-3 text-start">Status</th>
                  <th className="px-5 py-3 text-end">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isLoading &&
                  skeletonRows.map((row) => (
                    <tr
                      key={`skeleton-${row}`}
                      className="border-t border-border/70"
                    >
                      <td className="px-5 py-3.5">
                        <Skeleton className="h-4 w-44" />
                      </td>
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-5 py-3.5">
                        <Skeleton className="ms-auto h-5 w-20" />
                      </td>
                    </tr>
                  ))}

                {!isLoading &&
                  technicians.map((technician) => {
                    const linkedUser = users.find(
                      (user) => user.id === technician.userId
                    )

                    return (
                      <tr
                        key={technician.id}
                        className="border-t border-border/70 text-sm transition-colors hover:bg-muted/30"
                      >
                        <td className="px-5 py-3.5 text-muted-foreground">
                          <Button
                            type="button"
                            variant="link"
                            size="xs"
                            className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
                            onClick={() => openDetails(technician.id)}
                          >
                            <bdi>{technician.id}</bdi>
                          </Button>
                        </td>

                        <td className="px-4 py-3.5">
                          {renamingId === technician.id ? (
                            <form
                              onSubmit={(event) =>
                                handleRename(event, technician)
                              }
                              className="flex flex-col gap-1.5"
                            >
                              <div className="flex items-center gap-1">
                                <Input
                                  autoFocus
                                  value={renameValue}
                                  onChange={(event) =>
                                    setRenameValue(event.target.value)
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                      cancelRename()
                                    }
                                  }}
                                  disabled={isRenaming}
                                  aria-label="Technician name"
                                  aria-invalid={renameError ? true : undefined}
                                  className="h-8 max-w-56"
                                />

                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button
                                        type="submit"
                                        size="icon-xs"
                                        variant="ghost"
                                        disabled={isRenaming}
                                        aria-label="Save name"
                                      />
                                    }
                                  >
                                    {isRenaming ? (
                                      <Loader2 className="animate-spin" />
                                    ) : (
                                      <Check />
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent>Save</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button
                                        type="button"
                                        size="icon-xs"
                                        variant="ghost"
                                        onClick={cancelRename}
                                        disabled={isRenaming}
                                        aria-label="Cancel rename"
                                      />
                                    }
                                  >
                                    <X />
                                  </TooltipTrigger>
                                  <TooltipContent>Cancel</TooltipContent>
                                </Tooltip>
                              </div>

                              <FieldError>{renameError}</FieldError>
                            </form>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">
                                {technician.fullName}
                              </span>

                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      type="button"
                                      size="icon-xs"
                                      variant="ghost"
                                      className="text-muted-foreground"
                                      aria-label={`Rename ${technician.fullName}`}
                                      onClick={() => startRename(technician)}
                                    />
                                  }
                                >
                                  <Pencil />
                                </TooltipTrigger>
                                <TooltipContent>Rename</TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {editingPhoneId === technician.id ? (
                            <form
                              onSubmit={(event) =>
                                handleSavePhone(event, technician)
                              }
                              className="flex flex-col gap-1.5"
                            >
                              <div className="flex items-center gap-1">
                                <Input
                                  autoFocus
                                  type="tel"
                                  inputMode="tel"
                                  dir="ltr"
                                  value={phoneValue}
                                  onChange={(event) =>
                                    setPhoneValue(event.target.value)
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                      cancelPhoneEdit()
                                    }
                                  }}
                                  disabled={isSavingPhone}
                                  placeholder="Optional"
                                  aria-label="Technician phone number"
                                  aria-invalid={phoneError ? true : undefined}
                                  className="h-8 max-w-44 text-start"
                                />

                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button
                                        type="submit"
                                        size="icon-xs"
                                        variant="ghost"
                                        disabled={isSavingPhone}
                                        aria-label="Save phone number"
                                      />
                                    }
                                  >
                                    {isSavingPhone ? (
                                      <Loader2 className="animate-spin" />
                                    ) : (
                                      <Check />
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent>Save</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button
                                        type="button"
                                        size="icon-xs"
                                        variant="ghost"
                                        onClick={cancelPhoneEdit}
                                        disabled={isSavingPhone}
                                        aria-label="Cancel phone edit"
                                      />
                                    }
                                  >
                                    <X />
                                  </TooltipTrigger>
                                  <TooltipContent>Cancel</TooltipContent>
                                </Tooltip>
                              </div>

                              <FieldError>{phoneError}</FieldError>
                            </form>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {technician.phoneNumber ? (
                                <bdi dir="ltr" className="text-start">
                                  {technician.phoneNumber}
                                </bdi>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}

                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      type="button"
                                      size="icon-xs"
                                      variant="ghost"
                                      className="text-muted-foreground"
                                      aria-label={`Edit phone number for ${technician.fullName}`}
                                      onClick={() => startPhoneEdit(technician)}
                                    />
                                  }
                                >
                                  <Pencil />
                                </TooltipTrigger>
                                <TooltipContent>Edit phone</TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {technician.userId ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">
                                {linkedUser?.displayName ?? "Linked account"}
                              </span>

                              <bdi className="text-xs text-muted-foreground">
                                {linkedUser?.username ?? technician.userId}
                              </bdi>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Not linked
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <TechnicianStatusBadge
                            isActive={technician.isActive}
                          />
                        </td>

                        <td className="px-5 py-3.5 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              onClick={() => openAccountDialog(technician)}
                            >
                              {technician.userId ? <Link2Off /> : <Link2 />}
                              Account
                            </Button>

                            {technician.isActive ? (
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => {
                                  setDeactivateError(null)
                                  setTechnicianToDeactivate(technician)
                                }}
                              >
                                <Trash2 />
                                Delete
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                disabled={activatingId === technician.id}
                                onClick={() => handleActivate(technician)}
                              >
                                {activatingId === technician.id ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <Power />
                                )}
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                {!isLoading && technicians.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      {loadError ? (
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-destructive">{loadError}</span>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={retryLoadTechnicians}
                          >
                            <RefreshCw />
                            Try again
                          </Button>
                        </div>
                      ) : filter === "active" ? (
                        "No active technicians found."
                      ) : (
                        "No technicians found."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Create technician */}
        <Dialog
          open={createIsOpen}
          onOpenChange={(open) => {
            setCreateIsOpen(open)

            if (!open) {
              setFormError(null)
            }
          }}
        >
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
            <form onSubmit={handleCreateTechnician} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add Technician</DialogTitle>
                <DialogDescription>
                  Add a new technician and optionally link a system account.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="technician-full-name">
                    Full name
                  </FieldLabel>
                  <Input
                    id="technician-full-name"
                    value={formValues.fullName}
                    onChange={(event) =>
                      updateFormValue("fullName", event.target.value)
                    }
                    placeholder="Technician full name"
                    autoComplete="name"
                    disabled={isCreating}
                    aria-invalid={formError ? true : undefined}
                  />
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="technician-phone">
                    Phone number
                  </FieldLabel>
                  <Input
                    id="technician-phone"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={formValues.phoneNumber}
                    onChange={(event) =>
                      updateFormValue("phoneNumber", event.target.value)
                    }
                    placeholder="Optional"
                    autoComplete="tel"
                    disabled={isCreating}
                    className="text-start"
                  />
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="technician-account">
                    System account
                  </FieldLabel>
                  <Select
                    items={createAccountOptions}
                    value={formValues.userId || null}
                    onValueChange={(value) =>
                      updateFormValue("userId", value ?? "")
                    }
                    disabled={isCreating}
                  >
                    <SelectTrigger id="technician-account">
                      <SelectValue placeholder="No linked account" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={null}>No linked account</SelectItem>

                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.displayName} — {user.username} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <FieldError>{formError}</FieldError>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCreating}
                  onClick={() => setCreateIsOpen(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="animate-spin" />}
                  Create Technician
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete (deactivate) warning */}
        <Dialog
          open={technicianToDeactivate !== null}
          onOpenChange={(open) => {
            if (!open && !isDeactivating) {
              setTechnicianToDeactivate(null)
              setDeactivateError(null)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete technician</DialogTitle>
              <DialogDescription className="space-y-2">
                <span className="block font-medium text-foreground">
                  هل تريد الحذف؟
                </span>
                <span className="block">
                  Are you sure you want to delete “
                  {technicianToDeactivate?.fullName}”? Technicians are never
                  removed permanently — this will deactivate the technician so
                  they can no longer be assigned to repairs. You can activate
                  them again later.
                </span>
              </DialogDescription>
            </DialogHeader>

            <FieldError>{deactivateError}</FieldError>

            <div className="mt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeactivating}
                onClick={() => {
                  setTechnicianToDeactivate(null)
                  setDeactivateError(null)
                }}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                disabled={isDeactivating}
                onClick={handleDeactivate}
              >
                {isDeactivating && <Loader2 className="animate-spin" />}
                Yes, delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Account link */}
        <Dialog
          open={accountTechnician !== null}
          onOpenChange={(open) => {
            if (!open && !isSavingAccount) {
              closeAccountDialog()
            }
          }}
        >
          <DialogContent>
            <form onSubmit={handleSaveAccount} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Account link</DialogTitle>
                <DialogDescription>
                  Link “{accountTechnician?.fullName}” to a system account, or
                  choose “No linked account” to unlink them.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <Field>
                  <FieldLabel htmlFor="technician-account-link">
                    System account
                  </FieldLabel>
                  <Select
                    items={accountOptions}
                    value={accountUserId}
                    onValueChange={(value) => setAccountUserId(value ?? null)}
                    disabled={isSavingAccount}
                  >
                    <SelectTrigger id="technician-account-link">
                      <SelectValue placeholder="No linked account" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={null}>No linked account</SelectItem>

                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.displayName} — {user.username} ({user.role})
                        </SelectItem>
                      ))}

                      {accountUserId &&
                        !users.some((user) => user.id === accountUserId) && (
                          <SelectItem value={accountUserId}>
                            Current linked account
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <FieldError>{accountError}</FieldError>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingAccount}
                  onClick={closeAccountDialog}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isSavingAccount}>
                  {isSavingAccount && <Loader2 className="animate-spin" />}
                  Save link
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Technician details */}
        <Dialog
          open={detailsId !== null}
          onOpenChange={(open) => {
            if (!open) {
              closeDetails()
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Technician details</DialogTitle>
              <DialogDescription>
                Full information for this technician.
              </DialogDescription>
            </DialogHeader>

            {detailsIsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : detailsError ? (
              <p className="text-sm text-destructive">{detailsError}</p>
            ) : details ? (
              <dl className="grid gap-3 text-sm">
                <TechnicianDetailItem label="ID" breakAll>
                  <bdi>{details.id}</bdi>
                </TechnicianDetailItem>

                <TechnicianDetailItem label="Full name">
                  {details.fullName}
                </TechnicianDetailItem>

                <TechnicianDetailItem label="Phone">
                  {details.phoneNumber ? (
                    <bdi dir="ltr">{details.phoneNumber}</bdi>
                  ) : (
                    "—"
                  )}
                </TechnicianDetailItem>

                <TechnicianDetailItem label="Linked account">
                  {details.userId
                    ? (() => {
                        const linkedUser = users.find(
                          (user) => user.id === details.userId
                        )

                        return (
                          <div className="flex flex-col gap-0.5">
                            <span>{linkedUser?.displayName ?? "Linked"}</span>
                            <bdi className="text-xs text-muted-foreground">
                              {linkedUser?.username ?? details.userId}
                            </bdi>
                          </div>
                        )
                      })()
                    : "Not linked"}
                </TechnicianDetailItem>

                <TechnicianDetailItem label="Status">
                  <TechnicianStatusBadge isActive={details.isActive} />
                </TechnicianDetailItem>
              </dl>
            ) : null}

            <div className="mt-2 flex justify-end">
              <Button type="button" variant="outline" onClick={closeDetails}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default function Page() {
  return (
    <AppShell>
      <TechniciansPage />
    </AppShell>
  )
}
