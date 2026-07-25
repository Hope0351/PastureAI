import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Satellite, Brain, Truck, Shield, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const SLIDES = [
  {
    src: '/landing/slide-01.jpg',
    alt: 'Pastoralist with cattle on dry rangeland',
  },
  {
    src: '/landing/slide-02.jpg',
    alt: 'Herder on cracked earth with goats during drought',
  },
  {
    src: '/landing/slide-03.jpg',
    alt: 'Elder feeding young goats from a shared bowl',
  },
  {
    src: '/landing/slide-04.jpg',
    alt: 'Woman milking cattle in traditional pastoral dress',
  },
] as const;

const SLIDE_MS = 5500;

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink overflow-x-hidden">
      {/* Hero Section — Full viewport cinematic */}
      <section className="relative min-h-[100svh] overflow-hidden">
        {/* Background image with smooth transitions */}
        <AnimatePresence mode="sync">
          <motion.img
            key={SLIDES[index].src}
            src={SLIDES[index].src}
            alt={SLIDES[index].alt}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a120e]/75 via-[#0a120e]/45 to-[#0a120e]/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a120e]/70 via-transparent to-[#0a120e]/30" />
        
        {/* Subtle grain texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Animated accent line */}
        <motion.div 
          className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-field/40 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-6 pb-16 pt-10 sm:px-10 sm:pb-24 lg:px-16">
          {/* Status indicator */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ok"></span>
            </span>
            <span className="text-xs font-medium text-white/80 tracking-wide">Live Monitoring Active</span>
          </motion.div>

          {/* Main headline */}
          <motion.p
            className="font-display text-6xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl lg:text-9xl"
            style={{ lineHeight: 0.95 }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            Geo
            <span className="text-gradient-field" style={{ 
              background: 'linear-gradient(135deg, #4ade80, #22c55e, #86efac)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Forage</span>
          </motion.p>

          <motion.h1
            className="mt-5 max-w-2xl font-display text-2xl font-semibold tracking-tight text-white/95 sm:text-3xl md:text-4xl lg:text-5xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            See forage fail before herds do.
          </motion.h1>

          <motion.p
            className="mt-4 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            AI-powered satellite vegetation monitoring, live weather intelligence, and capacity-aware feed routing for Ethiopian pastoral systems.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={onEnter}
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-white px-8 py-4 text-sm font-bold text-ink shadow-2xl shadow-black/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl"
            >
              <span className="relative z-10 flex items-center gap-3">
                Enter Command Center
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-field to-ok opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="absolute z-10 hidden items-center gap-3 text-white group-hover:flex">
                Enter Command Center
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
            
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-7 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4" />
              How it works
            </a>
          </motion.div>

          {/* Slide indicators */}
          <div className="mt-12 flex max-w-sm gap-2" aria-label="Slideshow progress">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/20 transition-all duration-300 hover:bg-white/30"
              >
                <motion.span
                  className={`block h-full rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
                  initial={false}
                  animate={{ 
                    width: i === index ? '100%' : i < index ? '100%' : '0%',
                    backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.5)'
                  }}
                  transition={
                    i === index ? { duration: SLIDE_MS / 1000, ease: 'linear' } : { duration: 0.3 }
                  }
                  key={`${index}-${i}`}
                />
              </button>
            ))}
          </div>

          {/* Floating stats preview */}
          <motion.div
            className="absolute bottom-16 right-6 hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl lg:block xl:right-16"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] uppercase tracking-widest text-white/50 mb-3">Live Coverage</p>
            <div className="space-y-3">
              {[
                { label: 'Districts Monitored', value: '12', icon: Satellite },
                { label: 'Weather Stations', value: 'Live', icon: Brain },
                { label: 'Feed Depots', value: '5', icon: Truck },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between gap-6">
                  <span className="flex items-center gap-2 text-sm text-white/70">
                    <stat.icon className="h-3.5 w-3.5 text-ok" />
                    {stat.label}
                  </span>
                  <span className="font-display text-sm font-bold text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative overflow-hidden px-6 py-24 sm:px-10 lg:px-16">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div 
            className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full opacity-[0.06]"
            style={{
              background: 'radial-gradient(circle, var(--color-field), transparent 70%)'
            }}
          />
          <div 
            className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-[0.05]"
            style={{
              background: 'radial-gradient(circle, var(--color-sky), transparent 70%)'
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-field-soft px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-field">
              <Shield className="h-3.5 w-3.5" />
              The Platform
            </span>
            <h2 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              From pasture signal{' '}
              <span className="text-gradient-field">to feed truck.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted">
              One decision path: detect stress early, size the feed need, and dispatch before livestock losses compound.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: Satellite,
                title: 'Sense',
                description: 'Sentinel-2 NDVI and Open-Meteo rainfall show where rangelands are tipping into deficit before visible signs appear.',
                color: 'sky',
                gradient: 'from-sky/10 to-sky/5',
              },
              {
                step: '02',
                icon: Brain,
                title: 'Forecast',
                description: 'Ensemble models project forage risk at 15, 30, 45, and 60 days — quantifying livestock saved if you act now.',
                color: 'signal',
                gradient: 'from-signal/10 to-signal/5',
              },
              {
                step: '03',
                icon: Truck,
                title: 'Dispatch',
                description: 'Clarke-Wright routing assigns depots, trucks, and corridors under real stock constraints for maximum impact.',
                color: 'field',
                gradient: 'from-field/10 to-field/5',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="group relative"
              >
                <div className={`gf-panel h-full p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br ${item.gradient}`}>
                  {/* Step number */}
                  <span className="font-display text-4xl font-bold text-line-subtle/60">{item.step}</span>
                  
                  {/* Icon */}
                  <div className={`mt-6 inline-flex rounded-2xl bg-${item.color}-soft p-3 transition-transform duration-300 group-hover:scale-110`}>
                    <item.icon className={`h-6 w-6 text-${item.color}`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>

                  {/* Hover arrow */}
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-field opacity-0 transition-all duration-300 group-hover:opacity-100">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <button 
              onClick={onEnter}
              className="group gf-btn-primary px-8 py-4 text-base"
            >
              Open Command Overview
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line-subtle px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display text-lg font-bold text-ink">GeoForage<span className="text-field">AI</span></p>
            <p className="mt-1 text-xs text-soft">Pastoral forage intelligence · Photos from the field</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span>Sentinel-2</span>
            <span className="w-1 h-1 rounded-full bg-line" />
            <span>Open-Meteo</span>
            <span className="w-1 h-1 rounded-full bg-line" />
            <span>Ensemble Forecast</span>
            <span className="w-1 h-1 rounded-full bg-line" />
            <span>Clarke-Wright CVRP</span>
            <span className="w-1 h-1 rounded-full bg-line" />
            <span>Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
