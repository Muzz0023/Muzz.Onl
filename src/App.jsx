import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { X, Send, Minus, TrendingUp, TrendingDown, DollarSign, Target, Calendar, Dumbbell, ShoppingCart, Bell, Award, Wallet, Menu, Home, Star, Trophy, Flame, CheckCircle2, Plus, Trash2, ChevronDown, ChevronUp, LogOut, Mail, Lock, Eye, EyeOff, MessageCircle, Save, Loader2, HelpCircle, Briefcase, Upload, Download } from 'lucide-react';

// ============================================
// REVENUECAT CONFIGURATION
// ============================================
const REVENUECAT_API_KEY = 'appl_QEohIcdAgxVGnNuXLmxwhyLClVD';
const ELITE_ENTITLEMENT_ID = 'Muzz.onl Pro';
const MONTHLY_PRODUCT_ID = 'muzz_elite_monthly';

// RevenueCat helper for iOS purchases
const RevenueCat = {
  initialized: false,
  Purchases: null,
  
  async init() {
    if (this.initialized) return;
    if (typeof window === 'undefined' || !window.Capacitor?.isNativePlatform()) return;
    
    try {
      const rc = await import(/* @vite-ignore */ '@revenuecat/purchases-capacitor');
      this.Purchases = rc.Purchases;
      await this.Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      this.initialized = true;
      console.log('RevenueCat initialized');
    } catch (err) {
      console.log('RevenueCat init error:', err);
      // Fallback: try Capacitor plugin bridge directly
      try {
        if (window.Capacitor?.Plugins?.PurchasesPlugin) {
          this.Purchases = window.Capacitor.Plugins.PurchasesPlugin;
        } else {
          this.Purchases = window.Capacitor.registerPlugin('PurchasesPlugin');
        }
        await this.Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        this.initialized = true;
        console.log('RevenueCat initialized via plugin bridge');
      } catch (err2) {
        console.log('RevenueCat fallback also failed:', err2);
      }
    }
  },
  
  async checkEliteStatus() {
    if (!this.initialized || !this.Purchases) return false;
    try {
      const { customerInfo } = await this.Purchases.getCustomerInfo();
      return customerInfo.entitlements.active[ELITE_ENTITLEMENT_ID] !== undefined;
    } catch (err) {
      console.log('Error checking elite status:', err);
      return false;
    }
  },
  
  async purchaseElite() {
    if (!this.initialized || !this.Purchases) {
      alert('Purchases not available on this device');
      return { success: false };
    }
    try {
      // Get the StoreKit product directly
      const { products } = await this.Purchases.getProducts({ productIdentifiers: [MONTHLY_PRODUCT_ID] });
      if (!products || products.length === 0) {
        alert('Product not found. Please try again later.');
        return { success: false };
      }
      const product = products[0];
      const { customerInfo } = await this.Purchases.purchaseStoreProduct({ product });
      const isElite = customerInfo.entitlements.active[ELITE_ENTITLEMENT_ID] !== undefined;
      return { success: isElite, customerInfo };
    } catch (err) {
      if (err.code === '1' || err.userCancelled || err.code === 'PURCHASE_CANCELLED') {
        return { success: false, cancelled: true };
      }
      console.log('Purchase error:', err);
      alert('Purchase failed: ' + (err.message || err));
      return { success: false, error: err };
    }
  },
  
  async restorePurchases() {
    if (!this.initialized || !this.Purchases) {
      alert('Purchases not available on this device');
      return { success: false };
    }
    try {
      const { customerInfo } = await this.Purchases.restorePurchases();
      const isElite = customerInfo.entitlements.active[ELITE_ENTITLEMENT_ID] !== undefined;
      return { success: isElite, customerInfo };
    } catch (err) {
      console.log('Restore error:', err);
      alert('Could not restore purchases. Please try again.');
      return { success: false, error: err };
    }
  },
  
  async getOfferings() {
    if (!this.initialized || !this.Purchases) return null;
    try {
      const { offerings } = await this.Purchases.getOfferings();
      return offerings;
    } catch (err) {
      console.log('Error getting offerings:', err);
      return null;
    }
  }
};

// ============================================
// STARRY BACKGROUND COMPONENT
// ============================================
const StarryBackground = ({ children }) => {
  // Generate stable star positions using useMemo
  const stars = React.useMemo(() => {
    const smallStars = [...Array(100)].map((_, i) => ({
      id: `s-${i}`,
      left: `${(i * 17 + 7) % 100}%`,
      top: `${(i * 23 + 11) % 100}%`,
      duration: 2 + (i % 5) * 0.5,
      delay: (i % 7) * 0.3
    }));
    const mediumStars = [...Array(40)].map((_, i) => ({
      id: `m-${i}`,
      left: `${(i * 31 + 13) % 100}%`,
      top: `${(i * 29 + 19) % 100}%`,
      duration: 3 + (i % 4) * 0.7,
      delay: (i % 5) * 0.4
    }));
    const largeStars = [...Array(15)].map((_, i) => ({
      id: `l-${i}`,
      left: `${(i * 41 + 17) % 100}%`,
      top: `${(i * 37 + 23) % 100}%`,
      duration: 4 + (i % 3) * 0.8,
      delay: (i % 4) * 0.5
    }));
    return { smallStars, mediumStars, largeStars };
  }, []);

  return (
    <div className="relative noise-overlay" style={{background:"linear-gradient(180deg,#020817 0%,#050d1a 40%,#030a14 100%)"}}>
      {/* Futuristic grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{backgroundImage: 'linear-gradient(rgba(0,200,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
      {/* Ambient glow orbs */}
      <div className="fixed pointer-events-none z-0" style={{width:'400px',height:'400px',borderRadius:'50%',background:'rgba(0,150,255,0.06)',filter:'blur(100px)',top:'-100px',right:'-80px'}} />
      <div className="fixed pointer-events-none z-0" style={{width:'300px',height:'300px',borderRadius:'50%',background:'rgba(255,120,0,0.04)',filter:'blur(80px)',bottom:'200px',left:'-60px'}} />
      {/* Stars layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Small stars */}
        {stars.smallStars.map((star) => (
          <div
            key={star.id}
            className="absolute w-0.5 h-0.5 bg-white rounded-full star-twinkle"
            style={{
              left: star.left,
              top: star.top,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`
            }}
          />
        ))}
        {/* Medium stars */}
        {stars.mediumStars.map((star) => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-blue-100 rounded-full star-twinkle"
            style={{
              left: star.left,
              top: star.top,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`
            }}
          />
        ))}
        {/* Large stars */}
        {stars.largeStars.map((star) => (
          <div
            key={star.id}
            className="absolute w-1.5 h-1.5 bg-purple-200 rounded-full star-twinkle-slow"
            style={{
              left: star.left,
              top: star.top,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`
            }}
          />
        ))}
      </div>
      {/* CSS for twinkle animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

        /* ── FUTURISTIC ANIMATIONS ── */
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');

        /* Noise texture */
        .noise-overlay::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          opacity: 0.4;
        }

        /* HUD number font */
        .hud-number {
          font-family: 'Share Tech Mono', monospace !important;
          letter-spacing: 1px;
        }

        /* Cyan glow pulse on active nav */
        @keyframes navPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(0,200,255,0.3); }
          50% { box-shadow: 0 0 16px rgba(0,200,255,0.7), 0 0 30px rgba(0,200,255,0.3); }
        }
        .nav-active-glow {
          animation: navPulse 2s ease-in-out infinite;
        }

        /* Header scan line animation */
        @keyframes headerScan {
          0% { transform: translateX(-100%); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        .header-scan::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #00c8ff, transparent);
          animation: headerScan 4s ease-in-out infinite;
        }

        /* Progress bar glow */
        .progress-glow {
          box-shadow: 0 0 8px rgba(0,200,255,0.6), 0 0 16px rgba(0,200,255,0.3);
        }

        /* Stat card count-up glow */
        @keyframes statAppear {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-appear {
          animation: statAppear 0.5s ease-out forwards;
        }

        /* Kangaroo button pulse */
        @keyframes kangPulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(251,146,60,0.4); }
          50% { box-shadow: 0 4px 32px rgba(251,146,60,0.7), 0 0 40px rgba(251,146,60,0.3); }
        }
        .kang-pulse {
          animation: kangPulse 3s ease-in-out infinite;
        }

        /* Button press glow */
        .btn-cyber:active {
          box-shadow: 0 0 20px rgba(0,200,255,0.5) !important;
          transform: scale(0.97);
        }

        /* Sidebar glow edge */
        @keyframes sidebarGlow {
          0%, 100% { box-shadow: 4px 0 40px rgba(0,0,0,0.8), 0 0 30px rgba(0,200,255,0.05); }
          50% { box-shadow: 4px 0 40px rgba(0,0,0,0.8), 0 0 50px rgba(0,200,255,0.12); }
        }
        .sidebar-glow {
          animation: sidebarGlow 4s ease-in-out infinite;
        }

        /* Cyber loading spinner */
        @keyframes cyberSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .cyber-spinner {
          width: 40px; height: 40px;
          border: 2px solid rgba(0,200,255,0.1);
          border-top: 2px solid #00c8ff;
          border-radius: 50%;
          animation: cyberSpin 0.8s linear infinite;
          box-shadow: 0 0 12px rgba(0,200,255,0.3);
        }

        .cyber-tab-active {
          background: rgba(0,200,255,0.15) !important;
          border: 1px solid rgba(0,200,255,0.5) !important;
          color: #00c8ff !important;
          box-shadow: 0 0 12px rgba(0,200,255,0.2) !important;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes twinkleSlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .star-twinkle {
          animation: twinkle ease-in-out infinite;
        }
        .star-twinkle-slow {
          animation: twinkleSlow ease-in-out infinite;
        }
        /* ==========================================
           DARK MODE — Comprehensive Theme Override
           ========================================== */

        /* --- BASE TEXT COLORS --- */
        .dark-mode h1, .dark-mode h2, .dark-mode h3, .dark-mode h4, .dark-mode h5, .dark-mode h6,
        .dark-mode p, .dark-mode span, .dark-mode label, .dark-mode div {
          color: inherit;
        }
        /* Dark gray/slate text → light */
        .dark-mode .text-gray-900, .dark-mode .text-gray-800, .dark-mode .text-gray-700,
        .dark-mode .text-slate-900, .dark-mode .text-slate-800, .dark-mode .text-slate-700 {
          color: #f3f4f6 !important;
        }
        .dark-mode .text-gray-600, .dark-mode .text-gray-500, .dark-mode .text-gray-400,
        .dark-mode .text-slate-600, .dark-mode .text-slate-500, .dark-mode .text-slate-400 {
          color: #9ca3af !important;
        }
        .dark-mode .text-gray-300 {
          color: #d1d5db !important;
        }
        /* Protect white text from being overridden */
        .dark-mode .text-white,
        .dark-mode [class*="text-white"] {
          color: white !important;
        }
        .dark-mode .text-black {
          color: #ffffff !important;
        }

        /* --- COLORED TEXT — brighten dark-on-light text for dark backgrounds --- */
        .dark-mode .text-amber-900, .dark-mode .text-amber-800, .dark-mode .text-amber-700 {
          color: #fbbf24 !important;
        }
        .dark-mode .text-amber-600, .dark-mode .text-amber-500 {
          color: #fbbf24 !important;
        }
        .dark-mode .text-orange-900, .dark-mode .text-orange-800, .dark-mode .text-orange-700 {
          color: #fb923c !important;
        }
        .dark-mode .text-orange-600, .dark-mode .text-orange-500 {
          color: #fb923c !important;
        }
        .dark-mode .text-red-800, .dark-mode .text-red-700, .dark-mode .text-red-600 {
          color: #f87171 !important;
        }
        .dark-mode .text-red-500, .dark-mode .text-red-400 {
          color: #f87171 !important;
        }
        .dark-mode .text-green-800, .dark-mode .text-green-700, .dark-mode .text-green-600 {
          color: #4ade80 !important;
        }
        .dark-mode .text-green-500 {
          color: #4ade80 !important;
        }
        .dark-mode .text-emerald-800, .dark-mode .text-emerald-700, .dark-mode .text-emerald-600, .dark-mode .text-emerald-500 {
          color: #34d399 !important;
        }
        .dark-mode .text-blue-700, .dark-mode .text-blue-600, .dark-mode .text-blue-500 {
          color: #60a5fa !important;
        }
        .dark-mode .text-indigo-700, .dark-mode .text-indigo-600, .dark-mode .text-indigo-500 {
          color: #818cf8 !important;
        }
        .dark-mode .text-purple-700, .dark-mode .text-purple-600, .dark-mode .text-purple-500 {
          color: #a78bfa !important;
        }
        .dark-mode .text-pink-700, .dark-mode .text-pink-600, .dark-mode .text-pink-500 {
          color: #f472b6 !important;
        }
        .dark-mode .text-rose-700, .dark-mode .text-rose-600, .dark-mode .text-rose-500 {
          color: #fb7185 !important;
        }
        .dark-mode .text-yellow-700, .dark-mode .text-yellow-600, .dark-mode .text-yellow-500 {
          color: #facc15 !important;
        }
        .dark-mode .text-teal-800, .dark-mode .text-teal-700, .dark-mode .text-teal-600, .dark-mode .text-teal-500 {
          color: #2dd4bf !important;
        }
        .dark-mode .text-cyan-700, .dark-mode .text-cyan-600, .dark-mode .text-cyan-500 {
          color: #22d3ee !important;
        }
        .dark-mode .text-lime-700, .dark-mode .text-lime-600, .dark-mode .text-lime-500 {
          color: #a3e635 !important;
        }
        .dark-mode .text-violet-700, .dark-mode .text-violet-600, .dark-mode .text-violet-500 {
          color: #a78bfa !important;
        }
        .dark-mode .text-sky-700, .dark-mode .text-sky-600, .dark-mode .text-sky-500 {
          color: #38bdf8 !important;
        }

        /* --- FONT WEIGHT text color — only apply when no specific colored text class is present --- */
        .dark-mode .font-semibold, .dark-mode .font-bold, .dark-mode .font-medium {
          color: #f3f4f6;
        }
        /* Inside gradients, font-weight text should be white */
        .dark-mode [class*="from-"] .font-semibold,
        .dark-mode [class*="from-"] .font-bold,
        .dark-mode [class*="from-"] .font-medium {
          color: white !important;
        }
        /* 
         * CRITICAL: When an element has BOTH a font-weight class AND a colored text class,
         * the colored text class should win. We achieve this by making the colored text
         * rules use !important while the font-weight rule does NOT use !important.
         */

        /* --- CARD / SURFACE BACKGROUNDS --- */
        .dark-mode .bg-white {
          background-color: rgba(30, 41, 59, 0.85) !important;
          backdrop-filter: blur(12px);
        }
        .dark-mode .bg-gray-50, .dark-mode .bg-slate-50 {
          background-color: rgba(30, 41, 59, 0.4) !important;
        }
        .dark-mode .bg-gray-100, .dark-mode .bg-slate-100 {
          background-color: rgba(51, 65, 85, 0.5) !important;
        }
        .dark-mode .bg-gray-200 {
          background-color: rgba(51, 65, 85, 0.7) !important;
        }

        /* --- ALL COLORED 50-level backgrounds → dark translucent --- */
        .dark-mode .bg-amber-50, .dark-mode .bg-orange-50, .dark-mode .bg-yellow-50,
        .dark-mode .bg-red-50, .dark-mode .bg-rose-50,
        .dark-mode .bg-green-50, .dark-mode .bg-emerald-50, .dark-mode .bg-lime-50, .dark-mode .bg-teal-50,
        .dark-mode .bg-blue-50, .dark-mode .bg-indigo-50, .dark-mode .bg-cyan-50,
        .dark-mode .bg-purple-50, .dark-mode .bg-violet-50,
        .dark-mode .bg-pink-50, .dark-mode .bg-fuchsia-50, .dark-mode .bg-sky-50 {
          background-color: rgba(51, 65, 85, 0.5) !important;
        }

        /* --- ALL COLORED 100-level backgrounds → slightly lighter dark --- */
        .dark-mode .bg-amber-100, .dark-mode .bg-orange-100, .dark-mode .bg-yellow-100,
        .dark-mode .bg-red-100, .dark-mode .bg-rose-100,
        .dark-mode .bg-green-100, .dark-mode .bg-emerald-100, .dark-mode .bg-lime-100, .dark-mode .bg-teal-100,
        .dark-mode .bg-blue-100, .dark-mode .bg-indigo-100, .dark-mode .bg-cyan-100,
        .dark-mode .bg-purple-100, .dark-mode .bg-violet-100,
        .dark-mode .bg-pink-100, .dark-mode .bg-fuchsia-100, .dark-mode .bg-sky-100 {
          background-color: rgba(51, 65, 85, 0.6) !important;
        }

        /* --- ALL COLORED 200-level backgrounds --- */
        .dark-mode .bg-amber-200, .dark-mode .bg-orange-200, .dark-mode .bg-yellow-200,
        .dark-mode .bg-red-200, .dark-mode .bg-rose-200,
        .dark-mode .bg-green-200, .dark-mode .bg-emerald-200,
        .dark-mode .bg-blue-200, .dark-mode .bg-indigo-200,
        .dark-mode .bg-purple-200, .dark-mode .bg-pink-200 {
          background-color: rgba(51, 65, 85, 0.7) !important;
        }

        /* --- BORDERS --- */
        .dark-mode .border, .dark-mode .border-b, .dark-mode .border-t, .dark-mode .border-l, .dark-mode .border-r,
        .dark-mode .divide-y > *, .dark-mode .divide-x > * {
          border-color: rgba(71, 85, 105, 0.5) !important;
        }
        /* Colored borders → subtle dark versions */
        .dark-mode [class*="border-amber-"], .dark-mode [class*="border-orange-"],
        .dark-mode [class*="border-red-"], .dark-mode [class*="border-rose-"],
        .dark-mode [class*="border-green-"], .dark-mode [class*="border-emerald-"],
        .dark-mode [class*="border-blue-"], .dark-mode [class*="border-indigo-"],
        .dark-mode [class*="border-purple-"], .dark-mode [class*="border-pink-"],
        .dark-mode [class*="border-yellow-"], .dark-mode [class*="border-teal-"],
        .dark-mode [class*="border-cyan-"], .dark-mode [class*="border-lime-"],
        .dark-mode [class*="border-violet-"] {
          border-color: rgba(71, 85, 105, 0.6) !important;
        }

        /* --- FORM INPUTS --- */
        .dark-mode input, .dark-mode textarea, .dark-mode select {
          background-color: rgba(30, 41, 59, 0.9) !important;
          color: #f3f4f6 !important;
          border-color: rgba(71, 85, 105, 0.7) !important;
        }
        .dark-mode input::placeholder, .dark-mode textarea::placeholder {
          color: #6b7280 !important;
        }

        /* --- HOVER STATES --- */
        .dark-mode .hover\\:bg-gray-50:hover, .dark-mode .hover\\:bg-slate-50:hover {
          background-color: rgba(51, 65, 85, 0.5) !important;
        }
        .dark-mode .hover\\:bg-red-50:hover, .dark-mode .hover\\:bg-amber-50:hover,
        .dark-mode .hover\\:bg-orange-50:hover, .dark-mode .hover\\:bg-green-50:hover,
        .dark-mode .hover\\:bg-pink-50:hover, .dark-mode .hover\\:bg-blue-50:hover {
          background-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark-mode .hover\\:bg-red-100:hover, .dark-mode .hover\\:bg-amber-100:hover,
        .dark-mode .hover\\:bg-orange-100:hover, .dark-mode .hover\\:bg-blue-100:hover,
        .dark-mode .hover\\:bg-green-100:hover, .dark-mode .hover\\:bg-pink-100:hover,
        .dark-mode .hover\\:bg-rose-100:hover, .dark-mode .hover\\:bg-cyan-100:hover,
        .dark-mode .hover\\:bg-indigo-100:hover, .dark-mode .hover\\:bg-red-200:hover,
        .dark-mode .hover\\:bg-blue-200:hover {
          background-color: rgba(51, 65, 85, 0.7) !important;
        }
        .dark-mode .hover\\:brightness-95:hover {
          filter: brightness(1.1) !important;
        }

        /* --- TABLES --- */
        .dark-mode table thead tr {
          background-color: rgba(30, 41, 59, 0.9) !important;
        }
        .dark-mode table thead tr th {
          color: #e5e7eb !important;
        }
        .dark-mode table tbody tr {
          background-color: transparent !important;
        }
        .dark-mode table th, .dark-mode table td {
          color: #e5e7eb !important;
        }
        /* Override colored table row backgrounds */
        .dark-mode table tbody tr.bg-green-50,
        .dark-mode table tbody tr[class*="bg-green-50"] {
          background-color: rgba(34, 197, 94, 0.1) !important;
        }

        /* --- SHADOWS --- */
        .dark-mode .shadow-sm, .dark-mode .shadow, .dark-mode .shadow-md, .dark-mode .shadow-lg, .dark-mode .shadow-2xl {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
        }

        /* --- GRADIENT BACKGROUNDS — keep text white, preserve gradient colors --- */
        .dark-mode .bg-gradient-to-r, .dark-mode .bg-gradient-to-br, .dark-mode .bg-gradient-to-b,
        .dark-mode .bg-gradient-to-l, .dark-mode .bg-gradient-to-t,
        .dark-mode .bg-gradient-to-tr, .dark-mode .bg-gradient-to-bl {
          color: white !important;
        }

        /* --- ITALIC text inside dark cards (quotes, notes) --- */
        .dark-mode .italic {
          color: #d1d5db !important;
        }

        /* --- SPECIFIC COMPONENT FIXES --- */

        /* Light pastel gradient backgrounds (50-level from-X-50 to-Y-50) → dark */
        .dark-mode [class*="from-green-50"], .dark-mode [class*="from-amber-50"],
        .dark-mode [class*="from-blue-50"], .dark-mode [class*="from-purple-50"],
        .dark-mode [class*="from-red-50"], .dark-mode [class*="from-orange-50"],
        .dark-mode [class*="from-indigo-50"], .dark-mode [class*="from-slate-50"],
        .dark-mode [class*="from-emerald-50"], .dark-mode [class*="from-rose-50"],
        .dark-mode [class*="from-pink-50"], .dark-mode [class*="from-gray-50"],
        .dark-mode [class*="from-yellow-50"], .dark-mode [class*="from-cyan-50"],
        .dark-mode [class*="from-teal-50"],
        .dark-mode [class*="from-gray-100"], .dark-mode [class*="from-slate-100"],
        .dark-mode [class*="from-amber-100"], .dark-mode [class*="from-orange-100"],
        .dark-mode [class*="from-emerald-100"], .dark-mode [class*="from-teal-100"],
        .dark-mode [class*="from-green-100"], .dark-mode [class*="from-blue-100"],
        .dark-mode [class*="from-red-100"], .dark-mode [class*="from-purple-100"],
        .dark-mode [class*="from-pink-100"], .dark-mode [class*="from-yellow-100"] {
          background: rgba(51, 65, 85, 0.6) !important;
        }

        /* Ensure text inside VIVID gradient containers (500+ level colors) stays white */
        .dark-mode [class*="from-"][class*="to-"] *:not(input):not(textarea):not(select) {
          color: white !important;
        }

        /* OVERRIDE: For light/pastel gradient containers (50/100-level), 
           don't force white — use light gray as default, but allow colored text classes to show */
        .dark-mode [class*="from-green-50"] *,
        .dark-mode [class*="from-amber-50"] *,
        .dark-mode [class*="from-blue-50"] *,
        .dark-mode [class*="from-purple-50"] *,
        .dark-mode [class*="from-red-50"] *,
        .dark-mode [class*="from-orange-50"] *,
        .dark-mode [class*="from-indigo-50"] *,
        .dark-mode [class*="from-slate-50"] *,
        .dark-mode [class*="from-emerald-50"] *,
        .dark-mode [class*="from-rose-50"] *,
        .dark-mode [class*="from-pink-50"] *,
        .dark-mode [class*="from-gray-50"] *,
        .dark-mode [class*="from-green-100"] *,
        .dark-mode [class*="from-emerald-100"] *,
        .dark-mode [class*="from-teal-100"] *,
        .dark-mode [class*="from-blue-100"] *,
        .dark-mode [class*="from-red-100"] *,
        .dark-mode [class*="from-gray-100"] *,
        .dark-mode [class*="from-slate-100"] *,
        .dark-mode [class*="from-amber-100"] *,
        .dark-mode [class*="from-orange-100"] *,
        .dark-mode [class*="from-purple-100"] *,
        .dark-mode [class*="from-pink-100"] *,
        .dark-mode [class*="from-yellow-100"] * {
          color: #e5e7eb !important;
        }
        /* Allow colored text inside pastel gradients to keep their bright colors */
        .dark-mode [class*="from-green-1"] .text-green-800,
        .dark-mode [class*="from-green-1"] .text-green-700,
        .dark-mode [class*="from-green-1"] .text-green-600,
        .dark-mode [class*="from-emerald-1"] .text-emerald-800,
        .dark-mode [class*="from-emerald-1"] .text-emerald-700 {
          color: #4ade80 !important;
        }
        .dark-mode [class*="from-red-1"] .text-red-800,
        .dark-mode [class*="from-red-1"] .text-red-700,
        .dark-mode [class*="from-red-1"] .text-red-600 {
          color: #f87171 !important;
        }
        .dark-mode [class*="from-amber-1"] .text-amber-800,
        .dark-mode [class*="from-amber-1"] .text-amber-700,
        .dark-mode [class*="from-amber-1"] .text-amber-600,
        .dark-mode [class*="from-orange-1"] .text-orange-800,
        .dark-mode [class*="from-orange-1"] .text-orange-700 {
          color: #fbbf24 !important;
        }
        .dark-mode [class*="from-blue-1"] .text-blue-800,
        .dark-mode [class*="from-blue-1"] .text-blue-700 {
          color: #60a5fa !important;
        }
        .dark-mode [class*="from-purple-1"] .text-purple-800,
        .dark-mode [class*="from-purple-1"] .text-purple-700 {
          color: #a78bfa !important;
        }
        .dark-mode [class*="from-emerald-1"] .text-teal-800,
        .dark-mode [class*="from-emerald-1"] .text-teal-700,
        .dark-mode [class*="from-teal-1"] .text-teal-800,
        .dark-mode [class*="from-teal-1"] .text-teal-700 {
          color: #2dd4bf !important;
        }

        /* --- FOCUS STATES for colored focus backgrounds --- */
        .dark-mode .focus\\:bg-amber-50:focus {
          background-color: rgba(51, 65, 85, 0.6) !important;
        }

        /* --- RING COLORS (selection highlights) --- */
        .dark-mode [class*="ring-pink-"] {
          --tw-ring-color: rgba(236, 72, 153, 0.6) !important;
        }

        /* --- PRESERVE elements inside vivid gradients --- */
        /* bg-white boxes inside gradients (like kangaroo avatar, badges, active tabs) should stay white */
        .dark-mode [class*="from-amber-"] .bg-white,
        .dark-mode [class*="from-orange-"] .bg-white,
        .dark-mode [class*="from-blue-"] .bg-white,
        .dark-mode [class*="from-indigo-"] .bg-white,
        .dark-mode [class*="from-purple-"] .bg-white,
        .dark-mode [class*="from-green-"] .bg-white,
        .dark-mode [class*="from-emerald-"] .bg-white,
        .dark-mode [class*="from-pink-"] .bg-white,
        .dark-mode [class*="from-rose-"] .bg-white,
        .dark-mode [class*="from-red-"] .bg-white,
        .dark-mode [class*="from-teal-"] .bg-white,
        .dark-mode [class*="from-cyan-"] .bg-white,
        .dark-mode [class*="from-lime-"] .bg-white,
        .dark-mode [class*="from-violet-"] .bg-white {
          background-color: white !important;
          color: #1f2937 !important;
        }

        /* Inputs inside vivid gradients should stay transparent/glass, not forced dark */
        .dark-mode [class*="from-blue-5"] input,
        .dark-mode [class*="from-blue-6"] input,
        .dark-mode [class*="from-indigo-"] input,
        .dark-mode [class*="from-purple-5"] input,
        .dark-mode [class*="from-purple-6"] input,
        .dark-mode [class*="from-amber-4"] input,
        .dark-mode [class*="from-amber-5"] input,
        .dark-mode [class*="from-orange-4"] input,
        .dark-mode [class*="from-orange-5"] input,
        .dark-mode [class*="from-green-5"] input,
        .dark-mode [class*="from-emerald-5"] input,
        .dark-mode [class*="from-pink-5"] input,
        .dark-mode [class*="from-rose-5"] input,
        .dark-mode [class*="from-red-5"] input {
          background-color: transparent !important;
          color: white !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
        }
        .dark-mode [class*="from-blue-5"] input::placeholder,
        .dark-mode [class*="from-blue-6"] input::placeholder,
        .dark-mode [class*="from-indigo-"] input::placeholder,
        .dark-mode [class*="from-purple-5"] input::placeholder,
        .dark-mode [class*="from-purple-6"] input::placeholder,
        .dark-mode [class*="from-amber-4"] input::placeholder,
        .dark-mode [class*="from-orange-5"] input::placeholder,
        .dark-mode [class*="from-green-5"] input::placeholder,
        .dark-mode [class*="from-pink-5"] input::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }

        /* bg-white/10, bg-white/20, bg-white/30 inside gradients — preserve glass effect.
           These use Tailwind's --tw-bg-opacity, so we just ensure they aren't overridden by the .bg-white rule */
        .dark-mode [class*="from-"][class*="to-"] [class*="bg-white\\/"] {
          background-color: inherit !important;
        }
        /* Hide scrollbar for horizontal scroll tabs */
        .overflow-x-auto::-webkit-scrollbar { display: none; }
        /* iOS INPUT FIXES - bigger touch targets */
        input[type="text"], input[type="date"], input[type="number"], input[type="email"], input[type="password"], textarea, select {
          font-size: 16px !important; /* Prevents iOS zoom on focus */
          min-height: 44px;
        }
        /* Extra bottom padding for keyboard */
        .pb-24 { padding-bottom: 8rem !important; }
        @supports (-webkit-touch-callout: none) {
          .pb-24 { padding-bottom: 12rem !important; }
        }
      `}</style>
      {/* Content */}
      <div className="relative z-10 dark-mode">
        {children}
      </div>
    </div>
  );
};

// ============================================
// MOBILE KEYBOARD HELPER
// ============================================
const scrollInputIntoView = (e) => {
  // Longer delay for iOS keyboard to fully open
  setTimeout(() => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 400);
  // Second scroll to catch late keyboard resize
  setTimeout(() => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 800);
};

// Auto-resize textarea to show full content
const autoResizeTextarea = (e) => {
  e.target.style.height = 'auto';
  e.target.style.height = e.target.scrollHeight + 'px';
};

// Combined handler for textarea focus
const handleTextareaFocus = (e) => {
  scrollInputIntoView(e);
  autoResizeTextarea(e);
};

// ============================================
// API HELPER FOR NATIVE APP SUPPORT
// ============================================
const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform();
const API_BASE = isNative ? 'https://muzz.onl' : '';
const api = (path) => `${API_BASE}${path}`;

// ============================================
// SUPABASE & GEMINI CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://lheniesboruihwmmkans.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZW5pZXNib3J1aWh3bW1rYW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDA3NjcsImV4cCI6MjA4NTM3Njc2N30.gCIgG3zLcB83FxnRcBNqsk6RdwXD6WjHzS6oCnrRqQs';
// Gemini key is now server-side in /api/chat.js

// VIP Users - Always Elite, no subscription needed
const VIP_EMAILS = [
  'lauchy23@outlook.com',
  'sarah.addison78@gmail.com',
  'cooperkb05@gmail.com',
  'kirstykb44@gmail.com',
  'tylarjohn@gmail.com',
  'barbarafremlin370@msn.com',
];

// Elite limits
const FREE_AI_LIMIT = 10;
const ELITE_AI_LIMIT = 30;

// ============================================
// SUPABASE CLIENT
// ============================================
const supabase = {
  token: null,
  user: null,
  
  headers(auth = true) {
    const h = { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY };
    if (auth && this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  },
  
  async signUp(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: this.headers(false),
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();
    if (d.access_token) {
      this.token = d.access_token;
      this.user = d.user;
      localStorage.setItem('muzz_auth', JSON.stringify({ token: d.access_token, refreshToken: d.refresh_token, user: d.user }));
    }
    return d;
  },
  
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: this.headers(false),
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();
    if (d.access_token) {
      this.token = d.access_token;
      this.user = d.user;
      localStorage.setItem('muzz_auth', JSON.stringify({ token: d.access_token, refreshToken: d.refresh_token, user: d.user }));
    }
    return d;
  },
  
  signOut() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('muzz_auth');
  },

  async resetPassword(email) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: this.headers(false),
      body: JSON.stringify({ email, redirectTo: 'https://muzz.onl' })
    });
    return r.ok;
  },

  async refreshSession() {
    try {
      const s = localStorage.getItem('muzz_auth');
      if (!s) return null;
      const { refreshToken } = JSON.parse(s);
      if (!refreshToken) return null;
      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: this.headers(false),
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      const d = await r.json();
      if (d.access_token) {
        this.token = d.access_token;
        this.user = d.user;
        localStorage.setItem('muzz_auth', JSON.stringify({ token: d.access_token, refreshToken: d.refresh_token, user: d.user }));
        return d.user;
      }
    } catch (e) { console.error('Refresh error:', e); }
    return null;
  },
  
  restore() {
    try {
      const s = localStorage.getItem('muzz_auth');
      if (s) {
        const { token, user } = JSON.parse(s);
        this.token = token;
        this.user = user;
        return user;
      }
    } catch (e) { console.error('Session restore error:', e); }
    return null;
  },
  
  async loadUserData(userId) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}&select=*`, {
      headers: this.headers()
    });
    if (r.ok) {
      const data = await r.json();
      return data[0] || null;
    }
    return null;
  },
  
  async saveUserData(userId, data) {
    // Try PATCH first (update existing row)
    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_data?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: { ...this.headers(), 'Prefer': 'return=minimal' },
      body: JSON.stringify({ data_json: data, updated_at: new Date().toISOString() })
    });
    if (!r.ok) {
      console.error('Save patch failed:', r.status, await r.text());
      // Fallback: try INSERT for new users
      const r2 = await fetch(`${SUPABASE_URL}/rest/v1/user_data`, {
        method: 'POST',
        headers: { ...this.headers(), 'Prefer': 'return=minimal' },
        body: JSON.stringify({ user_id: userId, data_json: data, updated_at: new Date().toISOString() })
      });
      if (!r2.ok) {
        const errorText = await r2.text();
        console.error('Save insert also failed:', r2.status, errorText);
        throw new Error(`Save failed: ${r2.status}`);
      }
    }
  },

  async deleteUserData(userId) {
    // Call server-side API to delete both data and auth account
    const API = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform() ? 'https://muzz.onl' : '';
    const r = await fetch(`${API}/api/delete-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    // Clear all local storage
    localStorage.removeItem('muzz_auth');
    return r.ok;
  }
};

// ============================================
// AUTH CONTEXT
// ============================================
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // First try quick restore from localStorage
      const restored = supabase.restore();
      if (restored) {
        setUser(restored);
        // Then refresh token in background to keep session alive
        const refreshed = await supabase.refreshSession();
        if (refreshed) {
          setUser(refreshed);
        } else {
          // Refresh failed = token fully expired, force re-login
          supabase.signOut();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();

    // Auto-refresh every 50 minutes (tokens expire at 60 min)
    const refreshInterval = setInterval(async () => {
      if (supabase.token) {
        const refreshed = await supabase.refreshSession();
        if (refreshed) setUser(refreshed);
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  const signIn = async (email, password) => {
    const result = await supabase.signIn(email, password);
    if (result.user) setUser(result.user);
    return result;
  };

  const signUp = async (email, password) => {
    const result = await supabase.signUp(email, password);
    if (result.user) setUser(result.user);
    return result;
  };

  const signOut = () => {
    supabase.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// ============================================
// LOGIN/SIGNUP SCREEN
// ============================================
const loginGreetings = [
  "Missed you papi 😘",
  "Welcome back daddy 🔥",
  "Good to see you ain't locked up in the pen yet 🙏",
  "Welcome back big dawg 🐕",
  "Big dawg gotta eat aye 🍖",
];

const signupGreetings = [
  "Let's get this bread 🍞",
  "New money who dis 💵",
  "Fresh account, fresh start 🚀",
  "Welcome to the fam 🦘",
  "Time to stack some cash 💰",
];

function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [greeting] = useState(() => 
    isLogin 
      ? loginGreetings[Math.floor(Math.random() * loginGreetings.length)]
      : signupGreetings[Math.floor(Math.random() * signupGreetings.length)]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      const result = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);
      
      if (result.error || result.error_description || result.msg) {
        setError(result.error?.message || result.error_description || result.msg || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const success = await supabase.resetPassword(email);
      if (success) {
        setSuccessMessage('Password reset email sent! Check your inbox.');
        setTimeout(() => {
          setShowResetPassword(false);
          setSuccessMessage('');
        }, 3000);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  // Reset Password Screen
  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background:"linear-gradient(180deg,#020817 0%,#050d1a 100%)"}}>
        <div style={{position:'fixed',inset:0,backgroundImage:'linear-gradient(rgba(0,200,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.025) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none'}} />
        <div style={{position:'fixed',width:'400px',height:'400px',borderRadius:'50%',background:'rgba(0,150,255,0.06)',filter:'blur(100px)',top:'-100px',right:'-80px',pointerEvents:'none'}} />
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4" style={{background:'rgba(0,200,255,0.1)',border:'1px solid rgba(0,200,255,0.25)'}}>🦘</div>
            <div className="text-4xl font-bold text-white mb-1" style={{fontFamily:"'Orbitron',monospace",letterSpacing:'3px'}}>MUZZ</div>
            <div className="text-sm" style={{color:'#00c8ff',letterSpacing:'2px'}}>Reset your password</div>
          </div>
          <div className="rounded-3xl p-8" style={{background:'rgba(5,15,30,0.8)',border:'1px solid rgba(0,200,255,0.15)',backdropFilter:'blur(20px)'}}>
            <h2 className="text-xl font-bold text-white mb-6 text-center">Forgot password? 🔐</h2>
            {error && <div className="px-4 py-3 rounded-xl mb-4 text-sm" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5'}}>{error}</div>}
            {successMessage && <div className="px-4 py-3 rounded-xl mb-4 text-sm" style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',color:'#86efac'}}>{successMessage}</div>}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color:'rgba(0,200,255,0.8)'}}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{color:'rgba(0,200,255,0.5)'}} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="w-full pl-10 pr-4 py-3 rounded-xl transition-colors text-white placeholder-slate-500 focus:outline-none"
                    style={{background:'rgba(0,200,255,0.05)',border:'1px solid rgba(0,200,255,0.2)'}} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 font-semibold rounded-xl transition-all disabled:opacity-50"
                style={{background:'linear-gradient(135deg,#00a8d4,#0070a0)',color:'white',border:'1px solid rgba(0,200,255,0.3)'}}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => { setShowResetPassword(false); setError(''); setSuccessMessage(''); }}
                className="text-sm font-medium" style={{color:'rgba(0,200,255,0.7)'}}>← Back to Sign In</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:"linear-gradient(180deg,#020817 0%,#050d1a 100%)"}}>
      <div style={{position:'fixed',inset:0,backgroundImage:'linear-gradient(rgba(0,200,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.025) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none'}} />
      <div style={{position:'fixed',width:'400px',height:'400px',borderRadius:'50%',background:'rgba(0,150,255,0.06)',filter:'blur(100px)',top:'-100px',right:'-80px',pointerEvents:'none'}} />
      <div style={{position:'fixed',width:'300px',height:'300px',borderRadius:'50%',background:'rgba(255,120,0,0.04)',filter:'blur(80px)',bottom:'100px',left:'-60px',pointerEvents:'none'}} />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4" style={{background:'rgba(0,200,255,0.1)',border:'1px solid rgba(0,200,255,0.25)'}}>🦘</div>
          <div className="text-4xl font-bold text-white mb-1" style={{fontFamily:"'Orbitron',monospace",letterSpacing:'3px'}}>MUZZ</div>
          <div className="text-sm" style={{color:'#00c8ff',letterSpacing:'2px'}}>Your Life OS</div>
        </div>

        <div className="rounded-3xl p-8" style={{background:'rgba(5,15,30,0.85)',border:'1px solid rgba(0,200,255,0.15)',backdropFilter:'blur(20px)'}}>
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            {isLogin ? 'Welcome Legend 🦘' : 'Create account'}
          </h2>

          {error && <div className="px-4 py-3 rounded-xl mb-4 text-sm" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5'}}>{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color:'rgba(0,200,255,0.8)'}}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{color:'rgba(0,200,255,0.5)'}} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl transition-colors text-white placeholder-slate-500 focus:outline-none"
                  style={{background:'rgba(0,200,255,0.05)',border:'1px solid rgba(0,200,255,0.2)'}} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{color:'rgba(0,200,255,0.8)'}}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{color:'rgba(0,200,255,0.5)'}} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full pl-10 pr-12 py-3 rounded-xl transition-colors text-white placeholder-slate-500 focus:outline-none"
                  style={{background:'rgba(0,200,255,0.05)',border:'1px solid rgba(0,200,255,0.2)'}} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'rgba(0,200,255,0.5)'}}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 font-semibold rounded-xl transition-all disabled:opacity-50 mt-2"
              style={{background:'linear-gradient(135deg,#00a8d4,#0070a0)',color:'white',border:'1px solid rgba(0,200,255,0.3)',boxShadow:'0 0 20px rgba(0,200,255,0.15)'}}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {isLogin && (
              <button onClick={() => { setShowResetPassword(true); setError(''); }}
                className="text-sm" style={{color:'rgba(148,163,184,0.7)'}}>Forgot password?</button>
            )}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="block w-full font-medium text-sm" style={{color:'#00c8ff'}}>
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{color:'rgba(148,163,184,0.4)'}}>
          Your data is securely stored in the cloud ☁️
        </p>
      </div>
    </div>
  );
}

// Investment Quotes for Dashboard
const investmentQuotes = [
  { author: "Warren Buffett", quote: "Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1." },
  { author: "Benjamin Graham", quote: "Price is what you pay. Value is what you get." },
  { author: "John Bogle", quote: "Do not look for the needle in the haystack. Just buy the haystack." },
  { author: "Charlie Munger", quote: "The big money is not in the buying and the selling, but in the waiting." },
  { author: "Peter Lynch", quote: "Know what you own, and know why you own it." },
  { author: "Sir John Templeton", quote: "The four most dangerous words in investing are: This time it is different." },
  { author: "Baron Rothschild", quote: "Buy when there is blood in the streets, even if the blood is your own." },
  { author: "Seth Klarman", quote: "The single greatest edge an investor can have is a long-term orientation." },
  { author: "Warren Buffett", quote: "Our favorite holding period is forever." },
  { author: "Benjamin Franklin", quote: "An investment in knowledge pays the best interest." },
  { author: "Warren Buffett", quote: "Be fearful when others are greedy and greedy when others are fearful." },
  { author: "Morgan Housel", quote: "Wealth is what you do not see." },
  { author: "Peter Lynch", quote: "The real key to making money in stocks is not to get scared out of them." },
  { author: "Charlie Munger", quote: "The first rule of compounding: Never interrupt it unnecessarily." },
  { author: "Howard Marks", quote: "You cannot predict. You can prepare." },
];

// Helper function to calculate how long you've held something
const getHoldingDuration = (dateAdded) => {
  if (!dateAdded) return null;
  const start = new Date(dateAdded);
  const now = new Date();
  const diffMs = now - start;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (days < 1) return "Today";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  if (remainingMonths === 0) return years === 1 ? "1 year" : `${years} years`;
  return `${years}y ${remainingMonths}m`;
};

// Floating Chat Component - New Visual Style (matches app-2)
function FloatingChat({ 
  isChatOpen, 
  setIsChatOpen, 
  chatMessages, 
  setChatMessages, 
  isTyping, 
  setIsTyping,
  financialContext,
  isAiLimitReached,
  incrementAiUsage,
  getAiRemaining,
  AI_DAILY_LIMIT,
  muzzPersonality
}) {
  const [input, setInput] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const endRef = useRef(null);
  
  useEffect(() => { 
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); 
  }, [chatMessages]);

  const sendMessage = async (msg) => {
    if (!msg.trim() || isTyping) return;
    if (isAiLimitReached()) {
      setChatMessages(prev => [...prev, 
        { role: "user", text: msg },
        { role: "muzz", text: `Oi mate, you've hit your daily limit of ${AI_DAILY_LIMIT} messages! 🦘\n\nThis resets at midnight so come back tomorrow. Upgrade to Elite for more chats!` }
      ]);
      return;
    }
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setIsTyping(true);
    const brainRotMode = muzzPersonality;
    const systemPrompt = brainRotMode 
    ? `You are Muzz 🦘, a friendly Australian kangaroo financial advisor.
Your personality:
- Use Aussie slang occasionally (mate, legend, no worries, reckon)
- You can use ONE gen-z term per response MAX from: W, L, on kirk, fr, bussin, lowkey, based, bet, aura, slay
- Keep responses SHORT - 2-3 sentences max
- Give legit financial advice
- NEVER say "g'day mate" more than once in a conversation
- NEVER repeat the same slang twice in a row
- Vary your greetings and phrases
${financialContext}
IMPORTANT: Be natural and varied. Don't spam the same phrases. Keep it short and punchy! 🦘`
    : `You are Muzz 🦘, a friendly Australian kangaroo who's a financial advisor and life coach! 
Your personality:
- Friendly, encouraging, and supportive
- Use Aussie slang sparingly and naturally (mate, legend, no worries, reckon)
- Keep responses concise (2-3 sentences max)
- Give practical, actionable advice
- Celebrate wins, no matter how small
- NEVER say "g'day mate" more than once in a conversation
- NEVER repeat the same phrases over and over
- Vary your language and greetings
${financialContext}
Remember: Be natural and varied. Don't spam "g'day mate" or any phrase repeatedly. Keep it short, helpful, and real! 🦘`;
    try {
      const response = await fetch(api('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: systemPrompt,
          contents: [{ role: "user", parts: [{ text: msg }] }]
        })
      });
      const data = await response.json();
      const reply = data.reply || "No worries mate, give it another go! 🦘";
      setChatMessages(prev => [...prev, { role: "muzz", text: reply }]);
      incrementAiUsage();
    } catch (e) {
      setChatMessages(prev => [...prev, { role: "muzz", text: "Crikey! Hit a snag there mate. Give it another go! 🦘" }]);
    }
    setIsTyping(false);
  };

  if (!isChatOpen) {
    return (
      <button onClick={() => setIsChatOpen(true)} className="fixed w-14 h-14 rounded-full hover:scale-110 transition-all flex items-center justify-center text-2xl z-50 kang-pulse" style={{bottom:"calc(env(safe-area-inset-bottom) + 72px)",right:"16px",background:"linear-gradient(135deg,#fb923c,#f97316)",boxShadow:"0 4px 24px rgba(251,146,60,0.4)"}}>
        🦘
      </button>
    );
  }

  const handleSend = () => {
    if (input.trim()) { sendMessage(input); setInput(""); }
  };

  // ── FULLSCREEN TERMINAL MODE ──
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{background:"#020a14",fontFamily:"'Share Tech Mono',monospace"}}>
        {/* Terminal grid bg */}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(0,200,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.02) 1px,transparent 1px)',backgroundSize:'30px 30px',pointerEvents:'none'}} />
        
        {/* Terminal header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",background:"rgba(0,200,255,0.04)"}}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{background:"#ff5f57"}}></div>
              <div className="w-3 h-3 rounded-full" style={{background:"#febc2e"}}></div>
              <div className="w-3 h-3 rounded-full" style={{background:"#28c840"}}></div>
            </div>
            <span className="text-xs" style={{color:"rgba(0,200,255,0.6)",letterSpacing:"2px"}}>MUZZ TERMINAL — AI ADVISOR v3.0</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsFullscreen(false)} className="text-xs px-3 py-1 rounded transition-all" style={{color:"rgba(0,200,255,0.6)",border:"1px solid rgba(0,200,255,0.2)"}}>
              ⊡ minimise
            </button>
            <button onClick={() => { setIsFullscreen(false); setIsChatOpen(false); }} style={{color:"rgba(0,200,255,0.5)"}}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal messages */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/* Boot message */}
          <div style={{color:"rgba(0,200,255,0.4)",fontSize:"12px",letterSpacing:"1px",marginBottom:"16px"}}>
            <div>MUZZ AI TERMINAL v3.0</div>
            <div>INITIALISING... ████████████ 100%</div>
            <div style={{color:"rgba(0,200,255,0.3)"}}>Type your question below. 🦘</div>
            <div style={{color:"rgba(0,200,255,0.15)",marginTop:"8px"}}>{'─'.repeat(40)}</div>
          </div>

          {chatMessages.length === 0 && (
            <div style={{color:"rgba(0,200,255,0.35)",fontSize:"13px"}}>
              <span style={{color:"rgba(0,200,255,0.5)"}}>muzz@life-os:~$</span> awaiting input...
            </div>
          )}

          {chatMessages.map((m, i) => (
            <div key={i} className="space-y-1">
              {m.role === "user" ? (
                <div style={{fontSize:"13px"}}>
                  <span style={{color:"rgba(0,200,255,0.7)"}}>you@muzz:~$</span>{' '}
                  <span style={{color:"#e2e8f0"}}>{m.text}</span>
                </div>
              ) : (
                <div style={{fontSize:"13px",paddingLeft:"8px",borderLeft:"2px solid rgba(0,200,255,0.3)"}}>
                  <div style={{color:"rgba(0,200,255,0.5)",fontSize:"11px",marginBottom:"2px",letterSpacing:"1px"}}>MUZZ 🦘</div>
                  <span style={{color:"#94a3b8",lineHeight:"1.7",whiteSpace:"pre-wrap"}}>{m.text}</span>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={{fontSize:"13px",paddingLeft:"8px",borderLeft:"2px solid rgba(0,200,255,0.3)"}}>
              <div style={{color:"rgba(0,200,255,0.5)",fontSize:"11px",marginBottom:"2px",letterSpacing:"1px"}}>MUZZ 🦘</div>
              <span style={{color:"rgba(0,200,255,0.6)"}}>processing<span className="animate-pulse">...</span></span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Terminal input */}
        <div className="relative z-10 px-6 py-4" style={{borderTop:"1px solid rgba(0,200,255,0.15)",background:"rgba(0,200,255,0.03)"}}>
          <div className="flex items-center gap-3">
            <span style={{color:"rgba(0,200,255,0.6)",fontSize:"13px",whiteSpace:"nowrap"}}>you@muzz:~$</span>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              placeholder="ask muzz anything..."
              disabled={isTyping || isAiLimitReached()}
              autoFocus
              className="flex-1 focus:outline-none bg-transparent"
              style={{color:"#e2e8f0",fontSize:"13px",fontFamily:"'Share Tech Mono',monospace",caretColor:"#00c8ff"}}
            />
            <button onClick={handleSend} disabled={isTyping || !input.trim() || isAiLimitReached()}
              className="transition-all disabled:opacity-30"
              style={{color:"#00c8ff",fontSize:"13px"}}>
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span style={{color:"rgba(0,200,255,0.25)",fontSize:"11px",letterSpacing:"1px"}}>
              {getAiRemaining()} / {AI_DAILY_LIMIT} queries remaining
            </span>
            <span style={{color:"rgba(0,200,255,0.2)",fontSize:"11px"}}>ESC to minimise</span>
          </div>
        </div>
      </div>
    );
  }

  // ── COMPACT BUBBLE MODE ──
  return (
    <div className="fixed w-96 h-[500px] rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden" style={{bottom:"calc(env(safe-area-inset-bottom) + 72px)",right:"16px",background:"#070f1e",border:"1px solid rgba(0,200,255,0.2)",boxShadow:"0 0 40px rgba(0,0,0,0.8),0 0 20px rgba(0,150,255,0.1)"}}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between" style={{background:"rgba(0,200,255,0.07)",borderBottom:"1px solid rgba(0,200,255,0.15)"}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{background:"linear-gradient(135deg,#fb923c,#f97316)"}}>🦘</div>
          <div>
            <div className="text-white font-semibold text-sm" style={{fontFamily:"'Orbitron',monospace",letterSpacing:"1px"}}>MUZZ AI</div>
            <div className="text-xs" style={{color: isTyping ? "#00c8ff" : "rgba(0,200,255,0.5)"}}>{isTyping ? "● thinking..." : "● online"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsFullscreen(true)} className="p-1.5 rounded-lg transition-all" style={{color:"rgba(0,200,255,0.6)",border:"1px solid rgba(0,200,255,0.2)"}} title="Full screen terminal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
          <button onClick={() => setIsChatOpen(false)} style={{color:"rgba(0,200,255,0.5)"}}><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🦘</div>
            <div className="text-sm" style={{color:"rgba(148,163,184,0.6)"}}>G'day! Ask me anything.</div>
            <button onClick={() => setIsFullscreen(true)} className="mt-3 text-xs px-3 py-1.5 rounded-lg" style={{color:"rgba(0,200,255,0.7)",border:"1px solid rgba(0,200,255,0.2)",background:"rgba(0,200,255,0.05)"}}>
              ⌨ Open terminal mode
            </button>
          </div>
        )}
        {chatMessages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className="max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap"
              style={m.role === "user"
                ? {background:"linear-gradient(135deg,#fb923c,#f97316)",color:"white"}
                : {background:"rgba(0,200,255,0.08)",color:"#cbd5e1",border:"1px solid rgba(0,200,255,0.15)"}
              }>{m.text}</div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl" style={{background:"rgba(0,200,255,0.08)",border:"1px solid rgba(0,200,255,0.15)"}}>
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{background:"#00c8ff",animationDelay:"0ms"}}></span>
                <span className="w-2 h-2 rounded-full animate-bounce" style={{background:"#00c8ff",animationDelay:"150ms"}}></span>
                <span className="w-2 h-2 rounded-full animate-bounce" style={{background:"#00c8ff",animationDelay:"300ms"}}></span>
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3" style={{borderTop:"1px solid rgba(0,200,255,0.1)",background:"rgba(0,200,255,0.03)"}}>
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            placeholder="Ask Muzz..." disabled={isTyping || isAiLimitReached()}
            className="flex-1 px-4 py-2 rounded-full text-sm focus:outline-none text-white placeholder-slate-500"
            style={{background:"rgba(0,200,255,0.06)",border:"1px solid rgba(0,200,255,0.2)"}} />
          <button onClick={handleSend} disabled={isTyping || !input.trim() || isAiLimitReached()}
            className="px-4 py-2 rounded-full disabled:opacity-40 transition-all"
            style={{background:"linear-gradient(135deg,#fb923c,#f97316)",color:"white"}}>
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className={`text-xs text-center mt-1.5 ${getAiRemaining() <= 5 ? 'text-red-400' : ''}`}
          style={getAiRemaining() > 5 ? {color:"rgba(0,200,255,0.3)"} : {}}>
          {getAiRemaining()} / {AI_DAILY_LIMIT} messages remaining
        </p>
      </div>
    </div>
  );
}

// Stat Card Component for Dashboard
function StatCard({ icon: Icon, label, value, sub, color, onClick }) {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-500 to-indigo-600",
    green: "bg-gradient-to-br from-green-500 to-emerald-600",
    purple: "bg-gradient-to-br from-purple-500 to-indigo-600",
    orange: "bg-gradient-to-br from-orange-500 to-amber-500",
    pink: "bg-gradient-to-br from-pink-500 to-rose-600"
  };
  return (
    <div onClick={onClick} className={colorClasses[color] + " rounded-2xl p-4 text-white cursor-pointer hover:scale-105 transition-transform shadow-lg"}>
      <Icon className="w-6 h-6 opacity-80 mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
      {sub && <div className="text-xs opacity-60 mt-1">{sub}</div>}
    </div>
  );
}

function LockedFeature({ featureName, setActiveView }) {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative">
      <button
        onClick={() => setActiveView('home')}
        className="absolute top-16 left-6 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors z-10"
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{featureName} is Elite Only</h2>
        <p className="text-gray-500 mb-6">Upgrade to Elite for $4.99/month to unlock {featureName} and all premium features.</p>
        <button
          onClick={() => setActiveView('upgrade')}
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
        >
          Upgrade to Elite
        </button>
      </div>
    </div>
  );
}

function MuzzApp() {
  // All state declarations at the top
  const [activeView, setActiveView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarScrollRef = useRef(null);
  const [homeInput, setHomeInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [feedbackType, setFeedbackType] = useState('feedback');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [businessSubscriptions, setBusinessSubscriptions] = useState([]);
  const [billsType, setBillsType] = useState('personal');
  const [muzzPersonality, setMuzzPersonality] = useState(true);
  const [funnyGreetings, setFunnyGreetings] = useState(false);
  const [dashFunnyGreeting] = useState(() => loginGreetings[Math.floor(Math.random() * loginGreetings.length)]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatExpanded, setIsChatExpanded] = useState(true);

  // Scroll input into view when keyboard opens (for mobile)
  const scrollInputIntoView = (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // Auth & Elite status (must be before AI limits)
  const { user: authUser, signOut } = useAuth();
  const userId = authUser?.id;
  const userEmail = authUser?.email?.toLowerCase() || '';
  const isVIP = VIP_EMAILS.includes(userEmail);
  const [stripeElite, setStripeElite] = useState(false);
  const isElite = isVIP || stripeElite;
  const [eliteName, setEliteName] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // AI Daily Message Limit
  const AI_DAILY_LIMIT = isElite ? ELITE_AI_LIMIT : FREE_AI_LIMIT;
  const getAiUsage = () => {
    try {
      const stored = localStorage.getItem('muzz_ai_usage');
      if (stored) {
        const { count, date } = JSON.parse(stored);
        const today = new Date().toISOString().split('T')[0];
        if (date === today) return count;
      }
    } catch (e) {}
    return 0;
  };
  const incrementAiUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const current = getAiUsage();
    localStorage.setItem('muzz_ai_usage', JSON.stringify({ count: current + 1, date: today }));
  };
  const isAiLimitReached = () => isVIP ? false : getAiUsage() >= AI_DAILY_LIMIT;
  const getAiRemaining = () => isVIP ? '∞' : Math.max(AI_DAILY_LIMIT - getAiUsage(), 0);
  const [isChatHidden, setIsChatHidden] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false); // New floating chat state
  const [isMuzzEnabled, setIsMuzzEnabled] = useState(true);
  const [chatSize, setChatSize] = useState('normal');
  const [chatPosition, setChatPosition] = useState({ x: 20, y: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [monthlySalary, setMonthlySalary] = useState('');
  const [monthlySalaryStr, setMonthlySalaryStr] = useState('');
  const [currentStreak, setCurrentStreak] = useState(0); // Streak tracking
  const [achievements, setAchievements] = useState([]); // Achievements
  
  // Assets state
  const [assets, setAssets] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [futureStocks, setFutureStocks] = useState([]); // Future portfolio
  const [futureResearch, setFutureResearch] = useState([]); // Future research
  const [futureResearchColumns, setFutureResearchColumns] = useState([]);
  const [investmentSettings, setInvestmentSettings] = useState({
    yearlyContribution: '',
    expectedGrowthRate: '7',
    yearsToProject: '10'
  });
  const [smallGoals, setSmallGoals] = useState([]);
  const [bigGoals, setBigGoals] = useState([]);
  const [investmentSmallGoals, setInvestmentSmallGoals] = useState([]);
  const [investmentBigGoals, setInvestmentBigGoals] = useState([]);
  const [investmentNotes, setInvestmentNotes] = useState('');
  const [declinedCompanies, setDeclinedCompanies] = useState([]);
  const [companyEconomics, setCompanyEconomics] = useState([]);
  const [biggestRisks, setBiggestRisks] = useState([]);
  const [economicsColumns, setEconomicsColumns] = useState([]);
  const [researchColumns, setResearchColumns] = useState([]);
  const [risksColumns, setRisksColumns] = useState([]);
  const [newResearchCol, setNewResearchCol] = useState('');
  const [newEconomicsCol, setNewEconomicsCol] = useState('');
  const [newRisksCol, setNewRisksCol] = useState('');
  const [showResearchColInput, setShowResearchColInput] = useState(false);
  const [showEconomicsColInput, setShowEconomicsColInput] = useState(false);
  const [showRisksColInput, setShowRisksColInput] = useState(false);
  const [researchSortBy, setResearchSortBy] = useState('ticker'); // ticker, industry, tollBooth, growth, status
  const [researchSortDir, setResearchSortDir] = useState('asc'); // asc, desc
  const [futureSortBy, setFutureSortBy] = useState('ticker');
  const [futureSortDir, setFutureSortDir] = useState('asc');
  const [currentSortBy, setCurrentSortBy] = useState('name');
  const [currentSortDir, setCurrentSortDir] = useState('asc');
  const [billsSortBy, setBillsSortBy] = useState('due');
  const [billsSortDir, setBillsSortDir] = useState('asc');
  const [assetsSortBy, setAssetsSortBy] = useState('value');
  const [assetsSortDir, setAssetsSortDir] = useState('desc');
  const [billsSubTab, setBillsSubTab] = useState('bills');
  const [calendarBills, setCalendarBills] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [newBillDate, setNewBillDate] = useState('');
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [tasks, setTasks] = useState([]);
  const [tasksSubTab, setTasksSubTab] = useState('daily');
  const [dailyTasks, setDailyTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [generalTasks, setGeneralTasks] = useState([]);
  const [dailyRotation, setDailyRotation] = useState([
    { time: '1am', activity: '-' },
    { time: '2am', activity: '-' },
    { time: '3am', activity: '-' },
    { time: '4am', activity: '-' },
    { time: '5am', activity: '-' },
    { time: '6am', activity: '-' },
    { time: '7am', activity: '-' },
    { time: '8am', activity: '-' },
    { time: '9am', activity: '-' },
    { time: '10am', activity: '-' },
    { time: '11am', activity: '-' },
    { time: '12pm', activity: '-' },
    { time: '1pm', activity: '-' },
    { time: '2pm', activity: '-' },
    { time: '3pm', activity: '-' },
    { time: '4pm', activity: '-' },
    { time: '5pm', activity: '-' },
    { time: '6pm', activity: '-' },
    { time: '7pm', activity: '-' },
    { time: '8pm', activity: '-' },
    { time: '9pm', activity: '-' },
    { time: '10pm', activity: '-' },
    { time: '11pm', activity: '-' },
    { time: '12am', activity: '-' },
  ]);
  const [birthdays, setBirthdays] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [groceries, setGroceries] = useState([]);
  const [shoppingLists, setShoppingLists] = useState([{ id: 'default', name: 'Groceries', emoji: '🛒' }]);
  const [activeShoppingList, setActiveShoppingList] = useState(null);
  const [dailyMeals, setDailyMeals] = useState({});
  const [dailySteps, setDailySteps] = useState({});
  const [workoutPlan, setWorkoutPlan] = useState({
    stepsGoal: 10000,
    weeks: {
      1: { name: '', setsInfo: '', exercises: [] },
      2: { name: '', setsInfo: '', exercises: [] },
      3: { name: '', setsInfo: '', exercises: [] },
      4: { name: '', setsInfo: '', exercises: [] }
    }
  });
  const [dietSubTab, setDietSubTab] = useState('groceries');
  const [expandedDietPlan, setExpandedDietPlan] = useState(null);
  const [trackedStocks, setTrackedStocks] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesLastUpdated, setPricesLastUpdated] = useState(null);
  const [customDiets, setCustomDiets] = useState([]);
  const [expandedCustomDiet, setExpandedCustomDiet] = useState(null);
  const [waterIntake, setWaterIntake] = useState({ goal: 3, goalStr: '3', days: {} });
  const [gymSubTab, setGymSubTab] = useState('sleep');
  const [sleepData, setSleepData] = useState({});
  const [mentalHealthData, setMentalHealthData] = useState({});
  const [timesheetData, setTimesheetData] = useState({
    jobs: [
      { id: 1, name: 'Job 1', hourlyRate: 0, hourlyRateStr: '', shifts: {} },
    ],
    activeJobId: 1
  });
  const [workSubTab, setWorkSubTab] = useState('timesheet');
  const [assetsSubTab, setAssetsSubTab] = useState('assets');
  const [investmentsSubTab, setInvestmentsSubTab] = useState('portfolio');
  const [holdingsResearch, setHoldingsResearch] = useState([]);
  const [billSmallGoals, setBillSmallGoals] = useState([]);
  const [billBigGoals, setBillBigGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  // Custom Categories State
  const [customCategories, setCustomCategories] = useState([
    { id: 'custom1', name: 'Custom 1', icon: '📁', color: 'purple', subTabs: [{ id: 'default', name: 'Main', sections: [] }], activeSubTab: 'default' },
    { id: 'custom2', name: 'Custom 2', icon: '📁', color: 'teal', subTabs: [{ id: 'default', name: 'Main', sections: [] }], activeSubTab: 'default' },
    { id: 'custom3', name: 'Custom 3', icon: '📁', color: 'rose', subTabs: [{ id: 'default', name: 'Main', sections: [] }], activeSubTab: 'default' },
  ]);
  const [draggedSection, setDraggedSection] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [customCalMonth, setCustomCalMonth] = useState(new Date().getMonth());
  const [customCalYear, setCustomCalYear] = useState(new Date().getFullYear());
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  // ===== NEW FEATURES STATE =====
  // Habit Tracker
  const [habits, setHabits] = useState([]);
  const [habitLog, setHabitLog] = useState({}); // { 'habitId:YYYY-MM-DD': true }

  // Daily Journal
  const [journalEntries, setJournalEntries] = useState({}); // { 'YYYY-MM-DD': { text, mood, prompt } }

  // Pomodoro Timer (no persist needed - resets each session)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState('work'); // work | shortBreak | longBreak
  const [pomodoroSessions, setPomodoroSessions] = useState(0);

  // Debt Payoff Calculator
  const [debtCalcMethod, setDebtCalcMethod] = useState('snowball'); // snowball | avalanche

  // Compound Interest Calculator
  const [compoundCalc, setCompoundCalc] = useState({ principal: '', monthlyAdd: '', rate: '7', years: '10' });
  const [journalDate, setJournalDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Travel Countdown
  const [countdowns, setCountdowns] = useState([]);
  const [countdownsSubTab, setCountdownsSubTab] = useState('countdowns');

  // Bucket List
  const [bucketList, setBucketList] = useState([]);

  // Asset Map
  const [assetMapNodes, setAssetMapNodes] = useState([
    { id: 'root', name: 'My Assets', emoji: '🏠', parentId: null }
  ]);
  const [showMapControls, setShowMapControls] = useState(true);
  const [mapPins, setMapPins] = useState([]);
  const worldMapRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [editingPin, setEditingPin] = useState(null);
  const doExport = () => { try { const d=JSON.stringify({subscriptions,stocks,assets,habits,habitLog,dailyTasks,countdowns,birthdays,sleepData,mentalHealthData,timesheetData},null,2); const b=new Blob([d],{type:'application/json'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='muzz-backup.json'; a.click(); } catch(e) {} };
  const doImport = (e) => { const file=e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=(ev)=>{ try{ const d=JSON.parse(ev.target.result); if(d.subscriptions) setSubscriptions(d.subscriptions); if(d.stocks) setStocks(d.stocks); if(d.assets) setAssets(d.assets); if(d.habits) setHabits(d.habits); if(d.habitLog) setHabitLog(d.habitLog); if(d.dailyTasks) setDailyTasks(d.dailyTasks); if(d.countdowns) setCountdowns(d.countdowns); if(d.birthdays) setBirthdays(d.birthdays); if(d.sleepData) setSleepData(d.sleepData); if(d.mentalHealthData) setMentalHealthData(d.mentalHealthData); if(d.timesheetData) setTimesheetData(d.timesheetData); }catch(err){alert('Invalid file');} }; r.readAsText(file); };
  const [openSections, setOpenSections] = useState({'LIFE':true,'FINANCE':false,'HEALTH & WORK':false,'CUSTOM':false,'ACCOUNT':false});
  const toggleSection = (title) => setOpenSections(prev => ({...prev, [title]: !prev[title]}));
  const [dashTab, setDashTab] = useState('overview');
  const [timetableBlocks, setTimetableBlocks] = useState([]);
  const [gymTab, setGymTab] = useState('steps');
  const [ttTab, setTtTab] = useState('week');
  const [ttNewBlock, setTtNewBlock] = useState({ title: '', type: 'uni', day: 'Mon', startHour: 9, endHour: 10, color: '#8b5cf6', location: '' });
  const [ttEditingId, setTtEditingId] = useState(null);

  // Check Stripe subscription on load
  useEffect(() => {
    if (!userEmail || isVIP) return;
    const checkSub = async () => {
      try {
        const res = await fetch(api('/api/check-subscription'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail }),
        });
        const data = await res.json();
        if (data.isElite) {
          setStripeElite(true);
          setSubscriptionInfo(data.subscription);
        }
      } catch (e) {
        console.error('Subscription check error:', e);
      }
    };
    checkSub();
  }, [userEmail]);

  // Initialize RevenueCat for iOS and check for existing purchases
  useEffect(() => {
    const initRevenueCat = async () => {
      if (!isNative) return;
      await RevenueCat.init();
      
      // Check if user already has Elite from Apple
      const hasElite = await RevenueCat.checkEliteStatus();
      if (hasElite && !isElite) {
        // Sync to Supabase
        await fetch(api('/api/sync-apple-purchase'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userEmail }),
        });
        setStripeElite(true); // Using same flag for simplicity
      }
    };
    initRevenueCat();
  }, [userId, userEmail]);

  // Handle Stripe checkout
  const handleUpgrade = async () => {
    // Check if on iOS native app - use RevenueCat
    if (isNative && window.Capacitor?.getPlatform() === 'ios') {
      try {
        const result = await RevenueCat.purchaseElite();
        if (result.success) {
          // Update Supabase to mark user as Elite
          await fetch(api('/api/sync-apple-purchase'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userEmail }),
          });
          setStripeElite(true);
          alert('Welcome to Elite! 🎉');
          setActiveView('home');
        } else if (result.cancelled) {
          // User cancelled - do nothing
        }
      } catch (e) {
        console.log('Purchase error:', e);
        alert('Purchase failed. Please try again.');
      }
      return;
    }
    
    // Web - use Stripe
    try {
      const res = await fetch(api('/api/create-checkout-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (e) {
      alert('Connection error. Please try again.');
    }
  };
  
  // Handle restore purchases (iOS)
  const handleRestorePurchases = async () => {
    if (!isNative) return;
    try {
      const result = await RevenueCat.restorePurchases();
      if (result.success) {
        await fetch(api('/api/sync-apple-purchase'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userEmail }),
        });
        setStripeElite(true);
        alert('Purchases restored! Welcome back Elite! 🎉');
      } else {
        alert('No previous purchases found.');
      }
    } catch (e) {
      alert('Could not restore purchases. Please try again.');
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel? You\'ll keep Elite access until the end of your billing period.')) return;
    try {
      const res = await fetch(api('/api/manage-subscription'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, action: 'cancel' }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptionInfo(prev => ({ ...prev, cancelAtPeriodEnd: true }));
        alert('Subscription cancelled. You\'ll keep Elite access until the end of your billing period.');
      }
    } catch (e) {
      alert('Error cancelling. Please try again.');
    }
  };

  // Handle subscription reactivation
  const handleReactivateSubscription = async () => {
    try {
      const res = await fetch(api('/api/manage-subscription'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, action: 'reactivate' }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptionInfo(prev => ({ ...prev, cancelAtPeriodEnd: false }));
        alert('Welcome back legend! Your subscription is active again.');
      }
    } catch (e) {
      alert('Error reactivating. Please try again.');
    }
  };

  // Check for payment success/cancel in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setStripeElite(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('payment') === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    const loadData = async () => {
      try {
        const result = await supabase.loadUserData(userId);
        if (result?.data_json) {
          const d = result.data_json;
          if (d.subscriptions) setSubscriptions(d.subscriptions);
          if (d.businessSubscriptions) setBusinessSubscriptions(d.businessSubscriptions);
          if (d.muzzPersonality !== undefined) setMuzzPersonality(d.muzzPersonality);
          if (d.funnyGreetings !== undefined) setFunnyGreetings(d.funnyGreetings);
          if (d.customDiets) setCustomDiets(d.customDiets);
          if (d.trackedStocks) setTrackedStocks(d.trackedStocks);
          if (d.monthlySalary) setMonthlySalary(d.monthlySalary);
          if (d.monthlySalaryStr) setMonthlySalaryStr(d.monthlySalaryStr);
          if (d.assets) setAssets(d.assets);
          if (d.stocks) setStocks(d.stocks);
          if (d.investmentSettings) setInvestmentSettings(d.investmentSettings);
          if (d.smallGoals) setSmallGoals(d.smallGoals);
          if (d.bigGoals) setBigGoals(d.bigGoals);
          if (d.holdingsResearch) setHoldingsResearch(d.holdingsResearch);
          if (d.futureStocks) setFutureStocks(d.futureStocks);
          if (d.futureResearch) setFutureResearch(d.futureResearch);
          if (d.futureResearchColumns) setFutureResearchColumns(d.futureResearchColumns);
          if (d.investmentSmallGoals) setInvestmentSmallGoals(d.investmentSmallGoals);
          if (d.investmentBigGoals) setInvestmentBigGoals(d.investmentBigGoals);
          if (d.investmentNotes) setInvestmentNotes(d.investmentNotes);
          if (d.declinedCompanies) setDeclinedCompanies(d.declinedCompanies);
          if (d.companyEconomics) setCompanyEconomics(d.companyEconomics);
          if (d.economicsColumns) setEconomicsColumns(d.economicsColumns);
          if (d.researchColumns) setResearchColumns(d.researchColumns);
          if (d.biggestRisks) setBiggestRisks(d.biggestRisks);
          if (d.risksColumns) setRisksColumns(d.risksColumns);
          if (d.billSmallGoals) setBillSmallGoals(d.billSmallGoals);
          if (d.debts) setDebts(d.debts);
          if (d.billBigGoals) setBillBigGoals(d.billBigGoals);
          if (d.calendarBills) setCalendarBills(d.calendarBills);
          if (d.tasks) setTasks(d.tasks);
          if (d.dailyTasks) setDailyTasks(d.dailyTasks);
          if (d.weeklyTasks) setWeeklyTasks(d.weeklyTasks);
          if (d.generalTasks) setGeneralTasks(d.generalTasks);
          if (d.dailyRotation) setDailyRotation(d.dailyRotation);
          if (d.birthdays) setBirthdays(d.birthdays);
          if (d.reminders) setReminders(d.reminders);
          if (d.groceries) setGroceries(d.groceries);
          if (d.shoppingLists) setShoppingLists(d.shoppingLists);
          if (d.dailyMeals) setDailyMeals(d.dailyMeals);
          if (d.waterIntake) setWaterIntake(d.waterIntake);
          if (d.dailySteps) setDailySteps(d.dailySteps);
          if (d.workoutPlan) setWorkoutPlan(d.workoutPlan);
          if (d.sleepData) setSleepData(d.sleepData);
          if (d.mentalHealthData) setMentalHealthData(d.mentalHealthData);
          if (d.timesheetData) setTimesheetData(d.timesheetData);
          if (d.customCategories) setCustomCategories(d.customCategories);
          if (d.eliteName) setEliteName(d.eliteName);
          if (d.stripeElite) setStripeElite(d.stripeElite);
          if (d.timetableBlocks) setTimetableBlocks(d.timetableBlocks);
          if (d.habits) setHabits(d.habits);
          if (d.habitLog) setHabitLog(d.habitLog);
          if (d.journalEntries) setJournalEntries(d.journalEntries);
          if (d.countdowns) setCountdowns(d.countdowns);
          if (d.bucketList) setBucketList(d.bucketList);
          if (d.assetMapNodes) setAssetMapNodes(d.assetMapNodes);
          if (d.mapPins) setMapPins(d.mapPins);
          // Only set dataLoaded true AFTER data is successfully loaded
          setDataLoaded(true);
        } else {
          // No existing data - this is a new user, safe to enable saving
          setDataLoaded(true);
        }
      } catch (e) {
        console.error('Load error - NOT enabling saves to prevent data loss:', e);
        // DO NOT set dataLoaded true on error - this prevents empty data from overwriting real data
      }
    };
    loadData();
  }, [userId]);

  // Reset dataLoaded when user changes to prevent saving stale data
  useEffect(() => {
    setDataLoaded(false);
  }, [userId]);

  // Save data to Supabase when it changes
  useEffect(() => {
    if (!userId || !dataLoaded) return;
    
    setSaveStatus('saving');
    const saveData = async () => {
      try {
        const allData = {
          subscriptions,
          businessSubscriptions,
          muzzPersonality,
          funnyGreetings,
          customDiets,
          trackedStocks,
          monthlySalary,
          monthlySalaryStr,
          assets,
          stocks,
          investmentSettings,
          smallGoals,
          bigGoals,
          holdingsResearch,
          futureStocks,
          futureResearch,
          futureResearchColumns,
          investmentSmallGoals,
          investmentBigGoals,
          investmentNotes,
          declinedCompanies,
          companyEconomics,
          economicsColumns,
          researchColumns,
          biggestRisks,
          risksColumns,
          billSmallGoals,
          billBigGoals,
          debts,
          calendarBills,
          tasks,
          dailyTasks,
          weeklyTasks,
          generalTasks,
          dailyRotation,
          birthdays,
          reminders,
          groceries,
          shoppingLists,
          dailyMeals,
          waterIntake,
          dailySteps,
          workoutPlan,
          sleepData,
          mentalHealthData,
          timesheetData,
          customCategories,
          eliteName,
          stripeElite,
          timetableBlocks,
          habits,
          habitLog,
          journalEntries,
          countdowns,
          bucketList,
          assetMapNodes,
          mapPins
        };
        await supabase.saveUserData(userId, allData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error('Save error:', e);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };
    
    const timeoutId = setTimeout(saveData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [subscriptions, businessSubscriptions, muzzPersonality, funnyGreetings, customDiets, trackedStocks, monthlySalary, monthlySalaryStr, assets, stocks, investmentSettings, smallGoals, bigGoals, holdingsResearch, futureStocks, futureResearch, futureResearchColumns, investmentSmallGoals, investmentBigGoals, investmentNotes, declinedCompanies, companyEconomics, economicsColumns, researchColumns, biggestRisks, risksColumns, billSmallGoals, billBigGoals, debts, calendarBills, tasks, dailyTasks, weeklyTasks, generalTasks, dailyRotation, birthdays, reminders, groceries, shoppingLists, dailyMeals, waterIntake, dailySteps, workoutPlan, sleepData, mentalHealthData, timesheetData, customCategories, eliteName, stripeElite, habits, habitLog, journalEntries, countdowns, bucketList, assetMapNodes, mapPins, userId, dataLoaded]);

  // Tip rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Pomodoro timer
  useEffect(() => {
    if (!pomodoroRunning) return;
    const pomodoroModes = { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
    const interval = setInterval(() => {
      setPomodoroTime(prev => {
        if (prev <= 1) {
          setPomodoroRunning(false);
          if (pomodoroMode === 'work') {
            setPomodoroSessions(s => s + 1);
            const nextMode = (pomodoroSessions + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
            setPomodoroMode(nextMode);
            return pomodoroModes[nextMode];
          } else {
            setPomodoroMode('work');
            return pomodoroModes.work;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroMode, pomodoroSessions]);

  // Send message to Muzz AI
  const sendMessageToMuzz = async (userMessage) => {
    if (!userMessage.trim() || isTyping) return;

    // Check AI daily limit
    if (isAiLimitReached()) {
      setChatMessages(prev => [...prev, 
        { role: 'user', text: userMessage.trim() },
        { role: 'muzz', text: `Oi mate, you've hit your daily limit of ${AI_DAILY_LIMIT} messages! 🦘\n\nThis resets at midnight so come back tomorrow for another yarn. Upgrade to Elite for more chats!` }
      ]);
      setHomeInput('');
      return;
    }
    
    const msg = userMessage.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setHomeInput('');
    setIsTyping(true);

    // Build context about user's financial data
    const totalBills = subscriptions.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
    const totalAssets = assets.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
    const totalStocksVal = stocks.reduce((sum, s) => sum + (parseFloat(s.currentValue) || 0), 0);
    const salaryNum = parseFloat(monthlySalary) || 0;

    const financialContext = `
USER'S FINANCIAL DATA (reference this when relevant):
- Monthly Income: $${salaryNum.toLocaleString()}
- Monthly Bills: $${totalBills.toFixed(2)} (${subscriptions.filter(s => s.name).length} bills tracked)
- Total Assets: $${totalAssets.toLocaleString()}
- Investment Portfolio: $${totalStocksVal.toLocaleString()} (${stocks.filter(s => s.name).length} holdings)
${salaryNum > 0 ? `- Bills as % of Income: ${((totalBills / salaryNum) * 100).toFixed(1)}%` : ''}
`;

    const brainRotMode = muzzPersonality;

    const systemPrompt = brainRotMode
    ? `You are Muzz, a friendly Australian kangaroo financial advisor. You live inside a budgeting app called "Muzz".

PERSONALITY:
- Use Aussie slang naturally (mate, legend, ripper, no worries)
- You can use ONE gen-z term per response MAX: W, L, no cap, fr, bussin, lowkey, based, bet, aura
- Keep responses SHORT - 2-3 sentences max
- Give legit advice on ANY topic
- NEVER say "g'day mate" or "no cap" in every response - vary your language
- NEVER repeat the same phrases over and over

${financialContext}

IMPORTANT: Be natural and varied. Don't spam the same slang repeatedly. Short and punchy! 🦘`
    : `You are Muzz, a friendly Australian kangaroo who's a financial advisor and budgeting expert. You live inside a budgeting app called "Muzz".

PERSONALITY:
- Warm, encouraging, casual Aussie slang (mate, legend, no worries)
- Knowledgeable about personal finance and investing
- Give practical, actionable advice
- Keep responses SHORT (2-3 sentences max)
- Can discuss ANY topic, not just finance
- NEVER say "g'day mate" in every message - vary your greetings
- NEVER repeat the same phrases over and over

${financialContext}

Remember: Be natural and varied. Don't spam the same phrases. Keep it short, helpful, and real! 🦘`;

    try {
      // Build conversation history as proper Gemini multi-turn format
      const geminiContents = [];
      chatMessages.slice(-10).forEach(m => {
        geminiContents.push({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        });
      });
      geminiContents.push({ role: 'user', parts: [{ text: msg }] });
      
      const response = await fetch(api('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: systemPrompt,
          contents: geminiContents
        })
      });

      const data = await response.json();
      const reply = data.reply || "No worries, give me another crack at that question!";
      setChatMessages(prev => [...prev, { role: 'muzz', text: reply }]);
      incrementAiUsage();
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'muzz', text: `Aw mate, hit a snag there. Give it another go!` }]);
    }
    
    setIsTyping(false);
  };

  // Chat drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.chat-header')) {
      setIsDragging(true);
      setDragOffset({ x: e.clientX - chatPosition.x, y: e.clientY - chatPosition.y });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setChatPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Props for MuzzChat component
  const muzzChatProps = {
    muzzPersonality,
    isMuzzEnabled,
    isChatHidden,
    setIsChatHidden,
    chatSize,
    setChatSize,
    chatPosition,
    isChatExpanded,
    setIsChatExpanded,
    chatMessages,
    setChatMessages,
    handleMouseDown,
    subscriptions,
    monthlySalary
  };

  // Free features: home, tasks, reminders, diet, custom1
  // Elite features: gym, bills, assets, investments, custom2, custom3
  const freeFeatures = ['home', 'tasks', 'reminders', 'diet', 'custom1', 'upgrade', 'feedback'];
  const isFeatureLocked = (id) => !isElite && !freeFeatures.includes(id);

  // Sidebar navigation items
  const navItems = [
    { id: "home", label: "Dashboard", icon: Home },
    { id: "habits", label: "Habits", icon: Flame },
    { id: "countdowns", label: "Countdowns", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: CheckCircle2 },
    { id: "reminders", label: "Reminders", icon: Bell },
    { id: "diet", label: "Diet", icon: ShoppingCart },
    { id: "gym", label: "Health", icon: Dumbbell, eliteOnly: true },
    { id: "timetable", label: "Timetable", icon: Calendar, eliteOnly: true },
    { id: "work", label: "Work", icon: Briefcase, eliteOnly: true },
    { id: "varied", label: "Bills", icon: Wallet, eliteOnly: true },
    { id: "assets", label: "Assets", icon: DollarSign, eliteOnly: true },
    { id: "investments", label: "Investments", icon: TrendingUp, eliteOnly: true },
    ...customCategories.map((c, i) => ({ id: c.id, label: c.name, icon: Star, eliteOnly: i > 0 })),
    { id: "feedback", label: "Feedback & Support", icon: MessageCircle },
    { id: "upgrade", label: isElite ? "Elite Status" : "Upgrade to Elite", icon: Award },
  ];

  // Calculate totals for dashboard
  const totalMonthly = subscriptions.reduce((sum, s) => sum + (parseFloat(s.monthly) || 0), 0) + businessSubscriptions.reduce((sum, s) => sum + (parseFloat(s.monthly) || 0), 0);
  const totalAssets = assets.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
  const totalStocks = stocks.reduce((sum, s) => sum + (parseFloat(s.currentValue) || 0), 0);
  const netWorth = totalAssets;
  const salaryNum = parseFloat(monthlySalary) || 0;
  const savingsRate = salaryNum > 0 ? ((salaryNum - totalMonthly) / salaryNum * 100) : 0;

  // Daily quote
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const todayQuote = investmentQuotes[dayOfYear % investmentQuotes.length];

  // Financial context for Muzz chat
  const financialContext = `User's financial snapshot:
- Monthly Salary: $${salaryNum.toLocaleString()}
- Total Monthly Bills: $${totalMonthly.toFixed(0)}
- Net Worth: $${netWorth.toLocaleString()}
- Total Assets: $${totalAssets.toLocaleString()}
- Portfolio Value: $${totalStocks.toLocaleString()}
- Savings Rate: ${savingsRate.toFixed(1)}%`;

  // Achievements check
  useEffect(() => {
    const a = [];
    if (netWorth >= 1000) a.push("first_1k");
    if (netWorth >= 10000) a.push("10k_club");
    if (savingsRate >= 20) a.push("saver_20");
    if (savingsRate >= 50) a.push("super_saver");
    if (currentStreak >= 7) a.push("week_streak");
    if (stocks.length >= 5) a.push("diversified");
    setAchievements(a);
  }, [netWorth, savingsRate, currentStreak, stocks]);

  // Lock body scroll when sidebar is open
  const scrollPosRef = useRef(0);
  const viewScrollRef = useRef({});
  useEffect(() => {
    const viewEl = document.getElementById('muzz-view-scroll');
    if (sidebarOpen) {
      // Save current view scroll position
      if (viewEl) viewScrollRef.current[activeView] = viewEl.scrollTop;
    } else {
      // Restore view scroll position after menu closes
      if (viewEl) {
        const saved = viewScrollRef.current[activeView] || 0;
        setTimeout(() => { viewEl.scrollTop = saved; }, 0);
      }
    }
  }, [sidebarOpen]);

  // Sidebar Component - Apple-style clean design
  const Sidebar = () => {
    const menuItems = [
      { section: 'LIFE', id:'home', label:'Dashboard', icon:'🏠' },
      { section: 'LIFE', id:'habits', label:'Habits', icon:'🔥' },
      { section: 'LIFE', id:'tasks', label:'Tasks', icon:'✅' },
      { section: 'LIFE', id:'countdowns', label:'Countdowns', icon:'⏳' },
      { section: 'LIFE', id:'reminders', label:'Reminders', icon:'🔔' },
      { section: 'HEALTH', id:'gym', label:'Health', icon:'💪', elite:true },
      { section: 'HEALTH', id:'gymworkout', label:'Gym', icon:'🏋️', elite:true },
      { section: 'HEALTH', id:'work', label:'Work', icon:'💼', elite:true },
      { section: 'HEALTH', id:'diet', label:'Diet', icon:'🥗', elite:true },
      { section: 'HEALTH', id:'timetable', label:'Timetable', icon:'📅', elite:true },
      { section: 'FINANCE', id:'varied', label:'Bills', icon:'💸', elite:true },
      { section: 'FINANCE', id:'assets', label:'Assets', icon:'🏠', elite:true },
      { section: 'FINANCE', id:'investments', label:'Investments', icon:'📈', elite:true },
      { section: 'ACCOUNT', id:'upgrade', label: isElite ? 'Elite Status' : 'Upgrade', icon:'⚡' },
      { section: 'ACCOUNT', id:'statsinsights', label:'Stats & Insights', icon:'📊' },
      { section: 'ACCOUNT', id:'feedback', label:'Feedback', icon:'💬' },
    ];
    const sections = ['LIFE','HEALTH','FINANCE','ACCOUNT'];
    const sectionColors = { LIFE:'#00c8ff', HEALTH:'#f97316', FINANCE:'#22c55e', ACCOUNT:'#8b5cf6' };

    return (
      <>
        <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 z-40 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl" style={{background:"rgba(5,15,30,0.9)",border:"1px solid rgba(0,200,255,0.25)",backdropFilter:"blur(10px)"}}>
          <div className="w-5 h-0.5 rounded-full" style={{background:"#00c8ff"}}></div>
          <div className="w-5 h-0.5 rounded-full" style={{background:"#00c8ff"}}></div>
          <div className="w-5 h-0.5 rounded-full" style={{background:"#00c8ff"}}></div>
        </button>

        <div className="fixed inset-0 z-50 transition-all duration-300" style={{background:"rgba(2,8,20,0.98)",backdropFilter:"blur(20px)",opacity:sidebarOpen?1:0,pointerEvents:sidebarOpen?'all':'none',visibility:sidebarOpen?'visible':'hidden'}}>
          <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(0,200,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.02) 1px,transparent 1px)',backgroundSize:'40px 40px',pointerEvents:'none'}} />

          <div className="relative z-10 flex items-center justify-between px-6 pt-12 pb-4" style={{borderBottom:"1px solid rgba(0,200,255,0.1)"}}>
            <div>
              <div className="text-white" style={{fontFamily:"'Orbitron',monospace",fontWeight:900,fontSize:'20px',letterSpacing:'4px'}}>MUZZ</div>
              <div className="text-xs mt-0.5" style={{color:"#00c8ff",letterSpacing:"2px"}}>NAVIGATION SYSTEM</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{background:"rgba(0,200,255,0.1)",border:"1px solid rgba(0,200,255,0.3)"}}>
              <X className="w-5 h-5" style={{color:"#00c8ff"}} />
            </button>
          </div>

          <div className="relative z-10 px-4 py-4">
            <div className="grid grid-cols-2 gap-x-3">
              {sections.map(sec => {
                const items = menuItems.filter(i => i.section === sec);
                const color = sectionColors[sec];
                return (
                  <div key={sec} className="mb-4">
                    <div className="text-xs font-mono mb-2 px-1" style={{color:`${color}70`,letterSpacing:'2px'}}>// {sec}</div>
                    {items.map(item => {
                      const active = activeView === item.id;
                      const locked = item.elite && !isElite;
                      return (
                        <button key={item.id}
                          onClick={() => { if(locked){setActiveView('upgrade');}else{setActiveView(item.id);} setSidebarOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1 text-left transition-all"
                          style={{background:active?`${color}15`:'rgba(255,255,255,0.02)',border:`1px solid ${active?`${color}50`:'rgba(255,255,255,0.05)'}`}}>
                          <span className="text-base leading-none">{item.icon}</span>
                          <span className="text-sm font-medium" style={{color:active?color:locked?'rgba(148,163,184,0.3)':'rgba(255,255,255,0.8)'}}>{item.label}</span>
                          {locked && <span className="ml-auto text-xs" style={{color:'rgba(0,200,255,0.3)'}}>⚡</span>}
                          {active && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:color,boxShadow:`0 0 6px ${color}`}}></span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="mt-1 pt-3" style={{borderTop:'1px solid rgba(0,200,255,0.08)'}}>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button onClick={() => { doExport(); setSidebarOpen(false); }} className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm" style={{background:'rgba(0,200,255,0.05)',border:'1px solid rgba(0,200,255,0.15)',color:'rgba(0,200,255,0.7)'}}>
                  <Download className="w-4 h-4" /> Export
                </button>
                <label className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm cursor-pointer" style={{background:'rgba(0,200,255,0.05)',border:'1px solid rgba(0,200,255,0.15)',color:'rgba(0,200,255,0.7)'}}>
                  <Upload className="w-4 h-4" /> Import
                  <input type="file" id="import-file" accept=".json" className="hidden" onChange={(e) => { doImport(e); setSidebarOpen(false); }} />
                </label>
              </div>
              <button onClick={() => { signOut(); setSidebarOpen(false); }} className="w-full py-2 rounded-xl text-sm" style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.15)',color:'rgba(239,68,68,0.6)'}}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Save status indicator (separate from Sidebar to prevent scroll reset)
  const SaveIndicator = () => (
    saveStatus !== 'idle' ? (
      <div className={`fixed top-4 right-4 z-30 px-3 py-2 rounded-2xl shadow-sm flex items-center gap-2 text-xs font-medium transition-all backdrop-blur-lg ${
        saveStatus === 'saving' ? 'bg-orange-50/90 text-orange-600 border border-orange-100' : 
        saveStatus === 'saved' ? 'bg-green-50/90 text-green-600 border border-green-100' : 
        'bg-red-50/90 text-red-600 border border-red-100'
      }`}>
        {saveStatus === 'saving' && (
          <span className='flex items-center gap-1'>
            <Loader2 className='w-3 h-3 animate-spin' /> Saving...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className='flex items-center gap-1'>
            <CheckCircle2 className='w-3 h-3' /> Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className='flex items-center gap-1'>
            <X className='w-3 h-3' /> Failed
          </span>
        )}
      </div>
    ) : null
  );

  // REMINDERS VIEW
  if (activeView === 'reminders') {
    const addBirthday = () => {
      setBirthdays(prev => [...prev, { id: Date.now(), name: '', date: '', category: 'friend' }]);
    };

    const addReminder = () => {
      setReminders(prev => [...prev, { id: Date.now(), title: '', date: '', notes: '' }]);
    };

    // Sort birthdays by upcoming date
    const sortedBirthdays = [...birthdays].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      aDate.setHours(0, 0, 0, 0);
      bDate.setHours(0, 0, 0, 0);
      aDate.setFullYear(today.getFullYear());
      bDate.setFullYear(today.getFullYear());
      if (aDate < today) aDate.setFullYear(today.getFullYear() + 1);
      if (bDate < today) bDate.setFullYear(today.getFullYear() + 1);
      return aDate - bDate;
    });

    // Sort reminders by date
    const sortedReminders = [...reminders].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date) - new Date(b.date);
    });

    const getUpcomingText = (dateStr) => {
      if (!dateStr) return '';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bday = new Date(dateStr);
      bday.setHours(0, 0, 0, 0);
      bday.setFullYear(today.getFullYear());
      if (bday < today) bday.setFullYear(today.getFullYear() + 1);
      const diff = Math.round((bday - today) / (1000 * 60 * 60 * 24));
      if (diff === 0) return '🎉 Today!';
      if (diff === 1) return '🎉 Tomorrow!';
      if (diff <= 7) return `🎂 In ${diff} days`;
      if (diff <= 30) return `In ${diff} days`;
      return '';
    };

    const getReminderUpcoming = (dateStr) => {
      if (!dateStr) return '';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reminderDate = new Date(dateStr);
      const diff = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));
      if (diff < 0) return 'Overdue';
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Tomorrow';
      if (diff <= 7) return `In ${diff} days`;
      return '';
    };

    return (
      <div className="min-h-screen bg-transparent">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px",letterSpacing:"0.5px"}}>← Back</button>
                <h1 className="text-4xl font-semibold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Reminders</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* General Reminders */}
          <button
            onClick={addReminder}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-medium hover:scale-[1.02] transition-transform shadow-lg"
          >
            + Add Reminder
          </button>

          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-white">Reminders</h2>
              <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>General reminders and notes</p>
            </div>
            <div className="divide-y">
              {sortedReminders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No reminders added yet. Add one above!
                </div>
              ) : (
                sortedReminders.map(reminder => (
                  <div key={reminder.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2 min-w-0">
                        <textarea
                          value={reminder.title}
                          onFocus={scrollInputIntoView}
                          onChange={(e) => {
                            setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, title: e.target.value } : r));
                          }}
                          placeholder="Reminder title"
                          className="w-full px-4 py-3 rounded-xl text-base focus:outline-none resize-none text-white placeholder-slate-500" style={{background:"rgba(0,200,255,0.04)",border:"1px solid rgba(0,200,255,0.15)",minHeight:"60px"}}
                          rows={Math.max(2, Math.ceil((reminder.title?.length || 0) / 35))}
                        />
                        <div className="flex flex-wrap gap-3 items-center">
                          {/* Permanent toggle */}
                          <button onClick={() => setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, permanent: !r.permanent, date: r.permanent ? r.date : '' } : r))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                            style={{background: reminder.permanent ? 'rgba(0,200,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${reminder.permanent ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.1)'}`, color: reminder.permanent ? '#00c8ff' : 'rgba(148,163,184,0.6)'}}>
                            📌 {reminder.permanent ? 'Permanent' : 'Permanent?'}
                          </button>
                          {/* Date (only show if not permanent) */}
                          {!reminder.permanent && (
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={reminder.date || ''}
                                onFocus={scrollInputIntoView}
                                onChange={(e) => setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, date: e.target.value } : r))}
                                className="px-3 py-2 rounded-xl text-sm focus:outline-none text-white" style={{background:"rgba(0,200,255,0.04)",border:"1px solid rgba(0,200,255,0.15)"}}
                              />
                              {reminder.date && (
                                <button onClick={() => setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, date: '' } : r))} className="text-gray-400 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              {getReminderUpcoming(reminder.date) && (
                                <span className={`text-sm font-medium ${getReminderUpcoming(reminder.date) === 'Overdue' ? 'text-red-600' : getReminderUpcoming(reminder.date) === 'Today' || getReminderUpcoming(reminder.date) === 'Tomorrow' ? 'text-green-600' : 'text-orange-500'}`}>
                                  {getReminderUpcoming(reminder.date)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setReminders(prev => prev.filter(r => r.id !== reminder.id))}
                        className="text-gray-400 hover:text-red-500 transition-colors mt-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Birthdays */}
          <button
            onClick={addBirthday}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-medium hover:scale-[1.02] transition-transform shadow-lg"
          >
            + Add Birthday
          </button>

          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-white">🎂 Birthdays</h2>
              <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Friends & Family birthdays</p>
            </div>
            <div className="divide-y">
              {sortedBirthdays.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No birthdays added yet. Add one above!
                </div>
              ) : (
                sortedBirthdays.map(bday => (
                  <div key={bday.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2 min-w-0">
                        <textarea
                          ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                          value={bday.name}
                          onFocus={handleTextareaFocus}
                          onChange={(e) => {
                            setBirthdays(prev => prev.map(b => b.id === bday.id ? { ...b, name: e.target.value } : b));
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          placeholder="Name"
                          className="w-full px-4 py-3 rounded-xl text-base focus:outline-none resize-none text-white placeholder-slate-500" style={{background:"rgba(0,200,255,0.04)",border:"1px solid rgba(0,200,255,0.15)",minHeight:"48px",overflow:"hidden"}}
                        />
                        <div className="flex flex-wrap gap-3 items-center">
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={bday.date}
                              onFocus={scrollInputIntoView}
                              onChange={(e) => setBirthdays(prev => prev.map(b => b.id === bday.id ? { ...b, date: e.target.value } : b))}
                              className="px-3 py-2 rounded-xl text-sm focus:outline-none text-white" style={{background:"rgba(0,200,255,0.04)",border:"1px solid rgba(0,200,255,0.15)"}}
                            />
                            {bday.date && (
                              <button
                                onClick={() => setBirthdays(prev => prev.map(b => b.id === bday.id ? { ...b, date: '' } : b))}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Clear date"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <select
                            value={bday.category}
                            onChange={(e) => setBirthdays(prev => prev.map(b => b.id === bday.id ? { ...b, category: e.target.value } : b))}
                            className={`px-3 py-2 rounded-xl text-sm font-medium border-2 ${
                              bday.category === 'family' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                              'bg-blue-100 text-blue-700 border-blue-200'
                            }`}
                          >
                            <option value="friend">Friend</option>
                            <option value="family">Family</option>
                          </select>
                          {getUpcomingText(bday.date) && (
                            <span className={`text-sm font-medium ${getUpcomingText(bday.date).includes('Today') || getUpcomingText(bday.date).includes('Tomorrow') ? 'text-green-600' : 'text-orange-500'}`}>
                              {getUpcomingText(bday.date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setBirthdays(prev => prev.filter(b => b.id !== bday.id))}
                        className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <FloatingChat 
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          isTyping={isTyping}
          setIsTyping={setIsTyping}
          financialContext={financialContext}
          isAiLimitReached={isAiLimitReached}
          incrementAiUsage={incrementAiUsage}
          getAiRemaining={getAiRemaining}
          AI_DAILY_LIMIT={AI_DAILY_LIMIT}
          muzzPersonality={muzzPersonality}
        />
      </div>
    );
  }


  // TASKS VIEW
  if (activeView === 'tasks') {
    const addDailyTask = () => {
      setDailyTasks(prev => [...prev, { id: Date.now(), text: '', completed: false, dateAdded: new Date().toISOString() }]);
    };

    const addWeeklyTask = () => {
      setWeeklyTasks(prev => [...prev, { id: Date.now(), text: '', completed: false, startDate: '', dueDate: '', dateAdded: new Date().toISOString() }]);
    };

    const toggleDailyTask = (id) => {
      setDailyTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const toggleWeeklyTask = (id) => {
      setWeeklyTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
      <div className="bg-transparent pb-24" style={{minHeight:"100vh",overflowY:"auto"}}>
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-5xl mx-auto">
            <button onClick={() => setActiveView('home')} className="mb-4 text-sm transition-colors flex items-center gap-1" style={{color:"rgba(0,200,255,0.7)",letterSpacing:"0.5px"}}>← Back</button>
            <h1 className="text-3xl font-bold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Task Management</h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTasksSubTab('daily')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                tasksSubTab === 'daily'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Daily Tasks
            </button>
            <button
              onClick={() => setTasksSubTab('weekly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                tasksSubTab === 'weekly'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Weekly Tasks
            </button>
            <button
              onClick={() => setTasksSubTab('general')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                tasksSubTab === 'general'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              General Tasks
            </button>
            <button
              onClick={() => setTasksSubTab('rotation')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                tasksSubTab === 'rotation'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Daily Rotation
            </button>
            <button
              onClick={() => setTasksSubTab('pomodoro')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                tasksSubTab === 'pomodoro'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Pomodoro
            </button>
          </div>

          {/* Daily Tasks */}
          {tasksSubTab === 'daily' && (
            <>
              <button
                onClick={addDailyTask}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-medium hover:scale-[1.02] transition-transform shadow-lg"
              >
                + Add Daily Task
              </button>

              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Daily Tasks</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Tasks to complete today</p>
                </div>
                <div className="divide-y">
                  {dailyTasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No daily tasks. Add one above!
                    </div>
                  ) : (
                    dailyTasks.map(task => (
                      <div key={task.id} className={`p-4 hover:bg-gray-50 transition-colors ${task.completed ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleDailyTask(task.id)}
                            className={`w-6 h-6 mt-3 rounded-full flex-shrink-0 flex items-center justify-center ${
                              task.completed 
                                ? 'bg-green-500' 
                                : 'border-2 border-gray-300 hover:border-blue-500'
                            }`}
                          >
                            {task.completed && <span className="text-white text-xs">✓</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <textarea
                              value={task.text}
                              onFocus={scrollInputIntoView}
                              onChange={(e) => {
                                setDailyTasks(prev => prev.map(t => t.id === task.id ? { ...t, text: e.target.value } : t));
                              }}
                              placeholder="What needs to be done today?"
                              className={`w-full px-4 py-3 rounded-xl text-base focus:outline-none resize-none ${task.completed ? 'line-through opacity-50' : 'text-white'}`} style={{background:"rgba(0,200,255,0.04)",border:"1px solid rgba(0,200,255,0.15)",minHeight:"70px"}}
                              rows={Math.max(2, Math.ceil((task.text?.length || 0) / 35))}
                            />
                          </div>
                          <button
                            onClick={() => setDailyTasks(prev => prev.filter(t => t.id !== task.id))}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Weekly Tasks */}
          {tasksSubTab === 'weekly' && (
            <>
              <button
                onClick={addWeeklyTask}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-medium hover:scale-[1.02] transition-transform shadow-lg"
              >
                + Add Weekly Task
              </button>

              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Weekly Tasks</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Tasks to complete this week</p>
                </div>
                <div className="divide-y">
                  {weeklyTasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No weekly tasks. Add one above!
                    </div>
                  ) : (
                    weeklyTasks.map(task => (
                      <div key={task.id} className={`p-4 hover:bg-gray-50 transition-colors ${task.completed ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleWeeklyTask(task.id)}
                            className={`mt-3 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${
                              task.completed 
                                ? 'bg-green-500' 
                                : 'border-2 border-gray-300 hover:border-blue-500'
                            }`}
                          >
                            {task.completed && <span className="text-white text-xs">✓</span>}
                          </button>
                          <div className="flex-1 space-y-2 min-w-0">
                            <textarea
                              value={task.text}
                              onFocus={scrollInputIntoView}
                              onChange={(e) => {
                                setWeeklyTasks(prev => prev.map(t => t.id === task.id ? { ...t, text: e.target.value } : t));
                              }}
                              placeholder="What needs to be done this week?"
                              className={`w-full px-4 py-3 rounded-xl text-base focus:outline-none resize-none ${task.completed ? 'line-through opacity-50' : 'text-white'}`} style={{background:"rgba(0,200,255,0.04)",border:"1px solid rgba(0,200,255,0.15)",minHeight:"70px"}}
                              rows={Math.max(2, Math.ceil((task.text?.length || 0) / 35))}
                            />
                            <div className="flex flex-wrap gap-2 items-center">
                              <div className="flex items-center gap-1">
                                <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Start:</span>
                                <input
                                  type="date"
                                  value={task.startDate || ''}
                                  onFocus={scrollInputIntoView}
                                  onChange={(e) => setWeeklyTasks(prev => prev.map(t => t.id === task.id ? { ...t, startDate: e.target.value } : t))}
                                  className="px-3 py-1 rounded-full text-xs border bg-gray-50"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Due:</span>
                                <input
                                  type="date"
                                  value={task.dueDate || ''}
                                  onFocus={scrollInputIntoView}
                                  onChange={(e) => setWeeklyTasks(prev => prev.map(t => t.id === task.id ? { ...t, dueDate: e.target.value } : t))}
                                  className="px-3 py-1 rounded-full text-xs border bg-gray-50"
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setWeeklyTasks(prev => prev.filter(t => t.id !== task.id))}
                            className="text-gray-400 hover:text-red-500 transition-colors mt-1"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* General Tasks */}
          {tasksSubTab === 'general' && (
            <>
              <button
                onClick={() => setGeneralTasks(prev => [...prev, { id: Date.now(), text: '', completed: false, dateAdded: new Date().toISOString() }])}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-medium hover:scale-[1.02] transition-transform shadow-lg"
              >
                + Add General Task
              </button>

              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">General Tasks</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Ongoing tasks with no time limit</p>
                </div>
                <div className="divide-y">
                  {generalTasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No general tasks. Add one above!
                    </div>
                  ) : (
                    generalTasks.map(task => (
                      <div key={task.id} className={`p-4 hover:bg-gray-50 transition-colors ${task.completed ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => setGeneralTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))}
                            className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              task.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                          >
                            {task.completed && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <textarea
                            value={task.text}
                            onChange={(e) => setGeneralTasks(prev => prev.map(t => t.id === task.id ? { ...t, text: e.target.value } : t))}
                            placeholder="Enter task..."
                            className={`flex-1 resize-none border-0 focus:outline-none focus:ring-0 text-gray-700 bg-transparent min-h-[70px] ${task.completed ? 'line-through' : ''}`}
                            rows={2}
                          />
                          <button
                            onClick={() => setGeneralTasks(prev => prev.filter(t => t.id !== task.id))}
                            className="text-gray-400 hover:text-red-500 transition-colors mt-1"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Daily Rotation */}
          {tasksSubTab === 'rotation' && (
            <>
              <button
                onClick={() => setDailyRotation([
                  { time: '1am', activity: '-' },
                  { time: '2am', activity: '-' },
                  { time: '3am', activity: '-' },
                  { time: '4am', activity: '-' },
                  { time: '5am', activity: '-' },
                  { time: '6am', activity: '-' },
                  { time: '7am', activity: '-' },
                  { time: '8am', activity: '-' },
                  { time: '9am', activity: '-' },
                  { time: '10am', activity: '-' },
                  { time: '11am', activity: '-' },
                  { time: '12pm', activity: '-' },
                  { time: '1pm', activity: '-' },
                  { time: '2pm', activity: '-' },
                  { time: '3pm', activity: '-' },
                  { time: '4pm', activity: '-' },
                  { time: '5pm', activity: '-' },
                  { time: '6pm', activity: '-' },
                  { time: '7pm', activity: '-' },
                  { time: '8pm', activity: '-' },
                  { time: '9pm', activity: '-' },
                  { time: '10pm', activity: '-' },
                  { time: '11pm', activity: '-' },
                  { time: '12am', activity: '-' },
                ])}
                className="w-full py-3 rounded-2xl font-medium transition-colors text-slate-300" style={{background:"rgba(0,200,255,0.06)",border:"1px solid rgba(0,200,255,0.15)"}}
              >
                Reset to Default
              </button>
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Daily Rotation</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Your daily schedule - click to edit activities</p>
                </div>
                <div className="divide-y">
                  {dailyRotation.map((slot, index) => (
                    <div key={index} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                      <div className="w-16 font-semibold text-gray-600">{slot.time}</div>
                      <input
                        type="text"
                        value={slot.activity}
                        onChange={(e) => {
                          setDailyRotation(prev => prev.map((s, i) => i === index ? { ...s, activity: e.target.value } : s));
                        }}
                        className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Pomodoro Timer */}
          {tasksSubTab === 'pomodoro' && (() => {
            const pomodoroModes = { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
            const startPomodoro = () => { if (!pomodoroRunning) setPomodoroRunning(true); };
            const pausePomodoro = () => setPomodoroRunning(false);
            const resetPom = (mode) => {
              setPomodoroRunning(false);
              const m = mode || pomodoroMode;
              setPomodoroMode(m);
              setPomodoroTime(pomodoroModes[m]);
            };
            const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
            return (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border p-8 text-center">
                  <div className="flex justify-center gap-3 mb-8">
                    {[{ id: 'work', label: 'Focus' }, { id: 'shortBreak', label: 'Short Break' }, { id: 'longBreak', label: 'Long Break' }].map(m => (
                      <button key={m.id} onClick={() => resetPom(m.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${pomodoroMode === m.id ? 'text-white' : 'text-slate-500'}`}>{m.label}</button>
                    ))}
                  </div>
                  <div className="text-8xl font-bold text-gray-800 mb-8 font-mono">{formatTime(pomodoroTime)}</div>
                  <div className="flex justify-center gap-4">
                    {!pomodoroRunning ? (
                      <button onClick={startPomodoro} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-lg">Start</button>
                    ) : (
                      <button onClick={pausePomodoro} className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-lg">Pause</button>
                    )}
                    <button onClick={() => resetPom(pomodoroMode)} className="px-8 py-3 bg-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-300 transition-colors">Reset</button>
                  </div>
                  <div className="mt-8 flex justify-center gap-2">
                    {[...Array(4)].map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full ${i < (pomodoroSessions % 4) ? 'bg-red-500' : 'bg-gray-200'}`} />))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{pomodoroSessions} sessions completed today</p>
                </div>
                <div className="rounded-2xl p-6" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
                  <h3 className="font-semibold text-white mb-2">How the Pomodoro Technique works</h3>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Focus for 25 minutes → 5 min break. After 4 sessions, take a 15 min break. This helps you stay sharp and avoid burnout. 🍅</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  if (activeView === 'diet') {
    const today = new Date().toISOString().split('T')[0];

    // Get all days of the current week (Monday to Sunday)
    const getWeekDays = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        days.push({
          date: day.toISOString().split('T')[0],
          dayName: day.toLocaleDateString('en-AU', { weekday: 'long' }),
          dayShort: day.toLocaleDateString('en-AU', { weekday: 'short' }),
          dateNum: day.getDate(),
          month: day.toLocaleDateString('en-AU', { month: 'short' }),
          isToday: day.toISOString().split('T')[0] === today
        });
      }
      return days;
    };

    const weekDays = getWeekDays();

    const addGroceryItem = () => {
      setGroceries(prev => [...prev, { 
        id: Date.now(), 
        item: '', 
        quantity: '', 
        serves: '', 
        proteinPerServe: '', 
        carbsPerServe: '',
        fatPerServe: '', 
        caloriesPerServe: '',
        checked: false 
      }]);
    };

    const updateGrocery = (id, field, value) => {
      setGroceries(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
    };

    const addMealToDay = (dateKey) => {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);
      const existingMeals = dailyMeals[dateKey] || [];
      const newMeals = [...existingMeals, { id: Date.now(), meal: '', time: timeStr }];
      setDailyMeals(prev => ({ ...prev, [dateKey]: newMeals }));
    };

    const updateMealForDay = (dateKey, id, field, value) => {
      const existingMeals = dailyMeals[dateKey] || [];
      const newMeals = existingMeals.map(m => m.id === id ? { ...m, [field]: value } : m);
      setDailyMeals(prev => ({ ...prev, [dateKey]: newMeals }));
    };

    const deleteMealFromDay = (dateKey, id) => {
      const existingMeals = dailyMeals[dateKey] || [];
      const newMeals = existingMeals.filter(m => m.id !== id);
      setDailyMeals(prev => ({ ...prev, [dateKey]: newMeals }));
    };

    return (
      <div className="min-h-screen bg-transparent">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px",letterSpacing:"0.5px"}}>← Back</button>
                <h1 className="text-4xl font-semibold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Diet Management</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDietSubTab('groceries')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                dietSubTab === 'groceries'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Groceries
            </button>
            <button
              onClick={() => setDietSubTab('meals')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                dietSubTab === 'meals'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Weekly Meals
            </button>
            <button
              onClick={() => setDietSubTab('water')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                dietSubTab === 'water'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Water
            </button>
            <button
              onClick={() => setDietSubTab('plans')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                dietSubTab === 'plans'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Diet Plans
            </button>
            <button
              onClick={() => setDietSubTab('custom')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                dietSubTab === 'custom'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              My Diets
            </button>
          </div>

          {/* Groceries Tab */}
          {dietSubTab === 'groceries' && (
            <div className="space-y-4">
              {/* Shopping Lists - Overview or Detail */}
              {!activeShoppingList ? (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
                    <h2 className="text-2xl font-bold mb-1">🛒 Shopping Lists</h2>
                    <p className="text-purple-200 text-sm">{shoppingLists.length} {shoppingLists.length === 1 ? 'list' : 'lists'} • {groceries.filter(g => !g.checked).length} items to buy</p>
                  </div>

                  {/* Create New List */}
                  <button
                    onClick={() => {
                      const name = prompt('List name (e.g. Groceries, Kmart, Bunnings)');
                      if (name?.trim()) {
                        setShoppingLists(prev => [...prev, { id: Date.now().toString(), name: name.trim(), emoji: '🛍️' }]);
                      }
                    }}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-medium hover:scale-[1.02] transition-transform shadow-lg"
                  >
                    + Create New List
                  </button>

                  {/* List Cards */}
                  {shoppingLists.map(list => {
                    const listItems = groceries.filter(g => (g.listId || 'default') === list.id);
                    const toBuy = listItems.filter(g => !g.checked).length;
                    const inBag = listItems.filter(g => g.checked).length;
                    return (
                      <div
                        key={list.id}
                        onClick={() => setActiveShoppingList(list.id)}
                        className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}
                      >
                        <input
                          type="text"
                          value={list.emoji}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setShoppingLists(prev => prev.map(l => l.id === list.id ? { ...l, emoji: e.target.value.slice(0, 2) } : l))}
                          className="w-12 h-12 text-center text-2xl bg-purple-50 rounded-xl focus:outline-none"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={list.name}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setShoppingLists(prev => prev.map(l => l.id === list.id ? { ...l, name: e.target.value } : l))}
                            className="font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
                          />
                          <p className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>{toBuy} to buy • {inBag} in bag</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {list.id !== 'default' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this list and all its items?')) {
                                  setShoppingLists(prev => prev.filter(l => l.id !== list.id));
                                  setGroceries(prev => prev.filter(g => (g.listId || 'default') !== list.id));
                                }
                              }}
                              className="text-gray-300 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90" />
                        </div>
                      </div>
                    );
                  })}

                  {shoppingLists.length === 0 && (
                    <div className="bg-white rounded-2xl p-12 shadow-sm border text-center">
                      <div className="text-5xl mb-4">🛒</div>
                      <p className="text-gray-500">No shopping lists yet. Create one above!</p>
                    </div>
                  )}
                </>
              ) : (() => {
                /* Detail view for a single list */
                const list = shoppingLists.find(l => l.id === activeShoppingList);
                if (!list) { setActiveShoppingList(null); return null; }
                const listItems = groceries.filter(g => (g.listId || 'default') === list.id);
                const toBuyItems = listItems.filter(g => !g.checked);
                const bagItems = listItems.filter(g => g.checked);

                return (
                  <div className="space-y-4">
                    {/* Back + Header */}
                    <button onClick={() => setActiveShoppingList(null)} className="text-purple-600 font-medium text-sm">← All Lists</button>
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
                      <h2 className="text-2xl font-bold mb-1">{list.emoji} {list.name}</h2>
                      <p className="text-purple-200 text-sm">{toBuyItems.length} to buy • {bagItems.length} in bag</p>
                    </div>

                    {/* Sub-categories + Add */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          const name = prompt('Category name (e.g. Fridge, Freezer, Pantry)');
                          if (name?.trim()) {
                            setShoppingLists(prev => prev.map(l => l.id === list.id ? { ...l, subCategories: [...(l.subCategories || []), { id: Date.now().toString(), name: name.trim(), emoji: '📦' }] } : l));
                          }
                        }}
                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                      >+ Add Category</button>
                      {(list.subCategories || []).map(cat => (
                        <span key={cat.id} className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 flex items-center gap-1">
                          {cat.emoji} {cat.name}
                          <button onClick={() => setShoppingLists(prev => prev.map(l => l.id === list.id ? { ...l, subCategories: (l.subCategories || []).filter(c => c.id !== cat.id) } : l))} className="text-gray-400 hover:text-red-500 ml-1">×</button>
                        </span>
                      ))}
                    </div>

                    {/* Items grouped by sub-category */}
                    {(() => {
                      const cats = list.subCategories || [];
                      const uncategorised = toBuyItems.filter(g => !g.subCategory || !cats.find(c => c.id === g.subCategory));
                      const allGroups = [
                        ...cats.map(cat => ({
                          ...cat,
                          items: toBuyItems.filter(g => g.subCategory === cat.id)
                        })),
                        ...(uncategorised.length > 0 ? [{ id: '_none', name: cats.length > 0 ? 'Uncategorised' : 'Need to Buy', emoji: '🛍️', items: uncategorised }] : [])
                      ];

                      return allGroups.map(group => (
                        <div key={group.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                          <div className="px-4 py-3 bg-purple-50 border-b flex items-center justify-between">
                            <h3 className="font-semibold text-purple-700 flex items-center gap-2">
                              {group.id !== '_none' && (
                                <input type="text" value={group.emoji} onChange={(e) => setShoppingLists(prev => prev.map(l => l.id === list.id ? { ...l, subCategories: (l.subCategories || []).map(c => c.id === group.id ? { ...c, emoji: e.target.value.slice(0, 2) } : c) } : l))} className="w-6 text-center bg-transparent focus:outline-none" />
                              )}
                              {group.id === '_none' ? group.name : (
                                <input type="text" value={group.name} onChange={(e) => setShoppingLists(prev => prev.map(l => l.id === list.id ? { ...l, subCategories: (l.subCategories || []).map(c => c.id === group.id ? { ...c, name: e.target.value } : c) } : l))} className="bg-transparent focus:outline-none font-semibold text-purple-700" />
                              )}
                              {group.items.length > 0 && <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">{group.items.length}</span>}
                            </h3>
                            <button
                              onClick={() => setGroceries(prev => [...prev, { id: Date.now(), item: '', quantity: '1', listId: list.id, subCategory: group.id === '_none' ? '' : group.id, checked: false }])}
                              className="w-7 h-7 bg-purple-500 text-white rounded-lg flex items-center justify-center text-sm hover:bg-purple-600 transition-colors"
                            >+</button>
                          </div>
                          {group.items.length > 0 && (
                            <div className="divide-y">
                              {group.items.map(item => (
                                <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                                  <button
                                    onClick={() => updateGrocery(item.id, 'checked', true)}
                                    className="w-6 h-6 rounded-lg border-2 border-gray-300 hover:border-purple-500 flex-shrink-0 transition-colors"
                                  />
                                  <input
                                    type="text"
                                    value={item.item}
                                    onFocus={scrollInputIntoView}
                                    onChange={(e) => updateGrocery(item.id, 'item', e.target.value)}
                                    placeholder="Item name"
                                    className="flex-1 text-sm font-medium bg-transparent focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={item.quantity || ''}
                                    onFocus={scrollInputIntoView}
                                    onChange={(e) => updateGrocery(item.id, 'quantity', e.target.value)}
                                    placeholder="Qty"
                                    className="w-14 text-sm text-center bg-gray-100 rounded-lg px-2 py-1 focus:outline-none focus:bg-purple-50"
                                  />
                                  <button onClick={() => setGroceries(prev => prev.filter(g => g.id !== item.id))} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ));
                    })()}

                    {/* Shopping Bag */}
                    {bagItems.length > 0 && (
                      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                        <div className="px-4 py-3 bg-green-50 border-b flex items-center justify-between">
                          <h3 className="font-semibold text-green-700 flex items-center gap-2">✅ In Bag <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">{bagItems.length}</span></h3>
                          <button onClick={() => setGroceries(prev => prev.filter(g => !g.checked || (g.listId || 'default') !== list.id))} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
                        </div>
                        <div className="divide-y">
                          {bagItems.map(item => (
                            <div key={item.id} className="px-4 py-3 flex items-center gap-3 opacity-60">
                              <button
                                onClick={() => updateGrocery(item.id, 'checked', false)}
                                className="w-6 h-6 rounded-lg bg-green-500 flex-shrink-0 flex items-center justify-center"
                              >
                                <span className="text-white text-xs">✓</span>
                              </button>
                              <span className="flex-1 text-sm line-through text-gray-500">{item.item || 'Unnamed'}</span>
                              <button onClick={() => setGroceries(prev => prev.filter(g => g.id !== item.id))} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {listItems.length === 0 && (
                      <div className="bg-white rounded-2xl p-12 shadow-sm border text-center">
                        <div className="text-5xl mb-4">{list.emoji}</div>
                        <p className="text-gray-500">This list is empty. Add items above!</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Weekly Meals Tab */}
          {dietSubTab === 'meals' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const resetMeals = {};
                    weekDays.forEach(d => { resetMeals[d.date] = []; });
                    setDailyMeals(prev => ({ ...prev, ...resetMeals }));
                  }}
                  className="px-4 py-2 bg-red-100 text-red-500 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Reset Week
                </button>
              </div>
              {weekDays.map(day => {
                const dayMeals = dailyMeals[day.date] || [];
                return (
                  <div key={day.date} className={`bg-white rounded-3xl shadow-sm border overflow-hidden ${day.isToday ? 'ring-2 ring-orange-500' : ''}`}>
                    <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${day.isToday ? 'text-white cyber-tab-active' : 'bg-gray-200 text-gray-600'}`}>
                          <span className="text-sm font-bold">{day.dayShort}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{day.dayName}</h3>
                          {day.isToday && <p className="text-xs text-orange-500 font-medium">Today</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => addMealToDay(day.date)}
                        className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-sm font-medium hover:scale-105 transition-transform"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="divide-y">
                      {dayMeals.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          No meals logged
                        </div>
                      ) : (
                        dayMeals.map(meal => (
                          <div key={meal.id} className="p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={meal.time}
                                onChange={(e) => updateMealForDay(day.date, meal.id, 'time', e.target.value)}
                                placeholder="00:00"
                                className="w-16 px-2 py-1 border-2 rounded-lg text-sm focus:outline-none focus:border-orange-500 text-center"
                              />
                              <input
                                type="text"
                                value={meal.meal}
                                onChange={(e) => updateMealForDay(day.date, meal.id, 'meal', e.target.value)}
                                placeholder="What did you eat?"
                                className="flex-1 px-2 py-1 border-2 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                              />
                              <button
                                onClick={() => deleteMealFromDay(day.date, meal.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Water Intake Tab */}
          {dietSubTab === 'water' && (() => {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const monday = new Date(now);
            monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            const waterDays = [];
            for (let i = 0; i < 7; i++) {
              const day = new Date(monday);
              day.setDate(monday.getDate() + i);
              const dateKey = day.toISOString().split('T')[0];
              waterDays.push({
                date: dateKey,
                dayName: day.toLocaleDateString('en-AU', { weekday: 'short' }),
                isToday: dateKey === now.toISOString().split('T')[0]
              });
            }
            const todayKey = now.toISOString().split('T')[0];
            const todayAmount = parseFloat(waterIntake.days?.[todayKey]) || 0;
            const goalAmount = parseFloat(waterIntake.goal) || 3;
            const todayPercent = Math.min((todayAmount / goalAmount) * 100, 100);
            const weekTotal = waterDays.reduce((sum, d) => sum + (parseFloat(waterIntake.days?.[d.date]) || 0), 0);
            const weekAvg = weekTotal / 7;

            return (
              <div className="space-y-6">
                {/* Water Bottle + Today's Progress */}
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Water Intake</h2>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Stay hydrated, legend</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Daily Goal:</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={waterIntake.goalStr || '3'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = parseFloat(val) || 0;
                          setWaterIntake(prev => ({ ...prev, goal: num, goalStr: val }));
                        }}
                        className="w-16 px-2 py-1 border-2 rounded-lg text-sm text-center focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>L</span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8">
                    {/* Water Bottle SVG */}
                    <div className="relative">
                      <svg width="120" height="220" viewBox="0 0 120 220">
                        {/* Bottle cap */}
                        <rect x="40" y="0" width="40" height="20" rx="5" fill="#60A5FA" />
                        {/* Bottle neck */}
                        <rect x="35" y="20" width="50" height="15" rx="3" fill="#93C5FD" stroke="#60A5FA" strokeWidth="2" />
                        {/* Bottle body outline */}
                        <rect x="15" y="35" width="90" height="175" rx="15" fill="#EFF6FF" stroke="#60A5FA" strokeWidth="2" />
                        {/* Water fill */}
                        <clipPath id="bottleClip">
                          <rect x="15" y="35" width="90" height="175" rx="15" />
                        </clipPath>
                        <rect
                          x="15"
                          y={35 + 175 * (1 - todayPercent / 100)}
                          width="90"
                          height={175 * (todayPercent / 100)}
                          fill="url(#waterGrad)"
                          clipPath="url(#bottleClip)"
                        />
                        {/* Water gradient */}
                        <defs>
                          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#60A5FA" />
                            <stop offset="100%" stopColor="#3B82F6" />
                          </linearGradient>
                        </defs>
                        {/* Percentage text */}
                        <text x="60" y="130" textAnchor="middle" fill={todayPercent > 50 ? '#FFFFFF' : '#3B82F6'} fontSize="24" fontWeight="bold">
                          {Math.round(todayPercent)}%
                        </text>
                        {/* Amount text */}
                        <text x="60" y="155" textAnchor="middle" fill={todayPercent > 60 ? '#DBEAFE' : '#93C5FD'} fontSize="14">
                          {todayAmount.toFixed(1)}L / {goalAmount}L
                        </text>
                      </svg>
                    </div>
                    {/* Today's Input */}
                    <div className="flex flex-col items-center gap-4">
                      <h3 className="text-lg font-semibold text-white">Today</h3>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const current = parseFloat(waterIntake.days?.[todayKey]) || 0;
                            const newVal = Math.max(0, current - 0.25);
                            setWaterIntake(prev => ({ ...prev, days: { ...prev.days, [todayKey]: newVal } }));
                          }}
                          className="w-12 h-12 bg-red-100 text-red-500 rounded-full text-2xl font-bold hover:bg-red-200 transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={waterIntake.days?.[todayKey] ?? '0'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = parseFloat(val) || 0;
                            setWaterIntake(prev => ({ ...prev, days: { ...prev.days, [todayKey]: num } }));
                          }}
                          className="w-20 px-3 py-3 border-2 rounded-xl text-xl text-center font-bold focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-lg text-gray-500">L</span>
                        <button
                          onClick={() => {
                            const current = parseFloat(waterIntake.days?.[todayKey]) || 0;
                            const newVal = current + 0.25;
                            setWaterIntake(prev => ({ ...prev, days: { ...prev.days, [todayKey]: newVal } }));
                          }}
                          className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full text-2xl font-bold hover:bg-blue-200 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm text-gray-400">Tap +/- for 0.25L or type manually</p>
                    </div>
                  </div>
                </div>

                {/* Weekly View */}
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">This Week</h2>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>
                        Weekly avg: {weekAvg.toFixed(1)}L / day • Total: {weekTotal.toFixed(1)}L
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const resetDays = {};
                        waterDays.forEach(d => { resetDays[d.date] = 0; });
                        setWaterIntake(prev => ({ ...prev, days: { ...prev.days, ...resetDays } }));
                      }}
                      className="px-4 py-2 bg-red-100 text-red-500 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      Reset Week
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-7 gap-3">
                      {waterDays.map(day => {
                        const amount = parseFloat(waterIntake.days?.[day.date]) || 0;
                        const pct = Math.min((amount / goalAmount) * 100, 100);
                        return (
                          <div key={day.date} className={`flex flex-col items-center gap-2 p-3 rounded-2xl ${day.isToday ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-gray-50'}`}>
                            <span className={`text-xs font-bold ${day.isToday ? 'text-blue-600' : 'text-gray-500'}`}>{day.dayName}</span>
                            {/* Mini water bottle */}
                            <div className="relative w-8 h-16 bg-gray-200 rounded-lg overflow-hidden">
                              <div
                                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-300"
                                style={{ height: `${pct}%` }}
                              />
                            </div>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={waterIntake.days?.[day.date] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const num = parseFloat(val) || 0;
                                setWaterIntake(prev => ({ ...prev, days: { ...prev.days, [day.date]: num } }));
                              }}
                              placeholder="0"
                              className="w-12 px-1 py-1 border rounded-lg text-xs text-center focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-xs text-gray-400">{Math.round(pct)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Diet Plans Tab */}
          {dietSubTab === 'plans' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Prebuilt Diet Plans</h2>
                  <p className="text-sm text-gray-500 mt-1">Tap a plan to see the full daily meal breakdown</p>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    {
                      id: 'bulk', name: 'Bulk Mode 💪', goal: 'Build Muscle & Gain Size', calories: '~2,800–3,200 cal/day',
                      color: 'from-red-500 to-orange-500', bgColor: 'bg-red-50',
                      meals: [
                        { time: 'Breakfast (7am)', meal: '4 eggs scrambled, 2 toast w/ avocado, banana smoothie w/ protein powder & oats', cal: '~750 cal' },
                        { time: 'Snack (10am)', meal: 'Greek yoghurt w/ granola & mixed berries, handful of almonds', cal: '~350 cal' },
                        { time: 'Lunch (12:30pm)', meal: '200g chicken breast, 1.5 cups brown rice, broccoli & sweet potato', cal: '~700 cal' },
                        { time: 'Snack (3pm)', meal: 'Protein shake, peanut butter on rice cakes, banana', cal: '~400 cal' },
                        { time: 'Dinner (6:30pm)', meal: '250g steak or salmon, large potato, mixed salad w/ olive oil dressing', cal: '~750 cal' },
                        { time: 'Before Bed', meal: 'Cottage cheese or casein shake, small handful walnuts', cal: '~250 cal' }
                      ]
                    },
                    {
                      id: 'cut', name: 'Cut Mode 🔪', goal: 'Lose Fat & Get Lean', calories: '~1,600–1,900 cal/day',
                      color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50',
                      meals: [
                        { time: 'Breakfast (7am)', meal: '3 egg whites + 1 whole egg omelette w/ spinach & tomato, 1 slice wholegrain toast', cal: '~300 cal' },
                        { time: 'Snack (10am)', meal: 'Apple with 1 tbsp almond butter', cal: '~200 cal' },
                        { time: 'Lunch (12:30pm)', meal: '150g grilled chicken, large mixed salad, half cup quinoa, lemon vinaigrette', cal: '~450 cal' },
                        { time: 'Snack (3pm)', meal: 'Protein shake with water, small handful of berries', cal: '~200 cal' },
                        { time: 'Dinner (6:30pm)', meal: '180g white fish or turkey mince, steamed veggies, small sweet potato', cal: '~450 cal' },
                        { time: 'Evening (optional)', meal: 'Herbal tea, sugar-free jelly', cal: '~20 cal' }
                      ]
                    },
                    {
                      id: 'maintain', name: 'Maintain Mode ⚖️', goal: 'Stay Balanced & Healthy', calories: '~2,200–2,500 cal/day',
                      color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50',
                      meals: [
                        { time: 'Breakfast (7am)', meal: 'Overnight oats w/ protein powder, chia seeds, banana & honey', cal: '~500 cal' },
                        { time: 'Snack (10am)', meal: 'Trail mix (nuts, dried fruit, dark choc chips), small coffee', cal: '~250 cal' },
                        { time: 'Lunch (12:30pm)', meal: '180g chicken or tuna wrap w/ salad, hummus, and cheese', cal: '~550 cal' },
                        { time: 'Snack (3pm)', meal: 'Greek yoghurt w/ honey, handful of almonds', cal: '~250 cal' },
                        { time: 'Dinner (6:30pm)', meal: '200g lean protein (chicken/fish/beef), 1 cup rice or pasta, roasted veggies', cal: '~650 cal' },
                        { time: 'Evening', meal: 'Piece of fruit or small protein bar', cal: '~150 cal' }
                      ]
                    },
                    {
                      id: 'vegan', name: 'Plant-Based 🌱', goal: 'Vegan / Vegetarian Friendly', calories: '~2,000–2,400 cal/day',
                      color: 'from-lime-500 to-green-600', bgColor: 'bg-lime-50',
                      meals: [
                        { time: 'Breakfast (7am)', meal: 'Smoothie bowl: frozen acai, banana, spinach, plant protein, granola, coconut flakes', cal: '~500 cal' },
                        { time: 'Snack (10am)', meal: 'Hummus w/ carrot & celery sticks, rice cakes', cal: '~250 cal' },
                        { time: 'Lunch (12:30pm)', meal: 'Buddha bowl: chickpeas, quinoa, roasted sweet potato, avocado, tahini dressing', cal: '~600 cal' },
                        { time: 'Snack (3pm)', meal: 'Peanut butter banana toast on sourdough, plant milk latte', cal: '~300 cal' },
                        { time: 'Dinner (6:30pm)', meal: 'Tofu stir-fry w/ mixed veggies, brown rice, soy & sesame sauce', cal: '~550 cal' },
                        { time: 'Evening', meal: 'Dark chocolate squares, handful of mixed nuts', cal: '~200 cal' }
                      ]
                    },
                    {
                      id: 'highprotein', name: 'High Protein 🥩', goal: 'Max Protein Intake', calories: '~2,400–2,800 cal/day',
                      color: 'from-amber-500 to-yellow-600', bgColor: 'bg-amber-50',
                      meals: [
                        { time: 'Breakfast (7am)', meal: '4 eggs (any style), 100g smoked salmon, 1 slice toast, avocado', cal: '~600 cal' },
                        { time: 'Snack (10am)', meal: 'Protein shake (40g whey), beef jerky (50g)', cal: '~350 cal' },
                        { time: 'Lunch (12:30pm)', meal: '250g grilled chicken breast, 1 cup rice, steamed broccoli & green beans', cal: '~650 cal' },
                        { time: 'Snack (3pm)', meal: '200g cottage cheese, tuna & crackers', cal: '~300 cal' },
                        { time: 'Dinner (6:30pm)', meal: '250g lean beef mince bolognese w/ wholemeal pasta, side salad', cal: '~700 cal' },
                        { time: 'Before Bed', meal: 'Casein protein shake or 200g Greek yoghurt', cal: '~200 cal' }
                      ]
                    },
                    {
                      id: 'budget', name: 'Budget Friendly 💰', goal: 'Eat Well on a Budget', calories: '~2,000–2,400 cal/day',
                      color: 'from-teal-500 to-cyan-600', bgColor: 'bg-teal-50',
                      meals: [
                        { time: 'Breakfast (7am)', meal: 'Oats w/ banana, peanut butter & honey. 2 boiled eggs', cal: '~500 cal' },
                        { time: 'Snack (10am)', meal: 'Toast w/ vegemite, piece of fruit', cal: '~200 cal' },
                        { time: 'Lunch (12:30pm)', meal: 'Tuna & rice bowl, frozen mixed veggies, soy sauce', cal: '~500 cal' },
                        { time: 'Snack (3pm)', meal: 'Peanut butter sandwich on wholemeal, glass of milk', cal: '~350 cal' },
                        { time: 'Dinner (6:30pm)', meal: 'Chicken thigh bake w/ potato, onion, frozen veggies & gravy', cal: '~600 cal' },
                        { time: 'Evening', meal: 'Bowl of cereal w/ milk', cal: '~200 cal' }
                      ]
                    }
                  ].map((plan) => (
                    <div key={plan.id} className={`rounded-2xl border overflow-hidden transition-all ${expandedDietPlan === plan.id ? 'shadow-md' : ''}`}>
                      <button
                        onClick={() => setExpandedDietPlan(expandedDietPlan === plan.id ? null : plan.id)}
                        className={`w-full p-4 flex items-center justify-between ${plan.bgColor} hover:brightness-95 transition-all`}
                      >
                        <div className="text-left">
                          <div className="font-semibold text-gray-800 text-lg">{plan.name}</div>
                          <div className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>{plan.goal} — {plan.calories}</div>
                        </div>
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center text-white text-sm font-bold transition-transform ${expandedDietPlan === plan.id ? 'rotate-180' : ''}`}>
                          ▼
                        </div>
                      </button>
                      {expandedDietPlan === plan.id && (
                        <div className="bg-white p-4 space-y-3 border-t">
                          {plan.meals.map((meal, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-gray-500 uppercase">{meal.time}</span>
                                  <span className="text-xs font-medium text-orange-500">{meal.cal}</span>
                                </div>
                                <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>{meal.meal}</p>
                              </div>
                            </div>
                          ))}
                          <div className={`mt-3 p-3 rounded-xl bg-gradient-to-r ${plan.color} text-white text-center text-sm font-medium`}>
                            Total: {plan.calories}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* My Diets Tab */}
          {dietSubTab === 'custom' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">My Custom Diets</h2>
                    <p className="text-sm text-gray-500 mt-1">Build your own meal plans</p>
                  </div>
                  <button
                    onClick={() => {
                      const newDiet = {
                        id: Date.now(),
                        name: '',
                        goal: '',
                        meals: [{ id: Date.now(), time: 'Breakfast', meal: '', calories: '' }]
                      };
                      setCustomDiets(prev => [...prev, newDiet]);
                      setExpandedCustomDiet(newDiet.id);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                  >
                    + New Diet
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {customDiets.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-3">🍽️</div>
                      <p className="font-medium">No custom diets yet</p>
                      <p className="text-sm mt-1">Tap "+ New Diet" to create your first meal plan</p>
                    </div>
                  )}
                  {customDiets.map((diet) => (
                    <div key={diet.id} className={`rounded-2xl border overflow-hidden transition-all ${expandedCustomDiet === diet.id ? 'shadow-md ring-2 ring-pink-200' : ''}`}>
                      <button
                        onClick={() => setExpandedCustomDiet(expandedCustomDiet === diet.id ? null : diet.id)}
                        className="w-full p-4 flex items-center justify-between bg-pink-50 hover:brightness-95 transition-all"
                      >
                        <div className="text-left">
                          <div className="font-semibold text-gray-800 text-lg">{diet.name || 'Untitled Diet'}</div>
                          <div className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>{diet.goal || 'No goal set'} — {diet.meals.length} meal{diet.meals.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-sm font-bold transition-transform ${expandedCustomDiet === diet.id ? 'rotate-180' : ''}`}>
                          ▼
                        </div>
                      </button>
                      {expandedCustomDiet === diet.id && (
                        <div className="bg-white p-4 space-y-4 border-t">
                          {/* Diet Name & Goal */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Diet Name</label>
                              <input
                                type="text"
                                value={diet.name}
                                onChange={(e) => setCustomDiets(prev => prev.map(d => d.id === diet.id ? { ...d, name: e.target.value } : d))}
                                placeholder="e.g. My Bulk Plan"
                                className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Goal</label>
                              <input
                                type="text"
                                value={diet.goal}
                                onChange={(e) => setCustomDiets(prev => prev.map(d => d.id === diet.id ? { ...d, goal: e.target.value } : d))}
                                placeholder="e.g. Gain muscle, lose fat"
                                className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-pink-500"
                              />
                            </div>
                          </div>

                          {/* Meals */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-gray-500 uppercase">Meals</label>
                              <button
                                onClick={() => {
                                  const newMeal = { id: Date.now(), time: '', meal: '', calories: '' };
                                  setCustomDiets(prev => prev.map(d => d.id === diet.id ? { ...d, meals: [...d.meals, newMeal] } : d));
                                }}
                                className="text-xs font-medium text-pink-500 hover:text-pink-700"
                              >
                                + Add Meal
                              </button>
                            </div>
                            {diet.meals.map((meal, mIdx) => (
                              <div key={meal.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400 font-medium">Meal {mIdx + 1}</span>
                                  {diet.meals.length > 1 && (
                                    <button
                                      onClick={() => setCustomDiets(prev => prev.map(d => d.id === diet.id ? { ...d, meals: d.meals.filter(m => m.id !== meal.id) } : d))}
                                      className="text-xs text-red-400 hover:text-red-600"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={meal.time}
                                    onChange={(e) => setCustomDiets(prev => prev.map(d => d.id === diet.id ? { ...d, meals: d.meals.map(m => m.id === meal.id ? { ...m, time: e.target.value } : m) } : d))}
                                    placeholder="Time (e.g. 7am)"
                                    className="px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-pink-500"
                                  />
                                  <input
                                    type="text"
                                    value={meal.meal}
                                    onChange={(e) => setCustomDiets(prev => prev.map(d => d.id === diet.id ? { ...d, meals: d.meals.map(m => m.id === meal.id ? { ...m, meal: e.target.value } : m) } : d))}
                                    placeholder="What to eat..."
                                    className="px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-pink-500"
                                  />
                                </div>
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                  <div>
                                    <label className="text-[10px] text-gray-400 font-medium">Calories</label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={meal.calories}
                                      onChange={(e) => setCustomDiets(prev => prev.map(d => d.id === diet.id ? { ...d, meals: d.meals.map(m => m.id === meal.id ? { ...m, calories: e.target.value } : m) } : d))}
                                      placeholder="kcal"
                                      className="w-full px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-pink-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-blue-400 font-medium">Protein</label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={meal.protein || ''}
                                      onChange={(e) => setCustomDiets(prev => prev.map(d => d.id === diet.id ? { ...d, meals: d.meals.map(m => m.id === meal.id ? { ...m, protein: e.target.value } : m) } : d))}
                                      placeholder="g"
                                      className="w-full px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-amber-500 font-medium">Carbs</label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={meal.carbs || ''}
                                      onChange={(e) => setCustomDiets(prev => prev.map(d => d.id === diet.id ? { ...d, meals: d.meals.map(m => m.id === meal.id ? { ...m, carbs: e.target.value } : m) } : d))}
                                      placeholder="g"
                                      className="w-full px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-amber-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-green-500 font-medium">Fats</label>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={meal.fats || ''}
                                      onChange={(e) => setCustomDiets(prev => prev.map(d => d.id === diet.id ? { ...d, meals: d.meals.map(m => m.id === meal.id ? { ...m, fats: e.target.value } : m) } : d))}
                                      placeholder="g"
                                      className="w-full px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-green-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Total Macros */}
                          {diet.meals.some(m => m.calories || m.protein || m.carbs || m.fats) && (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white">
                              <div className="text-center text-sm font-semibold mb-2">Daily Totals</div>
                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                  <div className="text-lg font-bold">{diet.meals.reduce((sum, m) => sum + (parseInt(m.calories) || 0), 0).toLocaleString()}</div>
                                  <div className="text-[10px] text-white/70">Calories</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold">{diet.meals.reduce((sum, m) => sum + (parseInt(m.protein) || 0), 0)}g</div>
                                  <div className="text-[10px] text-white/70">Protein</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold">{diet.meals.reduce((sum, m) => sum + (parseInt(m.carbs) || 0), 0)}g</div>
                                  <div className="text-[10px] text-white/70">Carbs</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold">{diet.meals.reduce((sum, m) => sum + (parseInt(m.fats) || 0), 0)}g</div>
                                  <div className="text-[10px] text-white/70">Fats</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Delete Diet */}
                          <button
                            onClick={() => {
                              if (confirm('Delete this diet plan?')) {
                                setCustomDiets(prev => prev.filter(d => d.id !== diet.id));
                                setExpandedCustomDiet(null);
                              }
                            }}
                            className="w-full py-2 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            Delete this diet
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  // GYM MANAGEMENT VIEW
  if (activeView === 'gymworkout') {
    if (!isElite) return <LockedFeature featureName="Gym" setActiveView={setActiveView} />;
    const today = new Date().toISOString().split('T')[0];
    const getWeekDays = () => { const now=new Date(),dow=now.getDay(),mon=new Date(now); mon.setDate(now.getDate()-(dow===0?6:dow-1)); const days=[]; for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);days.push({date:d.toISOString().split('T')[0],dayName:d.toLocaleDateString('en-AU',{weekday:'long'}),dayShort:d.toLocaleDateString('en-AU',{weekday:'short'}),dateNum:d.getDate(),isToday:d.toISOString().split('T')[0]===today});} return days; };
    const weekDays = getWeekDays();
    const updateGymData = (date, field, value) => { setSleepData(prev => ({...prev, [date]: {...(prev[date]||{}), [field]: value}})); };
    const stepsGoal = sleepData?.stepsGoal || 10000;

    return (
      <div className="min-h-screen bg-transparent pb-24">
        <Sidebar /><SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-5xl mx-auto">
            <button onClick={() => setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px"}}>← Back</button>
            <h1 className="text-4xl font-semibold text-white" style={{textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Gym</h1>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          <div className="flex gap-2">
            <button onClick={() => setGymTab('steps')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${gymTab==='steps'?'cyber-tab-active':'text-slate-400 hover:text-slate-200'}`}>👟 Weekly Steps</button>
            <button onClick={() => setGymTab('plan')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${gymTab==='plan'?'cyber-tab-active':'text-slate-400 hover:text-slate-200'}`}>💪 Workout Plan</button>
          </div>

          {gymTab === 'steps' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
                <h2 className="text-lg font-semibold text-white mb-2">👟 Weekly Steps & Workouts</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">Goal:</span>
                  <input type="number" defaultValue={stepsGoal}
                    onChange={(e) => setSleepData(prev => ({...prev, stepsGoal: parseInt(e.target.value)||10000}))}
                    className="w-28 px-3 py-2 rounded-xl text-white focus:outline-none text-sm"
                    style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.2)"}} />
                  <span className="text-sm text-slate-400">steps per day</span>
                </div>
              </div>
              {weekDays.map(day => {
                const data = sleepData?.[day.date] || {};
                const steps = data.steps || 0;
                const pct = Math.min((steps / stepsGoal) * 100, 100);
                return (
                  <div key={day.date} className="rounded-2xl p-4" style={{background:"rgba(5,15,30,0.8)",border:`1px solid ${day.isToday?'rgba(0,200,255,0.3)':'rgba(0,200,255,0.1)'}`}}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{background:day.isToday?'rgba(0,200,255,0.2)':'rgba(255,255,255,0.05)'}}>{day.dayShort}</div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{day.dayName} {day.isToday && <span className="text-xs ml-1" style={{color:'#00c8ff'}}>• Today</span>}</div>
                        <div className="h-2 rounded-full mt-1" style={{background:'rgba(255,255,255,0.05)'}}>
                          <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:'linear-gradient(90deg,#00c8ff,#0070a0)'}} />
                        </div>
                        <div className="text-xs mt-0.5" style={{color:'rgba(148,163,184,0.5)'}}>{pct.toFixed(0)}%</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <input type="number" value={steps||''} placeholder="0"
                          onChange={(e) => updateGymData(day.date, 'steps', parseInt(e.target.value)||0)}
                          className="w-20 px-2 py-2 rounded-xl text-white text-sm text-right focus:outline-none"
                          style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.2)"}} />
                        <span className="text-xs text-slate-500">/ {(stepsGoal/1000).toFixed(0)}K</span>
                      </div>
                    </div>
                    <input type="text" value={data.workoutNotes||''} placeholder="Workout notes (e.g., Chest & Triceps, 30 min cardio...)"
                      onChange={(e) => updateGymData(day.date, 'workoutNotes', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
                      style={{background:"rgba(0,200,255,0.04)",border:"1px solid rgba(0,200,255,0.1)"}} />
                  </div>
                );
              })}
            </div>
          )}

          {gymTab === 'plan' && (
            <div className="space-y-6">
              {[1,2,3,4].map(week => (
                <div key={week} className="rounded-2xl overflow-hidden" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
                  <div className="p-4" style={{background:"rgba(139,92,246,0.12)",borderBottom:"1px solid rgba(139,92,246,0.25)"}}>
                    <input type="text" value={workoutPlan.weeks?.[week]?.name||''} onChange={(e) => setWorkoutPlan(prev => ({...prev, weeks:{...(prev.weeks||{}), [week]:{...(prev.weeks?.[week]||{}), name:e.target.value}}}))}
                      placeholder={`Week ${week} — Training Focus`}
                      className="w-full bg-transparent text-white text-lg font-semibold placeholder-white/50 focus:outline-none" />
                  </div>
                  <div className="p-4 space-y-3">
                    {(workoutPlan.weeks?.[week]?.exercises||[]).map(ex => (
                      <div key={ex.id} className="flex items-center gap-2">
                        <input type="text" value={ex.amount} onChange={(e) => setWorkoutPlan(prev => ({...prev, weeks:{...prev.weeks, [week]:{...prev.weeks[week], exercises:prev.weeks[week].exercises.map(e2 => e2.id===ex.id?{...e2,amount:e.target.value}:e2)}}}))}
                          placeholder="x3" className="w-14 px-2 py-2 rounded-xl text-sm text-white text-center focus:outline-none"
                          style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.15)"}} />
                        <input type="text" value={ex.name} onChange={(e) => setWorkoutPlan(prev => ({...prev, weeks:{...prev.weeks, [week]:{...prev.weeks[week], exercises:prev.weeks[week].exercises.map(e2 => e2.id===ex.id?{...e2,name:e.target.value}:e2)}}}))}
                          placeholder="Exercise" className="flex-1 px-3 py-2 rounded-xl text-sm text-white focus:outline-none"
                          style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.15)"}} />
                        <button onClick={() => setWorkoutPlan(prev => ({...prev, weeks:{...prev.weeks, [week]:{...prev.weeks[week], exercises:prev.weeks[week].exercises.filter(e2 => e2.id!==ex.id)}}}))}
                          className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => setWorkoutPlan(prev => ({...prev, weeks:{...prev.weeks, [week]:{...prev.weeks[week]||{}, exercises:[...(prev.weeks?.[week]?.exercises||[]), {id:Date.now(),amount:'',name:'',details:''}]}}}))}
                      className="w-full py-2 rounded-xl text-sm transition-all" style={{border:"1px dashed rgba(0,200,255,0.2)",color:"rgba(0,200,255,0.5)"}}>
                      + Add Exercise
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeView === 'gym') {
    if (!isElite) return <LockedFeature featureName="Health" setActiveView={setActiveView} />;
    const today = new Date().toISOString().split('T')[0];

    // Get all days of the current week (Monday to Sunday)
    const getWeekDays = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        days.push({
          date: day.toISOString().split('T')[0],
          dayName: day.toLocaleDateString('en-AU', { weekday: 'long' }),
          dayShort: day.toLocaleDateString('en-AU', { weekday: 'short' }),
          dateNum: day.getDate(),
          month: day.toLocaleDateString('en-AU', { month: 'short' }),
          isToday: day.toISOString().split('T')[0] === today
        });
      }
      return days;
    };

    const weekDays = getWeekDays();

    const updateGymData = (date, field, value) => {
      setDailySteps(prev => ({
        ...prev,
        [date]: {
          ...(prev[date] || { steps: 0, notes: '' }),
          [field]: value
        }
      }));
    };

    const addWeekExercise = (week) => {
      setWorkoutPlan(prev => ({
        ...prev,
        weeks: {
          ...prev.weeks,
          [week]: {
            ...prev.weeks[week],
            exercises: [...(prev.weeks[week]?.exercises || []), { id: Date.now(), amount: 'x1', name: '', details: '' }]
          }
        }
      }));
    };

    const updateWeekExercise = (week, id, field, value) => {
      setWorkoutPlan(prev => ({
        ...prev,
        weeks: {
          ...prev.weeks,
          [week]: {
            ...prev.weeks[week],
            exercises: (prev.weeks[week]?.exercises || []).map(ex => 
              ex.id === id ? { ...ex, [field]: value } : ex
            )
          }
        }
      }));
    };

    const deleteWeekExercise = (week, id) => {
      setWorkoutPlan(prev => ({
        ...prev,
        weeks: {
          ...prev.weeks,
          [week]: {
            ...prev.weeks[week],
            exercises: (prev.weeks[week]?.exercises || []).filter(ex => ex.id !== id)
          }
        }
      }));
    };

    const updateWeekInfo = (week, field, value) => {
      setWorkoutPlan(prev => ({
        ...prev,
        weeks: {
          ...prev.weeks,
          [week]: {
            ...prev.weeks[week],
            [field]: value
          }
        }
      }));
    };

    return (
      <div className="min-h-screen bg-transparent">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px",letterSpacing:"0.5px"}}>← Back</button>
                <h1 className="text-4xl font-semibold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Health Management</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setGymSubTab('sleep')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                gymSubTab === 'sleep'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              🌙 Sleep
            </button>
            <button
              onClick={() => setGymSubTab('mental')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                gymSubTab === 'mental'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              🧠 Mental Health
            </button>

            <button
              onClick={() => setGymSubTab('journal')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                gymSubTab === 'journal'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              📓 Journal
            </button>
          </div>

          {/* Sleep Tracker Tab */}
          {gymSubTab === 'sleep' && (
            <div className="space-y-4">
              {/* Sleep Stats Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">🌙 Sleep Tracker</h2>
                    <p className="text-indigo-100 mt-1">Track your sleep patterns</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Reset all sleep data for this week?')) {
                        const newSleepData = { ...sleepData };
                        weekDays.forEach(day => {
                          delete newSleepData[day.date];
                        });
                        setSleepData(newSleepData);
                      }
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all"
                  >
                    Reset Week
                  </button>
                </div>
                {/* Weekly Summary */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">
                      {(() => {
                        const weekSleep = weekDays.map(d => sleepData[d.date]?.hoursSlept || 0).filter(h => h > 0);
                        return weekSleep.length > 0 ? (weekSleep.reduce((a,b) => a+b, 0) / weekSleep.length).toFixed(1) : '-';
                      })()}
                    </div>
                    <div className="text-xs text-indigo-200">Avg Hours</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">
                      {weekDays.filter(d => sleepData[d.date]?.bedTime && sleepData[d.date]?.wakeTime).length}
                    </div>
                    <div className="text-xs text-indigo-200">Days Tracked</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">
                      {(() => {
                        const dreams = weekDays.filter(d => sleepData[d.date]?.dreamType === 'dream').length;
                        const nightmares = weekDays.filter(d => sleepData[d.date]?.dreamType === 'nightmare').length;
                        return `${dreams}/${nightmares}`;
                      })()}
                    </div>
                    <div className="text-xs text-indigo-200">Dreams/Nightmares</div>
                  </div>
                </div>
              </div>

              {/* Daily Sleep Cards */}
              {weekDays.map(day => {
                const dayData = sleepData[day.date] || {};
                
                // Calculate hours slept
                const calculateHours = (bed, wake) => {
                  if (!bed || !wake) return 0;
                  const [bedH, bedM] = bed.split(':').map(Number);
                  const [wakeH, wakeM] = wake.split(':').map(Number);
                  let bedMins = bedH * 60 + bedM;
                  let wakeMins = wakeH * 60 + wakeM;
                  if (wakeMins < bedMins) wakeMins += 24 * 60; // crossed midnight
                  return ((wakeMins - bedMins) / 60).toFixed(1);
                };
                
                const hoursSlept = calculateHours(dayData.bedTime, dayData.wakeTime);
                
                return (
                  <div 
                    key={day.date} 
                    className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${
                      day.isToday ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-100'
                    }`}
                  >
                    {/* Day Header */}
                    <div className={`px-4 py-3 flex items-center justify-between ${
                      day.isToday ? 'bg-indigo-50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-gray-800 text-lg">{day.dayName}</div>
                        {day.isToday && (
                          <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">Today</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hoursSlept > 0 && (
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            hoursSlept >= 7 ? 'bg-green-100 text-green-700' :
                            hoursSlept >= 5 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {hoursSlept}h
                          </div>
                        )}
                        <button
                          onClick={() => {
                            const newSleepData = { ...sleepData };
                            delete newSleepData[day.date];
                            setSleepData(newSleepData);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Clear day"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Sleep Details */}
                    <div className="p-4 space-y-4">
                      {/* Time Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1 block">🛏️ Bedtime</label>
                          <input
                            type="time"
                            value={dayData.bedTime || ''}
                            onChange={(e) => {
                              const newHours = calculateHours(e.target.value, dayData.wakeTime);
                              setSleepData(prev => ({
                                ...prev,
                                [day.date]: { ...prev[day.date], bedTime: e.target.value, hoursSlept: parseFloat(newHours) }
                              }));
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-center font-medium focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1 block">☀️ Wake Time</label>
                          <input
                            type="time"
                            value={dayData.wakeTime || ''}
                            onChange={(e) => {
                              const newHours = calculateHours(dayData.bedTime, e.target.value);
                              setSleepData(prev => ({
                                ...prev,
                                [day.date]: { ...prev[day.date], wakeTime: e.target.value, hoursSlept: parseFloat(newHours) }
                              }));
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-center font-medium focus:outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                      
                      {/* Night Wakings & Quality Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1 block">😴 Night Wakings</label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSleepData(prev => ({
                                ...prev,
                                [day.date]: { ...prev[day.date], nightWakings: Math.max(0, (prev[day.date]?.nightWakings || 0) - 1) }
                              }))}
                              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg"
                            >
                              -
                            </button>
                            <div className="flex-1 text-center font-bold text-xl">
                              {dayData.nightWakings || 0}
                            </div>
                            <button
                              onClick={() => setSleepData(prev => ({
                                ...prev,
                                [day.date]: { ...prev[day.date], nightWakings: (prev[day.date]?.nightWakings || 0) + 1 }
                              }))}
                              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Dream Type Row */}
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-2 block">💭 Dreams</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSleepData(prev => ({
                              ...prev,
                              [day.date]: { ...prev[day.date], dreamType: prev[day.date]?.dreamType === 'nothing' ? '' : 'nothing' }
                            }))}
                            className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                              dayData.dreamType === 'nothing'
                                ? 'bg-gray-200 text-gray-700 border-2 border-gray-400'
                                : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                            }`}
                          >
                            😶 Nothing
                          </button>
                          <button
                            onClick={() => setSleepData(prev => ({
                              ...prev,
                              [day.date]: { ...prev[day.date], dreamType: prev[day.date]?.dreamType === 'dream' ? '' : 'dream' }
                            }))}
                            className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                              dayData.dreamType === 'dream'
                                ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                                : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                            }`}
                          >
                            ✨ Dream
                          </button>
                          <button
                            onClick={() => setSleepData(prev => ({
                              ...prev,
                              [day.date]: { ...prev[day.date], dreamType: prev[day.date]?.dreamType === 'nightmare' ? '' : 'nightmare' }
                            }))}
                            className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                              dayData.dreamType === 'nightmare'
                                ? 'bg-red-100 text-red-700 border-2 border-red-400'
                                : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                            }`}
                          >
                            👻 Nightmare
                          </button>
                        </div>
                      </div>
                      
                      {/* Notes */}
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">📝 Notes</label>
                        <input
                          type="text"
                          value={dayData.notes || ''}
                          onChange={(e) => setSleepData(prev => ({
                            ...prev,
                            [day.date]: { ...prev[day.date], notes: e.target.value }
                          }))}
                          placeholder="How did you sleep? Any thoughts..."
                          className="w-full px-3 py-2 border-2 rounded-xl focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mental Health Tab */}
          {gymSubTab === 'mental' && (
            <div className="space-y-4">
              {/* Mental Health Header */}
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">🧠 Mental Health</h2>
                    <p className="text-pink-100 mt-1">Track your mood & wellbeing</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Reset all mental health data for this week?')) {
                        const newData = { ...mentalHealthData };
                        weekDays.forEach(day => {
                          delete newData[day.date];
                        });
                        setMentalHealthData(newData);
                      }
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all"
                  >
                    Reset Week
                  </button>
                </div>
                {/* Weekly Summary */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">
                      {weekDays.filter(d => mentalHealthData[d.date]?.mood).length}
                    </div>
                    <div className="text-xs text-pink-200">Days Logged</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">
                      {(() => {
                        const moods = weekDays.map(d => mentalHealthData[d.date]?.energy).filter(e => e);
                        return moods.length > 0 ? (moods.reduce((a,b) => a+b, 0) / moods.length).toFixed(1) : '-';
                      })()}
                    </div>
                    <div className="text-xs text-pink-200">Avg Energy</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">
                      {(() => {
                        const stress = weekDays.map(d => mentalHealthData[d.date]?.stress).filter(s => s);
                        return stress.length > 0 ? (stress.reduce((a,b) => a+b, 0) / stress.length).toFixed(1) : '-';
                      })()}
                    </div>
                    <div className="text-xs text-pink-200">Avg Stress</div>
                  </div>
                </div>
              </div>

              {/* Daily Mental Health Cards */}
              {weekDays.map(day => {
                const dayData = mentalHealthData[day.date] || {};
                const moods = [
                  { emoji: '😊', label: 'Great', value: 'great' },
                  { emoji: '😌', label: 'Good', value: 'good' },
                  { emoji: '😐', label: 'Okay', value: 'okay' },
                  { emoji: '😔', label: 'Low', value: 'low' },
                  { emoji: '😢', label: 'Sad', value: 'sad' },
                  { emoji: '😡', label: 'Angry', value: 'angry' }
                ];
                
                return (
                  <div 
                    key={day.date} 
                    className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${
                      day.isToday ? 'border-pink-400 ring-2 ring-pink-100' : 'border-gray-100'
                    }`}
                  >
                    {/* Day Header */}
                    <div className={`px-4 py-3 flex items-center justify-between ${
                      day.isToday ? 'bg-pink-50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-gray-800 text-lg">{day.dayName}</div>
                        {day.isToday && (
                          <span className="px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">Today</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {dayData.mood && (
                          <span className="text-2xl">{moods.find(m => m.value === dayData.mood)?.emoji}</span>
                        )}
                        <button
                          onClick={() => {
                            const newData = { ...mentalHealthData };
                            delete newData[day.date];
                            setMentalHealthData(newData);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Clear day"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Mental Health Details */}
                    <div className="p-4 space-y-4">
                      {/* Mood Selection */}
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-2 block">How are you feeling?</label>
                        <div className="flex gap-2 flex-wrap">
                          {moods.map(mood => (
                            <button
                              key={mood.value}
                              onClick={() => setMentalHealthData(prev => ({
                                ...prev,
                                [day.date]: { ...prev[day.date], mood: prev[day.date]?.mood === mood.value ? '' : mood.value }
                              }))}
                              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                                dayData.mood === mood.value
                                  ? 'bg-pink-100 border-2 border-pink-400 scale-105'
                                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                              }`}
                            >
                              <span className="text-2xl">{mood.emoji}</span>
                              <span className="text-xs text-gray-600 mt-1">{mood.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Energy & Stress Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-2 block">⚡ Energy Level</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(level => (
                              <button
                                key={level}
                                onClick={() => setMentalHealthData(prev => ({
                                  ...prev,
                                  [day.date]: { ...prev[day.date], energy: prev[day.date]?.energy === level ? 0 : level }
                                }))}
                                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                                  dayData.energy >= level
                                    ? 'bg-yellow-400 text-yellow-900'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Low</span>
                            <span>High</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-2 block">😰 Stress Level</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(level => (
                              <button
                                key={level}
                                onClick={() => setMentalHealthData(prev => ({
                                  ...prev,
                                  [day.date]: { ...prev[day.date], stress: prev[day.date]?.stress === level ? 0 : level }
                                }))}
                                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                                  dayData.stress >= level
                                    ? level <= 2 ? 'bg-green-400 text-green-900' :
                                      level <= 3 ? 'bg-yellow-400 text-yellow-900' :
                                      'bg-red-400 text-red-900'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Calm</span>
                            <span>Stressed</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Journal Entry */}
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">📝 Journal / Thoughts</label>
                        <textarea
                          value={dayData.journal || ''}
                          onChange={(e) => setMentalHealthData(prev => ({
                            ...prev,
                            [day.date]: { ...prev[day.date], journal: e.target.value }
                          }))}
                          placeholder="How was your day? What's on your mind..."
                          className="w-full px-3 py-2 border-2 rounded-xl focus:outline-none focus:border-pink-400 resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}


          {/* Journal Tab */}
          {gymSubTab === 'journal' && (() => {
            const today = new Date().toISOString().split('T')[0];
            const entry = journalEntries[journalDate] || { text: '', mood: '', gratitude: '' };
            const prompts = [
              "What's one thing you're grateful for today?",
              "What did you accomplish today that you're proud of?",
              "What's been on your mind lately?",
              "What's one goal you're working towards right now?",
              "Describe your perfect day — what would it look like?",
              "What's something you learned recently?",
              "What's one small win from today?",
              "If you could change one thing about today, what would it be?",
              "What are you looking forward to this week?",
              "How are you feeling right now, and why?",
            ];
            const todayPrompt = prompts[Math.floor(new Date(journalDate).getTime() / 86400000) % prompts.length];
            const moods = ['😊', '😌', '😐', '😔', '😤', '🤩', '😴', '🥲'];
            const updateEntry = (field, value) => {
              setJournalEntries(prev => ({ ...prev, [journalDate]: { ...prev[journalDate], [field]: value } }));
            };
            const entriesCount = Object.keys(journalEntries).filter(k => journalEntries[k]?.text).length;
            return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold mb-1">📓 Daily Journal</h2>
                  <p className="text-purple-200 text-sm">{entriesCount} {entriesCount === 1 ? 'entry' : 'entries'} written</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { const d = new Date(journalDate); d.setDate(d.getDate() - 1); setJournalDate(d.toISOString().split('T')[0]); }} className="px-3 py-2 bg-white rounded-xl border shadow-sm hover:bg-gray-50">←</button>
                  <input type="date" value={journalDate} onChange={(e) => setJournalDate(e.target.value)} className="flex-1 px-4 py-2 bg-white rounded-xl border shadow-sm text-center font-medium" />
                  <button onClick={() => { const d = new Date(journalDate); d.setDate(d.getDate() + 1); setJournalDate(d.toISOString().split('T')[0]); }} className="px-3 py-2 bg-white rounded-xl border shadow-sm hover:bg-gray-50">→</button>
                </div>
                <div className="bg-white rounded-2xl p-4 border shadow-sm">
                  <h3 className="font-semibold text-white mb-3">How are you feeling?</h3>
                  <div className="flex gap-2 flex-wrap">
                    {moods.map(m => (
                      <button key={m} onClick={() => updateEntry('mood', m)} className={`text-3xl p-2 rounded-xl transition-all ${entry.mood === m ? 'bg-purple-100 scale-110 ring-2 ring-purple-400' : 'hover:bg-gray-100'}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 text-white">
                  <p className="text-sm text-purple-200 mb-1">Today's Prompt</p>
                  <p className="font-medium">{todayPrompt}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border shadow-sm">
                  <h3 className="font-semibold text-white mb-3">📝 Journal Entry</h3>
                  <textarea value={entry.text || ''} onChange={(e) => updateEntry('text', e.target.value)} onFocus={handleTextareaFocus} placeholder="Write your thoughts..." rows={8} className="w-full p-3 border-2 rounded-xl text-sm focus:outline-none focus:border-purple-500 resize-none transition-colors" />
                </div>
                <div className="bg-white rounded-2xl p-4 border shadow-sm">
                  <h3 className="font-semibold text-white mb-3">🙏 Gratitude</h3>
                  <textarea value={entry.gratitude || ''} onChange={(e) => updateEntry('gratitude', e.target.value)} onFocus={handleTextareaFocus} placeholder="What are you grateful for today?" rows={3} className="w-full p-3 border-2 rounded-xl text-sm focus:outline-none focus:border-purple-500 resize-none transition-colors" />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  const customCat = customCategories.find(c => c.id === activeView);
  if (customCat) {
    const catIndex = customCategories.findIndex(c => c.id === activeView);
    
    // Gate custom categories 2 & 3 for free users
    if (!isElite && catIndex > 0) return <LockedFeature featureName="Additional Custom Categories" setActiveView={setActiveView} />;
    
    // Update category helper
    const updateCategory = (updates) => {
      setCustomCategories(prev => prev.map((c, i) => i === catIndex ? { ...c, ...updates } : c));
    };
    
    // Get current sub-tab
    const currentSubTab = (customCat.subTabs || []).find(t => t.id === customCat.activeSubTab) || customCat.subTabs?.[0];
    const currentSections = currentSubTab?.sections || [];
    
    // Add sub-tab
    const addSubTab = () => {
      const newTab = { id: Date.now().toString(), name: 'New Tab', sections: [] };
      updateCategory({ 
        subTabs: [...(customCat.subTabs || []), newTab],
        activeSubTab: newTab.id 
      });
    };
    
    // Delete sub-tab
    const deleteSubTab = (tabId) => {
      const newTabs = (customCat.subTabs || []).filter(t => t.id !== tabId);
      if (newTabs.length === 0) {
        newTabs.push({ id: 'default', name: 'Main', sections: [] });
      }
      updateCategory({ 
        subTabs: newTabs,
        activeSubTab: customCat.activeSubTab === tabId ? newTabs[0].id : customCat.activeSubTab
      });
    };
    
    // Rename sub-tab
    const renameSubTab = (tabId, newName) => {
      updateCategory({
        subTabs: (customCat.subTabs || []).map(t => t.id === tabId ? { ...t, name: newName } : t)
      });
    };
    
    // Section helpers - now works on current sub-tab
    const addSection = (type) => {
      const defaultContent = {
        notes: '',
        checklist: [],
        calendar: { events: [] },
        chart: { type: 'bar', data: [], labels: [] },
        tasks: [],
        goals: [],
        counter: { value: 0, step: 1 },
        links: [],
        timeline: [],
        kanban: { columns: [{ id: 'todo', name: 'To Do', items: [] }, { id: 'doing', name: 'In Progress', items: [] }, { id: 'done', name: 'Done', items: [] }] },
        cards: [],
        rating: { items: [] },
      }[type];
      
      const newSection = {
        id: Date.now(),
        type,
        title: '',
        content: defaultContent,
        collapsed: false,
        visible: true,
      };
      
      updateCategory({
        subTabs: (customCat.subTabs || []).map(t => 
          t.id === customCat.activeSubTab 
            ? { ...t, sections: [...(t.sections || []), newSection] }
            : t
        )
      });
    };
    
    const updateSection = (sectionId, updates) => {
      updateCategory({
        subTabs: (customCat.subTabs || []).map(t => 
          t.id === customCat.activeSubTab 
            ? { ...t, sections: (t.sections || []).map(s => s.id === sectionId ? { ...s, ...updates } : s) }
            : t
        )
      });
    };
    
    const deleteSection = (sectionId) => {
      updateCategory({
        subTabs: (customCat.subTabs || []).map(t => 
          t.id === customCat.activeSubTab 
            ? { ...t, sections: (t.sections || []).filter(s => s.id !== sectionId) }
            : t
        )
      });
    };
    
    const moveSection = (fromIndex, toIndex) => {
      const newSections = [...currentSections];
      const [moved] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, moved);
      updateCategory({
        subTabs: (customCat.subTabs || []).map(t => 
          t.id === customCat.activeSubTab 
            ? { ...t, sections: newSections }
            : t
        )
      });
    };
    
    // Colors
    const colors = [
      { name: 'purple', gradient: 'from-purple-500 to-indigo-600' },
      { name: 'teal', gradient: 'from-teal-500 to-cyan-600' },
      { name: 'rose', gradient: 'from-rose-500 to-pink-600' },
      { name: 'amber', gradient: 'from-amber-500 to-orange-600' },
      { name: 'emerald', gradient: 'from-emerald-500 to-green-600' },
      { name: 'blue', gradient: 'from-blue-500 to-indigo-600' },
      { name: 'red', gradient: 'from-red-500 to-rose-600' },
    ];
    
    const getGradient = () => colors.find(c => c.name === customCat.color)?.gradient || 'from-purple-500 to-indigo-600';
    
    // Section types
    const sectionTypes = [
      { type: 'notes', label: '📝 Notes', color: 'from-amber-500 to-orange-500' },
      { type: 'tasks', label: '📋 Tasks', color: 'from-violet-500 to-purple-500' },
      { type: 'calendar', label: '📅 Calendar', color: 'from-pink-500 to-rose-500' },
      { type: 'cards', label: '🃏 Cards', color: 'from-purple-500 to-indigo-500' },
    ];
    
    const getSectionGradient = (type) => sectionTypes.find(s => s.type === type)?.color || 'from-gray-500 to-gray-600';
    
    // Show save feedback
    const showSaveFeedback = () => {
      setSavingFeedback(true);
      setTimeout(() => setSavingFeedback(false), 1500);
    };
    
    return (
      <div className="min-h-screen bg-transparent">
        <Sidebar />
        <SaveIndicator />
        
        {/* Header */}
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-6xl mx-auto">
            <div>
              <button onClick={() => setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px",letterSpacing:"0.5px"}}>← Back</button>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={customCat.name}
                  onChange={(e) => updateCategory({ name: e.target.value })}
                  placeholder="Name this category..."
                  className="text-4xl font-bold focus:outline-none flex-1 text-white w-full px-4 py-2 rounded-xl"
                  style={{background:"transparent",border:"1px solid rgba(0,200,255,0.3)",color:"white",outline:"none"}}
                />
              </div>
              
              {/* Sub-Tabs */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {(customCat.subTabs || []).map(tab => (
                  <div key={tab.id} className="relative group">
                    <button
                      onClick={() => updateCategory({ activeSubTab: tab.id })}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
                      style={customCat.activeSubTab === tab.id ? {background:'rgba(0,200,255,0.15)',border:'1px solid rgba(0,200,255,0.4)',color:'#00c8ff'} : {background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(148,163,184,0.8)'}}
                    >
                      {tab.name}
                    </button>
                    {/* Edit/Delete on hover */}
                    {customCat.activeSubTab === tab.id && (customCat.subTabs || []).length > 1 && (
                      <button
                        onClick={() => deleteSubTab(tab.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >×</button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addSubTab}
                  className="px-3 py-2 rounded-full text-sm font-medium transition-all" style={{background:"rgba(0,200,255,0.08)",border:"1px solid rgba(0,200,255,0.2)",color:"rgba(0,200,255,0.8)"}}
                >
                  + Add Tab
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {/* Tab Name Editor & Toolbar */}
          <div className="rounded-2xl p-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Current Tab Name */}
                <input
                  type="text"
                  value={currentSubTab?.name || ''}
                  onChange={(e) => renameSubTab(customCat.activeSubTab, e.target.value)}
                  placeholder="Tab name..."
                  className="px-3 py-2 rounded-xl text-sm font-medium focus:outline-none text-white" style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.2)"}}
                />
                
                {/* Add Section Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowAddSection(!showAddSection)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:scale-105 transition-transform"
                  >
                    + Add Section
                  </button>
                  {showAddSection && (
                    <div className="absolute top-full left-0 mt-2 rounded-xl p-2 flex flex-wrap gap-1 z-10 w-max max-w-xl" style={{background:"rgba(5,15,30,0.95)",border:"1px solid rgba(0,200,255,0.2)",backdropFilter:"blur(20px)"}}>
                      {sectionTypes.map(st => (
                        <button
                          key={st.type}
                          onClick={() => { addSection(st.type); showSaveFeedback(); setShowAddSection(false); }}
                          className={`px-3 py-2 bg-gradient-to-r ${st.color} text-white rounded-lg text-sm font-medium hover:scale-105 transition-transform whitespace-nowrap`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Save Feedback */}
                {savingFeedback && (
                  <div className="flex items-center gap-2 text-green-600 animate-pulse">
                    <span className="text-lg">✓</span>
                    <span className="text-sm font-medium">Saved!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Empty State */}
          {currentSections.length === 0 && (
            <div className="bg-white rounded-3xl shadow-sm border p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-7xl">🦘</div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">G'day! Use Custom Categories to manage other aspects of your life.</h3>
                  <p className="text-gray-600 mb-4">Some areas this might help with:</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">📚 Books & Learning</span>
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">💼 Work</span>
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">📊 Sales</span>
                    <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">📋 Projects</span>
                    <span className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">✈️ Travel</span>
                    <span className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">🏠 Home Inventory</span>
                    <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">📓 Journal / Mood</span>
                    <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">🎄 Christmas List</span>
                    <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">🛒 Shopping List</span>
                    <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">🎁 Wish List</span>
                    <span className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">🔧 Warranty Tracker</span>
                    <span className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">🐾 Pet Management</span>
                    <span className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">🚗 Car / Vehicle Log</span>
                    <span className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">🏥 Medical / Health</span>
                    <span className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">🩸 Period / Cycle Tracker</span>
                    <span className="px-3 py-1.5 bg-lime-100 text-lime-700 rounded-full text-sm font-medium">📚 Studying</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-4">Click "+ Add Section" above to get started!</p>
                </div>
              </div>
            </div>
          )}

          {/* Sections */}
          {currentSections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => setDraggedSection(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedSection !== null && draggedSection !== index) {
                  moveSection(draggedSection, index);
                  showSaveFeedback();
                }
                setDraggedSection(null);
              }}
              className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all ${draggedSection === index ? 'opacity-50 scale-95' : ''}`}
            >
              {/* Section Header */}
              <div className={`p-4 border-b flex items-center justify-between bg-gradient-to-r ${getSectionGradient(section.type)} cursor-move`}>
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-white/60 cursor-grab">⋮⋮</span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => { updateSection(section.id, { title: e.target.value }); }}
                    placeholder="Section title..."
                    className="bg-transparent text-white placeholder-white/70 font-semibold focus:outline-none flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {/* Collapse */}
                  <button onClick={() => updateSection(section.id, { collapsed: !section.collapsed })} className="text-white/70 hover:text-white">
                    {section.collapsed ? '▼' : '▲'}
                  </button>
                  {/* Delete */}
                  <button onClick={() => { deleteSection(section.id); showSaveFeedback(); }} className="text-white/70 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Section Content */}
              {!section.collapsed && (
                <div className="p-4">
                  {/* NOTES */}
                  {section.type === 'notes' && (
                    <div className="space-y-3">
                      {/* Content Blocks */}
                      <div className="space-y-3">
                        {(section.content?.blocks || [{ id: 1, type: 'text', text: typeof section.content === 'string' ? section.content : '' }]).map((block, blockIndex) => (
                          <div key={block.id}>
                            {/* Text Block */}
                            {(block.type === 'text' || !block.type) && (
                              <div className="relative group">
                                <textarea
                                  value={block.text || ''}
                                  onChange={(e) => {
                                    const blocks = section.content?.blocks || [{ id: 1, type: 'text', text: '' }];
                                    const newBlocks = blocks.map(b => b.id === block.id ? { ...b, text: e.target.value } : b);
                                    updateSection(section.id, { content: { blocks: newBlocks } });
                                  }}
                                  ref={(el) => {
                                    // Only run once on mount using a data attribute flag
                                    if (el && !el.dataset.initialized) {
                                      el.dataset.initialized = 'true';
                                      // Delay to avoid scroll jump during render
                                      setTimeout(() => {
                                        el.style.height = 'auto';
                                        el.style.height = Math.max(200, el.scrollHeight) + 'px';
                                      }, 50);
                                    }
                                  }}
                                  onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.max(200, e.target.scrollHeight) + 'px';
                                  }}
                                  placeholder="Write your notes here..."
                                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-amber-500 resize-none overflow-hidden"
                                  style={{ minHeight: '200px' }}
                                />
                                {(section.content?.blocks?.length > 1 || blockIndex > 0) && (
                                  <button
                                    onClick={() => {
                                      const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                      updateSection(section.id, { content: { blocks } });
                                    }}
                                    className="absolute top-2 right-2 text-xs px-2 py-0.5 text-red-400 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >Delete</button>
                                )}
                              </div>
                            )}
                            
                            {/* Table Block */}
                            {block.type === 'table' && (
                              <div className="border-2 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-2 py-1 flex items-center justify-between border-b">
                                  <span className="text-xs text-gray-500 font-medium">📊 Table</span>
                                  <div className="flex gap-1">
                                    <button onClick={() => {
                                      const blocks = section.content?.blocks || [];
                                      const newBlocks = blocks.map(b => b.id === block.id ? { ...b, columns: [...b.columns, ''] } : b);
                                      updateSection(section.id, { content: { blocks: newBlocks } });
                                    }} className="text-xs px-2 py-0.5 text-blue-500 hover:bg-blue-50 rounded">+ Col</button>
                                    <button onClick={() => {
                                      const blocks = section.content?.blocks || [];
                                      const newBlocks = blocks.map(b => b.id === block.id ? { ...b, rows: [...b.rows, { id: Date.now() }] } : b);
                                      updateSection(section.id, { content: { blocks: newBlocks } });
                                    }} className="text-xs px-2 py-0.5 text-blue-500 hover:bg-blue-50 rounded">+ Row</button>
                                    <button onClick={() => {
                                      const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                      updateSection(section.id, { content: { blocks } });
                                    }} className="text-xs px-2 py-0.5 text-red-400 hover:bg-red-50 rounded">Delete</button>
                                  </div>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        {(block.columns || []).map((col, colIndex) => (
                                          <th key={colIndex} className="border-r last:border-r-0 border-b">
                                            <input
                                              type="text"
                                              value={col}
                                              onChange={(e) => {
                                                const blocks = section.content?.blocks || [];
                                                const newBlocks = blocks.map(b => {
                                                  if (b.id === block.id) {
                                                    const newCols = [...b.columns];
                                                    newCols[colIndex] = e.target.value;
                                                    return { ...b, columns: newCols };
                                                  }
                                                  return b;
                                                });
                                                updateSection(section.id, { content: { blocks: newBlocks } });
                                              }}
                                              placeholder={`Col ${colIndex + 1}`}
                                              className="w-full px-3 py-2 text-sm font-medium bg-transparent focus:outline-none focus:bg-amber-50"
                                            />
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(block.rows || []).map((row) => (
                                        <tr key={row.id}>
                                          {(block.columns || []).map((_, colIndex) => (
                                            <td key={colIndex} className="border-r last:border-r-0 border-b">
                                              <input
                                                type="text"
                                                value={row[`col${colIndex}`] || ''}
                                                onChange={(e) => {
                                                  const blocks = section.content?.blocks || [];
                                                  const newBlocks = blocks.map(b => {
                                                    if (b.id === block.id) {
                                                      const newRows = b.rows.map(r => r.id === row.id ? { ...r, [`col${colIndex}`]: e.target.value } : r);
                                                      return { ...b, rows: newRows };
                                                    }
                                                    return b;
                                                  });
                                                  updateSection(section.id, { content: { blocks: newBlocks } });
                                                }}
                                                className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none focus:bg-amber-50"
                                              />
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            
                            {/* Timeline Block */}
                            {block.type === 'timeline' && (
                              <div className="border-2 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-2 py-1 flex items-center justify-between border-b">
                                  <span className="text-xs text-gray-500 font-medium">⏱️ Timeline</span>
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                    updateSection(section.id, { content: { blocks } });
                                  }} className="text-xs px-2 py-0.5 text-red-400 hover:bg-red-50 rounded">Delete</button>
                                </div>
                                <div className="p-3 space-y-2">
                                  {(block.entries || []).map((entry, idx) => (
                                    <div key={entry.id} className="flex gap-3">
                                      <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 bg-indigo-500 rounded-full flex-shrink-0" />
                                        {idx < (block.entries || []).length - 1 && <div className="w-0.5 flex-1 bg-indigo-200" />}
                                      </div>
                                      <div className="flex-1 pb-2">
                                        <input
                                          type="date"
                                          value={entry.date || ''}
                                          onChange={(e) => {
                                            const blocks = section.content?.blocks || [];
                                            const newBlocks = blocks.map(b => {
                                              if (b.id === block.id) {
                                                const newEntries = b.entries.map(en => en.id === entry.id ? { ...en, date: e.target.value } : en);
                                                return { ...b, entries: newEntries };
                                              }
                                              return b;
                                            });
                                            updateSection(section.id, { content: { blocks: newBlocks } });
                                          }}
                                          className="text-xs text-indigo-600 font-medium mb-1 focus:outline-none bg-transparent"
                                        />
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={entry.text || ''}
                                            onChange={(e) => {
                                              const blocks = section.content?.blocks || [];
                                              const newBlocks = blocks.map(b => {
                                                if (b.id === block.id) {
                                                  const newEntries = b.entries.map(en => en.id === entry.id ? { ...en, text: e.target.value } : en);
                                                  return { ...b, entries: newEntries };
                                                }
                                                return b;
                                              });
                                              updateSection(section.id, { content: { blocks: newBlocks } });
                                            }}
                                            placeholder="What happened..."
                                            className="flex-1 px-2 py-1 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                          />
                                          <button
                                            onClick={() => {
                                              const blocks = section.content?.blocks || [];
                                              const newBlocks = blocks.map(b => {
                                                if (b.id === block.id) {
                                                  return { ...b, entries: b.entries.filter(en => en.id !== entry.id) };
                                                }
                                                return b;
                                              });
                                              updateSection(section.id, { content: { blocks: newBlocks } });
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                          ><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      const blocks = section.content?.blocks || [];
                                      const newBlocks = blocks.map(b => {
                                        if (b.id === block.id) {
                                          return { ...b, entries: [...(b.entries || []), { id: Date.now(), date: new Date().toISOString().split('T')[0], text: '' }] };
                                        }
                                        return b;
                                      });
                                      updateSection(section.id, { content: { blocks: newBlocks } });
                                    }}
                                    className="text-xs text-indigo-500 hover:text-indigo-700"
                                  >+ Add Entry</button>
                                </div>
                              </div>
                            )}
                            
                            {/* Goals Block */}
                            {block.type === 'goals' && (
                              <div className="border-2 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-2 py-1 flex items-center justify-between border-b">
                                  <span className="text-xs text-gray-500 font-medium">🎯 Goals</span>
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                    updateSection(section.id, { content: { blocks } });
                                  }} className="text-xs px-2 py-0.5 text-red-400 hover:bg-red-50 rounded">Delete</button>
                                </div>
                                <div className="p-3 space-y-3">
                                  {(block.items || []).map((goal) => {
                                    const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
                                    return (
                                      <div key={goal.id} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={goal.name || ''}
                                            onChange={(e) => {
                                              const blocks = section.content?.blocks || [];
                                              const newBlocks = blocks.map(b => {
                                                if (b.id === block.id) {
                                                  const newItems = b.items.map(g => g.id === goal.id ? { ...g, name: e.target.value } : g);
                                                  return { ...b, items: newItems };
                                                }
                                                return b;
                                              });
                                              updateSection(section.id, { content: { blocks: newBlocks } });
                                            }}
                                            placeholder="Goal name..."
                                            className="flex-1 px-2 py-1 border rounded-lg text-sm font-medium focus:outline-none focus:border-purple-500"
                                          />
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            value={goal.current || 0}
                                            onChange={(e) => {
                                              const val = parseFloat(e.target.value) || 0;
                                              const blocks = section.content?.blocks || [];
                                              const newBlocks = blocks.map(b => {
                                                if (b.id === block.id) {
                                                  const newItems = b.items.map(g => g.id === goal.id ? { ...g, current: val } : g);
                                                  return { ...b, items: newItems };
                                                }
                                                return b;
                                              });
                                              updateSection(section.id, { content: { blocks: newBlocks } });
                                            }}
                                            className="w-16 px-2 py-1 border rounded-lg text-sm text-center focus:outline-none focus:border-purple-500"
                                            style={{ appearance: 'textfield' }}
                                          />
                                          <span className="text-gray-400">/</span>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            value={goal.target || 100}
                                            onChange={(e) => {
                                              const val = parseFloat(e.target.value) || 0;
                                              const blocks = section.content?.blocks || [];
                                              const newBlocks = blocks.map(b => {
                                                if (b.id === block.id) {
                                                  const newItems = b.items.map(g => g.id === goal.id ? { ...g, target: val } : g);
                                                  return { ...b, items: newItems };
                                                }
                                                return b;
                                              });
                                              updateSection(section.id, { content: { blocks: newBlocks } });
                                            }}
                                            className="w-16 px-2 py-1 border rounded-lg text-sm text-center focus:outline-none focus:border-purple-500"
                                            style={{ appearance: 'textfield' }}
                                          />
                                          <button
                                            onClick={() => {
                                              const blocks = section.content?.blocks || [];
                                              const newBlocks = blocks.map(b => {
                                                if (b.id === block.id) {
                                                  return { ...b, items: b.items.filter(g => g.id !== goal.id) };
                                                }
                                                return b;
                                              });
                                              updateSection(section.id, { content: { blocks: newBlocks } });
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                          ><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-purple-500'}`} 
                                              style={{ width: `${progress}%` }} 
                                            />
                                          </div>
                                          <span className={`text-xs font-medium ${progress >= 100 ? 'text-green-600' : 'text-purple-600'}`}>
                                            {Math.round(progress)}%
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <button
                                    onClick={() => {
                                      const blocks = section.content?.blocks || [];
                                      const newBlocks = blocks.map(b => {
                                        if (b.id === block.id) {
                                          return { ...b, items: [...(b.items || []), { id: Date.now(), name: '', current: 0, target: 100 }] };
                                        }
                                        return b;
                                      });
                                      updateSection(section.id, { content: { blocks: newBlocks } });
                                    }}
                                    className="text-xs text-purple-500 hover:text-purple-700"
                                  >+ Add Goal</button>
                                </div>
                              </div>
                            )}
                            
                            {/* Links Block */}
                            {block.type === 'links' && (
                              <div className="border-2 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-2 py-1 flex items-center justify-between border-b">
                                  <span className="text-xs text-gray-500 font-medium">🔗 Links</span>
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                    updateSection(section.id, { content: { blocks } });
                                  }} className="text-xs px-2 py-0.5 text-red-400 hover:bg-red-50 rounded">Delete</button>
                                </div>
                                <div className="p-3 space-y-2">
                                  {(block.items || []).map((link) => (
                                    <div key={link.id} className="flex items-center gap-2">
                                      <span className="text-lg">🔗</span>
                                      <input type="text" value={link.title || ''} onChange={(e) => {
                                        const blocks = section.content?.blocks || [];
                                        const newBlocks = blocks.map(b => b.id === block.id ? { ...b, items: b.items.map(l => l.id === link.id ? { ...l, title: e.target.value } : l) } : b);
                                        updateSection(section.id, { content: { blocks: newBlocks } });
                                      }} placeholder="Title..." className="w-24 px-2 py-1 border rounded-lg text-sm focus:outline-none focus:border-rose-500" />
                                      <input type="text" value={link.url || ''} onChange={(e) => {
                                        const blocks = section.content?.blocks || [];
                                        const newBlocks = blocks.map(b => b.id === block.id ? { ...b, items: b.items.map(l => l.id === link.id ? { ...l, url: e.target.value } : l) } : b);
                                        updateSection(section.id, { content: { blocks: newBlocks } });
                                      }} placeholder="https://..." className="flex-1 px-2 py-1 border rounded-lg text-sm focus:outline-none focus:border-rose-500" />
                                      {link.url && <a href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">↗</a>}
                                      <button onClick={() => {
                                        const blocks = section.content?.blocks || [];
                                        const newBlocks = blocks.map(b => b.id === block.id ? { ...b, items: b.items.filter(l => l.id !== link.id) } : b);
                                        updateSection(section.id, { content: { blocks: newBlocks } });
                                      }} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                  ))}
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks || [];
                                    const newBlocks = blocks.map(b => b.id === block.id ? { ...b, items: [...(b.items || []), { id: Date.now(), title: '', url: '' }] } : b);
                                    updateSection(section.id, { content: { blocks: newBlocks } });
                                  }} className="text-xs text-rose-500 hover:text-rose-700">+ Add Link</button>
                                </div>
                              </div>
                            )}
                            
                            {/* Chart Block */}
                            {block.type === 'chart' && (() => {
                              const data = block.data || [10, 20, 15, 25, 30];
                              const maxVal = Math.max(...data, 1);
                              return (
                              <div className="border-2 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-2 py-1 flex items-center justify-between border-b">
                                  <span className="text-xs text-gray-500 font-medium">📈 Chart</span>
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                    updateSection(section.id, { content: { blocks } });
                                  }} className="text-xs px-2 py-0.5 text-red-400 hover:bg-red-50 rounded">Delete</button>
                                </div>
                                <div className="p-3">
                                  <div className="h-32 bg-gray-50 rounded-lg p-2">
                                    <div className="flex items-end gap-2 h-full">
                                      {data.map((val, i) => {
                                        const heightPct = (val / maxVal) * 100;
                                        return (
                                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                                            <div 
                                              className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t transition-all duration-300" 
                                              style={{ height: `${heightPct}%`, minHeight: val > 0 ? '8px' : '2px' }} 
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    {data.map((val, i) => (
                                      <div key={i} className="flex-1">
                                        <input 
                                          type="text" 
                                          inputMode="numeric" 
                                          value={val} 
                                          onChange={(e) => {
                                            const newVal = parseFloat(e.target.value) || 0;
                                            const blocks = section.content?.blocks || [];
                                            const newBlocks = blocks.map(b => {
                                              if (b.id === block.id) { 
                                                const newData = [...(b.data || [])]; 
                                                newData[i] = newVal; 
                                                return { ...b, data: newData }; 
                                              }
                                              return b;
                                            });
                                            updateSection(section.id, { content: { blocks: newBlocks } });
                                          }} 
                                          className="w-full text-xs text-center border rounded py-1" 
                                          style={{ appearance: 'textfield' }} 
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <button onClick={() => {
                                      const blocks = section.content?.blocks || [];
                                      const newBlocks = blocks.map(b => b.id === block.id ? { ...b, data: [...(b.data || []), 10] } : b);
                                      updateSection(section.id, { content: { blocks: newBlocks } });
                                    }} className="text-xs text-cyan-500 hover:text-cyan-700">+ Add</button>
                                    {data.length > 1 && (
                                      <button onClick={() => {
                                        const blocks = section.content?.blocks || [];
                                        const newBlocks = blocks.map(b => b.id === block.id ? { ...b, data: b.data.slice(0, -1) } : b);
                                        updateSection(section.id, { content: { blocks: newBlocks } });
                                      }} className="text-xs text-red-400 hover:text-red-600">- Remove</button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              );
                            })()}
                            
                            {/* Checklist Block */}
                            {block.type === 'checklist' && (
                              <div className="border-2 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-2 py-1 flex items-center justify-between border-b">
                                  <span className="text-xs text-gray-500 font-medium">📌 Checklist</span>
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                    updateSection(section.id, { content: { blocks } });
                                  }} className="text-xs px-2 py-0.5 text-red-400 hover:bg-red-50 rounded">Delete</button>
                                </div>
                                <div className="p-3 space-y-2">
                                  {(block.items || []).map((item) => (
                                    <div key={item.id} className="flex items-center gap-2">
                                      <button onClick={() => {
                                        const blocks = section.content?.blocks || [];
                                        const newBlocks = blocks.map(b => b.id === block.id ? { ...b, items: b.items.map(it => it.id === item.id ? { ...it, checked: !it.checked } : it) } : b);
                                        updateSection(section.id, { content: { blocks: newBlocks } });
                                      }} className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs ${item.checked ? 'bg-green-500 text-white' : 'border-2 border-gray-300'}`}>{item.checked && '✓'}</button>
                                      <input type="text" value={item.text || ''} onChange={(e) => {
                                        const blocks = section.content?.blocks || [];
                                        const newBlocks = blocks.map(b => b.id === block.id ? { ...b, items: b.items.map(it => it.id === item.id ? { ...it, text: e.target.value } : it) } : b);
                                        updateSection(section.id, { content: { blocks: newBlocks } });
                                      }} placeholder="Item..." className={`flex-1 px-2 py-1 text-sm focus:outline-none ${item.checked ? 'line-through text-gray-400' : ''}`} />
                                      <button onClick={() => {
                                        const blocks = section.content?.blocks || [];
                                        const newBlocks = blocks.map(b => b.id === block.id ? { ...b, items: b.items.filter(it => it.id !== item.id) } : b);
                                        updateSection(section.id, { content: { blocks: newBlocks } });
                                      }} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                  ))}
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks || [];
                                    const newBlocks = blocks.map(b => b.id === block.id ? { ...b, items: [...(b.items || []), { id: Date.now(), text: '', checked: false }] } : b);
                                    updateSection(section.id, { content: { blocks: newBlocks } });
                                  }} className="text-xs text-green-500 hover:text-green-700">+ Add Item</button>
                                </div>
                              </div>
                            )}
                            
                            {/* Quote Block */}
                            {block.type === 'quote' && (
                              <div className="border-l-4 border-violet-400 bg-violet-50 rounded-r-xl p-4">
                                <button onClick={() => {
                                  const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                  updateSection(section.id, { content: { blocks } });
                                }} className="float-right text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                <textarea value={block.text || ''} onChange={(e) => {
                                  const blocks = section.content?.blocks || [];
                                  const newBlocks = blocks.map(b => b.id === block.id ? { ...b, text: e.target.value } : b);
                                  updateSection(section.id, { content: { blocks: newBlocks } });
                                }} placeholder="Enter quote..." className="w-full bg-transparent text-violet-800 italic text-lg focus:outline-none resize-none" />
                                <input type="text" value={block.author || ''} onChange={(e) => {
                                  const blocks = section.content?.blocks || [];
                                  const newBlocks = blocks.map(b => b.id === block.id ? { ...b, author: e.target.value } : b);
                                  updateSection(section.id, { content: { blocks: newBlocks } });
                                }} placeholder="— Author" className="w-full bg-transparent text-violet-600 text-sm focus:outline-none mt-2" />
                              </div>
                            )}
                            
                            {/* Divider Block */}
                            {block.type === 'divider' && (
                              <div className="flex items-center gap-2 py-2">
                                <div className="flex-1 h-px bg-gray-300" />
                                <button onClick={() => {
                                  const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                  updateSection(section.id, { content: { blocks } });
                                }} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            )}
                            
                            {/* Embed Block */}
                            {block.type === 'embed' && (
                              <div className="border-2 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-2 py-1 flex items-center justify-between border-b">
                                  <span className="text-xs text-gray-500 font-medium">🔲 Embed</span>
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                    updateSection(section.id, { content: { blocks } });
                                  }} className="text-xs px-2 py-0.5 text-red-400 hover:bg-red-50 rounded">Delete</button>
                                </div>
                                <div className="p-3">
                                  <input type="text" value={block.url || ''} onChange={(e) => {
                                    const blocks = section.content?.blocks || [];
                                    const newBlocks = blocks.map(b => b.id === block.id ? { ...b, url: e.target.value } : b);
                                    updateSection(section.id, { content: { blocks: newBlocks } });
                                  }} placeholder="YouTube URL..." className="w-full px-2 py-1 border rounded-lg text-sm focus:outline-none mb-2" />
                                  {block.url && block.url.includes('youtube') && (
                                    <iframe src={block.url.replace('watch?v=', 'embed/')} className="w-full h-48 rounded-lg" allowFullScreen />
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Contact Block */}
                            {block.type === 'contact' && (
                              <div className="border-2 border-fuchsia-200 rounded-xl bg-fuchsia-50 p-3">
                                <div className="flex justify-between mb-2">
                                  <span className="text-xs text-fuchsia-600 font-medium">👤 Contact</span>
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                    updateSection(section.id, { content: { blocks } });
                                  }} className="text-xs text-red-400">Delete</button>
                                </div>
                                <input type="text" value={block.name || ''} onFocus={scrollInputIntoView} onChange={(e) => {
                                  const blocks = section.content?.blocks || [];
                                  const newBlocks = blocks.map(b => b.id === block.id ? { ...b, name: e.target.value } : b);
                                  updateSection(section.id, { content: { blocks: newBlocks } });
                                }} placeholder="Name..." className="w-full px-3 py-2 bg-white border-2 border-fuchsia-200 rounded-xl text-sm font-medium mb-2 focus:outline-none focus:border-fuchsia-400" />
                                <div className="space-y-2">
                                  <input type="tel" value={block.phone || ''} onFocus={scrollInputIntoView} onChange={(e) => {
                                    const blocks = section.content?.blocks || [];
                                    const newBlocks = blocks.map(b => b.id === block.id ? { ...b, phone: e.target.value } : b);
                                    updateSection(section.id, { content: { blocks: newBlocks } });
                                  }} placeholder="📞 Phone" className="w-full px-3 py-2 bg-white border-2 border-fuchsia-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-400" />
                                  <input type="email" value={block.email || ''} onFocus={scrollInputIntoView} onChange={(e) => {
                                    const blocks = section.content?.blocks || [];
                                    const newBlocks = blocks.map(b => b.id === block.id ? { ...b, email: e.target.value } : b);
                                    updateSection(section.id, { content: { blocks: newBlocks } });
                                  }} placeholder="✉️ Email" className="w-full px-3 py-2 bg-white border-2 border-fuchsia-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-400" />
                                </div>
                              </div>
                            )}
                            
                            {/* Location Block */}
                            {block.type === 'location' && (
                              <div className="border-2 border-red-200 rounded-xl bg-red-50 p-3">
                                <div className="flex justify-between mb-2">
                                  <span className="text-xs text-red-500 font-medium">📍 Location</span>
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                    updateSection(section.id, { content: { blocks } });
                                  }} className="text-xs text-red-400">Delete</button>
                                </div>
                                <input type="text" value={block.name || ''} onFocus={scrollInputIntoView} onChange={(e) => {
                                  const blocks = section.content?.blocks || [];
                                  const newBlocks = blocks.map(b => b.id === block.id ? { ...b, name: e.target.value } : b);
                                  updateSection(section.id, { content: { blocks: newBlocks } });
                                }} placeholder="Location name..." className="w-full px-3 py-2 bg-white border-2 border-red-200 rounded-xl text-sm font-medium mb-2 focus:outline-none focus:border-red-400" />
                                <textarea value={block.address || ''} onFocus={scrollInputIntoView} onChange={(e) => {
                                  const blocks = section.content?.blocks || [];
                                  const newBlocks = blocks.map(b => b.id === block.id ? { ...b, address: e.target.value } : b);
                                  updateSection(section.id, { content: { blocks: newBlocks } });
                                }} placeholder="Address..." className="w-full px-3 py-2 bg-white border-2 border-red-200 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none" rows={2} />
                              </div>
                            )}
                            
                            {/* Reminder Block */}
                            {block.type === 'reminder' && (
                              <div className="border-2 border-amber-200 rounded-xl bg-amber-50 p-3">
                                <div className="flex justify-between mb-2">
                                  <span className="text-xs text-amber-600 font-medium">🔔 Reminder</span>
                                  <button onClick={() => {
                                    const blocks = section.content?.blocks?.filter(b => b.id !== block.id) || [];
                                    updateSection(section.id, { content: { blocks } });
                                  }} className="text-xs text-red-400">Delete</button>
                                </div>
                                <input type="text" value={block.title || ''} onFocus={scrollInputIntoView} onChange={(e) => {
                                  const blocks = section.content?.blocks || [];
                                  const newBlocks = blocks.map(b => b.id === block.id ? { ...b, title: e.target.value } : b);
                                  updateSection(section.id, { content: { blocks: newBlocks } });
                                }} placeholder="Reminder..." className="w-full px-3 py-2 bg-white border-2 border-amber-200 rounded-xl text-sm font-medium mb-2 focus:outline-none focus:border-amber-400" />
                                <div className="space-y-2">
                                  <input type="date" value={block.date || ''} onFocus={scrollInputIntoView} onChange={(e) => {
                                    const blocks = section.content?.blocks || [];
                                    const newBlocks = blocks.map(b => b.id === block.id ? { ...b, date: e.target.value } : b);
                                    updateSection(section.id, { content: { blocks: newBlocks } });
                                  }} className="w-full px-3 py-2 bg-white border-2 border-amber-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                                  <input type="time" value={block.time || ''} onFocus={scrollInputIntoView} onChange={(e) => {
                                    const blocks = section.content?.blocks || [];
                                    const newBlocks = blocks.map(b => b.id === block.id ? { ...b, time: e.target.value } : b);
                                    updateSection(section.id, { content: { blocks: newBlocks } });
                                  }} className="w-full px-3 py-2 bg-white border-2 border-amber-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Insert Toggle - Retractable */}
                      <div className="pt-2 border-t border-slate-800">
                        <button
                          onClick={() => updateSection(section.id, { showInsertBar: !section.showInsertBar })}
                          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                        >
                          + Insert {section.showInsertBar ? '▲' : '▼'}
                        </button>
                        {section.showInsertBar && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <button
                              onClick={() => {
                                const newText = { id: Date.now(), type: 'text', text: '' };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newText] } });
                              }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              📝 Notes
                            </button>
                            <button
                              onClick={() => {
                                const newTable = {
                                  id: Date.now(),
                                  type: 'table',
                                  columns: ['', '', ''],
                                  rows: [{ id: Date.now() + 1 }, { id: Date.now() + 2 }]
                                };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newTable] } });
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              📊 Table
                            </button>
                            <button
                              onClick={() => {
                                const newTimeline = {
                                  id: Date.now(),
                                  type: 'timeline',
                                  entries: [{ id: Date.now() + 1, date: new Date().toISOString().split('T')[0], text: '' }]
                                };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newTimeline] } });
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              ⏱️ Timeline
                            </button>
                            <button
                              onClick={() => {
                                const newGoals = {
                                  id: Date.now(),
                                  type: 'goals',
                                  items: [{ id: Date.now() + 1, name: '', current: 0, target: 100 }]
                                };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newGoals] } });
                              }}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              🎯 Goals
                            </button>
                            <button
                              onClick={() => {
                                const newLinks = {
                                  id: Date.now(),
                                  type: 'links',
                                  items: [{ id: Date.now() + 1, title: '', url: '' }]
                                };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newLinks] } });
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              🔗 Links
                            </button>
                            <button
                              onClick={() => {
                                const newChart = {
                                  id: Date.now(),
                                  type: 'chart',
                                  chartType: 'bar',
                                  data: [10, 20, 15, 25, 30]
                                };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newChart] } });
                              }}
                              className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              📈 Chart
                            </button>
                            <button
                              onClick={() => {
                                const newChecklist = { id: Date.now(), type: 'checklist', items: [{ id: Date.now() + 1, text: '', checked: false }] };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newChecklist] } });
                              }}
                              className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              📌 Checklist
                            </button>
                            <button
                              onClick={() => {
                                const newQuote = { id: Date.now(), type: 'quote', text: '', author: '' };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newQuote] } });
                              }}
                              className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              💬 Quote
                            </button>
                            <button
                              onClick={() => {
                                const newDivider = { id: Date.now(), type: 'divider' };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newDivider] } });
                              }}
                              className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              ➗ Divider
                            </button>
                            <button
                              onClick={() => {
                                const newEmbed = { id: Date.now(), type: 'embed', url: '' };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newEmbed] } });
                              }}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              🔲 Embed
                            </button>
                            <button
                              onClick={() => {
                                const newContact = { id: Date.now(), type: 'contact', name: '', phone: '', email: '', notes: '' };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newContact] } });
                              }}
                              className="px-2.5 py-1 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              👤 Contact
                            </button>
                            <button
                              onClick={() => {
                                const newLocation = { id: Date.now(), type: 'location', name: '', address: '', notes: '' };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newLocation] } });
                              }}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-medium transition-colors"
                            >
                              📍 Location
                            </button>
                            <button
                              onClick={() => {
                                const newReminder = { id: Date.now(), type: 'reminder', title: '', date: '', time: '', note: '' };
                                const blocks = section.content?.blocks || [{ id: Date.now() - 1, type: 'text', text: section.content || '' }];
                                updateSection(section.id, { content: { blocks: [...blocks, newReminder] } });
                              }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              🔔 Reminder
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TASKS */}
                  {section.type === 'tasks' && (
                    <div className="space-y-2">
                      {(section.content || []).map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 border-2 rounded-xl bg-white">
                          <button
                            onClick={() => {
                              const newContent = section.content.map(t => t.id === task.id ? { ...t, done: !t.done } : t);
                              updateSection(section.id, { content: newContent });
                            }}
                            className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center ${task.done ? 'bg-green-500 text-white' : 'border-2 border-gray-300'}`}
                          >{task.done && '✓'}</button>
                          <input
                            type="text"
                            value={task.text}
                            onChange={(e) => {
                              const newContent = section.content.map(t => t.id === task.id ? { ...t, text: e.target.value } : t);
                              updateSection(section.id, { content: newContent });
                            }}
                            placeholder="Task..."
                            className={`flex-1 bg-transparent focus:outline-none ${task.done ? 'line-through opacity-50' : ''}`}
                          />
                          <input
                            type="date"
                            value={task.dueDate || ''}
                            onChange={(e) => {
                              const newContent = section.content.map(t => t.id === task.id ? { ...t, dueDate: e.target.value } : t);
                              updateSection(section.id, { content: newContent });
                            }}
                            className="bg-transparent text-sm focus:outline-none"
                          />
                          <button onClick={() => updateSection(section.id, { content: section.content.filter(t => t.id !== task.id) })} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                      <button
                        onClick={() => updateSection(section.id, { content: [...(section.content || []), { id: Date.now(), text: '', done: false, dueDate: '' }] })}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-violet-500 hover:text-violet-500"
                      >+ Add Task</button>
                    </div>
                  )}

                  {/* CALENDAR */}
                  {section.type === 'calendar' && (() => {
                    const daysInMonth = new Date(customCalYear, customCalMonth + 1, 0).getDate();
                    const firstDay = new Date(customCalYear, customCalMonth, 1).getDay();
                    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                    const events = section.content?.events || [];
                    const selectedDate = section.content?.selectedDate || null;
                    
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <button onClick={() => { if (customCalMonth === 0) { setCustomCalMonth(11); setCustomCalYear(y => y - 1); } else setCustomCalMonth(m => m - 1); }} className="p-2 hover:bg-gray-100 rounded-lg">←</button>
                          <span className="font-semibold">{new Date(customCalYear, customCalMonth).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</span>
                          <button onClick={() => { if (customCalMonth === 11) { setCustomCalMonth(0); setCustomCalYear(y => y + 1); } else setCustomCalMonth(m => m + 1); }} className="p-2 hover:bg-gray-100 rounded-lg">→</button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="font-medium text-gray-500 py-2">{d}</div>)}
                          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                          {days.map(day => {
                            const dateStr = `${customCalYear}-${String(customCalMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayEvents = events.filter(e => e.date === dateStr);
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;
                            const isSelected = selectedDate === dateStr;
                            return (
                              <div
                                key={day}
                                onClick={() => updateSection(section.id, { content: { ...section.content, selectedDate: isSelected ? null : dateStr } })}
                                className={`p-1 rounded-lg cursor-pointer min-h-[70px] ${isToday ? 'ring-2 ring-pink-500' : 'border'} ${isSelected ? 'bg-pink-50 border-pink-300' : 'hover:bg-gray-50'}`}
                              >
                                <div className={`text-sm ${isToday ? 'font-bold text-pink-600' : ''}`}>{day}</div>
                                {dayEvents.map(e => (
                                  <div key={e.id} className="text-xs bg-pink-100 text-pink-700 rounded px-1 mt-1 truncate flex items-center justify-between group">
                                    <span className="truncate">{e.title}</span>
                                    <button 
                                      onClick={(ev) => { 
                                        ev.stopPropagation(); 
                                        updateSection(section.id, { content: { ...section.content, events: events.filter(ev => ev.id !== e.id) } }); 
                                      }} 
                                      className="text-pink-400 hover:text-red-500 ml-1 opacity-0 group-hover:opacity-100"
                                    >×</button>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                        {selectedDate && (
                          <div className="mt-4 p-3 bg-pink-50 rounded-xl border border-pink-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-pink-700">
                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </span>
                              <button onClick={() => updateSection(section.id, { content: { ...section.content, selectedDate: null } })} className="text-gray-400 hover:text-gray-600">×</button>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Add event..."
                                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-pink-400"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.target.value.trim()) {
                                    updateSection(section.id, { 
                                      content: { 
                                        ...section.content, 
                                        events: [...events, { id: Date.now(), date: selectedDate, title: e.target.value.trim() }] 
                                      } 
                                    });
                                    e.target.value = '';
                                  }
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  const input = e.target.previousSibling;
                                  if (input.value.trim()) {
                                    updateSection(section.id, { 
                                      content: { 
                                        ...section.content, 
                                        events: [...events, { id: Date.now(), date: selectedDate, title: input.value.trim() }] 
                                      } 
                                    });
                                    input.value = '';
                                  }
                                }}
                                className="px-3 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600"
                              >Add</button>
                            </div>
                            {events.filter(e => e.date === selectedDate).length > 0 && (
                              <div className="mt-2 space-y-1">
                                {events.filter(e => e.date === selectedDate).map(e => (
                                  <div key={e.id} className="flex items-center justify-between bg-white px-2 py-1 rounded border">
                                    <span className="text-sm">{e.title}</span>
                                    <button 
                                      onClick={() => updateSection(section.id, { content: { ...section.content, events: events.filter(ev => ev.id !== e.id) } })}
                                      className="text-red-400 hover:text-red-600 text-sm"
                                    >Delete</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* CHART */}
                  {/* CARDS */}
                  {section.type === 'cards' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateSection(section.id, { studyMode: !section.studyMode })} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${section.studyMode ? 'bg-purple-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          {section.studyMode ? '✏️ Edit Mode' : '📖 Study Mode'}
                        </button>
                        {section.studyMode && <span className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Click cards to flip!</span>}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(section.content || []).map(card => (
                          <div key={card.id}>
                            {section.studyMode ? (
                              <div onClick={() => {
                                const newContent = section.content.map(c => c.id === card.id ? { ...c, flipped: !c.flipped } : c);

                                updateSection(section.id, { content: newContent });
                              }} className="relative cursor-pointer h-40">
                                <div className={`absolute inset-0 p-4 border-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-center transition-all duration-500 ${card.flipped ? 'opacity-0' : ''}`}>
                                  <span className="font-semibold text-lg">{card.title || 'Front'}</span>
                                </div>
                                <div className={`absolute inset-0 p-4 border-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-center transition-all duration-500 ${card.flipped ? '' : 'opacity-0'}`}>
                                  <span className="text-sm">{card.desc || 'Back'}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 h-40 flex flex-col">
                                <input type="text" value={card.title} onChange={(e) => {
                                  const newContent = section.content.map(c => c.id === card.id ? { ...c, title: e.target.value } : c);
                                  updateSection(section.id, { content: newContent });
                                }} placeholder="Front..." className="font-semibold w-full bg-transparent focus:outline-none mb-2 text-purple-700" />
                                <textarea value={card.desc} onChange={(e) => {
                                  const newContent = section.content.map(c => c.id === card.id ? { ...c, desc: e.target.value } : c);
                                  updateSection(section.id, { content: newContent });
                                }} placeholder="Back..." className="w-full text-sm text-gray-600 bg-transparent focus:outline-none resize-none flex-1" />
                                <button onClick={() => updateSection(section.id, { content: section.content.filter(c => c.id !== card.id) })} className="text-red-400 hover:text-red-600 text-sm self-start">Delete</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {!section.studyMode && (
                        <button onClick={() => updateSection(section.id, { content: [...(section.content || []), { id: Date.now(), title: '', desc: '', flipped: false }] })} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-500 hover:text-purple-500">+ Add Card</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // WORK VIEW
  if (activeView === 'work') {
    if (!isElite) return <LockedFeature featureName="Work" setActiveView={setActiveView} />;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get all days of the current week (Monday to Sunday)
    const getWeekDays = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        days.push({
          date: day.toISOString().split('T')[0],
          dayName: day.toLocaleDateString('en-AU', { weekday: 'long' }),
          dayShort: day.toLocaleDateString('en-AU', { weekday: 'short' }),
          isToday: day.toISOString().split('T')[0] === today
        });
      }
      return days;
    };

    const weekDays = getWeekDays();
    
    // Migrate old data format if needed
    const jobs = timesheetData.jobs || [{ id: 1, name: 'Job 1', hourlyRate: timesheetData.hourlyRate || 0, hourlyRateStr: timesheetData.hourlyRateStr || '', shifts: timesheetData.shifts || {} }];
    const activeJobId = timesheetData.activeJobId || 1;
    const activeJob = jobs.find(j => j.id === activeJobId) || jobs[0];
    
    // Calculate totals for a specific job
    const calcJobTotals = (job) => {
      const hours = weekDays.reduce((sum, day) => {
        const shift = job.shifts?.[day.date] || {};
        return sum + (parseFloat(shift.normalHours) || 0) + (parseFloat(shift.timeHalfHours) || 0) + (parseFloat(shift.doubleHours) || 0) + (parseFloat(shift.doubleHalfHours) || 0);
      }, 0);
      const pay = weekDays.reduce((sum, day) => {
        const shift = job.shifts?.[day.date] || {};
        const rate = job.hourlyRate || 0;
        return sum + ((parseFloat(shift.normalHours) || 0) * rate) + ((parseFloat(shift.timeHalfHours) || 0) * rate * 1.5) + ((parseFloat(shift.doubleHours) || 0) * rate * 2) + ((parseFloat(shift.doubleHalfHours) || 0) * rate * 2.5);
      }, 0);
      return { hours, pay };
    };
    
    // Calculate grand totals across all jobs
    const grandTotals = jobs.reduce((acc, job) => {
      const { hours, pay } = calcJobTotals(job);
      return { hours: acc.hours + hours, pay: acc.pay + pay };
    }, { hours: 0, pay: 0 });
    
    const activeJobTotals = calcJobTotals(activeJob);
    
    // Update job data
    const updateJob = (jobId, field, value) => {
      setTimesheetData(prev => ({
        ...prev,
        jobs: (prev.jobs || jobs).map(j => j.id === jobId ? { ...j, [field]: value } : j)
      }));
    };
    
    // Update shift for active job
    const updateShift = (date, field, value) => {
      setTimesheetData(prev => ({
        ...prev,
        jobs: (prev.jobs || jobs).map(j => j.id === activeJobId ? {
          ...j,
          shifts: { ...j.shifts, [date]: { ...j.shifts?.[date], [field]: value } }
        } : j)
      }));
    };
    
    // Add new job
    const addJob = () => {
      if (jobs.length >= 5) return alert('Maximum 5 jobs allowed');
      const newId = Math.max(...jobs.map(j => j.id)) + 1;
      setTimesheetData(prev => ({
        ...prev,
        jobs: [...(prev.jobs || jobs), { id: newId, name: `Job ${newId}`, hourlyRate: 0, hourlyRateStr: '', shifts: {} }],
        activeJobId: newId
      }));
    };
    
    // Delete job
    const deleteJob = (jobId) => {
      if (jobs.length <= 1) return alert('Must have at least one job');
      if (!confirm('Delete this job and all its timesheet data?')) return;
      const newJobs = jobs.filter(j => j.id !== jobId);
      setTimesheetData(prev => ({
        ...prev,
        jobs: newJobs,
        activeJobId: newJobs[0].id
      }));
    };

    return (
      <div className="min-h-screen bg-transparent">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px",letterSpacing:"0.5px"}}>← Back</button>
                <h1 className="text-4xl font-semibold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Work & Timesheet</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* Sub-tabs: Summary & Jobs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setWorkSubTab('summary')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                workSubTab === 'summary'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              📊 Total Summary
            </button>
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => {
                  setTimesheetData(prev => ({ ...prev, activeJobId: job.id }));
                  setWorkSubTab('timesheet');
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  workSubTab === 'timesheet' && activeJobId === job.id
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                💼 {job.name}
              </button>
            ))}
            {jobs.length < 5 && (
              <button
                onClick={addJob}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              >
                + Add Job
              </button>
            )}
          </div>

          {/* Total Summary Tab */}
          {workSubTab === 'summary' && (
            <div className="space-y-6">
              {/* Grand Total Card */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-4">📊 All Jobs - Weekly Total</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-4xl font-bold">{grandTotals.hours.toFixed(1)}</div>
                    <div className="text-sm text-green-200">Total Hours</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-4xl font-bold">${grandTotals.pay.toFixed(2)}</div>
                    <div className="text-sm text-green-200">Total Pay (before tax)</div>
                  </div>
                </div>
              </div>
              
              {/* Per-Job Breakdown */}
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Breakdown by Job</h3>
                </div>
                <div className="divide-y">
                  {jobs.map(job => {
                    const { hours, pay } = calcJobTotals(job);
                    return (
                      <div key={job.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <span className="text-lg">💼</span>
                          </div>
                          <div>
                            <div className="font-medium text-white">{job.name}</div>
                            <div className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>${job.hourlyRate || 0}/hr</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="font-bold text-gray-800">{hours.toFixed(1)}h</div>
                            <div className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Hours</div>
                          </div>
                          <div>
                            <div className="font-bold text-green-600">${pay.toFixed(2)}</div>
                            <div className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Pay</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Total Row */}
                <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                  <div className="font-bold text-gray-800">TOTAL</div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="font-bold text-gray-800">{grandTotals.hours.toFixed(1)}h</div>
                    <div className="font-bold text-green-600">${grandTotals.pay.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Individual Job Timesheet Tab */}
          {workSubTab === 'timesheet' && (
            <div className="space-y-6">
              {/* Job Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={activeJob.name}
                      onChange={(e) => updateJob(activeJobId, 'name', e.target.value)}
                      className="text-2xl font-bold bg-transparent border-b border-white/30 focus:outline-none focus:border-white"
                    />
                    {jobs.length > 1 && (
                      <button
                        onClick={() => deleteJob(activeJobId)}
                        className="p-1 text-white/60 hover:text-red-300 transition-colors"
                        title="Delete job"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Reset all shifts for this week?')) {
                        const newShifts = { ...activeJob.shifts };
                        weekDays.forEach(day => { delete newShifts[day.date]; });
                        updateJob(activeJobId, 'shifts', newShifts);
                      }
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all"
                  >
                    Reset Week
                  </button>
                </div>
                
                {/* Hourly Rate */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-white/10 rounded-xl">
                  <span className="text-blue-100">Hourly Rate:</span>
                  <div className="flex items-center bg-white/20 rounded-lg px-3 py-1">
                    <span className="text-white">$</span>
                    <input
                      type="text"
                      value={activeJob.hourlyRateStr || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        updateJob(activeJobId, 'hourlyRateStr', val);
                        updateJob(activeJobId, 'hourlyRate', parseFloat(val) || 0);
                      }}
                      placeholder="0.00"
                      className="w-20 bg-transparent text-white placeholder-blue-200 focus:outline-none text-center"
                    />
                    <span className="text-blue-200">/hr</span>
                  </div>
                </div>
                
                {/* Weekly Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold">{activeJobTotals.hours.toFixed(1)}</div>
                    <div className="text-sm text-blue-200">Hours This Week</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold">${activeJobTotals.pay.toFixed(2)}</div>
                    <div className="text-sm text-blue-200">Estimated Pay (before tax)</div>
                  </div>
                </div>
              </div>

              {/* Daily Shift Cards */}
              {weekDays.map(day => {
                const shift = activeJob.shifts?.[day.date] || {};
                const normalHrs = parseFloat(shift.normalHours) || 0;
                const timeHalfHrs = parseFloat(shift.timeHalfHours) || 0;
                const doubleHrs = parseFloat(shift.doubleHours) || 0;
                const doubleHalfHrs = parseFloat(shift.doubleHalfHours) || 0;
                const totalHours = normalHrs + timeHalfHrs + doubleHrs + doubleHalfHrs;
                const hourlyRate = activeJob.hourlyRate || 0;
                const dayPay = (normalHrs * hourlyRate) + (timeHalfHrs * hourlyRate * 1.5) + (doubleHrs * hourlyRate * 2) + (doubleHalfHrs * hourlyRate * 2.5);
                
                return (
                  <div 
                    key={day.date} 
                    className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${
                      day.isToday ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'
                    }`}
                  >
                    <div className={`px-4 py-3 flex items-center justify-between ${day.isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-gray-800 text-lg">{day.dayName}</div>
                        {day.isToday && <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">Today</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        {totalHours > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">{totalHours.toFixed(1)}h</span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">${dayPay.toFixed(2)}</span>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            const newShifts = { ...activeJob.shifts };
                            delete newShifts[day.date];
                            updateJob(activeJobId, 'shifts', newShifts);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-xl p-3">
                          <label className="text-xs text-blue-600 font-medium mb-1 block">1x Normal</label>
                          <div className="flex items-center gap-2">
                            <input type="number" step="0.5" value={shift.normalHours || ''} onChange={(e) => updateShift(day.date, 'normalHours', e.target.value)} placeholder="0" className="w-full px-3 py-2 border-2 border-blue-200 rounded-xl text-center font-bold text-lg focus:outline-none focus:border-blue-400 bg-white" />
                            <span className="text-blue-600 font-medium">hrs</span>
                          </div>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-3">
                          <label className="text-xs text-yellow-600 font-medium mb-1 block">1.5x Time & Half</label>
                          <div className="flex items-center gap-2">
                            <input type="number" step="0.5" value={shift.timeHalfHours || ''} onChange={(e) => updateShift(day.date, 'timeHalfHours', e.target.value)} placeholder="0" className="w-full px-3 py-2 border-2 border-yellow-200 rounded-xl text-center font-bold text-lg focus:outline-none focus:border-yellow-400 bg-white" />
                            <span className="text-yellow-600 font-medium">hrs</span>
                          </div>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3">
                          <label className="text-xs text-orange-600 font-medium mb-1 block">2x Double Time</label>
                          <div className="flex items-center gap-2">
                            <input type="number" step="0.5" value={shift.doubleHours || ''} onChange={(e) => updateShift(day.date, 'doubleHours', e.target.value)} placeholder="0" className="w-full px-3 py-2 border-2 border-orange-200 rounded-xl text-center font-bold text-lg focus:outline-none focus:border-orange-400 bg-white" />
                            <span className="text-orange-600 font-medium">hrs</span>
                          </div>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3">
                          <label className="text-xs text-red-600 font-medium mb-1 block">2.5x Double & Half</label>
                          <div className="flex items-center gap-2">
                            <input type="number" step="0.5" value={shift.doubleHalfHours || ''} onChange={(e) => updateShift(day.date, 'doubleHalfHours', e.target.value)} placeholder="0" className="w-full px-3 py-2 border-2 border-red-200 rounded-xl text-center font-bold text-lg focus:outline-none focus:border-red-400 bg-white" />
                            <span className="text-red-600 font-medium">hrs</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">📝 Notes</label>
                        <input type="text" value={shift.notes || ''} onChange={(e) => updateShift(day.date, 'notes', e.target.value)} placeholder="What did you work on..." className="w-full px-3 py-2 border-2 rounded-xl focus:outline-none focus:border-blue-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }


  // HOME VIEW
  if (activeView === 'home') {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "G'morning" : hour < 17 ? "G'day" : "G'evening";
    const today = new Date().toISOString().split('T')[0];
    const todaySleep = sleepData[today] || {};
    const todayMood = mentalHealthData[today] || {};
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
    const lastNightSleep = sleepData[yesterday.toISOString().split('T')[0]] || {};
    const getWeekDays = () => { const now=new Date(),dow=now.getDay(),mon=new Date(now); mon.setDate(now.getDate()-(dow===0?6:dow-1)); return Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d.toISOString().split("T")[0];}); };
    const weekDays = getWeekDays();
    const jobs = timesheetData.jobs || [{ id:1, name:"Job 1", hourlyRate:timesheetData.hourlyRate||0, shifts:timesheetData.shifts||{} }];
    const weeklyWorkHours = jobs.reduce((total,job)=>total+weekDays.reduce((sum,date)=>{const s=job.shifts?.[date]||{};return sum+(parseFloat(s.normalHours)||0)+(parseFloat(s.timeHalfHours)||0)+(parseFloat(s.doubleHours)||0)+(parseFloat(s.doubleHalfHours)||0);},0),0);
    const dayOfYear = Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/86400000);
    const todayQuote = investmentQuotes[dayOfYear % investmentQuotes.length];
    const completedDailyTasks = dailyTasks.filter(t => t.completed).length;

    return (
      <div className="min-h-screen bg-transparent pb-24">
        <Sidebar />
        <SaveIndicator />

        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{background:"rgba(0,200,255,0.1)",border:"1px solid rgba(0,200,255,0.25)"}}>🦘</div>
              <div className="flex-1">
                <div className="text-sm" style={{color:"rgba(255,255,255,0.6)"}}>{greeting}, {isElite && eliteName ? eliteName : "mate"}!</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-2xl font-bold text-white">{funnyGreetings ? dashFunnyGreeting : "Welcome back legend!"}</div>
                  {isElite && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{background:"rgba(255,215,0,0.15)",border:"1px solid rgba(255,215,0,0.3)"}}><span className="text-xs font-bold" style={{color:"#FFD700"}}>⚡ ELITE</span></div>}
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{background:"rgba(0,200,255,0.08)",border:"1px solid rgba(0,200,255,0.2)"}}>
              <div className="text-sm" style={{color:"rgba(0,200,255,0.8)"}}>Net Worth</div>
              <div className="text-4xl font-bold text-white">${netWorth.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-4 text-center" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
              <div className="text-xs text-slate-400">Monthly Bills</div>
              <div className="text-xl font-bold text-white">${totalMonthly.toFixed(0)}</div>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
              <div className="text-xs text-slate-400">Savings Rate</div>
              <div className="text-xl font-bold text-white">{savingsRate.toFixed(0)}%</div>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
              <div className="text-xs text-slate-400">Portfolio</div>
              <div className="text-xl font-bold text-white">${totalStocks.toLocaleString()}</div>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><span>📊</span> Today's Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => setActiveView("gym")} className="rounded-xl p-3 text-left" style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)"}}>
                <div className="text-2xl mb-1">🌙</div>
                <div className="text-xs font-medium" style={{color:"rgba(129,140,248,0.9)"}}>Last Night</div>
                <div className="text-xl font-bold text-white">{lastNightSleep.hoursSlept ? `${lastNightSleep.hoursSlept}h` : "—"}</div>
              </button>
              <button onClick={() => setActiveView("gym")} className="rounded-xl p-3 text-left" style={{background:"rgba(236,72,153,0.1)",border:"1px solid rgba(236,72,153,0.2)"}}>
                <div className="text-2xl mb-1">🧠</div>
                <div className="text-xs font-medium" style={{color:"rgba(244,114,182,0.9)"}}>Mood</div>
                <div className="text-xl font-bold text-white">{todayMood.mood ? ({great:"😊",good:"😌",okay:"😐",low:"😔",sad:"😢",angry:"😡"}[todayMood.mood]||"—") : "—"}</div>
              </button>
              <button onClick={() => setActiveView("work")} className="rounded-xl p-3 text-left" style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)"}}>
                <div className="text-2xl mb-1">💼</div>
                <div className="text-xs font-medium" style={{color:"rgba(96,165,250,0.9)"}}>This Week</div>
                <div className="text-xl font-bold text-white">{weeklyWorkHours > 0 ? `${weeklyWorkHours.toFixed(0)}h` : "—"}</div>
              </button>
              <button onClick={() => setActiveView("tasks")} className="rounded-xl p-3 text-left" style={{background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)"}}>
                <div className="text-2xl mb-1">✅</div>
                <div className="text-xs font-medium" style={{color:"rgba(192,132,252,0.9)"}}>Tasks</div>
                <div className="text-xl font-bold text-white">{completedDailyTasks}/{dailyTasks.length}</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {[
              {label:"Habits",emoji:"🔥",view:"habits"},
              {label:"Sleep",emoji:"🌙",view:"gym"},
              {label:"Mood",emoji:"🧠",view:"gym"},
              {label:"Work",emoji:"💼",view:"work"},
              {label:"Diet",emoji:"🥗",view:"diet"},
              {label:"Bills",emoji:"💸",view:"varied"},
              {label:"Invest",emoji:"📈",view:"investments"},
              {label:"Tasks",emoji:"✅",view:"tasks"},
            ].map(s => (
              <button key={s.view} onClick={() => setActiveView(s.view)} className="rounded-xl p-3 flex flex-col items-center" style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.1)"}}>
                <span className="text-2xl mb-1">{s.emoji}</span>
                <span className="text-xs text-slate-400">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
              <div className="font-semibold text-white mb-3 flex items-center gap-2"><Award className="w-4 h-4" style={{color:"#f59e0b"}} />Achievements</div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {(() => {
                  const achievementData = [
                    { id:"first_1k", icon:"💰", title:"First $1K", current:netWorth, target:1000, unit:"$" },
                    { id:"5k_club", icon:"💵", title:"$5K Club", current:netWorth, target:5000, unit:"$" },
                    { id:"10k_club", icon:"🏆", title:"$10K Club", current:netWorth, target:10000, unit:"$" },
                    { id:"25k_club", icon:"💎", title:"$25K Club", current:netWorth, target:25000, unit:"$" },
                    { id:"50k_club", icon:"👑", title:"$50K Club", current:netWorth, target:50000, unit:"$" },
                    { id:"100k_club", icon:"🚀", title:"$100K Club", current:netWorth, target:100000, unit:"$" },
                    { id:"250k_club", icon:"⭐", title:"$250K Club", current:netWorth, target:250000, unit:"$" },
                    { id:"500k_club", icon:"🌟", title:"$500K Club", current:netWorth, target:500000, unit:"$" },
                    { id:"1m_club", icon:"🎯", title:"Millionaire", current:netWorth, target:1000000, unit:"$" },
                    { id:"saver_10", icon:"🌱", title:"Baby Saver", current:savingsRate, target:10, unit:"%" },
                    { id:"saver_20", icon:"🌿", title:"Growing Saver", current:savingsRate, target:20, unit:"%" },
                    { id:"super_saver", icon:"💪", title:"Super Saver", current:savingsRate, target:50, unit:"%" },
                    { id:"mega_saver", icon:"🦸", title:"Mega Saver", current:savingsRate, target:70, unit:"%" },
                    { id:"first_stock", icon:"📈", title:"First Investment", current:stocks.length, target:1, unit:" stocks" },
                    { id:"diversified", icon:"🎯", title:"Diversified", current:stocks.length, target:5, unit:" stocks" },
                    { id:"portfolio_pro", icon:"📊", title:"Portfolio Pro", current:stocks.length, target:10, unit:" stocks" },
                    { id:"task_starter", icon:"✅", title:"Task Starter", current:completedDailyTasks, target:1, unit:" tasks" },
                    { id:"task_master", icon:"🏅", title:"Task Master", current:completedDailyTasks, target:5, unit:" tasks" },
                    { id:"asset_owner", icon:"🏠", title:"Asset Owner", current:assets.length, target:1, unit:" assets" },
                    { id:"asset_collector", icon:"🏰", title:"Asset Collector", current:assets.length, target:5, unit:" assets" },
                  ];
                  const sorted = [...achievementData].sort((a,b) => {
                    const ap = Math.min((a.current/a.target)*100,100);
                    const bp = Math.min((b.current/b.target)*100,100);
                    if(ap>=100&&bp<100) return 1;
                    if(ap<100&&bp>=100) return -1;
                    return bp-ap;
                  });
                  return sorted.map(a => {
                    const progress = Math.min((a.current/a.target)*100,100);
                    const isComplete = progress >= 100;
                    return (
                      <div key={a.id} className="p-3 rounded-xl" style={isComplete?{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)"}:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`text-2xl ${isComplete?"":"grayscale opacity-60"}`}>{a.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-white">{a.title}</div>
                            <div className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>
                              {isComplete ? "🎉 Complete!" : `${a.unit==="$"?"$":""}${a.current.toLocaleString(undefined,{maximumFractionDigits:0})}${a.unit!=="$"?a.unit:""} / ${a.unit==="$"?"$":""}${a.target.toLocaleString()}${a.unit!=="$"?a.unit:""}`}
                            </div>
                          </div>
                          {isComplete && <Trophy className="w-5 h-5" style={{color:"#f59e0b"}} />}
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.06)"}}>
                          <div className="h-full rounded-full transition-all duration-500" style={{width:`${progress}%`,background:isComplete?"linear-gradient(90deg,#f59e0b,#f97316)":"rgba(0,200,255,0.5)"}} />
                        </div>
                        {!isComplete && <div className="text-xs text-right mt-1" style={{color:"rgba(148,163,184,0.5)"}}>{progress.toFixed(0)}%</div>}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
              <div className="font-semibold text-white mb-3">📅 Coming Up</div>
              {(() => {
                const thisYear = new Date().getFullYear();
                const permanentReminders = (reminders||[]).filter(r => r.permanent && r.title).map(r => ({
                  id:'r'+r.id, title:r.title, emoji:'📌', days:-1, permanent:true
                }));
                const bdayEvents = (birthdays||[]).map(b => {
                  if (!b.date) return null;
                  const parts = b.date.split("-");
                  let next = `${thisYear}-${parts[1]}-${parts[2]}`;
                  if (next < today) next = `${thisYear+1}-${parts[1]}-${parts[2]}`;
                  return { id:"b"+b.id, title:`${b.name}'s Birthday`, emoji:"🎂", days:Math.ceil((new Date(next)-new Date())/86400000) };
                }).filter(Boolean);
                const cdEvents = (countdowns||[]).filter(c=>c.date>=today).map(c=>({
                  id:c.id, title:c.title, emoji:c.emoji||"⏳", days:Math.ceil((new Date(c.date)-new Date())/86400000)
                }));
                const all = [...bdayEvents,...cdEvents].sort((a,b)=>a.days-b.days).slice(0,8);
                if (all.length===0) return <div className="text-sm text-center py-4" style={{color:"rgba(148,163,184,0.4)"}}>No upcoming events</div>;
                return all.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between py-2" style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <span className="text-sm text-white">{ev.emoji} {ev.title}</span>
                    <span className="text-xs font-mono" style={{color:"rgba(0,200,255,0.6)"}}>{ev.days}d</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {reminders && reminders.length > 0 && (
            <div className="rounded-2xl p-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.1)"}}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-white flex items-center gap-2">📌 Reminders</div>
                <button onClick={() => setActiveView('reminders')} className="text-xs" style={{color:"rgba(0,200,255,0.5)"}}>view all →</button>
              </div>
              <div className="space-y-2">
                {reminders.filter(r => r.title).slice(0,4).map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2" style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                    <span className="text-sm text-white">{r.title}</span>
                    {r.permanent ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(0,200,255,0.1)",color:"rgba(0,200,255,0.6)"}}>📌 always</span>
                    ) : r.date ? (
                      <span className="text-xs font-mono" style={{color:"rgba(0,200,255,0.5)"}}>{Math.ceil((new Date(r.date)-new Date())/86400000)}d</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl p-5" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.08)"}}>
            <div className="text-base italic text-white mb-2">"{todayQuote.quote}"</div>
            <div className="text-xs text-slate-400">— {todayQuote.author}</div>
          </div>

          {isElite && (
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <span className="text-lg">💛</span>
              <span className="text-sm text-slate-400">Muzz proudly supports Endometriosis Australia, Charlie Teo Foundation & Mark Hughes Foundation</span>
            </div>
          )}

        </div>

        <FloatingChat isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} chatMessages={chatMessages} setChatMessages={setChatMessages} isTyping={isTyping} setIsTyping={setIsTyping} financialContext={financialContext} isAiLimitReached={isAiLimitReached} incrementAiUsage={incrementAiUsage} getAiRemaining={getAiRemaining} AI_DAILY_LIMIT={AI_DAILY_LIMIT} muzzPersonality={muzzPersonality} />
      </div>
    );
  }

  // VARIED VIEW
  if (activeView === 'varied') {
    if (!isElite) return <LockedFeature featureName="Bills & Debts" setActiveView={setActiveView} />;
    const updateSubscription = (index, field, value) => {
      setSubscriptions(prev => {
        const updated = [...prev];
        if (!updated[index]) {
          updated[index] = { id: Date.now(), name: '', monthly: 0, monthlyStr: '', dueDate: '' };
        }
        if (field === 'name') {
          updated[index] = { ...updated[index], name: value };
        } else if (field === 'cost') {
          updated[index] = { ...updated[index], monthly: parseFloat(value) || 0, monthlyStr: value };
        } else if (field === 'dueDate') {
          updated[index] = { ...updated[index], dueDate: value };
        }
        return updated;
      });
    };

    const removeSubscription = (index) => {
      setSubscriptions(prev => prev.filter((_, i) => i !== index));
    };

    const calcCost = (monthly, period) => {
      if (!monthly) return '0.00';
      const val = period === 'daily' ? monthly / 30 :
                  period === 'weekly' ? monthly / 4 :
                  period === 'quarterly' ? monthly * 3 :
                  period === 'halfyear' ? monthly * 6 :
                  period === 'annually' ? monthly * 12 : monthly;
      return val.toFixed(2);
    };

    const calcPercentage = (bills, salary) => {
      if (!salary || salary === 0) return '0';
      return ((bills / salary) * 100).toFixed(1);
    };

    const currentSubs = billsType === 'personal' ? subscriptions : businessSubscriptions;
    const filledSubs = currentSubs.filter(s => s && s.monthly > 0);
    const totalMonthly = filledSubs.reduce((sum, s) => sum + s.monthly, 0);
    const salaryNum = parseFloat(monthlySalary) || 0;

    const handleSalaryChange = (value) => {
      setMonthlySalaryStr(value);
      setMonthlySalary(parseFloat(value) || 0);
    };

    return (
      <div className="min-h-screen bg-transparent">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px",letterSpacing:"0.5px"}}>← Back</button>
                <h1 className="text-4xl font-semibold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Bills Management</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setBillsSubTab('bills')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                billsSubTab === 'bills'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Bills
            </button>
            <button
              onClick={() => setBillsSubTab('calendar')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                billsSubTab === 'calendar'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setBillsSubTab('goals')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                billsSubTab === 'goals'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setBillsSubTab('debts')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                billsSubTab === 'debts'
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Debts
            </button>
            <button
              onClick={() => setBillsSubTab('debtCalc')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                billsSubTab === 'debtCalc'
                  ? 'text-white cyber-tab-active'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              Debt Payoff Calc
            </button>
          </div>

          {billsSubTab === 'bills' && (
            <>
          {/* Personal/Business Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setBillsType('personal')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                billsType === 'personal'
                  ? 'bg-green-500 text-white'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              🍺 Personal
            </button>
            <button
              onClick={() => setBillsType('business')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                billsType === 'business'
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-slate-200 transition-colors'
              }`}
            >
              💼 Business
            </button>
          </div>

          {/* Salary Input */}
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-white">{billsType === 'personal' ? 'Monthly Income' : 'Monthly Revenue'}</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-xl text-gray-400">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlySalaryStr}
                  onChange={(e) => handleSalaryChange(e.target.value)}
                  placeholder="0"
                  className="text-xl font-semibold w-32 px-3 py-2 border-2 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-400">/month</span>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          {salaryNum > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-white">{billsType === 'personal' ? 'Income' : 'Revenue'}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-semibold">Period</th>
                      <th className="text-right py-3 px-4 font-semibold">Daily</th>
                      <th className="text-right py-3 px-4 font-semibold">Weekly</th>
                      <th className="text-right py-3 px-4 font-semibold">Monthly</th>
                      <th className="text-right py-3 px-4 font-semibold">Quarterly</th>
                      <th className="text-right py-3 px-4 font-semibold">Half-Year</th>
                      <th className="text-right py-3 px-4 font-semibold">Annually</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={`font-semibold ${billsType === 'personal' ? 'bg-green-50 text-green-800' : 'bg-purple-50 text-purple-800'}`}>
                      <td className="py-3 px-4">{billsType === 'personal' ? 'Income' : 'Revenue'}</td>
                      <td className="py-3 px-4 text-right">${calcCost(salaryNum, 'daily')}</td>
                      <td className="py-3 px-4 text-right">${calcCost(salaryNum, 'weekly')}</td>
                      <td className="py-3 px-4 text-right">${calcCost(salaryNum, 'monthly')}</td>
                      <td className="py-3 px-4 text-right">${calcCost(salaryNum, 'quarterly')}</td>
                      <td className="py-3 px-4 text-right">${calcCost(salaryNum, 'halfyear')}</td>
                      <td className="py-3 px-4 text-right">${calcCost(salaryNum, 'annually')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bills List - Personal or Business */}
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className={`p-6 border-b ${billsType === 'business' ? 'bg-purple-50' : ''}`}>
              <h2 className="text-xl font-semibold text-white">{billsType === 'personal' ? '🍺 Personal Bills' : '💼 Business Bills'}</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {(billsType === 'personal' ? subscriptions : businessSubscriptions).map((sub, index) => (
                  <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100">
                    <span className="w-8 text-right text-gray-400 text-sm">{index + 1}.</span>
                    <input
                      type="text"
                      value={sub?.name || ''}
                      onChange={(e) => {
                        if (billsType === 'personal') {
                          updateSubscription(index, 'name', e.target.value);
                        } else {
                          const newSubs = [...businessSubscriptions];
                          newSubs[index] = { ...newSubs[index], name: e.target.value };
                          setBusinessSubscriptions(newSubs);
                        }
                      }}
                      placeholder={billsType === 'personal' ? 'Netflix' : 'Software License'}
                      className="w-40 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-sm">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={sub?.monthlyStr ?? sub?.monthly ?? ''}
                        onChange={(e) => {
                          if (billsType === 'personal') {
                            updateSubscription(index, 'cost', e.target.value);
                          } else {
                            const val = e.target.value;
                            const newSubs = [...businessSubscriptions];
                            newSubs[index] = { ...newSubs[index], monthlyStr: val, monthly: parseFloat(val) || 0 };
                            setBusinessSubscriptions(newSubs);
                          }
                        }}
                        placeholder="0"
                        className="w-20 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-gray-400 text-sm">/mo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={sub?.dueDate || ''}
                        onChange={(e) => {
                          if (billsType === 'personal') {
                            updateSubscription(index, 'dueDate', e.target.value);
                          } else {
                            const newSubs = [...businessSubscriptions];
                            newSubs[index] = { ...newSubs[index], dueDate: e.target.value };
                            setBusinessSubscriptions(newSubs);
                          }
                        }}
                        placeholder="23rd"
                        className="w-16 px-2 py-2 border rounded-lg text-sm text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button onClick={() => {
                      if (billsType === 'personal') {
                        removeSubscription(index);
                      } else {
                        setBusinessSubscriptions(prev => prev.filter((_, i) => i !== index));
                      }
                    }} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (billsType === 'personal') {
                    setSubscriptions(prev => [...prev, { name: '', monthly: 0, monthlyStr: '', dueDate: '', dateAdded: new Date().toISOString() }]);
                  } else {
                    setBusinessSubscriptions(prev => [...prev, { name: '', monthly: 0, monthlyStr: '', dueDate: '', dateAdded: new Date().toISOString() }]);
                  }
                }}
                className={`w-full mt-4 py-3 border-2 border-dashed rounded-xl transition-colors text-sm font-medium ${
                  billsType === 'personal' 
                    ? 'border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500'
                    : 'border-gray-300 text-gray-500 hover:border-purple-500 hover:text-purple-500'
                }`}
              >
                + Add {billsType === 'personal' ? 'Personal' : 'Business'} Bill
              </button>
            </div>
          </div>

          {/* Breakdown Table */}
          {filledSubs.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-white">Cost Breakdown</h2>
              </div>
              
              {/* Pie Chart */}
              {salaryNum > 0 && (
                <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8 border-b">
                  <div className="relative">
                    <svg width="220" height="220" viewBox="0 0 220 220">
                      {(() => {
                        const sortedSubs = [...filledSubs].sort((a, b) => b.monthly - a.monthly);
                        const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6', '#F97316', '#84CC16'];
                        let cumulative = 0;
                        const remaining = Math.max(0, salaryNum - totalMonthly);
                        const total = salaryNum;
                        
                        return (
                          <>
                            {sortedSubs.map((sub, idx) => {
                              const percent = (sub.monthly / total) * 100;
                              const startAngle = (cumulative / 100) * 360;
                              cumulative += percent;
                              const endAngle = (cumulative / 100) * 360;
                              
                              const startRad = (startAngle - 90) * Math.PI / 180;
                              const endRad = (endAngle - 90) * Math.PI / 180;
                              const largeArc = percent > 50 ? 1 : 0;
                              
                              const x1 = 110 + 80 * Math.cos(startRad);
                              const y1 = 110 + 80 * Math.sin(startRad);
                              const x2 = 110 + 80 * Math.cos(endRad);
                              const y2 = 110 + 80 * Math.sin(endRad);
                              
                              return (
                                <path
                                  key={idx}
                                  d={`M 110 110 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={colors[idx % colors.length]}
                                />
                              );
                            })}
                            {remaining > 0 && (() => {
                              const percent = (remaining / total) * 100;
                              const startAngle = (cumulative / 100) * 360;
                              const endAngle = 360;
                              
                              const startRad = (startAngle - 90) * Math.PI / 180;
                              const endRad = (endAngle - 90) * Math.PI / 180;
                              const largeArc = percent > 50 ? 1 : 0;
                              
                              const x1 = 110 + 80 * Math.cos(startRad);
                              const y1 = 110 + 80 * Math.sin(startRad);
                              const x2 = 110 + 80 * Math.cos(endRad);
                              const y2 = 110 + 80 * Math.sin(endRad);
                              
                              return (
                                <path
                                  d={`M 110 110 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill="#E5E7EB"
                                />
                              );
                            })()}
                            <circle cx="110" cy="110" r="50" fill="white" />
                            <text x="110" y="105" textAnchor="middle" className="text-lg font-bold fill-gray-700">
                              {((totalMonthly / salaryNum) * 100).toFixed(0)}%
                            </text>
                            <text x="110" y="125" textAnchor="middle" className="text-xs fill-gray-500">
                              of income
                            </text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {(() => {
                      const sortedSubs = [...filledSubs].sort((a, b) => b.monthly - a.monthly);
                      const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6', '#F97316', '#84CC16'];
                      const remaining = Math.max(0, salaryNum - totalMonthly);
                      
                      return (
                        <>
                          {sortedSubs.map((sub, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                              <span className="text-gray-700">{sub.name}</span>
                              <span className="text-gray-500">({((sub.monthly / salaryNum) * 100).toFixed(1)}%)</span>
                            </div>
                          ))}
                          {remaining > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-3 h-3 rounded-full bg-gray-200" />
                              <span className="text-gray-700">Remaining</span>
                              <span className="text-gray-500">({((remaining / salaryNum) * 100).toFixed(1)}%)</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Total Bills to Total Income Bar */}
              {salaryNum > 0 && (
                <div className="px-6 py-4 border-b">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Total Bills to Total Income</span>
                    <span className="text-sm font-bold text-indigo-600">
                      ${totalMonthly.toLocaleString()} / ${salaryNum.toLocaleString()} ({((totalMonthly / salaryNum) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        (totalMonthly / salaryNum) > 0.8 ? 'bg-red-500' : 
                        (totalMonthly / salaryNum) > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((totalMonthly / salaryNum) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>$0</span>
                    <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>${salaryNum.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th 
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => {
                          if (billsSortBy === 'name') setBillsSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          else { setBillsSortBy('name'); setBillsSortDir('asc'); }
                        }}
                      >
                        Subscription {billsSortBy === 'name' && (billsSortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-center py-3 px-3 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => {
                          if (billsSortBy === 'due') setBillsSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          else { setBillsSortBy('due'); setBillsSortDir('asc'); }
                        }}
                      >
                        Due {billsSortBy === 'due' && (billsSortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-right py-3 px-3 font-semibold">Daily</th>
                      <th className="text-right py-3 px-3 font-semibold">Weekly</th>
                      <th 
                        className="text-right py-3 px-3 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => {
                          if (billsSortBy === 'monthly') setBillsSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          else { setBillsSortBy('monthly'); setBillsSortDir('asc'); }
                        }}
                      >
                        Monthly {billsSortBy === 'monthly' && (billsSortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-right py-3 px-3 font-semibold">Quarterly</th>
                      <th className="text-right py-3 px-3 font-semibold">Half-Year</th>
                      <th className="text-right py-3 px-3 font-semibold">Annually</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filledSubs].sort((a, b) => {
                      let comparison = 0;
                      switch (billsSortBy) {
                        case 'name':
                          comparison = (a.name || '').localeCompare(b.name || '');
                          break;
                        case 'due':
                          const parseDay = (str) => {
                            if (!str) return 32;
                            const num = parseInt(str.replace(/\D/g, ''));
                            return isNaN(num) ? 32 : num;
                          };
                          comparison = parseDay(a.dueDate) - parseDay(b.dueDate);
                          break;
                        case 'monthly':
                          comparison = (parseFloat(a.monthly) || 0) - (parseFloat(b.monthly) || 0);
                          break;
                        default:
                          comparison = 0;
                      }
                      return billsSortDir === 'asc' ? comparison : -comparison;
                    }).map((sub, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {sub.name}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-500">
                          {sub.dueDate || '-'}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-600">${calcCost(sub.monthly, 'daily')}</td>
                        <td className="py-3 px-3 text-right text-gray-600">${calcCost(sub.monthly, 'weekly')}</td>
                        <td className="py-3 px-3 text-right font-semibold">${calcCost(sub.monthly, 'monthly')}</td>
                        <td className="py-3 px-3 text-right text-gray-600">${calcCost(sub.monthly, 'quarterly')}</td>
                        <td className="py-3 px-3 text-right text-gray-600">${calcCost(sub.monthly, 'halfyear')}</td>
                        <td className="py-3 px-3 text-right text-gray-600">${calcCost(sub.monthly, 'annually')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50 font-bold text-indigo-900">
                      <td className="py-3 px-4">Total Bills</td>
                      <td className="py-3 px-3"></td>
                      <td className="py-3 px-3 text-right">${calcCost(totalMonthly, 'daily')}</td>
                      <td className="py-3 px-3 text-right">${calcCost(totalMonthly, 'weekly')}</td>
                      <td className="py-3 px-3 text-right">${calcCost(totalMonthly, 'monthly')}</td>
                      <td className="py-3 px-3 text-right">${calcCost(totalMonthly, 'quarterly')}</td>
                      <td className="py-3 px-3 text-right">${calcCost(totalMonthly, 'halfyear')}</td>
                      <td className="py-3 px-3 text-right">${calcCost(totalMonthly, 'annually')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Muzz Advice Categories Info - Personal Only */}
          {billsType === 'personal' && filledSubs.length === 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl shadow-sm border border-blue-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🦘</div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Muzz Can Help You Save On...</h2>
                    <p className="text-sm text-gray-600 mb-4">Add your bills above and I'll give you personalised money-saving tips for:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg">
                        <span>📺</span> Streaming Services
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg">
                        <span>🥕</span> Groceries & Food
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg">
                        <span>💪</span> Gym Memberships
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg">
                        <span>📱</span> Phone & Internet
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg">
                        <span>🛡️</span> Insurance
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg">
                        <span>🧠</span> Subscription Audits
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Muzz Money Tips - Personal Only */}
          {billsType === 'personal' && filledSubs.length > 0 && (() => {
            const tips = [];
            
            // Streaming services
            const streamingServices = filledSubs.filter(s => 
              ['netflix', 'disney', 'disney+', 'stan', 'binge', 'paramount', 'amazon prime', 'prime video', 'hulu', 'hbo', 'apple tv', 'youtube premium', 'spotify', 'apple music'].some(str => s.name.toLowerCase().includes(str))
            );
            if (streamingServices.length > 1) {
              const names = streamingServices.slice(0, 2).map(s => s.name).join(' or ');
              const totalStreaming = streamingServices.reduce((sum, s) => sum + s.monthly, 0);
              tips.push(`Yo, you've got ${streamingServices.length} streaming services costing $${totalStreaming.toFixed(0)}/mo! Maybe ditch ${names} and rotate between them instead? 📺`);
              tips.push("Or split it with a mate - you pay for Netflix, they pay for Disney+, and share the logins. Everyone wins! 🤝");
            }
            
            // Food/Groceries
            const foodSubs = filledSubs.filter(s => 
              ['food', 'grocery', 'groceries', 'woolworths', 'coles', 'aldi', 'uber eats', 'doordash', 'menulog', 'deliveroo'].some(str => s.name.toLowerCase().includes(str))
            );
            if (foodSubs.length > 0) {
              tips.push("For groceries, check out Costco for bulk buys or hit up your local fruit & veg shop - way cheaper than the big supermarkets! 🥕");
            }
            
            // Gym
            const gymSubs = filledSubs.filter(s => 
              ['gym', 'fitness', 'f45', 'anytime', 'goodlife', 'plus fitness'].some(str => s.name.toLowerCase().includes(str))
            );
            if (gymSubs.length > 0 && gymSubs[0].monthly > 50) {
              tips.push("That gym membership's a bit pricey mate. Council gyms or outdoor fitness parks are free! Or try a cheaper 24/7 gym 💪");
            }
            
            // Phone/Internet
            const phoneSubs = filledSubs.filter(s => 
              ['phone', 'mobile', 'telstra', 'optus', 'vodafone', 'internet', 'nbn', 'wifi'].some(str => s.name.toLowerCase().includes(str))
            );
            if (phoneSubs.length > 0) {
              tips.push("Check out MVNOs like Boost, Belong, or Felix for cheaper phone plans - same network, less cash! 📱");
            }
            
            // Insurance
            const insuranceSubs = filledSubs.filter(s => 
              ['insurance', 'health insurance', 'car insurance', 'home insurance'].some(str => s.name.toLowerCase().includes(str))
            );
            if (insuranceSubs.length > 0) {
              tips.push("Shop around for insurance every year mate - use comparison sites to find better deals! 🛡️");
            }
            
            // High bills warning
            if (salaryNum > 0 && (totalMonthly / salaryNum) > 0.5) {
              tips.push("Crikey! Your bills are eating more than half your income. Time to have a proper look at what you can cut! 🔪");
            }
            
            // Add a general savings tip
            if (filledSubs.length > 5) {
              tips.push("Pro tip: Try the 'subscription audit' - cancel everything for a month and only re-subscribe to what you actually miss! 🧠");
            }
            
            // General tips if nothing specific
            if (tips.length === 0) {
              tips.push("Looking good legend! Keep tracking those expenses and you'll be sweet as 🤙");
            }
            
            const tipIndex = currentTipIndex % tips.length;
            
            return (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl shadow-sm border overflow-hidden text-white">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🦘</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-semibold text-white">Muzz's Money Tips</h2>
                        {tips.length > 1 && (
                          <span className="text-xs text-blue-200">{tipIndex + 1} / {tips.length}</span>
                        )}
                      </div>
                      <div className="min-h-[60px] flex items-center">
                        <p key={tipIndex} className="flex items-start gap-2 text-blue-100">
                          <span className="text-yellow-300">💡</span>
                          <span>{tips[tipIndex]}</span>
                        </p>
                      </div>
                      {tips.length > 1 && (
                        <div className="flex gap-1 mt-4">
                          {tips.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentTipIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-all ${idx === tipIndex ? 'bg-white w-4' : 'bg-blue-300'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Bills vs Salary Comparison */}
          {filledSubs.length > 0 && salaryNum > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-white">Bills vs Income</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-right py-3 px-3 font-semibold">Daily</th>
                      <th className="text-right py-3 px-3 font-semibold">Weekly</th>
                      <th className="text-right py-3 px-3 font-semibold">Monthly</th>
                      <th className="text-right py-3 px-3 font-semibold">Quarterly</th>
                      <th className="text-right py-3 px-3 font-semibold">Half-Year</th>
                      <th className="text-right py-3 px-3 font-semibold">Annually</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 font-medium text-green-700">Income</td>
                      <td className="py-3 px-3 text-right text-green-700">${calcCost(salaryNum, 'daily')}</td>
                      <td className="py-3 px-3 text-right text-green-700">${calcCost(salaryNum, 'weekly')}</td>
                      <td className="py-3 px-3 text-right text-green-700 font-semibold">${calcCost(salaryNum, 'monthly')}</td>
                      <td className="py-3 px-3 text-right text-green-700">${calcCost(salaryNum, 'quarterly')}</td>
                      <td className="py-3 px-3 text-right text-green-700">${calcCost(salaryNum, 'halfyear')}</td>
                      <td className="py-3 px-3 text-right text-green-700">${calcCost(salaryNum, 'annually')}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 font-medium text-red-600">Bills</td>
                      <td className="py-3 px-3 text-right text-red-600">${calcCost(totalMonthly, 'daily')}</td>
                      <td className="py-3 px-3 text-right text-red-600">${calcCost(totalMonthly, 'weekly')}</td>
                      <td className="py-3 px-3 text-right text-red-600 font-semibold">${calcCost(totalMonthly, 'monthly')}</td>
                      <td className="py-3 px-3 text-right text-red-600">${calcCost(totalMonthly, 'quarterly')}</td>
                      <td className="py-3 px-3 text-right text-red-600">${calcCost(totalMonthly, 'halfyear')}</td>
                      <td className="py-3 px-3 text-right text-red-600">${calcCost(totalMonthly, 'annually')}</td>
                    </tr>
                    <tr className="border-b bg-green-50">
                      <td className="py-3 px-4 font-semibold text-green-800">Left Over</td>
                      <td className="py-3 px-3 text-right text-green-800 font-semibold">${calcCost(salaryNum - totalMonthly, 'daily')}</td>
                      <td className="py-3 px-3 text-right text-green-800 font-semibold">${calcCost(salaryNum - totalMonthly, 'weekly')}</td>
                      <td className="py-3 px-3 text-right text-green-800 font-bold">${calcCost(salaryNum - totalMonthly, 'monthly')}</td>
                      <td className="py-3 px-3 text-right text-green-800 font-semibold">${calcCost(salaryNum - totalMonthly, 'quarterly')}</td>
                      <td className="py-3 px-3 text-right text-green-800 font-semibold">${calcCost(salaryNum - totalMonthly, 'halfyear')}</td>
                      <td className="py-3 px-3 text-right text-green-800 font-semibold">${calcCost(salaryNum - totalMonthly, 'annually')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Percentage Breakdown */}
              <div className="p-6 border-t bg-gray-50">
                <h3 className="font-semibold mb-4">% of Income</h3>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex gap-8">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-600">{calcPercentage(totalMonthly, salaryNum)}%</p>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Bills</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{(100 - parseFloat(calcPercentage(totalMonthly, salaryNum))).toFixed(1)}%</p>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Savings</p>
                    </div>
                  </div>
                  <div className="flex-1 w-full md:w-auto">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(parseFloat(calcPercentage(totalMonthly, salaryNum)), 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
            </>
          )}

          {billsSubTab === 'calendar' && (
            <>
              {/* Calendar View - Mobile Optimized */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Bills Calendar</h2>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Track when bills are due</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg"
                      >
                        ←
                      </button>
                      <span className="font-medium min-w-[120px] text-center text-sm">
                        {calendarMonth.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg"
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  {/* Day headers - abbreviated for mobile */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-xs font-semibold text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Calendar grid - Compact for mobile */}
                  {(() => {
                    const year = calendarMonth.getFullYear();
                    const month = calendarMonth.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const days = [];
                    
                    for (let i = 0; i < firstDay; i++) {
                      days.push(<div key={`empty-${i}`} className="h-12"></div>);
                    }
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayBills = calendarBills[dateKey] || [];
                      const totalForDay = dayBills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
                      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                      
                      days.push(
                        <button 
                          key={day}
                          onClick={() => setSelectedCalendarDate(dateKey)}
                          className={`h-12 rounded-lg flex flex-col items-center justify-center ${
                            isToday ? 'bg-orange-100 border-2 border-orange-400' : 
                            totalForDay > 0 ? 'bg-red-50 border border-red-200' : 
                            'bg-gray-50 border border-gray-200'
                          } hover:border-orange-400 transition-all`}
                        >
                          <span className={`text-sm font-semibold ${isToday ? 'text-orange-600' : 'text-gray-700'}`}>{day}</span>
                          {totalForDay > 0 && (
                            <span className="text-[10px] font-bold text-red-500">${totalForDay}</span>
                          )}
                        </button>
                      );
                    }
                    
                    return <div className="grid grid-cols-7 gap-1">{days}</div>;
                  })()}
                </div>
              </div>

              {/* Add/Edit Bill Modal for Selected Date */}
              {selectedCalendarDate && (
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </h2>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Add or manage bills</p>
                    </div>
                    <button onClick={() => setSelectedCalendarDate(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Add new bill form */}
                    <div className="space-y-2 p-3 bg-gray-50 rounded-xl">
                      <input
                        type="text"
                        placeholder="Bill name (e.g. Netflix)"
                        className="w-full px-3 py-2 border-2 rounded-xl text-base focus:outline-none focus:border-orange-400"
                        id="newBillName"
                        onFocus={scrollInputIntoView}
                      />
                      <div className="flex items-center border-2 rounded-xl bg-white overflow-hidden focus-within:border-orange-400">
                        <span className="pl-3 text-gray-400">$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          className="flex-1 px-2 py-2 text-base focus:outline-none"
                          id="newBillAmount"
                          onFocus={scrollInputIntoView}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const name = document.getElementById('newBillName').value.trim();
                          const amount = document.getElementById('newBillAmount').value;
                          
                          if (name) {
                            setCalendarBills(prev => ({
                              ...prev,
                              [selectedCalendarDate]: [...(prev[selectedCalendarDate] || []), { name, amount: amount || '0' }]
                            }));
                            document.getElementById('newBillName').value = '';
                            document.getElementById('newBillAmount').value = '';
                          }
                        }}
                        className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium"
                      >
                        + Add Bill
                      </button>
                    </div>
                    
                    {/* Bills for selected day */}
                    {(calendarBills[selectedCalendarDate] || []).length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-600">Bills on this day:</h3>
                        {(calendarBills[selectedCalendarDate] || []).map((bill, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white border-2 rounded-xl">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{bill.name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-red-600">${parseFloat(bill.amount || 0).toFixed(2)}</span>
                              <button
                                onClick={() => {
                                  setCalendarBills(prev => {
                                    const updated = { ...prev };
                                    updated[selectedCalendarDate] = updated[selectedCalendarDate].filter((_, i) => i !== idx);
                                    if (updated[selectedCalendarDate].length === 0) delete updated[selectedCalendarDate];
                                    return updated;
                                  });
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bills List for Current Month */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Bills This Month</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>
                    Total: ${Object.entries(calendarBills)
                      .filter(([date]) => {
                        const d = new Date(date);
                        return d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear();
                      })
                      .reduce((sum, [, bills]) => sum + bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0), 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="divide-y">
                  {Object.entries(calendarBills)
                    .filter(([date]) => {
                      const d = new Date(date);
                      return d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear();
                    })
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([date, bills]) => (
                      bills.map((bill, idx) => (
                        <div key={`${date}-${idx}`} className="flex items-center justify-between p-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="text-xs text-gray-500 w-14 flex-shrink-0">
                              {new Date(date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="font-medium truncate">{bill.name}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-semibold text-red-600">${parseFloat(bill.amount || 0).toFixed(2)}</span>
                            <button
                              onClick={() => {
                                setCalendarBills(prev => {
                                  const updated = { ...prev };
                                  updated[date] = updated[date].filter((_, i) => i !== idx);
                                  if (updated[date].length === 0) delete updated[date];
                                  return updated;
                                });
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ))}
                  {Object.entries(calendarBills).filter(([date]) => {
                    const d = new Date(date);
                    return d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear();
                  }).length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      No bills scheduled. Tap a day above to add one!
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {billsSubTab === 'goals' && (
            <>
              {/* Small Goals */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Small Goals</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Short-term savings targets</p>
                </div>
                <div className="p-4 space-y-4">
                  {billSmallGoals.map((goal, index) => {
                    const target = goal?.target || 0;
                    const current = goal?.current || 0;
                    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                    return (
                      <div key={index} className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm font-medium">{index + 1}.</span>
                          <input
                            type="text"
                            value={goal?.name || ''}
                            onChange={(e) => {
                              setBillSmallGoals(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], name: e.target.value };
                                return updated;
                              });
                            }}
                            placeholder="Emergency fund"
                            className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                          />
                          <button
                            onClick={() => setBillSmallGoals(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Target:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.targetStr || ''}
                              onChange={(e) => {
                                setBillSmallGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], target: parseFloat(e.target.value) || 0, targetStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-24 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Saved:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.currentStr || ''}
                              onChange={(e) => {
                                setBillSmallGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], current: parseFloat(e.target.value) || 0, currentStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-24 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                          {target > 0 && (
                            <span className={`text-sm font-medium ${progress >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                              {progress.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {target > 0 && (
                          <div className="pl-6">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setBillSmallGoals(prev => [...prev, { name: '', target: 0, targetStr: '', current: 0, currentStr: '' }])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm font-medium"
                  >
                    + Add Small Goal
                  </button>
                </div>
              </div>

              {/* Big Goals */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Big Goals</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Long-term financial targets</p>
                </div>
                <div className="p-4 space-y-4">
                  {billBigGoals.map((goal, index) => {
                    const target = goal?.target || 0;
                    const current = goal?.current || 0;
                    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                    return (
                      <div key={index} className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm font-medium">{index + 1}.</span>
                          <input
                            type="text"
                            value={goal?.name || ''}
                            onChange={(e) => {
                              setBillBigGoals(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], name: e.target.value };
                                return updated;
                              });
                            }}
                            placeholder="House deposit"
                            className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                          />
                          <button
                            onClick={() => setBillBigGoals(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Target:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.targetStr || ''}
                              onChange={(e) => {
                                setBillBigGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], target: parseFloat(e.target.value) || 0, targetStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-24 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Saved:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.currentStr || ''}
                              onChange={(e) => {
                                setBillBigGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], current: parseFloat(e.target.value) || 0, currentStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-24 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                          {target > 0 && (
                            <span className={`text-sm font-medium ${progress >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                              {progress.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {target > 0 && (
                          <div className="pl-6">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setBillBigGoals(prev => [...prev, { name: '', target: 0, targetStr: '', current: 0, currentStr: '' }])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm font-medium"
                  >
                    + Add Big Goal
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Debts Tab */}
          {billsSubTab === 'debts' && (() => {
            const personalDebts = debts.filter(d => d.type === 'personal');
            const businessDebts = debts.filter(d => d.type === 'business');
            const totalOwed = debts.reduce((sum, d) => sum + ((parseFloat(d.total) || 0) - (parseFloat(d.paid) || 0)), 0);
            const totalDebt = debts.reduce((sum, d) => sum + (parseFloat(d.total) || 0), 0);
            const totalPaid = debts.reduce((sum, d) => sum + (parseFloat(d.paid) || 0), 0);
            const overallPct = totalDebt > 0 ? Math.min((totalPaid / totalDebt) * 100, 100) : 0;

            const addDebt = (type) => {
              setDebts(prev => [...prev, {
                id: Date.now(),
                type,
                name: '',
                total: 0,
                totalStr: '',
                paid: 0,
                paidStr: '',
                minPayment: '',
                minInterval: 'month',
                startDate: '',
                dueDate: '',
                notes: ''
              }]);
            };

            const updateDebt = (id, updates) => {
              setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
            };

            const deleteDebt = (id) => {
              setDebts(prev => prev.filter(d => d.id !== id));
            };

            const renderDebtCard = (debt) => {
              const total = parseFloat(debt.total) || 0;
              const paid = parseFloat(debt.paid) || 0;
              const remaining = Math.max(total - paid, 0);
              const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

              return (
                <div key={debt.id} className="p-5 bg-gray-50 rounded-2xl space-y-4">
                  {/* Row 1: Name + Delete */}
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={debt.name}
                      onChange={(e) => updateDebt(debt.id, { name: e.target.value })}
                      placeholder="e.g. Car Loan, Credit Card, HECS..."
                      className="flex-1 px-3 py-2 border-2 rounded-xl text-sm font-medium focus:outline-none focus:border-red-500 bg-white"
                    />
                    <button onClick={() => deleteDebt(debt.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>

                  {/* Row 2: Total + Paid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Total Owed</label>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={debt.totalStr || ''}
                          onChange={(e) => updateDebt(debt.id, { total: parseFloat(e.target.value) || 0, totalStr: e.target.value })}
                          placeholder="25000"
                          className="flex-1 px-2 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Amount Paid</label>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={debt.paidStr || ''}
                          onChange={(e) => updateDebt(debt.id, { paid: parseFloat(e.target.value) || 0, paidStr: e.target.value })}
                          placeholder="5000"
                          className="flex-1 px-2 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>{Math.round(pct)}% paid off</span>
                      <span className="text-xs font-semibold text-red-500">${remaining.toLocaleString()} remaining</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-gradient-to-r from-green-400 to-green-600' : pct >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Row 4: Min Payment + Interval */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Min. Payment</label>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={debt.minPayment || ''}
                          onChange={(e) => updateDebt(debt.id, { minPayment: e.target.value })}
                          placeholder="500"
                          className="flex-1 px-2 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Per</label>
                      <select
                        value={debt.minInterval || 'month'}
                        onChange={(e) => updateDebt(debt.id, { minInterval: e.target.value })}
                        className="w-full px-2 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-white"
                      >
                        <option value="week">Week</option>
                        <option value="fortnight">Fortnight</option>
                        <option value="month">Month</option>
                        <option value="quarter">Quarter</option>
                        <option value="year">Year</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Start Date + Due Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                      <input
                        type="date"
                        value={debt.startDate || ''}
                        onChange={(e) => updateDebt(debt.id, { startDate: e.target.value })}
                        className="w-full px-2 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                      <input
                        type="date"
                        value={debt.dueDate || ''}
                        onChange={(e) => updateDebt(debt.id, { dueDate: e.target.value })}
                        className="w-full px-2 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 6: Notes */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Notes</label>
                    <input
                      type="text"
                      value={debt.notes || ''}
                      onChange={(e) => updateDebt(debt.id, { notes: e.target.value })}
                      placeholder="Extra info..."
                      className="w-full px-2 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-white"
                    />
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-6">
                {/* Overview Card */}
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-1">Debt Overview</h2>
                    <p className="text-sm text-gray-500 mb-4">Track and crush your debts</p>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-red-50 rounded-xl">
                        <p className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Total Debt</p>
                        <p className="text-lg font-bold text-red-600">${totalDebt.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <p className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Total Paid</p>
                        <p className="text-lg font-bold text-green-600">${totalPaid.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <p className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Remaining</p>
                        <p className="text-lg font-bold text-orange-600">${totalOwed.toLocaleString()}</p>
                      </div>
                    </div>
                    {totalDebt > 0 && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Overall Progress</span>
                          <span className="text-xs font-semibold">{Math.round(overallPct)}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${overallPct >= 100 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-blue-400 to-indigo-600'}`}
                            style={{ width: `${overallPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Debts */}
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">Personal Debts</h2>
                        <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>{personalDebts.length} debt{personalDebts.length !== 1 ? 's' : ''} — ${personalDebts.reduce((s, d) => s + Math.max((parseFloat(d.total) || 0) - (parseFloat(d.paid) || 0), 0), 0).toLocaleString()} remaining</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {personalDebts.map(renderDebtCard)}
                    <button
                      onClick={() => addDebt('personal')}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-500 hover:text-red-500 transition-colors text-sm font-medium"
                    >
                      + Add Personal Debt
                    </button>
                  </div>
                </div>

                {/* Business Debts */}
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b bg-purple-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">Business Debts</h2>
                        <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>{businessDebts.length} debt{businessDebts.length !== 1 ? 's' : ''} — ${businessDebts.reduce((s, d) => s + Math.max((parseFloat(d.total) || 0) - (parseFloat(d.paid) || 0), 0), 0).toLocaleString()} remaining</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {businessDebts.map(renderDebtCard)}
                    <button
                      onClick={() => addDebt('business')}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors text-sm font-medium"
                    >
                      + Add Business Debt
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Debt Payoff Calculator */}
          {billsSubTab === 'debtCalc' && (() => {
            const sortedDebts = [...debts].filter(d => d.name && ((parseFloat(d.total) || 0) - (parseFloat(d.paid) || 0)) > 0).sort((a, b) => {
              const balA = (parseFloat(a.total) || 0) - (parseFloat(a.paid) || 0);
              const balB = (parseFloat(b.total) || 0) - (parseFloat(b.paid) || 0);
              if (debtCalcMethod === 'snowball') return balA - balB;
              return (parseFloat(b.rate) || 0) - (parseFloat(a.rate) || 0);
            });
            const totalDebtCalc = sortedDebts.reduce((sum, d) => sum + Math.max((parseFloat(d.total) || 0) - (parseFloat(d.paid) || 0), 0), 0);
            const totalMinPayments = sortedDebts.reduce((sum, d) => sum + (parseFloat(d.minPayment) || 0), 0);
            return (
              <div className="space-y-6">
                <div className="rounded-3xl p-6" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)",backdropFilter:"blur(10px)"}}>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">💳 Debt Payoff Calculator</h2>
                  <div className="flex gap-3 mb-6">
                    <button onClick={() => setDebtCalcMethod('snowball')} className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${debtCalcMethod === 'snowball' ? 'text-white cyber-tab-active' : 'bg-gray-100 text-gray-600'}`}>❄️ Snowball (Smallest First)</button>
                    <button onClick={() => setDebtCalcMethod('avalanche')} className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${debtCalcMethod === 'avalanche' ? 'text-white cyber-tab-active' : 'bg-gray-100 text-gray-600'}`}>🏔️ Avalanche (Highest Rate First)</button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm" style={{color:"rgba(148,163,184,0.9)"}}>{debtCalcMethod === 'snowball' ? '❄️ Snowball: Pay minimums on everything, throw extra cash at the smallest debt first. Quick wins keep you motivated!' : '🏔️ Avalanche: Pay minimums on everything, attack the highest interest rate first. Saves you the most money mathematically!'}</p>
                  </div>
                  {sortedDebts.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No active debts found. Add debts in the Debts tab and they'll appear here!</p>
                      <button onClick={() => setBillsSubTab('debts')} className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium">Go to Debts</button>
                    </div>
                  )}
                  {sortedDebts.length > 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-red-50 rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold text-red-600">${totalDebtCalc.toLocaleString()}</div>
                          <div className="text-xs text-red-500">Total Remaining</div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold text-blue-600">{sortedDebts.length}</div>
                          <div className="text-xs text-blue-500">Active Debts</div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold text-green-600">${totalMinPayments.toLocaleString()}</div>
                          <div className="text-xs text-green-500">Min Payments/mo</div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-white">Pay-off Order ({debtCalcMethod === 'snowball' ? 'Smallest → Largest' : 'Highest Rate → Lowest'})</h3>
                      {sortedDebts.map((debt, i) => {
                        const remaining = Math.max((parseFloat(debt.total) || 0) - (parseFloat(debt.paid) || 0), 0);
                        return (
                          <div key={debt.id || i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">{i + 1}</div>
                            <div className="flex-1">
                              <div className="font-medium text-white">{debt.name}</div>
                              <div className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>{debt.rate || 0}% APR • ${debt.minPayment || 0}/mo min</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-800">${remaining.toLocaleString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  if (activeView === 'feedback') {

    const handleSendFeedback = () => {
      if (!feedbackMsg.trim()) return;
      const subject = feedbackType === 'feedback' ? 'Muzz App Feedback' : feedbackType === 'bug' ? 'Muzz Bug Report' : 'Muzz Support Request';
      const body = encodeURIComponent(`From: ${userEmail}\nType: ${feedbackType}\n\n${feedbackMsg}`);
      window.open(`mailto:Muzz.onl@outlook.com?subject=${encodeURIComponent(subject)}&body=${body}`);
      setFeedbackSent(true);
      setFeedbackMsg('');
      setTimeout(() => setFeedbackSent(false), 3000);
    };

    return (
      <div className="min-h-screen bg-transparent pb-24">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Feedback & Support</h1>
            <p className="text-white/80">We'd love to hear from you, legend.</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 -mt-6">
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <div className="flex gap-2 mb-6">
              {[{ id: 'feedback', label: '💡 Feedback', desc: 'Ideas & suggestions' }, { id: 'bug', label: '🐛 Bug Report', desc: 'Something broken?' }, { id: 'support', label: '🆘 Support', desc: 'Need help?' }].map(t => (
                <button key={t.id} onClick={() => setFeedbackType(t.id)} className={`flex-1 p-3 rounded-2xl text-center transition-all ${feedbackType === t.id ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 transition-colors'}`}>
                  <div className="text-lg font-bold">{t.label}</div>
                  <div className={`text-xs mt-1 ${feedbackType === t.id ? 'text-white/80' : 'text-gray-400'}`}>{t.desc}</div>
                </button>
              ))}
            </div>
            <textarea
              value={feedbackMsg}
              onChange={e => setFeedbackMsg(e.target.value)}
              placeholder={feedbackType === 'feedback' ? "What features would you love to see? What could be better?" : feedbackType === 'bug' ? "Describe the bug — what happened and what did you expect?" : "What do you need help with?"}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl h-40 resize-none focus:outline-none focus:border-orange-400 transition-colors text-sm"
            />
            <button onClick={handleSendFeedback} disabled={!feedbackMsg.trim()} className="w-full mt-4 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Send {feedbackType === 'feedback' ? 'Feedback' : feedbackType === 'bug' ? 'Bug Report' : 'Support Request'}
            </button>
            {feedbackSent && (
              <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-2xl text-center text-sm font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Thanks legend! Your message is on its way 🦘
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4">📬 Contact Us Directly</h3>
            <a href="mailto:Muzz.onl@outlook.com" className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-white" /></div>
              <div>
                <div className="font-medium text-white">Email Support</div>
                <div className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Muzz.onl@outlook.com</div>
              </div>
            </a>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4">❓ FAQ</h3>
            <div className="space-y-3">
              {[
                { q: "How do I upgrade to Elite?", a: "Head to the 'Upgrade to Elite' section in the sidebar. It's $4.99/month and unlocks all features!" },
                { q: "Is my data safe?", a: "Your data is stored securely in the cloud and only you can access it." },
                { q: "How do I cancel my subscription?", a: "Go to Elite Status in the sidebar and hit Cancel. You'll keep access until the end of your billing period." },
                { q: "Can I use Muzz on my phone?", a: "Yeah mate! Download Muzz from the App Store, or use it in any browser at muzz.onl." },
              ].map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors font-medium text-gray-700 text-sm">
                    <HelpCircle className="w-4 h-4 text-orange-400 flex-shrink-0" /> {faq.q}
                  </summary>
                  <div className="px-4 py-2 text-sm text-gray-500 ml-6">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // UPGRADE / ELITE STATUS VIEW
  if (activeView === 'upgrade') {
    return (
      <div className="min-h-screen bg-transparent pb-24">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-3xl mx-auto text-center">
            <svg width="64" height="80" viewBox="0 0 24 32" fill="none" className="mx-auto mb-4">
              <path d="M12 0L22 8L20 16L24 16L12 32L0 16L4 16L2 8L12 0Z" fill="url(#eliteGradBig)" />
              <path d="M12 6L16 10L14 14L17 14L12 22L7 14L10 14L8 10L12 6Z" fill="white" fillOpacity="0.9" />
              <defs><linearGradient id="eliteGradBig" x1="12" y1="0" x2="12" y2="32"><stop stopColor="#FFD700"/><stop offset="1" stopColor="#FFA500"/></linearGradient></defs>
            </svg>
            <h1 className="text-4xl font-bold text-white mb-2">{isElite ? 'Elite Member' : 'Upgrade to Elite'}</h1>
            <p className="text-white/80">{isElite ? "You've got the full Muzz experience, legend." : '$4.99/month — Unlock everything Muzz has to offer'}</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

          {/* Feature Comparison */}
          <div className="rounded-3xl overflow-hidden" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.15)"}}>
            <div className="p-6" style={{borderBottom:"1px solid rgba(0,200,255,0.1)"}}>
              <h2 className="text-xl font-semibold text-white" style={{fontFamily:"'Share Tech Mono',monospace",letterSpacing:"2px"}}>// WHAT YOU GET</h2>
            </div>
            <div>
              <div className="flex items-center px-6 py-2 sticky top-0" style={{background:"rgba(0,200,255,0.08)",borderBottom:"1px solid rgba(0,200,255,0.15)"}}>
                <span className="flex-1 text-xs font-mono" style={{color:"rgba(0,200,255,0.6)",letterSpacing:"1px"}}>FEATURE</span>
                <span className="w-16 text-center text-xs font-mono" style={{color:"rgba(148,163,184,0.6)",letterSpacing:"1px"}}>FREE</span>
                <span className="w-16 text-center text-xs font-mono" style={{color:"#f59e0b",letterSpacing:"1px"}}>ELITE</span>
              </div>
              {[
                { feature: 'Tasks & Daily Planner', free: true, elite: true },
                { feature: 'Reminders & Birthdays', free: true, elite: true },
                { feature: 'Diet (Groceries, Meals, Water)', free: true, elite: true },
                { feature: '1 Custom Category', free: true, elite: true },
                { feature: 'AI Chat (10 msgs/day)', free: true, elite: false },
                { feature: 'AI Chat (30 msgs/day)', free: false, elite: true },
                { feature: 'Health & Sleep Tracker', free: false, elite: true },
                { feature: 'Work & Timesheet', free: false, elite: true },
                { feature: 'Bills & Debt Tracker', free: false, elite: true },
                { feature: 'Assets Management', free: false, elite: true },
                { feature: 'Investment Portfolio', free: false, elite: true },
                { feature: 'Unlimited Custom Categories', free: false, elite: true },
                { feature: 'Elite Badge & Name', free: false, elite: true },
                { feature: 'Ad Free', free: false, elite: true },
              ].map((row, i) => (
                <div key={i} className="flex items-center px-6 py-3 transition-all" style={{borderBottom:"1px solid rgba(0,200,255,0.06)",background: row.elite && !row.free ? "rgba(0,200,255,0.03)" : "transparent"}}>
                  <span className="flex-1 text-sm text-white">{row.feature}</span>
                  <span className="w-16 text-center text-base">{row.free ? '✅' : <span style={{color:"rgba(239,68,68,0.7)",fontSize:"18px"}}>✕</span>}</span>
                  <span className="w-16 text-center text-base">{row.elite ? '✅' : '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Button */}
          {!isElite && (
            <div className="text-center space-y-4">
              <button
                onClick={handleUpgrade}
                className="px-8 py-4 text-white rounded-2xl text-lg font-bold transition-all hover:scale-105" style={{background:"linear-gradient(135deg,#f59e0b,#f97316)",boxShadow:"0 0 30px rgba(245,158,11,0.4), 0 4px 20px rgba(249,115,22,0.3)",border:"1px solid rgba(255,200,0,0.3)",letterSpacing:"1px",animation:"kangPulse 3s ease-in-out infinite"}}
              >
                {isNative ? 'Become Elite — $4.99/month' : 'Become Elite — $4.99/month'}
              </button>
              <p className="text-xs text-gray-400">Cancel anytime. Your data stays safe.</p>
              
              {/* Required subscription info */}
              <div className="text-xs text-gray-400 space-y-1">
                <p>Auto-renewable subscription • $4.99 AUD/month</p>
                <p>Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.</p>
              </div>
              
              {/* Restore Purchases - iOS only */}
              {isNative && (
                <button
                  onClick={handleRestorePurchases}
                  className="text-sm text-orange-500 hover:text-orange-600 underline"
                >
                  Restore Previous Purchase
                </button>
              )}
            </div>
          )}

          {/* Subscription Management for paying Elite members */}
          {isElite && !isVIP && subscriptionInfo && (
            <div className="rounded-3xl p-6 space-y-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)",backdropFilter:"blur(10px)"}}>
              <h2 className="text-xl font-semibold text-white">Subscription</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.9)"}}>Status: <span className="font-semibold text-green-600">Active</span></p>
                  {subscriptionInfo.currentPeriodEnd && (
                    <p className="text-xs text-gray-400">
                      {subscriptionInfo.cancelAtPeriodEnd 
                        ? `Cancels on ${new Date(subscriptionInfo.currentPeriodEnd * 1000).toLocaleDateString('en-AU')}`
                        : `Renews on ${new Date(subscriptionInfo.currentPeriodEnd * 1000).toLocaleDateString('en-AU')}`
                      }
                    </p>
                  )}
                </div>
                {subscriptionInfo.cancelAtPeriodEnd ? (
                  <button
                    onClick={handleReactivateSubscription}
                    className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    Reactivate
                  </button>
                ) : (
                  <button
                    onClick={handleCancelSubscription}
                    className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium hover:bg-red-100 hover:text-red-500 transition-colors"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          )}

          {/* iOS Subscription Management */}
          {isElite && !isVIP && !subscriptionInfo && isNative && (
            <div className="rounded-3xl p-6 space-y-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)",backdropFilter:"blur(10px)"}}>
              <h2 className="text-xl font-semibold text-white">Subscription</h2>
              <p className="text-sm" style={{color:"rgba(148,163,184,0.9)"}}>Status: <span className="font-semibold text-green-600">Active (Apple)</span></p>
              <p className="text-xs text-gray-400">To manage or cancel your subscription, go to your iPhone Settings → Apple ID → Subscriptions.</p>
              <button
                onClick={() => window.open('https://apps.apple.com/account/subscriptions', '_blank')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Manage Apple Subscription
              </button>
            </div>
          )}

          {isElite && isVIP && (
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-3xl p-6 text-center">
              <p className="text-amber-800 font-semibold">VIP Account — Lifetime Elite Access</p>
              <p className="text-amber-600 text-sm mt-1">You're a founder. No subscription needed, ever.</p>
            </div>
          )}

          {/* Giving Back */}
          <div className="rounded-3xl overflow-hidden" style={{border:"1px solid rgba(255,200,0,0.2)",background:"rgba(5,15,30,0.8)"}}>
            <div className="p-6 text-center" style={{background:"linear-gradient(135deg,rgba(255,180,0,0.08),rgba(255,120,0,0.05))",borderBottom:"1px solid rgba(255,200,0,0.15)"}}>
              <div className="text-3xl mb-2">💛</div>
              <h2 className="text-xl font-bold text-white mb-1" style={{letterSpacing:"1px"}}>Giving Back</h2>
              <p className="text-sm" style={{color:"rgba(255,200,100,0.7)"}}>$3 from every Elite subscription goes directly to charity</p>
            </div>
            <div style={{borderTop:"1px solid rgba(255,200,0,0.08)"}}>
              {[
                {emoji:"🎗️",name:"Endometriosis Australia",url:"https://www.endometriosisaustralia.org",color:"rgba(255,180,0,0.1)"},
                {emoji:"🧠",name:"Charlie Teo Foundation",url:"https://charlieteofoundation.org.au",color:"rgba(180,100,255,0.1)"},
                {emoji:"🏉",name:"Mark Hughes Foundation",url:"https://www.markhughesfoundation.com.au",color:"rgba(0,150,255,0.1)"},
              ].map((c,i) => (
                <div key={i} className="p-5 flex items-center gap-4" style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{background:c.color,border:"1px solid rgba(255,255,255,0.1)"}}>{c.emoji}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-white">{c.name}</div>
                    <div className="text-xs" style={{color:"rgba(148,163,184,0.7)"}}>$1 per subscription</div>
                  </div>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{color:"rgba(255,180,0,0.8)"}}>Visit</a>
                </div>
              ))}
            </div>
            <div className="p-4 text-center" style={{borderTop:"1px solid rgba(255,200,0,0.08)"}}>
              <p className="text-xs" style={{color:"rgba(148,163,184,0.5)"}}>Every Elite member helps fund research into endometriosis and brain cancer. Thank you.</p>
            </div>
          </div>

          {/* Legal Links - always visible */}
          <div className="flex justify-center gap-4 pt-4">
            <a href="https://muzz.onl/privacy.html" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-orange-500 underline">Privacy Policy</a>
            <a href="https://muzz.onl/terms.html" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-orange-500 underline">Terms of Use</a>
          </div>
        </div>
        <FloatingChat 
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          isTyping={isTyping}
          setIsTyping={setIsTyping}
          financialContext={financialContext}
          isAiLimitReached={isAiLimitReached}
          incrementAiUsage={incrementAiUsage}
          getAiRemaining={getAiRemaining}
          AI_DAILY_LIMIT={AI_DAILY_LIMIT}
          muzzPersonality={muzzPersonality}
        />
      </div>
    );
  }

  // ASSETS VIEW
  if (activeView === 'assets') {
    if (!isElite) return <LockedFeature featureName="Assets" setActiveView={setActiveView} />;
    const assetCategories = [
      { id: '', name: 'Select Type', emoji: '' },
      { id: 'property', name: 'Home', emoji: '🏠' },
      { id: 'rental', name: 'Rental Properties', emoji: '🏘️' },
      { id: 'vacation', name: 'Vacation Homes', emoji: '🏖️' },
      { id: 'land', name: 'Land', emoji: '🌳' },
      { id: 'business', name: 'Business Interest', emoji: '💼' },
      { id: 'super', name: 'Superannuation', emoji: '🏦' },
      { id: 'cash', name: 'Cash/Savings', emoji: '💵' },
      { id: 'stocks', name: 'Stocks', emoji: '📈' },
      { id: 'bonds', name: 'Bonds', emoji: '📜' },
      { id: 'mutualfunds', name: 'Mutual Funds', emoji: '📊' },
      { id: 'etfs', name: 'ETFs', emoji: '📉' },
      { id: 'crypto', name: 'Crypto', emoji: '₿' },
      { id: 'vehicle', name: 'Vehicles', emoji: '🚗' },
      { id: 'jewellery', name: 'Jewellery', emoji: '💎' },
      { id: 'art', name: 'Art', emoji: '🖼️' },
      { id: 'collectibles', name: 'Collectibles', emoji: '🏆' },
      { id: 'lifeinsurance', name: 'Life Insurance', emoji: '🛡️' },
      { id: 'loansowed', name: 'Loans Owed to You', emoji: '🤝' },
      { id: 'other', name: 'Other Assets', emoji: '📦' }
    ];

    const updateAsset = (index, field, value) => {
      setAssets(prev => {
        const updated = [...prev];
        if (!updated[index]) {
          updated[index] = { id: Date.now(), name: '', value: 0, valueStr: '', category: '' };
        }
        if (field === 'value') {
          updated[index] = { ...updated[index], value: parseFloat(value) || 0, valueStr: value };
        } else {
          updated[index] = { ...updated[index], [field]: value };
        }
        return updated;
      });
    };

    const filledAssets = assets.filter(a => a && a.value > 0);
    const totalAssets = filledAssets.reduce((sum, a) => sum + a.value, 0);

    return (
      <div className="min-h-screen bg-transparent">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px",letterSpacing:"0.5px"}}>← Back</button>
                <h1 className="text-4xl font-semibold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Assets Management</h1>
              </div>
            </div>
            {/* Sub-tabs */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button
                onClick={() => setAssetsSubTab('assets')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  assetsSubTab === 'assets'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Assets
              </button>
              <button
                onClick={() => setAssetsSubTab('goals')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  assetsSubTab === 'goals'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Goals
              </button>
              <button
                onClick={() => setAssetsSubTab('knowledge')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  assetsSubTab === 'knowledge'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Knowledge Guide
              </button>
              <button
                onClick={() => setAssetsSubTab('assetMap')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  assetsSubTab === 'assetMap'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Asset Map
              </button>
              <button
                onClick={() => setAssetsSubTab('worldMap')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  assetsSubTab === 'worldMap'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                World Map
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {assetsSubTab === 'assets' && (
            <>
              {/* Total Assets Summary */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-6 text-white">
                <p className="text-sm opacity-75 mb-1">Total Assets</p>
                <p className="text-5xl font-bold">${totalAssets.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>

              {/* Muzz Asset Comments */}
              {totalAssets > 0 && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl shadow-sm border overflow-hidden text-white">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">🦘</div>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-2">Muzz's Thoughts</h2>
                        <p className="text-amber-100">
                          {totalAssets >= 1000000000000 ? "okay you can stop adding zero's now 💀" :
                           totalAssets >= 100000000000 ? "Nah this is actually Elon 😭😭" :
                           totalAssets >= 10000000000 ? "Yo if you just give me 1% I'll be happy 🙏" :
                           totalAssets >= 1000000000 ? "Elon Musk? 😭😭" :
                           totalAssets >= 100000000 ? "You know how we have been friends for a while can I maybe..... have 10 Mill 🥺😭" :
                           totalAssets >= 10000000 ? "I reckon we chuck a mill on black 😂 (kidding ofc)" :
                           totalAssets >= 5000000 ? "Gawd 5M+, Well at least I know who I'll be calling to come out clubbing 😂" :
                           totalAssets >= 2000000 ? "🏆 $2 Mill+ club! You could buy a house in Sydney... well, maybe a parking spot. But still, massive flex! 🅿️" :
                           totalAssets >= 1000000 ? "🎉 A MILLIONAIRE! Pop the champagne! 🍾 Wait, with $1 Mill+ like this, you're probably drinking the fancy stuff already!" :
                           totalAssets >= 500000 ? "😎 $500K+! You're officially doing better than most. Time to start practicing your 'I'm not a millionaire YET' humble brag." :
                           totalAssets >= 250000 ? "🚀 Yooo W in the chattt, my boy is 1/2 way to $500,000 🔥" :
                           totalAssets >= 100000 ? "🎆 $100K+!!! Congrats Bro Six figures is no joke. You've got more assets than most people's lifetime savings. Proud of ya!" :
                           totalAssets >= 50000 ? "$50K+! That's a decent car, a chunk of a house deposit, or 50,000 $1 scratchy tickets (don't do that) 😏" :
                           totalAssets >= 10000 ? "Dammm $10K+ in assets. Remember Rome wasn't built in a day, and neither is wealth. Keep at it! 🧱" :
                           totalAssets >= 1000 ? "$1K+ is no small feat! You're planting the seeds for your money tree to grow! 🌳💸" :
                           "The fact you're tracking your assets bro means you're already ahead of most people. Keen to see the come up 😄"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assets Input */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Assets</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Property, super, cash, vehicles, etc.</p>
                </div>

            {/* Assets Cards */}
            <div className="p-4 space-y-3">
              {assets.map((asset, index) => (
                <div key={index} className="border-2 rounded-2xl p-4 bg-white">
                  {/* Row 1: Name + Delete */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-gray-400 text-sm mt-2">{index + 1}.</span>
                    <input
                      type="text"
                      value={asset?.name || ''}
                      onFocus={scrollInputIntoView}
                      onChange={(e) => updateAsset(index, 'name', e.target.value)}
                      placeholder="Asset name (e.g. House)"
                      className="flex-1 px-3 py-2 border-2 rounded-xl text-base font-medium focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => setAssets(prev => prev.filter((_, i) => i !== index))}
                      className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Row 2: Type */}
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">Type</label>
                    <select
                      value={asset?.category || ''}
                      onFocus={scrollInputIntoView}
                      onChange={(e) => updateAsset(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    >
                      {assetCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Row 3: Value + Owned For */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Value</label>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-1">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={asset?.valueStr || ''}
                          onFocus={scrollInputIntoView}
                          onChange={(e) => updateAsset(index, 'value', e.target.value)}
                          placeholder="0"
                          className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Owned For</label>
                      <input
                        type="text"
                        value={asset?.ownedFor || ''}
                        onFocus={scrollInputIntoView}
                        onChange={(e) => updateAsset(index, 'ownedFor', e.target.value)}
                        placeholder="e.g. 1y 5m"
                        className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => setAssets(prev => [...prev, { name: '', category: '', value: 0, valueStr: '', dateAdded: new Date().toISOString() }])}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm font-medium"
              >
                + Add Asset
              </button>
            </div>
          </div>

          {/* Type Breakdown */}
          {filledAssets.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-white">Breakdown by Type</h2>
                <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Click column headers to sort</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th 
                        className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => {
                          if (assetsSortBy === 'type') setAssetsSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          else { setAssetsSortBy('type'); setAssetsSortDir('asc'); }
                        }}
                      >
                        Type {assetsSortBy === 'type' && (assetsSortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => {
                          if (assetsSortBy === 'value') setAssetsSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          else { setAssetsSortBy('value'); setAssetsSortDir('asc'); }
                        }}
                      >
                        Value {assetsSortBy === 'value' && (assetsSortDir === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => {
                          if (assetsSortBy === 'percent') setAssetsSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          else { setAssetsSortBy('percent'); setAssetsSortDir('asc'); }
                        }}
                      >
                        % of Total {assetsSortBy === 'percent' && (assetsSortDir === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetCategories
                      .map(cat => ({
                        ...cat,
                        total: filledAssets.filter(a => a.category === cat.id).reduce((sum, a) => sum + a.value, 0)
                      }))
                      .filter(cat => cat.total > 0)
                      .sort((a, b) => {
                        let comparison = 0;
                        switch (assetsSortBy) {
                          case 'type':
                            comparison = a.name.localeCompare(b.name);
                            break;
                          case 'value':
                          case 'percent':
                            comparison = a.total - b.total;
                            break;
                          default:
                            comparison = a.total - b.total;
                        }
                        return assetsSortDir === 'asc' ? comparison : -comparison;
                      })
                      .map((cat, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{cat.emoji} {cat.name}</td>
                          <td className="py-3 px-4 text-right">${cat.total.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{((cat.total / totalAssets) * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50 font-bold text-indigo-900">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-right">${totalAssets.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Assets Breakdown */}
          {filledAssets.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-white">Assets Breakdown</h2>
              </div>
              
              {/* Pie Chart */}
              <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8 border-b">
                <div className="relative">
                  <svg width="220" height="220" viewBox="0 0 220 220">
                    {(() => {
                      const sortedAssets = [...filledAssets].sort((a, b) => b.value - a.value);
                      const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6', '#F97316', '#84CC16', '#06B6D4', '#A855F7', '#F43F5E', '#22C55E', '#EAB308'];
                      let cumulative = 0;
                      
                      return (
                        <>
                          {sortedAssets.map((asset, idx) => {
                            const percent = (asset.value / totalAssets) * 100;
                            const startAngle = (cumulative / 100) * 360;
                            cumulative += percent;
                            const endAngle = (cumulative / 100) * 360;
                            
                            const startRad = (startAngle - 90) * Math.PI / 180;
                            const endRad = (endAngle - 90) * Math.PI / 180;
                            const largeArc = percent > 50 ? 1 : 0;
                            
                            const x1 = 110 + 80 * Math.cos(startRad);
                            const y1 = 110 + 80 * Math.sin(startRad);
                            const x2 = 110 + 80 * Math.cos(endRad);
                            const y2 = 110 + 80 * Math.sin(endRad);
                            
                            return (
                              <path
                                key={idx}
                                d={`M 110 110 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={colors[idx % colors.length]}
                              />
                            );
                          })}
                          <circle cx="110" cy="110" r="50" fill="white" />
                          <text x="110" y="105" textAnchor="middle" className="text-lg font-bold fill-gray-700">
                            {filledAssets.length}
                          </text>
                          <text x="110" y="125" textAnchor="middle" className="text-xs fill-gray-500">
                            assets
                          </text>
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {(() => {
                    const sortedAssets = [...filledAssets].sort((a, b) => b.value - a.value);
                    const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6', '#F97316', '#84CC16', '#06B6D4', '#A855F7', '#F43F5E', '#22C55E', '#EAB308'];
                    
                    return sortedAssets.map((asset, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                        <span className="text-gray-700">{asset.name}</span>
                        <span className="text-gray-500">({((asset.value / totalAssets) * 100).toFixed(1)}%)</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-semibold">Asset</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-right py-3 px-4 font-semibold">Value</th>
                      <th className="text-right py-3 px-4 font-semibold">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filledAssets].sort((a, b) => a.value - b.value).map((asset, idx) => {
                      const cat = assetCategories.find(c => c.id === asset.category) || { emoji: '', name: 'Select Type' };
                      return (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{asset.name}</td>
                          <td className="py-3 px-4 text-gray-600">{cat.emoji} {cat.name}</td>
                          <td className="py-3 px-4 text-right">${asset.value.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{((asset.value / totalAssets) * 100).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50 font-bold text-indigo-900">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4 text-right">${totalAssets.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
            </>
          )}

          {assetsSubTab === 'goals' && (
            <>
              {/* Small Goals */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Small Goals</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Short-term savings targets</p>
                </div>
                <div className="p-4 space-y-4">
                  {smallGoals.map((goal, index) => {
                    const target = goal?.target || 0;
                    const current = goal?.current || 0;
                    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                    return (
                      <div key={index} className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm font-medium">{index + 1}.</span>
                          <input
                            type="text"
                            value={goal?.name || ''}
                            onChange={(e) => {
                              setSmallGoals(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], name: e.target.value };
                                return updated;
                              });
                            }}
                            placeholder="Holiday fund"
                            className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                          />
                          <button
                            onClick={() => setSmallGoals(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Target:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.targetStr || ''}
                              onChange={(e) => {
                                setSmallGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], target: parseFloat(e.target.value) || 0, targetStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-24 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Saved:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.currentStr || ''}
                              onChange={(e) => {
                                setSmallGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], current: parseFloat(e.target.value) || 0, currentStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-24 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                          {target > 0 && (
                            <span className={`text-sm font-medium ${progress >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                              {progress.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {target > 0 && (
                          <div className="pl-6">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setSmallGoals(prev => [...prev, { name: '', target: 0, targetStr: '', current: 0, currentStr: '' }])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm font-medium"
                  >
                    + Add Small Goal
                  </button>
                </div>
              </div>

              {/* Big Goals */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Big Goals</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Long-term wealth targets</p>
                </div>
                <div className="p-4 space-y-4">
                  {bigGoals.map((goal, index) => {
                    const target = goal?.target || 0;
                    const current = goal?.current || 0;
                    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                    return (
                      <div key={index} className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm font-medium">{index + 1}.</span>
                          <input
                            type="text"
                            value={goal?.name || ''}
                            onChange={(e) => {
                              setBigGoals(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], name: e.target.value };
                                return updated;
                              });
                            }}
                            placeholder="House deposit"
                            className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                          />
                          <button
                            onClick={() => setBigGoals(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Target:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.targetStr || ''}
                              onChange={(e) => {
                                setBigGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], target: parseFloat(e.target.value) || 0, targetStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-28 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Saved:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.currentStr || ''}
                              onChange={(e) => {
                                setBigGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], current: parseFloat(e.target.value) || 0, currentStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-28 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
                            />
                          </div>
                          {target > 0 && (
                            <span className={`text-sm font-medium ${progress >= 100 ? 'text-green-600' : 'text-indigo-600'}`}>
                              {progress.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {target > 0 && (
                          <div className="pl-6">
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setBigGoals(prev => [...prev, { name: '', target: 0, targetStr: '', current: 0, currentStr: '' }])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm font-medium"
                  >
                    + Add Big Goal
                  </button>
                </div>
              </div>
            </>
          )}

          {assetsSubTab === 'knowledge' && (
            <>
              {/* Muzz's Knowledge Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🦘</div>
                  <div>
                    <h2 className="text-2xl font-bold">Muzz's Knowledge Corner</h2>
                    <p className="text-amber-100">Wisdom from the legends to help you build wealth</p>
                  </div>
                </div>
              </div>

              {/* The 3 Asset Categories */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">📚 The 3 Asset Categories (Buffett's Framework)</h2>
                  <p className="text-sm text-gray-500 mt-1">Warren Buffett explains that all investments fall into one of three buckets</p>
                </div>
                <div className="p-6 space-y-6">
                  
                  {/* Category 1 */}
                  <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">💵</span>
                      <h3 className="text-lg font-bold text-red-800">Category 1: Currency-Based Investments</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Cash, bonds, money-market funds, T-bills, mortgages, bank deposits</p>
                    <div className="bg-white rounded-xl p-4 border border-red-100">
                      <p className="text-red-700 font-semibold mb-2">⚠️ Buffett's View: "These are the most dangerous long-term assets"</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Even though they feel "safe," they silently destroy purchasing power</li>
                        <li>• Governments control currency → inflation is inevitable</li>
                        <li>• Interest payments rarely keep up after taxes</li>
                        <li>• Since 1965: The USD has lost 86% of its value</li>
                      </ul>
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm italic text-red-800">"The implicit inflation tax was more than triple the explicit income tax." — Buffett</p>
                      </div>
                    </div>
                  </div>

                  {/* Category 2 */}
                  <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🪙</span>
                      <h3 className="text-lg font-bold text-yellow-800">Category 2: Non-Productive Assets</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Gold, crypto, collectibles, tulips, etc.</p>
                    <div className="bg-white rounded-xl p-4 border border-yellow-100">
                      <p className="text-yellow-700 font-semibold mb-2">⚠️ Buffett's View: "These assets will never produce anything"</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Their value is based solely on someone else paying more later</li>
                        <li>• Driven by fear, bandwagon psychology, and hope</li>
                        <li>• Require an expanding pool of buyers</li>
                      </ul>
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-semibold text-yellow-800 mb-2">Buffett's "Pile A vs Pile B" comparison:</p>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="bg-yellow-100 p-3 rounded-lg">
                            <p className="font-bold">PILE A: All the gold in the world</p>
                            <p className="text-gray-600">170,000 metric tons worth $9.6T</p>
                            <p className="text-gray-600">Produces NOTHING forever</p>
                          </div>
                          <div className="bg-green-100 p-3 rounded-lg">
                            <p className="font-bold">PILE B: What $9.6T could buy</p>
                            <p className="text-gray-600">All U.S. farmland + 16 Exxon Mobils + $1T cash</p>
                            <p className="text-gray-600">Produces trillions in value</p>
                          </div>
                        </div>
                        <p className="text-sm italic text-yellow-800 mt-2">"Can you imagine an investor choosing pile A over pile B?" — Buffett</p>
                      </div>
                    </div>
                  </div>

                  {/* Category 3 */}
                  <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🏭</span>
                      <h3 className="text-lg font-bold text-green-800">Category 3: Productive Assets ⭐ BUFFETT'S PICK</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Businesses, farms, real estate</p>
                    <div className="bg-white rounded-xl p-4 border border-green-100">
                      <p className="text-green-700 font-semibold mb-2">✅ Buffett's Strong Preference: "The ONLY category Berkshire overwhelmingly prefers"</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Generate cash & produce goods</li>
                        <li>• Increase output over time</li>
                        <li>• Respond well to inflation (prices rise with costs)</li>
                        <li>• Require minimal new capital (the best businesses)</li>
                        <li>• Compound earnings for owners</li>
                      </ul>
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-semibold text-green-800 mb-2">🐄 Buffett's "Cows and Milk" Metaphor:</p>
                        <p className="text-sm italic text-green-800">"Businesses are like cows. They will live for centuries and give ever-increasing quantities of milk. Your job is to own more cows, let them produce more milk, and let the milk compound."</p>
                      </div>
                      <div className="mt-3 p-3 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-800"><span className="font-bold">Examples:</span> Coca-Cola, See's Candy, farms, real estate, Berkshire's businesses</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Table */}
                  <div className="bg-gray-50 rounded-2xl p-5 border">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Buffett's Final Verdict</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-semibold">Category</th>
                            <th className="text-left py-2 px-3 font-semibold">Examples</th>
                            <th className="text-left py-2 px-3 font-semibold">Buffett's View</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b bg-red-50">
                            <td className="py-2 px-3 font-medium">1. Currency-based</td>
                            <td className="py-2 px-3 text-gray-600">Cash, bonds, bills</td>
                            <td className="py-2 px-3 text-red-700">Safest-feeling, but long-term wealth destroyers</td>
                          </tr>
                          <tr className="border-b bg-yellow-50">
                            <td className="py-2 px-3 font-medium">2. Non-productive</td>
                            <td className="py-2 px-3 text-gray-600">Gold, crypto, collectibles</td>
                            <td className="py-2 px-3 text-yellow-700">Speculative, require new buyers, produce nothing</td>
                          </tr>
                          <tr className="bg-green-50">
                            <td className="py-2 px-3 font-medium">3. Productive assets</td>
                            <td className="py-2 px-3 text-gray-600">Businesses, farms, real estate</td>
                            <td className="py-2 px-3 text-green-700 font-semibold">Only REAL wealth creators — by far the safest ✅</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                      <p className="text-green-800 font-semibold italic">"Over any extended period of time, this category will be the runaway winner. More important, it will be by far the safest." — Warren Buffett</p>
                    </div>
                  </div>

                </div>
              </div>

            </>
          )}

          {/* Asset Map */}
          {assetsSubTab === 'assetMap' && (() => {
            const getChildren = (parentId) => assetMapNodes.filter(n => n.parentId === parentId);
            const addChild = (parentId) => {
              setAssetMapNodes(prev => [...prev, { id: Date.now().toString(), name: '', emoji: '📁', parentId }]);
            };
            const addSibling = (nodeId) => {
              const node = assetMapNodes.find(n => n.id === nodeId);
              if (!node) return;
              setAssetMapNodes(prev => [...prev, { id: Date.now().toString(), name: '', emoji: '📁', parentId: node.parentId }]);
            };
            const addSiblingLeft = (nodeId) => {
              const node = assetMapNodes.find(n => n.id === nodeId);
              if (!node) return;
              const newNode = { id: Date.now().toString(), name: '', emoji: '📁', parentId: node.parentId };
              setAssetMapNodes(prev => {
                const idx = prev.findIndex(n => n.id === nodeId);
                const updated = [...prev];
                updated.splice(idx, 0, newNode);
                return updated;
              });
            };
            const updateNode = (id, field, value) => {
              setAssetMapNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
            };
            const deleteNode = (id) => {
              const toDelete = new Set();
              const findDescendants = (nodeId) => {
                toDelete.add(nodeId);
                assetMapNodes.filter(n => n.parentId === nodeId).forEach(n => findDescendants(n.id));
              };
              findDescendants(id);
              setAssetMapNodes(prev => prev.filter(n => !toDelete.has(n.id)));
            };

            const renderTree = (node) => {
              const children = getChildren(node.id);

              return (
                <div key={node.id} className="flex flex-col items-center" style={{ minWidth: '140px' }}>
                  {/* The node box */}
                  <div className="relative mb-1">
                    <div className="border border-gray-500 rounded-lg px-4 py-2.5 text-center whitespace-nowrap" style={{ backgroundColor: 'rgba(30,41,59,0.9)' }}>
                      <input
                        type="text"
                        value={node.name || ''}
                        onChange={(e) => updateNode(node.id, 'name', e.target.value)}
                        placeholder="Name..."
                        className="bg-transparent text-center font-medium text-sm focus:outline-none"
                        style={{ color: '#e2e8f0', width: `${Math.max((node.name || '').length, 6) * 8 + 20}px`, maxWidth: '250px' }}
                      />
                    </div>
                    {showMapControls && (
                      <div className="flex justify-center gap-0.5 mt-1">
                        <button onClick={() => addSiblingLeft(node.id)} className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-[8px]">←</button>
                        <button onClick={() => addChild(node.id)} className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[8px]">↓</button>
                        <button onClick={() => addSibling(node.id)} className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-[8px]">→</button>
                        <button onClick={() => deleteNode(node.id)} className="w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px]">×</button>
                      </div>
                    )}
                  </div>

                  {/* Children */}
                  {children.length > 0 && (
                    <>
                      <div className="w-px bg-gray-500" style={{ height: '30px' }} />
                      {children.length > 1 && (
                        <div className="relative w-full flex justify-center">
                          <div className="bg-gray-500" style={{ height: '1px', width: '100%' }} />
                        </div>
                      )}
                      <div className="flex justify-center" style={{ gap: '24px' }}>
                        {children.map(child => (
                          <div key={child.id} className="flex flex-col items-center">
                            <div className="w-px bg-gray-500" style={{ height: '30px' }} />
                            {renderTree(child)}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            };

            const rootNodes = assetMapNodes.filter(n => n.parentId === null);

            return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">🗺️ Asset Map</h2>
                    <p className="text-blue-200 text-sm">Map out your financial structure</p>
                  </div>
                  <button
                    onClick={() => setShowMapControls(!showMapControls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${showMapControls ? 'bg-white/20 text-white' : 'bg-white text-blue-600'}`}
                  >
                    {showMapControls ? '👁 Hide Controls' : '✏️ Edit'}
                  </button>
                </div>

                {rootNodes.length === 0 && (
                  <button
                    onClick={() => setAssetMapNodes([{ id: 'root', name: 'My Assets', emoji: '🏠', parentId: null }])}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-medium"
                  >+ Create Asset Map</button>
                )}

                <div className="rounded-2xl shadow-sm border p-6 overflow-x-auto" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}>
                  <div className="flex justify-center min-w-fit">
                    <div className="flex gap-8">
                      {rootNodes.map(root => renderTree(root))}
                    </div>
                  </div>
                </div>

                {showMapControls && (
                  <button
                    onClick={() => setAssetMapNodes(prev => [...prev, { id: Date.now().toString(), name: '', emoji: '🏠', parentId: null }])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm font-medium"
                  >
                    + Add Root Node
                  </button>
                )}
              </div>
            );
          })()}

          {/* World Map */}
          {assetsSubTab === 'worldMap' && (() => {
            const pinColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

            const removeMapPin = (pinId) => {
              const el = document.getElementById('world-map-container');
              if (el && el._leaflet_map && el._markers) {
                const markerEntry = el._markers[pinId];
                if (markerEntry) {
                  el._leaflet_map.removeLayer(markerEntry.marker);
                  if (markerEntry.circle) el._leaflet_map.removeLayer(markerEntry.circle);
                  delete el._markers[pinId];
                }
              }
              setMapPins(prev => prev.filter(p => p.id !== pinId));
            };

            const updateMapPin = (pinId, field, value) => {
              setMapPins(prev => prev.map(p => p.id === pinId ? { ...p, [field]: value } : p));
              
              const el = document.getElementById('world-map-container');
              if (!el || !el._leaflet_map || !el._markers || !el._markers[pinId]) return;
              const L = window.L;
              const entry = el._markers[pinId];
              const pin = mapPins.find(p => p.id === pinId);
              if (!pin) return;

              const updatedPin = { ...pin, [field]: value };

              if (field === 'color') {
                // Remove old marker, add new one with new colour
                const latlng = entry.marker.getLatLng();
                el._leaflet_map.removeLayer(entry.marker);
                const newMarker = L.marker(latlng, {
                  icon: L.divIcon({
                    className: '',
                    html: `<div style="width:24px;height:24px;background:${value};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                  })
                }).addTo(el._leaflet_map);
                newMarker.bindPopup(`<b>${updatedPin.title || 'Untitled'}</b><br/>${updatedPin.notes || ''}`);
                entry.marker = newMarker;
                // Update circle colour too
                if (entry.circle) {
                  entry.circle.setStyle({ color: value, fillColor: value });
                }
              }

              if (field === 'radius') {
                const latlng = entry.marker.getLatLng();
                const radiusKm = parseFloat(value) || 0;
                // Remove old circle
                if (entry.circle) {
                  el._leaflet_map.removeLayer(entry.circle);
                  entry.circle = null;
                }
                // Add new circle if radius > 0
                if (radiusKm > 0) {
                  const color = updatedPin.color || '#3B82F6';
                  entry.circle = L.circle(latlng, { radius: radiusKm * 1000, color: color, fillColor: color, fillOpacity: 0.1, weight: 2 }).addTo(el._leaflet_map);
                }
              }

              if (field === 'title' || field === 'notes') {
                entry.marker.setPopupContent(`<b>${updatedPin.title || 'Untitled'}</b><br/>${updatedPin.notes || ''}`);
              }
            };

            return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold mb-1">🌍 World Map</h2>
                  <p className="text-emerald-200 text-sm">Tap anywhere on the map to drop a pin</p>
                </div>

                <div className="rounded-2xl shadow-sm border overflow-hidden relative" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1 }}>
                  <div
                    id="world-map-container"
                    ref={(el) => {
                      if (!el || el._leaflet_init) return;
                      el._leaflet_init = true;
                      el._markers = {};
                      
                      if (!document.getElementById('leaflet-css')) {
                        const link = document.createElement('link');
                        link.id = 'leaflet-css';
                        link.rel = 'stylesheet';
                        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
                        document.head.appendChild(link);
                      }

                      const initMap = () => {
                        if (!window.L) return;
                        const L = window.L;
                        const map = L.map(el, { zoomControl: true }).setView([-27.47, 153.02], 4);
                        
                        // English-only tiles from CartoDB
                        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                          attribution: '© OpenStreetMap © CARTO',
                          subdomains: 'abcd',
                          maxZoom: 19
                        }).addTo(map);
                        
                        el._leaflet_map = map;

                        const createMarkerIcon = (color) => {
                          return L.divIcon({
                            className: '',
                            html: `<div style="width:24px;height:24px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                          });
                        };

                        // Add existing pins
                        mapPins.forEach(pin => {
                          const color = pin.color || '#3B82F6';
                          const marker = L.marker([pin.lat, pin.lng], { icon: createMarkerIcon(color) }).addTo(map);
                          marker.bindPopup(`<b>${pin.title || 'Untitled'}</b><br/>${pin.notes || ''}`);
                          let circle = null;
                          if (pin.radius && pin.radius > 0) {
                            circle = L.circle([pin.lat, pin.lng], { radius: pin.radius * 1000, color: color, fillColor: color, fillOpacity: 0.1, weight: 2 }).addTo(map);
                          }
                          el._markers[pin.id] = { marker, circle };
                        });

                        // Click to add pin
                        map.on('click', (e) => {
                          const { lat, lng } = e.latlng;
                          const title = prompt('Pin name:');
                          if (title !== null) {
                            const notes = prompt('Notes (optional):') || '';
                            const color = '#3B82F6';
                            const newPin = { id: Date.now().toString(), lat, lng, title: title || 'Untitled', notes, color, radius: 0 };
                            setMapPins(prev => [...prev, newPin]);
                            const marker = L.marker([lat, lng], { icon: createMarkerIcon(color) }).addTo(map);
                            marker.bindPopup(`<b>${newPin.title}</b><br/>${newPin.notes}`);
                            el._markers[newPin.id] = { marker, circle: null };
                          }
                        });
                      };

                      if (window.L) {
                        setTimeout(initMap, 100);
                      } else {
                        const script = document.createElement('script');
                        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
                        script.onload = () => setTimeout(initMap, 100);
                        document.body.appendChild(script);
                      }
                    }}
                    style={{ height: '500px', width: '100%', borderRadius: '16px' }}
                  />
                </div>

                {/* Pins List */}
                {mapPins.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="px-4 py-3 bg-emerald-50 border-b">
                      <h3 className="font-semibold text-emerald-700">📍 Your Pins ({mapPins.length})</h3>
                    </div>
                    <div className="divide-y">
                      {mapPins.map(pin => (
                        <div key={pin.id} className="px-4 py-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: pin.color || '#3B82F6', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', flexShrink: 0 }} />
                            <div className="flex-1">
                              <input
                                type="text"
                                value={pin.title}
                                onChange={(e) => updateMapPin(pin.id, 'title', e.target.value)}
                                className="font-medium text-sm bg-transparent focus:outline-none w-full"
                              />
                              <input
                                type="text"
                                value={pin.notes || ''}
                                onChange={(e) => updateMapPin(pin.id, 'notes', e.target.value)}
                                placeholder="Add notes..."
                                className="text-xs text-gray-500 bg-transparent focus:outline-none w-full"
                              />
                            </div>
                            <button onClick={() => removeMapPin(pin.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Colour picker + Radius */}
                          <div className="flex items-center gap-2 pl-8">
                            <div className="flex gap-1">
                              {pinColors.map(c => (
                                <button
                                  key={c}
                                  onClick={() => updateMapPin(pin.id, 'color', c)}
                                  className="w-5 h-5 rounded-full transition-transform"
                                  style={{ backgroundColor: c, border: pin.color === c ? '2px solid white' : '2px solid transparent', transform: pin.color === c ? 'scale(1.2)' : 'scale(1)' }}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <span className="text-[10px] text-gray-400">Radius:</span>
                              <input
                                type="text"
                                value={pin.radius || ''}
                                onChange={(e) => updateMapPin(pin.id, 'radius', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-12 text-xs text-center bg-gray-100 rounded px-1 py-0.5 focus:outline-none"
                              />
                              <span className="text-[10px] text-gray-400">km</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mapPins.length === 0 && (
                  <div className="bg-white rounded-2xl p-8 shadow-sm border text-center">
                    <div className="text-4xl mb-3">🌏</div>
                    <p className="text-gray-500 text-sm">Tap anywhere on the map to drop your first pin!</p>
                    <p className="text-gray-400 text-xs mt-1">Mark properties, travel goals, investment locations — anything</p>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>
    );
  }

  if (activeView === 'investments') {
    if (!isElite) return <LockedFeature featureName="Investments" setActiveView={setActiveView} />;
    const industries = [
      { id: '', name: 'Select Type' },
      { id: 'Aerospace', name: 'Aerospace' },
      { id: 'Airlines', name: 'Airlines' },
      { id: 'Automakers', name: 'Automakers' },
      { id: 'Banks', name: 'Banks' },
      { id: 'Beverages', name: 'Beverages' },
      { id: 'Biotech', name: 'Biotech' },
      { id: 'Building Materials', name: 'Building Materials' },
      { id: 'Chemicals', name: 'Chemicals' },
      { id: 'Clothing', name: 'Clothing' },
      { id: 'Conglomerate', name: 'Conglomerate' },
      { id: 'Construction', name: 'Construction' },
      { id: 'Consumer Goods', name: 'Consumer Goods' },
      { id: 'Cosmetics & Beauty', name: 'Cosmetics & Beauty' },
      { id: 'Courier', name: 'Courier' },
      { id: 'Cruise Lines', name: 'Cruise Lines' },
      { id: 'Crypto Exchanges', name: 'Crypto Exchanges' },
      { id: 'Defense Contractors', name: 'Defense Contractors' },
      { id: 'Electricity', name: 'Electricity' },
      { id: 'Electronics', name: 'Electronics' },
      { id: 'Energy', name: 'Energy' },
      { id: 'Engineering', name: 'Engineering' },
      { id: 'Entertainment', name: 'Entertainment' },
      { id: 'ETF/Index', name: 'ETF/Index' },
      { id: 'Financial Services', name: 'Financial Services' },
      { id: 'Food', name: 'Food' },
      { id: 'Healthcare', name: 'Healthcare' },
      { id: 'Hotels', name: 'Hotels' },
      { id: 'Insurance', name: 'Insurance' },
      { id: 'Internet', name: 'Internet' },
      { id: 'Investment', name: 'Investment' },
      { id: 'Luxury Goods', name: 'Luxury Goods' },
      { id: 'Manufacturing', name: 'Manufacturing' },
      { id: 'Media/Press', name: 'Media/Press' },
      { id: 'Mining', name: 'Mining' },
      { id: 'Oil & Gas', name: 'Oil & Gas' },
      { id: 'Pharmaceuticals', name: 'Pharmaceuticals' },
      { id: 'Professional Services', name: 'Professional Services' },
      { id: 'Railways', name: 'Railways' },
      { id: 'Real Estate', name: 'Real Estate' },
      { id: 'REITs', name: 'REITs' },
      { id: 'Retail', name: 'Retail' },
      { id: 'Semiconductors', name: 'Semiconductors' },
      { id: 'Software', name: 'Software' },
      { id: 'Stock Exchanges', name: 'Stock Exchanges' },
      { id: 'Technology', name: 'Technology' },
      { id: 'Telecommunication', name: 'Telecommunication' },
      { id: 'Tobacco', name: 'Tobacco' },
      { id: 'Transportation', name: 'Transportation' },
      { id: 'Travel', name: 'Travel' },
      { id: 'Utility', name: 'Utility' },
      { id: 'Video Games', name: 'Video Games' },
      { id: 'Waste & Recycling', name: 'Waste & Recycling' },
      { id: 'Wholesale', name: 'Wholesale' },
      { id: 'Other', name: 'Other' }
    ];

    const updateStock = (index, field, value) => {
      setStocks(prev => {
        const updated = [...prev];
        if (!updated[index]) {
          updated[index] = { id: Date.now(), name: '', invested: 0, investedStr: '', currentValue: 0, currentValueStr: '', industry: '' };
        }
        if (field === 'invested') {
          updated[index] = { ...updated[index], invested: parseFloat(value) || 0, investedStr: value };
        } else if (field === 'currentValue') {
          updated[index] = { ...updated[index], currentValue: parseFloat(value) || 0, currentValueStr: value };
        } else {
          updated[index] = { ...updated[index], [field]: value };
        }
        return updated;
      });
    };

    const filledStocks = stocks.filter(s => s && (s.invested > 0 || s.currentValue > 0));
    const totalStocksValue = filledStocks.reduce((sum, s) => sum + s.currentValue, 0);
    const totalStocksInvested = filledStocks.reduce((sum, s) => sum + s.invested, 0);
    const totalGainLoss = totalStocksValue - totalStocksInvested;
    const totalGainLossPercent = totalStocksInvested > 0 ? ((totalGainLoss / totalStocksInvested) * 100) : 0;

    const stocksByIndustry = industries
      .filter(ind => ind.id)
      .map(ind => ({
        name: ind.name,
        total: filledStocks.filter(s => s.industry === ind.id).reduce((sum, s) => sum + s.currentValue, 0),
        stocks: filledStocks.filter(s => s.industry === ind.id)
      }))
      .filter(ind => ind.total > 0)
      .sort((a, b) => b.total - a.total);

    const yearlyContrib = parseFloat(investmentSettings.yearlyContribution) || 0;
    const growthRate = parseFloat(investmentSettings.expectedGrowthRate) || 7;
    const years = parseInt(investmentSettings.yearsToProject) || 10;
    
    const projections = [];
    let projectedValue = totalStocksValue;
    for (let i = 1; i <= years; i++) {
      projectedValue = (projectedValue + yearlyContrib) * (1 + growthRate / 100);
      projections.push({ year: i, value: projectedValue });
    }

    return (
      <div className="min-h-screen bg-transparent">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px",letterSpacing:"0.5px"}}>← Back</button>
                <h1 className="text-4xl font-semibold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Investments Management</h1>
              </div>
            </div>
            {/* Sub-tabs - scrollable on mobile */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-2 px-2">
              <button
                onClick={() => setInvestmentsSubTab('portfolio')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'portfolio'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Current Portfolio
              </button>
              <button
                onClick={() => setInvestmentsSubTab('futurePortfolio')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'futurePortfolio'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Future Portfolio
              </button>
              <button
                onClick={() => setInvestmentsSubTab('research')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  (investmentsSubTab === 'research' || investmentsSubTab === 'declined' || investmentsSubTab === 'economics' || investmentsSubTab === 'risks')
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Research
              </button>
              <button
                onClick={() => setInvestmentsSubTab('goals')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'goals'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Goals
              </button>
              <button
                onClick={() => setInvestmentsSubTab('notes')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'notes'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setInvestmentsSubTab('knowledge')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  (investmentsSubTab === 'knowledge' || investmentsSubTab === 'books')
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Knowledge Guide
              </button>
              <button
                onClick={() => setInvestmentsSubTab('accounting')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'accounting'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Accounting
              </button>
              <button
                onClick={() => setInvestmentsSubTab('sp500')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'sp500'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                S&P 500
              </button>
              <button
                onClick={() => setInvestmentsSubTab('compound')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'compound'
                    ? 'text-white cyber-tab-active'
                    : 'text-slate-400 hover:text-slate-200 transition-colors'
                }`}
              >
                Compound Calc
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {investmentsSubTab === 'portfolio' && (
            <>
              {/* Daily Investment Quote */}
              {(() => {
                const quotes = [
                  { author: "Warren Buffett", quote: "Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1." },
                  { author: "Benjamin Graham", quote: "Price is what you pay. Value is what you get." },
                  { author: "John Bogle", quote: "Don't look for the needle in the haystack. Just buy the haystack." },
                  { author: "Charlie Munger", quote: "The big money is not in the buying and the selling, but in the waiting." },
                  { author: "Peter Lynch", quote: "Know what you own, and know why you own it." },
                  { author: "Sir John Templeton", quote: "The four most dangerous words in investing are: 'This time it's different.'" },
                  { author: "Baron Rothschild", quote: "Buy when there's blood in the streets, even if the blood is your own." },
                  { author: "Seth Klarman", quote: "The single greatest edge an investor can have is a long-term orientation." },
                  { author: "Warren Buffett", quote: "Our favorite holding period is forever." },
                  { author: "Benjamin Franklin", quote: "An investment in knowledge pays the best interest." },
                  { author: "Naval Ravikant", quote: "Compound interest is one of the most powerful forces in the universe." },
                  { author: "Howard Marks", quote: "You can't do the same things others do and expect to outperform." },
                  { author: "Peter Lynch", quote: "In this business, if you're good, you're right six times out of ten." },
                  { author: "George Soros", quote: "It's not whether you're right or wrong, but how much money you make when you're right." },
                  { author: "Warren Buffett", quote: "Risk comes from not knowing what you're doing." },
                  { author: "Charlie Munger", quote: "Invert, always invert." },
                  { author: "Benjamin Graham", quote: "The investor's chief problem—and even his worst enemy—is likely to be himself." },
                  { author: "Jack Bogle", quote: "Time is your friend; impulse is your enemy." },
                  { author: "Ray Dalio", quote: "He who lives by the crystal ball soon learns to eat ground glass." },
                  { author: "Peter Lynch", quote: "The person who turns over the most rocks wins the game." },
                  { author: "Warren Buffett", quote: "Be fearful when others are greedy and greedy when others are fearful." },
                  { author: "Shelby Davis", quote: "History is a vast library of mistakes and errors that needn't be repeated." },
                  { author: "Jim Rogers", quote: "I just wait until there is money lying in the corner, and all I have to do is go over there and pick it up." },
                  { author: "Jesse Livermore", quote: "The market is never wrong; opinions often are." },
                  { author: "Philip Fisher", quote: "The stock market is filled with individuals who know the price of everything, but the value of nothing." },
                  { author: "Warren Buffett", quote: "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price." },
                  { author: "Bill Miller", quote: "In investing, what is comfortable is rarely profitable." },
                  { author: "Mellody Hobson", quote: "The biggest risk is not taking one." },
                  { author: "Nassim Taleb", quote: "Invest in preparation, not in prediction." },
                  { author: "Peter Lynch", quote: "Go for a business any idiot can run—because sooner or later, any idiot is probably going to run it." },
                  { author: "Warren Buffett", quote: "Someone is sitting in the shade today because someone planted a tree a long time ago." },
                  { author: "Charlie Munger", quote: "Deserve what you want. The world is not yet a crazy enough place to reward a whole bunch of undeserving people." },
                  { author: "Benjamin Graham", quote: "The intelligent investor is a realist who sells to optimists and buys from pessimists." },
                  { author: "John Maynard Keynes", quote: "The market can remain irrational longer than you can remain solvent." },
                  { author: "Warren Buffett", quote: "Only when the tide goes out do you discover who's been swimming naked." },
                  { author: "Seth Klarman", quote: "Value investing is at its core the marriage of a contrarian streak and a calculator." },
                  { author: "Burton Malkiel", quote: "A blindfolded monkey throwing darts at a newspaper's financial pages could select a portfolio that would do just as well as one carefully selected by experts." },
                  { author: "Peter Lynch", quote: "If you spend more than 13 minutes analyzing economic and market forecasts, you've wasted 10 minutes." },
                  { author: "Warren Buffett", quote: "Never invest in a business you cannot understand." },
                  { author: "Thomas Phelps", quote: "Fortunes are made by buying low and selling high, but even more so by buying right and sitting tight." },
                  { author: "Paul Samuelson", quote: "Investing should be more like watching paint dry or watching grass grow." },
                  { author: "Charlie Munger", quote: "Acknowledging what you don't know is the dawning of wisdom." },
                  { author: "Ron Conway", quote: "Any time is a good time to start a company." },
                  { author: "Warren Buffett", quote: "Wide diversification is only required when investors do not understand what they are doing." },
                  { author: "Joel Greenblatt", quote: "The secret to successful investing is to figure out what something is worth and then pay a lot less for it." },
                  { author: "Nick Murray", quote: "The timing of the market is a fool's game, whereas time in the market is your greatest natural advantage." },
                  { author: "Peter Lynch", quote: "The real key to making money in stocks is not to get scared out of them." },
                  { author: "Warren Buffett", quote: "Wall Street is the only place that people ride to in a Rolls Royce to get advice from those who take the subway." },
                  { author: "Guy Spier", quote: "Check your ego at the door. The market doesn't care about your feelings." },
                  { author: "Charlie Munger", quote: "Take a simple idea and take it seriously." },
                  { author: "Morgan Housel", quote: "Wealth is what you don't see." },
                  { author: "John Bogle", quote: "The stock market is a giant distraction from the business of investing." },
                  { author: "Ray Dalio", quote: "He who lives by the crystal ball will eat shattered glass." },
                  { author: "Li Lu", quote: "The biggest investment risk is not the volatility of prices, but whether you will suffer a permanent loss of capital." },
                  { author: "Warren Buffett", quote: "The rear-view mirror is always clearer than the windshield." },
                  { author: "Jim Rohn", quote: "Formal education will make you a living; self-education will make you a fortune." },
                  { author: "Howard Marks", quote: "You can't predict. You can prepare." },
                  { author: "Peter Lynch", quote: "A share of stock is not a lottery ticket. It's part-ownership of a business." },
                  { author: "Shelby M.C. Davis", quote: "Invest for the long haul. Don't get too greedy and don't get too scared." },
                  { author: "Nathan W. Morris", quote: "Every time you borrow money, you're robbing your future self." },
                  { author: "Bernard Baruch", quote: "Don't try to buy at the bottom and sell at the top. It can't be done except by liars." },
                  { author: "John Maynard Keynes", quote: "When the facts change, I change my mind. What do you do, sir?" },
                  { author: "Morgan Housel", quote: "Having no FOMO might be the most important investing skill." },
                  { author: "George Soros", quote: "If investing is entertaining, if you're having fun, you're probably not making any money. Good investing is boring." },
                  { author: "Rene Rivkin", quote: "When buying shares, ask yourself: would you buy the whole company?" },
                  { author: "Morgan Housel", quote: "Saving money is the gap between your ego and your income." },
                  { author: "Jason Zweig", quote: "To be an investor, you must be a believer in a better tomorrow." },
                  { author: "Warren Buffett", quote: "It's only when the tide goes out that you learn who has been swimming naked." },
                  { author: "Peter Lynch", quote: "Far more money has been lost by investors preparing for corrections than has been lost in corrections themselves." },
                  { author: "Charlie Munger", quote: "The first rule of compounding: Never interrupt it unnecessarily." },
                  { author: "Bill Miller", quote: "In investing, what is comfortable is rarely profitable." },
                  { author: "Benjamin Graham", quote: "The individual investor should act consistently as an investor and not as a speculator." },
                  { author: "Paul Tudor Jones", quote: "The secret to being successful from a trading perspective is to have an indefatigable and unquenchable thirst for knowledge." },
                  { author: "Seth Klarman", quote: "Value investing is at its core the marriage of a contrarian streak and a calculator." },
                  { author: "Jim Rogers", quote: "I just wait until there is money lying in the corner, and all I have to do is go over there and pick it up." },
                  { author: "Warren Buffett", quote: "Forecasts may tell you a great deal about the forecaster; they tell you nothing about the future." },
                  { author: "Morgan Housel", quote: "Doing well with money has a little to do with how smart you are and a lot to do with how you behave." },
                  { author: "Sir John Templeton", quote: "The time of maximum pessimism is the best time to buy, and the time of maximum optimism is the best time to sell." },
                  { author: "Jeff Bezos", quote: "Given a 10% chance of a 100 times payoff, you should take that bet every time." },
                  { author: "Howard Marks", quote: "Look for bargains while others retreat." },
                  { author: "Cathie Wood", quote: "Innovation is the catalyst for long-term growth." },
                  { author: "Robert Kiyosaki", quote: "The single most powerful asset we all have is our mind. If it is trained well, it can create enormous wealth." },
                  { author: "Philip Fisher", quote: "The stock market is filled with individuals who know the price of everything, but the value of nothing." },
                  { author: "John Bogle", quote: "Time is your friend; impulse is your enemy." },
                  { author: "Jesse Livermore", quote: "There is a time to go long, a time to go short, and a time to go fishing." },
                  { author: "Shelby Davis", quote: "You make most of your money in a bear market, you just don't realize it at the time." },
                  { author: "Jack Schwager", quote: "The goal of a successful trader is to make the best trades. Money is secondary." },
                  { author: "Igor Arapov", quote: "The difference between gambling and trading is risk management." },
                  { author: "Ed Seykota", quote: "The elements of good trading are: (1) cutting losses, (2) cutting losses, and (3) cutting losses." },
                  { author: "Ray Dalio", quote: "Principles are ways of successfully dealing with reality to get what you want out of life." },
                  { author: "Peter Lynch", quote: "Behind every stock is a company. Find out what it's doing." },
                  { author: "Andrew Carnegie", quote: "Put all your eggs in one basket and then watch that basket." },
                  { author: "Morgan Housel", quote: "The hardest financial skill is getting the goalpost to stop moving." },
                  { author: "Warren Buffett", quote: "Risk comes from not knowing what you're doing." },
                  { author: "Benjamin Franklin", quote: "Beware of little expenses. A small leak will sink a great ship." },
                  { author: "Charlie Munger", quote: "Acknowledging what you don't know is the dawning of wisdom." },
                  { author: "Mellody Hobson", quote: "The biggest risk is not taking one." },
                  { author: "John Kenneth Galbraith", quote: "The function of economic forecasting is to make astrology look respectable." },
                  { author: "Christopher Davis", quote: "Miss just the 30 best days in the market over 20 years, and your returns are cut by over 80%." },
                  { author: "Warren Buffett", quote: "Take a simple idea and take it seriously." },
                ];
                const startDate = new Date('2025-01-01');
                const today = new Date();
                const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
                const quoteIndex = daysDiff % quotes.length;
                const todayQuote = quotes[quoteIndex];
                return (
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-5 text-white">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl opacity-50">"</div>
                      <div className="flex-1">
                        <p className="text-lg italic mb-2">{todayQuote.quote}</p>
                        <p className="text-sm text-slate-400">— {todayQuote.author}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-right">Quote of the Day • Day {(quoteIndex + 1)} of {quotes.length}</p>
                  </div>
                );
              })()}

              {/* Portfolio Summary */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-6 text-white">
                <p className="text-sm opacity-75 mb-1">Portfolio Value</p>
                <p className="text-5xl font-bold">${totalStocksValue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
                {totalStocksInvested > 0 && (
                  <div className="mt-2">
                    <span className={`text-lg font-semibold ${totalGainLoss >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                      {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()} ({totalGainLossPercent.toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Stocks Input */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Stocks & ETFs</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Individual stocks, ETFs, index funds</p>
                </div>

                {/* Stocks Cards */}
                <div className="p-4 space-y-3">
                  {stocks.map((stock, index) => {
                    const gainLoss = (stock?.currentValue || 0) - (stock?.invested || 0);
                    const gainLossPercent = stock?.invested > 0 ? ((gainLoss / stock.invested) * 100) : 0;
                    return (
                      <div key={index} className="border-2 rounded-2xl p-4 bg-white">
                        {/* Row 1: Name + Delete */}
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-gray-400 text-sm mt-2">{index + 1}.</span>
                          <input
                            type="text"
                            value={stock?.name || ''}
                            onFocus={scrollInputIntoView}
                            onChange={(e) => updateStock(index, 'name', e.target.value)}
                            placeholder="Stock/ETF name (e.g. VAS)"
                            className="flex-1 px-3 py-2 border-2 rounded-xl text-base font-medium focus:outline-none focus:border-green-500"
                          />
                          <button
                            onClick={() => setStocks(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Row 2: Industry */}
                        <div className="mb-3">
                          <label className="text-xs text-gray-500 mb-1 block">Industry</label>
                          <select
                            value={stock?.industry || ''}
                            onFocus={scrollInputIntoView}
                            onChange={(e) => updateStock(index, 'industry', e.target.value)}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                          >
                            {industries.map(ind => (
                              <option key={ind.id} value={ind.id}>{ind.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Row 3: Invested + Current Value */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Invested</label>
                            <div className="flex items-center">
                              <span className="text-gray-400 mr-1">$</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={stock?.investedStr || ''}
                                onFocus={scrollInputIntoView}
                                onChange={(e) => updateStock(index, 'invested', e.target.value)}
                                placeholder="0"
                                className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Current Value</label>
                            <div className="flex items-center">
                              <span className="text-gray-400 mr-1">$</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={stock?.currentValueStr || ''}
                                onFocus={scrollInputIntoView}
                                onChange={(e) => updateStock(index, 'currentValue', e.target.value)}
                                placeholder="0"
                                className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Row 4: Gain/Loss + Held For */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Gain/Loss</label>
                            <div className={`px-3 py-2 rounded-xl text-sm font-medium ${gainLoss >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {stock?.invested > 0 ? `${gainLoss >= 0 ? '+' : ''}${gainLossPercent.toFixed(1)}%` : '—'}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Held For</label>
                            <input
                              type="text"
                              value={stock?.heldFor || ''}
                              onChange={(e) => updateStock(index, 'heldFor', e.target.value)}
                              placeholder="e.g. 2y 3m"
                              className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 border-t">
                  <button
                    onClick={() => setStocks(prev => [...prev, { id: Date.now(), name: '', invested: 0, investedStr: '', currentValue: 0, currentValueStr: '', industry: '', dateAdded: new Date().toISOString() }])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors text-sm font-medium"
                  >
                    + Add Stock
                  </button>
                </div>
              </div>

              {/* Live Stock Prices */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-4 sm:p-6 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">📊 Live Stock Prices</h2>
                      <p className="text-sm text-gray-500 mt-1">Track US stocks with real-time prices & profit/loss</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {pricesLastUpdated && (
                        <span className="text-xs text-gray-400">Updated: {pricesLastUpdated}</span>
                      )}
                    <button
                      onClick={async () => {
                        const tickers = trackedStocks.filter(s => s.ticker && s.ticker.trim() !== '').map(s => s.ticker.toUpperCase());
                        if (tickers.length === 0) return;
                        setPricesLoading(true);
                        try {
                          const response = await fetch(api('/api/stocks'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tickers })
                          });
                          if (!response.ok) throw new Error('API error');
                          const data = await response.json();
                          if (data.prices) {
                            setLivePrices(data.prices);
                            setPricesLastUpdated(new Date().toLocaleTimeString());
                          }
                        } catch (err) {
                          console.error('Failed to fetch prices:', err);
                        }
                        setPricesLoading(false);
                      }}
                      disabled={pricesLoading || trackedStocks.filter(s => s.ticker && s.ticker.trim() !== '').length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {pricesLoading ? '⏳ Loading...' : '🔄 Refresh Prices'}
                    </button>
                  </div>
                </div>
                </div>
                <div className="p-6">
                  {trackedStocks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-3xl mb-2">📈</div>
                      <p className="font-medium">No stocks tracked yet</p>
                      <p className="text-sm mt-1">Add a US stock below, then hit Refresh Prices</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Summary Banner */}
                      {Object.keys(livePrices).length > 0 && (() => {
                        let totalInvested = 0;
                        let totalCurrent = 0;
                        trackedStocks.forEach(s => {
                          const ticker = s.ticker?.toUpperCase() || '';
                          const price = (ticker && livePrices[ticker]?.c) || 0;
                          const shares = parseFloat(s.shares) || 0;
                          const avg = parseFloat(s.avgCost) || 0;
                          if (price > 0 && shares > 0) {
                            totalInvested += avg * shares;
                            totalCurrent += price * shares;
                          }
                        });
                        const totalPL = totalCurrent - totalInvested;
                        const totalPLPct = totalInvested > 0 ? ((totalPL / totalInvested) * 100) : 0;
                        return totalInvested > 0 ? (
                          <div className={`p-4 rounded-2xl border-2 mb-4 ${totalPL >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase font-medium">Total Cost</div>
                                <div className="text-base sm:text-lg font-bold text-gray-800">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase font-medium">Market Value</div>
                                <div className="text-base sm:text-lg font-bold text-gray-800">${totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase font-medium">Total P/L</div>
                                <div className={`text-base sm:text-lg font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  <span className="text-xs sm:text-sm ml-1">({totalPL >= 0 ? '+' : ''}{totalPLPct.toFixed(2)}%)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Stock Cards */}
                      {trackedStocks.map((stock) => {
                        const ticker = stock.ticker?.toUpperCase() || '';
                        const priceData = ticker ? livePrices[ticker] : null;
                        const currentPrice = priceData?.c || 0;
                        const shares = parseFloat(stock.shares) || 0;
                        const avgCost = parseFloat(stock.avgCost) || 0;
                        const costBasis = shares * avgCost;
                        const marketValue = shares * currentPrice;
                        const pl = marketValue - costBasis;
                        const plPercent = costBasis > 0 ? ((pl / costBasis) * 100) : 0;
                        const dailyChange = (priceData && priceData.pc && priceData.pc > 0) ? ((priceData.c - priceData.pc) / priceData.pc * 100) : 0;

                        return (
                          <div key={stock.id} className="border-2 rounded-2xl p-4 bg-white">
                            {/* Row 1: Ticker + Delete */}
                            <div className="flex items-start gap-3 mb-3">
                              <input
                                type="text"
                                value={stock.ticker}
                                onChange={(e) => setTrackedStocks(prev => prev.map(s => s.id === stock.id ? { ...s, ticker: e.target.value.toUpperCase() } : s))}
                                placeholder="AAPL"
                                className="flex-1 px-3 py-2 border-2 rounded-xl text-base font-bold uppercase focus:outline-none focus:border-green-500"
                              />
                              <button
                                onClick={() => setTrackedStocks(prev => prev.filter(s => s.id !== stock.id))}
                                className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                            
                            {/* Row 2: Shares + Avg Cost */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Shares</label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={stock.shares}
                                  onChange={(e) => setTrackedStocks(prev => prev.map(s => s.id === stock.id ? { ...s, shares: e.target.value } : s))}
                                  placeholder="0"
                                  className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Avg Cost</label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={stock.avgCost}
                                  onChange={(e) => setTrackedStocks(prev => prev.map(s => s.id === stock.id ? { ...s, avgCost: e.target.value } : s))}
                                  placeholder="$0.00"
                                  className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                                />
                              </div>
                            </div>
                            
                            {/* Row 3: Live Price + Profit/Loss */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Live Price</label>
                                {currentPrice > 0 ? (
                                  <div className="px-3 py-2 rounded-xl bg-gray-50">
                                    <div className="text-sm font-bold">${currentPrice.toFixed(2)}</div>
                                    <div className={`text-xs font-medium ${dailyChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                      {dailyChange >= 0 ? '▲' : '▼'} {Math.abs(dailyChange).toFixed(2)}%
                                    </div>
                                  </div>
                                ) : (
                                  <div className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-sm">—</div>
                                )}
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Profit/Loss</label>
                                {currentPrice > 0 && costBasis > 0 ? (
                                  <div className={`px-3 py-2 rounded-xl ${pl >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <div className={`text-sm font-bold ${pl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                      {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                                    </div>
                                    <div className={`text-xs font-medium ${pl >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                      {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                                    </div>
                                  </div>
                                ) : (
                                  <div className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-sm">—</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Tracked Stock Button */}
                  <div className="mt-4">
                    <button
                      onClick={() => setTrackedStocks(prev => [...prev, { id: Date.now(), ticker: '', shares: '', avgCost: '' }])}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors text-sm font-medium"
                    >
                      + Add Tracked Stock
                    </button>
                  </div>

                  {/* Popular Tickers */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-400 font-medium mb-2">Quick Add Popular Tickers:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { ticker: 'SPY', name: 'S&P 500' },
                        { ticker: 'QQQ', name: 'Nasdaq' },
                        { ticker: 'DIA', name: 'Dow Jones' },
                        { ticker: 'VOO', name: 'Vanguard S&P' },
                        { ticker: 'AAPL', name: 'Apple' },
                        { ticker: 'MSFT', name: 'Microsoft' },
                        { ticker: 'GOOGL', name: 'Google' },
                        { ticker: 'AMZN', name: 'Amazon' },
                        { ticker: 'TSLA', name: 'Tesla' },
                        { ticker: 'NVDA', name: 'Nvidia' },
                        { ticker: 'META', name: 'Meta' },
                        { ticker: 'BRK.B', name: 'Berkshire' }
                      ].map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (!trackedStocks.find(t => t.ticker?.toUpperCase() === s.ticker)) {
                              setTrackedStocks(prev => [...prev, { id: Date.now() + i, ticker: s.ticker, shares: '', avgCost: '' }]);
                            }
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg hover:bg-green-50 hover:border-green-200 border text-xs transition-all"
                        >
                          <span className="font-bold text-green-600">{s.ticker}</span>
                          <span className="text-gray-400">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 mt-3">Prices from Finnhub • May be up to 15 min delayed • US stocks only</p>
                </div>
              </div>

              {/* Portfolio by Name Pie Chart */}
              {filledStocks.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-white">Portfolio by Name</h2>
                  </div>
                  <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8">
                    {/* Pie Chart */}
                    <div className="relative">
                      <svg width="250" height="250" viewBox="0 0 250 250">
                        {(() => {
                          const colors = [
                            '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
                            '#6366F1', '#EF4444', '#14B8A6', '#F97316', '#84CC16',
                            '#06B6D4', '#A855F7', '#F43F5E', '#22C55E', '#EAB308'
                          ];
                          const sortedStocks = [...filledStocks].sort((a, b) => b.currentValue - a.currentValue);
                          let cumulativePercent = 0;
                          return sortedStocks.map((stock, i) => {
                            const percent = (stock.currentValue / totalStocksValue) * 100;
                            const startAngle = cumulativePercent * 3.6 * (Math.PI / 180);
                            cumulativePercent += percent;
                            const endAngle = cumulativePercent * 3.6 * (Math.PI / 180);
                            const largeArcFlag = percent > 50 ? 1 : 0;
                            const x1 = 125 + 100 * Math.sin(startAngle);
                            const y1 = 125 - 100 * Math.cos(startAngle);
                            const x2 = 125 + 100 * Math.sin(endAngle);
                            const y2 = 125 - 100 * Math.cos(endAngle);
                            
                            if (percent === 100) {
                              return (
                                <circle
                                  key={i}
                                  cx="125"
                                  cy="125"
                                  r="100"
                                  fill={colors[i % colors.length]}
                                />
                              );
                            }
                            
                            return (
                              <path
                                key={i}
                                d={`M 125 125 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                fill={colors[i % colors.length]}
                              />
                            );
                          });
                        })()}
                        <circle cx="125" cy="125" r="50" fill="white" />
                        <text x="125" y="120" textAnchor="middle" className="text-xs fill-gray-500">{filledStocks.length} stocks</text>
                        <text x="125" y="140" textAnchor="middle" className="text-lg font-bold fill-gray-800">${(totalStocksValue / 1000).toFixed(0)}k</text>
                      </svg>
                    </div>
                    
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 max-h-48 overflow-y-auto">
                      {(() => {
                        const colors = [
                          '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
                          '#6366F1', '#EF4444', '#14B8A6', '#F97316', '#84CC16',
                          '#06B6D4', '#A855F7', '#F43F5E', '#22C55E', '#EAB308'
                        ];
                        const sortedStocks = [...filledStocks].sort((a, b) => b.currentValue - a.currentValue);
                        return sortedStocks.map((stock, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: colors[i % colors.length] }}
                            />
                            <span className="text-sm" style={{color:"rgba(148,163,184,0.9)"}}>{stock.name}</span>
                            <span className="text-sm font-medium">{((stock.currentValue / totalStocksValue) * 100).toFixed(1)}%</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio by Industry Pie Chart */}
              {stocksByIndustry.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-white">Portfolio by Industry</h2>
                  </div>
                  <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8">
                    {/* Pie Chart */}
                    <div className="relative">
                      <svg width="250" height="250" viewBox="0 0 250 250">
                        {(() => {
                          const colors = [
                            '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
                            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
                            '#14B8A6', '#A855F7', '#22C55E', '#0EA5E9', '#D946EF'
                          ];
                          let cumulativePercent = 0;
                          return stocksByIndustry.map((ind, i) => {
                            const percent = (ind.total / totalStocksValue) * 100;
                            const startAngle = cumulativePercent * 3.6 * (Math.PI / 180);
                            cumulativePercent += percent;
                            const endAngle = cumulativePercent * 3.6 * (Math.PI / 180);
                            const largeArcFlag = percent > 50 ? 1 : 0;
                            const x1 = 125 + 100 * Math.sin(startAngle);
                            const y1 = 125 - 100 * Math.cos(startAngle);
                            const x2 = 125 + 100 * Math.sin(endAngle);
                            const y2 = 125 - 100 * Math.cos(endAngle);
                            
                            if (percent === 100) {
                              return (
                                <circle
                                  key={i}
                                  cx="125"
                                  cy="125"
                                  r="100"
                                  fill={colors[i % colors.length]}
                                />
                              );
                            }
                            
                            return (
                              <path
                                key={i}
                                d={`M 125 125 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                fill={colors[i % colors.length]}
                              />
                            );
                          });
                        })()}
                        <circle cx="125" cy="125" r="50" fill="white" />
                        <text x="125" y="120" textAnchor="middle" className="text-xs fill-gray-500">Total</text>
                        <text x="125" y="140" textAnchor="middle" className="text-lg font-bold fill-gray-800">${(totalStocksValue / 1000).toFixed(0)}k</text>
                      </svg>
                    </div>
                    
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {(() => {
                        const colors = [
                          '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
                          '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
                          '#14B8A6', '#A855F7', '#22C55E', '#0EA5E9', '#D946EF'
                        ];
                        return stocksByIndustry.map((ind, i) => (
                          <div key={ind.name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: colors[i % colors.length] }}
                            />
                            <span className="text-sm" style={{color:"rgba(148,163,184,0.9)"}}>{ind.name}</span>
                            <span className="text-sm font-medium">{((ind.total / totalStocksValue) * 100).toFixed(1)}%</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio by Industry */}
              {stocksByIndustry.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-white">Portfolio by Industry</h2>
                    <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Click column headers to sort</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th 
                            className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => {
                              if (currentSortBy === 'industry') setCurrentSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              else { setCurrentSortBy('industry'); setCurrentSortDir('asc'); }
                            }}
                          >
                            Industry {currentSortBy === 'industry' && (currentSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-center py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => {
                              if (currentSortBy === 'holdings') setCurrentSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              else { setCurrentSortBy('holdings'); setCurrentSortDir('asc'); }
                            }}
                          >
                            Holdings {currentSortBy === 'holdings' && (currentSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => {
                              if (currentSortBy === 'value') setCurrentSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              else { setCurrentSortBy('value'); setCurrentSortDir('asc'); }
                            }}
                          >
                            Value {currentSortBy === 'value' && (currentSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => {
                              if (currentSortBy === 'percent') setCurrentSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              else { setCurrentSortBy('percent'); setCurrentSortDir('asc'); }
                            }}
                          >
                            % of Portfolio {currentSortBy === 'percent' && (currentSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...stocksByIndustry].sort((a, b) => {
                          let comparison = 0;
                          switch (currentSortBy) {
                            case 'industry':
                              comparison = a.name.localeCompare(b.name);
                              break;
                            case 'holdings':
                              comparison = a.stocks.length - b.stocks.length;
                              break;
                            case 'value':
                            case 'percent':
                              comparison = a.total - b.total;
                              break;
                            default:
                              comparison = b.total - a.total; // Default by value desc
                          }
                          return currentSortDir === 'asc' ? comparison : -comparison;
                        }).map(ind => (
                          <tr key={ind.name} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{ind.name}</td>
                            <td className="py-3 px-4 text-center text-gray-600">{ind.stocks.length}</td>
                            <td className="py-3 px-4 text-right">${ind.total.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-gray-600">{((ind.total / totalStocksValue) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-indigo-50 font-bold text-indigo-900">
                          <td className="py-3 px-4">Total</td>
                          <td className="py-3 px-4 text-center">{filledStocks.length}</td>
                          <td className="py-3 px-4 text-right">${totalStocksValue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* FUTURE PORTFOLIO TAB */}
          {investmentsSubTab === 'futurePortfolio' && (
            <>
              {/* Future Portfolio Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mb-6">
                <h2 className="text-2xl font-bold mb-2">🔮 Future Portfolio</h2>
                <p className="text-blue-100">Plan your future investments with full research details</p>
              </div>

              {/* Future Holdings Research - Same format as Current */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden mb-6">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Future Holdings Research</h2>
                  <p className="text-sm text-gray-500 mt-1">Research stocks you're considering for your portfolio</p>
                </div>
                <div className="p-4 space-y-3">
                  {futureResearch.map((holding, index) => (
                    <div key={index} className="border-2 rounded-2xl p-4 bg-white">
                      {/* Row 1: Ticker + Delete */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-gray-400 text-sm mt-2">{index + 1}.</span>
                        <input
                          type="text"
                          value={holding?.ticker || ''}
                          onChange={(e) => {
                            setFutureResearch(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], ticker: e.target.value };
                              return updated;
                            });
                          }}
                          placeholder="Ticker (e.g. AAPL)"
                          className="flex-1 px-3 py-2 border-2 rounded-xl text-base font-bold focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => setFutureResearch(prev => prev.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Row 2: Toll Booth + Planned Amount */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Toll Booth Economics?</label>
                          <select
                            value={holding?.tollBooth || ''}
                            onChange={(e) => {
                              setFutureResearch(prev => {
                                const updated = [...prev];
                                if (!updated[index]) updated[index] = {};
                                updated[index] = { ...updated[index], tollBooth: e.target.value };
                                return updated;
                              });
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          >
                            <option value="">Select</option>
                            <option value="Yes">✅ Yes</option>
                            <option value="No">❌ No</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Planned Investment $</label>
                          <input
                            type="text"
                            value={holding?.plannedAmountStr || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              setFutureResearch(prev => {
                                const updated = [...prev];
                                if (!updated[index]) updated[index] = {};
                                updated[index] = { ...updated[index], plannedAmount: parseFloat(val) || 0, plannedAmountStr: val };
                                return updated;
                              });
                            }}
                            placeholder="$0"
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Row 3: Capital Intensity + Growth */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Capital Intensity</label>
                          <select
                            value={holding?.capitalIntensity || ''}
                            onChange={(e) => {
                              setFutureResearch(prev => {
                                const updated = [...prev];
                                if (!updated[index]) updated[index] = {};
                                updated[index] = { ...updated[index], capitalIntensity: e.target.value };
                                return updated;
                              });
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          >
                            <option value="">Select</option>
                            <option value="Toll-Like">Toll-Like</option>
                            <option value="Lean">Lean</option>
                            <option value="Heavy">Heavy</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Growth Prospects</label>
                          <select
                            value={holding?.growthProspects || ''}
                            onChange={(e) => {
                              setFutureResearch(prev => {
                                const updated = [...prev];
                                if (!updated[index]) updated[index] = {};
                                updated[index] = { ...updated[index], growthProspects: e.target.value };
                                return updated;
                              });
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          >
                            <option value="">Select</option>
                            <option value="Very Low Growth">Very Low</option>
                            <option value="Low Growth">Low</option>
                            <option value="Medium Growth">Medium</option>
                            <option value="High Growth">High</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 4: Industry + Status */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Industry</label>
                          <select
                            value={holding?.industry || ''}
                            onChange={(e) => {
                              setFutureResearch(prev => {
                                const updated = [...prev];
                                if (!updated[index]) updated[index] = {};
                                updated[index] = { ...updated[index], industry: e.target.value };
                                return updated;
                              });
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          >
                            {industries.map(ind => (
                              <option key={ind.id} value={ind.id}>{ind.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Status</label>
                          <select
                            value={holding?.status || ''}
                            onChange={(e) => {
                              setFutureResearch(prev => {
                                const updated = [...prev];
                                if (!updated[index]) updated[index] = {};
                                updated[index] = { ...updated[index], status: e.target.value };
                                return updated;
                              });
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          >
                            <option value="">Select Status</option>
                            <option value="Old">Old</option>
                            <option value="New">New</option>
                            <option value="Reserve">Reserve</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 5: Notes */}
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Research Notes</label>
                        <textarea
                          value={holding?.notes || ''}
                          onChange={(e) => {
                            setFutureResearch(prev => {
                              const updated = [...prev];
                              if (!updated[index]) updated[index] = {};
                              updated[index] = { ...updated[index], notes: e.target.value };
                              return updated;
                            });
                          }}
                          placeholder="Your research notes..."
                          className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500 min-h-[80px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <button
                    onClick={() => setFutureResearch(prev => [...prev, { ticker: '' }])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm font-medium"
                  >
                    + Add Research Entry
                  </button>
                </div>
              </div>

              {/* Future Portfolio Summary Table */}
              {(() => {
                const filledFuture = futureResearch.filter(h => h && h.ticker);
                const totalPlanned = filledFuture.reduce((sum, h) => sum + (h.plannedAmount || 0), 0);
                
                if (filledFuture.length === 0) return null;
                
                const growthOrder = { 'High Growth': 4, 'Medium Growth': 3, 'Low Growth': 2, 'Very Low Growth': 1 };
                const statusOrder = { 'New': 3, 'Old': 2, 'Reserve': 1 };
                
                const sortedFuture = [...filledFuture].sort((a, b) => {
                  let comparison = 0;
                  switch (futureSortBy) {
                    case 'ticker':
                      comparison = (a.ticker || '').localeCompare(b.ticker || '');
                      break;
                    case 'industry':
                      comparison = (a.industry || '').localeCompare(b.industry || '');
                      break;
                    case 'tollBooth':
                      const aVal = a.tollBooth === 'Yes' ? 1 : 0;
                      const bVal = b.tollBooth === 'Yes' ? 1 : 0;
                      comparison = bVal - aVal;
                      break;
                    case 'growth':
                      comparison = (growthOrder[a.growthProspects] || 0) - (growthOrder[b.growthProspects] || 0);
                      break;
                    case 'planned':
                      comparison = (a.plannedAmount || 0) - (b.plannedAmount || 0);
                      break;
                    case 'status':
                      comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
                      break;
                    default:
                      comparison = 0;
                  }
                  return futureSortDir === 'asc' ? comparison : -comparison;
                });
                
                return (
                  <div className="bg-white rounded-3xl shadow-sm border overflow-hidden mb-6">
                    <div className="p-6 border-b">
                      <h2 className="text-xl font-semibold text-white">📋 Future Portfolio Summary</h2>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Click column headers to sort • Your planned investments at a glance</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th 
                              className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                              onClick={() => {
                                if (futureSortBy === 'ticker') setFutureSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                else { setFutureSortBy('ticker'); setFutureSortDir('asc'); }
                              }}
                            >
                              Ticker {futureSortBy === 'ticker' && (futureSortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                              onClick={() => {
                                if (futureSortBy === 'industry') setFutureSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                else { setFutureSortBy('industry'); setFutureSortDir('asc'); }
                              }}
                            >
                              Industry {futureSortBy === 'industry' && (futureSortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="text-center py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                              onClick={() => {
                                if (futureSortBy === 'tollBooth') setFutureSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                else { setFutureSortBy('tollBooth'); setFutureSortDir('asc'); }
                              }}
                            >
                              Toll Booth? {futureSortBy === 'tollBooth' && (futureSortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                              onClick={() => {
                                if (futureSortBy === 'growth') setFutureSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                else { setFutureSortBy('growth'); setFutureSortDir('asc'); }
                              }}
                            >
                              Growth {futureSortBy === 'growth' && (futureSortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                              onClick={() => {
                                if (futureSortBy === 'planned') setFutureSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                else { setFutureSortBy('planned'); setFutureSortDir('asc'); }
                              }}
                            >
                              Planned $ {futureSortBy === 'planned' && (futureSortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="text-right py-3 px-4 font-semibold">Weight %</th>
                            <th 
                              className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                              onClick={() => {
                                if (futureSortBy === 'status') setFutureSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                else { setFutureSortBy('status'); setFutureSortDir('asc'); }
                              }}
                            >
                              Status {futureSortBy === 'status' && (futureSortDir === 'asc' ? '↑' : '↓')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedFuture.map((holding, idx) => {
                            const weight = totalPlanned > 0 ? ((holding.plannedAmount || 0) / totalPlanned * 100) : 0;
                            return (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-bold">{holding.ticker}</td>
                                <td className="py-3 px-4 text-gray-500">{holding.industry || '-'}</td>
                                <td className="py-3 px-4 text-center">
                                  {holding.tollBooth === 'Yes' ? '✅' : holding.tollBooth === 'No' ? '❌' : '-'}
                                </td>
                                <td className="py-3 px-4 text-gray-600">{holding.growthProspects || '-'}</td>
                                <td className="py-3 px-4 text-right">${(holding.plannedAmount || 0).toLocaleString()}</td>
                                <td className="py-3 px-4 text-right font-semibold text-blue-600">{weight.toFixed(1)}%</td>
                                <td className="py-3 px-4 text-gray-600">{holding.status || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-blue-50 font-bold text-blue-900">
                            <td className="py-3 px-4">Total</td>
                            <td className="py-3 px-4" colSpan={3}>{filledFuture.length} stocks planned</td>
                            <td className="py-3 px-4 text-right">${totalPlanned.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">100%</td>
                            <td className="py-3 px-4"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Company Weighting Pie Chart */}
              {(() => {
                const filledFuture = futureResearch.filter(h => h && h.ticker && h.plannedAmount > 0);
                const totalAmount = filledFuture.reduce((sum, h) => sum + (h.plannedAmount || 0), 0);
                
                if (filledFuture.length === 0) return null;
                
                const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#6366F1', '#F97316', '#84CC16'];
                let currentAngle = 0;
                
                return (
                  <div className="bg-white rounded-3xl shadow-sm border overflow-hidden mb-6">
                    <div className="p-6 border-b">
                      <h2 className="text-xl font-semibold text-white">⚖️ Portfolio Company Weighting</h2>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Weight of each company in your future portfolio</p>
                    </div>
                    <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                      <svg width="200" height="200" viewBox="0 0 200 200">
                        {filledFuture.sort((a, b) => b.plannedAmount - a.plannedAmount).map((stock, idx) => {
                          const percentage = totalAmount > 0 ? (stock.plannedAmount / totalAmount) * 100 : 0;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          currentAngle += angle;
                          
                          const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                          const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                          const x2 = 100 + 80 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
                          const y2 = 100 + 80 * Math.sin((startAngle + angle - 90) * Math.PI / 180);
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          return (
                            <path
                              key={idx}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[idx % colors.length]}
                            />
                          );
                        })}
                      </svg>
                      <div className="flex-1 space-y-2">
                        {filledFuture.sort((a, b) => b.plannedAmount - a.plannedAmount).map((stock, idx) => {
                          const percentage = totalAmount > 0 ? (stock.plannedAmount / totalAmount) * 100 : 0;
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[idx % colors.length] }} />
                              <span className="text-sm text-gray-700 flex-1 font-medium">{stock.ticker}</span>
                              <span className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>${stock.plannedAmount.toLocaleString()}</span>
                              <span className="text-sm font-semibold">{percentage.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Industry Allocation Pie Chart */}
              {(() => {
                const filledFuture = futureResearch.filter(h => h && h.ticker && h.industry);
                
                const industryData = filledFuture.reduce((acc, h) => {
                  if (!acc[h.industry]) acc[h.industry] = { count: 0, amount: 0 };
                  acc[h.industry].count++;
                  acc[h.industry].amount += h.plannedAmount || 0;
                  return acc;
                }, {});
                
                const industryList = Object.entries(industryData)
                  .map(([name, data]) => ({ name, ...data }))
                  .sort((a, b) => b.count - a.count);
                
                const totalCount = industryList.reduce((sum, i) => sum + i.count, 0);
                
                if (industryList.length === 0) return null;
                
                const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#6366F1'];
                let currentAngle = 0;
                
                return (
                  <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                    <div className="p-6 border-b">
                      <h2 className="text-xl font-semibold text-white">📊 Industry Allocation</h2>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Breakdown of your future portfolio by industry</p>
                    </div>
                    <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                      <svg width="200" height="200" viewBox="0 0 200 200">
                        {industryList.map((ind, idx) => {
                          const percentage = totalCount > 0 ? (ind.count / totalCount) * 100 : 0;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          currentAngle += angle;
                          
                          const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                          const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                          const x2 = 100 + 80 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
                          const y2 = 100 + 80 * Math.sin((startAngle + angle - 90) * Math.PI / 180);
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          return (
                            <path
                              key={idx}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[idx % colors.length]}
                            />
                          );
                        })}
                      </svg>
                      <div className="flex-1 space-y-2">
                        {industryList.map((ind, idx) => {
                          const percentage = totalCount > 0 ? (ind.count / totalCount) * 100 : 0;
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[idx % colors.length] }} />
                              <span className="text-sm text-gray-700 flex-1">{ind.name}</span>
                              <span className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>{ind.count} {ind.count === 1 ? 'stock' : 'stocks'}</span>
                              <span className="text-sm font-semibold">{percentage.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {(investmentsSubTab === 'research' || investmentsSubTab === 'declined' || investmentsSubTab === 'economics' || investmentsSubTab === 'risks') && (
            <>
              {/* Inner tabs for Research sub-sections */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setInvestmentsSubTab('research')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'research'
                      ? 'text-white cyber-tab-active'
                      : 'text-slate-400 hover:text-slate-200 transition-colors'
                  }`}
                >
                  Research
                </button>
                <button
                  onClick={() => setInvestmentsSubTab('economics')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'economics'
                      ? 'text-white cyber-tab-active'
                      : 'text-slate-400 hover:text-slate-200 transition-colors'
                  }`}
                >
                  Company Economics
                </button>
                <button
                  onClick={() => setInvestmentsSubTab('risks')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'risks'
                      ? 'text-white cyber-tab-active'
                      : 'text-slate-400 hover:text-slate-200 transition-colors'
                  }`}
                >
                  Biggest Risks
                </button>
                <button
                  onClick={() => setInvestmentsSubTab('declined')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'declined'
                      ? 'text-white cyber-tab-active'
                      : 'text-slate-400 hover:text-slate-200 transition-colors'
                  }`}
                >
                  Declined Companies
                </button>
              </div>
            </>
          )}

          {investmentsSubTab === 'research' && (
            <>
              {/* Research Industry Pie Chart */}
              {(() => {
                const researchByIndustry = holdingsResearch
                  .filter(h => h && h.ticker && h.industry)
                  .reduce((acc, h) => {
                    if (!acc[h.industry]) acc[h.industry] = [];
                    acc[h.industry].push(h);
                    return acc;
                  }, {});
                
                const industryData = Object.entries(researchByIndustry)
                  .map(([industry, stocks]) => ({ name: industry, count: stocks.length }))
                  .sort((a, b) => b.count - a.count);
                
                const totalCount = industryData.reduce((sum, i) => sum + i.count, 0);
                
                if (industryData.length === 0) return null;
                
                const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#6366F1', '#F97316', '#84CC16'];
                let currentAngle = 0;
                
                return (
                  <div className="bg-white rounded-3xl shadow-sm border overflow-hidden mb-6">
                    <div className="p-6 border-b">
                      <h2 className="text-xl font-semibold text-white">📊 Research by Industry</h2>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Your research picks broken down by sector</p>
                    </div>
                    <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                      {/* Pie Chart */}
                      <svg width="200" height="200" viewBox="0 0 200 200">
                        {industryData.map((ind, idx) => {
                          const percentage = (ind.count / totalCount) * 100;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          currentAngle += angle;
                          
                          const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                          const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                          const x2 = 100 + 80 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
                          const y2 = 100 + 80 * Math.sin((startAngle + angle - 90) * Math.PI / 180);
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          return (
                            <path
                              key={idx}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[idx % colors.length]}
                            />
                          );
                        })}
                      </svg>
                      {/* Legend */}
                      <div className="flex-1 space-y-2">
                        {industryData.map((ind, idx) => {
                          const percentage = (ind.count / totalCount) * 100;
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[idx % colors.length] }} />
                              <span className="text-sm text-gray-700 flex-1">{ind.name}</span>
                              <span className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>{ind.count} picks</span>
                              <span className="text-sm font-semibold">{percentage.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Master Research Table */}
              {holdingsResearch.filter(h => h && h.ticker).length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden mb-6">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-white">📋 Master Research Summary</h2>
                    <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Click column headers to sort • All your research picks at a glance</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th 
                            className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => {
                              if (researchSortBy === 'ticker') setResearchSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              else { setResearchSortBy('ticker'); setResearchSortDir('asc'); }
                            }}
                          >
                            Ticker {researchSortBy === 'ticker' && (researchSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => {
                              if (researchSortBy === 'industry') setResearchSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              else { setResearchSortBy('industry'); setResearchSortDir('asc'); }
                            }}
                          >
                            Industry {researchSortBy === 'industry' && (researchSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-center py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => {
                              if (researchSortBy === 'tollBooth') setResearchSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              else { setResearchSortBy('tollBooth'); setResearchSortDir('asc'); }
                            }}
                          >
                            Toll Booth? {researchSortBy === 'tollBooth' && (researchSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => {
                              if (researchSortBy === 'growth') setResearchSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              else { setResearchSortBy('growth'); setResearchSortDir('asc'); }
                            }}
                          >
                            Growth {researchSortBy === 'growth' && (researchSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => {
                              if (researchSortBy === 'status') setResearchSortDir(d => d === 'asc' ? 'desc' : 'asc');
                              else { setResearchSortBy('status'); setResearchSortDir('asc'); }
                            }}
                          >
                            Status {researchSortBy === 'status' && (researchSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          {researchColumns.map(col => (
                            <th key={col.id} className="text-left py-3 px-4 font-semibold">
                              <div className="flex items-center gap-2">
                                {col.name}
                                <button
                                  onClick={() => setResearchColumns(prev => prev.filter(c => c.id !== col.id))}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const growthOrder = { 'High Growth': 4, 'Medium Growth': 3, 'Low Growth': 2, 'Very Low Growth': 1 };
                          const statusOrder = { 'New': 3, 'Old': 2, 'Reserve': 1 };
                          
                          return holdingsResearch
                            .filter(h => h && h.ticker)
                            .sort((a, b) => {
                              let comparison = 0;
                              switch (researchSortBy) {
                                case 'ticker':
                                  comparison = (a.ticker || '').localeCompare(b.ticker || '');
                                  break;
                                case 'industry':
                                  comparison = (a.industry || '').localeCompare(b.industry || '');
                                  break;
                                case 'tollBooth':
                                  const aVal = a.tollBooth?.toLowerCase() === 'yes' ? 1 : 0;
                                  const bVal = b.tollBooth?.toLowerCase() === 'yes' ? 1 : 0;
                                  comparison = bVal - aVal;
                                  break;
                                case 'growth':
                                  comparison = (growthOrder[a.growthProspects] || 0) - (growthOrder[b.growthProspects] || 0);
                                  break;
                                case 'status':
                                  comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
                                  break;
                                default:
                                  comparison = 0;
                              }
                              return researchSortDir === 'asc' ? comparison : -comparison;
                            })
                            .map((holding, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-bold">{holding.ticker}</td>
                                <td className="py-3 px-4 text-gray-500">{holding.industry || '-'}</td>
                                <td className="py-3 px-4 text-center">
                                  {holding.tollBooth && holding.tollBooth.toLowerCase() === 'yes' ? '✅' : '❌'}
                                </td>
                                <td className="py-3 px-4 text-gray-600">{holding.growthProspects || '-'}</td>
                                <td className="py-3 px-4 text-gray-600">{holding.status || '-'}</td>
                                {researchColumns.map(col => (
                                  <td key={col.id} className="py-3 px-4 text-gray-600">{holding[col.id] || '-'}</td>
                                ))}
                              </tr>
                            ));
                        })()}
                      </tbody>
                      <tfoot>
                        <tr className="bg-purple-50 font-bold text-purple-900">
                          <td className="py-3 px-4">Total</td>
                          <td className="py-3 px-4" colSpan={4 + researchColumns.length}>{holdingsResearch.filter(h => h && h.ticker).length} companies researched</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Holdings Research */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Holdings Research</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {showResearchColInput ? (
                      <>
                        <input
                          type="text"
                          value={newResearchCol}
                          onChange={(e) => setNewResearchCol(e.target.value)}
                          placeholder="Column name"
                          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-green-500"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (newResearchCol.trim()) {
                              const colId = 'col_' + Date.now();
                              setResearchColumns(prev => [...prev, { id: colId, name: newResearchCol.trim().toUpperCase() }]);
                              setNewResearchCol('');
                              setShowResearchColInput(false);
                            }
                          }}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setShowResearchColInput(false); setNewResearchCol(''); }}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowResearchColInput(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        + Add Column
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {holdingsResearch.map((holding, index) => (
                    <div key={index} className="border-2 rounded-2xl p-4 bg-white">
                      {/* Row 1: Ticker + Delete */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-gray-400 text-sm mt-2">{index + 1}.</span>
                        <input
                          type="text"
                          value={holding?.ticker || ''}
                          onChange={(e) => {
                            setHoldingsResearch(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], ticker: e.target.value };
                              return updated;
                            });
                          }}
                          placeholder="Ticker (e.g. BRK)"
                          className="flex-1 px-3 py-2 border-2 rounded-xl text-base font-bold focus:outline-none focus:border-green-500"
                        />
                        <button
                          onClick={() => setHoldingsResearch(prev => prev.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Row 2: Toll Booth */}
                      <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 block">Toll Booth Economics?</label>
                        <select
                          value={holding?.tollBooth || ''}
                          onChange={(e) => {
                            setHoldingsResearch(prev => {
                              const updated = [...prev];
                              if (!updated[index]) updated[index] = {};
                              updated[index] = { ...updated[index], tollBooth: e.target.value };
                              return updated;
                            });
                          }}
                          className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                        >
                          <option value="">Select</option>
                          <option value="Yes">✅ Yes</option>
                          <option value="No">❌ No</option>
                        </select>
                      </div>
                      
                      {/* Row 3: Capital + Growth */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Capital Intensity</label>
                          <select
                            value={holding?.capitalIntensity || ''}
                            onChange={(e) => {
                              setHoldingsResearch(prev => {
                                const updated = [...prev];
                                if (!updated[index]) updated[index] = {};
                                updated[index] = { ...updated[index], capitalIntensity: e.target.value };
                                return updated;
                              });
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                          >
                            <option value="">Select</option>
                            <option value="Toll-Like Capital Intensity">Toll-Like</option>
                            <option value="Lean Capital Intensity">Lean</option>
                            <option value="Heavy Capital Intensity">Heavy</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Growth Prospects</label>
                          <select
                            value={holding?.growthProspects || ''}
                            onChange={(e) => {
                              setHoldingsResearch(prev => {
                                const updated = [...prev];
                                if (!updated[index]) updated[index] = {};
                                updated[index] = { ...updated[index], growthProspects: e.target.value };
                                return updated;
                              });
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                          >
                            <option value="">Select</option>
                            <option value="Very Low Growth">Very Low</option>
                            <option value="Low Growth">Low</option>
                            <option value="Medium Growth">Medium</option>
                            <option value="High Growth">High</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Row 4: Industry + Status */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Industry</label>
                          <select
                            value={holding?.industry || ''}
                            onChange={(e) => {
                              setHoldingsResearch(prev => {
                                const updated = [...prev];
                                if (!updated[index]) updated[index] = {};
                                updated[index] = { ...updated[index], industry: e.target.value };
                                return updated;
                              });
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                          >
                            {industries.map(ind => (
                              <option key={ind.id} value={ind.id}>{ind.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Holding Status</label>
                          <select
                            value={holding?.status || ''}
                            onChange={(e) => {
                              setHoldingsResearch(prev => {
                                const updated = [...prev];
                                if (!updated[index]) updated[index] = {};
                                updated[index] = { ...updated[index], status: e.target.value };
                                return updated;
                              });
                            }}
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                          >
                            <option value="">Select</option>
                            <option value="New">New</option>
                            <option value="Old">Old</option>
                            <option value="Reserve">Reserve</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Custom Columns */}
                      {researchColumns.length > 0 && (
                        <div className="space-y-3 pt-3 border-t">
                          {researchColumns.map(col => (
                            <div key={col.id}>
                              <label className="text-xs text-gray-500 mb-1 block">{col.name}</label>
                              <input
                                type="text"
                                value={holding?.[col.id] || ''}
                                onChange={(e) => {
                                  setHoldingsResearch(prev => {
                                    const updated = [...prev];
                                    if (!updated[index]) updated[index] = {};
                                    updated[index] = { ...updated[index], [col.id]: e.target.value };
                                    return updated;
                                  });
                                }}
                                placeholder="-"
                                className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <button
                    onClick={() => setHoldingsResearch(prev => [...prev, {}])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors text-sm font-medium"
                  >
                    + Add Research Entry
                  </button>
                </div>
              </div>
            </>
          )}

          {investmentsSubTab === 'economics' && (
            <>
              {/* Company Economics Table */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Company Economics</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {showEconomicsColInput ? (
                      <>
                        <input
                          type="text"
                          value={newEconomicsCol}
                          onChange={(e) => setNewEconomicsCol(e.target.value)}
                          placeholder="Column name"
                          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-green-500"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (newEconomicsCol.trim()) {
                              const colId = 'col_' + Date.now();
                              setEconomicsColumns(prev => [...prev, { id: colId, name: newEconomicsCol.trim().toUpperCase() }]);
                              setNewEconomicsCol('');
                              setShowEconomicsColInput(false);
                            }
                          }}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setShowEconomicsColInput(false); setNewEconomicsCol(''); }}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowEconomicsColInput(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        + Add Column
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {companyEconomics.map((company, index) => (
                    <div key={index} className="border-2 rounded-2xl p-4 bg-white">
                      {/* Row 1: Ticker + Delete */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-gray-400 text-sm mt-2">{index + 1}.</span>
                        <input
                          type="text"
                          value={company?.ticker || ''}
                          onChange={(e) => {
                            setCompanyEconomics(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], ticker: e.target.value };
                              return updated;
                            });
                          }}
                          placeholder="Ticker (e.g. AAPL)"
                          className="flex-1 px-3 py-2 border-2 rounded-xl text-base font-bold focus:outline-none focus:border-green-500"
                        />
                        <button
                          onClick={() => setCompanyEconomics(prev => prev.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Row 2: Future Predictability */}
                      <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 block">Future Predictability</label>
                        <textarea
                          value={company?.economics || ''}
                          onChange={(e) => {
                            setCompanyEconomics(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], economics: e.target.value };
                              return updated;
                            });
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          placeholder="Notes on future predictability..."
                          className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500 resize-none overflow-hidden"
                          rows={2}
                        />
                      </div>
                      
                      {/* Custom Columns */}
                      {economicsColumns.length > 0 && (
                        <div className="space-y-3 pt-3 border-t">
                          {economicsColumns.map(col => (
                            <div key={col.id}>
                              <label className="text-xs text-gray-500 mb-1 block">{col.name}</label>
                              <input
                                type="text"
                                value={company?.[col.id] || ''}
                                onChange={(e) => {
                                  setCompanyEconomics(prev => {
                                    const updated = [...prev];
                                    updated[index] = { ...updated[index], [col.id]: e.target.value };
                                    return updated;
                                  });
                                }}
                                placeholder="-"
                                className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <button
                    onClick={() => setCompanyEconomics(prev => [...prev, {}])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors text-sm font-medium"
                  >
                    + Add Company
                  </button>
                </div>
              </div>
            </>
          )}

          {investmentsSubTab === 'risks' && (
            <>
              {/* Biggest Risks Table */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Biggest Risks</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {showRisksColInput ? (
                      <>
                        <input
                          type="text"
                          value={newRisksCol}
                          onChange={(e) => setNewRisksCol(e.target.value)}
                          placeholder="Column name"
                          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-green-500"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (newRisksCol.trim()) {
                              const colId = 'col_' + Date.now();
                              setRisksColumns(prev => [...prev, { id: colId, name: newRisksCol.trim().toUpperCase() }]);
                              setNewRisksCol('');
                              setShowRisksColInput(false);
                            }
                          }}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setShowRisksColInput(false); setNewRisksCol(''); }}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowRisksColInput(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        + Add Column
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {biggestRisks.map((risk, index) => (
                    <div key={index} className="border-2 rounded-2xl p-4 bg-white">
                      {/* Row 1: Ticker + Delete */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-gray-400 text-sm mt-2">{index + 1}.</span>
                        <input
                          type="text"
                          value={risk?.ticker || ''}
                          onChange={(e) => {
                            setBiggestRisks(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], ticker: e.target.value };
                              return updated;
                            });
                          }}
                          placeholder="Ticker (e.g. AAPL)"
                          className="flex-1 px-3 py-2 border-2 rounded-xl text-base font-bold focus:outline-none focus:border-green-500"
                        />
                        <button
                          onClick={() => setBiggestRisks(prev => prev.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Row 2: Biggest Risk */}
                      <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 block">Biggest Risk</label>
                        <textarea
                          value={risk?.biggestRisk || ''}
                          onChange={(e) => {
                            setBiggestRisks(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], biggestRisk: e.target.value };
                              return updated;
                            });
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          placeholder="What's the biggest risk for this company?"
                          className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500 resize-none overflow-hidden"
                          rows={2}
                        />
                      </div>
                      
                      {/* Custom Columns */}
                      {risksColumns.length > 0 && (
                        <div className="space-y-3 pt-3 border-t">
                          {risksColumns.map(col => (
                            <div key={col.id}>
                              <label className="text-xs text-gray-500 mb-1 block">{col.name}</label>
                              <input
                                type="text"
                                value={risk?.[col.id] || ''}
                                onChange={(e) => {
                                  setBiggestRisks(prev => {
                                    const updated = [...prev];
                                    updated[index] = { ...updated[index], [col.id]: e.target.value };
                                    return updated;
                                  });
                                }}
                                placeholder="-"
                                className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <button
                    onClick={() => setBiggestRisks(prev => [...prev, {}])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors text-sm font-medium"
                  >
                    + Add Company
                  </button>
                </div>
              </div>
            </>
          )}

          {investmentsSubTab === 'goals' && (
            <>
              {/* Small Goals */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Small Goals</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Short-term investment targets</p>
                </div>
                <div className="p-4 space-y-4">
                  {investmentSmallGoals.map((goal, index) => {
                    const target = goal?.target || 0;
                    const current = goal?.current || 0;
                    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                    return (
                      <div key={index} className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm font-medium">{index + 1}.</span>
                          <input
                            type="text"
                            value={goal?.name || ''}
                            onChange={(e) => {
                              setInvestmentSmallGoals(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], name: e.target.value };
                                return updated;
                              });
                            }}
                            placeholder="S&P 500"
                            className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-white"
                          />
                          <button
                            onClick={() => setInvestmentSmallGoals(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Target:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.targetStr || ''}
                              onChange={(e) => {
                                setInvestmentSmallGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], target: parseFloat(e.target.value) || 0, targetStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-24 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Saved:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.currentStr || ''}
                              onChange={(e) => {
                                setInvestmentSmallGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], current: parseFloat(e.target.value) || 0, currentStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-24 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-white"
                            />
                          </div>
                          {target > 0 && (
                            <span className={`text-sm font-medium ${progress >= 100 ? 'text-green-600' : 'text-emerald-600'}`}>
                              {progress.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {target > 0 && (
                          <div className="pl-6">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-emerald-500'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setInvestmentSmallGoals(prev => [...prev, { name: '', target: 0, targetStr: '', current: 0, currentStr: '' }])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors text-sm font-medium"
                  >
                    + Add Small Goal
                  </button>
                </div>
              </div>

              {/* Big Goals */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Big Goals</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Long-term investment targets</p>
                </div>
                <div className="p-4 space-y-4">
                  {investmentBigGoals.map((goal, index) => {
                    const target = goal?.target || 0;
                    const current = goal?.current || 0;
                    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
                    return (
                      <div key={index} className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm font-medium">{index + 1}.</span>
                          <input
                            type="text"
                            value={goal?.name || ''}
                            onChange={(e) => {
                              setInvestmentBigGoals(prev => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], name: e.target.value };
                                return updated;
                              });
                            }}
                            placeholder="S&P 500"
                            className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-white"
                          />
                          <button
                            onClick={() => setInvestmentBigGoals(prev => prev.filter((_, i) => i !== index))}
                            className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Target:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.targetStr || ''}
                              onChange={(e) => {
                                setInvestmentBigGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], target: parseFloat(e.target.value) || 0, targetStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-28 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{color:"rgba(148,163,184,0.8)"}}>Saved:</span>
                            <span className="text-gray-400">$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={goal?.currentStr || ''}
                              onChange={(e) => {
                                setInvestmentBigGoals(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], current: parseFloat(e.target.value) || 0, currentStr: e.target.value };
                                  return updated;
                                });
                              }}
                              placeholder="0"
                              className="w-28 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-white"
                            />
                          </div>
                          {target > 0 && (
                            <span className={`text-sm font-medium ${progress >= 100 ? 'text-green-600' : 'text-emerald-600'}`}>
                              {progress.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {target > 0 && (
                          <div className="pl-6">
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setInvestmentBigGoals(prev => [...prev, { name: '', target: 0, targetStr: '', current: 0, currentStr: '' }])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors text-sm font-medium"
                  >
                    + Add Big Goal
                  </button>
                </div>
              </div>
            </>
          )}

          {investmentsSubTab === 'notes' && (
            <>
              {/* Render each note section */}
              {(Array.isArray(investmentNotes) ? investmentNotes : [{ id: 1, title: 'Investment Notes', text: typeof investmentNotes === 'string' ? investmentNotes : '' }]).map((note, noteIndex) => (
                <div key={note.id} className="bg-white rounded-3xl shadow-sm border overflow-hidden mb-4">
                  <div className="p-6 border-b flex items-center justify-between">
                    <div className="flex-1">
                      <input
                        value={note.title || ''}
                        onChange={(e) => {
                          const notes = Array.isArray(investmentNotes) ? investmentNotes : [{ id: 1, title: 'Investment Notes', text: typeof investmentNotes === 'string' ? investmentNotes : '' }];
                          setInvestmentNotes(notes.map(n => n.id === note.id ? { ...n, title: e.target.value } : n));
                        }}
                        placeholder="Note title..."
                        className="text-xl font-semibold w-full focus:outline-none"
                      />
                      <p className="text-sm text-gray-500 mt-1">Write down your thoughts, strategies, and reminders</p>
                    </div>
                    {(Array.isArray(investmentNotes) ? investmentNotes : []).length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this note section?')) {
                            setInvestmentNotes(prev => (Array.isArray(prev) ? prev : []).filter(n => n.id !== note.id));
                          }
                        }}
                        className="text-red-400 hover:text-red-600 ml-3 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-6">
                    <textarea
                      value={note.text || ''}
                      onChange={(e) => {
                        const notes = Array.isArray(investmentNotes) ? investmentNotes : [{ id: 1, title: 'Investment Notes', text: typeof investmentNotes === 'string' ? investmentNotes : '' }];
                        setInvestmentNotes(notes.map(n => n.id === note.id ? { ...n, text: e.target.value } : n));
                        // Adjust height without scrolling
                        const el = e.target;
                        const scrollPos = window.scrollY;
                        el.style.height = 'auto';
                        el.style.height = Math.max(300, el.scrollHeight) + 'px';
                        window.scrollTo(0, scrollPos);
                      }}
                      ref={(el) => {
                        // Only run once on mount using a data attribute flag
                        if (el && !el.dataset.initialized) {
                          el.dataset.initialized = 'true';
                          // Delay to avoid scroll jump during render
                          setTimeout(() => {
                            const scrollPos = window.scrollY;
                            el.style.height = 'auto';
                            el.style.height = Math.max(300, el.scrollHeight) + 'px';
                            window.scrollTo(0, scrollPos);
                          }, 50);
                        }
                      }}
                      placeholder="Write your notes here..."
                      className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500 resize-none overflow-hidden"
                      style={{ minHeight: '300px' }}
                    />
                  </div>
                </div>
              ))}

              {/* Add New Note Section Button */}
              <button
                onClick={() => {
                  const notes = Array.isArray(investmentNotes) ? investmentNotes : [{ id: 1, title: 'Investment Notes', text: typeof investmentNotes === 'string' ? investmentNotes : '' }];
                  setInvestmentNotes([...notes, { id: Date.now(), title: '', text: '' }]);
                }}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-3xl text-gray-400 hover:text-green-600 hover:border-green-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Another Note Section
              </button>
            </>
          )}

          {investmentsSubTab === 'declined' && (
            <>
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">Declined Companies</h2>
                  <p className="text-sm" style={{color:"rgba(148,163,184,0.8)"}}>Track companies you've passed on and why</p>
                </div>

                <div className="p-4 space-y-3">
                  {declinedCompanies.map((company, index) => (
                    <div key={index} className="border-2 rounded-2xl p-4 bg-white">
                      {/* Row 1: Ticker + Delete */}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-gray-400 text-sm mt-2">{index + 1}.</span>
                        <input
                          type="text"
                          value={company?.ticker || ''}
                          onChange={(e) => {
                            setDeclinedCompanies(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], ticker: e.target.value };
                              return updated;
                            });
                          }}
                          placeholder="Ticker (e.g. TSLA)"
                          className="flex-1 px-3 py-2 border-2 rounded-xl text-base font-bold focus:outline-none focus:border-green-500"
                        />
                        <button
                          onClick={() => {
                            setDeclinedCompanies(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Row 2: Industry */}
                      <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 block">Industry</label>
                        <select
                          value={company?.industry || ''}
                          onChange={(e) => {
                            setDeclinedCompanies(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], industry: e.target.value };
                              return updated;
                            });
                          }}
                          className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                        >
                          {industries.map(ind => (
                            <option key={ind.id} value={ind.id}>{ind.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Row 3: Reason */}
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Reason for Decline</label>
                        <textarea
                          value={company?.reason || ''}
                          onChange={(e) => {
                            setDeclinedCompanies(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], reason: e.target.value };
                              return updated;
                            });
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          placeholder="Why did you pass on this company?"
                          className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500 resize-none overflow-hidden"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <button
                    onClick={() => setDeclinedCompanies(prev => [...prev, { ticker: '', industry: '', reason: '' }])}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors text-sm font-medium"
                  >
                    + Add Company
                  </button>
                </div>
              </div>

              {/* Declined Pie Chart */}
              {(() => {
                const filledDeclined = declinedCompanies.filter(c => c && c.ticker && c.industry);
                const declinedByIndustry = industries
                  .filter(ind => ind.id)
                  .map(ind => ({
                    name: ind.name,
                    count: filledDeclined.filter(c => c.industry === ind.id).length,
                    companies: filledDeclined.filter(c => c.industry === ind.id)
                  }))
                  .filter(ind => ind.count > 0)
                  .sort((a, b) => b.count - a.count);
                const totalDeclined = filledDeclined.length;

                if (declinedByIndustry.length === 0) return null;

                return (
                  <>
                    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                      <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold text-white">Declined by Industry</h2>
                      </div>
                      <div className="p-6 flex flex-col md:flex-row items-center justify-center gap-8">
                        {/* Pie Chart */}
                        <div className="relative">
                          <svg width="250" height="250" viewBox="0 0 250 250">
                            {(() => {
                              const colors = [
                                '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
                                '#22C55E', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6',
                                '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
                              ];
                              let cumulativePercent = 0;
                              return declinedByIndustry.map((ind, i) => {
                                const percent = (ind.count / totalDeclined) * 100;
                                const startAngle = cumulativePercent * 3.6 * (Math.PI / 180);
                                cumulativePercent += percent;
                                const endAngle = cumulativePercent * 3.6 * (Math.PI / 180);
                                const largeArcFlag = percent > 50 ? 1 : 0;
                                const x1 = 125 + 100 * Math.sin(startAngle);
                                const y1 = 125 - 100 * Math.cos(startAngle);
                                const x2 = 125 + 100 * Math.sin(endAngle);
                                const y2 = 125 - 100 * Math.cos(endAngle);
                                
                                if (percent === 100) {
                                  return (
                                    <circle
                                      key={i}
                                      cx="125"
                                      cy="125"
                                      r="100"
                                      fill={colors[i % colors.length]}
                                    />
                                  );
                                }
                                
                                return (
                                  <path
                                    key={i}
                                    d={`M 125 125 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                    fill={colors[i % colors.length]}
                                  />
                                );
                              });
                            })()}
                            <circle cx="125" cy="125" r="50" fill="white" />
                            <text x="125" y="120" textAnchor="middle" className="text-xs fill-gray-500">Total</text>
                            <text x="125" y="140" textAnchor="middle" className="text-lg font-bold fill-gray-800">{totalDeclined}</text>
                          </svg>
                        </div>
                        
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          {(() => {
                            const colors = [
                              '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
                              '#22C55E', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6',
                              '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
                            ];
                            return declinedByIndustry.map((ind, i) => (
                              <div key={ind.name} className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: colors[i % colors.length] }}
                                />
                                <span className="text-sm" style={{color:"rgba(148,163,184,0.9)"}}>{ind.name}</span>
                                <span className="text-sm font-medium">{((ind.count / totalDeclined) * 100).toFixed(1)}%</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                      <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold text-white">Declined Companies Breakdown</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="text-left py-3 px-4 font-semibold">Industry</th>
                              <th className="text-center py-3 px-4 font-semibold">Companies</th>
                              <th className="text-right py-3 px-4 font-semibold">% of Declined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {declinedByIndustry.map(ind => (
                              <tr key={ind.name} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium">{ind.name}</td>
                                <td className="py-3 px-4 text-center text-gray-600">{ind.count}</td>
                                <td className="py-3 px-4 text-right text-gray-600">{((ind.count / totalDeclined) * 100).toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-red-50 font-bold text-red-900">
                              <td className="py-3 px-4">Total Declined</td>
                              <td className="py-3 px-4 text-center">{totalDeclined}</td>
                              <td className="py-3 px-4 text-right">100%</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {(investmentsSubTab === 'knowledge' || investmentsSubTab === 'books') && (
            <>
              {/* Inner tabs for Knowledge Guide sub-sections */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setInvestmentsSubTab('knowledge')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'knowledge'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'text-slate-400 hover:text-slate-200 transition-colors'
                  }`}
                >
                  Knowledge
                </button>
                <button
                  onClick={() => setInvestmentsSubTab('books')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'books'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'text-slate-400 hover:text-slate-200 transition-colors'
                  }`}
                >
                  Book Recommendations
                </button>
              </div>
            </>
          )}

          {investmentsSubTab === 'knowledge' && (
            <>
              {/* Muzz's Knowledge Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🦘</div>
                  <div>
                    <h2 className="text-2xl font-bold">Muzz's Knowledge Corner</h2>
                    <p className="text-amber-100">Your guide to breaking down equity investments</p>
                  </div>
                </div>
              </div>

              {/* Equity Investment Breakdown Guide */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">📈 Equity Investment Breakdown Guide</h2>
                  <p className="text-sm text-gray-500 mt-1">Key questions to ask when analyzing a stock</p>
                </div>
                <div className="p-6 space-y-4">

                  {/* Dividends & Buybacks */}
                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                    <h3 className="text-md font-bold text-purple-800 flex items-center gap-2 mb-3">💰 Dividends / Buybacks / Stock Splits</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• What's their dividend record?</li>
                      <li>• Has there been growth in dividends?</li>
                      <li>• Have they done buybacks before?</li>
                      <li>• Have they split their stock before?</li>
                    </ul>
                  </div>

                  {/* Capital Expenditure */}
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <h3 className="text-md font-bold text-blue-800 flex items-center gap-2 mb-3">🏗️ Capital Expenditure</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Is the company sitting on lots of cash?</li>
                      <li>• Is the business capital intensive?</li>
                      <li>• Do the products require little capital to grow?</li>
                    </ul>
                  </div>

                  {/* Acquisitions */}
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200">
                    <h3 className="text-md font-bold text-indigo-800 flex items-center gap-2 mb-3">🤝 Acquisitions</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• What's been their most recent acquisitions? Have they been successful?</li>
                      <li>• Has there been unsuccessful acquisitions?</li>
                      <li>• How have acquisitions been paid for? (Equity, debt, or cash)</li>
                    </ul>
                  </div>

                  {/* Financial Points */}
                  <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                    <h3 className="text-md font-bold text-green-800 flex items-center gap-2 mb-3">📊 Financial Points</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• What products bring most revenue?</li>
                      <li>• What products are most profitable?</li>
                      <li>• Sales / Products Growth or Decline?</li>
                      <li>• Margins / Margins Growth or Decline?</li>
                      <li>• Does the company have pricing power?</li>
                      <li>• Market Capitalisation History?</li>
                      <li>• Does the company get more than 50% of revenue from one customer?</li>
                      <li>• Do you understand the company's growth drivers?</li>
                    </ul>
                  </div>

                  {/* Remuneration */}
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                    <h3 className="text-md font-bold text-amber-800 flex items-center gap-2 mb-3">💼 Remuneration</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Are they utilising compensation properly?</li>
                      <li>• Do employees get compensation benefits?</li>
                      <li>• Does compensation justify company performance?</li>
                    </ul>
                  </div>

                  {/* Brand */}
                  <div className="bg-pink-50 rounded-2xl p-4 border border-pink-200">
                    <h3 className="text-md font-bold text-pink-800 flex items-center gap-2 mb-3">🏷️ Brand</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Does the brand create an image for people? (e.g., Coke & Christmas, Cadbury & Easter)</li>
                      <li>• Social standpoint - is it a liked or disliked brand?</li>
                      <li>• Is it a popular brand?</li>
                    </ul>
                  </div>

                  {/* Operating Costs */}
                  <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                    <h3 className="text-md font-bold text-orange-800 flex items-center gap-2 mb-3">⚙️ Operating Costs</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Revenue and Profit Per Employee?</li>
                      <li>• Do you know the big costs of the company?</li>
                      <li>• Do you know the company's vulnerabilities?</li>
                      <li>• Has this company made it through recessions?</li>
                      <li>• How do they operate? (e.g., Create their own products)</li>
                      <li>• Does it have a few risks that are easily understandable?</li>
                      <li>• Do you understand labour? (e.g., employed by company or union)</li>
                      <li>• Does the business have consistent operating history?</li>
                    </ul>
                  </div>

                  {/* Management */}
                  <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200">
                    <h3 className="text-md font-bold text-teal-800 flex items-center gap-2 mb-3">👔 Management</h3>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• Is Management rational & cost conscious?</li>
                      <li>• Does board of directors think like owners?</li>
                      <li>• Does the management have a long term view?</li>
                      <li>• Do management own shares in the company?</li>
                      <li>• Is Management candid with its shareholders?</li>
                      <li>• Is management NOT a "serial acquirer"?</li>
                      <li>• Do they publicly discuss mistakes on annual report?</li>
                      <li>• Does Management resist the institutional imperative?</li>
                      <li>• Has the manager worked up the ranks or have a proven track record?</li>
                      <li>• Is management avoiding too much debt and leverage?</li>
                    </ul>
                  </div>

                  {/* Ownership */}
                  <div className="bg-cyan-50 rounded-2xl p-4 border border-cyan-200">
                    <h3 className="text-md font-bold text-cyan-800 flex items-center gap-2 mb-3">🏠 Ownership / Partnerships</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Is it a 'Family Owned' Business?</li>
                      <li>• Who are the top shareholders?</li>
                      <li>• What are their partnerships?</li>
                      <li>• Is the stock in the S&P 500 or any other big indexes?</li>
                    </ul>
                  </div>

                  {/* Valuation */}
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <h3 className="text-md font-bold text-red-800 flex items-center gap-2 mb-3">💵 Valuation</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Are you purchasing at a fair price or a big premium to intrinsic value?</li>
                      <li>• Do you have a good idea of the company's P/E ratio history?</li>
                      <li>• Do you have a good idea of the company's P/B ratio history?</li>
                    </ul>
                  </div>

                  {/* General */}
                  <div className="bg-gray-100 rounded-2xl p-4 border border-gray-300">
                    <h3 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-3">🎯 General Points</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Future Plans / Goals?</li>
                      <li>• Is it 'Inflation Protected'?</li>
                      <li>• Is it an Idiot Proof Company?</li>
                      <li>• What stage is the company in? (e.g., Mature)</li>
                      <li>• Does the business have favourable long-term prospects?</li>
                      <li>• If you had $30 Billion, could you knock the brand/company off?</li>
                      <li>• Do you understand the business & is it simple to understand?</li>
                      <li>• Has their industry been growing and will it still grow?</li>
                      <li>• What makes them different to others?</li>
                      <li>• What is the company's competitive position? (e.g., Is it a duopoly?)</li>
                      <li>• Do you understand all the company's subsidiaries?</li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* Yourself vs Consensus & Yourself */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">🧠 Self-Assessment Questions</h2>
                  <p className="text-sm text-gray-500 mt-1">Check yourself before you wreck yourself</p>
                </div>
                <div className="p-6 space-y-4">

                  <div className="bg-violet-50 rounded-2xl p-4 border border-violet-200">
                    <h3 className="text-md font-bold text-violet-800 flex items-center gap-2 mb-3">⚔️ Yourself vs Consensus</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• What's the probability you're right?</li>
                      <li>• What does the consensus think?</li>
                      <li>• How does your expectation differ from the consensus?</li>
                      <li>• Is the consensus psychology too bullish or bearish?</li>
                      <li>• What happens to the price if consensus is right vs if you're right?</li>
                    </ul>
                  </div>

                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200">
                    <h3 className="text-md font-bold text-rose-800 flex items-center gap-2 mb-3">🪞 Yourself vs Yourself</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Are you being overconfident?</li>
                      <li>• What is the range of likely future outcomes?</li>
                      <li>• Are you falling into the trap of overreaction bias?</li>
                      <li>• Are you mentally prepared for loss aversion? (pain of loss {'>'} joy of gain)</li>
                      <li>• Have you checked the company's advantage in every respect and its durability?</li>
                      <li>• Have you recasted all financial statement figures to fit your own view of reality?</li>
                      <li>• Have you considered all relevant aspects, even if difficult to measure?</li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* 10 Don'ts & 15 Do's */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">📖 Philip Fisher's Rules</h2>
                  <p className="text-sm text-gray-500 mt-1">From "Common Stocks and Uncommon Profits"</p>
                </div>
                <div className="p-6 space-y-4">

                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <h3 className="text-md font-bold text-red-800 flex items-center gap-2 mb-3">🚫 10 Don'ts For Investors</h3>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>Don't buy into promotional companies</li>
                      <li>Don't ignore a good stock just because it's traded "over the counter"</li>
                      <li>Don't buy a stock just because you like the "tone" of its annual report</li>
                      <li>Don't assume high price = growth already priced in</li>
                      <li>Don't quibble over eighths and quarters</li>
                      <li>Don't overstress diversification</li>
                      <li>Don't be afraid of buying on a war scare</li>
                      <li>Don't forget your Gilbert and Sullivan</li>
                      <li>Don't fail to consider time as well as price in buying a growth stock</li>
                      <li>Don't follow the crowd</li>
                    </ol>
                  </div>

                  <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                    <h3 className="text-md font-bold text-green-800 flex items-center gap-2 mb-3">✅ 15 Do's For Investors (Stock Checklist)</h3>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>Does the company have sufficient market potential for sizable sales increase?</li>
                      <li>Does management have determination to develop new products/processes?</li>
                      <li>How effective are R&D efforts in relation to its size?</li>
                      <li>Does the company have an above-average sales organization?</li>
                      <li>Does the company have a worthwhile profit margin?</li>
                      <li>What is the company doing to maintain or improve profit margins?</li>
                      <li>Does the company have outstanding labor and personnel relations?</li>
                      <li>Does the company have outstanding executive relations?</li>
                      <li>Does the company have depth to its management?</li>
                      <li>How good are the company's cost analysis and accounting controls?</li>
                      <li>Are there industry-specific clues about how outstanding the company is?</li>
                      <li>Does the company have a long-range outlook on profits?</li>
                      <li>Will future equity financing cancel existing stockholder benefits?</li>
                      <li>Does management talk freely when things are good but "clam up" during troubles?</li>
                      <li>Does the company have management of unquestionable integrity?</li>
                    </ol>
                    <div className="mt-3 p-3 bg-green-100 rounded-lg">
                      <p className="text-sm font-semibold text-green-800">Extra Must-Haves:</p>
                      <p className="text-sm text-green-700">Low-Cost Production • Strong Marketing • Outstanding R&D • Financial Skill</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Durable Competitive Advantages */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">🏰 Types of Durable Competitive Advantages</h2>
                  <p className="text-sm text-gray-500 mt-1">Buffett classifies great businesses into three categories</p>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                      <div className="text-3xl mb-2">🎁</div>
                      <h3 className="text-md font-bold text-blue-800 mb-2">1. Unique Products</h3>
                      <p className="text-sm text-gray-600 mb-2">Embedded into consumer habits through consistency, marketing, and experience.</p>
                      <p className="text-xs font-medium" style={{color:"rgba(96,165,250,0.9)"}}>Examples: Coca-Cola, Hershey, Wrigley, P&G</p>
                    </div>

                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                      <div className="text-3xl mb-2">🛎️</div>
                      <h3 className="text-md font-bold text-purple-800 mb-2">2. Unique Services</h3>
                      <p className="text-sm text-gray-600 mb-2">Trusted, recurring services tied to the brand—not individuals.</p>
                      <p className="text-xs font-medium" style={{color:"rgba(192,132,252,0.9)"}}>Examples: Moody's, H&R Block, AmEx</p>
                    </div>

                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                      <div className="text-3xl mb-2">📦</div>
                      <h3 className="text-md font-bold text-green-800 mb-2">3. Low-Cost Buyer & Seller</h3>
                      <p className="text-sm text-gray-600 mb-2">High volume, low-margin models. Scale gives pricing power and defensible moats.</p>
                      <p className="text-xs text-green-600 font-medium">Examples: Costco, Walmart, BNSF</p>
                    </div>

                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl">
                    <p className="text-amber-800 font-semibold">💡 Bottom Line: If a business fits one of these categories, it likely has the pricing power and durability to earn high returns long-term.</p>
                  </div>
                </div>
              </div>

              {/* Beer & Foam Analogy */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">🍺 The Beer & Foam Analogy</h2>
                  <p className="text-sm text-gray-500 mt-1">Understanding hype vs real value in markets</p>
                </div>
                <div className="p-6 space-y-4">
                  
                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">🍺</div>
                      <div>
                        <h3 className="text-lg font-bold text-amber-800 mb-2">The Analogy</h3>
                        <p className="text-gray-700">Think of a stock's price like a glass of beer. The <strong>beer</strong> represents the real, intrinsic value of the company — its earnings, assets, cash flow, and competitive advantages. The <strong>foam</strong> represents the hype, speculation, and market excitement that sits on top.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-300">
                      <h4 className="font-bold text-yellow-800 mb-2">🍻 The Beer (Real Value)</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Actual earnings & revenue</li>
                        <li>• Tangible assets</li>
                        <li>• Cash flow generation</li>
                        <li>• Competitive moat</li>
                        <li>• Management quality</li>
                        <li>• Business fundamentals</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border-2 border-dashed border-gray-300">
                      <h4 className="font-bold text-gray-600 mb-2">🫧 The Foam (Hype)</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Market excitement & FOMO</li>
                        <li>• Media buzz & headlines</li>
                        <li>• Speculation & momentum</li>
                        <li>• "This time it's different"</li>
                        <li>• Future promises (unproven)</li>
                        <li>• Inflated expectations</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                    <h4 className="font-bold text-orange-800 mb-2">⚠️ The Problem</h4>
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>When you pour a beer, sometimes you get mostly foam. Markets work the same way — during bull runs and hype cycles, prices can be 90% foam and 10% beer. When the foam settles (and it always does), you're left holding a glass that's mostly empty.</p>
                  </div>

                  <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                    <h4 className="font-bold text-green-800 mb-2">✅ Your Job as an Investor</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• <strong>Determine the beer level:</strong> Through your own research, figure out what the company is actually worth based on fundamentals</li>
                      <li>• <strong>Identify the foam:</strong> How much of the current price is hype vs substance?</li>
                      <li>• <strong>Wait for the pour to settle:</strong> Patient investors wait until the foam dissipates and they can buy mostly beer</li>
                      <li>• <strong>Don't pay for foam:</strong> No matter how exciting, foam always disappears</li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl p-4 border border-amber-300">
                    <p className="text-amber-900 font-semibold">🦘 Muzz's Take: "Mate, everyone loves a good frothy beer, but you wouldn't pay $10 for a glass of foam, would ya? Same goes for stocks. Do your research, find the real value underneath all the hype, and make sure you're buying beer — not just paying for bubbles that'll pop."</p>
                  </div>

                </div>
              </div>

            </>
          )}

          {investmentsSubTab === 'books' && (
            <>
              {/* Muzz's Books Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🦘</div>
                  <div>
                    <h2 className="text-2xl font-bold">Muzz's Book Recommendations</h2>
                    <p className="text-amber-100">Essential reads for your investing journey</p>
                  </div>
                </div>
              </div>

              {/* Book Recommendations */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">📚 Recommended Reading List</h2>
                  <p className="text-sm text-gray-500 mt-1">Books to level up your investing game</p>
                </div>
                <div className="p-6 space-y-6">

                  {/* Beginner Books */}
                  <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
                    <h3 className="text-lg font-bold text-green-800 mb-4">🌱 5 Great Investing Books (Beginner)</h3>
                    <ol className="text-sm text-gray-700 space-y-2">
                      <li className="flex gap-2"><span className="font-bold text-green-600">1.</span><span><strong>The Little Book of Common Sense Investing</strong> by John C. Bogle</span></li>
                      <li className="flex gap-2"><span className="font-bold text-green-600">2.</span><span><strong>University of Berkshire Hathaway</strong> by Daniel Pecaut</span></li>
                      <li className="flex gap-2"><span className="font-bold text-green-600">3.</span><span><strong>The Warren Buffett Way</strong> by Robert G. Hagstrom</span></li>
                      <li className="flex gap-2"><span className="font-bold text-green-600">4.</span><span><strong>A Short History of Financial Euphoria</strong> by John Kenneth Galbraith</span></li>
                      <li className="flex gap-2"><span className="font-bold text-green-600">5.</span><span><strong>The Dhandho Investor</strong> by Mohnish Pabrai</span></li>
                    </ol>
                  </div>

                  {/* Intermediate Books */}
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-800 mb-4">📈 10 More Great Books (Intermediate)</h3>
                    <ol className="text-sm text-gray-700 space-y-2">
                      <li className="flex gap-2"><span className="font-bold text-blue-600">1.</span><span><strong>One Up on Wall Street</strong> by Peter Lynch</span></li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">2.</span><span><strong>Beating the Street</strong> by Peter Lynch</span></li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">3.</span><span><strong>Buffettology</strong> by Mary Buffett and David Clark</span></li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">4.</span><span><strong>Common Stocks and Uncommon Profits</strong> by Philip A. Fisher</span></li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">5.</span><span><strong>Mastering the Market Cycle</strong> by Howard Marks</span></li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">6.</span><span><strong>The Most Important Thing</strong> by Howard Marks</span></li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">7.</span><span><strong>The Intelligent Investor</strong> by Benjamin Graham</span></li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">8.</span><span><strong>Accounting Made Simple</strong> by Mike Piper</span></li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">9.</span><span><strong>The Theory of Investment Value</strong> by John Burr Williams</span></li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">10.</span><span><strong>Berkshire Hathaway Letters to Shareholders</strong> 1965 to 2025</span></li>
                    </ol>
                  </div>

                  {/* Advanced Books */}
                  <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
                    <h3 className="text-lg font-bold text-purple-800 mb-4">🎓 10 More Great Books (Advanced)</h3>
                    <ol className="text-sm text-gray-700 space-y-2">
                      <li className="flex gap-2"><span className="font-bold text-purple-600">1.</span><span><strong>The Interpretation of Financial Statements</strong> by Benjamin Graham and Spencer B. Meredith</span></li>
                      <li className="flex gap-2"><span className="font-bold text-purple-600">2.</span><span><strong>Warren Buffett and the Interpretation of Financial Statements</strong> by Mary Buffett and David Clark</span></li>
                      <li className="flex gap-2"><span className="font-bold text-purple-600">3.</span><span><strong>Warren Buffett's Management Secrets</strong> by Mary Buffett and David Clark</span></li>
                      <li className="flex gap-2"><span className="font-bold text-purple-600">4.</span><span><strong>The Warren Buffett Stock Portfolio</strong> by Mary Buffett and David Clark</span></li>
                      <li className="flex gap-2"><span className="font-bold text-purple-600">5.</span><span><strong>The Essays of Warren Buffett</strong> by Lawrence A. Cunningham</span></li>
                      <li className="flex gap-2"><span className="font-bold text-purple-600">6.</span><span><strong>Quality of Earnings</strong> by Robert Sobel</span></li>
                      <li className="flex gap-2"><span className="font-bold text-purple-600">7.</span><span><strong>Poor Charlie's Almanack</strong> by Peter D. Kaufman</span></li>
                      <li className="flex gap-2"><span className="font-bold text-purple-600">8.</span><span><strong>Manias, Panics and Crashes</strong> by Robert M. Solow</span></li>
                      <li className="flex gap-2"><span className="font-bold text-purple-600">9.</span><span><strong>Common Sense</strong> by Joel Greenblatt</span></li>
                      <li className="flex gap-2"><span className="font-bold text-purple-600">10.</span><span><strong>You Can Be a Stock Market Genius</strong> by Joel Greenblatt</span></li>
                    </ol>
                  </div>

                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 border border-amber-300">
                    <p className="text-amber-900 font-semibold">🦘 Muzz's Note: "There's plenty more educational books out there, but I wanted to provide some guidance to great books that can help you get your investing journey going. Happy reading, mate!"</p>
                  </div>

                </div>
              </div>

            </>
          )}

          {investmentsSubTab === 'accounting' && (
            <>
              {/* Muzz's Accounting Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🦘</div>
                  <div>
                    <h2 className="text-2xl font-bold">Muzz's Accounting Guide</h2>
                    <p className="text-emerald-100">Key ratios and metrics to analyze</p>
                  </div>
                </div>
              </div>

              {/* Core Ratios */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">📊 Core Ratios & Metrics</h2>
                  <p className="text-sm text-gray-500 mt-1">The fundamental numbers you need to track</p>
                </div>
                <div className="p-6 space-y-4">

                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <h3 className="text-md font-bold text-blue-800 mb-3">📈 Core "Return" Ratios</h3>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>• ROA (Return on Assets)</div>
                      <div>• ROTA (Return on Tangible Assets)</div>
                      <div>• ROE (Return on Equity)</div>
                      <div>• ROTE (Return on Tangible Equity)</div>
                      <div>• ROIC (Return on Invested Capital)</div>
                      <div>• ROTIC (Return on Tangible Invested Capital)</div>
                      <div>• RONTCE (Return on Net Tangible Capital Employed)</div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                    <h3 className="text-md font-bold text-purple-800 mb-3">⚡ Company Efficiency</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• DSO (Days Sales Outstanding)</li>
                      <li>• DPO (Days Payables Outstanding)</li>
                      <li>• CCC (Cash Conversion Cycle)</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                    <h3 className="text-md font-bold text-green-800 mb-3">📈 Core Growth Metrics (Calculate CAGR for)</h3>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>• Revenue</div>
                      <div>• Net Income</div>
                      <div>• EPS</div>
                      <div>• Owner Earnings / Free Cash Flow</div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                    <h3 className="text-md font-bold text-amber-800 mb-3">💵 Valuation Ratios</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• P/E Ratio</li>
                      <li>• P/B Ratio</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <h3 className="text-md font-bold text-red-800 mb-3">🏦 Liquidity & Solvency Ratios</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Long-Term Debt to Equity</li>
                      <li>• Total Debt to Equity</li>
                      <li>• Long-Term Debt to Net Income</li>
                      <li>• Current Liabilities to Current Assets</li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* Trend Checks */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">📉 Breakdown Metrics – Trend Checks</h2>
                  <p className="text-sm text-gray-500 mt-1">Track these over 10-15 years to spot red flags or strengths</p>
                </div>
                <div className="p-6 space-y-4">

                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200">
                    <h3 className="text-md font-bold text-indigo-800 mb-3">📄 Income Statement</h3>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>• Segment Revenue</div>
                      <div>• Total Revenue</div>
                      <div>• Cost of Sales</div>
                      <div>• Cost of Sales to Total Revenue</div>
                      <div>• Gross Profit</div>
                      <div>• Gross Margins</div>
                      <div>• Expenses (e.g., SG&A)</div>
                      <div>• Expenses to Gross Profit</div>
                      <div>• Operating Profit</div>
                      <div>• Operating Margin</div>
                      <div>• Interest Expense</div>
                      <div>• Interest Expense to Operating Profit</div>
                      <div>• Tax Expense</div>
                      <div>• Net Income</div>
                      <div>• Net Profit Margins</div>
                      <div>• EPS</div>
                    </div>
                  </div>

                  <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200">
                    <h3 className="text-md font-bold text-teal-800 mb-3">📋 Balance Sheet</h3>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>• Cash & Cash Equivalents</div>
                      <div>• Accounts Receivable</div>
                      <div>• DSO</div>
                      <div>• Inventory</div>
                      <div>• DIO + Inventory Turnover</div>
                      <div>• Current Assets</div>
                      <div>• Total Assets</div>
                      <div>• Accounts Payable</div>
                      <div>• DPO</div>
                      <div>• CCC</div>
                      <div>• Current Debt</div>
                      <div>• Current Debt to Current Assets</div>
                      <div>• Long Term Debt</div>
                      <div>• LT Debt to Shareholder Equity</div>
                      <div>• LT Debt to Net Income</div>
                      <div>• Total Debt</div>
                      <div>• Retained Earnings</div>
                      <div>• Return on Retained Earnings</div>
                      <div>• Shareholder Equity</div>
                      <div>• Shares Outstanding</div>
                      <div>• Book Value Per Share</div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                    <h3 className="text-md font-bold text-orange-800 mb-3">💸 Cash Flow Statement</h3>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>• Net Income</div>
                      <div>• Non Cash Charges</div>
                      <div>• Capital Expenditures</div>
                      <div>• Owner Earnings</div>
                      <div>• Operating Cash Flow</div>
                      <div>• CapEx to Operating Cash Flow</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Income Statement Deep Dive */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">📄 What to Look for in the Income Statement</h2>
                </div>
                <div className="p-6 space-y-4">

                  <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                    <h3 className="text-md font-bold text-green-800 mb-2">COGS & Gross Profit Margin</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• High and consistent gross profit margins = pricing power & durable competitive advantage</li>
                      <li>• Track 10-year gross margin stability</li>
                      <li>• Watch for rising operating expenses (R&D, SG&A, interest) that erode COGS strength</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <h3 className="text-md font-bold text-blue-800 mb-2">SG&A (Selling, General & Admin)</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• <span className="text-green-600 font-semibold">&lt;30% of gross profit = Excellent</span></li>
                      <li>• 30–80% = Still acceptable if consistent</li>
                      <li>• <span className="text-red-600 font-semibold">100% = Warning sign</span> (especially in competitive industries)</li>
                      <li>• Volatility in SG&A as % of gross profit = lack of moat</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                    <h3 className="text-md font-bold text-yellow-800 mb-2">R&D Expenses</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Buffett avoids companies with heavy R&D dependence (pharma, tech) — moats are fragile</li>
                      <li>• Moody's has no R&D; Coca-Cola only advertises</li>
                      <li>• <span className="font-semibold">Rule:</span> If future success relies on inventing the next big thing, Buffett isn't interested</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                    <h3 className="text-md font-bold text-purple-800 mb-2">Depreciation</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Durable moat companies have low depreciation as % of gross profit:</li>
                      <li className="ml-4">Coca-Cola ~6% | Wrigley ~7% | P&G ~8%</li>
                      <li>• Compare to capital-intensive: GM 22–57%</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <h3 className="text-md font-bold text-red-800 mb-2">Interest Expense</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• For non-financial firms: <span className="text-green-600 font-semibold">Interest &lt;15% of operating income = strong</span></li>
                      <li>• Financial institutions vary — compare within peer group</li>
                    </ul>
                  </div>

                  <div className="bg-gray-100 rounded-2xl p-4 border border-gray-300">
                    <h3 className="text-md font-bold text-gray-800 mb-2">Income Taxes Paid</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Cross-check actual tax paid with reported pre-tax income × 35%</li>
                      <li>• Large mismatch may indicate manipulation</li>
                      <li>• Honest companies don't cheat the IRS or their shareholders</li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* EPS Deep Dive */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">📈 EPS (Earnings Per Share) Analysis</h2>
                  <p className="text-sm text-gray-500 mt-1">EPS = Net Income / Shares Outstanding</p>
                </div>
                <div className="p-6 space-y-4">

                  <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                    <h3 className="text-md font-bold text-green-800 mb-2">✅ What GOOD EPS Looks Like</h3>
                    <p className="text-sm text-gray-700 mb-3">Consistent earnings with a long-term upward trend:</p>
                    <div className="bg-white rounded-lg p-3 font-mono text-sm">
                      <div className="grid grid-cols-2 gap-1">
                        <span>2008: $2.95</span><span>2003: $1.95</span>
                        <span>2007: $2.68</span><span>2002: $1.65</span>
                        <span>2006: $2.37</span><span>2001: $1.60</span>
                        <span>2005: $2.17</span><span>2000: $1.48</span>
                        <span>2004: $2.06</span><span>1999: $1.30</span>
                      </div>
                    </div>
                    <p className="text-sm text-green-700 mt-3">This shows the company has some kind of long-term competitive advantage working in its favor. Consistent earnings = product doesn't need expensive changes.</p>
                  </div>

                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <h3 className="text-md font-bold text-red-800 mb-2">❌ What BAD EPS Looks Like</h3>
                    <p className="text-sm text-gray-700 mb-3">Erratic earnings with losses:</p>
                    <div className="bg-white rounded-lg p-3 font-mono text-sm">
                      <div className="grid grid-cols-2 gap-1">
                        <span>2008: $2.50</span><span>2003: $5.03</span>
                        <span>2007: <span className="text-red-600">($0.45)</span></span><span>2002: $3.35</span>
                        <span>2006: $3.89</span><span>2001: $1.77</span>
                        <span>2005: <span className="text-red-600">($6.05)</span></span><span>2000: $6.68</span>
                        <span>2004: $6.39</span><span>1999: $8.53</span>
                      </div>
                    </div>
                    <p className="text-sm text-red-700 mt-3">This shows a fiercely competitive industry prone to booms and busts. Wild price swings create the illusion of buying opportunities — but it's really a long, slow boat ride to investor nowhere.</p>
                  </div>

                </div>
              </div>

              {/* Balance Sheet Deep Dive */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">📋 What to Look for in the Balance Sheet</h2>
                </div>
                <div className="p-6 space-y-4">

                  <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                    <h3 className="text-md font-bold text-green-800 mb-2">💵 Cash & Cash Equivalents</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Growing cash with consistent earnings (no share sales/debt) = good sign</li>
                      <li>• Large cash from asset sales or debt = less meaningful</li>
                      <li>• Strong businesses generate cash from operations, not one-offs</li>
                    </ul>
                    <div className="mt-2 p-2 bg-green-100 rounded-lg">
                      <p className="text-sm text-green-800 font-semibold">Rule: Lots of cash + little debt = will sail through troubled times. Hurting for cash + mountain of debt = sinking ship.</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                    <h3 className="text-md font-bold text-amber-800 mb-2">📦 Inventory</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Watch for changes in inventory trends vs sales</li>
                      <li>• Spike in inventory without sales growth = demand issues or overproduction</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <h3 className="text-md font-bold text-blue-800 mb-2">📊 Total Assets & ROA</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• ROA = Net Income / Total Assets</li>
                      <li>• High ROA = good asset efficiency</li>
                      <li>• <span className="font-semibold">But:</span> Extremely high ROA can signal low barriers to entry</li>
                      <li>• Example: Coke (12%) vs Moody's (43%) — Moody's may be easier to compete with</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <h3 className="text-md font-bold text-red-800 mb-2">⚠️ Short-Term Debt Risks</h3>
                    <p className="text-sm text-gray-700 mb-2">Why it's dangerous:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>1. If interest rates spike, refinancing becomes costly</li>
                      <li>2. If credit dries up, company can't roll over debt and may default</li>
                    </ul>
                    <p className="text-sm text-red-700 mt-2 font-semibold">Case in point: Bear Stearns collapsed when short-term funding disappeared. Stability = durability.</p>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                    <h3 className="text-md font-bold text-purple-800 mb-2">🏦 Long-Term Debt</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Great companies often carry little to no long-term debt</li>
                      <li>• They're so profitable they don't need it for expansion/acquisitions</li>
                      <li>• Watch out: Leveraged buyouts can add huge debt even to good businesses</li>
                    </ul>
                    <div className="mt-2 p-2 bg-purple-100 rounded-lg">
                      <p className="text-sm text-purple-800 font-semibold">Rule: Low or no long-term debt = long-term winner</p>
                    </div>
                  </div>

                  <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200">
                    <h3 className="text-md font-bold text-teal-800 mb-2">📈 Return on Shareholders' Equity (ROE)</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Measures how well management uses investors' money to generate profits</li>
                      <li>• High ROE = effective use of capital, strong business model</li>
                      <li>• Low ROE industries: Airlines typically 0–15% (highly competitive, low-margin)</li>
                    </ul>
                    <div className="mt-2 p-2 bg-yellow-100 rounded-lg">
                      <p className="text-sm text-yellow-800">⚠️ Note: Some high-ROE companies may show negative equity due to massive buybacks or payout of all retained earnings. Distinguish between strong businesses and insolvent ones.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Cash Flow Deep Dive */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">💸 Cash Flow Statement Insights</h2>
                </div>
                <div className="p-6 space-y-4">

                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200">
                    <h3 className="text-md font-bold text-indigo-800 mb-2">🏭 Capital Expenditures (CapEx)</h3>
                    <p className="text-sm text-gray-700 mb-2">Money spent on long-term assets (property, equipment, patents)</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Companies with durable advantages require less CapEx to maintain operations</li>
                      <li>• High CapEx = more debt or reduced earnings, weakening long-term economics</li>
                    </ul>
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="text-sm font-semibold text-indigo-800 mb-2">Buffett's Insight:</p>
                      <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>Great businesses: Coca-Cola uses 19% of earnings on CapEx, Moody's only 5%</p>
                      <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>Weak businesses: GM or Goodyear often use &gt;100% of earnings for CapEx (funded by debt)</p>
                    </div>
                    <div className="mt-3 p-2 bg-green-100 rounded-lg">
                      <p className="text-sm text-green-800"><span className="font-semibold">Rule of Thumb:</span> &lt;50% of earnings on CapEx = worth considering. &lt;25% = likely has strong competitive advantage.</p>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                    <h3 className="text-md font-bold text-green-800 mb-2">🔄 Stock Buybacks</h3>
                    <p className="text-sm text-gray-700 mb-2">Companies use excess cash to buy back their own shares</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Reduces share count → increases EPS</li>
                      <li>• Increases shareholders' value without creating a taxable event</li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* When to Sell */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-white">🚪 When You May Consider Selling</h2>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                      <div className="text-2xl mb-2">🎯</div>
                      <h3 className="text-md font-bold text-blue-800 mb-2">1. Better Opportunity</h3>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.9)"}}>Sell only if you find a better company at a better price.</p>
                    </div>

                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                      <div className="text-2xl mb-2">📉</div>
                      <h3 className="text-md font-bold text-orange-800 mb-2">2. Competitive Advantage Fades</h3>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.9)"}}>Sell if the company is losing its edge (e.g., newspapers vs internet).</p>
                    </div>

                    <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                      <div className="text-2xl mb-2">🎈</div>
                      <h3 className="text-md font-bold text-red-800 mb-2">3. Market Euphoria</h3>
                      <p className="text-sm" style={{color:"rgba(148,163,184,0.9)"}}>If price goes way above intrinsic value (e.g., P/E &gt; 40), consider selling.</p>
                    </div>

                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl">
                    <p className="text-teal-800 font-semibold">💡 Smart Move: If you sell in a bull market, hold cash or bonds and wait for the next bear market to reinvest.</p>
                  </div>
                </div>
              </div>

            </>
          )}

          {/* S&P 500 Guide */}
          {investmentsSubTab === 'sp500' && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">📈</div>
                  <div>
                    <h2 className="text-2xl font-bold">S&P 500 & Buffett's Investing Wisdom</h2>
                    <p className="text-blue-200">Lessons from Berkshire Hathaway's annual letters</p>
                  </div>
                </div>
              </div>

              {/* Buffett's Definition of Investing */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h2 className="text-xl font-semibold text-white">🧠 Buffett's Definition of Investing (2011)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <p className="text-sm text-gray-700 italic font-medium">"Investing is giving up purchasing power today, with a reasoned expectation of receiving MORE purchasing power — after taxes — in the future."</p>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <h3 className="text-md font-bold text-red-800 mb-2">Buffett's REAL Definition of Risk</h3>
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>Not volatility. Not beta.</p>
                    <p className="text-sm text-gray-700 font-semibold mt-1">Risk = The chance your investment won't protect (or grow) your purchasing power over time.</p>
                  </div>
                </div>
              </div>

              {/* Buffett's Will Instructions */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                  <h2 className="text-xl font-semibold text-white">📜 Buffett's Personal Will Instructions (2013)</h2>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">For his wife's trust, Buffett instructed:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 text-center">
                      <div className="text-3xl font-bold text-blue-600">10%</div>
                      <div className="text-sm text-gray-600 mt-1">Short-term government bonds</div>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200 text-center">
                      <div className="text-3xl font-bold text-green-600">90%</div>
                      <div className="text-sm text-gray-600 mt-1">Very low-cost S&P 500 index fund (Vanguard)</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3 italic">He believes this mix will beat most professionals.</p>
                </div>
              </div>

              {/* S&P 500 Performance 1964-2014 */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-yellow-50">
                  <h2 className="text-xl font-semibold text-white">📊 The Tailwind: S&P 500 vs the Dollar (1964–2014)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                      <h3 className="text-md font-bold text-green-800 mb-2">S&P 500 Performance</h3>
                      <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>Rose from <strong>84 → 2,059</strong></p>
                      <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>Including reinvested dividends:</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">11,196% total return</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                      <h3 className="text-md font-bold text-red-800 mb-2">Dollar Purchasing Power</h3>
                      <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>Fell <strong>87%</strong> over same period</p>
                      <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>What cost $0.13 in 1965 costs $1.00 in 2014</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200">
                    <p className="text-sm text-gray-700 font-medium">Over the long run, it has been far safer to own a diversified collection of American businesses than to hold currency-based assets like Treasuries or cash. This was true through the Great Depression, two world wars, and Buffett expects it for the next century.</p>
                  </div>
                </div>
              </div>

              {/* Voting Machine vs Weighing Machine */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-violet-50">
                  <h2 className="text-xl font-semibold text-white">⚖️ Voting Machine vs Weighing Machine (2017)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                      <h3 className="text-md font-bold text-red-800 mb-2">Short Term</h3>
                      <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>Market is a <strong>voting machine</strong> (popularity contest). Stock prices surge and swoon seemingly unconnected to underlying value.</p>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                      <h3 className="text-md font-bold text-green-800 mb-2">Long Term</h3>
                      <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>Market is a <strong>weighing machine</strong> (business reality). Retained earnings + ROE + moat + management shows up in price.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Berkshire Drawdowns */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
                  <h2 className="text-xl font-semibold text-white">📉 Berkshire's Major Drawdowns — Price Crashes Are Normal</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b-2">
                        <th className="text-left py-2 px-3">Period</th>
                        <th className="text-right py-2 px-3">High</th>
                        <th className="text-right py-2 px-3">Low</th>
                        <th className="text-right py-2 px-3">Decline</th>
                      </tr></thead>
                      <tbody>
                        {[
                          { period: 'Mar 1973 – Jan 1975', high: '$93', low: '$38', decline: '-59.1%' },
                          { period: 'Oct 2 – Oct 27, 1987', high: '$4,250', low: '$2,675', decline: '-37.1%' },
                          { period: 'Jun 1998 – Mar 2000', high: '$80,900', low: '$41,300', decline: '-48.9%' },
                          { period: 'Sep 2008 – Mar 2009', high: '$147,000', low: '$72,400', decline: '-50.7%' }
                        ].map((row, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-2 px-3 text-gray-700">{row.period}</td>
                            <td className="py-2 px-3 text-right text-green-600 font-medium">{row.high}</td>
                            <td className="py-2 px-3 text-right text-red-600 font-medium">{row.low}</td>
                            <td className="py-2 px-3 text-right text-red-600 font-bold">{row.decline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                    <p className="text-sm text-gray-700 font-medium">Even Berkshire, with 50+ years of compounding and great businesses, has had multiple 40–60% price crashes. Big drawdowns are normal — intrinsic value compounded steadily underneath.</p>
                  </div>
                </div>
              </div>

              {/* Never Use Debt */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-red-50 to-pink-50">
                  <h2 className="text-xl font-semibold text-white">🚫 The Strongest Argument Against Using Debt in Stocks</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <p className="text-sm text-gray-700 italic font-medium">"This table offers the strongest argument I can muster against ever using borrowed money to own stocks."</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>• You can't predict how far or how fast stocks can fall short-term</p>
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>• Even small borrowings can wreck your decision-making — headlines + crashing values = fear = panic selling</p>
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>• An unsettled mind makes bad decisions at the worst possible time</p>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                    <p className="text-sm text-gray-700 italic">"The light can at any time go from green to red without pausing at yellow."</p>
                    <p className="text-sm text-gray-700 font-semibold mt-2">Rule: No margin. No leverage. Keep yourself structurally calm and unforced.</p>
                  </div>
                </div>
              </div>

              {/* Crashes as Opportunities */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                  <h2 className="text-xl font-semibold text-white">💎 Crashes as Opportunities (If You're Not in Debt)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>For the unleveraged investor, big drops are "extraordinary opportunities" — a chance to buy great businesses at bargain prices.</p>
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200">
                    <p className="text-sm text-gray-700 font-medium mb-2">The mindset you need (from Kipling's "If"):</p>
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>• Keep your head while others lose theirs</p>
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>• Be patient and not worn out by waiting</p>
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>• Think clearly but don't over-obsess</p>
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>• Trust yourself when others doubt you</p>
                  </div>
                </div>
              </div>

              {/* The Bet */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-yellow-50">
                  <h2 className="text-xl font-semibold text-white">🏆 The Bet: S&P 500 vs Hedge Funds (2007–2017)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>Buffett bet that a zero-fee S&P 500 index fund would beat five fund-of-funds (each holding 200+ hedge funds) over 10 years.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b-2 bg-gray-50">
                        <th className="text-left py-2 px-2">Investment</th>
                        <th className="text-right py-2 px-2">10-Year Return</th>
                        <th className="text-right py-2 px-2">Avg/Year</th>
                      </tr></thead>
                      <tbody>
                        {[
                          { name: 'Fund A', ret: '21.7%', avg: '2.0%' },
                          { name: 'Fund B', ret: '42.3%', avg: '3.6%' },
                          { name: 'Fund C', ret: '87.7%', avg: '6.5%' },
                          { name: 'Fund D (9yr)', ret: '2.8%', avg: '0.3%' },
                          { name: 'Fund E', ret: '27.0%', avg: '2.4%' },
                          { name: 'S&P 500 Index', ret: '125.8%', avg: '8.5%' }
                        ].map((row, i) => (
                          <tr key={i} className={`border-b ${row.name === 'S&P 500 Index' ? 'bg-green-50 font-bold' : ''}`}>
                            <td className="py-2 px-2">{row.name}</td>
                            <td className={`py-2 px-2 text-right ${row.name === 'S&P 500 Index' ? 'text-green-600' : 'text-gray-600'}`}>{row.ret}</td>
                            <td className={`py-2 px-2 text-right ${row.name === 'S&P 500 Index' ? 'text-green-600' : 'text-gray-600'}`}>{row.avg}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <p className="text-sm text-gray-700 italic font-medium">"Performance comes, performance goes. Fees never falter."</p>
                    <p className="text-sm text-gray-700 mt-2">~60% of gross gains from the hedge fund basket were consumed in two layers of fees. Investors lost. Managers got rich.</p>
                  </div>
                </div>
              </div>

              {/* Why Hedge Funds Fail */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
                  <h2 className="text-xl font-semibold text-white">❌ Why Almost All Hedge Funds Fail Long-Term</h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}><strong>1. Size:</strong> Good performance attracts money, size explodes — big money is harder to compound.</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}><strong>2. Luck mistaken for skill:</strong> A manager could be lucky for 3, 5, even 10 years.</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}><strong>3. Fee incentive:</strong> More AUM = more fees, so managers keep growing, lowering future returns.</p>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200 mt-2">
                    <p className="text-sm text-gray-700 italic font-medium">"What is easy with millions becomes impossible with billions."</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}><strong>Why active investors lose:</strong> Active investors, in aggregate, ARE the market. Passive investors match the market. Active investors have far higher costs. Therefore passive investors MUST win. It's simple arithmetic, not theory.</p>
                  </div>
                </div>
              </div>

              {/* The American Tailwind */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h2 className="text-xl font-semibold text-white">🇺🇸 The American Tailwind (2018)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>Buffett made his first investment on March 11, 1942 at age 11 — $114.75 for 3 shares of Cities Service. He traces what happened across 77 years.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b-2 bg-gray-50">
                        <th className="text-left py-2 px-3">Scenario (starting 1942)</th>
                        <th className="text-right py-2 px-3">Result by 2019</th>
                      </tr></thead>
                      <tbody>
                        {[
                          { scenario: 'S&P 500 Index Fund (no fee)', result: '$606,811', highlight: true },
                          { scenario: 'S&P 500 at $1M scale', result: '$5.3 Billion', highlight: true },
                          { scenario: 'Same $1M but paying 1% yearly fees', result: '$2.65 Billion', highlight: false },
                          { scenario: 'Buy 3.25 oz of gold', result: '$4,200', highlight: false }
                        ].map((row, i) => (
                          <tr key={i} className={`border-b ${row.highlight ? 'bg-green-50' : ''}`}>
                            <td className="py-2 px-3 text-gray-700">{row.scenario}</td>
                            <td className={`py-2 px-3 text-right font-bold ${row.highlight ? 'text-green-600' : 'text-gray-600'}`}>{row.result}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                    <p className="text-sm text-gray-700 italic font-medium">"The magical metal was no match for the American mettle."</p>
                    <p className="text-sm text-gray-700 mt-2">Gold gained less than 1% of what American business produced over the same period.</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>America prospered under 7 Republican and 7 Democratic presidents from 1942–2019. Despite high inflation, 21% prime rates, wars, housing collapse, financial panic, and presidential resignation — U.S. household wealth reached $108 trillion.</p>
                  </div>
                </div>
              </div>

              {/* Buffett's Recommendation */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                  <h2 className="text-xl font-semibold text-white">✅ Buffett's Recommendation (60 Years Straight)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-green-50 rounded-2xl p-5 border-2 border-green-300 text-center">
                    <p className="text-lg font-bold text-green-700">"Buy a low-cost S&P 500 index fund."</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>• Middle-class people follow the advice</p>
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>• Rich people almost NEVER follow it</p>
                    <p className="text-sm" style={{color:"rgba(203,213,225,0.85)"}}>• Institutions never follow it</p>
                    <p className="text-sm text-gray-500 mt-2">Because they want special treatment, complex solutions, fancy "styles," and Wall Street relationships — even though an index fund is almost always the best answer.</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <p className="text-sm text-gray-700 font-medium">On Jack Bogle (creator of index funds):</p>
                    <p className="text-sm text-gray-700 italic">"If a statue is ever erected to honor the person who has done the most for investors, it should be Jack Bogle."</p>
                  </div>
                </div>
              </div>

              {/* Ultimate Lessons */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
                  <h2 className="text-xl font-semibold text-white">⭐ Ultimate Lessons</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { emoji: '📉', text: 'Low-cost index funds beat most professionals' },
                      { emoji: '💸', text: 'Fees are the biggest enemy of investment returns' },
                      { emoji: '🧘', text: 'Simple > Complex' },
                      { emoji: '📈', text: 'Long-term stocks > Long-term bonds' },
                      { emoji: '⚡', text: 'Volatility ≠ Risk — failing to protect purchasing power = risk' },
                      { emoji: '🪑', text: 'Activity kills returns — inactivity builds wealth' },
                      { emoji: '🎯', text: 'Big, obvious decisions outperform constant tinkering' },
                      { emoji: '🇺🇸', text: 'Bet on America — compounding over decades is unstoppable' }
                    ].map((lesson, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-xl">{lesson.emoji}</span>
                        <p className="text-sm text-gray-700 font-medium">{lesson.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Classic Quotes */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-gray-100">
                  <h2 className="text-xl font-semibold text-white">💬 Classic Buffett Lines</h2>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    "When trillions are managed by Wall Streeters charging high fees, the managers are the ones who reap outsized profits — not the clients.",
                    "Both small and large investors should stick with low-cost index funds.",
                    "When a person with money meets a person with experience, the one with experience ends up with the money, and the one with money leaves with experience.",
                    "It is beyond arrogance for businesses or individuals to boast that they have done it alone.",
                    "Big, easy decisions > thousands of tiny ones. After that kindergarten-like analysis, we made the switch and relaxed."
                  ].map((quote, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-sm text-gray-700 italic">"{quote}"</p>
                      <p className="text-xs text-gray-400 mt-1">— Warren Buffett</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Muzz Note */}
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-3xl p-6 border border-amber-200">
                <p className="text-amber-900 font-semibold">🦘 Muzz's Note: "This info is pulled from Berkshire Hathaway's actual annual letters. It's not financial advice — it's education from one of the greatest investors of all time. Do your own research, but use this as a solid foundation for understanding long-term investing. You've got this, legend!"</p>
              </div>
            </>
          )}

          {/* Compound Interest Calculator */}
          {investmentsSubTab === 'compound' && (() => {
            const calcCompound = () => {
              const p = parseFloat(compoundCalc.principal) || 0;
              const m = parseFloat(compoundCalc.monthlyAdd) || 0;
              const r = (parseFloat(compoundCalc.rate) || 0) / 100;
              const y = parseInt(compoundCalc.years) || 0;
              const monthly = r / 12;
              let balance = p;
              const yearData = [];
              for (let i = 1; i <= y; i++) {
                for (let j = 0; j < 12; j++) { balance = balance * (1 + monthly) + m; }
                yearData.push({ year: i, balance: Math.round(balance) });
              }
              const totalContributed = p + (m * 12 * y);
              return { finalBalance: Math.round(balance), totalContributed: Math.round(totalContributed), totalInterest: Math.round(balance - totalContributed), yearData };
            };
            const compResult = calcCompound();
            return (
              <div className="space-y-6">
                <div className="rounded-3xl p-6" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)",backdropFilter:"blur(10px)"}}>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">📈 Compound Interest Calculator</h2>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Starting Amount ($)</label>
                      <input type="text" value={compoundCalc.principal} onChange={(e) => setCompoundCalc(prev => ({ ...prev, principal: e.target.value.replace(/[^0-9.]/g, '') }))} placeholder="10,000" className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Monthly Contribution ($)</label>
                      <input type="text" value={compoundCalc.monthlyAdd} onChange={(e) => setCompoundCalc(prev => ({ ...prev, monthlyAdd: e.target.value.replace(/[^0-9.]/g, '') }))} placeholder="500" className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Annual Return (%)</label>
                      <input type="text" value={compoundCalc.rate} onChange={(e) => setCompoundCalc(prev => ({ ...prev, rate: e.target.value.replace(/[^0-9.]/g, '') }))} placeholder="7" className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Time Period (years)</label>
                      <input type="text" value={compoundCalc.years} onChange={(e) => setCompoundCalc(prev => ({ ...prev, years: e.target.value.replace(/[^0-9]/g, '') }))} placeholder="10" className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-green-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white text-center">
                      <div className="text-xl sm:text-2xl font-bold">${compResult.finalBalance.toLocaleString()}</div>
                      <div className="text-xs text-green-100">Final Balance</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white text-center">
                      <div className="text-xl sm:text-2xl font-bold">${compResult.totalContributed.toLocaleString()}</div>
                      <div className="text-xs text-blue-100">You Contributed</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 text-white text-center">
                      <div className="text-xl sm:text-2xl font-bold">${compResult.totalInterest.toLocaleString()}</div>
                      <div className="text-xs text-purple-100">Interest Earned</div>
                    </div>
                  </div>
                  {compResult.yearData.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-white mb-3">Growth Over Time</h3>
                      <div className="flex items-end gap-1 h-40 bg-gray-50 rounded-xl p-3">
                        {compResult.yearData.map((d, i) => {
                          const maxVal = compResult.yearData[compResult.yearData.length - 1].balance || 1;
                          const height = (d.balance / maxVal) * 100;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                              <div className="absolute bottom-full mb-1 hidden group-hover:block text-xs px-2 py-1 rounded whitespace-nowrap z-10" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Year {d.year}: ${d.balance.toLocaleString()}</div>
                              <div className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t transition-all duration-300" style={{ height: `${Math.max(height, 2)}%` }} />
                              {(i === 0 || i === compResult.yearData.length - 1 || (i + 1) % 5 === 0) && (<span className="text-[9px] text-gray-400 mt-1">{d.year}y</span>)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-sm text-amber-800 font-medium">🦘 Muzz's Note: This calculator is for education only — not financial advice. Past returns don't guarantee future results. But compound interest is powerful, mate!</p>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    );
  }

  // TIMETABLE VIEW
  if (activeView === 'timetable') {
    if (!isElite) return <LockedFeature featureName="Timetable" setActiveView={setActiveView} />;
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const hours = Array.from({length:16},(_,i)=>i+7);
    const fmt12 = (h) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`;
    const today = new Date().toLocaleDateString('en-AU',{weekday:'short'}).slice(0,3);
    const hexToRgba = (hex, a) => {
      try { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
      catch { return `rgba(139,92,246,${a})`; }
    };
    const types = ['uni','work','gym','study','personal','other'];
    const editing = ttEditingId ? timetableBlocks.find(b=>b.id===ttEditingId) : null;
    const formBlock = editing || ttNewBlock;
    const setForm = (u) => {
      if (ttEditingId) { setTimetableBlocks(prev=>prev.map(b=>b.id===ttEditingId?{...b,...u}:b)); }
      else { setTtNewBlock(prev=>({...prev,...u})); }
    };
    const saveBlock = () => {
      if (!formBlock.title.trim()) return;
      if (ttEditingId) { setTtEditingId(null); setTtTab('week'); }
      else { setTimetableBlocks(prev=>[...prev,{...ttNewBlock,id:Date.now()}]); setTtNewBlock({title:'',type:'uni',day:'Mon',startHour:9,endHour:10,color:'#8b5cf6',location:''}); setTtTab('week'); }
    };
    const presets = ['#8b5cf6','#3b82f6','#22c55e','#ef4444','#f97316','#f59e0b','#14b8a6','#ec4899'];
    return (
      <div className="min-h-screen bg-transparent pb-24">
        <Sidebar /><SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-5xl mx-auto">
            <button onClick={()=>setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px",letterSpacing:"0.5px"}}>← Back</button>
            <h1 className="text-3xl font-bold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Timetable</h1>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {[{id:'week',label:'Week View'},{id:'list',label:'List'},{id:'add',label:'+ Add Block'}].map(t=>(
              <button key={t.id} onClick={()=>{setTtTab(t.id);if(t.id!=='add')setTtEditingId(null);}}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${ttTab===t.id?'cyber-tab-active':'text-slate-400 hover:text-slate-200'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* WEEK GRID */}
          {ttTab==='week' && (
            <div className="rounded-2xl overflow-x-auto" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
              <div style={{minWidth:'600px'}}>
                {/* Header */}
                <div style={{display:'grid',gridTemplateColumns:'52px repeat(7,1fr)',borderBottom:'1px solid rgba(0,200,255,0.1)'}}>
                  <div/>
                  {days.map(d=>(
                    <div key={d} style={{padding:'8px',textAlign:'center',fontSize:'11px',fontFamily:'monospace',fontWeight:'bold',color:d===today?'#00c8ff':'rgba(148,163,184,0.6)',background:d===today?'rgba(0,200,255,0.05)':'transparent'}}>
                      {d}
                    </div>
                  ))}
                </div>
                {/* Grid body - each column is independent so blocks can span rows */}
                <div style={{display:'flex'}}>
                  {/* Time labels column */}
                  <div style={{width:'52px',flexShrink:0}}>
                    {hours.map(h=>(
                      <div key={h} style={{height:'40px',display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:'8px',borderTop:'1px solid rgba(0,200,255,0.06)',color:'rgba(148,163,184,0.4)',fontSize:'10px',fontFamily:'monospace'}}>
                        {fmt12(h)}
                      </div>
                    ))}
                  </div>
                  {/* Day columns */}
                  {days.map(d=>(
                    <div key={d} style={{flex:1,position:'relative',background:d===today?'rgba(0,200,255,0.01)':'transparent'}}>
                      {/* Hour cells for borders */}
                      {hours.map(h=>(
                        <div key={h} style={{height:'40px',borderTop:'1px solid rgba(0,200,255,0.06)',borderLeft:'1px solid rgba(0,200,255,0.04)'}}/>
                      ))}
                      {/* Blocks positioned absolutely */}
                      {timetableBlocks.filter(b=>b.day===d).map(block=>{
                        const startIdx = hours.indexOf(block.startHour);
                        const endIdx = hours.indexOf(block.endHour);
                        if(startIdx === -1) return null;
                        const actualEnd = endIdx === -1 ? hours.length : endIdx;
                        const ROW_H = 41;
                        const top = startIdx * ROW_H + 1;
                        const height = (actualEnd - startIdx) * ROW_H - 1;
                        return (
                          <div key={block.id}
                            onClick={()=>{setTtEditingId(block.id);setTtTab('add');}}
                            style={{
                              position:'absolute',
                              top:`${top}px`,
                              left:'2px',
                              right:'2px',
                              height:`${height}px`,
                              background:hexToRgba(block.color,0.25),
                              border:`1px solid ${hexToRgba(block.color,0.7)}`,
                              borderRadius:'6px',
                              padding:'4px',
                              cursor:'pointer',
                              zIndex:2,
                              overflow:'hidden'
                            }}>
                            <div style={{fontSize:'11px',fontWeight:500,color:'white',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{block.title}</div>
                            {block.location && <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{block.location}</div>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

                    {ttTab==='list' && (
            <div className="space-y-4">
              {timetableBlocks.length===0 && (
                <div className="rounded-2xl p-8 text-center" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.1)"}}>
                  <div className="text-3xl mb-2">📅</div>
                  <div style={{color:"rgba(148,163,184,0.5)"}}>No blocks yet. Tap + Add Block to get started.</div>
                </div>
              )}
              {days.map(d=>{
                const dayBlocks = timetableBlocks.filter(b=>b.day===d).sort((a,b)=>a.startHour-b.startHour);
                if(!dayBlocks.length) return null;
                return (
                  <div key={d}>
                    <div className="text-xs font-mono mb-2 px-1" style={{color:'rgba(0,200,255,0.5)',letterSpacing:'2px'}}>{d.toUpperCase()}{d===today?' — TODAY':''}</div>
                    {dayBlocks.map(b=>(
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{background:"rgba(5,15,30,0.8)",border:`1px solid ${hexToRgba(b.color,0.3)}`}}>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:b.color,boxShadow:`0 0 8px ${b.color}`}} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{b.title}</div>
                          <div className="text-xs font-mono" style={{color:'rgba(148,163,184,0.5)'}}>{fmt12(b.startHour)} – {fmt12(b.endHour)}{b.location?` · ${b.location}`:''}</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{background:hexToRgba(b.color,0.15),color:b.color}}>{b.type}</span>
                        <button onClick={()=>{setTtEditingId(b.id);setTtTab('add');}} className="text-xs px-2 py-1 rounded-lg transition-all" style={{color:'rgba(0,200,255,0.6)',border:'1px solid rgba(0,200,255,0.2)'}}>edit</button>
                        <button onClick={()=>setTimetableBlocks(prev=>prev.filter(x=>x.id!==b.id))} className="text-xs px-2 py-1 rounded-lg" style={{color:'rgba(239,68,68,0.6)',border:'1px solid rgba(239,68,68,0.2)'}}>✕</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* ADD / EDIT FORM */}
          {ttTab==='add' && (
            <div className="rounded-2xl p-6 space-y-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.15)"}}>
              <h3 className="text-white font-semibold text-lg">{ttEditingId?'Edit Block':'New Block'}</h3>
              <input value={formBlock.title} onChange={e=>setForm({title:e.target.value})} placeholder="Block title e.g. COMP1234..."
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.2)"}} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-mono mb-1" style={{color:"rgba(0,200,255,0.4)"}}>DAY</div>
                  <select value={formBlock.day} onChange={e=>setForm({day:e.target.value})}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none"
                    style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.2)"}}>
                    {days.map(d=><option key={d} value={d} style={{background:'#020c1b'}}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-xs font-mono mb-1" style={{color:"rgba(0,200,255,0.4)"}}>TYPE</div>
                  <select value={formBlock.type} onChange={e=>setForm({type:e.target.value})}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none capitalize"
                    style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.2)"}}>
                    {types.map(t=><option key={t} value={t} style={{background:'#020c1b'}} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-xs font-mono mb-1" style={{color:"rgba(0,200,255,0.4)"}}>START</div>
                  <select value={formBlock.startHour} onChange={e=>setForm({startHour:parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none"
                    style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.2)"}}>
                    {hours.map(h=><option key={h} value={h} style={{background:'#020c1b'}}>{fmt12(h)}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-xs font-mono mb-1" style={{color:"rgba(0,200,255,0.4)"}}>END</div>
                  <select value={formBlock.endHour} onChange={e=>setForm({endHour:parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl text-white focus:outline-none"
                    style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.2)"}}>
                    {hours.filter(h=>h>formBlock.startHour).map(h=><option key={h} value={h} style={{background:'#020c1b'}}>{fmt12(h)}</option>)}
                  </select>
                </div>
              </div>
              <input value={formBlock.location} onChange={e=>setForm({location:e.target.value})} placeholder="Location (optional)"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                style={{background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.2)"}} />
              <div>
                <div className="text-xs font-mono mb-2" style={{color:"rgba(0,200,255,0.4)"}}>COLOUR</div>
                <div className="flex gap-2 flex-wrap items-center">
                  {presets.map(c=>(
                    <button key={c} onClick={()=>setForm({color:c})}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{background:c,border:formBlock.color===c?'2px solid white':'2px solid transparent',boxShadow:formBlock.color===c?`0 0 10px ${c}`:'none'}} />
                  ))}
                  <input type="color" value={formBlock.color} onChange={e=>setForm({color:e.target.value})}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveBlock}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-all"
                  style={{background:'linear-gradient(135deg,#00a8d4,#0070a0)',border:'1px solid rgba(0,200,255,0.3)',boxShadow:'0 0 16px rgba(0,200,255,0.15)'}}>
                  {ttEditingId?'Save Changes':'Add Block'}
                </button>
                {ttEditingId && (
                  <button onClick={()=>{setTimetableBlocks(prev=>prev.filter(b=>b.id!==ttEditingId));setTtEditingId(null);setTtTab('list');}}
                    className="px-4 py-3 rounded-xl font-medium transition-all"
                    style={{color:'rgba(239,68,68,0.7)',border:'1px solid rgba(239,68,68,0.2)'}}>Delete</button>
                )}
                <button onClick={()=>{setTtEditingId(null);setTtTab('week');}}
                  className="px-4 py-3 rounded-xl font-medium transition-all"
                  style={{color:'rgba(148,163,184,0.5)',border:'1px solid rgba(148,163,184,0.1)'}}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // TIMETABLE VIEW
  // STATS & INSIGHTS VIEW
  if (activeView === 'statsinsights') {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);
    const totalHabitDays = Object.keys(habitLog || {}).length;
    const thisMonthHabits = Object.keys(habitLog || {}).filter(k => k.includes(thisMonth)).length;
    const completedTasks = Array.isArray(dailyTasks) ? dailyTasks.filter(t => t.completed).length : 0;
    const totalTasks = Array.isArray(dailyTasks) ? dailyTasks.length : 0;
    const sleepEntries = Object.values(sleepData || {}).filter(s => s.hoursSlept);
    const avgSleep = sleepEntries.length > 0 ? (sleepEntries.reduce((s,e) => s + parseFloat(e.hoursSlept||0), 0) / sleepEntries.length).toFixed(1) : '—';
    const moodEntries = Object.values(mentalHealthData || {}).filter(m => m.mood);
    const avgMood = moodEntries.length > 0 ? (moodEntries.reduce((s,e) => s + (e.mood||0), 0) / moodEntries.length).toFixed(1) : '—';
    const moodEmojis = { 1:'😔', 2:'😕', 3:'😐', 4:'🙂', 5:'😄' };
    const savingsRateNum = salaryNum > 0 ? ((salaryNum - totalMonthly) / salaryNum * 100).toFixed(0) : 0;
    const statCards = [
      { label:'NET WORTH', value:`$${netWorth.toLocaleString()}`, sub:'total assets', color:'#00c8ff', icon:'💰' },
      { label:'SAVINGS RATE', value:`${savingsRateNum}%`, sub:'of monthly income', color:'#22c55e', icon:'📈' },
      { label:'PORTFOLIO', value:`$${totalStocks.toLocaleString()}`, sub:`${stocks.length} holdings`, color:'#8b5cf6', icon:'💹' },
      { label:'MONTHLY BILLS', value:`$${totalMonthly.toFixed(0)}`, sub:'per month', color:'#ef4444', icon:'💸' },
      { label:'HABIT CHECK-INS', value:totalHabitDays, sub:'all time', color:'#f97316', icon:'🔥' },
      { label:'THIS MONTH', value:thisMonthHabits, sub:'habit completions', color:'#f59e0b', icon:'📅' },
      { label:'TASKS TODAY', value:`${completedTasks}/${totalTasks}`, sub:'completed', color:'#3b82f6', icon:'✅' },
      { label:'AVG SLEEP', value:`${avgSleep}h`, sub:`${sleepEntries.length} nights tracked`, color:'#6366f1', icon:'🌙' },
      { label:'AVG MOOD', value:avgMood !== '—' ? `${avgMood} ${moodEmojis[Math.round(parseFloat(avgMood))]||''}` : '—', sub:`${moodEntries.length} days tracked`, color:'#ec4899', icon:'🧠' },
      { label:'ASSETS', value:assets.length, sub:'tracked assets', color:'#14b8a6', icon:'🏠' },
      { label:'HABITS', value:habits.length, sub:'active habits', color:'#a855f7', icon:'⚡' },
      { label:'COUNTDOWNS', value:countdowns.length, sub:'upcoming events', color:'#f43f5e', icon:'⏳' },
    ];
    return (
      <div className="min-h-screen bg-transparent pb-24">
        <Sidebar /><SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setActiveView('home')} className="mb-4 font-medium flex items-center gap-1" style={{color:"rgba(0,200,255,0.8)",fontSize:"13px",letterSpacing:"0.5px"}}>← Back</button>
            <div className="text-xs font-mono mb-1" style={{color:"rgba(0,200,255,0.4)",letterSpacing:"2px"}}>// YOUR LIFE DATA</div>
            <h1 className="text-3xl font-bold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>Stats & Insights</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statCards.map((s, i) => (
              <div key={i} className="rounded-2xl p-4" style={{background:"rgba(5,15,30,0.8)",border:`1px solid ${s.color}30`,boxShadow:`inset 0 0 20px ${s.color}08`}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono" style={{color:`${s.color}90`,letterSpacing:"1px"}}>{s.label}</span>
                  <span className="text-base">{s.icon}</span>
                </div>
                <div className="text-2xl font-bold text-white" style={{textShadow:`0 0 12px ${s.color}66`}}>{s.value}</div>
                <div className="text-xs mt-1" style={{color:"rgba(148,163,184,0.5)"}}>{s.sub}</div>
                <div className="mt-3 h-0.5 rounded-full" style={{background:`linear-gradient(90deg,${s.color}50,transparent)`}} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  if (activeView === 'habits') {
    const today = new Date().toISOString().split('T')[0];
    const toggleHabit = (habitId, date) => {
      const key = `${habitId}:${date}`;
      setHabitLog(prev => {
        const updated = { ...prev };
        if (updated[key]) delete updated[key];
        else updated[key] = true;
        return updated;
      });
    };
    const getStreak = (habitId) => {
      let streak = 0;
      let d = new Date();
      while (true) {
        const dateStr = d.toISOString().split('T')[0];
        if (habitLog[`${habitId}:${dateStr}`]) { streak++; d.setDate(d.getDate() - 1); }
        else break;
      }
      return streak;
    };
    const getLast31Days = () => {
      const days = [];
      for (let i = 30; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
      }
      return days;
    };
    const last31 = getLast31Days();

    return (
      <div className="min-h-screen bg-transparent pb-24">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setActiveView('home')} className="mb-4 text-sm transition-colors flex items-center gap-1" style={{color:"rgba(0,200,255,0.7)",letterSpacing:"0.5px"}}>← Back</button>
            <h1 className="text-3xl font-bold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>🔥 Habit Tracker</h1>
            <p className="text-white/70 mt-1">Build streaks. Build discipline.</p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* Add Habit */}
          <button
            onClick={() => setHabits(prev => [...prev, { id: Date.now().toString(), name: '', icon: '✅', createdAt: today }])}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-2xl font-medium hover:scale-[1.02] transition-transform shadow-lg"
          >
            + Add New Habit
          </button>

          {habits.length === 0 && (
            <div className="bg-white rounded-3xl p-12 shadow-sm border text-center">
              <div className="text-5xl mb-4">🔥</div>
              <p className="text-gray-500">No habits yet. Add one above to start building streaks!</p>
            </div>
          )}

          {habits.map(habit => {
            const streak = getStreak(habit.id);
            const completedToday = !!habitLog[`${habit.id}:${today}`];
            return (
              <div key={habit.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="text"
                      value={habit.icon}
                      onChange={(e) => setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, icon: e.target.value.slice(0, 2) } : h))}
                      className="w-10 h-10 text-center text-xl bg-gray-100 rounded-xl focus:outline-none"
                    />
                    <input
                      type="text"
                      value={habit.name}
                      onChange={(e) => setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, name: e.target.value } : h))}
                      placeholder="Habit name..."
                      className="flex-1 text-lg font-semibold bg-transparent focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleHabit(habit.id, today)}
                        className={`w-12 h-12 rounded-xl text-2xl transition-all ${completedToday ? 'bg-green-500 text-white scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        {completedToday ? '✓' : '○'}
                      </button>
                      <button
                        onClick={() => setHabits(prev => prev.filter(h => h.id !== habit.id))}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Heatmap - Last 31 Days */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))' }}>
                    {last31.map(date => {
                      const done = !!habitLog[`${habit.id}:${date}`];
                      const isToday = date === today;
                      return (
                        <div
                          key={date}
                          onClick={() => toggleHabit(habit.id, date)}
                          title={`${new Date(date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}${done ? ' ✓' : ''}`}
                          className="aspect-square rounded-lg cursor-pointer transition-all min-h-[28px]"
                          style={done ? {background:'rgba(0,200,255,0.8)',boxShadow:'0 0 8px rgba(0,200,255,0.6), 0 0 16px rgba(0,200,255,0.3)'} : isToday ? {background:'rgba(0,200,255,0.15)',border:'1px solid rgba(0,200,255,0.4)'} : {background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)'}}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Last 31 days — click to toggle</p>
                </div>
              </div>
            );
          })}
        </div>
        <FloatingChat isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} chatMessages={chatMessages} setChatMessages={setChatMessages} isTyping={isTyping} setIsTyping={setIsTyping} financialContext={financialContext} isAiLimitReached={isAiLimitReached} incrementAiUsage={incrementAiUsage} getAiRemaining={getAiRemaining} AI_DAILY_LIMIT={AI_DAILY_LIMIT} muzzPersonality={muzzPersonality} />
      </div>
    );
  }

  // ============================================
  // COUNTDOWNS VIEW
  // ============================================
  if (activeView === 'countdowns') {
    const today = new Date();
    const getCountdown = (dateStr) => {
      const target = new Date(dateStr);
      const diff = target - today;
      if (diff <= 0) return { days: 0, hours: 0, mins: 0, passed: true };
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return { days, hours, mins, passed: false };
    };
    const gradients = [
      'from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-orange-500 to-red-600',
      'from-green-500 to-teal-600', 'from-rose-500 to-pink-600', 'from-cyan-500 to-blue-600',
      'from-amber-500 to-orange-600', 'from-violet-500 to-purple-600'
    ];

    return (
      <div className="min-h-screen bg-transparent pb-24">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setActiveView('home')} className="mb-4 text-sm transition-colors flex items-center gap-1" style={{color:"rgba(0,200,255,0.7)",letterSpacing:"0.5px"}}>← Back</button>
            <h1 className="text-3xl font-bold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>⏳ Countdowns</h1>
            <p className="text-white/70 mt-1">Count down to the things that matter</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setCountdownsSubTab('countdowns')} className="px-4 py-2 rounded-full text-sm font-medium transition-all text-white" style={{ border: countdownsSubTab === 'countdowns' ? '2px solid white' : '2px solid transparent' }}>Countdowns</button>
              <button onClick={() => setCountdownsSubTab('bucketlist')} className="px-4 py-2 rounded-full text-sm font-medium transition-all text-white" style={{ border: countdownsSubTab === 'bucketlist' ? '2px solid white' : '2px solid transparent' }}>Bucket List</button>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4" style={{ display: countdownsSubTab === 'countdowns' ? 'block' : 'none' }}>
          <button
            onClick={() => setCountdowns(prev => [...prev, { id: Date.now().toString(), name: '', emoji: '✈️', date: '', color: gradients[prev.length % gradients.length] }])}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-medium hover:scale-[1.02] transition-transform shadow-lg"
          >
            + Add Countdown
          </button>

          {countdowns.length === 0 && (
            <div className="bg-white rounded-3xl p-12 shadow-sm border text-center">
              <div className="text-5xl mb-4">⏳</div>
              <p className="text-gray-500">No countdowns yet. Add a trip, birthday, event — anything!</p>
            </div>
          )}

          {countdowns.map(cd => {
            const countdown = cd.date ? getCountdown(cd.date) : null;
            return (
              <div key={cd.id} className={`bg-gradient-to-r ${cd.color || 'from-blue-500 to-indigo-600'} rounded-2xl p-5 text-white shadow-lg`}>
                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="text"
                    value={cd.emoji}
                    onChange={(e) => setCountdowns(prev => prev.map(c => c.id === cd.id ? { ...c, emoji: e.target.value.slice(0, 2) } : c))}
                    className="w-10 h-10 text-center text-xl bg-white/20 rounded-xl focus:outline-none"
                  />
                  <input
                    type="text"
                    value={cd.name}
                    onChange={(e) => setCountdowns(prev => prev.map(c => c.id === cd.id ? { ...c, name: e.target.value } : c))}
                    placeholder="What are you counting down to?"
                    className="flex-1 text-lg font-bold bg-transparent placeholder-white/50 focus:outline-none"
                  />
                  <button onClick={() => setCountdowns(prev => prev.filter(c => c.id !== cd.id))} className="text-white/50 hover:text-white">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="date"
                  value={cd.date}
                  onChange={(e) => setCountdowns(prev => prev.map(c => c.id === cd.id ? { ...c, date: e.target.value } : c))}
                  className="w-full px-4 py-2 bg-white/20 rounded-xl text-white focus:outline-none mb-4 text-sm"
                />
                {countdown && !countdown.passed && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white/20 rounded-xl py-3">
                      <div className="text-3xl font-bold">{countdown.days}</div>
                      <div className="text-xs text-white/70">days</div>
                    </div>
                    <div className="bg-white/20 rounded-xl py-3">
                      <div className="text-3xl font-bold">{countdown.hours}</div>
                      <div className="text-xs text-white/70">hours</div>
                    </div>
                    <div className="bg-white/20 rounded-xl py-3">
                      <div className="text-3xl font-bold">{countdown.mins}</div>
                      <div className="text-xs text-white/70">minutes</div>
                    </div>
                  </div>
                )}
                {countdown && countdown.passed && (
                  <div className="bg-white/20 rounded-xl py-3 text-center">
                    <div className="text-xl font-bold">🎉 It's here!</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bucket List Sub-tab */}
        {countdownsSubTab === 'bucketlist' && (() => {
          const completedCount = bucketList.filter(b => b.completed).length;
          return (
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
              <button onClick={() => setBucketList(prev => [...prev, { id: Date.now().toString(), text: '', emoji: '⭐', category: 'experience', completed: false }])} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-medium hover:scale-[1.02] transition-transform shadow-lg">+ Add to Bucket List</button>
              {bucketList.length === 0 && (<div className="bg-white rounded-3xl p-12 shadow-sm border text-center"><div className="text-5xl mb-4">🏆</div><p className="text-gray-500">Your bucket list is empty. Dream big!</p></div>)}
              {bucketList.length > 0 && (<div className="rounded-2xl p-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}><div className="flex justify-between mb-2"><span className="text-sm font-medium" style={{color:"rgba(148,163,184,0.9)"}}>Progress</span><span className="text-sm font-bold text-amber-600">{completedCount}/{bucketList.length}</span></div><div className="h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500 progress-glow" style={{ width: `${bucketList.length > 0 ? (completedCount / bucketList.length) * 100 : 0}%` }} /></div></div>)}
              {bucketList.filter(b => !b.completed).map(item => (<div key={item.id} className="rounded-2xl p-4 flex items-start gap-3" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}><button onClick={() => setBucketList(prev => prev.map(b => b.id === item.id ? { ...b, completed: true } : b))} className="w-8 h-8 rounded-full border-2 border-amber-400 flex-shrink-0 mt-1 hover:bg-amber-50 transition-colors" /><div className="flex-1"><div className="flex items-center gap-2 mb-1"><input type="text" value={item.emoji} onChange={(e) => setBucketList(prev => prev.map(b => b.id === item.id ? { ...b, emoji: e.target.value.slice(0, 2) } : b))} className="w-8 text-center text-lg bg-transparent focus:outline-none" /><input type="text" value={item.text} onChange={(e) => setBucketList(prev => prev.map(b => b.id === item.id ? { ...b, text: e.target.value } : b))} placeholder="What do you want to do?" className="flex-1 font-medium bg-transparent focus:outline-none" /></div><select value={item.category || 'experience'} onChange={(e) => setBucketList(prev => prev.map(b => b.id === item.id ? { ...b, category: e.target.value } : b))} className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 focus:outline-none"><option value="travel">✈️ Travel</option><option value="experience">🎯 Experience</option><option value="fitness">💪 Fitness</option><option value="career">💼 Career</option><option value="financial">💰 Financial</option><option value="personal">🌟 Personal</option><option value="creative">🎨 Creative</option></select></div><button onClick={() => setBucketList(prev => prev.filter(b => b.id !== item.id))} className="text-gray-300 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button></div>))}
              {bucketList.filter(b => b.completed).length > 0 && (<div><h3 className="text-sm font-semibold text-gray-500 mb-2 mt-6">✅ Completed</h3>{bucketList.filter(b => b.completed).map(item => (<div key={item.id} className="rounded-2xl p-4 flex items-center gap-3 opacity-60 mb-2" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}><button onClick={() => setBucketList(prev => prev.map(b => b.id === item.id ? { ...b, completed: false } : b))} className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center"><span className="text-white text-sm">✓</span></button><span className="flex-1 line-through text-gray-500">{item.emoji} {item.text || 'Unnamed goal'}</span><button onClick={() => setBucketList(prev => prev.filter(b => b.id !== item.id))} className="text-gray-300 hover:text-red-500 flex-shrink-0"><Trash2 className="w-4 h-4" /></button></div>))}</div>)}
            </div>
          );
        })()}
        <FloatingChat isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} chatMessages={chatMessages} setChatMessages={setChatMessages} isTyping={isTyping} setIsTyping={setIsTyping} financialContext={financialContext} isAiLimitReached={isAiLimitReached} incrementAiUsage={incrementAiUsage} getAiRemaining={getAiRemaining} AI_DAILY_LIMIT={AI_DAILY_LIMIT} muzzPersonality={muzzPersonality} />
      </div>
    );
  }

  // ============================================
  // BUCKET LIST VIEW
  // ============================================
  if (activeView === 'bucketlist') {
    const completedCount = bucketList.filter(b => b.completed).length;

    return (
      <div className="min-h-screen bg-transparent pb-24">
        <Sidebar />
        <SaveIndicator />
        <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setActiveView('home')} className="mb-4 text-sm transition-colors flex items-center gap-1" style={{color:"rgba(0,200,255,0.7)",letterSpacing:"0.5px"}}>← Back</button>
            <h1 className="text-3xl font-bold text-white" style={{letterSpacing:"1px",textShadow:"0 0 20px rgba(0,200,255,0.3)"}}>🏆 Bucket List</h1>
            <p className="text-white/70 mt-1">{completedCount}/{bucketList.length} completed</p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
          <button
            onClick={() => setBucketList(prev => [...prev, { id: Date.now().toString(), text: '', emoji: '⭐', category: 'experience', completed: false }])}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-medium hover:scale-[1.02] transition-transform shadow-lg"
          >
            + Add to Bucket List
          </button>

          {bucketList.length === 0 && (
            <div className="bg-white rounded-3xl p-12 shadow-sm border text-center">
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-gray-500">Your bucket list is empty. Dream big and add your goals!</p>
            </div>
          )}

          {/* Progress */}
          {bucketList.length > 0 && (
            <div className="rounded-2xl p-4" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium" style={{color:"rgba(148,163,184,0.9)"}}>Progress</span>
                <span className="text-sm font-bold text-amber-600">{completedCount}/{bucketList.length}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500 progress-glow" style={{ width: `${bucketList.length > 0 ? (completedCount / bucketList.length) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {/* Incomplete */}
          {bucketList.filter(b => !b.completed).map(item => (
            <div key={item.id} className="rounded-2xl p-4 flex items-start gap-3" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
              <button
                onClick={() => setBucketList(prev => prev.map(b => b.id === item.id ? { ...b, completed: true } : b))}
                className="w-8 h-8 rounded-full border-2 border-amber-400 flex-shrink-0 mt-1 hover:bg-amber-50 transition-colors"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={item.emoji}
                    onChange={(e) => setBucketList(prev => prev.map(b => b.id === item.id ? { ...b, emoji: e.target.value.slice(0, 2) } : b))}
                    className="w-8 text-center text-lg bg-transparent focus:outline-none"
                  />
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => setBucketList(prev => prev.map(b => b.id === item.id ? { ...b, text: e.target.value } : b))}
                    placeholder="What do you want to do?"
                    className="flex-1 font-medium bg-transparent focus:outline-none"
                  />
                </div>
                <select
                  value={item.category || 'experience'}
                  onChange={(e) => setBucketList(prev => prev.map(b => b.id === item.id ? { ...b, category: e.target.value } : b))}
                  className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 focus:outline-none"
                >
                  <option value="travel">✈️ Travel</option>
                  <option value="experience">🎯 Experience</option>
                  <option value="fitness">💪 Fitness</option>
                  <option value="career">💼 Career</option>
                  <option value="financial">💰 Financial</option>
                  <option value="personal">🌟 Personal</option>
                  <option value="creative">🎨 Creative</option>
                </select>
              </div>
              <button onClick={() => setBucketList(prev => prev.filter(b => b.id !== item.id))} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Completed */}
          {bucketList.filter(b => b.completed).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2 mt-6">✅ Completed</h3>
              {bucketList.filter(b => b.completed).map(item => (
                <div key={item.id} className="rounded-2xl p-4 flex items-center gap-3 opacity-60 mb-2" style={{background:"rgba(5,15,30,0.8)",border:"1px solid rgba(0,200,255,0.12)"}}>
                  <button
                    onClick={() => setBucketList(prev => prev.map(b => b.id === item.id ? { ...b, completed: false } : b))}
                    className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center"
                  >
                    <span className="text-white text-sm">✓</span>
                  </button>
                  <span className="flex-1 line-through text-gray-500">{item.emoji} {item.text || 'Unnamed goal'}</span>
                  <button onClick={() => setBucketList(prev => prev.filter(b => b.id !== item.id))} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <FloatingChat isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} chatMessages={chatMessages} setChatMessages={setChatMessages} isTyping={isTyping} setIsTyping={setIsTyping} financialContext={financialContext} isAiLimitReached={isAiLimitReached} incrementAiUsage={incrementAiUsage} getAiRemaining={getAiRemaining} AI_DAILY_LIMIT={AI_DAILY_LIMIT} muzzPersonality={muzzPersonality} />
      </div>
    );
  }

  // FALLBACK
  return (
    <div className="min-h-screen bg-transparent pb-24">
      <Sidebar />
        <SaveIndicator />
      <div className="pt-16 pb-6 px-6 header-scan" style={{borderBottom:"1px solid rgba(0,200,255,0.15)",position:"relative",overflow:"hidden"}}>
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setActiveView('home')} className="mb-4 text-sm transition-colors flex items-center gap-1" style={{color:"rgba(0,200,255,0.7)",letterSpacing:"0.5px"}}>← Back</button>
          <h1 className="text-3xl font-bold text-white capitalize">{activeView}</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl p-12 shadow-sm border text-center">
          <p className="text-xl text-gray-400">Coming soon</p>
        </div>
      </div>
      <FloatingChat 
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        isTyping={isTyping}
        setIsTyping={setIsTyping}
        financialContext={financialContext}
        isAiLimitReached={isAiLimitReached}
        incrementAiUsage={incrementAiUsage}
        getAiRemaining={getAiRemaining}
        AI_DAILY_LIMIT={AI_DAILY_LIMIT}
        muzzPersonality={muzzPersonality}
      />

      {/* ── BOTTOM NAVIGATION BAR ── */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:9990,background:"rgba(2,8,20,0.98)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:"1px solid rgba(0,200,255,0.2)"}}>
        <div className="flex justify-around items-center px-1 py-2">
          {[
            {id:'home', label:'Home', Icon:Home},
            {id:'tasks', label:'Tasks', Icon:CheckCircle2},
            {id:'varied', label:'Finance', Icon:DollarSign, eliteOnly:true},
            {id:'gym', label:'Health', Icon:Dumbbell, eliteOnly:true},
            {id:'upgrade', label:'Elite', Icon:Award},
          ].map(({id, label, Icon, eliteOnly}) => {
            const active = activeView === id || (id==='varied' && ['varied','assets','investments','work','bills'].includes(activeView));
            const locked = eliteOnly && !isElite;
            return (
              <button key={id}
                onClick={() => { if(locked){setActiveView('upgrade');}else{setActiveView(id);} }}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
                style={{minWidth:'56px'}}>
                <div className="relative flex items-center justify-center" style={{width:'28px',height:'28px',borderRadius:'8px',background: active ? 'rgba(0,200,255,0.12)' : 'transparent',transition:'all 0.2s'}}>
                  <Icon style={{width:'16px',height:'16px',color: active ? '#00c8ff' : locked ? 'rgba(100,116,139,0.35)' : 'rgba(148,163,184,0.6)',transition:'color 0.2s'}} />
                  {active && <div style={{position:'absolute',bottom:'-6px',left:'50%',transform:'translateX(-50%)',width:'4px',height:'4px',borderRadius:'50%',background:'#00c8ff',boxShadow:'0 0 10px #00c8ff, 0 0 20px rgba(0,200,255,0.5)'}} className='nav-active-glow' />}
                </div>
                <span style={{fontSize:'9px',fontWeight:500,color: active ? '#00c8ff' : locked ? 'rgba(100,116,139,0.3)' : 'rgba(148,163,184,0.55)',letterSpacing:'0.3px',marginTop:'4px'}}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// APP WRAPPER WITH AUTH
// ============================================

// New Password Form (shown when user clicks reset link from email)
function NewPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (r.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.hash = '';
          window.location.reload();
        }, 2000);
      } else {
        const data = await r.json();
        setError(data.error_description || data.msg || 'Failed to update password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 flex items-start justify-center p-4 pt-12 md:pt-4 md:items-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-4xl md:text-5xl mx-auto mb-3 md:mb-4">🦘</div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 md:mb-2">Muzz</h1>
          <p className="text-white/80 text-sm md:text-base">Set your new password</p>
        </div>
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">New Password 🔐</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm text-center">Password updated! Redirecting to login...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                {loading ? 'Updating...' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  // Check if this is a password reset callback
  const hash = window.location.hash;
  const isPasswordReset = hash.includes('type=recovery') && hash.includes('access_token=');

  if (isPasswordReset) {
    return <NewPasswordForm />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:"linear-gradient(180deg,#020817 0%,#050d1a 100%)"}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(0,200,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.025) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none'}} />
        <div style={{position:'absolute',width:'400px',height:'400px',borderRadius:'50%',background:'rgba(0,150,255,0.06)',filter:'blur(100px)',top:'-100px',right:'-80px'}} />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-5xl" style={{filter:'drop-shadow(0 0 20px rgba(0,200,255,0.4))',animation:'kangPulse 2s ease-in-out infinite'}}>🦘</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontWeight:900,fontSize:'28px',color:'white',letterSpacing:'4px'}}>MUZZ</div>
          <div style={{color:'#00c8ff',fontSize:'11px',letterSpacing:'3px'}}>INITIALISING...</div>
          <div className="cyber-spinner"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <StarryBackground>
      <MuzzApp />
    </StarryBackground>
  );
}

export default function App() {
  React.useEffect(() => {
    document.documentElement.style.backgroundColor = '#0f172a';
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = '#0f172a';
  }, []);
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
