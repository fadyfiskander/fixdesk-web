"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import {
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
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
import { GetCustomers } from "@/services/Customers/customerServices"
import { GetActiveCategories } from "@/services/Categories/categoryServices"
import { GetActiveBrands } from "@/services/Brands/brandServices"
import {
  CreateDevice,
  DeleteDevice,
  GetDeviceById,
  GetDevices,
  GetDevicesByCustomer,
  RestoreDevice,
  UpdateDevice,
} from "@/services/Devices/deviceServices"

const skeletonRows = [0, 1, 2]

type DeviceFormValues = {
  model: string
  serialNumber: string
  brandId: string
  categoryId: string
  customerId: string
}

const emptyForm: DeviceFormValues = {
  model: "",
  serialNumber: "",
  brandId: "",
  categoryId: "",
  customerId: "",
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function DeviceStatusBadge({ isDeleted = false }: { isDeleted?: boolean }) {
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

function DeviceDetailItem({
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

function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [customerDeviceSummaries, setCustomerDeviceSummaries] = useState<
    DeviceSummary[]
  >([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [lookupsError, setLookupsError] = useState<string | null>(null)
  const [lookupReloadToken, setLookupReloadToken] = useState(0)

  const [customerFilter, setCustomerFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [formIsOpen, setFormIsOpen] = useState(false)
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<DeviceFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingDeviceId, setLoadingDeviceId] = useState<string | null>(null)

  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [details, setDetails] = useState<Device | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsIsLoading, setDetailsIsLoading] = useState(false)

  const latestRequestId = useRef(0)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let isCancelled = false

    Promise.all([GetCustomers(), GetActiveCategories(), GetActiveBrands()])
      .then(([customerData, categoryData, brandData]) => {
        if (isCancelled) return
        setCustomers(customerData)
        setCategories(categoryData)
        setBrands(brandData)
        setLookupsError(null)
      })
      .catch((error) => {
        if (isCancelled) return
        setLookupsError(
          getErrorMessage(error, "Failed to load form options. Please retry.")
        )
      })
    return () => {
      isCancelled = true
    }
  }, [lookupReloadToken])

  useEffect(() => {
    const requestId = ++latestRequestId.current
    const request = customerFilter
      ? GetDevicesByCustomer(customerFilter)
      : GetDevices()

    request
      .then((data) => {
        if (requestId !== latestRequestId.current) return
        if (customerFilter) {
          setCustomerDeviceSummaries(data as DeviceSummary[])
          setDevices([])
        } else {
          setCustomerDeviceSummaries([])
          setDevices(data as Device[])
        }
        setLoadError(null)
      })
      .catch((error) => {
        if (requestId !== latestRequestId.current) return
        setDevices([])
        setLoadError(
          getErrorMessage(error, "Failed to load devices. Please try again.")
        )
      })
      .finally(() => {
        if (requestId === latestRequestId.current) setIsLoading(false)
      })
  }, [customerFilter, reloadToken])

  useEffect(() => {
    if (!detailsId) return
    let isCancelled = false

    const loadDevice = async () => {
      try {
        const data = await GetDeviceById(detailsId)
        if (isCancelled) return
        if (data) setDetails(data)
        else setDetailsError("Device not found.")
      } catch (error) {
        if (isCancelled) return
        setDetailsError(
          getErrorMessage(error, "Failed to load device details.")
        )
      } finally {
        if (!isCancelled) setDetailsIsLoading(false)
      }
    }

    void loadDevice()
    return () => {
      isCancelled = true
    }
  }, [detailsId])

  const retryLoadDevices = () => {
    setIsLoading(true)
    setLoadError(null)
    setReloadToken((token) => token + 1)
  }

  const openCreateDialog = () => {
    setEditingDeviceId(null)
    setFormValues({ ...emptyForm, customerId: customerFilter })
    setFormError(null)
    setActionError(null)
    setFormIsOpen(true)
  }

  const openEditDialog = async (device: Device) => {
    if (loadingDeviceId) return
    setActionError(null)
    setLoadingDeviceId(device.id)

    try {
      const fullDevice = await GetDeviceById(device.id)
      if (!fullDevice) {
        setActionError("Device not found.")
        return
      }

      setEditingDeviceId(fullDevice.id)
      setFormValues({
        model: fullDevice.model,
        serialNumber: fullDevice.serialNumber ?? "",
        brandId: fullDevice.brandId,
        categoryId: fullDevice.categoryId,
        customerId: fullDevice.customerId,
      })
      setFormError(null)
      setFormIsOpen(true)
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Failed to load device. Please try again.")
      )
    } finally {
      setLoadingDeviceId(null)
    }
  }

  const updateFormValue = (field: keyof DeviceFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  const handleSaveDevice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSaving) return

    const input: DeviceInput = {
      model: formValues.model.trim(),
      brandId: formValues.brandId,
      categoryId: formValues.categoryId,
      customerId: formValues.customerId,
      serialNumber: formValues.serialNumber.trim() || null,
    }

    if (!input.model) {
      setFormError("Please enter the device model.")
      return
    }
    if (!input.brandId || !input.categoryId || !input.customerId) {
      setFormError("Please select a brand, category, and customer.")
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      if (editingDeviceId) await UpdateDevice(editingDeviceId, input)
      else await CreateDevice(input)

      setFormIsOpen(false)
      setIsLoading(true)
      setReloadToken((token) => token + 1)
    } catch (error) {
      setFormError(
        getErrorMessage(error, "Failed to save device. Please try again.")
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDevice = async () => {
    if (!deviceToDelete || isDeleting) return
    const { id } = deviceToDelete
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await DeleteDevice(id)
      setCustomerDeviceSummaries((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isDeleted: true } : item
        )
      )
      setDevices((current) =>
        current.map((device) =>
          device.id === id ? { ...device, isDeleted: true } : device
        )
      )
      setDeviceToDelete(null)
    } catch (error) {
      setDeleteError(
        getErrorMessage(error, "Failed to delete device. Please try again.")
      )
    } finally {
      setIsDeleting(false)
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

  const visibleDevices = devices.filter(
    (device) => !customerFilter || device.customerId === customerFilter
  )
  const visibleDeviceCount = customerFilter
    ? customerDeviceSummaries.length
    : visibleDevices.length

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: `${customer.name} — ${customer.phoneNumber}`,
  }))

  const brandOptions = [
    ...brands.map((brand) => ({ value: brand.id, label: brand.name })),
    ...(formValues.brandId &&
    !brands.some((brand) => brand.id === formValues.brandId)
      ? [
          {
            value: formValues.brandId,
            label: `${
              devices.find((device) => device.brandId === formValues.brandId)
                ?.brandName ?? "Current brand"
            } (inactive)`,
          },
        ]
      : []),
  ]

  const categoryOptions = [
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
    ...(formValues.categoryId &&
    !categories.some((category) => category.id === formValues.categoryId)
      ? [
          {
            value: formValues.categoryId,
            label: `${
              devices.find(
                (device) => device.categoryId === formValues.categoryId
              )?.categoryName ?? "Current category"
            } (inactive)`,
          },
        ]
      : []),
  ]

  return (
    <div className="w-full">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Devices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer devices and their details.
          </p>
        </div>

        <Button
          type="button"
          className="h-9 px-3.5"
          onClick={openCreateDialog}
          disabled={Boolean(lookupsError)}
        >
          <Plus className="size-4" />
          Add Device
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold">Devices</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {customerFilter
                ? `Devices for ${customers.find((item) => item.id === customerFilter)?.name ?? "selected customer"}.`
                : "View and manage all devices."}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${visibleDeviceCount} Devices`}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-3 sm:px-5">
          <Field className="w-full sm:max-w-xs">
            <FieldLabel htmlFor="device-customer-filter">
              Filter by customer
            </FieldLabel>
            <Select
              items={[
                { value: null, label: "All customers" },
                ...customerOptions,
              ]}
              value={customerFilter || null}
              onValueChange={(value) => {
                setIsLoading(true)
                setLoadError(null)
                setActionError(null)
                setCustomerFilter(value ?? "")
              }}
            >
              <SelectTrigger id="device-customer-filter" className="w-full">
                <SelectValue placeholder="All customers" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={null}>All customers</SelectItem>

                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phoneNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {lookupsError && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-destructive">
              <span role="alert">{lookupsError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setLookupsError(null)
                  setLookupReloadToken((token) => token + 1)
                }}
              >
                <RefreshCw /> Retry lookups
              </Button>
            </div>
          )}
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
          <table className="w-full min-w-[980px] border-collapse text-start">
            <thead>
              <tr className="bg-muted/40 text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3 text-start">ID</th>
                <th className="px-4 py-3 text-start">Model</th>
                <th className="px-4 py-3 text-start">Serial number</th>
                <th className="px-4 py-3 text-start">Brand</th>
                <th className="px-4 py-3 text-start">Category</th>
                <th className="px-4 py-3 text-start">Customer</th>
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
                    {Array.from({ length: 8 }, (_, index) => (
                      <td className="px-4 py-3.5" key={index}>
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                (customerFilter ? customerDeviceSummaries : visibleDevices).map(
                  (device) => (
                    <tr
                      key={device.id}
                      className="border-t border-border/70 text-sm transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5 text-muted-foreground">
                        <Button
                          type="button"
                          variant="link"
                          size="xs"
                          className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
                          onClick={() => openDetails(device.id)}
                        >
                          <bdi>{device.id}</bdi>
                        </Button>
                      </td>
                      <td className="px-4 py-3.5 font-medium">
                        {device.model}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {device.serialNumber ? (
                          <bdi dir="ltr">{device.serialNumber}</bdi>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5">{device.brandName}</td>
                      <td className="px-4 py-3.5">{device.categoryName}</td>
                      <td className="px-4 py-3.5">{device.customerName}</td>
                      <td className="px-4 py-3.5">
                        <DeviceStatusBadge
                          isDeleted={device.isDeleted ?? false}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-end">
                        <div className="flex items-center justify-end gap-2">
                          {(device.isDeleted ?? false) ? (
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              disabled={restoringId === device.id}
                              onClick={async () => {
                                setRestoringId(device.id)
                                setActionError(null)
                                try {
                                  await RestoreDevice(device.id)
                                  setDevices((current) =>
                                    current.map((item) =>
                                      item.id === device.id
                                        ? { ...item, isDeleted: false }
                                        : item
                                    )
                                  )
                                  setCustomerDeviceSummaries((current) =>
                                    current.map((item) =>
                                      item.id === device.id
                                        ? { ...item, isDeleted: false }
                                        : item
                                    )
                                  )
                                } catch (error) {
                                  setActionError(
                                    getErrorMessage(
                                      error,
                                      "Failed to restore device. Please try again."
                                    )
                                  )
                                } finally {
                                  setRestoringId(null)
                                }
                              }}
                            >
                              {restoringId === device.id ? (
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
                                disabled={loadingDeviceId === device.id}
                                onClick={() => {
                                  void GetDeviceById(device.id)
                                    .then((fullDevice) => {
                                      if (fullDevice)
                                        void openEditDialog(fullDevice)
                                      else setActionError("Device not found.")
                                    })
                                    .catch((error) => {
                                      setActionError(
                                        getErrorMessage(
                                          error,
                                          "Failed to load device."
                                        )
                                      )
                                    })
                                }}
                              >
                                {loadingDeviceId === device.id ? (
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
                                  const fullDevice = devices.find(
                                    (item) => item.id === device.id
                                  )
                                  if (fullDevice) setDeviceToDelete(fullDevice)
                                  else {
                                    void GetDeviceById(device.id)
                                      .then((full) => {
                                        if (full) setDeviceToDelete(full)
                                        else setActionError("Device not found.")
                                      })
                                      .catch((error) => {
                                        setActionError(
                                          getErrorMessage(
                                            error,
                                            "Failed to load device."
                                          )
                                        )
                                      })
                                  }
                                }}
                              >
                                <Trash2 /> Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}

              {!isLoading && visibleDeviceCount === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    {loadError ? (
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-destructive">{loadError}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={retryLoadDevices}
                        >
                          <RefreshCw /> Try again
                        </Button>
                      </div>
                    ) : customerFilter ? (
                      "No devices found for this customer."
                    ) : (
                      "No devices found."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={formIsOpen}
        onOpenChange={(open) => {
          setFormIsOpen(open)
          if (!open) setFormError(null)
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={handleSaveDevice} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingDeviceId ? "Edit Device" : "Add Device"}
              </DialogTitle>
              <DialogDescription>
                {editingDeviceId
                  ? "Update this device's details."
                  : "Add a device to a customer's record."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="device-model">Model</FieldLabel>
                <Input
                  id="device-model"
                  value={formValues.model}
                  onChange={(event) =>
                    updateFormValue("model", event.target.value)
                  }
                  placeholder="Device model"
                  disabled={isSaving}
                  aria-invalid={formError ? true : undefined}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="device-serial">Serial number</FieldLabel>
                <Input
                  id="device-serial"
                  value={formValues.serialNumber}
                  onChange={(event) =>
                    updateFormValue("serialNumber", event.target.value)
                  }
                  placeholder="Optional"
                  disabled={isSaving}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="device-brand">Brand</FieldLabel>
                <Select
                  items={brandOptions}
                  value={formValues.brandId || null}
                  onValueChange={(value) =>
                    updateFormValue("brandId", value ?? "")
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="device-brand"
                    aria-invalid={formError ? true : undefined}
                  >
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>

                  <SelectContent>
                    {brandOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="device-category">Category</FieldLabel>
                <Select
                  items={categoryOptions}
                  value={formValues.categoryId || null}
                  onValueChange={(value) =>
                    updateFormValue("categoryId", value ?? "")
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="device-category"
                    aria-invalid={formError ? true : undefined}
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>

                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="device-customer">Customer</FieldLabel>
                <Select
                  items={customerOptions}
                  value={formValues.customerId || null}
                  onValueChange={(value) =>
                    updateFormValue("customerId", value ?? "")
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="device-customer"
                    aria-invalid={formError ? true : undefined}
                  >
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>

                  <SelectContent>
                    {customerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                disabled={isSaving}
                onClick={() => setFormIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="animate-spin" />}
                {editingDeviceId ? "Save changes" : "Create Device"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deviceToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeviceToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete “{deviceToDelete?.model}”? This is
              a soft delete: the device can be restored later.
            </DialogDescription>
          </DialogHeader>
          <FieldError>{deleteError}</FieldError>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeviceToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteDevice}
            >
              {isDeleting && <Loader2 className="animate-spin" />} Yes, delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailsId !== null}
        onOpenChange={(open) => {
          if (!open) closeDetails()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Device details</DialogTitle>
            <DialogDescription>
              Full information for this device.
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
              <DeviceDetailItem label="ID" breakAll>
                <bdi>{details.id}</bdi>
              </DeviceDetailItem>
              <DeviceDetailItem label="Model">{details.model}</DeviceDetailItem>
              <DeviceDetailItem label="Serial number">
                {details.serialNumber ? (
                  <bdi dir="ltr">{details.serialNumber}</bdi>
                ) : (
                  "—"
                )}
              </DeviceDetailItem>
              <DeviceDetailItem label="Brand">
                {details.brandName}
              </DeviceDetailItem>
              <DeviceDetailItem label="Category">
                {details.categoryName}
              </DeviceDetailItem>
              <DeviceDetailItem label="Customer">
                {details.customerName}
              </DeviceDetailItem>
              <DeviceDetailItem label="Status">
                <DeviceStatusBadge isDeleted={details.isDeleted} />
              </DeviceDetailItem>
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
      <DevicesPage />
    </AppShell>
  )
}
