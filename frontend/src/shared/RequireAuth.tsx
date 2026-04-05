import { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useMe } from './useMe';

export function RequireAuth({ children }: PropsWithChildren) {
  const { me, loading } = useMe();

  if (loading) return null;
  if (!me) return <Navigate to="/auth" replace />;

  return children;
}

