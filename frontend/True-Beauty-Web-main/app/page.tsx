'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Heart, ShoppingBag, User, Instagram, Facebook, Twitter, Youtube, Mail } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import { categories, getCategoryNameBySlug } from '../utils/categories';
import { BeautyService, getServicesByCategory } from '../utils/catalog';
import Card from '../components/ui/Card';

const heroSlides = [
  { id: 1, title: "True Beauty Skincare Collection", tagline: "Premium formulations for radiant, glowing skin. Hydrating mist, serum, foundation & more.", benefits: ["Luxury ingredients & elegant packaging", "Suitable for all skin types", "Minimalist, cruelty-free beauty"], buttonText: "Shop Now", image: "/images/heroSection/allProducts.png", bgColor: "from-rose-50 to-pink-50" },
  { id: 3, title: "Radiant Serum Collection", tagline: "Intensive hydration & glow with our premium serum. Transform your skin with every drop.", benefits: ["Deep hydration & nourishment", "Visible results in days", "Luxury skincare experience"], buttonText: "Shop Serum", image: "/images/products/serum.png", bgColor: "from-purple-50 to-pink-50" },
  { id: 4, title: "Day & Night Care Duo", tagline: "Complete your skincare routine with our day cream and night cream. 24-hour protection and repair.", benefits: ["Day cream for protection", "Night cream for repair", "Perfect skincare harmony"], buttonText: "Shop Collection", image: "/images/products/dayCream.png", bgColor: "from-blue-50 to-rose-50" },
  { id: 5, title: "Essential Skincare Essentials", tagline: "Face wash, toner, and moisturizer — the perfect trio for clean, balanced, and hydrated skin.", benefits: ["Gentle cleansing", "Pore refinement", "Long-lasting hydration"], buttonText: "Shop Essentials", image: "/images/products/faceWash.png", bgColor: "from-green-50 to-blue-50" },
  { id: 6, title: "Sun Protection & Lip Care", tagline: "Protect your skin with SPF and nourish your lips with our premium lip balm collection.", benefits: ["Broad spectrum protection", "Nourishing lip care", "Daily essentials"], buttonText: "Shop Now", image: "/images/products/sunscreen.png", bgColor: "from-yellow-50 to-orange-50" }
];

const promotionalSlides = [
  { id: 1, video: "/videos/video1.mp4", headline: "Glow from Within", benefit: "Serums that deliver visible radiance in days", cta: "Shop Serums" },
  { id: 2, video: "/videos/video2.mp4", headline: "Deep Hydration", benefit: "24-hour moisture for plump, dewy skin", cta: "Shop Moisturizers" },
  { id: 3, video: "/videos/video3.mp4", headline: "Gentle Rituals", benefit: "Cleansers that nourish as they purify", cta: "Shop Cleansers" },
  { id: 4, video: "/videos/video4.mp4", headline: "Protect & Perfect", benefit: "SPF that feels like skincare, never greasy", cta: "Shop Sunscreen" }
];

