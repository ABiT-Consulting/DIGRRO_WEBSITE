import { Linkedin, Twitter, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-gray-950 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <img
              src="/image_fc91df1d-53b0-439b-9c3e-c444469fda79-removebg-preview copy copy copy.png"
              alt="Digrro Logo"
              className="h-12 w-auto mb-6"
            />
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Strategic AI implementation for GCC enterprises
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-3">
              <li>
                <button onClick={() => handleNavClick('ai-solutions')} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  AI Solutions Development
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('digital-marketing')} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  Digital Marketing
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('web-mobile')} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  Web & Mobile Development
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('consulting')} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  Consulting Services
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <button onClick={() => handleNavClick('about')} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('industries')} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  Industries
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('insights')} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  Insights
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('contact')} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin size={16} className="text-blue-400 mt-1 flex-shrink-0" />
                <span className="text-gray-400 text-sm">GCC Region - Saudi Arabia, UAE, Qatar</span>
              </li>
              <li className="flex items-start space-x-3">
                <Mail size={16} className="text-blue-400 mt-1 flex-shrink-0" />
                <span className="text-gray-400 text-sm">contact@digrro.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone size={16} className="text-blue-400 mt-1 flex-shrink-0" />
                <span className="text-gray-400 text-sm">+966 XX XXX XXXX</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-500 text-sm">
              © 2025 Digrro. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-blue-400 text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-blue-400 text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
