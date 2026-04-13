'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader, User, Phone, Mail } from 'lucide-react';

const REGISTER_PHONE_EXPIRY_MS = 10 * 60 * 1000; // 10 min

function getPhoneFromClient(): { phone: string; invalidAccess: boolean } {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return { phone: '', invalidAccess: true };
  }
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('phone') ?? '';
  const fromSession = sessionStorage.getItem('register_phone') ?? '';
  const verifiedAt = sessionStorage.getItem('register_verified_at');
  const resolvedPhone = (fromQuery || fromSession || '').replace(/\D/g, '').slice(0, 10);
  if (!resolvedPhone) return { phone: '', invalidAccess: true };
  if (verifiedAt) {
    const parsed = parseInt(verifiedAt, 10);
    if (!Number.isNaN(parsed) && Date.now() - parsed > REGISTER_PHONE_EXPIRY_MS) {
      return { phone: resolvedPhone, invalidAccess: true };
    }
  }
  return { phone: resolvedPhone, invalidAccess: false };
}

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({ fullName: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invalidAccess, setInvalidAccess] = useState(true);

  useEffect(() => {
    const { phone: p, invalidAccess: inv } = getPhoneFromClient();
    setPhone(p);
    setInvalidAccess(inv);
    setMounted(true);
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !phone || phone.length !== 10) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      setIsSubmitting(false);
      return;
    }
    const userId = `user_${Date.now()}`;
    const userPayload = {
      id: userId,
      phone,
      createdAt: new Date().toISOString(),
      role: 'Customer',
      registered: true,
      name: formData.fullName.trim(),
      email: formData.email.trim() || undefined,
    };
    localStorage.setItem(`user_${phone}`, JSON.stringify(userPayload));
    const token = `mock-jwt-token-${Date.now()}-${phone}`;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({ phone, id: userId, role: 'Customer' }));
    const profile = {
      name: formData.fullName.trim(),
      email: formData.email.trim() || '',
      phone,
      addresses: [],
      role: 'Customer',
    };
    localStorage.setItem('profile', JSON.stringify(profile));
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('register_phone');
      sessionStorage.removeItem('register_verified_at');
    }
    setIsSubmitting(false);
    router.push('/profile');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-10">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (invalidAccess) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <p className="text-gray-600 mb-4">Please verify your mobile number via OTP first.</p>
          <Link href="/login" className="text-rose-600 hover:text-rose-700 font-medium">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Complete your registration</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-rose-100/80 p-6 md:p-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (errors.fullName) setErrors({ ...errors, fullName: '' });
                  }}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.fullName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-rose-500 focus:border-rose-500'} focus:ring-2 focus:outline-none transition-all disabled:bg-gray-50`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="mobile"
                  type="tel"
                  value={phone ? `+91 ${phone}` : ''}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Pre-filled from OTP verification</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-rose-500 focus:border-rose-500'} focus:ring-2 focus:outline-none transition-all disabled:bg-gray-50`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.fullName.trim()}
              className="w-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 rounded-lg font-medium hover:opacity-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
