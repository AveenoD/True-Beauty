'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ThemeSelector from './ThemeSelector';
import Link from 'next/link';
import { Search, User, ShoppingBag, Menu, X, Grid3x3, Heart, ChevronRight, ChevronDown, ChevronLeft, MapPin, Package, LogOut, Palette, IndianRupee, Users, TicketPercent } from 'lucide-react';
import { getThemeById } from '../utils/themeUtils';
import { categories } from '../utils/categories';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [categoriesMenuOpen, setCategoriesMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const [activeCategory, setActiveCategory] = useState<number | null>(categories[0]?.id || null);
  const [mobileOpenCategory, setMobileOpenCategory] = useState<number | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [currentThemeName, setCurrentThemeName] = useState<string>('Blush Rose');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) setHeaderHeight(header.offsetHeight);
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('scroll', updateHeaderHeight);
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('scroll', updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    const profileData = localStorage.getItem('profile');
    setIsLoggedIn(!!authToken);
    if (authToken && userData) {
      const parsedUser = JSON.parse(userData);
      const parsedProfile = profileData ? JSON.parse(profileData) : null;
      setUser({ ...parsedUser, ...parsedProfile });
      setIsAffiliate(!!localStorage.getItem('isAffiliate') || !!parsedProfile?.isAffiliate);
    } else {
      setUser(null);
      setIsAffiliate(false);
    }

    // Function to update theme name
    const updateThemeName = () => {
      const savedTheme = localStorage.getItem('active_theme') || 'blush-rose';
      const savedPreview = localStorage.getItem('preview_theme');
      const themeId = savedPreview || savedTheme;
      const theme = getThemeById(themeId);
      if (theme) {
        setCurrentThemeName(theme.name);
      }
    };

    updateThemeName();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'active_theme' || e.key === 'preview_theme') {
        updateThemeName();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    const handleThemeChange = () => {
      updateThemeName();
    };
    window.addEventListener('themeChanged', handleThemeChange);
    
    const handleFocus = () => {
      updateThemeName();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pathname]);

  useEffect(() => {
    if (categoriesMenuOpen && categories.length > 0) setActiveCategory(categories[0].id);
  }, [categoriesMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && categoriesMenuOpen) setCategoriesMenuOpen(false); };
    if (categoriesMenuOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [categoriesMenuOpen]);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const getCartCount = () => {
    if (typeof window === 'undefined') return 0;
    try {
      const cart = JSON.parse(localStorage.getItem('tb_cart') || '[]');
      return cart.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0);
    } catch { return 0; }
  };

  useEffect(() => {
    setCartCount(getCartCount());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) setProfileDropdownOpen(false);
    };
    if (profileDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    sessionStorage.clear();
    window.location.href = '/';
  };

  const activeCategoryData = categories.find(cat => cat.id === activeCategory);
  const displayInitials =
    user?.name
      ? user.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-2 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-2 md:py-3 border-rose-200' : 'bg-white/80 py-2.5 sm:py-3 md:py-4 lg:py-5 border-rose-200'}`}>
        <div className="w-full pl-8 pr-8 md:pl-16 md:pr-16">
          <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-3 lg:gap-4">
            <Link href="/" className="flex items-center gap-0 flex-shrink-0 min-w-0 max-w-[200px] sm:max-w-[250px] md:max-w-[300px]">
              <img src="/images/logo/trueBeauty-Logo.png" alt="True Beauty Logo" width={120} height={36} className="object-contain w-[90px] h-[28px] sm:w-[110px] sm:h-[34px] md:w-[130px] md:h-[40px] lg:w-[140px] lg:h-[42px] -mr-2 sm:-mr-3" />
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-playfair font-bold text-gray-800 -ml-2 sm:-ml-3">True Beauty</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-3 lg:space-x-6 xl:space-x-8 flex-1 justify-start max-w-2xl mx-2 lg:mx-4 min-w-0">
              <div className="relative w-full max-w-md">
                <input type="text" placeholder="Search..." className="w-full px-4 lg:px-5 py-2 lg:py-2.5 pl-10 lg:pl-11 rounded-full border-2 border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all bg-white shadow-sm text-sm lg:text-base" />
                <Search className="absolute left-3 lg:left-4 top-2.5 lg:top-3 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
              </div>
            </nav>
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 lg:gap-3 xl:gap-4 flex-shrink-0">
            <div className="hidden lg:flex items-center space-x-0.5 lg:space-x-1 xl:space-x-1.5">
              {isLoggedIn && user ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center px-1.5 lg:px-2 xl:px-3 py-1 lg:py-1.5 xl:py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="User menu"
                  >
                    <div className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-[10px] lg:text-xs xl:text-sm font-semibold flex-shrink-0">
                      {displayInitials}
                    </div>
                  </button>
                  {profileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setProfileDropdownOpen(false)} aria-hidden="true" />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-semibold flex-shrink-0">{displayInitials}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'User'}</p>
                              <p className="text-xs text-gray-600 truncate">{user?.email || `+91 ${user?.phone || ''}`}</p>
                            </div>
                          </div>
                        </div>
                        <nav className="py-2">
                          <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><User className="w-5 h-5 flex-shrink-0" /><span>Personal Info</span></Link>
                          <button type="button" onClick={() => { setProfileDropdownOpen(false); window.location.href = '/profile#addresses'; }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"><MapPin className="w-5 h-5 flex-shrink-0" /><span>Saved Addresses</span></button>
                          <Link href="/profile/orders" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><Package className="w-5 h-5 flex-shrink-0" /><span>Orders</span></Link>
                          <Link href="/profile/my-coupons" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><TicketPercent className="w-5 h-5 flex-shrink-0" /><span>My Coupons</span></Link>
                          <Link href="/profile/wishlist" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><Heart className="w-5 h-5 flex-shrink-0" /><span>Wishlist</span></Link>
                          <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"><LogOut className="w-5 h-5 flex-shrink-0" /><span>Logout</span></button>
                        </nav>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login" className="px-2 lg:px-4 py-1.5 lg:py-2 text-gray-700 hover:text-pink-500 transition-colors font-medium text-sm lg:text-base"><User className="inline mr-2 w-4 h-4" />Login</Link>
              )}
              <div className="relative">
                <button type="button" onClick={() => setCategoriesMenuOpen(!categoriesMenuOpen)} className="px-1.5 lg:px-2 xl:px-4 py-1 lg:py-1.5 xl:py-2 text-gray-700 hover:text-pink-500 transition-colors font-medium flex items-center gap-1 lg:gap-1.5 xl:gap-2 text-xs lg:text-sm xl:text-base" aria-expanded={categoriesMenuOpen}>
                  <Grid3x3 className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4" /><span className="hidden xl:inline">Categories</span>
                </button>
                {categoriesMenuOpen && (
                  <>
                    <div className="fixed inset-0 bg-black/20 z-40" style={{ top: `${headerHeight}px` }} onClick={() => setCategoriesMenuOpen(false)} aria-hidden="true" />
                    <div ref={menuRef} className="fixed left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 overflow-hidden" style={{ top: `${headerHeight}px` }}>
                      <div className="container mx-auto px-4 md:px-8">
                        <div className="hidden lg:block py-6">
                          <div className="flex items-start gap-8">
                            <div className="w-64 flex-shrink-0 border-r border-gray-200 pr-6">
                              <div className="space-y-1">
                                {categories.map((category) => (
                                  <button
                                    key={category.id}
                                    type="button"
                                    onMouseEnter={() => setActiveCategory(category.id)}
                                    onClick={() => {
                                      router.push(`/?category=${category.slug}#products`);
                                      setCategoriesMenuOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${activeCategory === category.id ? 'bg-rose-50 text-pink-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                                  >
                                    {category.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {activeCategoryData && (
                              <div className="flex-1 py-2">
                                <div className="grid grid-cols-3 gap-8">
                                  {[0, 1, 2].map((colIndex) => {
                                    const itemsPerColumn = Math.ceil(activeCategoryData.items.length / 3);
                                    const startIndex = colIndex * itemsPerColumn;
                                    const endIndex = Math.min(startIndex + itemsPerColumn, activeCategoryData.items.length);
                                    const columnItems = activeCategoryData.items.slice(startIndex, endIndex);
                                    return (
                                      <div key={colIndex} className="space-y-1">
                                        {columnItems.map((item) => (
                                          <Link
                                            key={item.id}
                                            href={`/?category=${activeCategoryData.slug}&subcategory=${item.slug}#products`}
                                            onClick={() => setCategoriesMenuOpen(false)}
                                            className="block w-full text-left px-2 py-1.5 text-sm text-gray-600 hover:text-pink-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                          >
                                            {item.name}
                                          </Link>
                                        ))}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                  <Link
                                    href={activeCategoryData.slug === 'offers' ? '/offers' : `/category/${activeCategoryData.slug}`}
                                    onClick={() => setCategoriesMenuOpen(false)}
                                    className="inline-flex items-center text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors cursor-pointer"
                                  >
                                    View All {activeCategoryData.name}
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="lg:hidden h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto py-4 pb-6">
                          <div className="flex items-center justify-between px-2 mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Browse Categories</h2>
                            <button
                              type="button"
                              onClick={() => setCategoriesMenuOpen(false)}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                              aria-label="Close categories"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="space-y-2 px-2">
                            {categories.map((category) => (
                              <div key={category.id} className="border border-gray-100 rounded-xl bg-white/80 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMobileOpenCategory(
                                      mobileOpenCategory === category.id ? null : category.id
                                    )
                                  }
                                  className="w-full flex items-center justify-between px-4 py-3 text-left text-base font-medium text-gray-800 active:bg-gray-100"
                                  aria-expanded={mobileOpenCategory === category.id}
                                >
                                  <span>{category.name}</span>
                                  <ChevronRight
                                    className={`w-4 h-4 text-gray-400 transition-transform ${
                                      mobileOpenCategory === category.id ? 'rotate-90' : ''
                                    }`}
                                  />
                                </button>
                                {mobileOpenCategory === category.id && (
                                  <div className="border-t border-gray-100 bg-gray-50/60">
                                    <div className="flex flex-col py-2">
                                      {category.items.map((item) => (
                                        <Link
                                          key={item.id}
                                          href={`/?category=${category.slug}&subcategory=${item.slug}#products`}
                                          onClick={() => setCategoriesMenuOpen(false)}
                                          className="w-full text-left px-5 py-2.5 text-sm text-gray-700 hover:text-pink-600 hover:bg-rose-50 transition-colors"
                                        >
                                          {item.name}
                                        </Link>
                                      ))}
                                      <Link
                                        href={category.slug === 'offers' ? '/offers' : `/category/${category.slug}`}
                                        onClick={() => setCategoriesMenuOpen(false)}
                                        className="w-full text-left mt-1 px-5 py-3 text-sm font-semibold text-pink-600 hover:text-pink-700 hover:bg-pink-50 border-t border-pink-100 transition-colors"
                                      >
                                        View All {category.name}
                                      </Link>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setIsThemeModalOpen(true)}
                className="px-1.5 lg:px-2 xl:px-4 py-1 lg:py-1.5 xl:py-2 text-gray-700 hover:text-pink-500 transition-colors font-medium text-xs lg:text-sm xl:text-base whitespace-nowrap flex items-center gap-1.5 lg:gap-2"
                title="Color Theme"
              >
                <Palette className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-4 xl:h-4" />Color Theme
              </button>
              <Link href="/pricing" className="px-1.5 lg:px-2 xl:px-4 py-1 lg:py-1.5 xl:py-2 text-gray-700 hover:text-pink-500 transition-colors font-medium text-xs lg:text-sm xl:text-base whitespace-nowrap flex items-center gap-1.5 lg:gap-2"><IndianRupee className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-4 xl:h-4" />Pricing</Link>
              <Link href={!isLoggedIn ? '/login?redirect=' + encodeURIComponent('/affiliate/apply') : isAffiliate ? '/affiliate' : '/affiliate/apply'} className="px-1.5 lg:px-2 xl:px-4 py-1 lg:py-1.5 xl:py-2 text-gray-700 hover:text-pink-500 transition-colors font-medium text-xs lg:text-sm xl:text-base whitespace-nowrap hidden xl:flex items-center gap-1.5 lg:gap-2"><Users className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-4 xl:h-4" />{isAffiliate ? 'Affiliate' : 'Join Affiliate'}</Link>
              <Link href="/cart" className="relative flex items-center p-1 lg:p-1.5 xl:p-2">
                <ShoppingBag className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-gray-700 hover:text-pink-500 cursor-pointer transition-colors" />
                <span className="absolute -top-0.5 -right-0.5 lg:-top-1 lg:-right-1 xl:-top-2 xl:-right-2 bg-pink-500 text-white text-[9px] lg:text-[10px] xl:text-xs rounded-full w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 flex items-center justify-center min-w-[14px] lg:min-w-[16px] xl:min-w-[20px]">{cartCount}</span>
              </Link>
            </div>
            </div>
            <button
              className="lg:hidden p-1.5 sm:p-2 text-gray-700 flex-shrink-0"
              onClick={() => {
                if (isMenuOpen) {
                  setIsMobileCategoriesOpen(false);
                }
                setIsMenuOpen(!isMenuOpen);
              }}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              ) : (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              )}
            </button>
          </div>
          {isMenuOpen && (
            <div className="lg:hidden mt-3 sm:mt-4 pb-3 sm:pb-4 bg-white/60 backdrop-blur-md rounded-lg border border-white/20">
              {isMobileCategoriesOpen ? (
                <div className="flex flex-col h-full max-h-[70vh]">
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsMobileCategoriesOpen(false)}
                      className="flex items-center gap-1 text-sm font-medium text-gray-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <span className="text-sm font-semibold text-gray-900">Categories</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileCategoriesOpen(false);
                        setIsMenuOpen(false);
                      }}
                      className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto mt-1 space-y-2 px-2 sm:px-3 pb-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="border border-gray-100 rounded-xl bg-white/80 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setMobileOpenCategory(
                              mobileOpenCategory === category.id ? null : category.id
                            )
                          }
                          className="w-full flex items-center justify-between px-4 py-3 text-left text-base font-medium text-gray-800 active:bg-gray-100"
                          aria-expanded={mobileOpenCategory === category.id}
                        >
                          <span>{category.name}</span>
                          <ChevronRight
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              mobileOpenCategory === category.id ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                        {mobileOpenCategory === category.id && (
                          <div className="border-t border-gray-100 bg-gray-50/60">
                            <div className="flex flex-col py-2">
                              {category.items.map((item) => (
                                <Link
                                  key={item.id}
                                  href={`/?category=${category.slug}&subcategory=${item.slug}#products`}
                                  onClick={() => {
                                    setIsMobileCategoriesOpen(false);
                                    setIsMenuOpen(false);
                                  }}
                                  className="w-full text-left px-5 py-2.5 text-sm text-gray-700 hover:text-pink-600 hover:bg-rose-50 transition-colors"
                                >
                                  {item.name}
                                </Link>
                              ))}
                              <Link
                                href={category.slug === 'offers' ? '/offers' : `/category/${category.slug}`}
                                onClick={() => {
                                  setIsMobileCategoriesOpen(false);
                                  setIsMenuOpen(false);
                                }}
                                className="w-full text-left mt-1 px-5 py-3 text-sm font-semibold text-pink-600 hover:text-pink-700 hover:bg-pink-50 border-t border-pink-100 transition-colors"
                              >
                                View All {category.name}
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-1 sm:space-y-2 p-2 sm:p-3">
                  {isLoggedIn && user ? (
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:text-pink-500 hover:bg-white/50 transition-colors font-medium text-sm sm:text-base rounded-md"
                    >
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      Profile
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:text-pink-500 hover:bg-white/50 transition-colors font-medium text-sm sm:text-base rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      Login
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsThemeModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-left text-gray-700 hover:text-pink-500 hover:bg-white/50 transition-colors font-medium text-sm sm:text-base rounded-md"
                  >
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                    Color Theme
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileCategoriesOpen(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:text-pink-500 hover:bg-white/50 transition-colors font-medium text-sm sm:text-base rounded-md"
                  >
                    <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
                    Categories
                  </button>
                  <Link
                    href="/pricing"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:text-pink-500 hover:bg-white/50 transition-colors font-medium text-sm sm:text-base rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                    Pricing
                  </Link>
                  <Link
                    href={!isLoggedIn ? '/login?redirect=' + encodeURIComponent('/affiliate/apply') : isAffiliate ? '/affiliate' : '/affiliate/apply'}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:text-pink-500 hover:bg-white/50 transition-colors font-medium text-sm sm:text-base rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    {isAffiliate ? 'Affiliate' : 'Join Affiliate'}
                  </Link>
                  <Link
                    href="/profile/my-coupons"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:text-pink-500 hover:bg-white/50 transition-colors font-medium text-sm sm:text-base rounded-md"
                  >
                    <TicketPercent className="w-4 h-4 sm:w-5 sm:h-5" />
                    My Coupons
                  </Link>
                  <Link
                    href="/profile/wishlist"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:text-pink-500 hover:bg-white/50 transition-colors font-medium text-sm sm:text-base rounded-md"
                  >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                    Wishlist
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:text-pink-500 hover:bg-white/50 transition-colors font-medium text-sm sm:text-base rounded-md"
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    Cart ({cartCount})
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      
      {/* Theme Selector Modal - Controlled by Header */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setIsThemeModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <ThemeSelector onClose={() => setIsThemeModalOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
