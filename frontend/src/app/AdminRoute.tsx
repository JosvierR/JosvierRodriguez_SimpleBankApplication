import { RoleRoute } from '@/app/RoleRoute';

export function AdminRoute() {
  return <RoleRoute allow={['ADMIN']} />;
}
