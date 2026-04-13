'use client';

import { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Truck, Package, Check } from 'lucide-react';

const SHIPPING_ADDRESS_KEY = 'tb_shipping_address';
const SHIPPING_DELIVERY_KEY = 'tb_shipping_delivery';

interface Address {
  id?: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export default function ShippingPage() {
  const router = useRouter();
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');
  const [cartItems, setCartItems] = useState<{ id: number; name: string; price: number; image: string; quantity: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    pincode: '',
    city: '',
    state: '',
    address: ''
  });

  const standardShippingCost = 0;
  const expressShippingCost = 99;

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      router.replace('/login');
      return;
    }
    const profileData = localStorage.getItem('profile');
    if (profileData) {
      const profile = JSON.parse(profileData);
      const addrs = profile.addresses || [];
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        const defaultAddr = addrs.find((a: Address) => a.isDefault) || addrs[0];
        setSelectedAddressId(defaultAddr.id || String(0));
        setUseNewAddress(false);
      } else {
        setUseNewAddress(true);
      }
    } else {
      setUseNewAddress(true);
    }
    const cart = JSON.parse(localStorage.getItem('tb_cart') || '[]');
    setCartItems(cart);
  }, [router]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const shippingCost = deliveryOption === 'express' ? expressShippingCost : standardShippingCost;
  const total = subtotal + shippingCost;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (useNewAddress) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.mobile.trim()) newErrors.mobile = 'Mobile is required';
      else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = 'Enter a valid 10-digit mobile';
      if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
      else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
    } else if (!selectedAddressId && savedAddresses.length > 0) {
      newErrors.address = 'Please select an address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    let addressToSave: Address;
    if (useNewAddress) {
      addressToSave = {
        name: formData.name,
        phone: formData.mobile,
        addressLine1: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        isDefault: false
      };
      const profileData = localStorage.getItem('profile');
      const profile = profileData ? JSON.parse(profileData) : {};
      const addrs = profile.addresses || [];
      const newAddr = { ...addressToSave, id: `addr_${Date.now()}`, isDefault: addrs.length === 0 };
      addrs.push(newAddr);
      profile.addresses = addrs;
      localStorage.setItem('profile', JSON.stringify(profile));
    } else {
      const addr = savedAddresses.find((a, idx) => (a.id || String(idx)) === selectedAddressId);
      if (!addr) return;
      addressToSave = addr;
    }
    localStorage.setItem(SHIPPING_ADDRESS_KEY, JSON.stringify(addressToSave));
    localStorage.setItem(SHIPPING_DELIVERY_KEY, deliveryOption);
    setIsSubmitting(false);
    router.push('/cart/payment');
  };

  if (cartItems.length === 0 && typeof window !== 'undefined') {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      return (
        <div className="min-h-screen gradient-bg flex flex-col items-center justify-center pt-24 px-4">
          <Package className="w-16 h-16 text-rose-300 mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add items to your cart to proceed with checkout.</p>
          <Link href="/" className="bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-95 transition-colors">Continue Shopping</Link>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="pt-24 pb-16 px-4 md:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="md:hidden mb-4">
            <Link href="/" className="inline-flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-8">Shipping Details</h1>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Saved addresses */}
              {savedAddresses.length > 0 && !useNewAddress && (
                <section className="bg-white rounded-xl shadow-sm border border-rose-100 p-6">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                    <MapPin className="w-5 h-5 text-rose-500" />
                    Saved Address
                  </h2>
                  <div className="space-y-3">
                    {savedAddresses.map((addr, idx) => {
                      const addrId = addr.id || String(idx);
                      const isSelected = selectedAddressId === addrId;
                      return (
                        <label key={addrId} className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${isSelected ? 'border-rose-500 bg-rose-50/50' : 'border-gray-200 hover:border-rose-200'}`}>
                          <input type="radio" name="address" checked={isSelected} onChange={() => setSelectedAddressId(addrId)} className="mt-1 w-4 h-4 text-rose-500" />
                          <div>
                            <p className="font-medium text-gray-800">{addr.name}</p>
                            <p className="text-sm text-gray-600">{addr.phone}</p>
                            <p className="text-sm text-gray-600 mt-1">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                            <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-rose-500 flex-shrink-0" />}
                        </label>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setUseNewAddress(true)} className="mt-4 text-rose-600 font-medium text-sm hover:text-rose-700">
                    + Add new address
                  </button>
                </section>
              )}

              {/* Add new address form */}
              <section className="bg-white rounded-xl shadow-sm border border-rose-100 p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  {savedAddresses.length > 0 ? 'Add New Address' : 'Delivery Address'}
                </h2>
                {savedAddresses.length > 0 && (
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input type="checkbox" checked={useNewAddress} onChange={(e) => setUseNewAddress(e.target.checked)} className="rounded text-rose-500" />
                    <span className="text-sm text-gray-600">Use a new address</span>
                  </label>
                )}
                {useNewAddress && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full px-4 py-2.5 rounded-lg border ${errors.name ? 'border-red-400' : 'border-gray-200'} focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none`} placeholder="Full name" />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                      <input type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className={`w-full px-4 py-2.5 rounded-lg border ${errors.mobile ? 'border-red-400' : 'border-gray-200'} focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none`} placeholder="10-digit mobile" maxLength={10} />
                      {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                      <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} className={`w-full px-4 py-2.5 rounded-lg border ${errors.address ? 'border-red-400' : 'border-gray-200'} focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none resize-none`} placeholder="Street, building, landmark" />
                      {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                      <input type="text" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} className={`w-full px-4 py-2.5 rounded-lg border ${errors.pincode ? 'border-red-400' : 'border-gray-200'} focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none`} placeholder="6-digit pincode" maxLength={6} />
                      {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={`w-full px-4 py-2.5 rounded-lg border ${errors.city ? 'border-red-400' : 'border-gray-200'} focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none`} placeholder="City" />
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className={`w-full px-4 py-2.5 rounded-lg border ${errors.state ? 'border-red-400' : 'border-gray-200'} focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none`} placeholder="State" />
                      {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                    </div>
                  </div>
                )}
              </section>

              {/* Delivery options */}
              <section className="bg-white rounded-xl shadow-sm border border-rose-100 p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                  <Truck className="w-5 h-5 text-rose-500" />
                  Delivery Option
                </h2>
                <div className="space-y-3">
                  <label className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${deliveryOption === 'standard' ? 'border-rose-500 bg-rose-50/50' : 'border-gray-200 hover:border-rose-200'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="delivery" checked={deliveryOption === 'standard'} onChange={() => setDeliveryOption('standard')} className="w-4 h-4 text-rose-500" />
                      <div>
                        <p className="font-medium text-gray-800">Standard Delivery</p>
                        <p className="text-sm text-gray-600">5-7 business days</p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">FREE</span>
                  </label>
                  <label className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${deliveryOption === 'express' ? 'border-rose-500 bg-rose-50/50' : 'border-gray-200 hover:border-rose-200'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="delivery" checked={deliveryOption === 'express'} onChange={() => setDeliveryOption('express')} className="w-4 h-4 text-rose-500" />
                      <div>
                        <p className="font-medium text-gray-800">Express Delivery</p>
                        <p className="text-sm text-gray-600">2-3 business days</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-800">₹{expressShippingCost}</span>
                  </label>
                </div>
              </section>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <section className="bg-white rounded-xl shadow-sm border border-rose-100 p-6 sticky top-24">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                  <Package className="w-5 h-5 text-rose-500" />
                  Order Summary
                </h2>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-rose-50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity || 1} × ₹{item.price.toFixed(2)}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">₹{((item.quantity || 1) * item.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping ({deliveryOption === 'express' ? 'Express' : 'Standard'})</span>
                    <span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-800 pt-2">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 rounded-lg font-medium hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed transition-colors">
                  {isSubmitting ? 'Processing...' : 'Continue to Payment'}
                </button>
              </section>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

