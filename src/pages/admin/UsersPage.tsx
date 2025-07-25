import { UsersTable } from '@/features/admin/users'

export default function AdminUsersPage() {
  return (
    <div className="p-6 space-y-6">
      <UsersTable />
    </div>
  )
}