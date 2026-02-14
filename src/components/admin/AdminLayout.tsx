import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-950">
      <AdminSidebar />
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-white">{title}</h1>
          {description && (
            <p className="text-slate-400 mt-1">{description}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
