'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader, Phone } from 'lucide-react';

const OTP_STORAGE_KEY = 'tb_otp';
const OTP_PHONE_KEY = 'tb_otp_phone';
const OTP_EXPIRY_KEY = 'tb_otp_expiry';
const OTP_ATTEMPTS_KEY = 'tb_otp_attempts';

// --- DEMO ONLY: Fixed OTP for auto-fill. Replace with real backend OTP later. ---
const DEMO_OTP = '123456';
const DEMO_OTP_AUTOFILL_DELAY_MS = 1500;

function getRandomExpiryMinutes(): number {
  return Math.floor(Math.random() * (5 - 2 + 1) + 2);
}

async function sendOtp(phone: string) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (!/^\d{10}$/.test(phone)) return { success: false, message: 'Please enter a valid 10-digit mobile number' };
  // Demo only: use fixed OTP so auto-fill can verify. Replace with: Math.floor(100000 + Math.random() * 900000).toString()
  const otp = DEMO_OTP;
  const expiryMinutes = getRandomExpiryMinutes();
  const expiryTime = Date.now() + expiryMinutes * 60 * 1000;
  localStorage.setItem(OTP_STORAGE_KEY, otp);
  localStorage.setItem(OTP_PHONE_KEY, phone);
  localStorage.setItem(OTP_EXPIRY_KEY, expiryTime.toString());
  localStorage.setItem(OTP_ATTEMPTS_KEY, '0');
  if (process.env.NODE_ENV === 'development') {
    console.log('[MVP OTP] Phone:', phone, '| OTP:', otp, '| Expires in:', expiryMinutes, 'minutes');
  }
  return { success: true, message: 'OTP sent successfully', expiryMinutes };
}

async function verifyOtp(phone: string, otp: string) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const storedOtp = localStorage.getItem(OTP_STORAGE_KEY);
  const storedPhone = localStorage.getItem(OTP_PHONE_KEY);
  const storedExpiry = localStorage.getItem(OTP_EXPIRY_KEY);
  const attempts = parseInt(localStorage.getItem(OTP_ATTEMPTS_KEY) || '0');
  if (attempts >= 5) return { success: false, message: 'Maximum verification attempts reached. Please request a new OTP.' };
  if (!storedOtp || !storedPhone || !storedExpiry) return { success: false, message: 'OTP expired or invalid. Please request a new OTP.' };
  if (storedPhone !== phone) return { success: false, message: 'Phone number mismatch.' };
  if (Date.now() > parseInt(storedExpiry)) {
    clearOtpData();
    return { success: false, message: 'OTP has expired. Please request a new OTP.' };
  }
  if (storedOtp !== otp) {
    localStorage.setItem(OTP_ATTEMPTS_KEY, (attempts + 1).toString());
    const remaining = 5 - attempts - 1;
    return { success: false, message: remaining > 0 ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'Invalid OTP. Please request a new OTP.' };
  }
  clearOtpData();
  const existingUserJson = localStorage.getItem(`user_${phone}`);
  const existingUser = existingUserJson ? JSON.parse(existingUserJson) : null;
  const isRegistered = existingUser && (existingUser.registered === true || existingUser.role != null);

  if (isRegistered) {
    const token = `mock-jwt-token-${Date.now()}-${phone}`;
    const userData = { id: existingUser.id, phone, createdAt: existingUser.createdAt };
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({ phone, id: userData.id, role: existingUser.role }));
    const existingProfile = (() => {
      try {
        const p = localStorage.getItem('profile');
        return p ? JSON.parse(p) : {};
      } catch { return {}; }
    })();
    const profile = {
      ...existingProfile,
      name: existingUser.name ?? existingProfile.name,
      email: existingUser.email ?? existingProfile.email,
      phone: existingUser.phone ?? existingProfile.phone,
      isAffiliate: existingUser.isAffiliate ?? existingProfile.isAffiliate,
      referralCode: existingUser.referralCode ?? existingProfile.referralCode,
      affiliateStatus: existingUser.affiliateStatus ?? existingProfile.affiliateStatus,
    };
    localStorage.setItem('profile', JSON.stringify(profile));
    if (profile.isAffiliate) localStorage.setItem('isAffiliate', 'true');
    return { success: true, message: 'Login successful!', token, user: { id: userData.id, phone, isNewUser: false } };
  }

  sessionStorage.setItem('register_phone', phone);
  sessionStorage.setItem('register_verified_at', Date.now().toString());
  return { success: true, message: 'OTP verified. Please complete registration.', user: { phone, isNewUser: true } };
}

