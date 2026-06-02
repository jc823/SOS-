/**
 * ThemeToggle — Sun/Moon toggle button for switching between light and dark themes.
 * Uses the ThemeContext. Only renders if switchable is true.
 */
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={`h-8 w-8 p-0 border-border/40 hover:border-gold/40 hover:text-gold ${className}`}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </Button>
  );
}
