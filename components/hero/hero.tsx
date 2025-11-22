'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Hero() {
  return (
    <div className="relative w-full h-[600px] overflow-visible flex items-center justify-center bg-transparent">
      <div className="w-full max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-start gap-10 h-full pt-10 pb-10 ml-4">
        <div className="flex-1 flex flex-col items-center md:items-start gap-6 mt-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center md:text-left space-y-3"
          >
            <p className="text-xs tracking-[0.35em] uppercase text-gray-400">Discover Style</p>
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight bg-gradient-to-r from-fuchsia-300 via-violet-200 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_0_32px_rgba(129,140,248,0.65)]"
              style={{ fontFamily: 'Helvetica Neue, system-ui' }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: 'easeOut' }}
            >
              Rocken My Vibe
            </motion.h1>
            <motion.p
              className="text-sm sm:text-lg text-white/90 max-w-xl mx-auto md:mx-0 font-light"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
            >
              Style your soul and your body will thank you for it.
            </motion.p>
          </motion.div>

          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
          >
            <Link href="/products">
              <motion.button
                whileHover={{ scale: 1.05, y: -2, boxShadow: '0 24px 60px rgba(0,0,0,0.75)' }}
                whileTap={{ scale: 0.97, y: 0, boxShadow: '0 14px 30px rgba(0,0,0,0.6)' }}
                className="relative px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 hover:from-zinc-800 hover:via-black hover:to-zinc-800 transition-all duration-300 text-sm sm:text-base shadow-[0_16px_40px_rgba(0,0,0,0.55)] overflow-hidden"
              >
                <span className="relative z-10">View Latest Products</span>
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-400/15 to-sky-400/0 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </Link>
          </motion.div>
        </div>

        <div className="flex-1 flex items-start justify-center w-full pt-2">
          <Product3DRotator />
        </div>
      </div>
    </div>
  );
}

function Product3DRotator() {
  const [index, setIndex] = useState(0);

  const products = [
    { src: '/images/light1.png', alt: 'Product 1' },
    { src: '/images/light2.png', alt: 'Product 2' },
    { src: '/images/twolightblue.png', alt: 'Product 3' },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % 3);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative w-full max-w-md aspect-square flex items-center justify-center -mt-6 select-none"
      style={{ perspective: '2000px' }}
    >
      {products.map((product, i) => {
        const isActive = index === i;

        return (
          <motion.div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85, rotateY: -65 }}
            animate={{
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 0.6,
              rotateY: isActive ? 0 : -65,
              zIndex: isActive ? 10 : 0,
            }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
          >
            <motion.div
              className="relative w-full h-full"
              animate={{ rotateY: isActive ? [0, 8, -8, 0] : 0 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
            >
              <Image
                src={product.src}
                alt={product.alt}
                fill
                className="object-contain drop-shadow-xl select-none"
              />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Apple-style dots */}
      <div className="absolute bottom-2 flex gap-2 z-20">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${index === i ? 'w-6 bg-black' : 'w-2 bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
}