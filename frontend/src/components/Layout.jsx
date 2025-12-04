import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    {
      label: 'CRM',
      icon: Users,
      subItems: [
        { path: '/crm/partners', label: 'Partners' },
        { path: '/crm/contacts', label: 'Contacts' },
        { path: '/crm/leads', label: 'Leads' }
      ]
    },
    { path: '/jobs', label: 'Job Records', icon: Briefcase },
    {
      label: 'Operations',
      icon: Calendar,
      subItems: [
        { path: '/operations/dispatch', label: 'Dispatch' },
        { path: '/operations/crews', label: 'Crews' },
        { path: '/operations/vehicles', label: 'Vehicles' }
      ]
    },
    { path: '/field-app', label: 'Field App', icon: Smartphone },
    { path: '/inventory', label: 'Inventory', icon: Package },
    {
      label: 'Financial',
      icon: DollarSign,
      subItems: [
        { path: '/financial/invoices', label: 'Invoices' },
        { path: '/financial/estimates', label: 'Estimates' },
        { path: '/financial/skus', label: 'SKUs' }
      ]
    },
    {
      label: 'Portals',
      icon: UserCircle,
      subItems: [
        { path: '/portals/homeowner', label: 'Homeowner Portal' },
        { path: '/portals/roofer', label: 'Roofer Portal' }
      ]
    },
    { path: '/reporting', label: 'Reporting', icon: BarChart3 },
    { path: '/automation', label: 'Automation Engine', icon: Zap },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  const [expandedMenu, setExpandedMenu] = useState(null);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col shadow-2xl`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-slate-700">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              DTRS PRO
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.subItems ? (
                <div className="mb-1">
                  <button
                    onClick={() =>
                      setExpandedMenu(expandedMenu === item.label ? null : item.label)
                    }
                    className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-700 transition-colors ${
                      sidebarOpen ? '' : 'justify-center'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="flex-shrink-0" />
                      {sidebarOpen && <span className="font-medium">{item.label}</span>}
                    </div>
                    {sidebarOpen && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          expandedMenu === item.label ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                  {expandedMenu === item.label && sidebarOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`block p-2 pl-8 rounded-lg text-sm transition-colors ${
                            isActive(subItem.path)
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  } ${sidebarOpen ? '' : 'justify-center'}`}
                >
                  <item.icon size={20} className="flex-shrink-0" />
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-gray-400">System Administrator</p>
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
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
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
