// src/contexts/NavigationContext.tsx
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type NavigationContextType = {
    /**
     * Navigate to a section on the landing page.
     * - If already on "/", it smoothly scrolls to the element and updates the hash.
     * - If on another route, it navigates to "/#sectionId" so the landing page can scroll on mount.
     */
    navigateToSection: (
        sectionId: string,
        options?: { replace?: boolean; behavior?: ScrollBehavior }
    ) => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

function normalizeId(sectionId: string): string {
    if (!sectionId) return '';
    return sectionId.startsWith('#') ? sectionId.slice(1) : sectionId;
}

function scrollToId(id: string, behavior: ScrollBehavior = 'smooth') {
    const el = document.getElementById(id);
    if (!el) return false;
    // A small rAF helps ensure layout is ready before scrolling.
    requestAnimationFrame(() => el.scrollIntoView({ behavior, block: 'start' }));
    return true;
}

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isOnLanding = location.pathname === '/';

    const value = useMemo<NavigationContextType>(() => {
        return {
            navigateToSection: (rawId, options) => {
                const id = normalizeId(rawId);
                if (!id) return;

                if (isOnLanding) {
                    // Try to scroll immediately
                    const didScroll = scrollToId(id, options?.behavior ?? 'smooth');

                    // Update hash so back/forward keeps section context; this won't reload the page.
                    const targetHash = `#${id}`;
                    const shouldReplace = options?.replace ?? false;

                    if (location.hash !== targetHash) {
                        navigate(targetHash, { replace: shouldReplace });
                    } else if (!didScroll) {
                        // If hash already matches but element wasn't found yet, try a delayed scroll.
                        // Useful when content renders after a tick.
                        setTimeout(() => scrollToId(id, options?.behavior ?? 'smooth'), 0);
                    }
                } else {
                    // Navigate to landing with hash; landing page can have an effect that scrolls on hash.
                    navigate(`/#${id}`, { replace: options?.replace ?? false });
                }
            },
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnLanding, location.hash, navigate]);

    return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = () => {
    const ctx = useContext(NavigationContext);
    if (!ctx) throw new Error('useNavigation must be used within a NavigationProvider');
    return ctx;
};
