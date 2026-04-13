'use client';

import { useState, useEffect } from 'react';
import { themes, applyTheme as applyThemeUtil } from '../utils/themeUtils';

interface ThemeSelectorProps {
  onClose?: () => void;
}

export default function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const [currentTheme, setCurrentTheme] = useState<string>('blush-rose');
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [purchasedThemes, setPurchasedThemes] = useState<string[]>(['blush-rose']);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('active_theme') || 'blush-rose';
    const savedPreview = localStorage.getItem('preview_theme');
    const purchased = localStorage.getItem('purchased_themes');
    const themeToPurchase = localStorage.getItem('theme_to_purchase');
    
    if (purchased) {
      setPurchasedThemes(JSON.parse(purchased));
    }
    
    setCurrentTheme(savedTheme);
    
    // Apply the saved theme
    if (savedPreview) {
      setPreviewTheme(savedPreview);
      applyTheme(savedPreview);
    } else {
      applyTheme(savedTheme);
    }
    
    // Dispatch custom event for header update on initial load
    window.dispatchEvent(new Event('themeChanged'));
    
    // If there's a theme to purchase from previous session, redirect to pricing
    if (themeToPurchase && window.location.pathname !== '/pricing') {
      const shouldRedirect = confirm(`You were previewing the ${themes.find(t => t.id === themeToPurchase)?.name} theme. Continue to purchase?`);
      if (shouldRedirect) {
        window.location.href = '/pricing';
      } else {
        localStorage.removeItem('theme_to_purchase');
        // Restore default theme
        applyTheme('blush-rose');
        setCurrentTheme('blush-rose');
        localStorage.setItem('active_theme', 'blush-rose');
      }
    }
  }, []);

  const applyTheme = (themeId: string) => {
    applyThemeUtil(themeId);
  };

  const handlePreview = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme || !theme.isPremium) return;
    
    // Store previous theme for cancel functionality
    localStorage.setItem('previous_theme', currentTheme);
    
    // Set preview theme
    setPreviewTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem('preview_theme', themeId);
    
    // Dispatch custom event for header update
    window.dispatchEvent(new Event('themeChanged'));
    
    console.log(`Previewing theme: ${theme.name}`);
  };

  const handleApply = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    
    // Apply theme immediately across entire website
    setCurrentTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem('active_theme', themeId);
    
    // Clear any preview state
    if (previewTheme) {
      setPreviewTheme(null);
      localStorage.removeItem('preview_theme');
      localStorage.removeItem('previous_theme');
    }
    
    // Dispatch custom event for header update
    window.dispatchEvent(new Event('themeChanged'));
    
    // Show success feedback
    console.log(`Applied theme: ${theme.name}`);
  };

  const handlePurchase = () => {
    if (previewTheme) {
      // Store the theme to be purchased
      localStorage.setItem('theme_to_purchase', previewTheme);
      
      // Navigate to pricing flow to complete purchase
      window.location.href = '/pricing';
      
      console.log(`Initiating purchase for theme: ${themes.find(t => t.id === previewTheme)?.name}`);
    }
  };

  const handleCancelPreview = () => {
    const previousTheme = localStorage.getItem('previous_theme') || 'blush-rose';
    setPreviewTheme(null);
    applyTheme(previousTheme);
    setCurrentTheme(previousTheme);
    localStorage.setItem('active_theme', previousTheme);
    localStorage.removeItem('preview_theme');
    localStorage.removeItem('previous_theme');
    localStorage.removeItem('theme_to_purchase');
    
    // Dispatch custom event for header update
    window.dispatchEvent(new Event('themeChanged'));
    
    console.log('Preview cancelled, reverted to previous theme');
  };

  const currentThemeObj = themes.find(t => t.id === currentTheme);
  const previewThemeObj = previewTheme ? themes.find(t => t.id === previewTheme) : null;

  return (
    <>
      {/* Preview Banner */}
      {previewTheme && previewThemeObj && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white z-50 p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
            <div>
              <span className="font-semibold">You are previewing {previewThemeObj.name}</span>
              <p className="text-sm opacity-90">Purchase to apply permanently</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePurchase}
              className="bg-white text-amber-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <span>Apply & Buy ₹500</span>
            </button>
            <button 
              onClick={handleCancelPreview}
              className="text-white hover:text-gray-200 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Cancel Preview
            </button>
          </div>
        </div>
      )}

      {/* Theme Selector Button - Only show if not controlled externally */}
      {!onClose && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          aria-label="Change theme"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          {previewTheme && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      )}

      {/* Theme Selector Modal */}
      {(isModalOpen || onClose) && (
        <>
          {!onClose && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}></div>}
          <div className={`${onClose ? '' : 'fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none'}`}>
            <div className={`bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl pointer-events-auto ${onClose ? '' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Theme Marketplace</h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    onClose?.();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-2">Preview and purchase premium themes for your SaaS</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {themes.map((theme) => {
                  const isPurchased = purchasedThemes.includes(theme.id);
                  const isApplied = currentTheme === theme.id;
                  const isPreviewing = previewTheme === theme.id;
                  
                  return (
                    <div
                      key={theme.id}
                      className={`relative p-5 rounded-xl border-2 transition-all duration-300 ${
                        (isApplied || isPreviewing) 
                          ? 'border-theme-accent bg-theme-secondary shadow-lg' 
                          : 'border-gray-200 hover:border-theme-primary hover:shadow-md'
                      } ${theme.isPremium && !isPurchased && !isPreviewing ? 'opacity-75' : ''}`}
                    >
                      {/* Theme Preview Colors */}
                      <div className="flex gap-2 mb-4">
                        <div 
                          className="w-8 h-8 rounded-lg border border-gray-300 shadow-sm" 
                          style={{ backgroundColor: theme.primary }}
                          title="Primary Color"
                        />
                        <div 
                          className="w-8 h-8 rounded-lg border border-gray-300 shadow-sm" 
                          style={{ backgroundColor: theme.secondary }}
                          title="Secondary Color"
                        />
                        <div 
                          className="w-8 h-8 rounded-lg border border-gray-300 shadow-sm" 
                          style={{ backgroundColor: theme.accent }}
                          title="Accent Color"
                        />
                      </div>

                      {/* Theme Info */}
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-gray-800">{theme.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            theme.isPremium 
                              ? isPurchased 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {theme.isPremium 
                              ? isPurchased ? 'Purchased' : 'Premium ₹500'
                              : 'Free'
                            }
                          </span>
                          {isApplied && (
                            <span className="px-2 py-1 bg-theme-accent text-white rounded-full text-xs font-medium">
                              Applied
                            </span>
                          )}
                          {isPreviewing && (
                            <span className="px-2 py-1 bg-amber-500 text-white rounded-full text-xs font-medium animate-pulse">
                              Previewing
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {!theme.isPremium || isPurchased ? (
                          <button
                            onClick={() => handleApply(theme.id)}
                            disabled={isApplied}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                              isApplied
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-theme-accent text-white hover:bg-opacity-90 shadow-md hover:shadow-lg'
                            }`}
                          >
                            {isApplied ? 'Applied' : 'Apply'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handlePreview(theme.id)}
                              disabled={isPreviewing}
                              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                isPreviewing
                                  ? 'bg-amber-500 text-white cursor-not-allowed'
                                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg'
                              }`}
                            >
                              {isPreviewing ? 'Previewing' : 'Preview'}
                            </button>
                            <button
                              onClick={handlePurchase}
                              disabled={!isPreviewing}
                              className="py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Buy ₹500
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}