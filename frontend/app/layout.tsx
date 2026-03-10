// frontend/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import QueryProvider from '@/lib/query-provider';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { TaskProviderWrapper } from '@/components/TaskProviderWrapper';
import DebugPanel from '@/components/DebugPanel';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Todo App',
  description: 'A secure, responsive todo application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <TaskProviderWrapper>
              <div className="min-h-screen bg-gray-50">
                {/* Header will be added here */}
                <main className="container mx-auto py-6 px-4">
                  {children}
                </main>
                <ChatWidget />
                <DebugPanel />
              </div>
            </TaskProviderWrapper>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}