"use client"

import {
  CreateCategory,
  GetCategories,
} from "@/services/Categories/categoryServices"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/field"

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])

  const [createIsOpen, setCreateIsOpen] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await GetCategories()
      setCategories(data)
    }

    fetchCategories()
  }, [])

  const handleCreateCategory = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string

    if (!name) {
      alert("Please enter a category name.")
      return
    }

    try {
      console.log("category create started")
      await CreateCategory(name)
      console.log("category create stopped")

      const updatedCategories = await GetCategories()
      setCategories(updatedCategories)
      setCreateIsOpen(false)
    } catch (error) {
      console.error("Error creating category:", error)
      alert("Failed to create category. Please try again.")
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Categories</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your product categories.
          </p>
        </div>
        <Dialog open={createIsOpen} onOpenChange={setCreateIsOpen}>
          <DialogTrigger className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            Add Category
          </DialogTrigger>

          <DialogContent>
            <form
              action=""
              onSubmit={handleCreateCategory}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
                <DialogDescription>
                  Create a new category for your products.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <Field>
                  <Input name="name" placeholder="Category name" />
                </Field>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateIsOpen(false)}
                >
                  Cancel
                </Button>

                <Button type="submit">Create Category</Button>
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

          <span className="text-xs text-muted-foreground">
            {categories.length} Categories
          </span>
        </div>

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
              {categories.map((category) => (
                <tr
                  key={category.id}
                  className="border-t border-border/70 text-sm transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-3.5 text-muted-foreground">
                    <bdi>{category.id}</bdi>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-medium">{category.name}</span>
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
                      <button
                        className="rounded-md px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        type="button"
                      >
                        Edit
                      </button>

                      <button
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default CategoriesPage
