// View All Products Page

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductGrid from '../../components/ProductGrid';

function ProductsContent() {
  useSearchParams(); // keep page dynamic; backend pagination comes later

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="pt-24 pb-16 md:pt-28 md:pb-24">
        <section className="pb-10 md:pb-14">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-4">
              <Link
                href="/"
                className="text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
            <div className="shopping-zone rounded-2xl md:rounded-3xl p-6 md:p-8">
              <div className="text-center mb-8 md:mb-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-800 mb-2">
                  All Products
                </h1>
                <p className="text-gray-600 text-sm md:text-base max-w-xl mx-auto">
                  Browse our full collection of True Beauty products.
                </p>
              </div>

              <ProductGrid hideHeader />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}
