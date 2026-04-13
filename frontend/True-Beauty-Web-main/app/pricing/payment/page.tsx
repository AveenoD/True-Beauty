'use client';

import { useState, useEffect } from 'react';
import ThemeSelector from '../../../components/ThemeSelector';
import { ArrowLeft, CreditCard, Shield, Lock, Check } from 'lucide-react';
import Link from 'next/link';

export default function PaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    const plan = localStorage.getItem('selectedPlan') || 'Professional';
    setSelectedPlan(plan);
    
    const addons = localStorage.getItem('selectedAddons');
    if (addons) {
      setSelectedAddons(JSON.parse(addons));
    }
    
    const data = localStorage.getItem('subscriptionData');
    if (data) {
      setSubscriptionData(JSON.parse(data));
    }
  }, []);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.substring(0, 16);
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    setCardDetails(prev => ({ ...prev, number: value }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    setCardDetails(prev => ({ ...prev, expiry: value }));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    setCardDetails(prev => ({ ...prev, cvv: value }));
  };

  const calculateTotal = () => {
    const planPrices: Record<string, number> = {
      'Starter': 999,
      'Professional': 2499,
      'Enterprise': 4999
    };
    
    const planPrice = planPrices[selectedPlan] || 0;
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
    
    return planPrice + addonsTotal;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      localStorage.setItem('paymentCompleted', 'true');
      window.location.href = '/pricing/success';
    }, 3000);
  };

  const planPrices: Record<string, number> = {
    'Starter': 999,
    'Professional': 2499,
    'Enterprise': 4999
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 via-white to-purple-50/30 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/pricing/documents" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800">Secure Payment</h1>
              <p className="text-gray-600 mt-1">Complete your subscription with secure payment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <form onSubmit={handlePayment} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 border-2 rounded-xl text-center transition-colors ${
                          paymentMethod === 'card'
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-200 hover:border-rose-300'
                        }`}
                      >
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <span className="font-medium text-gray-800">Credit/Debit Card</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-4 border-2 rounded-xl text-center transition-colors ${
                          paymentMethod === 'upi'
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-200 hover:border-rose-300'
                        }`}
                      >
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="font-medium text-gray-800">UPI</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('netbanking')}
                        className={`p-4 border-2 rounded-xl text-center transition-colors ${
                          paymentMethod === 'netbanking'
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-200 hover:border-rose-300'
                        }`}
                      >
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="font-medium text-gray-800">Net Banking</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Payment Form */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={cardDetails.number}
                            onChange={handleCardNumberChange}
                            placeholder="1234 5678 9012 3456"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Full name as on card"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={cardDetails.expiry}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV
                          </label>
                          <input
                            type="password"
                            value={cardDetails.cvv}
                            onChange={handleCvvChange}
                            placeholder="123"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI Payment Form */}
                  {paymentMethod === 'upi' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                        required
                      />
                    </div>
                  )}

                  {/* Net Banking Form */}
                  {paymentMethod === 'netbanking' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Bank
                      </label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                        required
                      >
                        <option value="">Choose your bank</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                        <option value="kotak">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}

                  {/* Security Notice */}
                  <div className="bg-rose-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-rose-800 mb-1">Secure Payment</h4>
                        <p className="text-rose-700 text-sm">
                          Your payment information is encrypted and securely processed. We do not store your card details.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-4 px-6 rounded-lg font-medium hover:opacity-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        Pay ₹{calculateTotal()}/month
                        <Lock className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Order Summary */}
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
                  
                  {selectedAddons.map((addon, index) => (
                    <div key={index} className="pb-3 border-b border-gray-100">
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

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">30-day money-back guarantee</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">24/7 customer support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}