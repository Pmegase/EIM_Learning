import React, { createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavigationContextType {
    navigateToSection: (sectionId: string) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();

    const navigateToSection = (sectionId: string) => {
        if (window.location.pathname === '/') {
            // Already on home page - scroll to section
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Navigate to home page with section state
            navigate('/', { state: { scrollTo: sectionId } });
        }
    };

    return (
        <NavigationContext.Provider value={{ navigateToSection }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};