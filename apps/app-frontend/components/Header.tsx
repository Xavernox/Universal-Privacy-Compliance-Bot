'use client';

import { useState, useEffect } from 'react';

export function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-200">
      <nav className="container-base flex items-center justify-between h-16 md:h-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">U-PCB</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a
              href="#"
              className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Scan
            </a>
            <a
              href="#"
              className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Policies
            </a>
            <a
              href="#"
              className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Alerts
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {isMounted && (
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.415 0l1.414 1.414a1 1 0 01-1.415 1.415L4.22 5.636a1 1 0 010-1.414zm11.313 0a1 1 0 010 1.414l-1.414 1.414a1 1 0 01-1.415-1.415l1.414-1.414a1 1 0 011.415 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-7 3a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM4.22 15.78a1 1 0 011.415 0l1.414 1.414a1 1 0 11-1.415 1.415l-1.414-1.414a1 1 0 010-1.415zm11.313 0a1 1 0 010 1.414l-1.414 1.414a1 1 0 01-1.415-1.415l1.414-1.414a1 1 0 011.415 0zM10 18a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          )}
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors font-medium text-sm">
            Sign In
          </button>
        </div>
      </nav>
    </header>
  );
}
