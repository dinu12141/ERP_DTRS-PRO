import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContextFirebase';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  FileText,
  Package,
  Settings,
  Menu,
  X,
  ChevronDown,
  Bell,
  User,
  Smartphone,
  DollarSign,
  BarChart3,
  Zap,
  UserCircle,
  Building2,
  Phone,
  TrendingUp
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const Layout = ({ children }) => {
  const { logoUrl } = useBranding();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'text-sky-400' },
    {
      label: 'CRM',
      icon: Users,
      color: 'text-indigo-400',
      subItems: [
        { path: '/crm/partners', label: 'Partners' },
        { path: '/crm/contacts', label: 'Contacts' },
        { path: '/crm/leads', label: 'Leads' }
      ]
    },
    { path: '/jobs', label: 'Job Records', icon: Briefcase, color: 'text-emerald-400' },
    {
      label: 'Operations',
      icon: Calendar,
      color: 'text-orange-400',
      subItems: [
        { path: '/operations/dispatch', label: 'Dispatch' },
        { path: '/operations/crews', label: 'Crews' },
        { path: '/operations/vehicles', label: 'Vehicles' }
      ]
    },
    { path: '/field-app', label: 'Field App', icon: Smartphone, color: 'text-purple-400' },
    { path: '/inventory', label: 'Inventory', icon: Package, color: 'text-yellow-400' },
    {
      label: 'Financial',
      icon: DollarSign,
      color: 'text-green-400',
      subItems: [
        { path: '/financial/invoices', label: 'Invoices' },
        { path: '/financial/estimates', label: 'Estimates' },
        { path: '/financial/skus', label: 'SKUs' }
      ]
    },
    {
      label: 'Portals',
      icon: UserCircle,
      color: 'text-pink-400',
      subItems: [
        { path: '/portals/homeowner', label: 'Homeowner Portal' },
        { path: '/portals/roofer', label: 'Roofer Portal' }
      ]
    },
    { path: '/reporting', label: 'Reporting', icon: BarChart3, color: 'text-cyan-400' },
    { path: '/automation', label: 'Automation Engine', icon: Zap, color: 'text-amber-400' },
    { path: '/settings', label: 'Settings', icon: Settings, color: 'text-slate-400' }
  ];

  const [expandedMenu, setExpandedMenu] = useState(null);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl relative overflow-hidden`}
      >
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-blue-500 blur-3xl"></div>
          <div className="absolute top-40 -left-20 w-40 h-40 rounded-full bg-purple-500 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-500 blur-3xl"></div>
        </div>

        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm relative z-10">
          {sidebarOpen && (
            <div className="flex items-center gap-3 flex-1 justify-center">
              <img src={logoUrl} alt="DTRS PRO" className="h-10 w-auto object-contain" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-wider whitespace-nowrap">
                DTRS PRO
              </h1>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 hover:bg-slate-800 rounded-lg transition-all duration-200 text-gray-400 hover:text-white ${!sidebarOpen ? 'mx-auto' : ''}`}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 relative z-10 space-y-1">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.subItems ? (
                <div className="mb-1">
                  <button
                    onClick={() =>
                      setExpandedMenu(expandedMenu === item.label ? null : item.label)
                    }
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${sidebarOpen ? '' : 'justify-center'
                      } ${item.subItems.some(sub => isActive(sub.path))
                        ? 'bg-slate-800/50 text-white shadow-lg shadow-black/10'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-all duration-300 ${item.subItems.some(sub => isActive(sub.path))
                          ? 'bg-slate-800 shadow-inner ' + item.color
                          : 'group-hover:bg-slate-800 group-hover:shadow-inner ' + item.color
                        }`}>
                        <item.icon size={20} className="flex-shrink-0" />
                      </div>
                      {sidebarOpen && <span className="font-medium">{item.label}</span>}
                    </div>
                    {sidebarOpen && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-300 text-slate-500 group-hover:text-slate-300 ${expandedMenu === item.label ? 'rotate-180' : ''
                          }`}
                      />
                    )}
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedMenu === item.label && sidebarOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="ml-4 pl-4 border-l-2 border-slate-800 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`block py-2 px-3 rounded-lg text-sm transition-all duration-200 ${isActive(subItem.path)
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md translate-x-1'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50 hover:translate-x-1'
                            }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 p-3 rounded-xl mb-1 transition-all duration-200 group ${isActive(item.path)
                      ? 'bg-slate-800/50 text-white shadow-lg shadow-black/10'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    } ${sidebarOpen ? '' : 'justify-center'}`}
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive(item.path)
                      ? 'bg-slate-800 shadow-inner ' + item.color
                      : 'group-hover:bg-slate-800 group-hover:shadow-inner ' + item.color
                    }`}>
                    <item.icon size={20} className="flex-shrink-0" />
                  </div>
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.displayName || user?.name || 'User'}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role || 'Member'}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {location.pathname === '/'
                  ? 'Dashboard'
                  : location.pathname.split('/').pop().charAt(0).toUpperCase() +
                  location.pathname.split('/').pop().slice(1)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back! Here's what's happening today.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter />
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-sm text-right">
                <p className="font-medium text-gray-800">System Status</p>
                <p className="text-green-600 text-xs">All Systems Operational</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
