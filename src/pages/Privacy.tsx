import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="pt-20 page-enter">
      <section className="py-16 bg-gradient-warm">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Legal</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Privacy Policy
          </h1>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-8">
              Last updated: January 1, 2025
            </p>

            <div className="space-y-8">
              <div className="animate-fade-in">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  1. Information We Collect
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We collect information you provide directly, including name, email address, age, and story submissions. For participants under 18, we collect parental/guardian contact information as well.
                </p>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  2. How We Use Your Information
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use collected information to provide and improve our services, communicate about competitions, process registrations, and ensure platform security. We never sell personal information to third parties.
                </p>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  3. Data Protection for Minors
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We take special care to protect the privacy of children. We comply with COPPA and require parental consent for users under 13. Parents can request to view, modify, or delete their child's data at any time.
                </p>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  4. Data Security
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement industry-standard security measures to protect your data. This includes encryption, secure servers, and regular security audits. However, no internet transmission is 100% secure.
                </p>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  5. Cookies and Tracking
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use cookies to improve user experience and analyze platform usage. You can control cookie settings through your browser. Essential cookies are required for basic platform functionality.
                </p>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  6. Your Rights
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to access, correct, or delete your personal information. You can also opt out of marketing communications. To exercise these rights, contact us at privacy@storyseed.studio
                </p>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  7. Contact Us
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about this Privacy Policy or data practices, contact our Data Protection Officer at privacy@storyseed.studio
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;