function clearOtpData() {
  localStorage.removeItem(OTP_STORAGE_KEY);
  localStorage.removeItem(OTP_PHONE_KEY);
  localStorage.removeItem(OTP_EXPIRY_KEY);
  localStorage.removeItem(OTP_ATTEMPTS_KEY);
}

type Step = 'phone' | 'otp';

function getRedirectPath(redirect: string | null): string | null {
  if (!redirect || typeof redirect !== 'string') return null;
  const path = redirect.startsWith('/') ? redirect : `/${redirect}`;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getRedirectPath(searchParams.get('redirect'));
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [seconds, setSeconds] = useState(180);
  const [isExpired, setIsExpired] = useState(false);
  const [demoOtpAutoFilled, setDemoOtpAutoFilled] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const demoAutofillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { clearOtpData(); }, []);
  // If already logged in and came with a redirect (e.g. Join Affiliate), go directly to that page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    if (token && user && redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);
  useEffect(() => () => {
    if (demoAutofillTimeoutRef.current) clearTimeout(demoAutofillTimeoutRef.current);
  }, []);
  useEffect(() => {
    if (seconds > 0 && !isLoading && step === 'otp') {
      const timer = setInterval(() => {
        setSeconds((prev) => (prev <= 1 ? (setIsExpired(true), 0) : prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [seconds, isLoading, step]);

  const validatePhone = (phoneNumber: string): boolean => {
    if (!phoneNumber) { setPhoneError('Mobile number is required'); return false; }
    if (phoneNumber.length !== 10) { setPhoneError('Please enter a valid 10-digit mobile number'); return false; }
    if (!/^\d{10}$/.test(phoneNumber)) { setPhoneError('Mobile number should contain only digits'); return false; }
    setPhoneError('');
    return true;
  };

  const handleSendOtp = async () => {
    setError('');
    if (!validatePhone(phone)) return;
    setIsLoading(true);
    try {
      const response = await sendOtp(phone);
      if (response.success) {
        setStep('otp');
        setOtp('');
        setDemoOtpAutoFilled(false);
        setOtpError('');
        setSeconds((response.expiryMinutes ?? 3) * 60);
        setIsExpired(false);
        // Demo only: auto-fill OTP after short delay. Remove when using real backend OTP.
        if (demoAutofillTimeoutRef.current) clearTimeout(demoAutofillTimeoutRef.current);
        demoAutofillTimeoutRef.current = setTimeout(() => {
          setOtp(DEMO_OTP);
          setDemoOtpAutoFilled(true);
          otpInputRefs.current[5]?.focus();
          demoAutofillTimeoutRef.current = null;
        }, DEMO_OTP_AUTOFILL_DELAY_MS);
      } else {
        setPhoneError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch { setPhoneError('Something went wrong. Please try again.'); } finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setError(''); setOtpError('');
    if (otp.length !== 6) { setOtpError('Please enter complete 6-digit OTP'); return; }
    setIsLoading(true);
    try {
      const response = await verifyOtp(phone, otp);
      if (response.success && response.user) {
        if (response.user.isNewUser) router.push(`/auth/register?phone=${encodeURIComponent(phone)}`);
        else if (response.token) router.push(redirectTo || '/');
        return;
      }
      setOtpError(response.message || 'Invalid OTP. Please try again.');
    } catch { setOtpError('Something went wrong. Please try again.'); } finally { setIsLoading(false); }
  };

  const handleResendOtp = async () => {
    setError(''); setOtpError(''); setOtp('');
    setDemoOtpAutoFilled(false);
    if (!validatePhone(phone)) { setStep('phone'); return; }
    setIsLoading(true);
    try {
      const response = await sendOtp(phone);
      if (response.success) {
        setSeconds((response.expiryMinutes ?? 3) * 60);
        setIsExpired(false);
        // Demo only: re-auto-fill OTP after delay.
        if (demoAutofillTimeoutRef.current) clearTimeout(demoAutofillTimeoutRef.current);
        demoAutofillTimeoutRef.current = setTimeout(() => {
          setOtp(DEMO_OTP);
          setDemoOtpAutoFilled(true);
          otpInputRefs.current[5]?.focus();
          demoAutofillTimeoutRef.current = null;
        }, DEMO_OTP_AUTOFILL_DELAY_MS);
      } else {
        setOtpError(response.message || 'Failed to resend OTP. Please try again.');
      }
    } catch { setOtpError('Something went wrong. Please try again.'); } finally { setIsLoading(false); }
  };

  const handleBackToPhone = () => {
    if (demoAutofillTimeoutRef.current) {
      clearTimeout(demoAutofillTimeoutRef.current);
      demoAutofillTimeoutRef.current = null;
    }
    setStep('phone'); setOtp(''); setOtpError(''); setDemoOtpAutoFilled(false); clearOtpData();
  };

  const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-playfair font-bold text-gray-800 mb-2">{step === 'phone' ? 'Welcome Back' : 'Verify OTP'}</h1>
          <p className="text-gray-600">{step === 'phone' ? 'Sign in with your mobile number' : `Enter the OTP sent to +91 ${phone}`}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-rose-100/80 p-6 md:p-8">
          {step === 'phone' ? (
            <div className="space-y-5">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 font-medium">+91</span></div>
                    <div className="absolute inset-y-0 left-12 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-400" /></div>
                    <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} disabled={isLoading} className={`w-full pl-24 pr-4 py-3 rounded-lg border ${phoneError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-rose-500 focus:border-rose-500'} focus:ring-2 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed`} placeholder="Enter 10 digit mobile number" maxLength={10} aria-invalid={!!phoneError} />
                  </div>
                  {phoneError && <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">{phoneError}</p>}
                  <p className="mt-1 text-xs text-gray-500">We'll send you a 6-digit OTP to verify your number</p>
                </div>

                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>}

                <button type="button" onClick={handleSendOtp} disabled={isLoading || phone.length !== 10} className="w-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 rounded-lg font-medium hover:opacity-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center gap-2">
                  {isLoading ? <><Loader className="w-5 h-5 animate-spin" />Sending OTP...</> : 'Send OTP'}
                </button>
              </div>
          ) : (
            <div className="space-y-5">
              <button type="button" onClick={handleBackToPhone} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />Change number
              </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                  <div className="flex gap-2 justify-center">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <input key={index} ref={(el) => { otpInputRefs.current[index] = el; }} type="text" inputMode="numeric" maxLength={1} value={otp[index] || ''} onChange={(e) => {
                        const inputValue = e.target.value.replace(/\D/g, '').slice(0, 1);
                        if (inputValue && !/^\d$/.test(inputValue)) return;
                        const newValue = otp.split('');
                        newValue[index] = inputValue;
                        const updatedValue = newValue.join('').slice(0, 6);
                        setOtp(updatedValue);
                        if (inputValue && index < 5) otpInputRefs.current[index + 1]?.focus();
                      }} onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) otpInputRefs.current[index - 1]?.focus();
                      }} onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        if (pastedData.length === 6) { setOtp(pastedData); otpInputRefs.current[5]?.focus(); }
                      }} disabled={isLoading} className={`w-12 h-12 text-center text-lg font-semibold rounded-lg border ${otpError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-rose-500 focus:border-rose-500'} focus:ring-2 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed`} aria-label={`OTP digit ${index + 1}`} />
                    ))}
                  </div>
                  {otpError && <p className="mt-2 text-sm text-red-600 text-center" role="alert">{otpError}</p>}
                  {demoOtpAutoFilled && (
                    <p className="mt-1.5 text-xs text-gray-500 text-center">Demo OTP auto-filled for convenience.</p>
                  )}
                </div>

                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>}

                {isExpired || seconds === 0 ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Didn't receive OTP?</p>
                    <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Resend OTP</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Resend OTP in <span className="font-semibold text-rose-600">{formatTime(seconds)}</span></p>
                  </div>
                )}

                <button type="button" onClick={handleVerifyOtp} disabled={isLoading || otp.length !== 6} className="w-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-3 rounded-lg font-medium hover:opacity-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center gap-2">
                  {isLoading ? <><Loader className="w-5 h-5 animate-spin" />Verifying...</> : 'Verify OTP'}
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-10">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
