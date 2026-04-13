'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { MapPin, Phone, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { getServiceById, type BeautyService } from '../../../utils/catalog';

/** Converts a paragraph description into short bullet-style feature points (sentence, comma, or • split). */
function descriptionToBulletPoints(description: string): string[] {
  const raw = description
    .split(/\.\s+|\s*,\s*|\s+•\s+/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter((s) => s.length > 0);
  return raw.map((s) => (s.charAt(0).toUpperCase() + s.slice(1)).trim());
}

/** Service-specific default descriptions when catalog has no serviceDescriptions. Each service name gets a different, relevant paragraph. */
const DEFAULT_SERVICE_DESCRIPTIONS: Record<string, string> = {
  'Hydra Facials': 'Deep cleansing and hydration with hyaluronic acid. Restores glow and plumps skin.',
  'Skin Polishing': 'Gentle exfoliation for smoother texture. Reduces dullness and refines pores.',
  'Detan Treatments': 'Targeted tan removal and brightening. Evens out skin tone.',
  'Bridal Facials': 'Pre-wedding glow facial with premium products. Prepares skin for big day.',
  'Pre-bridal Packages': 'Customised pre-wedding skincare and makeup trials. Full look finalisation.',
  'Body Polishing': 'Full-body exfoliation and moisturisation. Smooth, radiant skin.',
  'Makeup Trials': 'Trial session to finalise your look. Expert artists and premium products.',
  'Party Makeup': 'Evening and party-ready makeup. Long-lasting, camera-friendly finish.',
  'Cocktail Makeup': 'Sophisticated cocktail-hour look. Glamorous yet wearable.',
  'Evening Look': 'Bold evening makeup and styling. Statement looks for special nights.',
  'Hair Styling': 'Professional blow dry and styling. Curls, waves, or sleek finish.',
  'Bridal Makeup': 'Full bridal makeup with premium products for your big day.',
  'Pre-bridal Trial': 'Trial session to finalise look and products before the wedding.',
  'Draping & Styling': 'Saree and drape styling with professional draping.',
  'Touch-up Kit': 'Touch-up kit to keep you fresh through the events.',
  'Keratin Treatment': 'Smoothing keratin treatment for frizz-free, shiny hair.',
  'Smoothening': 'Chemical or natural smoothening for manageable hair.',
  'Hair Spa': 'Nourishing hair spa with oils and massage. Strengthens and adds shine.',
  'Haircut & Styling': 'Precision cut and styling. Tailored to your face shape.',
  'Keratin Smoothening': 'Advanced keratin treatment. Long-lasting smoothness.',
  'Brazilian Blowout': 'Signature blowout for silky, frizz-free hair.',
  'Chemical-Free Smoothening': 'Gentle smoothening without harsh chemicals.',
  'Frizz Control': 'Anti-frizz treatment for humid climates. Tamed, glossy hair.',
  'Blow Dry': 'Professional blow dry for volume and bounce.',
  'Curls & Waves': 'Defined curls or beach waves. Heat styling and setting.',
  'Bridal Hair': 'Bridal updos and styling. Accessories and lasting hold.',
  'Scalp Massage': 'Stimulating scalp massage. Promotes circulation and relaxation.',
  'Aromatherapy Head Massage': 'Aromatherapy oils with head massage. Stress relief and nourishment.',
  'Deep Conditioning': 'Intensive conditioning mask. Repairs damage and adds softness.',
  'Aromatherapy Massage': 'Full-body aromatherapy massage. Relaxing essential oils.',
  'Body Spa': 'Full-body spa treatment. Exfoliation, wrap, and moisturisation.',
  'Head Massage': 'Therapeutic head and shoulder massage. Relieves tension.',
  'Detox Rituals': 'Body detox with wraps and scrubs. Refreshed, renewed skin.',
  'Fragrance Profiling': 'Personal consultation to find your signature scent.',
  'Scent Recommendations': 'Expert picks based on your preferences and occasion.',
  'Layering Advice': 'How to layer fragrances for a unique blend.',
  'Gift Curation': 'Curated fragrance gifts. Packaging and personalisation.',
  'Perfume Sampling': 'Try before you buy. Sample multiple fragrances.',
  'Blind Testing': 'Discover scents without labels. Find your true preference.',
  'Comparison Sessions': 'Side-by-side fragrance comparison. Easy decision-making.',
  'Discovery Sets': 'Mini discovery sets to explore new fragrances.',
  'Custom Perfume Blending': 'Create your own blend with expert guidance.',
  'Signature Scent Creation': 'One-of-a-kind fragrance designed for you.',
  'Refill Service': 'Eco-friendly refills for your favourite bottle.',
  'Bottle Engraving': 'Personalised engraving on perfume bottles.',
  'Skin Analysis': 'Detailed skin assessment. Customised routine advice.',
  'Wellness Assessment': 'Holistic wellness and skin health check.',
  'Diet & Lifestyle Tips': 'Nutrition and lifestyle tips for better skin.',
  'Product Recommendations': 'Tailored product recommendations for your skin.',
  'Custom Gift Boxes': 'Build your own gift set. Perfect for gifting.',
  'Wrapping & Personalisation': 'Elegant wrapping and message cards.',
  'Delivery Arrangements': 'Gift delivery and scheduling.',
  'Luxury Hampers': 'Premium hamper curation. Corporate and personal gifting.',
  'Corporate Gifting': 'Bulk and corporate gift solutions.',
  'Premium Packaging': 'Luxury packaging and unboxing experience.',
  'Nationwide Delivery': 'Delivery across India. Tracked and secure.',
  'Custom Gift Sets': 'Personalised gift sets. Names and messages.',
  'Name Engraving': 'Engraved names or initials on products.',
  'Message Cards': 'Custom message cards with your gift.',
  'Theme-based Curation': 'Occasion-based gift curation. Festive, bridal, wellness.',
  'Bridal Set Curation': 'Complete bridal jewellery set selection.',
  'Trial & Styling': 'Jewellery trial with outfit pairing.',
  'Custom Orders': 'Custom-designed jewellery pieces.',
  'Rental Options': 'Jewellery rental for events.',
  'Ultrasonic Cleaning': 'Deep ultrasonic cleaning for jewellery.',
  'Polishing': 'Professional polish to restore shine.',
  'Stone Checking': 'Stone and setting inspection.',
  'Minor Repairs': 'Clasps, chains, and minor fixes.',
  'Outfit Pairing': 'Jewellery matched to your outfit and occasion.',
  'Occasion Styling': 'Styling for weddings, parties, and daily wear.',
  'Photo Shoots': 'Jewellery styling for photos.',
  'Facial & Cleanup': 'Deep cleansing facial and skin cleanup.',
  'Manicure & Pedicure': 'Nail care and polish. Hands and feet.',
  'Threading': 'Precision threading for clean brows and face.',
  'Hydra Facial': 'Hydrating facial with serums and mask.',
  'Body Massage': 'Relaxing or therapeutic body massage.',
  'Bridal Trial': 'Full bridal makeup and hair trial.',
  'Full Body Spa': 'Head-to-toe spa experience.',
  'Facial + Massage': 'Combination facial and body massage.',
  'Lunch included': 'Light refreshments or lunch with your spa day.',
  'Valid this month': 'Limited-period offer. Book within validity.',
  'Deep Cleansing': 'Deep pore cleansing and extraction.',
  'Mask & Serums': 'Custom mask and serum application.',
  'Relaxing Facial Massage': 'Soothing facial massage for relaxation.',
};

function getDescriptionForService(serviceName: string, customDescription?: string): string {
  if (customDescription?.trim()) return customDescription;
  const key = Object.keys(DEFAULT_SERVICE_DESCRIPTIONS).find(
    (k) => k.toLowerCase() === serviceName.toLowerCase()
  );
  return key ? DEFAULT_SERVICE_DESCRIPTIONS[key] : 'Professional service offered at our parlour.';
}

type BookingFormState = {
  name: string;
  phone: string;
  date: string;
  timeSlot: string;
  paymentMode: 'pay-at-parlour' | 'online';
};

export default function AppointmentDetailsPage() {
  const router = useRouter();
  const [service, setService] = useState<BeautyService | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get('id');
    if (!serviceId) {
      setService(null);
      return;
    }

    const found = getServiceById(serviceId);
    setService(found ?? null);
  }, []);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormState>({
    name: '',
    phone: '',
    date: '',
    timeSlot: '',
    paymentMode: 'online',
  });

  const handleBookingInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    const { name, phone, date, timeSlot, paymentMode } = bookingForm;
    if (!name || !phone || !date || !timeSlot) {
      return;
    }

    const appointmentId = `TB-${Date.now().toString().slice(-6)}`;
    const search = new URLSearchParams({
      appointmentId,
      parlourName: service.parlourName,
      serviceName: service.serviceName,
      location: service.location,
      date,
      timeSlot,
      name,
      phone,
      paymentMode: 'Online Payment',
    });

    setBookingOpen(false);
    router.push(`/appointment/confirmation?${search.toString()}`);
  };

  if (!service) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <main className="pt-24 pb-16 px-4 md:px-8">
          <div className="container mx-auto max-w-2xl">
            <div className="bg-white/90 rounded-2xl border border-rose-100 p-8 text-center">
              <p className="text-gray-700 text-base md:text-lg mb-3">
                Service details are currently unavailable.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                The parlour you are looking for may have been updated or removed.
              </p>
              <Link
                href="/#products"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white text-sm font-medium hover:opacity-95 transition-colors"
              >
                ← Back to services
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="pt-24 pb-16 px-4 md:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6">
            <Link
              href="/#products"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-500 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to services
            </Link>
          </div>

          <div className="bg-white/95 rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-6 md:p-8">
              <div className="relative aspect-video md:aspect-square max-w-md mx-auto md:mx-0 rounded-xl overflow-hidden bg-rose-50/60">
                <img
                  src={service.image}
                  alt={service.serviceName}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Partner
                </span>
              </div>

              <div className="flex flex-col">
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-rose-500 font-semibold mb-1">
                    Beauty Parlour Service
                  </p>
                  <h1 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-1">
                    {service.parlourName}
                  </h1>
                  <p className="text-sm md:text-base text-gray-700">
                    {service.serviceName}
                  </p>
                </div>

                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
                    Services Offered
                  </h2>
                  {service.servicesOffered && service.servicesOffered.length > 0 ? (
                    <ul className="space-y-1.5 list-none pl-0">
                      {service.servicesOffered.flatMap((name, i) => {
                        const description = getDescriptionForService(
                          name,
                          service.serviceDescriptions?.[i]
                        );
                        return descriptionToBulletPoints(description).map((point, j) => (
                          <li
                            key={`${i}-${j}`}
                            className="flex items-start gap-2 text-sm text-gray-600 leading-snug"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-1.5" />
                            <span>{point}</span>
                          </li>
                        ));
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Detailed service list will be updated soon.
                    </p>
                  )}
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <div>
                    <span className="block text-xs text-gray-500 uppercase tracking-wide">
                      Starting from
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{service.startingPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-3 rounded-lg bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white text-sm md:text-base font-medium hover:opacity-95 transition-all duration-200 shadow-sm"
                  >
                    Book Appointment
                  </button>
                  <p className="text-xs text-gray-500">
                    No payment required to confirm your slot. Choose online payment during
                    booking.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Parlour Preview (70%) + Location & Contact (30%) — two separate cards */}
          <div className="mt-6 md:mt-8 flex flex-col lg:flex-row gap-6 md:gap-8">
            {/* Parlour Preview card — 70% width */}
            <div className="w-full lg:w-[70%] bg-white/95 rounded-2xl border border-rose-100 shadow-sm overflow-hidden p-6 md:p-8">
              <h2 className="text-lg font-playfair font-semibold text-gray-800 mb-4">
                Parlour Preview
              </h2>
              {service.videoUrl ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <video
                    src={service.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    title="Parlour preview"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-xl overflow-hidden bg-rose-50/60 flex items-center justify-center border border-rose-100">
                  <p className="text-sm text-gray-500">Video preview not available</p>
                </div>
              )}
            </div>

            {/* Location & Contact card — 30% width, height by content */}
            <div className="w-full lg:w-[30%] h-fit bg-white/95 rounded-2xl border border-rose-100 shadow-sm overflow-hidden p-6 md:p-8">
              <h2 className="text-lg font-playfair font-semibold text-gray-800 mb-4">
                Location & Contact
              </h2>
              <div className="space-y-3">
                <p className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium text-gray-800">{service.location}</span>
                    <br />
                    <span className="text-gray-500">{service.address}</span>
                  </span>
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <a href={`tel:${service.phone}`} className="hover:text-rose-500 font-medium">
                    {service.phone}
                  </a>
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{service.workingHours}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {bookingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 md:p-7 relative">
            <button
              type="button"
              onClick={() => setBookingOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label="Close booking"
            >
              ×
            </button>
            <div className="mb-4">
              <h2 className="text-xl md:text-2xl font-playfair font-semibold text-gray-800">
                Book Appointment
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {service.parlourName} · {service.serviceName}
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleConfirmBooking}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={bookingForm.name}
                  onChange={handleBookingInputChange}
                  className="w-full rounded-lg border border-rose-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/70 focus:border-rose-300 bg-white"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={bookingForm.phone}
                  onChange={handleBookingInputChange}
                  className="w-full rounded-lg border border-rose-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/70 focus:border-rose-300 bg-white"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">
                    Preferred date
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={handleBookingInputChange}
                    className="w-full rounded-lg border border-rose-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/70 focus:border-rose-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="timeSlot">
                    Preferred time slot
                  </label>
                  <select
                    id="timeSlot"
                    name="timeSlot"
                    required
                    value={bookingForm.timeSlot}
                    onChange={handleBookingInputChange}
                    className="w-full rounded-lg border border-rose-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/70 focus:border-rose-300 bg-white"
                  >
                    <option value="">Select a time slot</option>
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 2:00 PM">12:00 PM - 2:00 PM</option>
                    <option value="3:00 PM - 5:00 PM">3:00 PM - 5:00 PM</option>
                    <option value="5:00 PM - 7:00 PM">5:00 PM - 7:00 PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors duration-200 bg-white border-rose-100">
                    <input
                      type="radio"
                      name="paymentMode"
                      value="online"
                      checked={bookingForm.paymentMode === 'online'}
                      onChange={handleBookingInputChange}
                      className="h-4 w-4 text-rose-500 border-rose-300 focus:ring-rose-400"
                    />
                    <span>Online Payment</span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white font-medium text-sm md:text-base py-2.5 md:py-3 hover:opacity-95 transition-all duration-200"
              >
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

