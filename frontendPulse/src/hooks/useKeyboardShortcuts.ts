import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    description: string;
    action: () => void;
    category: 'navigation' | 'actions' | 'help';
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            const matchingShortcut = shortcuts.find((shortcut) => {
                const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
                const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
                const altMatches = shortcut.altKey ? event.altKey : !event.altKey;

                return keyMatches && ctrlMatches && shiftMatches && altMatches;
            });

            if (matchingShortcut) {
                event.preventDefault();
                matchingShortcut.action();
            }
        },
        [shortcuts]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);
};

// Global navigation shortcuts
export const useGlobalShortcuts = () => {
    const navigate = useNavigate();
    const [showHelp, setShowHelp] = useState(false);
    const [gPressed, setGPressed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            // Help modal
            if (e.key === '?') {
                e.preventDefault();
                setShowHelp(true);
                return;
            }

            // Close help modal with Escape
            if (e.key === 'Escape' && showHelp) {
                setShowHelp(false);
                return;
            }

            // Search with /
            if (e.key === '/') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
                searchInput?.focus();
                return;
            }

            // Create ticket with c
            if (e.key === 'c') {
                e.preventDefault();
                // Trigger create ticket modal
                const createButton = document.querySelector('[data-create-ticket]') as HTMLButtonElement;
                createButton?.click();
                return;
            }

            // Handle 'g' prefix for navigation
            if (e.key === 'g') {
                setGPressed(true);
                setTimeout(() => setGPressed(false), 1000);
                return;
            }

            // Navigation shortcuts (require 'g' prefix)
            if (gPressed) {
                e.preventDefault();
                switch (e.key) {
                    case 't':
                        navigate('/dashboard/tickets');
                        break;
                    case 'a':
                        navigate('/dashboard/analytics');
                        break;
                    case 'o':
                        navigate('/dashboard/overview');
                        break;
                    case 'k':
                        navigate('/dashboard/kanban');
                        break;
                    case 's':
                        navigate('/dashboard/settings');
                        break;
                }
                setGPressed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, showHelp, gPressed]);

    return { showHelp, setShowHelp };
};
