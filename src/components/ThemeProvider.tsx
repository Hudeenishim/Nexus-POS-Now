import React, { createContext, useContext, useEffect, useState } from 'react'; // Import React and hooks for context and state management

type Theme = 'light' | 'dark'; // Define the possible theme values

interface ThemeContextType { // Define the shape of the theme context
  theme: Theme; // The current theme
  toggleTheme: () => void; // Function to switch between light and dark themes
} // End of ThemeContextType interface

const ThemeContext = createContext<ThemeContextType | undefined>(undefined); // Create the ThemeContext with an initial undefined value

export function ThemeProvider({ children }: { children: React.ReactNode }) { // Define the ThemeProvider component
  const [theme, setTheme] = useState<Theme>(() => { // Initialize theme state from local storage or default to 'light'
    const saved = localStorage.getItem('theme'); // Attempt to retrieve the saved theme from local storage
    return (saved as Theme) || 'light'; // Return the saved theme or 'light' as the default
  }); // End of theme state initialization

  useEffect(() => { // Effect to apply the theme to the document element and save to local storage
    document.documentElement.classList.toggle('dark', theme === 'dark'); // Add or remove the 'dark' class on the html element
    localStorage.setItem('theme', theme); // Persist the current theme in local storage
  }, [theme]); // Re-run the effect whenever the theme state changes

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light'); // Function to toggle between 'light' and 'dark'

  return ( // Return the Provider component
    <ThemeContext.Provider value={{ theme, toggleTheme }}> {/* Provide the theme state and toggle function */}
      {children} {/* Render children components */}
    </ThemeContext.Provider> // End of Provider
  ); // End of return
} // End of ThemeProvider component

export function useTheme() { // Custom hook to use the ThemeContext
  const context = useContext(ThemeContext); // Access the context
  if (!context) throw new Error('useTheme must be used within ThemeProvider'); // Ensure it's used within a provider
  return context; // Return the context value
} // End of useTheme hook
