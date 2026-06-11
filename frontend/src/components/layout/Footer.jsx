import { Link } from 'react-router-dom';
import { Paintbrush, Phone, Mail, MapPin, Globe, Share2, MessageCircle } from 'lucide-react';

const footerLinks = {
  Shop: [
    { name: 'All Products', href: '/products' },
    { name: 'Paints', href: '/products?category=paints' },
    { name: 'Hardware Tools', href: '/products?category=hardware-tools' },
    { name: 'AI Color Visualizer', href: '/visualizer' },
  ],
  Account: [
    { name: 'My Profile', href: '/profile' },
    { name: 'My Orders', href: '/orders' },
    { name: 'Wishlist', href: '/wishlist' },
    { name: 'Cart', href: '/cart' },
  ],
  Support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Return Policy', href: '/returns' },
    { name: 'Privacy Policy', href: '/privacy' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[var(--brand-dark)] text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-xl flex items-center justify-center">
                <Paintbrush size={22} className="text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-xl font-['Outfit']">Smart Paint</span>
                <span className="block text-xs text-gray-400">& Hardware Store</span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              Your trusted one-stop shop for premium paints, hardware, and building materials. Transform your space with our AI-powered color visualizer.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-[var(--brand-primary)]" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-[var(--brand-primary)]" />
                <span>hello@smartpaint.in</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-[var(--brand-primary)]" />
                <span>123, Main Bazaar, Hyderabad, Telangana</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex gap-3 mt-6">
              {[Globe, Share2, MessageCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-white/5 hover:bg-[var(--brand-primary)] rounded-lg flex items-center justify-center transition-all duration-200"
                >
                  <Icon size={16} className="text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Smart Paint & Hardware Store. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              🔒 SSL Secured
            </span>
            <span className="flex items-center gap-1.5">
              💳 Razorpay
            </span>
            <span className="flex items-center gap-1.5">
              🚚 Fast Delivery
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