function ProductsFallback() {
  return (
    <div className="min-h-[320px] flex items-center justify-center rounded-2xl bg-white/50 border border-rose-100/80">
      <p className="text-gray-500 text-sm">Loading products...</p>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookingOpen, setBookingOpen] = useState(false);

  // Sync category from URL so header Categories links show the right products
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    setSelectedCategory(cat);
  }, [searchParams]);
  const [selectedService, setSelectedService] = useState<BeautyService | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    date: '',
    timeSlot: '',
    paymentMode: 'online' as 'pay-at-parlour' | 'online',
  });

  const allServicesForCategory = useMemo(
    () => getServicesByCategory(selectedCategory),
    [selectedCategory]
  );
  const servicesForCategory = useMemo(
    () => allServicesForCategory.slice(0, 6),
    [allServicesForCategory]
  );
  const showViewAllServices = allServicesForCategory.length > 6;

  const selectedCategoryLabel =
    selectedCategory === 'all' ? 'All Categories' : getCategoryNameBySlug(selectedCategory);

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    const url = slug === 'all' ? '/#products' : `/?category=${slug}#products`;
    router.replace(url, { scroll: false });
  };

  const handleOpenBooking = (service: BeautyService) => {
    setSelectedService(service);
    setBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setBookingOpen(false);
  };

  const handleBookingInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    const { name, phone, date, timeSlot, paymentMode } = bookingForm;
    if (!name || !phone || !date || !timeSlot) {
      return;
    }

    const appointmentId = `TB-${Date.now().toString().slice(-6)}`;
    const searchParams = new URLSearchParams({
      appointmentId,
      parlourName: selectedService.parlourName,
      serviceName: selectedService.serviceName,
      location: selectedService.location,
      date,
      timeSlot,
      name,
      phone,
      paymentMode: 'Online Payment',
    });

    setBookingOpen(false);
    router.push(`/appointment/confirmation?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="pb-0">
        <section className="w-full min-h-screen border-b border-rose-200/60">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={true}
            className="!w-full h-screen overflow-hidden"
          >
            {heroSlides.map((slide) => (
              <SwiperSlide key={slide.id}>
<div
                    className={`h-full min-h-screen bg-gradient-to-r ${slide.bgColor} flex flex-col md:flex-row pt-20 sm:pt-24 md:pt-28`}
                  >
                    <div className="flex-1 flex items-center p-8 md:p-16 animate-slide-in-left">
                      <div className="max-w-lg">
                        <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-800 mb-4 leading-tight">
                          {slide.title}
                        </h1>
                        <p className="text-gray-600 text-lg mb-6 leading-relaxed">{slide.tagline}</p>
                        <ul className="space-y-2 mb-8">
                          {slide.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-gray-600">
                              <span className="w-2 h-2 bg-pink-400 rounded-full flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                        <button className="bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white px-8 py-3 rounded-full font-medium hover:shadow-lg hover:opacity-95 transform hover:-translate-y-1 transition-all duration-300">
                          {slide.buttonText}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-8 animate-slide-in-right">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="max-h-80 md:max-h-96 w-auto object-contain drop-shadow-lg"
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
          </Swiper>
        </section>

        <section
          id="products"
          className="py-16 md:py-24 border-b border-rose-200/60"
          aria-label="Products and services"
        >
          <div className="container mx-auto px-4 md:px-8">
            <div className="shopping-zone rounded-2xl md:rounded-3xl p-6 md:p-8">
              <div className="flex flex-col gap-6 md:gap-8">
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-800">
                    Our Products &amp; Services
                  </h2>
                  <p className="mt-2 text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
                    Explore curated True Beauty products and trusted beauty parlour services for every
                    occasion.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs md:text-sm text-gray-500">
                      Viewing: <span className="font-medium text-gray-700">{selectedCategoryLabel}</span>
                    </p>
                  </div>
                  <div className="flex gap-3 overflow-x-auto md:flex-wrap md:justify-center md:overflow-visible pb-1">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick('all')}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                        selectedCategory === 'all'
                          ? 'bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white border-transparent shadow-sm'
                          : 'bg-white/80 text-gray-700 border-rose-100 hover:bg-rose-50'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryClick(category.slug)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                          selectedCategory === category.slug
                            ? 'bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white border-transparent shadow-sm'
                            : 'bg-white/80 text-gray-700 border-rose-100 hover:bg-rose-50'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div id="products">
                  <Suspense fallback={<ProductsFallback />}>
                    <ProductGrid
                      categorySlug={selectedCategory === 'all' ? undefined : selectedCategory}
                      subcategorySlug={searchParams.get('subcategory') || undefined}
                      hideHeader
                      subtitle="Premium beauty picks, tailored to your chosen category."
                      limit={6}
                      showViewAll
                      columnsLg={3}
                    />
                  </Suspense>
                </div>

                <div className="pt-6 md:pt-8 border-t border-rose-100/70">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 md:mb-6">
                    <div>
                      <h3 className="text-xl md:text-2xl font-playfair font-semibold text-gray-800">
                        Services
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        Beauty parlour appointments handpicked for{' '}
                        <span className="font-medium">{selectedCategoryLabel.toLowerCase()}</span>.
                      </p>
                    </div>
                  </div>

                  {servicesForCategory.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-white/60 border border-dashed border-rose-200/80">
                      <p className="text-gray-600 text-sm md:text-base mb-2">
                        No beauty parlour services available for this category yet.
                      </p>
                      <p className="text-gray-400 text-xs md:text-sm">
                        Try switching to another category to discover more services.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                        {servicesForCategory.map((service, index) => (
                          <div
                            key={service.id}
                            className={index >= 2 ? 'hidden sm:block' : ''}
                          >
                            <Card
                              variant="service"
                              item={service}
                              onBook={() => handleOpenBooking(service)}
                            />
                          </div>
                        ))}
                      </div>
                      {showViewAllServices && (
                        <div className="mt-6 md:mt-8 flex justify-center">
                          <Link
                            href="/services"
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white px-6 py-2.5 text-sm font-medium hover:opacity-95 transition-all duration-200"
                          >
                            View All Services
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

      <section className="py-16 md:py-20 border-y border-rose-200/60">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-8 md:mb-10">
            <span className="text-rose-500 text-sm font-medium tracking-wider uppercase">Latest & Trending</span>
            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 mt-1">Discover the Glow</h2>
          </div>
          <div className="rounded-2xl border border-rose-200/60 p-6 md:p-8 bg-white/30">
            <Swiper modules={[Autoplay, Pagination, Navigation]} autoplay={{ delay: 4000, disableOnInteraction: false }} pagination={{ clickable: true }} navigation={true} loop={true} speed={600} slidesPerView={1} spaceBetween={24} breakpoints={{ 640: { slidesPerView: 1.2, spaceBetween: 20 }, 768: { slidesPerView: 1.5, spaceBetween: 24 }, 1024: { slidesPerView: 2, spaceBetween: 28 }, 1280: { slidesPerView: 2.5, spaceBetween: 32 } }} className="promo-carousel rounded-2xl overflow-visible">
              {promotionalSlides.map((slide) => (
                <SwiperSlide key={slide.id}>
                  <article className="group relative h-80 sm:h-96 md:h-[420px] rounded-2xl overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100/60 shadow-[0_8px_32px_rgba(251,113,133,0.12)] transition-all duration-500 hover:shadow-[0_16px_48px_rgba(251,113,133,0.18)] hover:scale-[1.02]">
                    <video src={slide.video} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-900/30 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <h3 className="font-playfair font-bold text-white text-xl md:text-2xl mb-2 drop-shadow-lg">{slide.headline}</h3>
                      <p className="text-white/90 text-sm md:text-base mb-4 max-w-sm">{slide.benefit}</p>
                      <button className="bg-white/95 text-rose-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl">{slide.cta}</button>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      <section className="pt-16 pb-8 md:pb-10 bg-white/50 border-b border-rose-200/60">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{ icon: Heart, title: "Premium Quality", description: "Luxury formulations with natural ingredients for exceptional results", gradient: "from-pink-400 to-rose-400", delay: "0s" }, { icon: ShoppingBag, title: "Fast Shipping", description: "Free shipping on orders over $50 with express delivery options", gradient: "from-purple-400 to-pink-400", delay: "0.2s" }, { icon: User, title: "Expert Support", description: "Personalized beauty consultations and 24/7 customer care", gradient: "from-rose-400 to-purple-400", delay: "0.4s" }].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center p-6 rounded-2xl bg-white/70 backdrop-blur-sm pastel-shadow animate-fade-in-up" style={{ animationDelay: feature.delay }}>
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      </main>

      {bookingOpen && selectedService && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 md:p-7 relative">
            <button
              type="button"
              onClick={handleCloseBooking}
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
                {selectedService.parlourName} · {selectedService.serviceName}
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
                  <label className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors duration-200 bg-white border-rose-100 data-[checked=true]:border-rose-500 data-[checked=true]:bg-rose-50">
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

      {/* Social media – footer ke upar */}
      <section className="py-8 md:py-10 bg-gradient-to-b from-white/60 to-rose-50/40 border-t border-rose-200/60">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <p className="text-gray-600 text-sm md:text-base mb-6 font-medium">Follow us for beauty tips & offers</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 hover:scale-110" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 hover:scale-110" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 hover:scale-110" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 hover:scale-110" aria-label="YouTube">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="mailto:hello@truebeauty.com" className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 hover:scale-110" aria-label="Email">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating WhatsApp – bottom right, direct message */}
      <a
        href="https://wa.me/919876543210?text=Hi%2C%20I%20have%20a%20query%20about%20True%20Beauty%20products"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300"
        aria-label="Message us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PageFallback />}>
      <HomeContent />
    </Suspense>
  );
}
