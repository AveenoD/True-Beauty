'use client';

import { useState, useEffect } from 'react';
import ThemeSelector from '../../../components/ThemeSelector';
import { CheckCircle, ArrowRight, Calendar, User, Building } from 'lucide-react';
import Link from 'next/link';
import { getThemeById, applyTheme as applyThemeUtil } from '../../../utils/themeUtils';

export default function SuccessPage() {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [themePurchased, setThemePurchased] = useState<string | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('subscriptionData');
    const plan = localStorage.getItem('selectedPlan') || 'Professional';
    const addons = localStorage.getItem('selectedAddons');
    const themePurchase = localStorage.getItem('theme_purchase_in_progress');
    
    if (data) setSubscriptionData(JSON.parse(data));
    setSelectedPlan(plan);
    if (addons) setSelectedAddons(JSON.parse(addons));
    
    // Handle theme purchase
    if (themePurchase) {
      setThemePurchased(themePurchase);
      
      // Add theme to purchased themes
      const purchasedThemes = JSON.parse(localStorage.getItem('purchased_themes') || '["blush-rose"]');
      if (!purchasedThemes.includes(themePurchase)) {
        purchasedThemes.push(themePurchase);
        localStorage.setItem('purchased_themes', JSON.stringify(purchasedThemes));
      }
      
      // Set as active theme
      localStorage.setItem('active_theme', themePurchase);
      
      // Apply the theme immediately
      applyThemeUtil(themePurchase);
      
      // Clean up theme purchase data
      localStorage.removeItem('theme_purchase_in_progress');
      localStorage.removeItem('theme_to_purchase');
    }
    
    // Clear the flow data after success
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('subscriptionData');
    localStorage.removeItem('selectedAddons');
    localStorage.removeItem('uploadedDocuments');
    localStorage.removeItem('paymentCompleted');
  }, []);

  const planPrices: Record<string, number> = {
    'Starter': 999,
    'Professional': 2499,
    'Enterprise': 4999
  };

  const calculateTotal = () => {
    const planPrice = planPrices[selectedPlan] || 0;
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
    return planPrice + addonsTotal;
  };

  const getThemeName = (themeId: string) => {
    const theme = getThemeById(themeId);
    return theme ? theme.name : 'Premium Theme';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/30 via-white to-emerald-50/30 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>

          {/* Success Message */}
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-800 mb-4">
            {themePurchased ? 'Theme Purchase Successful!' : 'Welcome to True Beauty!'}
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            {themePurchased 
              ? `Your ${getThemeName(themePurchased)} theme has been successfully purchased and activated!` 
              : `Your ${selectedPlan} subscription has been successfully activated. You're now ready to start building your beauty business.`}
          </p>

          {/* Theme Purchase Success */}
          {themePurchased && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 mb-8 text-white text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h2 className="text-2xl font-bold">Premium Theme Unlocked!</h2>
              </div>
              <p className="text-xl mb-2">{getThemeName(themePurchased)} is now active across your entire website</p>
              <p className="opacity-90">Enjoy your new premium theme experience</p>
            </div>
          )}

          {/* Subscription Details */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-12 text-left">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {themePurchased ? 'Purchase Details' : 'Subscription Details'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-4 pb-6 mb-6 border-b border-gray-200 md:border-b-0 md:pb-0 md:mb-0">
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Account Information</h3>
                  <p className="text-gray-600">{subscriptionData?.fullName || 'N/A'}</p>
                  <p className="text-gray-600">{subscriptionData?.email || 'N/A'}</p>
                  <p className="text-gray-600">{subscriptionData?.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 pb-6 mb-6 border-b border-gray-200 md:border-b-0 md:pb-0 md:mb-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Business Information</h3>
                  <p className="text-gray-600">{subscriptionData?.companyName || 'N/A'}</p>
                  {subscriptionData?.website && (
                    <p className="text-gray-600">{subscriptionData.website}</p>
                  )}
                  <p className="text-gray-600 capitalize">{subscriptionData?.businessType || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 pb-6 mb-6 border-b border-gray-200 md:border-b-0 md:pb-0 md:mb-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Subscription Plan</h3>
                  <p className="text-2xl font-bold text-rose-500">{selectedPlan}</p>
                  <p className="text-gray-600">₹{calculateTotal()}/month</p>
                  {themePurchased && (
                    <p className="text-gray-600 mt-2">Includes: {getThemeName(themePurchased)} Theme</p>
                  )}
                  {subscriptionData?.startDate && (
                    <p className="text-gray-600">Starts: {new Date(subscriptionData.startDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-4 md:border-b-0 md:pb-0 md:mb-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Add-ons Included</h3>
                  {selectedAddons.length > 0 ? (
                    <ul className="text-gray-600 space-y-1">
                      {selectedAddons.map((addon, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {addon.name} {addon.quantity > 1 && `(x${addon.quantity})`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No add-ons selected</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800 mb-2">What's Next?</h4>
                  <ul className="text-green-700 space-y-1 text-sm">
                    <li>• You'll receive a welcome email with setup instructions</li>
                    <li>• Your dashboard will be ready in the next 24 hours</li>
                    <li>• Our onboarding team will contact you within 2 business days</li>
                    <li>• Start adding your products and customizing your store</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 px-8 rounded-lg font-medium hover:opacity-95 transition-colors"
            >
              {themePurchased ? 'See Your New Theme' : 'Go to Dashboard'}
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            {!themePurchased && (
              <Link
                href="/"
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-8 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </Link>
            )}
          </div>

          {/* Support Information */}
          <div className="mt-12 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Our support team is here to help you get started. Reach out to us anytime!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600 justify-center items-center">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@truebeauty.com
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +91 98765 43210
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}