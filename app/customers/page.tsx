"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import {
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  CreateCustomer,
  DeleteCustomer,
  GetCustomerById,
  GetCustomers,
  RestoreCustomer,
  SearchCustomers,
  UpdateCustomer,
} from "@/services/Customers/customerServices"

const skeletonRows = [0, 1, 2]

type CustomerFormValues = {
  name: string
  phoneNumber: string
  secondaryPhoneNumber: string
  email: string
  address: string
  notes: string
}

const emptyForm: CustomerFormValues = {
  name: "",
  phoneNumber: "",
  secondaryPhoneNumber: "",
  email: "",
  address: "",
  notes: "",
}

function customerFromSummary(summary: CustomerSummary): Customer {
  return {
    ...summary,
    address: null,
    isDeleted: false,
  }
}

function toFormValues(customer: Customer): CustomerFormValues {
  return {
    name: customer.name,
    phoneNumber: customer.phoneNumber,
    secondaryPhoneNumber: customer.secondaryPhoneNumber ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    notes: customer.notes ?? "",
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function CustomerStatusBadge({ isDeleted }: { isDeleted: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isDeleted
          ? "bg-destructive/10 text-destructive"
          : "bg-green-500/10 text-green-600"
      }`}
    >
      {isDeleted ? "Deleted" : "Active"}
    </span>
  )
}

function CustomerDetailItem({
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

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState<string | null>(null)

  const [formIsOpen, setFormIsOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null
  )
  const [formValues, setFormValues] = useState<CustomerFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingCustomerId, setLoadingCustomerId] = useState<string | null>(
    null
  )

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  )
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [details, setDetails] = useState<Customer | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsIsLoading, setDetailsIsLoading] = useState(false)

  const latestRequestId = useRef(0)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const requestId = ++latestRequestId.current
    const request = searchTerm
      ? SearchCustomers(searchTerm).then((data) =>
          data.map(customerFromSummary)
        )
      : GetCustomers()

    request
      .then((data) => {
        if (requestId !== latestRequestId.current) return

        setCustomers(data)
        setLoadError(null)
      })
      .catch((error) => {
        if (requestId !== latestRequestId.current) return

        setCustomers([])
        setLoadError(
          getErrorMessage(error, "Failed to load customers. Please try again.")
        )
      })
      .finally(() => {
        if (requestId === latestRequestId.current) {
          setIsLoading(false)
        }
      })
  }, [searchTerm, reloadToken])

  useEffect(() => {
    if (!detailsId) return

    let isCancelled = false

    const loadCustomer = async () => {
      try {
        const data = await GetCustomerById(detailsId)

        if (isCancelled) return

        if (data) {
          setDetails(data)
        } else {
          setDetailsError("Customer not found.")
        }
      } catch (error) {
        if (isCancelled) return

        setDetailsError(
          getErrorMessage(error, "Failed to load the customer details.")
        )
      } finally {
        if (!isCancelled) {
          setDetailsIsLoading(false)
        }
      }
    }

    void loadCustomer()

    return () => {
      isCancelled = true
    }
  }, [detailsId])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const term = searchInput.trim()

    if (!term) {
      clearSearch()
      return
    }

    setIsLoading(true)
    setLoadError(null)
    setActionError(null)
    setSearchInput(term)

    if (term === searchTerm) {
      setReloadToken((token) => token + 1)
    } else {
      setSearchTerm(term)
    }
  }

  const clearSearch = () => {
    setSearchInput("")
    setActionError(null)

    if (searchTerm !== null) {
      setIsLoading(true)
      setLoadError(null)
      setSearchTerm(null)
    }
  }

  const retryLoadCustomers = () => {
    setIsLoading(true)
    setLoadError(null)
    setReloadToken((token) => token + 1)
  }

  const openCreateDialog = () => {
    setEditingCustomerId(null)
    setFormValues({ ...emptyForm })
    setFormError(null)
    setActionError(null)
    setFormIsOpen(true)
  }

  const openEditDialog = async (customer: Customer) => {
    if (loadingCustomerId) return

    setActionError(null)
    setLoadingCustomerId(customer.id)

    try {
      const fullCustomer = await GetCustomerById(customer.id)

      if (!fullCustomer) {
        setActionError("Customer not found.")
        return
      }

      setEditingCustomerId(fullCustomer.id)
      setFormValues(toFormValues(fullCustomer))
      setFormError(null)
      setFormIsOpen(true)
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Failed to load the customer. Please try again.")
      )
    } finally {
      setLoadingCustomerId(null)
    }
  }

  const updateFormValue = (field: keyof CustomerFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  const handleSaveCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSaving) return

    const name = formValues.name.trim()
    const phoneNumber = formValues.phoneNumber.trim()

    if (!name) {
      setFormError("Please enter the customer name.")
      return
    }

    if (!phoneNumber) {
      setFormError("Please enter the phone number.")
      return
    }

    const input: CustomerInput = {
      name,
      phoneNumber,
      secondaryPhoneNumber: formValues.secondaryPhoneNumber.trim() || null,
      email: formValues.email.trim() || null,
      address: formValues.address.trim() || null,
      notes: formValues.notes.trim() || null,
    }

    setIsSaving(true)
    setFormError(null)

    try {
      if (editingCustomerId) {
        await UpdateCustomer(editingCustomerId, input)
      } else {
        await CreateCustomer(input)
        setSearchInput("")
        setSearchTerm(null)
      }

      setFormIsOpen(false)
      setReloadToken((token) => token + 1)
    } catch (error) {
      setFormError(
        getErrorMessage(error, "Failed to save the customer. Please try again.")
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!customerToDelete || isDeleting) return

    const { id } = customerToDelete

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await DeleteCustomer(id)

      setCustomers((current) =>
        current.map((customer) =>
          customer.id === id ? { ...customer, isDeleted: true } : customer
        )
      )

      setCustomerToDelete(null)
    } catch (error) {
      setDeleteError(
        getErrorMessage(
          error,
          "Failed to delete the customer. Please try again."
        )
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestoreCustomer = async (customer: Customer) => {
    if (restoringId) return

    setRestoringId(customer.id)
    setActionError(null)

    try {
      await RestoreCustomer(customer.id)

      setCustomers((current) =>
        current.map((item) =>
          item.id === customer.id ? { ...item, isDeleted: false } : item
        )
      )
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "Failed to restore the customer. Please try again."
        )
      )
    } finally {
      setRestoringId(null)
    }
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Customers</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your customers and their contact details.
          </p>
        </div>

        <Button type="button" className="h-9 px-3.5" onClick={openCreateDialog}>
          <Plus className="size-4" />
          Add Customer
        </Button>
      </div>

      {/* Customers Table */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold">Customers</h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {searchTerm
                ? `Search results for “${searchTerm}”.`
                : "View and manage all your customers."}
            </p>
          </div>

          <span className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${customers.length} Customers`}
          </span>
        </div>

        <div className="border-b border-border px-4 py-3 sm:px-5">
          <form
            onSubmit={handleSearch}
            className="flex flex-wrap items-center gap-2"
          >
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />

              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name or phone"
                aria-label="Search customers"
                autoComplete="off"
                className="ps-8"
              />
            </div>

            <Button type="submit" variant="outline" size="sm">
              <Search />
              Search
            </Button>

            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
              >
                <X />
                Clear
              </Button>
            )}
          </form>
        </div>

        {actionError && (
          <div
            role="alert"
            className="border-b border-border bg-destructive/10 px-4 py-2.5 text-xs text-destructive sm:px-5"
          >
            {actionError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-start">
            <thead>
              <tr className="bg-muted/40 text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3 text-start">ID</th>
                <th className="px-4 py-3 text-start">Name</th>
                <th className="px-4 py-3 text-start">Phone</th>
                <th className="px-4 py-3 text-start">Email</th>
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
                      <Skeleton className="h-4 w-36" />
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
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-t border-border/70 text-sm transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
                        onClick={() => openDetails(customer.id)}
                      >
                        <bdi>{customer.id}</bdi>
                      </Button>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium">{customer.name}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <bdi dir="ltr" className="text-start">
                          {customer.phoneNumber}
                        </bdi>

                        {customer.secondaryPhoneNumber && (
                          <bdi
                            dir="ltr"
                            className="text-start text-xs text-muted-foreground"
                          >
                            {customer.secondaryPhoneNumber}
                          </bdi>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-muted-foreground">
                      {customer.email ? (
                        <span className="break-all">{customer.email}</span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <CustomerStatusBadge isDeleted={customer.isDeleted} />
                    </td>

                    <td className="px-5 py-3.5 text-end">
                      <div className="flex items-center justify-end gap-2">
                        {customer.isDeleted ? (
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            disabled={restoringId === customer.id}
                            onClick={() => handleRestoreCustomer(customer)}
                          >
                            {restoringId === customer.id ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <RotateCcw />
                            )}
                            Restore
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              disabled={loadingCustomerId === customer.id}
                              onClick={() => openEditDialog(customer)}
                            >
                              {loadingCustomerId === customer.id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Pencil />
                              )}
                              Edit
                            </Button>

                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                setDeleteError(null)
                                setCustomerToDelete(customer)
                              }}
                            >
                              <Trash2 />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && customers.length === 0 && (
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
                          onClick={retryLoadCustomers}
                        >
                          <RefreshCw />
                          Try again
                        </Button>
                      </div>
                    ) : searchTerm ? (
                      "No customers match your search."
                    ) : (
                      "No customers found."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create / edit customer */}
      <Dialog
        open={formIsOpen}
        onOpenChange={(open) => {
          setFormIsOpen(open)

          if (!open) {
            setFormError(null)
          }
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={handleSaveCustomer} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingCustomerId ? "Edit Customer" : "Add Customer"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomerId
                  ? "Update this customer's details."
                  : "Add a new customer to your records."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="customer-name">Name</FieldLabel>
                <Input
                  id="customer-name"
                  value={formValues.name}
                  onChange={(event) =>
                    updateFormValue("name", event.target.value)
                  }
                  placeholder="Customer name"
                  autoComplete="name"
                  disabled={isSaving}
                  aria-invalid={formError ? true : undefined}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-phone">Phone number</FieldLabel>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={formValues.phoneNumber}
                  onChange={(event) =>
                    updateFormValue("phoneNumber", event.target.value)
                  }
                  placeholder="Phone number"
                  autoComplete="tel"
                  disabled={isSaving}
                  aria-invalid={formError ? true : undefined}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-secondary-phone">
                  Secondary phone
                </FieldLabel>
                <Input
                  id="customer-secondary-phone"
                  type="tel"
                  value={formValues.secondaryPhoneNumber}
                  onChange={(event) =>
                    updateFormValue("secondaryPhoneNumber", event.target.value)
                  }
                  placeholder="Optional"
                  autoComplete="tel"
                  disabled={isSaving}
                />
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="customer-email">Email</FieldLabel>
                <Input
                  id="customer-email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) =>
                    updateFormValue("email", event.target.value)
                  }
                  placeholder="Optional"
                  autoComplete="email"
                  disabled={isSaving}
                />
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="customer-address">Address</FieldLabel>
                <Textarea
                  id="customer-address"
                  value={formValues.address}
                  onChange={(event) =>
                    updateFormValue("address", event.target.value)
                  }
                  placeholder="Optional"
                  rows={2}
                  disabled={isSaving}
                />
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="customer-notes">Notes</FieldLabel>
                <Textarea
                  id="customer-notes"
                  value={formValues.notes}
                  onChange={(event) =>
                    updateFormValue("notes", event.target.value)
                  }
                  placeholder="Optional"
                  rows={3}
                  disabled={isSaving}
                />
              </Field>
            </div>

            <FieldError>{formError}</FieldError>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => setFormIsOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="animate-spin" />}
                {editingCustomerId ? "Save changes" : "Create Customer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete warning */}
      <Dialog
        open={customerToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setCustomerToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete “{customerToDelete?.name}”? This
              is a soft delete: the customer will be hidden from the list and
              can be restored later.
            </DialogDescription>
          </DialogHeader>

          <FieldError>{deleteError}</FieldError>

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => {
                setCustomerToDelete(null)
                setDeleteError(null)
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteCustomer}
            >
              {isDeleting && <Loader2 className="animate-spin" />}
              Yes, delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer details */}
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
            <DialogTitle>Customer details</DialogTitle>
            <DialogDescription>
              Full information for this customer.
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
              <CustomerDetailItem label="ID" breakAll>
                <bdi>{details.id}</bdi>
              </CustomerDetailItem>

              <CustomerDetailItem label="Name">
                {details.name}
              </CustomerDetailItem>

              <CustomerDetailItem label="Phone">
                <bdi dir="ltr">{details.phoneNumber}</bdi>
              </CustomerDetailItem>

              <CustomerDetailItem label="Secondary phone">
                {details.secondaryPhoneNumber ? (
                  <bdi dir="ltr">{details.secondaryPhoneNumber}</bdi>
                ) : (
                  "—"
                )}
              </CustomerDetailItem>

              <CustomerDetailItem label="Email">
                {details.email ?? "—"}
              </CustomerDetailItem>

              <CustomerDetailItem label="Address">
                <span className="whitespace-pre-wrap">
                  {details.address ?? "—"}
                </span>
              </CustomerDetailItem>

              <CustomerDetailItem label="Notes">
                <span className="whitespace-pre-wrap">
                  {details.notes ?? "—"}
                </span>
              </CustomerDetailItem>

              <CustomerDetailItem label="Status">
                <CustomerStatusBadge isDeleted={details.isDeleted} />
              </CustomerDetailItem>
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
  )
}

export default function Page() {
  return (
    <AppShell>
      <CustomersPage />
    </AppShell>
  )
}
