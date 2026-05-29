import Link from "next/link"
import { Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-white">SpaceOnGo</h3>
            <p className="text-sm text-slate-300">
              Find and book unique spaces for your next event, meeting, or creative project.
            </p>
            <div className="flex space-x-4 justify-center md:justify-start">
              <a href="https://facebook.com/spaceongo" className="text-slate-400 hover:text-cyan-400 transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://twitter.com/spaceongo" className="text-slate-400 hover:text-cyan-400 transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="https://instagram.com/spaceongo"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://linkedin.com/company/spaceongo"
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/find-space" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Find Space
                </Link>
              </li>
              <li>
                <Link href="/all-spaces" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  All Spaces
                </Link>
              </li>
              <li>
                <Link href="/list-space" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  List Your Space
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-white">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-white">Contact Us</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@spaceongo.com" className="hover:text-cyan-400 transition-colors">
                  info@spaceongo.com
                </a>
              </div>
              {/*<div className="flex items-center gap-2 justify-center md:justify-start">
                <Phone className="h-4 w-4" />
                <a href="tel:+15551234567" className="hover:text-white transition-colors">
                  +1 (555) 123-4567
                </a>
              </div>
              <div className="flex items-start gap-2 justify-center md:justify-start">
                <MapPin className="h-4 w-4 mt-0.5" />
                <div>
                  123 Innovation Drive
                  <br />
                  San Francisco, CA 94105
                  <br />
                  United States
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="text-sm text-slate-400">© {new Date().getFullYear()} SpaceOnGo.com. All rights reserved.</div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <span>Available 24/7 Support</span>
            <span>•</span>
            <span>Secure Payments</span>
            <span>•</span>
            <span>Verified Spaces</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
