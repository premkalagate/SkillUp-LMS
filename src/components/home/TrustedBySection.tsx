const TrustedBySection = () => {
  return (
    <section className="py-12 bg-secondary/30 border-y border-border/50">
      <div className="container-custom">
        <p className="text-center text-muted-foreground mb-8 font-medium">
          Trusted by learners from
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
          {/* Microsoft */}
          <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity duration-200">
            <div className="grid grid-cols-2 gap-0.5 h-5 w-5">
              <div className="bg-[#f25022]"></div>
              <div className="bg-[#7fba00]"></div>
              <div className="bg-[#00a4ef]"></div>
              <div className="bg-[#ffb900]"></div>
            </div>
            <span className="text-foreground/80 text-lg font-semibold">Microsoft</span>
          </div>

          {/* Walmart */}
          <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity duration-200">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
              {/* Walmart spark - 6 petals */}
              <path d="M12 2v6.5" stroke="#ffc220" strokeWidth="3" strokeLinecap="round"/>
              <path d="M12 15.5V22" stroke="#ffc220" strokeWidth="3" strokeLinecap="round"/>
              <path d="M3.34 7l5.63 3.25" stroke="#ffc220" strokeWidth="3" strokeLinecap="round"/>
              <path d="M15.03 13.75L20.66 17" stroke="#ffc220" strokeWidth="3" strokeLinecap="round"/>
              <path d="M3.34 17l5.63-3.25" stroke="#ffc220" strokeWidth="3" strokeLinecap="round"/>
              <path d="M15.03 10.25L20.66 7" stroke="#ffc220" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span className="text-[#0071ce] text-xl font-bold tracking-tight">Walmart</span>
          </div>

          {/* Accenture */}
          <div className="flex items-center opacity-70 hover:opacity-100 transition-opacity duration-200">
            <span className="text-foreground/80 text-xl font-semibold tracking-tight">accen</span>
            <span className="text-foreground/80 text-xl font-semibold tracking-tight relative">
              <span className="absolute -top-2.5 left-0.5 text-[#a100ff] text-sm font-bold">&gt;</span>
              t
            </span>
            <span className="text-foreground/80 text-xl font-semibold tracking-tight">ure</span>
          </div>

          {/* Adobe */}
          <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity duration-200">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#ff0000">
              <path d="M15 3h7v18l-7-18zM9 3H2v18l7-18zM12 9l5 12h-4l-1.5-4h-3L12 9z"/>
            </svg>
            <span className="text-foreground/80 text-lg font-semibold">Adobe</span>
          </div>

          {/* Google */}
          <div className="flex items-center opacity-70 hover:opacity-100 transition-opacity duration-200">
            <span className="text-lg font-semibold">
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">o</span>
              <span className="text-[#FBBC05]">o</span>
              <span className="text-[#4285F4]">g</span>
              <span className="text-[#34A853]">l</span>
              <span className="text-[#EA4335]">e</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
