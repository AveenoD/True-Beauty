'use client';

import { useParams } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ProductGrid from '../../../components/ProductGrid';
import Link from 'next/link';

export default function CategoryPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : params.slug?.[0] ?? '';

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="pt-24 pb-16 md:pt-32 md:pb-24">
        <section className="py-8 md:py-12 border-b border-rose-200/60">
          <div className="container mx-auto px-4 md:px-8">
            <Link
              href="/"
              className="text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-8">
            <div className="shopping-zone rounded-2xl md:rounded-3xl p-6 md:p-8">
              <ProductGrid categorySlug={slug} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
