// View All Products Page

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductGrid from '../../components/ProductGrid';
import Pagination from '../../components/Pagination';
import { products } from '../../utils/catalog';

const PER_PAGE = 12;

function ProductsContent() {
  const searchParams = useSearchParams();

  const rawPage = searchParams.get('page');
  const parsedPage = rawPage ? parseInt(rawPage, 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const total = products?.length ?? 0;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / PER_PAGE)) : 1;
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const paginatedProducts = total > 0 ? products.slice(start, start + PER_PAGE) : [];

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

              <ProductGrid products={paginatedProducts} hideHeader />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/products"
              />
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
