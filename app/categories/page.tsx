"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CreateCategory,
  GetActiveCategories,
  GetCategories,
  GetCategoryById,
  RenameCategory,
  SetCategoryActive,
} from "@/services/Categories/categoryServices"

type CategoryFilter = "all" | "active"

const skeletonRows = [0, 1, 2]

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState<CategoryFilter>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [createIsOpen, setCreateIsOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [renameError, setRenameError] = useState<string | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)

  const [categoryToDeactivate, setCategoryToDeactivate] =
    useState<Category | null>(null)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const [activatingId, setActivatingId] = useState<string | null>(null)

  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [details, setDetails] = useState<Category | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsIsLoading, setDetailsIsLoading] = useState(false)

  const latestRequestId = useRef(0)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const requestId = ++latestRequestId.current
    const request =
      filter === "active" ? GetActiveCategories() : GetCategories()

    request
      .then((data) => {
        if (requestId !== latestRequestId.current) return

        setCategories(data)
        setLoadError(null)
      })
      .catch((error) => {
        if (requestId !== latestRequestId.current) return

        setCategories([])
        setLoadError(
          getErrorMessage(error, "Failed to load categories. Please try again.")
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

    const loadCategory = async () => {
      try {
        const data = await GetCategoryById(detailsId)

        if (isCancelled) return

        if (data) {
          setDetails(data)
        } else {
          setDetailsError("Category not found.")
        }
      } catch (error) {
        if (isCancelled) return

        setDetailsError(
          getErrorMessage(error, "Failed to load the category details.")
        )
      } finally {
        if (!isCancelled) {
          setDetailsIsLoading(false)
        }
      }
    }

    void loadCategory()

    return () => {
      isCancelled = true
    }
  }, [detailsId])

  const changeFilter = (nextFilter: CategoryFilter) => {
    if (nextFilter === filter) return

    setIsLoading(true)
    setLoadError(null)
    setActionError(null)
    setRenamingId(null)
    setRenameValue("")
    setRenameError(null)
    setFilter(nextFilter)
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

  const retryLoadCategories = () => {
    setIsLoading(true)
    setLoadError(null)
    setReloadToken((token) => token + 1)
  }

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isCreating) return

    const name = String(
      new FormData(event.currentTarget).get("name") ?? ""
    ).trim()

    if (!name) {
      setCreateError("Please enter a category name.")
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const createdCategory = await CreateCategory(name)

      if (filter === "all" || createdCategory.isActive) {
        setCategories((current) => [...current, createdCategory])
      }

      setCreateIsOpen(false)
    } catch (error) {
      setCreateError(
        getErrorMessage(error, "Failed to create category. Please try again.")
      )
    } finally {
      setIsCreating(false)
    }
  }

  const startRename = (category: Category) => {
    setRenamingId(category.id)
    setRenameValue(category.name)
    setRenameError(null)
    setActionError(null)
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue("")
    setRenameError(null)
  }

  const handleRename = async (
    event: FormEvent<HTMLFormElement>,
    category: Category
  ) => {
    event.preventDefault()

    if (isRenaming) return

    const name = renameValue.trim()

    if (!name) {
      setRenameError("Please enter a category name.")
      return
    }

    if (name === category.name) {
      cancelRename()
      return
    }

    setIsRenaming(true)
    setRenameError(null)

    try {
      await RenameCategory(name, category.id)

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? { ...item, name } : item
        )
      )

      setRenamingId(null)
      setRenameValue("")
    } catch (error) {
      setRenameError(
        getErrorMessage(error, "Failed to rename category. Please try again.")
      )
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDeactivate = async () => {
    if (!categoryToDeactivate || isDeactivating) return

    const { id } = categoryToDeactivate

    setIsDeactivating(true)
    setDeactivateError(null)

    try {
      await SetCategoryActive(id, false)

      setCategories((current) =>
        filter === "active"
          ? current.filter((item) => item.id !== id)
          : current.map((item) =>
              item.id === id ? { ...item, isActive: false } : item
            )
      )

      setCategoryToDeactivate(null)
    } catch (error) {
      setDeactivateError(
        getErrorMessage(
          error,
          "Failed to deactivate category. Please try again."
        )
      )
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleActivate = async (category: Category) => {
    if (activatingId) return

    setActivatingId(category.id)
    setActionError(null)

    try {
      await SetCategoryActive(category.id, true)

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? { ...item, isActive: true } : item
        )
      )
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Failed to activate category. Please try again.")
      )
    } finally {
      setActivatingId(null)
    }
  }

  return (
    <TooltipProvider delay={300}>
      <div className="w-full">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Categories</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage your product categories.
            </p>
          </div>

          <Dialog
            open={createIsOpen}
            onOpenChange={(open) => {
              setCreateIsOpen(open)
              setCreateError(null)
            }}
          >
            <DialogTrigger render={<Button className="h-9 px-3.5" />}>
              <Plus className="size-4" />
              Add Category
            </DialogTrigger>

            <DialogContent>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Add Category</DialogTitle>
                  <DialogDescription>
                    Create a new category for your products.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  <Field>
                    <FieldLabel htmlFor="category-name">
                      Category name
                    </FieldLabel>
                    <Input
                      id="category-name"
                      name="name"
                      placeholder="Category name"
                      autoComplete="off"
                      disabled={isCreating}
                      aria-invalid={createError ? true : undefined}
                    />
                    <FieldError>{createError}</FieldError>
                  </Field>
                </div>

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
                    Create Category
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Table */}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold">Categories</h2>

              <p className="mt-1 text-xs text-muted-foreground">
                View and manage all your product categories.
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
                {isLoading ? "Loading…" : `${categories.length} Categories`}
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

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-start">
              <thead>
                <tr className="bg-muted/40 text-xs font-medium text-muted-foreground">
                  <th className="px-5 py-3 text-start">ID</th>
                  <th className="px-4 py-3 text-start">Name</th>
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
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-5 py-3.5">
                        <Skeleton className="ms-auto h-5 w-16" />
                      </td>
                    </tr>
                  ))}

                {!isLoading &&
                  categories.map((category) => (
                    <tr
                      key={category.id}
                      className="border-t border-border/70 text-sm transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5 text-muted-foreground">
                        <Button
                          type="button"
                          variant="link"
                          size="xs"
                          className="h-auto p-0 text-xs font-normal text-muted-foreground hover:text-foreground"
                          onClick={() => openDetails(category.id)}
                        >
                          <bdi>{category.id}</bdi>
                        </Button>
                      </td>

                      <td className="px-4 py-3.5">
                        {renamingId === category.id ? (
                          <form
                            onSubmit={(event) => handleRename(event, category)}
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
                                aria-label="Category name"
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
                            <span className="font-medium">{category.name}</span>

                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    size="icon-xs"
                                    variant="ghost"
                                    className="text-muted-foreground"
                                    aria-label={`Rename ${category.name}`}
                                    onClick={() => startRename(category)}
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
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            category.isActive
                              ? "bg-green-500/10 text-green-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-end">
                        <div className="flex items-center justify-end gap-2">
                          {category.isActive ? (
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                setDeactivateError(null)
                                setCategoryToDeactivate(category)
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
                              disabled={activatingId === category.id}
                              onClick={() => handleActivate(category)}
                            >
                              {activatingId === category.id ? (
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
                  ))}

                {!isLoading && categories.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      {loadError ? (
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-destructive">{loadError}</span>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={retryLoadCategories}
                          >
                            <RefreshCw />
                            Try again
                          </Button>
                        </div>
                      ) : filter === "active" ? (
                        "No active categories found."
                      ) : (
                        "No categories found."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Delete (deactivate) warning */}
        <Dialog
          open={categoryToDeactivate !== null}
          onOpenChange={(open) => {
            if (!open && !isDeactivating) {
              setCategoryToDeactivate(null)
              setDeactivateError(null)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete “{categoryToDeactivate?.name}”?
                Categories are never removed permanently — this will deactivate
                the category so it can no longer be used. You can activate it
                again later.
              </DialogDescription>
            </DialogHeader>

            <FieldError>{deactivateError}</FieldError>

            <div className="mt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeactivating}
                onClick={() => {
                  setCategoryToDeactivate(null)
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
                Yes, deactivate
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Category details */}
        <Dialog
          open={detailsId !== null}
          onOpenChange={(open) => {
            if (!open) {
              closeDetails()
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Category details</DialogTitle>
              <DialogDescription>
                Full information for this category.
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
                <div className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">ID</dt>
                  <dd className="break-all">
                    <bdi>{details.id}</bdi>
                  </dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">Name</dt>
                  <dd className="font-medium">{details.name}</dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        details.isActive
                          ? "bg-green-500/10 text-green-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {details.isActive ? "Active" : "Inactive"}
                    </span>
                  </dd>
                </div>
              </dl>
            ) : null}

            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeDetails}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default CategoriesPage
