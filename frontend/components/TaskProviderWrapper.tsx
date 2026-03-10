'use client';

import { TaskProvider } from '@/context/TaskContext';
import { useAuth } from '@/lib/auth-context';
import { ReactNode } from 'react';

interface TaskProviderWrapperProps {
  children: ReactNode;
}

export function TaskProviderWrapper({ children }: TaskProviderWrapperProps) {
  const { user } = useAuth();

  // Only provide TaskContext if user is logged in
  if (!user) {
    return <>{children}</>;
  }

  return (
    <TaskProvider userId={user.id}>
      {children}
    </TaskProvider>
  );
}
