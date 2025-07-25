// Admin pages
import * as AdminPages from './admin'
export const AdminMenuPage = AdminPages.MenuPage
export const AdminOrdersPage = AdminPages.OrdersPage
export const AdminTablesPage = AdminPages.TablesPage
export const AdminReportsPage = AdminPages.ReportsPage
export const AdminUsersPage = AdminPages.UsersPage

// Auth pages
import * as AuthPages from './auth'
export const LoginPage = AuthPages.LoginPage
export const UnauthorizedPage = AuthPages.UnauthorizedPage

// Waiter pages
export { default as WaiterPage } from './WaiterPage'

