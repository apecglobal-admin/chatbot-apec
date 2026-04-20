"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Users, Plus, Check, Save, Trash2, KeyRound, User as UserIcon, Shield } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { getUsers, getRoles, saveUser, deleteUser } from "../api/rbac-actions"
import { cn } from "@/shared/utils/ui"
import type { User, Role, SaveUserPayload } from "../types"

export function UserManager() {
  const queryClient = useQueryClient()
  const [editingUser, setEditingUser] = useState<SaveUserPayload | null>(null)

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  })

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  })

  const saveMutation = useMutation({
    mutationFn: saveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Đã cập nhật nhân sự thành công.")
      setEditingUser(null)
    },
    onError: (err: any) => {
      toast.error(err.message || "Lỗi khi lưu nhân sự.")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Đã xóa nhân sự thành công.")
    },
    onError: (err: any) => {
      toast.error(err.message || "Lỗi khi xóa nhân sự.")
    }
  })

  const handleEdit = (user: User) => {
    setEditingUser({
      id: user.id,
      username: user.username,
      displayName: user.display_name || "",
      roleIds: user.user_roles.map((ur) => ur.role_id),
      password: "",
    })
  }

  const handleCreate = () => {
    setEditingUser({
      username: "",
      displayName: "",
      password: "",
      roleIds: [],
    })
  }

  const handleDelete = (user: User) => {
    if (window.confirm(`Bạn có chắc muốn xóa nhân sự "${user.username}" không?`)) {
      deleteMutation.mutate(user.id)
    }
  }

  const toggleRole = (roleId: number) => {
    if (!editingUser) return
    const current = editingUser.roleIds
    const next = current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : [...current, roleId]
    setEditingUser({ ...editingUser, roleIds: next })
  }

  if (usersLoading || rolesLoading) return <div className="p-12 text-center text-slate-400 font-medium">Đang tải dữ liệu nhân sự...</div>

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px] animate-in fade-in duration-500">
      {/* Left Column: User List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-50 border border-emerald-200/50 flex items-center justify-center shadow-sm">
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight">
            Danh sách tài khoản
          </h2>
        </div>
        <Button onClick={handleCreate} className="gap-1.5 rounded-lg bg-slate-900 px-4 h-8 font-semibold text-xs text-white hover:bg-slate-800 hover:shadow-md transition-all active:scale-95 shadow-sm">
          <Plus className="h-3.5 w-3.5" />
          Thêm Tài Khoản
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 w-[230px]">Thành viên</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">Phân quyền</th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 text-right w-[120px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {users?.map((user) => (
                <tr 
                  key={user.id} 
                  onClick={() => handleEdit(user)}
                  className={cn(
                    "group transition-all cursor-pointer",
                    editingUser?.id === user.id ? "bg-emerald-50" : "bg-white hover:bg-slate-50/50 hover:shadow-[0_0_0_1px_#e2e8f0_inset]"
                  )}
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 font-bold text-sm">
                        {user.display_name ? user.display_name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4 text-slate-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 truncate">
                          {user.display_name || "Chưa đặt tên"}
                        </p>
                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {user.user_roles.map((ur) => {
                        const role = roles?.find(r => r.id === ur.role_id)
                        return (
                          <div key={ur.role_id} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            <Shield className="h-3 w-3" />
                            <span className="text-[11px] font-bold tracking-tight">
                              {role?.name || "???"}
                            </span>
                          </div>
                        )
                      })}
                      {user.user_roles.length === 0 && (
                        <span className="text-[11px] font-medium text-slate-400 italic">Chưa cấp phép</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); handleEdit(user); }} 
                        className="h-7 px-3 rounded-lg text-[11px] font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        Sửa
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); handleDelete(user); }} 
                        className="rounded-lg h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users?.length === 0 && (
            <div className="py-20 text-center bg-white border-t border-slate-50">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                <Users className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hành lang nhân sự trống</p>
            </div>
          )}
        </div>
      </div>
      </div> {/* Closes Left Column */}

      {/* Right Column: Edit Panel - Integrated Side Panel */}
      {editingUser ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col h-[calc(100vh-110px)] sticky top-4 animate-in slide-in-from-right-8 duration-300 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
                {editingUser.id ? "Sửa tài khoản" : "Cấp tài khoản mới"}
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setEditingUser(null)} 
                className="rounded-full h-7 w-7 hover:bg-slate-200/60 text-slate-500 transition-colors"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2.5">
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Họ và tên</label>
                  <Input 
                    value={editingUser.displayName} 
                    onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                    placeholder="VD: Nguyễn Văn A"
                    className="rounded-lg border-slate-200 h-9 text-[13px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus-visible:ring-1 focus-visible:ring-emerald-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tên định danh</label>
                  <div className="relative">
                    <Input 
                      value={editingUser.username} 
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      placeholder="username"
                      className="rounded-lg border-slate-200 h-9 text-[13px] font-semibold pl-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus-visible:ring-1 focus-visible:ring-emerald-500/40"
                      disabled={!!editingUser.id}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold font-mono">@</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {editingUser.id ? "Đổi mật khẩu" : "Mật khẩu"}
                  </label>
                  <div className="relative">
                    <Input 
                      type="password"
                      value={editingUser.password} 
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      placeholder="••••••••"
                      className="rounded-lg border-slate-200 h-9 text-[13px] font-semibold pl-9 shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus-visible:ring-1 focus-visible:ring-emerald-500/40"
                    />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phân quyền</label>
                <div className="grid gap-2">
                  {roles?.map((role) => {
                    const isSelected = editingUser.roleIds.includes(role.id)
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40",
                          isSelected 
                            ? "border-emerald-500 bg-emerald-50/50 shadow-sm" 
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        )}
                      >
                        <div className="min-w-0">
                          <p className={cn("text-[12px] font-bold", isSelected ? "text-emerald-900" : "text-slate-900")}>
                            {role.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{role.description || "Quyền mặc định"}</p>
                        </div>
                        <div className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                          isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 border-slate-300 text-transparent"
                        )}>
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-100 flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingUser(null)} 
                className="flex-1 rounded-lg h-8 font-semibold text-[11px] text-slate-700 border-slate-300 shadow-sm bg-white hover:bg-slate-50"
              >
                Đóng
              </Button>
              <Button 
                onClick={() => saveMutation.mutate(editingUser)} 
                disabled={saveMutation.isPending || !editingUser.username || (!editingUser.id && !editingUser.password)}
                className="flex-[2] gap-1.5 rounded-lg h-8 bg-slate-900 font-semibold text-[11px] text-white transition-all hover:bg-slate-800 shadow-sm"
              >
                <Save className="h-3.5 w-3.5" />
                {saveMutation.isPending ? "Đang lưu..." : "Lưu Tài Khoản"}
              </Button>
            </div>
          </div>
      ) : (
        <div className="hidden xl:flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30 sticky top-4 h-[calc(100vh-110px)]">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-slate-100">
              <Plus className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400 capitalize px-8">Chọn một tài khoản để thiết lập</p>
          </div>
        </div>
      )}
    </div>
  )
}
