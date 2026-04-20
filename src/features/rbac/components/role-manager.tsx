"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ShieldCheck, Plus, Check, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRoles, getPermissions, saveRole, deleteRole } from "../api/rbac-actions"
import { cn } from "@/utils/ui"
import { Textarea } from "@/components/ui/textarea"
import type { Role, Permission, SaveRolePayload } from "../types"

export function RoleManager() {
  const queryClient = useQueryClient()
  const [editingRole, setEditingRole] = useState<SaveRolePayload | null>(null)

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  })

  const { data: permissions, isLoading: permsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
  })

  const saveMutation = useMutation({
    mutationFn: saveRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Đã cập nhật vai trò thành công.")
      setEditingRole(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Lỗi khi lưu vai trò.")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      toast.success("Đã xóa vai trò thành công.")
    },
    onError: (err: any) => {
      toast.error(err.message || "Lỗi khi xóa vai trò.")
    }
  })

  const handleEdit = (role: Role) => {
    setEditingRole({
      id: role.id,
      name: role.name,
      description: role.description || "",
      permissionIds: role.role_permissions.map((rp) => rp.permission_id),
    })
  }

  const handleCreate = () => {
    setEditingRole({
      name: "",
      description: "",
      permissionIds: [],
    })
  }

  const handleDelete = (role: Role) => {
    if (window.confirm(`Bạn có chắc muốn xóa vai trò "${role.name}" không?`)) {
      deleteMutation.mutate(role.id)
    }
  }

  const togglePermission = (permId: number) => {
    if (!editingRole) return
    const current = editingRole.permissionIds
    const next = current.includes(permId)
      ? current.filter((id) => id !== permId)
      : [...current, permId]
    setEditingRole({ ...editingRole, permissionIds: next })
  }

  if (rolesLoading || permsLoading) return <div className="p-12 text-center text-slate-400 font-medium">Đang tải dữ liệu quyền hạn...</div>

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px] animate-in fade-in duration-500">
      {/* Left Column: Role List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-50 border border-emerald-200/50 flex items-center justify-center shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight">
              Danh sách vai trò
            </h2>
          </div>
          <Button onClick={handleCreate} className="gap-1.5 rounded-lg bg-slate-900 px-4 h-8 font-semibold text-xs text-white hover:bg-slate-800 hover:shadow-md transition-all active:scale-95 shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            Thêm Vai Trò
          </Button>
        </div>

        <div className="grid gap-2">
          {roles?.map((role) => (
            <div 
              key={role.id} 
              onClick={() => handleEdit(role)}
              className={cn(
                "group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all duration-300 cursor-pointer",
                editingRole?.id === role.id ? "ring-1 ring-emerald-500/40 border-emerald-300 bg-emerald-50" : "hover:border-slate-300"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-[14px] font-bold text-slate-900 tracking-tight leading-none">{role.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    {role.role_permissions.length} QUYỀN
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">{role.description || "Chưa có mô tả chi tiết cho vai trò này."}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); handleEdit(role); }} 
                  className="rounded-lg h-7 px-3 text-[11px] font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                >
                  Sửa
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => { e.stopPropagation(); handleDelete(role); }} 
                  className="rounded-lg h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {roles?.length === 0 && (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/60 shadow-sm">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                <ShieldCheck className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hệ thống chưa có vai trò</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Edit Panel - Integrated Side Panel */}
      {editingRole ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col h-[calc(100vh-110px)] sticky top-4 animate-in slide-in-from-right-8 duration-300 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between bg-slate-100">
            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
              {editingRole.id ? "Cập nhật vai trò" : "Tạo vai trò mới"}
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setEditingRole(null)} 
              className="rounded-full h-7 w-7 hover:bg-slate-200/60 text-slate-500 transition-colors"
            >
              <Plus className="h-4 w-4 rotate-45" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
            <div className="space-y-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tên vai trò</label>
                <Input 
                  value={editingRole.name} 
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  placeholder="Ví dụ: Quản lý chi nhánh"
                  className="rounded-lg border-slate-200 h-9 text-[13px] font-semibold shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mô tả chi tiết</label>
                <Textarea 
                  value={editingRole.description} 
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  placeholder="Vai trò này quản lý những tính năng gì?"
                  className="rounded-lg border-slate-200 min-h-[70px] text-[13px] font-medium resize-none shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500/40"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Danh sách Quyền hạn</label>
              <div className="space-y-4 pt-1">
                {Object.entries(
                  (permissions || []).reduce((acc, perm) => {
                    const category = perm.key.split(':')[0] || 'Khác'
                    if (!acc[category]) acc[category] = []
                    acc[category].push(perm)
                    return acc
                  }, {} as Record<string, Permission[]>)
                ).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <div className="h-3.5 w-1 rounded-full bg-emerald-500/40"></div>
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{category}</h4>
                    </div>
                    <div className="grid gap-2">
                      {perms.map((perm) => {
                        const isSelected = editingRole.permissionIds.includes(perm.id)
                        return (
                          <button
                            key={perm.id}
                            type="button"
                            onClick={() => togglePermission(perm.id)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40",
                              isSelected 
                                ? "border-emerald-500 bg-emerald-50/50 shadow-sm" 
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                            )}
                          >
                            <div className="min-w-0">
                              <p className={cn("text-[13px] font-semibold", isSelected ? "text-emerald-900" : "text-slate-900")}>
                                {perm.name}
                              </p>
                              <p className={cn("text-[10px] uppercase font-bold mt-0.5", isSelected ? "text-emerald-700/70" : "text-slate-400")}>{perm.key}</p>
                            </div>
                            <div className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                              isSelected ? "bg-emerald-500 border-emerald-500 shadow-sm text-white" : "bg-slate-50 border-slate-300 text-transparent"
                            )}>
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-100 flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditingRole(null)} 
              className="flex-1 rounded-lg h-8 font-semibold text-[11px] text-slate-700 border-slate-300 shadow-sm bg-white hover:bg-slate-50"
            >
              Đóng
            </Button>
            <Button 
              onClick={() => saveMutation.mutate(editingRole)} 
              disabled={saveMutation.isPending || !editingRole.name}
              className="flex-[2] gap-1.5 rounded-lg h-8 bg-slate-900 font-semibold text-[11px] text-white transition-all hover:bg-slate-800 shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              {saveMutation.isPending ? "Đang lưu..." : "Lưu Vai Trò"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="hidden xl:flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/30 sticky top-4 h-[calc(100vh-110px)]">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
              <Plus className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400 capitalize px-8">Chọn một vai trò để thiết lập</p>
          </div>
        </div>
      )}
    </div>
  )
}
