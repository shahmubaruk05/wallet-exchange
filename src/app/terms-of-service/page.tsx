
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Wallet Exchange',
  description: 'Our Terms of Service for using the Wallet Exchange platform.',
};

export default function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By using our website and services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms affect your legal rights and obligations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">2. Description of Service</h2>
              <p className="text-muted-foreground">
                Wallet Exchange provides a platform for users to exchange digital funds between various e-wallets and payment systems, and to acquire and manage virtual cards for online payments. We act as an intermediary to facilitate these transactions.
              </p>
            </section>

             <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">3. User Accounts</h2>
              <p className="text-muted-foreground mb-4">
                To use most features of the Service, you must register for an account. When you register for an account, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Provide accurate, current, and complete information.</li>
                <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
                <li>Promptly notify us if you discover or otherwise suspect any security breaches related to the Service.</li>
                <li>Be responsible for all activities that occur under your account.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">4. Transactions and Payments</h2>
               <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                <li><strong>Exchange Rates & Fees:</strong> All exchange rates are displayed on our platform. Fees for each transaction will be clearly indicated before you confirm the transaction. We reserve the right to change our fees and rates at any time.</li>
                <li><strong>Transaction Processing:</strong> We will process your transactions as promptly as possible. However, we are not responsible for delays caused by payment systems or circumstances beyond our control. Most transactions are processed within 30-60 minutes during business hours (10 AM - 10 PM BDT).</li>
                <li><strong>User Responsibility:</strong> You are responsible for providing correct account details for sending and receiving funds. Transactions to incorrect account details are irreversible, and we will not be liable for any loss incurred.</li>
                <li><strong>Verification:</strong> We reserve the right to request additional information to verify your identity and the legitimacy of your funds before processing any transaction.</li>
              </ul>
            </section>

             <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">5. Prohibited Activities</h2>
              <p className="text-muted-foreground">
               You agree not to use the Service for any illegal or unauthorized purpose, including but not limited to:
              </p>
               <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                <li>Money laundering, terrorist financing, or any other illegal activities.</li>
                <li>Engaging in any fraudulent activity, including the use of stolen cards or funds.</li>
                <li>Harassing, abusing, or harming another person.</li>
                <li>Attempting to circumvent any security features of the Service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">6. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                The Service is provided on an "as is" and "as available" basis. To the fullest extent permitted by applicable law, Wallet Exchange shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from your use of the Service.
              </p>
            </section>
            
             <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">7. Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right, without notice and in our sole discretion, to terminate your right to use the Service, and to block or prevent your future access to and use of the Service for any reason, including violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">8. Changes to These Terms</h2>
              <p className="text-muted-foreground">
                We may modify these Terms at any time. We will provide notice of such changes by posting the revised Terms on our website and updating the "Last updated" date. Your continued use of the Service will confirm your acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at:
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
