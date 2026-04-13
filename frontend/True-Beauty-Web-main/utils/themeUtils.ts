// Define all themes as a JS object (default + premium)
interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  isPremium: boolean;
}

export const themes: Theme[] = [
  {
    id: 'blush-rose',
    name: 'Blush Rose',
    primary: '#f8c6d0',
    secondary: '#fef5f7',
    accent: '#ff6b9d',
    isPremium: false
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    primary: '#2563EB',
    secondary: '#EFF6FF',
    accent: '#1E40AF',
    isPremium: true
  },
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    primary: '#059669',
    secondary: '#ECFDF5',
    accent: '#047857',
    isPremium: true
  },
  {
    id: 'purple-glow',
    name: 'Purple Glow',
    primary: '#7C3AED',
    secondary: '#F5F3FF',
    accent: '#5B21B6',
    isPremium: true
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    primary: '#F97316',
    secondary: '#FFF7ED',
    accent: '#EA580C',
    isPremium: true
  },
  {
    id: 'teal-ocean',
    name: 'Teal Ocean',
    primary: '#0D9488',
    secondary: '#F0FDFA',
    accent: '#0F766E',
    isPremium: true
  },
  {
    id: 'hot-pink',
    name: 'Hot Pink',
    primary: '#EC4899',
    secondary: '#FDF2F8',
    accent: '#DB2777',
    isPremium: true
  },
  {
    id: 'coffee-brown',
    name: 'Coffee Brown',
    primary: '#92400E',
    secondary: '#FEF3C7',
    accent: '#78350F',
    isPremium: true
  },
  {
    id: 'dark-mode-pro',
    name: 'Dark Mode Pro',
    primary: '#0F172A',
    secondary: '#1E293B',
    accent: '#38BDF8',
    isPremium: true
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    primary: '#22C55E',
    secondary: '#F0FDF4',
    accent: '#16A34A',
    isPremium: true
  },
  {
    id: 'soft-lavender',
    name: 'Soft Lavender',
    primary: '#A78BFA',
    secondary: '#F5F3FF',
    accent: '#7C3AED',
    isPremium: true
  }
];

// Global applyTheme function that updates CSS variables
export const applyTheme = (themeId: string) => {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;

  // Update CSS variables directly on document element
  document.documentElement.style.setProperty('--theme-primary', theme.primary);
  document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
  document.documentElement.style.setProperty('--theme-accent', theme.accent);
  
  // Also update base theme colors for fallback
  document.documentElement.style.setProperty('--primary', theme.primary);
  document.documentElement.style.setProperty('--secondary', theme.secondary);
  document.documentElement.style.setProperty('--accent', theme.accent);
};

// Load and apply theme on app initialization
export const initializeTheme = () => {
  // On app load, read active_theme or preview_theme from localStorage and call applyTheme()
  const savedTheme = localStorage.getItem('active_theme') || 'blush-rose';
  const savedPreview = localStorage.getItem('preview_theme');

  if (savedPreview) {
    applyTheme(savedPreview);
  } else {
    applyTheme(savedTheme);
  }
};

// Get theme by ID
export const getThemeById = (themeId: string) => {
  return themes.find(t => t.id === themeId);
};