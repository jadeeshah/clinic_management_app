import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  /** Key to listen for (e.g., 'n', 'f', '1') */
  key: string;
  /** Require Ctrl key (Cmd on Mac) */
  ctrl?: boolean;
  /** Require Alt key */
  alt?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Callback when shortcut is triggered */
  handler: () => void;
  /** Description for help menu */
  description?: string;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
  /** Whether to ignore shortcuts when input/textarea is focused (default: true) */
  ignoreInputFocus?: boolean;
}

/**
 * Custom hook for registering keyboard shortcuts
 * Supports modifier keys (Ctrl/Cmd, Alt, Shift)
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, ignoreInputFocus = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore shortcuts when typing in input/textarea
      if (ignoreInputFocus) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          // Allow Escape key even in inputs
          if (event.key !== 'Escape') {
            return;
          }
        }
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        const ctrlOrCmd = event.ctrlKey || event.metaKey;
        const ctrlMatch = shortcut.ctrl ? ctrlOrCmd : !ctrlOrCmd;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts, enabled, ignoreInputFocus]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

/**
 * Pre-defined shortcuts for common navigation
 */
export const createNavigationShortcuts = (navigate: (path: string) => void): KeyboardShortcut[] => [
  {
    key: '1',
    alt: true,
    handler: () => navigate('/'),
    description: 'Go to Dashboard',
  },
  {
    key: '2',
    alt: true,
    handler: () => navigate('/patients'),
    description: 'Go to Patients',
  },
  {
    key: '3',
    alt: true,
    handler: () => navigate('/visits'),
    description: 'Go to Visits',
  },
  {
    key: '4',
    alt: true,
    handler: () => navigate('/billing'),
    description: 'Go to Billing',
  },
];

/**
 * Pre-defined shortcuts for quick actions
 */
export const createQuickActionShortcuts = (actions: {
  onNewPatient?: () => void;
  onNewVisit?: () => void;
  onSearch?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onNewPatient) {
    shortcuts.push({
      key: 'p',
      ctrl: true,
      shift: true,
      handler: actions.onNewPatient,
      description: 'New Patient',
    });
  }

  if (actions.onNewVisit) {
    shortcuts.push({
      key: 'v',
      ctrl: true,
      shift: true,
      handler: actions.onNewVisit,
      description: 'New Visit',
    });
  }

  if (actions.onSearch) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      handler: actions.onSearch,
      description: 'Focus Search',
    });
  }

  return shortcuts;
};

export default useKeyboardShortcuts;
