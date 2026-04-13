export default function Footer() {
  return (
    <footer className="py-12 bg-white border-t-2 border-rose-200/60">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-0 mb-4">
            <img src="/images/logo/trueBeauty-Logo.png" alt="True Beauty Logo" width={80} height={25} className="object-contain" />
            <span className="text-xl font-playfair font-bold text-gray-800">True Beauty</span>
          </div>
          <p className="text-gray-600 max-w-md mx-auto mb-8">Redefining beauty standards with premium, cruelty-free cosmetics crafted for the modern woman.</p>
          <div className="flex justify-center space-x-6 text-gray-500 mb-8">
            <a href="#" className="hover:text-pink-500 transition-colors">About</a>
            <a href="#" className="hover:text-pink-500 transition-colors">Contact</a>
            <a href="#" className="hover:text-pink-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-pink-500 transition-colors">Terms</a>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 text-gray-400 text-sm">© 2026 True Beauty. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
