"use client";

import { AdminBadge, AdminTable } from "@/components/admin/AdminTable";
import {
  ALL_ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_META,
  DEFAULT_ADMIN_ROLES,
  DEFAULT_ADMIN_USERS,
  type AdminPermission,
  type AdminRole,
  type AdminUser,
} from "@/lib/adminAccess";
import { Button } from "@/components/ui/Button";
import { Card, FormInput, FormLabel, FormSelect } from "@/components/ui/Card";
import { PasteurStorage } from "@/lib/storage";
import { FormEvent, useEffect, useMemo, useState } from "react";

const emptyUserForm = {
  id: "",
  username: "",
  password: "",
  displayName: "",
  roleId: "ops",
  active: true,
};

export default function AdminAccessPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("superadmin");
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function reload() {
    PasteurStorage.initAdminAccessIfNeeded();
    const nextRoles = PasteurStorage.getAdminRoles();
    const nextUsers = PasteurStorage.getAdminUsers();
    setRoles(nextRoles);
    setUsers(nextUsers);
    if (!nextRoles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(nextRoles[0]?.id || "superadmin");
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || roles[0] || null,
    [roles, selectedRoleId],
  );

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function persistRoles(nextRoles: AdminRole[]) {
    const safe = PasteurStorage.ensureAccessPermissionCoverage(nextRoles, users);
    PasteurStorage.saveAdminRoles(safe);
    reload();
    // refresh session permissions if role changed for current user
    const session = PasteurStorage.getAdminSession();
    if (session) PasteurStorage.setAdminSession(session);
  }

  function persistUsers(nextUsers: AdminUser[]) {
    PasteurStorage.saveAdminUsers(nextUsers);
    const safe = PasteurStorage.ensureAccessPermissionCoverage(roles, nextUsers);
    PasteurStorage.saveAdminRoles(safe);
    reload();
  }

  function togglePermission(permission: AdminPermission) {
    if (!selectedRole) return;
    if (selectedRole.id === "superadmin" && permission === "access") {
      flash("نقش مدیر کل باید دسترسی «سطح دسترسی» را داشته باشد.");
      return;
    }
    const next = roles.map((role) => {
      if (role.id !== selectedRole.id) return role;
      const has = role.permissions.includes(permission);
      const permissions = has
        ? role.permissions.filter((item) => item !== permission)
        : [...role.permissions, permission];
      return { ...role, permissions };
    });
    persistRoles(next);
    flash("مجوزهای نقش ذخیره شد.");
  }

  function selectAllPermissions() {
    if (!selectedRole) return;
    const next = roles.map((role) =>
      role.id === selectedRole.id
        ? { ...role, permissions: [...ALL_ADMIN_PERMISSIONS] }
        : role,
    );
    persistRoles(next);
  }

  function clearPermissions() {
    if (!selectedRole) return;
    if (selectedRole.id === "superadmin") {
      flash("نمی‌توان همه مجوزهای مدیر کل را خالی کرد.");
      return;
    }
    const next = roles.map((role) =>
      role.id === selectedRole.id ? { ...role, permissions: [] } : role,
    );
    persistRoles(next);
  }

  function addRole(e: FormEvent) {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const name = String(form.get("name") || "").trim();
    const description = String(form.get("description") || "").trim();
    if (!name) return;
    const id = `role-${Date.now().toString(36)}`;
    persistRoles([
      ...roles,
      {
        id,
        name,
        description,
        permissions: ["dashboard"],
      },
    ]);
    setSelectedRoleId(id);
    (e.target as HTMLFormElement).reset();
    flash("نقش جدید اضافه شد.");
  }

  function deleteRole(roleId: string) {
    if (roleId === "superadmin") {
      flash("نقش مدیر کل قابل حذف نیست.");
      return;
    }
    if (users.some((user) => user.roleId === roleId)) {
      flash("ابتدا کاربران این نقش را به نقش دیگری منتقل کنید.");
      return;
    }
    if (!window.confirm("این نقش حذف شود؟")) return;
    persistRoles(roles.filter((role) => role.id !== roleId));
    flash("نقش حذف شد.");
  }

  function startEditUser(user: AdminUser) {
    setEditingUserId(user.id);
    setUserForm({
      id: user.id,
      username: user.username,
      password: user.password,
      displayName: user.displayName,
      roleId: user.roleId,
      active: user.active !== false,
    });
  }

  function resetUserForm() {
    setEditingUserId(null);
    setUserForm({ ...emptyUserForm, roleId: roles[0]?.id || "ops" });
  }

  function saveUser(e: FormEvent) {
    e.preventDefault();
    const username = userForm.username.trim().toLowerCase();
    const displayName = userForm.displayName.trim() || username;
    const password = userForm.password.trim();
    if (!username || !password || !userForm.roleId) {
      flash("نام کاربری، رمز و نقش الزامی است.");
      return;
    }
    const duplicate = users.some(
      (user) =>
        user.username.trim().toLowerCase() === username && user.id !== editingUserId,
    );
    if (duplicate) {
      flash("این نام کاربری قبلاً ثبت شده است.");
      return;
    }

    if (editingUserId) {
      const next = users.map((user) =>
        user.id === editingUserId
          ? {
              ...user,
              username,
              password,
              displayName,
              roleId: userForm.roleId,
              active: userForm.active,
            }
          : user,
      );
      persistUsers(next);
      flash("کاربر به‌روزرسانی شد.");
    } else {
      persistUsers([
        ...users,
        {
          id: `user-${Date.now().toString(36)}`,
          username,
          password,
          displayName,
          roleId: userForm.roleId,
          active: userForm.active,
        },
      ]);
      flash("کاربر جدید اضافه شد.");
    }
    resetUserForm();
  }

  function deleteUser(userId: string) {
    const target = users.find((user) => user.id === userId);
    if (!target) return;
    if (target.username === "admin") {
      flash("کاربر admin قابل حذف نیست.");
      return;
    }
    const session = PasteurStorage.getAdminSession();
    if (session?.userId === userId) {
      flash("نمی‌توانید کاربر فعلی واردشده را حذف کنید.");
      return;
    }
    if (!window.confirm(`کاربر «${target.displayName}» حذف شود؟`)) return;
    persistUsers(users.filter((user) => user.id !== userId));
    flash("کاربر حذف شد.");
  }

  function resetDefaults() {
    if (!window.confirm("نقش‌ها و کاربران به پیش‌فرض نمونه بازنشانی شوند؟")) return;
    PasteurStorage.saveAdminRoles(
      DEFAULT_ADMIN_ROLES.map((role) => ({ ...role, permissions: [...role.permissions] })),
    );
    PasteurStorage.saveAdminUsers(DEFAULT_ADMIN_USERS.map((user) => ({ ...user })));
    reload();
    resetUserForm();
    flash("پیش‌فرض‌ها بازنشانی شد.");
  }

  function roleName(roleId: string) {
    return roles.find((role) => role.id === roleId)?.name || roleId;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">سطح دسترسی کاربران</h2>
          <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-500">
            نقش‌ها و مجوزهای منوی پنل را اینجا مدیریت کنید. این نسخه نمایشی است و در
            localStorage مرورگر ذخیره می‌شود (بدون بک‌اند).
          </p>
        </div>
        <Button type="button" variant="outline" className="text-sm" onClick={resetDefaults}>
          بازنشانی پیش‌فرض
        </Button>
      </div>

      {message ? (
        <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card hover={false} className="border-cyan-100 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900">نقش‌ها و مجوزها</h3>
              <p className="text-xs text-slate-500">برای هر نقش مشخص کنید کدام منوها دیده شود.</p>
            </div>
            <FormSelect
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="max-w-xs"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </FormSelect>
          </div>

          {selectedRole ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <AdminBadge tone="info">{selectedRole.name}</AdminBadge>
                <span className="text-xs text-slate-500">
                  {selectedRole.permissions.length.toLocaleString("fa-IR")} مجوز فعال
                </span>
                {selectedRole.description ? (
                  <span className="text-xs text-slate-500">— {selectedRole.description}</span>
                ) : null}
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                <Button type="button" className="text-xs" onClick={selectAllPermissions}>
                  انتخاب همه
                </Button>
                <Button type="button" variant="outline" className="text-xs" onClick={clearPermissions}>
                  حذف همه
                </Button>
                {selectedRole.id !== "superadmin" ? (
                  <Button
                    type="button"
                    variant="danger"
                    className="text-xs"
                    onClick={() => deleteRole(selectedRole.id)}
                  >
                    حذف نقش
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {ADMIN_PERMISSION_META.map((item) => {
                  const checked = selectedRole.permissions.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-cyan-300"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(item.id)}
                        className="h-4 w-4 accent-cyan-700"
                      />
                      {item.label}
                    </label>
                  );
                })}
              </div>
            </>
          ) : null}

          <form onSubmit={addRole} className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h4 className="mb-2 text-sm font-extrabold text-slate-900">افزودن نقش جدید</h4>
            </div>
            <div>
              <FormLabel>نام نقش</FormLabel>
              <FormInput name="name" placeholder="مثلاً پشتیبانی" required />
            </div>
            <div>
              <FormLabel>توضیح</FormLabel>
              <FormInput name="description" placeholder="اختیاری" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="text-sm">
                افزودن نقش
              </Button>
            </div>
          </form>
        </Card>

        <Card hover={false} className="border-cyan-100 p-5">
          <h3 className="mb-1 font-extrabold text-slate-900">
            {editingUserId ? "ویرایش کاربر" : "افزودن کاربر"}
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            هر کاربر به یک نقش وصل می‌شود و منوی پنل بر همان اساس فیلتر می‌گردد.
          </p>
          <form onSubmit={saveUser} className="space-y-3">
            <div>
              <FormLabel>نام نمایشی</FormLabel>
              <FormInput
                value={userForm.displayName}
                onChange={(e) => setUserForm((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="مثلاً منشی مطب"
              />
            </div>
            <div>
              <FormLabel>نام کاربری</FormLabel>
              <FormInput
                value={userForm.username}
                onChange={(e) => setUserForm((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div>
              <FormLabel>رمز عبور</FormLabel>
              <FormInput
                value={userForm.password}
                onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div>
              <FormLabel>نقش</FormLabel>
              <FormSelect
                value={userForm.roleId}
                onChange={(e) => setUserForm((prev) => ({ ...prev, roleId: e.target.value }))}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={userForm.active}
                onChange={(e) => setUserForm((prev) => ({ ...prev, active: e.target.checked }))}
                className="h-4 w-4 accent-cyan-700"
              />
              حساب فعال باشد
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="text-sm">
                {editingUserId ? "ذخیره تغییرات" : "افزودن کاربر"}
              </Button>
              {editingUserId ? (
                <Button type="button" variant="outline" className="text-sm" onClick={resetUserForm}>
                  انصراف
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-extrabold text-slate-900">کاربران پنل</h3>
        <AdminTable
          headers={["نام", "نام کاربری", "نقش", "وضعیت", "عملیات"]}
          empty="هنوز کاربری ثبت نشده است."
        >
          {users.map((user) => (
            <tr key={user.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-bold">{user.displayName}</td>
              <td className="px-4 py-3">{user.username}</td>
              <td className="px-4 py-3">
                <AdminBadge tone="info">{roleName(user.roleId)}</AdminBadge>
              </td>
              <td className="px-4 py-3">
                <AdminBadge tone={user.active !== false ? "success" : "danger"}>
                  {user.active !== false ? "فعال" : "غیرفعال"}
                </AdminBadge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs font-bold text-cyan-800"
                    onClick={() => startEditUser(user)}
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold text-red-700"
                    onClick={() => deleteUser(user.id)}
                  >
                    حذف
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
