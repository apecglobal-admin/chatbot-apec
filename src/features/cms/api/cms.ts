import type { CmsConfig, DepartmentConfig } from "@/features/cms/types/cms"

/**
 * Service to handle CMS department API interactions
 */
export async function saveDepartment(dept: DepartmentConfig): Promise<CmsConfig> {
  const response = await fetch(`/api/departments/${dept.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dept),
  })

  const data = (await response.json()) as { config?: CmsConfig; error?: string }

  if (!response.ok || !data.config) {
    throw new Error(data.error ?? "Không thể lưu thông tin ngành hàng.")
  }

  return data.config
}

export async function createDepartment(newDept: DepartmentConfig): Promise<CmsConfig> {
  const response = await fetch("/api/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newDept),
  })

  const data = (await response.json()) as { config?: CmsConfig; error?: string }

  if (!response.ok || !data.config) {
    throw new Error(data.error ?? "Không thể tạo ngành hàng.")
  }

  return data.config
}

export async function deleteDepartment(id: string): Promise<CmsConfig> {
  const response = await fetch(`/api/departments/${id}`, { method: "DELETE" })

  const data = (await response.json()) as { config?: CmsConfig; error?: string }

  if (!response.ok || !data.config) {
    throw new Error(data.error ?? "Không thể xóa ngành hàng.")
  }

  return data.config
}
