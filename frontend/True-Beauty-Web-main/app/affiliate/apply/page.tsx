'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { ArrowLeft, Loader, User, Phone, Mail, MapPin, FileCheck } from 'lucide-react';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TB';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export default function AffiliateApplyPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; phone?: string; email?: string; id?: string } | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    address: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    const profileData = localStorage.getItem('profile');
    if (!authToken || !userData) {
      router.replace('/login?redirect=' + encodeURIComponent('/affiliate/apply'));
      setAuthChecked(true);
      return;
    }
    const parsed = JSON.parse(userData);
    const profileObj = profileData ? JSON.parse(profileData) : {};
    if (profileObj.isAffiliate && profileObj.affiliateStatus === 'Active') {
      router.replace('/affiliate');
      setAuthChecked(true);
      return;
    }
    setProfile({ ...parsed, ...profileObj });
    setFormData((prev) => ({
      ...prev,
      fullName: profileObj.name ?? parsed.name ?? '',
      mobile: profileObj.phone ?? parsed.phone ?? '',
      email: profileObj.email ?? '',
    }));
    setAuthChecked(true);
  }, [mounted, router]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = 'Full name is required';
    if (!formData.mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email address';
    if (!formData.acceptTerms) e.acceptTerms = 'You must accept the Terms & Conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !profile) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    const referralCode = generateReferralCode();
    const phone = formData.mobile.replace(/\D/g, '').slice(0, 10);
    const userId = profile.id || `user_${Date.now()}`;

    const updatedProfile = {
      ...profile,
      name: formData.fullName.trim(),
      phone: formData.mobile.trim(),
      email: formData.email.trim(),
      address: formData.address.trim() || undefined,
      isAffiliate: true,
      affiliateStatus: 'Active',
      referralCode,
    };
    const updatedUser = {
      ...JSON.parse(localStorage.getItem('user') || '{}'),
      role: 'Affiliate',
    };
    const storedUser = JSON.parse(localStorage.getItem(`user_${phone}`) || '{}');
    const updatedStoredUser = {
      ...storedUser,
      id: storedUser.id || userId,
      phone,
      name: formData.fullName.trim(),
      email: formData.email.trim(),
      role: 'Affiliate',
      isAffiliate: true,
      affiliateStatus: 'Active',
      referralCode,
      registered: true,
    };

    localStorage.setItem('profile', JSON.stringify(updatedProfile));
    localStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('isAffiliate', 'true');
    localStorage.setItem(`user_${phone}`, JSON.stringify(updatedStoredUser));

    setIsSubmitting(false);
    router.replace('/affiliate');
  };

  if (!mounted || !authChecked) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen gradient-bg mt-5">
      <Header />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-8 max-w-xl">
          <Link href="/" className="inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Back to home</span>
          </Link>
          <div className="bg-white/95 border border-rose-100 rounded-2xl shadow-sm p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-2">Join Affiliate Program</h1>
            <p className="text-gray-600 mb-6">Fill in your details to become an affiliate. You’ll get a unique referral code and can start sharing product links.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" /> Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.fullName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-rose-500'} focus:ring-2 focus:outline-none transition-all`}
                  placeholder="Your full name"
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" /> Mobile *
                </label>
                <input
                  type="tel"
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.mobile ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-rose-500'} focus:ring-2 focus:outline-none transition-all`}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
                {errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" /> Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-rose-500'} focus:ring-2 focus:outline-none transition-all`}
                  placeholder="your@email.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" /> Address (optional)
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                  placeholder="Street, city, state, pincode"
                />
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-sm text-gray-700">
                    <FileCheck className="inline w-4 h-4 mr-1" />
                    I accept the Affiliate Program Terms & Conditions and agree to promote products in line with the brand guidelines.
                  </span>
                </label>
                {errors.acceptTerms && <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 rounded-lg font-medium hover:opacity-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? <><Loader className="w-5 h-5 animate-spin" /> Submitting... </> : 'Apply to Join'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
