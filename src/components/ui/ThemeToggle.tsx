'use client';

import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';
import { Moon, Sun } from 'lucide-react';
import React from 'react';

export function ThemeToggle() {
  const { toggleMode, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
