'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type ThemeMode = 'dark' | 'light'

interface CitizenThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  isDark: boolean
}

const CitizenThemeContext = createContext<CitizenThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
})

export function CitizenThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to 'dark' as explicitly required
  const [theme, setThemeState] = useState<ThemeMode>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Check localStorage, default to 'dark'
    const stored = localStorage.getItem('citizen_portal_theme') as ThemeMode | null
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored)
    } else {
      setThemeState('dark')
      localStorage.setItem('citizen_portal_theme', 'dark')
    }
    setMounted(true)
  }, [])

  function setTheme(newTheme: ThemeMode) {
    setThemeState(newTheme)
    localStorage.setItem('citizen_portal_theme', newTheme)
  }

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return (
    <CitizenThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      <div data-citizen-theme={mounted ? theme : 'dark'} className={mounted && theme === 'light' ? 'citizen-day-theme' : 'citizen-night-theme'}>
        {children}
      </div>
    </CitizenThemeContext.Provider>
  )
}

export function useCitizenTheme() {
  return useContext(CitizenThemeContext)
}
