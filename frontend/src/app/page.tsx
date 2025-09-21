'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-amber-600 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-amber-100 font-medium text-lg"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading CryptoLab...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-amber-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-amber-400/20 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20 text-center relative z-10">
        {/* Logo and Title */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div 
            className="relative w-32 h-32 mx-auto mb-8"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Image
              src="/cryptolab.png"
              alt="CryptoLab Logo"
              width={128}
              height={128}
              className="w-full h-full object-contain drop-shadow-2xl"
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-amber-400/20 rounded-full blur-xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
          
          <motion.h1 
            className="text-6xl md:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Crypto
            </span>
            <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
              Lab
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Experience the future of digital currency with{' '}
            <span className="text-amber-300 font-medium">physical blockchain verification</span>
          </motion.p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <motion.div 
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))"
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="w-16 h-16 bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-white text-3xl">🪙</span>
            </motion.div>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">100 Free ECO Coins</h3>
            <p className="text-blue-100 leading-relaxed">Start with 100 ECO Coins instantly when you sign up and begin your blockchain journey</p>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))"
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              whileHover={{ scale: 1.1 }}
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.5)",
                  "0 0 40px rgba(59, 130, 246, 0.8)",
                  "0 0 20px rgba(59, 130, 246, 0.5)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-white text-3xl">⚡</span>
            </motion.div>
            <h3 className="text-2xl font-bold text-blue-300 mb-4">Physical Blockchain</h3>
            <p className="text-blue-100 leading-relaxed">Watch hardware nodes verify your transactions with mesmerizing light displays</p>
          </motion.div>

          <motion.div 
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))"
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="w-16 h-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-white text-3xl">🔒</span>
            </motion.div>
            <h3 className="text-2xl font-bold text-amber-300 mb-4">Secure Transfers</h3>
            <p className="text-blue-100 leading-relaxed">Military-grade security ensures your transactions are protected and verified</p>
          </motion.div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          className="space-y-6 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href="/signup"
              className="block sm:inline-block bg-transparent border-2 border-amber-400 text-amber-300 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-amber-400/10 hover:border-amber-300 hover:text-amber-200 transition-all shadow-xl hover:shadow-amber-400/25 backdrop-blur-sm"
            >
              Sign up
            </Link>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href="/login"
              className="block sm:inline-block bg-transparent border-2 border-blue-400 text-blue-300 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-400/10 hover:border-blue-300 hover:text-blue-200 transition-all shadow-xl hover:shadow-blue-400/25 backdrop-blur-sm"
            >
              Log in
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}