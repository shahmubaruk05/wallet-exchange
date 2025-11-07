
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Wallet Exchange',
  description: 'Our privacy policy outlines how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-background py-16 md:py-24">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto text-foreground">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to Wallet Exchange ("we," "our," "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (collectively, the "Services"). Please read this policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">2. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We may collect information about you in a variety of ways. The information we may collect on the Site includes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and telephone number, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site, such as online chat and message boards.
                </li>
                <li>
                  <strong>Transactional Data:</strong> Financial information related to your transactions on our platform, including the payment method, transaction amounts, sending and receiving account identifiers, and transaction IDs. We do not store full credit card numbers.
                </li>
                <li>
                  <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.
                </li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">3. How We Use Your Information</h2>
              <p className="text-muted-foreground">
                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
              </p>
               <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                <li>Create and manage your account.</li>
                <li>Process your transactions and send you related information, including confirmations and invoices.</li>
                <li>Provide customer support and respond to your requests, comments, and inquiries.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
                <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
                 <li>Notify you of updates to our services.</li>
              </ul>
            </section>

             <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">4. Disclosure of Your Information</h2>
              <p className="text-muted-foreground">
               We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
              </p>
               <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, and customer service.</li>
                 <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">5. Data Security</h2>
              <p className="text-muted-foreground">
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>
            </section>
            
             <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">6. Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to access, correct, or delete your personal information. You may review or change the information in your account or terminate your account at any time by logging into your account settings. Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">7. Policy for Children</h2>
              <p className="text-muted-foreground">
                We do not knowingly solicit information from or market to children under the age of 13. If we learn that we have collected personal information from a child under age 13 without verification of parental consent, we will delete that information as quickly as possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">8. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Privacy Policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions or comments about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 text-muted-foreground">
                <p><strong>Email:</strong> info@walletexchangebd.com</p>
                <p><strong>Phone:</strong> +8801903068730</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
