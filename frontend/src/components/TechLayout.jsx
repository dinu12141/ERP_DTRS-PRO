import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from './ui/button';

const TechLayout = ({ children, title, showBack = true }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="p-2"
              >
                <ArrowLeft size={20} />
              </Button>
            )}
            <h1 className="text-lg font-bold text-gray-900">{title || 'Field App'}</h1>
          </div>
          <Link to="/tech">
            <Button variant="ghost" size="sm" className="p-2">
              <Home size={20} />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 max-w-md mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center px-2 py-2">
          <Link to="/tech" className="flex flex-col items-center gap-1 px-3 py-2 text-xs">
            <Home size={20} className={location.pathname === '/tech' ? 'text-blue-600' : 'text-gray-400'} />
            <span className={location.pathname === '/tech' ? 'text-blue-600' : 'text-gray-400'}>Home</span>
          </Link>
          <Link to="/tech/jsa" className="flex flex-col items-center gap-1 px-3 py-2 text-xs">
            <span className={location.pathname === '/tech/jsa' ? 'text-blue-600' : 'text-gray-400'}>JSA</span>
          </Link>
          <Link to="/tech/damage-scan" className="flex flex-col items-center gap-1 px-3 py-2 text-xs">
            <span className={location.pathname === '/tech/damage-scan' ? 'text-blue-600' : 'text-gray-400'}>Damage</span>
          </Link>
          <Link to="/tech/detach" className="flex flex-col items-center gap-1 px-3 py-2 text-xs">
            <span className={location.pathname === '/tech/detach' ? 'text-blue-600' : 'text-gray-400'}>Detach</span>
          </Link>
          <Link to="/tech/reset" className="flex flex-col items-center gap-1 px-3 py-2 text-xs">
            <span className={location.pathname === '/tech/reset' ? 'text-blue-600' : 'text-gray-400'}>Reset</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default TechLayout;

