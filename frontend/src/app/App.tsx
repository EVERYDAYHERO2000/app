import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthScreen } from '../features/auth/AuthScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { OrdersListScreen } from '../features/orders/list/OrdersListScreen';
import { OrderDetailScreen } from '../features/orders/detail/OrderDetailScreen';
import { CreateOrderScreen } from '../features/orders/create/CreateOrderScreen';
import { OrderCreatedScreen } from '../features/orders/create/OrderCreatedScreen';
import { AdminOrdersScreen } from '../features/admin/AdminOrdersScreen';
import { AdminMaterialsScreen } from '../features/admin/AdminMaterialsScreen';
import { AdminCategoryFormScreen } from '../features/admin/AdminCategoryFormScreen';
import { AdminPriceFormScreen } from '../features/admin/AdminPriceFormScreen';
import { DriverOrdersScreen } from '../features/driver/DriverOrdersScreen';
import { RequireAuth } from '../shared/RequireAuth';
import { AdminDriversScreen } from '../features/admin/AdminDriversScreen';
import { AdminUsersScreen } from '../features/admin/AdminUsersScreen';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/orders" replace />} />
      <Route path="/auth" element={<AuthScreen />} />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfileScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/orders"
        element={
          <RequireAuth>
            <OrdersListScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/orders/new"
        element={
          <RequireAuth>
            <CreateOrderScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/orders/created"
        element={
          <RequireAuth>
            <OrderCreatedScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <RequireAuth>
            <OrderDetailScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <RequireAuth>
            <AdminOrdersScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <RequireAuth>
            <AdminDriversScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <AdminUsersScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/materials"
        element={
          <RequireAuth>
            <AdminMaterialsScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/materials/categories/:id"
        element={
          <RequireAuth>
            <AdminCategoryFormScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/materials/prices/:id"
        element={
          <RequireAuth>
            <AdminPriceFormScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/driver/orders"
        element={
          <RequireAuth>
            <DriverOrdersScreen />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
}
