
import { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import { Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us - Wallet Exchange',
  description: 'Get in touch with the Wallet Exchange team.',
};

export default function ContactPage() {
  return (
    <div className="bg-background py-16 md:py-24">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto text-foreground">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Contact Us
            </h1>
            <p className="text-muted-foreground text-lg">
              We'd love to hear from you. Fill out the form below or use our contact details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
                <h2 className="text-2xl font-semibold">Get in Touch</h2>
                <p className="text-muted-foreground">
                    Have a question, feedback, or need support? Our team is here to help. Reach out to us via email, phone, or the contact form.
                </p>
                <div className="space-y-4">
                    <a href="mailto:info@walletexchangebd.com" className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold group-hover:text-primary">Email Us</h3>
                            <p className="text-muted-foreground">info@walletexchangebd.com</p>
                        </div>
                    </a>
                     <a href="tel:+8801903068730" className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Phone className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold group-hover:text-primary">Call Us</h3>
                            <p className="text-muted-foreground">+880 1903068730</p>
                        </div>
                    </a>
                </div>
            </div>
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
