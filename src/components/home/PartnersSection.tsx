const partners = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  logo: '/assets/logo.png',
}));

export const PartnersSection = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our <span className="text-gradient">Partners</span>
          </h2>
          <p className="text-muted-foreground">
            Trusted by leading educational and creative organizations
          </p>
        </div>

        {/* Single-line marquee logos */}
        <div className="relative overflow-hidden">
          <div className="flex marquee">
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="flex-shrink-0 mx-10 opacity-80 hover:opacity-100 transition-all duration-300"
              >
                <div className="w-44 h-16 sm:h-18 bg-[#DC143C] rounded-lg shadow-md flex items-center justify-center px-4 py-2 hover:shadow-lg transition-all">
                  <img
                    src={partner.logo}
                    alt="Story Seed Studio"
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
