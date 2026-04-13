'use client';

import { useState, useEffect } from 'react';
import ThemeSelector from '../../../components/ThemeSelector';
import { ArrowLeft, Check, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  selected: boolean;
  quantity: number;
}

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([
    {
      id: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Detailed insights and reporting dashboard',
      price: 299,
      period: '/month',
      selected: false,
      quantity: 1
    },
    {
      id: 'custom-domain',
      name: 'Custom Domain',
      description: 'Professional custom domain setup',
      price: 199,
      period: '/month',
      selected: false,
      quantity: 1
    },
    {
      id: 'priority-support',
      name: '24/7 Priority Support',
      description: 'Round-the-clock dedicated support',
      price: 499,
      period: '/month',
      selected: false,
      quantity: 1
    },
    {
      id: 'additional-storage',
      name: 'Extra Storage',
      description: 'Additional 100GB storage space',
      price: 99,
      period: '/month',
      selected: false,
      quantity: 1
    },
    {
      id: 'marketing-tools',
      name: 'Marketing Suite',
      description: 'Email campaigns and promotional tools',
      price: 399,
      period: '/month',
      selected: false,
      quantity: 1
    },
    {
      id: 'mobile-app',
      name: 'Mobile App',
      description: 'Dedicated mobile application',
      price: 599,
      period: '/month',
      selected: false,
      quantity: 1
    }
  ]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    const plan = localStorage.getItem('selectedPlan') || 'Professional';
    setSelectedPlan(plan);
    const data = localStorage.getItem('subscriptionData');
    if (data) {
      setSubscriptionData(JSON.parse(data));
    }
  }, []);

  const toggleAddon = (addonId: string) => {
    setAddons(prev => prev.map(addon => 
      addon.id === addonId 
        ? { ...addon, selected: !addon.selected } 
        : addon
    ));
  };

  const updateQuantity = (addonId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setAddons(prev => prev.map(addon => 
      addon.id === addonId 
        ? { ...addon, quantity: newQuantity } 
        : addon
    ));
  };

  const calculateTotal = () => {
    const planPrices: Record<string, number> = {
      'Starter': 999,
      'Professional': 1499,
      'Enterprise': 1999
    };
    
    const planPrice = planPrices[selectedPlan] || 0;
    const addonsTotal = addons
      .filter(addon => addon.selected)
      .reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
    
    return planPrice + addonsTotal;
  };

  const handleContinue = () => {
    const selectedAddons = addons.filter(addon => addon.selected);
    localStorage.setItem('selectedAddons', JSON.stringify(selectedAddons));
    window.location.href = '/pricing/documents';
  };

  const planPrices: Record<string, number> = {
    'Starter': 999,
    'Professional': 1499,
    'Enterprise': 1999
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 via-white to-purple-50/30 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/pricing/subscribe" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800">Customize Your Plan</h1>
              <p className="text-gray-600 mt-1">Add optional features to enhance your {selectedPlan} experience</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Addons List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Available Add-ons</h2>
                
                <div className="space-y-6">
                  {addons.map((addon) => (
                    <div key={addon.id} className="border border-gray-200 rounded-xl p-6 hover:border-rose-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-800">{addon.name}</h3>
                            <span className="text-sm font-medium text-rose-500">₹{addon.price}{addon.period}</span>
                          </div>
                          <p className="text-gray-600 mb-4">{addon.description}</p>
                          
                          {addon.selected && (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(addon.id, addon.quantity - 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-rose-500 hover:text-rose-500 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-medium">{addon.quantity}</span>
                              <button
                                onClick={() => updateQuantity(addon.id, addon.quantity + 1)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-rose-500 hover:text-rose-500 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => toggleAddon(addon.id)}
                          className={`ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            addon.selected
                              ? 'bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] border-[#FF0066]'
                              : 'border-gray-300 hover:border-rose-500'
                          }`}
                        >
                          {addon.selected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-32">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-gray-800">{selectedPlan} Plan</p>
                      <p className="text-gray-600">₹{planPrices[selectedPlan]}/mo</p>
                    </div>
                    <p className="text-sm text-gray-500">Base subscription</p>
                  </div>
                  
                  {addons.filter(addon => addon.selected).map(addon => (
                    <div key={addon.id} className="pb-3 border-b border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium text-gray-800">{addon.name}</p>
                        <p className="text-gray-600">
                          ₹{addon.price * addon.quantity}/mo
                          {addon.quantity > 1 && <span className="text-xs text-gray-500 ml-1">(x{addon.quantity})</span>}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">{addon.description}</p>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
                    <p className="text-lg font-semibold text-gray-800">Total Monthly</p>
                    <p className="text-2xl font-bold text-rose-500">₹{calculateTotal()}/mo</p>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-rose-50 rounded-lg">
                  <p className="text-sm text-rose-700">
                    <strong>Billed monthly</strong> • Cancel anytime
                  </p>
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 px-6 rounded-lg font-medium hover:opacity-95 transition-colors flex items-center justify-center gap-2"
                >
                  Continue to Documents
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}