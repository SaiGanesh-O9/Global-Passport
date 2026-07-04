import { FileCheck2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function SidebarLayout({ children, navItems, subtitle, title }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white px-5 py-5 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-6">
          <NavLink className="flex items-center gap-2 text-lg font-bold text-blue-700" to="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-white">
              <FileCheck2 className="h-5 w-5" />
            </span>
            VeriFlash
          </NavLink>

          <div className="mt-8">
            <p className="text-xs font-bold uppercase text-slate-400">{title}</p>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>

          <nav className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
                key={item.label}
                to={item.to}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <NavLink
              to={title === 'User Dashboard' ? '/institution' : '/dashboard'}
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-50 transition"
            >
              {title === 'User Dashboard' ? 'Switch to Organization Center' : 'Switch to User Dashboard'}
            </NavLink>
          </div>
        </aside>

        <main className="flex-1 px-5 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
