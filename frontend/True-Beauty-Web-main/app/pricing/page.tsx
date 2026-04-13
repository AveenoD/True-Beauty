'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Check, ArrowRight, Star, Users, Zap, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getThemeById } from '../../utils/themeUtils';

export default function PricingPage() {
  const [themeToPurchase, setThemeToPurchase] = useState<string | null>(null);

  useEffect(() => {
    const themePurchase = localStorage.getItem('theme_to_purchase');
    // Check if user is coming to purchase a theme
    if (themePurchase) {
      setThemeToPurchase(themePurchase);
    }
  }, []);

  const plans = [
    {
      name: "Starter",
      price: "₹999",
      period: "/month",
      description: "Perfect for individuals getting started",
      features: [
        "Up to 100 products",
        "Basic analytics dashboard",
        "Email support",
        "Standard templates",
        "1GB storage"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "₹1,499",
      period: "/month",
      description: "Ideal for growing businesses",
      features: [
        "Up to 1,000 products",
        "Advanced analytics & reporting",
        "Priority email & chat support",
        "Custom templates",
        "10GB storage",
        "API access",
        "Multi-user accounts"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "₹1,999",
      period: "/month",
      description: "For large scale operations",
      features: [
        "Unlimited products",
        "Real-time analytics",
        "24/7 dedicated support",
        "White-label customization",
        "Unlimited storage",
        "Full API access",
        "Unlimited users",
        "Custom integrations"
      ],
      popular: false
    }
  ];

  const handleSelectPlan = (planName: string) => {
    localStorage.setItem('selectedPlan', planName);
    
    // If user is purchasing a theme, store it for later processing
    if (themeToPurchase) {
      localStorage.setItem('theme_purchase_in_progress', themeToPurchase);
    }
    
    window.location.href = '/pricing/subscribe';
  };

  const getThemeName = (themeId: string) => {
    const theme = getThemeById(themeId);
    return theme ? theme.name : 'Premium Theme';
  };

  return (
    <div className="min-h-screen md:mt-5 bg-gradient-to-b from-rose-50/30 via-white to-purple-50/30">
      <Header />
      <main className="pt-24 md:pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-6 md:mb-4">
            <Link href="/" className="inline-flex items-center gap-2 p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to home</span>
            </Link>
            <Link href="/" className="hidden md:inline-flex lg:hidden items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to home</span>
            </Link>
            <Link href="/" className="hidden lg:inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Back to home</span>
            </Link>
          </div>
          {/* Theme Purchase Banner */}
          {themeToPurchase && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-8 text-white text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <h2 className="text-2xl font-bold">Theme Purchase</h2>
              </div>
              <p className="text-lg mb-2">You're purchasing the <span className="font-bold">{getThemeName(themeToPurchase)}</span> theme</p>
              <p className="opacity-90">Select a plan below to complete your purchase</p>
            </div>
          )}

          {/* Hero Section */}
          <div className={`text-center mb-16 ${themeToPurchase ? 'mt-8' : 'mt-6 md:mt-0'}`}>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-800 mb-4">
              {themeToPurchase ? 'Complete Your Theme Purchase' : 'Choose Your Perfect Plan'}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {themeToPurchase 
                ? 'Select a subscription plan to unlock your premium theme' 
                : 'Scale your beauty business with our powerful e-commerce solutions'}
            </p>
          </div>

          {/* Plans Grid - 2-col on tablet (768-1024px), 3-col on desktop; Professional full-width on top for tablet */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16 items-stretch">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative flex flex-col bg-white rounded-2xl border-2 p-6 md:p-8 transition-all duration-300 hover:shadow-xl min-w-0 ${
                  plan.popular 
                    ? 'border-rose-500 shadow-lg md:col-span-2 md:order-first lg:col-span-1 lg:order-none' 
                    : 'border-gray-200 hover:border-rose-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-rose-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6 md:mb-8 flex-1 flex flex-col">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm md:text-base">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl md:text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 ml-1 text-base md:text-lg">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6 md:mb-8 min-w-0">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm md:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors shrink-0 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white hover:opacity-95'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>

          {/* Features Section */}
          <div className="bg-white rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-playfair font-bold text-center text-gray-800 mb-12">
              Everything You Need to Succeed
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Lightning Fast</h3>
                <p className="text-gray-600">Optimized performance for the best user experience</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure & Reliable</h3>
                <p className="text-gray-600">Enterprise-grade security for your business data</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">24/7 Support</h3>
                <p className="text-gray-600">Dedicated support team ready to help you succeed</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}