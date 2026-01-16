import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow-md no-print sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <div>
              <h1 className="text-lg font-bold leading-none">SupplierCheck UK</h1>
              <p className="text-xs text-slate-400">Due Diligence Intelligence</p>
            </div>
          </Link>
          <nav>
            <Link to="/" className="text-sm font-medium hover:text-emerald-400 transition-colors">
              New Search
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-white border-t py-6 no-print mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} SupplierCheck UK. Confidential & Proprietary.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
