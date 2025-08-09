/*
 * Settings page
 *
 * This client component allows the user to configure general application
 * settings. For now it supports toggling between light and dark themes via
 * the useTheme hook. In a full application you might also allow the user
 * to select a preferred language or other preferences.
 */

'use client';

import { useTheme } from '@/hooks/useTheme';

export default function SettingsPage() {
  const { theme, toggleMode } = useTheme();
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Appearance</h2>
          <button
            onClick={toggleMode}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>
        {/* Additional settings can be placed here */}
      </div>
    </div>
  );
}
