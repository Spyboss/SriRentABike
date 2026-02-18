import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Lock, Bike } from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  isAdmin?: boolean;
  userEmail?: string | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isAdmin, userEmail, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = isAdmin 
    ? [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Pricing', href: '/admin/pricing' },
        { name: 'Bikes', href: '/admin/bikes' },
      ]
    : [
        { name: 'Home', href: '/' },
        { name: 'Rent a Bike', href: '/rent' },
      ];

  const handleLinkClick = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  return (
    <nav className="fixed w-full bg-white/95 backdrop-blur-md z-50 border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div 
            className="flex-shrink-0 flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Logo width={56} className="md:w-16" />
            <span className="text-base md:text-lg font-bold text-stone-900 tracking-[0.16em]">SRI RENT A BIKE</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleLinkClick(link.href)}
                className="text-stone-600 hover:text-orange-600 font-medium transition-colors"
              >
                {link.name}
              </button>
            ))}
            
            {isAdmin ? (
              <div className="flex items-center gap-4 border-l pl-6 border-stone-200">
                <span className="text-sm text-stone-500">{userEmail}</span>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 text-sm font-medium rounded-full text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Admin
                </button>
                <button
                  onClick={() => navigate('/rent')}
                  className="inline-flex items-center px-6 py-2.5 text-sm font-medium rounded-full text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-md shadow-orange-200"
                >
                  Rent Now
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus:outline-none transition-colors min-h-[48px] min-w-[48px]"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-4 pt-2 pb-6 space-y-2 bg-white border-t border-stone-100 shadow-lg">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleLinkClick(link.href)}
              className="block w-full text-left px-4 py-4 text-base font-medium text-stone-600 hover:text-orange-600 hover:bg-stone-50 rounded-xl transition-all"
            >
              {link.name}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-stone-100">
            {isAdmin ? (
              <div className="space-y-2">
                <div className="px-4 py-2 text-sm text-stone-500">{userEmail}</div>
                <button
                  onClick={onLogout}
                  className="block w-full text-center px-4 py-4 text-base font-medium text-white bg-stone-900 rounded-xl shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 px-2">
                <button
                  onClick={() => handleLinkClick('/rent')}
                  className="flex items-center justify-center px-4 py-4 text-base font-medium rounded-xl text-white bg-orange-600 shadow-lg shadow-orange-100"
                >
                  <Bike className="w-5 h-5 mr-2" />
                  Rent a Bike
                </button>
                <button
                  onClick={() => handleLinkClick('/login')}
                  className="flex items-center justify-center px-4 py-4 text-base font-medium rounded-xl text-stone-600 border border-stone-200"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Admin Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
