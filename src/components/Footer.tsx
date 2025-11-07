
import Link from "next/link";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 border-t dark:border-slate-800">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Logo className="h-10 w-auto" />
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
              Your reliable partner for digital wallet exchange and virtual
              card solutions.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 tracking-wider uppercase">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-base text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-base text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 tracking-wider uppercase">
              Support
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="mailto:info@walletexchangebd.com"
                  className="text-base text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-base text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            &copy; {new Date().getFullYear()} Wallet Exchange. All Rights
            Reserved.
            <br />
            Wallet Exchange is a digital asset exchange platform. We are not a
            licensed bank or financial institution.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
