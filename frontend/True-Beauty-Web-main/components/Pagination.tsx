'use client';

import Link from 'next/link';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

function buildHref(basePath: string, page: number): string {
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {

  if (totalPages <= 1) return null;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-1 md:gap-2 mt-8 md:mt-10" aria-label="Pagination">
      {prevPage !== null ? (
        <Link
          href={buildHref(basePath, prevPage)}
          className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white/80 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-rose-50 transition-colors min-w-[2.5rem]"
          aria-label="Previous page"
        >
          Previous
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center rounded-lg border border-rose-100 bg-white/50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed min-w-[2.5rem]">
          Previous
        </span>
      )}

      <div className="flex items-center gap-1">
        {start > 1 && (
          <>
            <Link
              href={buildHref(basePath, 1)}
              className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white/80 w-9 h-9 text-sm font-medium text-gray-700 hover:bg-rose-50 transition-colors"
            >
              1
            </Link>
            {start > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}
        {pages.map((p) => (
          <Link
            key={p}
            href={buildHref(basePath, p)}
            className={`inline-flex items-center justify-center rounded-lg w-9 h-9 text-sm font-medium transition-colors ${
              p === currentPage
                ? 'bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white border border-transparent'
                : 'border border-rose-200 bg-white/80 text-gray-700 hover:bg-rose-50'
            }`}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </Link>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
            <Link
              href={buildHref(basePath, totalPages)}
              className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white/80 w-9 h-9 text-sm font-medium text-gray-700 hover:bg-rose-50 transition-colors"
            >
              {totalPages}
            </Link>
          </>
        )}
      </div>

      {nextPage !== null ? (
        <Link
          href={buildHref(basePath, nextPage)}
          className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white/80 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-rose-50 transition-colors min-w-[2.5rem]"
          aria-label="Next page"
        >
          Next
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center rounded-lg border border-rose-100 bg-white/50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed min-w-[2.5rem]">
          Next
        </span>
      )}
    </nav>
  );
}
