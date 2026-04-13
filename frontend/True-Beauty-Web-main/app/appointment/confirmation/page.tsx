'use client';

import { useEffect, useState } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type AppointmentParams = {
  appointmentId: string;
  parlourName: string;
  serviceName: string;
  location: string;
  date: string;
  timeSlot: string;
  name: string;
  phone: string;
  paymentMode: string;
};

export default function AppointmentConfirmationPage() {
  const [params, setParams] = useState<AppointmentParams>({
    appointmentId: '',
    parlourName: '',
    serviceName: '',
    location: '',
    date: '',
    timeSlot: '',
    name: '',
    phone: '',
    paymentMode: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    setParams({
      appointmentId: searchParams.get('appointmentId') ?? '',
      parlourName: searchParams.get('parlourName') ?? '',
      serviceName: searchParams.get('serviceName') ?? '',
      location: searchParams.get('location') ?? '',
      date: searchParams.get('date') ?? '',
      timeSlot: searchParams.get('timeSlot') ?? '',
      name: searchParams.get('name') ?? '',
      phone: searchParams.get('phone') ?? '',
      paymentMode: searchParams.get('paymentMode') ?? '',
    });
  }, []);

  const {
    appointmentId,
    parlourName,
    serviceName,
    location,
    date,
    timeSlot,
    name,
    phone,
    paymentMode,
  } = params;

  const hasDetails = Boolean(
    appointmentId || parlourName || date || timeSlot || name
  );

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="mt-5 pt-24 pb-16 px-4 md:px-8">
        <div className="container mx-auto max-w-2xl">
          <div className="mt-0 mb-4 md:mt-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-500 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
          <div className="bg-white/95 rounded-2xl border border-rose-100 shadow-sm p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-2">
              Appointment Confirmed
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for booking with True Beauty. Your beauty appointment details are below.
            </p>

            {!hasDetails ? (
              <p className="text-gray-500 text-sm">
                Booking details could not be loaded. Please return to the home page and try again.
              </p>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-1">
                    Appointment ID
                  </p>
                  <p className="text-lg font-mono font-semibold text-gray-900">{appointmentId}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Parlour name
                    </p>
                    <p className="text-sm md:text-base text-gray-900">{parlourName || '-'}</p>
                    {location && (
                      <p className="text-xs md:text-sm text-gray-500 mt-0.5">{location}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Service
                    </p>
                    <p className="text-sm md:text-base text-gray-900">{serviceName || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Date &amp; time
                    </p>
                    <p className="text-sm md:text-base text-gray-900">
                      {date || '-'} {timeSlot && <span className="text-gray-700">· {timeSlot}</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Payment mode
                    </p>
                    <p className="text-sm md:text-base text-gray-900">{paymentMode || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Booking in the name of
                  </p>
                  <p className="text-sm md:text-base text-gray-900">{name || '-'}</p>
                  {phone && (
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                      Contact: <span className="font-medium text-gray-800">{phone}</span>
                    </p>
                  )}
                </div>

                <p className="text-xs md:text-sm text-gray-500 pt-2 border-t border-dashed border-rose-100 mt-4">
                  Please arrive 10–15 minutes before your slot. For any changes, contact the parlour
                  directly using the phone number shared in your confirmation SMS/email.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

