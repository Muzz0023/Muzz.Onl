import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { X, Send, Minus, TrendingUp, TrendingDown, DollarSign, Target, Calendar, Dumbbell, ShoppingCart, Bell, Award, Wallet, Menu, Home, Star, Trophy, Flame, CheckCircle2, Plus, Trash2, ChevronDown, ChevronUp, LogOut, Mail, Lock, Eye, EyeOff, MessageCircle, Save, Loader2, HelpCircle } from 'lucide-react';

// ============================================
// MOBILE KEYBOARD HELPER
// ============================================
const scrollInputIntoView = (e) => {
  // Small delay to let keyboard open first
  setTimeout(() => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
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
      body: JSON.stringify({ email })
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
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 flex items-start justify-center p-4 pt-12 md:pt-4 md:items-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 md:mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-4xl md:text-5xl mx-auto mb-3 md:mb-4">🦘</div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 md:mb-2">Muzz</h1>
            <p className="text-white/80 text-sm md:text-base">Reset your password</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
              Forgot password? 🔐
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-4 text-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-4 md:mt-6 text-center">
              <button
                onClick={() => { setShowResetPassword(false); setError(''); setSuccessMessage(''); }}
                className="text-orange-600 hover:text-orange-700 font-medium text-sm md:text-base"
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 flex items-start justify-center p-4 pt-12 md:pt-4 md:items-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-4xl md:text-5xl mx-auto mb-3 md:mb-4">🦘</div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 md:mb-2">Muzz</h1>
          <p className="text-white/80 text-sm md:text-base">Your Aussie money mate</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
            {isLogin ? 'Welcome back legend 🦘' : 'Create account'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-4 md:mt-6 text-center space-y-2">
            {isLogin && (
              <button
                onClick={() => { setShowResetPassword(true); setError(''); }}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Forgot password?
              </button>
            )}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="block w-full text-orange-600 hover:text-orange-700 font-medium text-sm md:text-base"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/60 text-xs md:text-sm mt-4 md:mt-6">
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
  const endRef = useRef(null);
  
  useEffect(() => { 
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); 
  }, [chatMessages]);

  const sendMessage = async (msg) => {
    if (!msg.trim() || isTyping) return;

    // Check AI daily limit
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
- You can use ONE gen-z term per response MAX from: W, L, no cap, fr, bussin, lowkey, based, bet, aura, slay
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
      <button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg hover:scale-110 transition-all flex items-center justify-center text-3xl z-50">
        🦘
      </button>
    );
  }

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-3xl shadow-2xl border-2 border-orange-200 flex flex-col z-50 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow">🦘</div>
          <div><div className="text-white font-bold">Muzz</div><div className="text-white/70 text-xs">{isTyping ? "Typing..." : "Online"}</div></div>
        </div>
        <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-orange-50 to-white">
        {chatMessages.length === 0 && <div className="text-center py-8"><div className="text-4xl mb-2">🦘</div><div className="text-gray-500 text-sm">G'day! Ask me anything!</div></div>}
        {chatMessages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={m.role === "user" ? "max-w-[80%] px-4 py-2 rounded-2xl text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-md" : "max-w-[80%] px-4 py-2 rounded-2xl text-sm bg-white border shadow-sm rounded-bl-md whitespace-pre-wrap"}>{m.text}</div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm px-4 py-3 rounded-2xl rounded-bl-md">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSend(); }} placeholder="Ask Muzz..." disabled={isTyping || isAiLimitReached()} className="flex-1 px-4 py-2 border-2 rounded-full text-sm focus:outline-none focus:border-orange-400 transition-colors" />
          <button onClick={handleSend} disabled={isTyping || !input.trim() || isAiLimitReached()} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-full disabled:opacity-50 transition-all hover:shadow-lg"><Send className="w-4 h-4" /></button>
        </div>
        <p className={`text-xs text-center mt-1 ${getAiRemaining() <= 5 ? 'text-red-400' : 'text-gray-400'}`}>
          {getAiRemaining()} / {AI_DAILY_LIMIT} messages remaining today
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{featureName} is Elite Only</h2>
        <p className="text-gray-500 mb-6">Upgrade to Elite for $5/month to unlock {featureName} and all premium features.</p>
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
  const [gymSubTab, setGymSubTab] = useState('steps');
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

  // Handle Stripe checkout
  const handleUpgrade = async () => {
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
          if (d.dailyRotation) setDailyRotation(d.dailyRotation);
          if (d.birthdays) setBirthdays(d.birthdays);
          if (d.reminders) setReminders(d.reminders);
          if (d.groceries) setGroceries(d.groceries);
          if (d.dailyMeals) setDailyMeals(d.dailyMeals);
          if (d.waterIntake) setWaterIntake(d.waterIntake);
          if (d.dailySteps) setDailySteps(d.dailySteps);
          if (d.workoutPlan) setWorkoutPlan(d.workoutPlan);
          if (d.customCategories) setCustomCategories(d.customCategories);
          if (d.eliteName) setEliteName(d.eliteName);
          if (d.stripeElite) setStripeElite(d.stripeElite);
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
          dailyRotation,
          birthdays,
          reminders,
          groceries,
          dailyMeals,
          waterIntake,
          dailySteps,
          workoutPlan,
          customCategories,
          eliteName,
          stripeElite
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
  }, [subscriptions, businessSubscriptions, muzzPersonality, funnyGreetings, customDiets, trackedStocks, monthlySalary, monthlySalaryStr, assets, stocks, investmentSettings, smallGoals, bigGoals, holdingsResearch, investmentSmallGoals, investmentBigGoals, investmentNotes, declinedCompanies, companyEconomics, economicsColumns, researchColumns, biggestRisks, risksColumns, billSmallGoals, billBigGoals, debts, calendarBills, tasks, dailyTasks, weeklyTasks, dailyRotation, birthdays, reminders, groceries, dailyMeals, waterIntake, dailySteps, workoutPlan, customCategories, eliteName, stripeElite, userId, dataLoaded]);

  // Tip rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    { id: "tasks", label: "Tasks", icon: CheckCircle2 },
    { id: "reminders", label: "Reminders", icon: Bell },
    { id: "diet", label: "Diet", icon: ShoppingCart },
    { id: "gym", label: "Fitness", icon: Dumbbell, eliteOnly: true },
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

  // Sidebar Component - New Visual Style (Orange/Amber theme)
  const Sidebar = () => {
    return (
      <div>
        <div className={sidebarOpen ? "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-300" : "fixed inset-0 z-40 pointer-events-none opacity-0 transition-all duration-300"} onClick={() => setSidebarOpen(false)} />
        <div className={sidebarOpen ? "fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 translate-x-0 transition-transform duration-300" : "fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 -translate-x-full transition-transform duration-300"}>
          <div className="p-6 h-full flex flex-col overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">🦘</div>
                <div><div className="font-bold text-gray-900">Muzz</div><div className="text-xs text-gray-500">Your money mate</div></div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            {currentStreak > 0 && (
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-2xl p-3 mb-6 flex items-center gap-3">
                <Flame className="w-6 h-6 text-orange-500" />
                <div className="text-sm font-semibold text-orange-800">{currentStreak} Day Streak!</div>
              </div>
            )}
            <nav className="flex-1 space-y-1">
              {navItems.map(item => {
                const locked = item.eliteOnly && !isElite;
                return (
                  <button key={item.id} onClick={() => { 
                    if (locked) { setActiveView('upgrade'); } else { setActiveView(item.id); }
                    setSidebarOpen(false); 
                  }}
                    className={activeView === item.id ? "w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg transition-all" : locked ? "w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-400 transition-all" : item.id === 'upgrade' ? "w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50 text-amber-600 transition-all border border-amber-200" : "w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-600 transition-all"}>
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {locked && <Lock className="w-4 h-4 text-gray-400" />}
                    {item.id === 'upgrade' && !isElite && (
                      <svg width="14" height="14" viewBox="0 0 24 32" fill="none"><path d="M12 0L22 8L20 16L24 16L12 32L0 16L4 16L2 8L12 0Z" fill="#F59E0B" /><path d="M12 6L16 10L14 14L17 14L12 22L7 14L10 14L8 10L12 6Z" fill="white" fillOpacity="0.9" /></svg>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-gray-200 mt-4">
              {/* Backup/Export Section */}
              <div className="mb-3 space-y-2">
                <button 
                  onClick={() => {
                    const allData = {
                      subscriptions, businessSubscriptions, muzzPersonality, funnyGreetings, customDiets,
                      trackedStocks, monthlySalary, monthlySalaryStr, assets, stocks, investmentSettings,
                      smallGoals, bigGoals, holdingsResearch, investmentSmallGoals, investmentBigGoals,
                      investmentNotes, declinedCompanies, companyEconomics, economicsColumns, researchColumns,
                      biggestRisks, risksColumns, billSmallGoals, billBigGoals, debts, calendarBills, tasks,
                      dailyTasks, weeklyTasks, dailyRotation, birthdays, reminders, groceries, dailyMeals,
                      waterIntake, dailySteps, workoutPlan, customCategories, eliteName
                    };
                    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `muzz-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 text-blue-600 transition-all"
                >
                  <Save className="w-5 h-5" />
                  <span className="font-medium">Export Backup</span>
                </button>
                <label className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-green-50 text-green-600 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const data = JSON.parse(event.target.result);
                          if (confirm('This will replace all your current data with the backup. Are you sure?')) {
                            if (data.subscriptions) setSubscriptions(data.subscriptions);
                            if (data.businessSubscriptions) setBusinessSubscriptions(data.businessSubscriptions);
                            if (data.muzzPersonality !== undefined) setMuzzPersonality(data.muzzPersonality);
                            if (data.funnyGreetings !== undefined) setFunnyGreetings(data.funnyGreetings);
                            if (data.customDiets) setCustomDiets(data.customDiets);
                            if (data.trackedStocks) setTrackedStocks(data.trackedStocks);
                            if (data.monthlySalary) setMonthlySalary(data.monthlySalary);
                            if (data.monthlySalaryStr) setMonthlySalaryStr(data.monthlySalaryStr);
                            if (data.assets) setAssets(data.assets);
                            if (data.stocks) setStocks(data.stocks);
                            if (data.investmentSettings) setInvestmentSettings(data.investmentSettings);
                            if (data.smallGoals) setSmallGoals(data.smallGoals);
                            if (data.bigGoals) setBigGoals(data.bigGoals);
                            if (data.holdingsResearch) setHoldingsResearch(data.holdingsResearch);
                            if (data.investmentSmallGoals) setInvestmentSmallGoals(data.investmentSmallGoals);
                            if (data.investmentBigGoals) setInvestmentBigGoals(data.investmentBigGoals);
                            if (data.investmentNotes) setInvestmentNotes(data.investmentNotes);
                            if (data.declinedCompanies) setDeclinedCompanies(data.declinedCompanies);
                            if (data.companyEconomics) setCompanyEconomics(data.companyEconomics);
                            if (data.economicsColumns) setEconomicsColumns(data.economicsColumns);
                            if (data.researchColumns) setResearchColumns(data.researchColumns);
                            if (data.biggestRisks) setBiggestRisks(data.biggestRisks);
                            if (data.risksColumns) setRisksColumns(data.risksColumns);
                            if (data.billSmallGoals) setBillSmallGoals(data.billSmallGoals);
                            if (data.billBigGoals) setBillBigGoals(data.billBigGoals);
                            if (data.debts) setDebts(data.debts);
                            if (data.calendarBills) setCalendarBills(data.calendarBills);
                            if (data.tasks) setTasks(data.tasks);
                            if (data.dailyTasks) setDailyTasks(data.dailyTasks);
                            if (data.weeklyTasks) setWeeklyTasks(data.weeklyTasks);
                            if (data.dailyRotation) setDailyRotation(data.dailyRotation);
                            if (data.birthdays) setBirthdays(data.birthdays);
                            if (data.reminders) setReminders(data.reminders);
                            if (data.groceries) setGroceries(data.groceries);
                            if (data.dailyMeals) setDailyMeals(data.dailyMeals);
                            if (data.waterIntake) setWaterIntake(data.waterIntake);
                            if (data.dailySteps) setDailySteps(data.dailySteps);
                            if (data.workoutPlan) setWorkoutPlan(data.workoutPlan);
                            if (data.customCategories) setCustomCategories(data.customCategories);
                            if (data.eliteName) setEliteName(data.eliteName);
                            alert('Backup restored successfully!');
                            setSidebarOpen(false);
                          }
                        } catch (err) {
                          alert('Invalid backup file. Please select a valid Muzz backup JSON file.');
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                  />
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Import Backup</span>
                </label>
              </div>
              <button onClick={() => { signOut(); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-all mb-3">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <span className="text-2xl">🦘</span>
                <span className="text-sm font-medium">Muzz v2.0</span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 z-30 p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all"><Menu className="w-5 h-5" /></button>
        {saveStatus !== 'idle' && (
          <div className={`fixed top-4 right-4 z-30 px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${
            saveStatus === 'saving' ? 'bg-amber-100 text-amber-700' : 
            saveStatus === 'saved' ? 'bg-green-100 text-green-700' : 
            'bg-red-100 text-red-700'
          }`}>
            {saveStatus === 'saving' && <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>}
            {saveStatus === 'saved' && <><CheckCircle2 className="w-4 h-4" /> Saved</>}
            {saveStatus === 'error' && <><X className="w-4 h-4" /> Save failed</>}
          </div>
        )}
      </div>
    );
  };

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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="pl-12">
                <button onClick={() => setActiveView('home')} className="text-blue-500 mb-4 font-medium">← Back</button>
                <h1 className="text-4xl font-semibold">Reminders</h1>
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
              <h2 className="text-xl font-semibold">Reminders</h2>
              <p className="text-sm text-gray-500">General reminders and notes</p>
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
                          className="w-full px-4 py-3 border-2 rounded-xl text-base focus:outline-none focus:border-blue-500 resize-none"
                          rows={Math.max(2, Math.ceil((reminder.title?.length || 0) / 35))}
                          style={{ minHeight: '60px' }}
                        />
                        <div className="flex flex-wrap gap-3 items-center">
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={reminder.date || ''}
                              onFocus={scrollInputIntoView}
                              onChange={(e) => setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, date: e.target.value } : r))}
                              className="px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                            />
                            {reminder.date && (
                              <button
                                onClick={() => setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, date: '' } : r))}
                                className="text-gray-400 hover:text-red-500 text-sm"
                                title="Clear date"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          {getReminderUpcoming(reminder.date) && (
                            <span className={`text-sm font-medium ${
                              getReminderUpcoming(reminder.date) === 'Overdue' ? 'text-red-600' :
                              getReminderUpcoming(reminder.date) === 'Today' || getReminderUpcoming(reminder.date) === 'Tomorrow' ? 'text-green-600' : 
                              'text-orange-500'
                            }`}>
                              {getReminderUpcoming(reminder.date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setReminders(prev => prev.filter(r => r.id !== reminder.id))}
                        className="text-red-400 hover:text-red-600 text-sm mt-2"
                      >
                        ✕
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
              <h2 className="text-xl font-semibold">🎂 Birthdays</h2>
              <p className="text-sm text-gray-500">Friends & Family birthdays</p>
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
                          className="w-full px-4 py-3 border-2 rounded-xl text-base focus:outline-none focus:border-blue-500 resize-none"
                          style={{ minHeight: '48px', overflow: 'hidden' }}
                        />
                        <div className="flex flex-wrap gap-3 items-center">
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={bday.date}
                              onFocus={scrollInputIntoView}
                              onChange={(e) => setBirthdays(prev => prev.map(b => b.id === bday.id ? { ...b, date: e.target.value } : b))}
                              className="px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                            />
                            {bday.date && (
                              <button
                                onClick={() => setBirthdays(prev => prev.map(b => b.id === bday.id ? { ...b, date: '' } : b))}
                                className="text-gray-400 hover:text-red-500 text-sm"
                                title="Clear date"
                              >
                                ✕
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
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ✕
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
      <div className="min-h-screen bg-gray-50 pb-24">
        <Sidebar />
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 pt-16 pb-6 px-6">
          <div className="max-w-5xl mx-auto">
            <button onClick={() => setActiveView('home')} className="text-white/80 mb-4 text-sm hover:text-white transition-colors">← Back</button>
            <h1 className="text-3xl font-bold text-white">Task Management</h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTasksSubTab('daily')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tasksSubTab === 'daily'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Daily Tasks
            </button>
            <button
              onClick={() => setTasksSubTab('weekly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tasksSubTab === 'weekly'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Weekly Tasks
            </button>
            <button
              onClick={() => setTasksSubTab('rotation')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tasksSubTab === 'rotation'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Daily Rotation
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
                  <h2 className="text-xl font-semibold">Daily Tasks</h2>
                  <p className="text-sm text-gray-500">Tasks to complete today</p>
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
                              className={`w-full px-4 py-3 border-2 rounded-xl text-base focus:outline-none focus:border-blue-500 resize-none ${task.completed ? 'line-through text-gray-400' : ''}`}
                              rows={Math.max(2, Math.ceil((task.text?.length || 0) / 35))}
                              style={{ minHeight: '70px' }}
                            />
                          </div>
                          <button
                            onClick={() => setDailyTasks(prev => prev.filter(t => t.id !== task.id))}
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            ✕
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
                  <h2 className="text-xl font-semibold">Weekly Tasks</h2>
                  <p className="text-sm text-gray-500">Tasks to complete this week</p>
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
                              className={`w-full px-4 py-3 border-2 rounded-xl text-base focus:outline-none focus:border-blue-500 resize-none ${task.completed ? 'line-through text-gray-400' : ''}`}
                              rows={Math.max(2, Math.ceil((task.text?.length || 0) / 35))}
                              style={{ minHeight: '70px' }}
                            />
                            <div className="flex flex-wrap gap-2 items-center">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Start:</span>
                                <input
                                  type="date"
                                  value={task.startDate || ''}
                                  onFocus={scrollInputIntoView}
                                  onChange={(e) => setWeeklyTasks(prev => prev.map(t => t.id === task.id ? { ...t, startDate: e.target.value } : t))}
                                  className="px-3 py-1 rounded-full text-xs border bg-gray-50"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Due:</span>
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
                            className="text-red-400 hover:text-red-600 text-sm mt-1"
                          >
                            ✕
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
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
              >
                Reset to Default
              </button>
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">Daily Rotation</h2>
                  <p className="text-sm text-gray-500">Your daily schedule - click to edit activities</p>
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
        </div>
      </div>
    );
  }

  // DIET MANAGEMENT VIEW
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="pl-12">
                <button onClick={() => setActiveView('home')} className="text-blue-500 mb-4 font-medium">← Back</button>
                <h1 className="text-4xl font-semibold">Diet Management</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDietSubTab('groceries')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                dietSubTab === 'groceries'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Groceries
            </button>
            <button
              onClick={() => setDietSubTab('meals')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                dietSubTab === 'meals'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Weekly Meals
            </button>
            <button
              onClick={() => setDietSubTab('water')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                dietSubTab === 'water'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Water
            </button>
            <button
              onClick={() => setDietSubTab('plans')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                dietSubTab === 'plans'
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Diet Plans
            </button>
            <button
              onClick={() => setDietSubTab('custom')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                dietSubTab === 'custom'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              My Diets
            </button>
          </div>

          {/* Groceries Tab */}
          {dietSubTab === 'groceries' && (
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">🛒 Groceries</h2>
                <p className="text-sm text-gray-500">Track your groceries and nutrition info</p>
              </div>
              <div className="p-4 space-y-3">
                {groceries.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No grocery items. Add one below!
                  </div>
                ) : (
                  groceries.map(item => (
                    <div key={item.id} className={`border-2 rounded-2xl p-4 ${item.checked ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
                      {/* Row 1: Checkbox + Name + Delete */}
                      <div className="flex items-start gap-3 mb-3">
                        <button
                          onClick={() => updateGrocery(item.id, 'checked', !item.checked)}
                          className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-1 ${
                            item.checked 
                              ? 'bg-green-500' 
                              : 'border-2 border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {item.checked && <span className="text-white text-sm">✓</span>}
                        </button>
                        <input
                          type="text"
                          value={item.item}
                          onFocus={scrollInputIntoView}
                          onChange={(e) => updateGrocery(item.id, 'item', e.target.value)}
                          placeholder="Item name"
                          className={`flex-1 px-3 py-2 border-2 rounded-xl text-base font-medium focus:outline-none focus:border-green-500 ${item.checked ? 'line-through text-gray-400' : ''}`}
                        />
                        <button
                          onClick={() => setGroceries(prev => prev.filter(g => g.id !== item.id))}
                          className="text-red-400 hover:text-red-600 text-lg mt-1"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Row 2: Quantity + Serves */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                          <input
                            type="text"
                            value={item.quantity}
                            onFocus={scrollInputIntoView}
                            onChange={(e) => updateGrocery(item.id, 'quantity', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Serves</label>
                          <input
                            type="text"
                            value={item.serves}
                            onFocus={scrollInputIntoView}
                            onChange={(e) => updateGrocery(item.id, 'serves', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                          />
                        </div>
                      </div>
                      
                      {/* Row 3: Nutrition - 4 columns */}
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Protein</label>
                          <input
                            type="text"
                            value={item.proteinPerServe}
                            onFocus={scrollInputIntoView}
                            onChange={(e) => updateGrocery(item.id, 'proteinPerServe', e.target.value)}
                            placeholder="0g"
                            className="w-full px-2 py-2 border-2 rounded-xl text-sm text-center focus:outline-none focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Carbs</label>
                          <input
                            type="text"
                            value={item.carbsPerServe}
                            onChange={(e) => updateGrocery(item.id, 'carbsPerServe', e.target.value)}
                            placeholder="0g"
                            className="w-full px-2 py-2 border-2 rounded-xl text-sm text-center focus:outline-none focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Fat</label>
                          <input
                            type="text"
                            value={item.fatPerServe}
                            onChange={(e) => updateGrocery(item.id, 'fatPerServe', e.target.value)}
                            placeholder="0g"
                            className="w-full px-2 py-2 border-2 rounded-xl text-sm text-center focus:outline-none focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Cals</label>
                          <input
                            type="text"
                            value={item.caloriesPerServe}
                            onChange={(e) => updateGrocery(item.id, 'caloriesPerServe', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-2 border-2 rounded-xl text-sm text-center focus:outline-none focus:border-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t">
                <button
                  onClick={addGroceryItem}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:scale-[1.01] transition-transform"
                >
                  + Add Grocery Item
                </button>
              </div>
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
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${day.isToday ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          <span className="text-xs font-medium">{day.dayShort}</span>
                          <span className="text-lg font-bold leading-none">{day.dateNum}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{day.dayName}</h3>
                          <p className="text-xs text-gray-500">{day.dateNum} {day.month} {day.isToday && '• Today'}</p>
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
                                className="text-red-400 hover:text-red-600 text-sm"
                              >
                                ✕
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
                      <h2 className="text-xl font-semibold">Water Intake</h2>
                      <p className="text-sm text-gray-500">Stay hydrated, legend</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Daily Goal:</span>
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
                      <span className="text-sm text-gray-500">L</span>
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
                      <h3 className="text-lg font-semibold text-gray-700">Today</h3>
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
                      <h2 className="text-xl font-semibold">This Week</h2>
                      <p className="text-sm text-gray-500">
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
                  <h2 className="text-xl font-semibold">Prebuilt Diet Plans</h2>
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
                          <div className="text-sm text-gray-500">{plan.goal} — {plan.calories}</div>
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
                                <p className="text-sm text-gray-700">{meal.meal}</p>
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
                    <h2 className="text-xl font-semibold">My Custom Diets</h2>
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
                          <div className="text-sm text-gray-500">{diet.goal || 'No goal set'} — {diet.meals.length} meal{diet.meals.length !== 1 ? 's' : ''}</div>
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
  if (activeView === 'gym') {
    if (!isElite) return <LockedFeature featureName="Fitness" setActiveView={setActiveView} />;
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="pl-12">
                <button onClick={() => setActiveView('home')} className="text-blue-500 mb-4 font-medium">← Back</button>
                <h1 className="text-4xl font-semibold">Gym Management</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setGymSubTab('steps')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                gymSubTab === 'steps'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Weekly Steps
            </button>
            <button
              onClick={() => setGymSubTab('plan')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                gymSubTab === 'plan'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Workout Plan
            </button>
          </div>

          {/* Weekly Steps Tab */}
          {gymSubTab === 'steps' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border p-4">
                <h2 className="text-lg font-semibold text-gray-700">👟 Weekly Steps & Workouts</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">Goal:</span>
                  <input
                    type="text"
                    value={workoutPlan.stepsGoal || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setWorkoutPlan(prev => ({ ...prev, stepsGoal: parseInt(val) || 0 }));
                    }}
                    className="w-24 px-2 py-1 border-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-center"
                  />
                  <span className="text-sm text-gray-500">steps per day</span>
                </div>
              </div>

              {weekDays.map(day => {
                const gymData = dailySteps[day.date] || { steps: 0, notes: '' };
                const daySteps = typeof gymData === 'object' ? (gymData.steps || 0) : gymData;
                const dayNotes = typeof gymData === 'object' ? (gymData.notes || '') : '';
                const goal = workoutPlan.stepsGoal || 10000;
                const stepsPercent = Math.min((daySteps / goal) * 100, 100);
                const goalDisplay = goal >= 1000 ? `${(goal / 1000).toFixed(goal % 1000 === 0 ? 0 : 1)}K` : goal;
                
                return (
                  <div key={day.date} className={`bg-white rounded-3xl shadow-sm border overflow-hidden ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="p-4">
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${day.isToday ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          <span className="text-xs font-medium">{day.dayShort}</span>
                          <span className="text-lg font-bold leading-none">{day.dateNum}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800">{day.dayName} {day.isToday && <span className="text-blue-500 text-sm">• Today</span>}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={daySteps || ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  updateGymData(day.date, 'steps', parseInt(val) || 0);
                                }}
                                placeholder="0"
                                className="w-24 px-3 py-1 border-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-right"
                              />
                              <span className="text-sm text-gray-500">/ {goalDisplay}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  stepsPercent >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                  stepsPercent >= 75 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                  stepsPercent >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                  'bg-gradient-to-r from-red-400 to-red-500'
                                }`}
                                style={{ width: `${stepsPercent}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium w-12 text-right ${stepsPercent >= 100 ? 'text-green-600' : 'text-gray-500'}`}>
                              {stepsPercent >= 100 ? '🎉' : `${stepsPercent.toFixed(0)}%`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Notes Section */}
                      <div className="mt-3 pt-3 border-t">
                        <input
                          type="text"
                          value={dayNotes}
                          onChange={(e) => updateGymData(day.date, 'notes', e.target.value)}
                          placeholder="Workout notes (e.g., Chest & Triceps, 30 min cardio...)"
                          className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Workout Plan Tab */}
          {gymSubTab === 'plan' && (
            <div className="space-y-6">
              {[1, 2, 3, 4].map(week => (
                <div key={week} className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-pink-600">
                    <input
                      type="text"
                      value={workoutPlan.weeks[week]?.name || ''}
                      onChange={(e) => updateWeekInfo(week, 'name', e.target.value)}
                      placeholder={`Week ${week} Requirements of Training`}
                      className="w-full bg-transparent text-white text-lg font-semibold placeholder-white/70 focus:outline-none"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    {(workoutPlan.weeks[week]?.exercises || []).map(exercise => (
                      <div key={exercise.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={exercise.amount}
                          onChange={(e) => updateWeekExercise(week, exercise.id, 'amount', e.target.value)}
                          placeholder="x1"
                          className="w-14 px-2 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-center"
                        />
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => updateWeekExercise(week, exercise.id, 'name', e.target.value)}
                          placeholder="Biceps"
                          className="w-28 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                        />
                        <span className="text-gray-400">:</span>
                        <input
                          type="text"
                          value={exercise.details}
                          onChange={(e) => updateWeekExercise(week, exercise.id, 'details', e.target.value)}
                          placeholder="Enter details..."
                          className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={() => deleteWeekExercise(week, exercise.id)}
                          className="text-red-400 hover:text-red-600 text-sm px-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addWeekExercise(week)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors"
                    >
                      + Add Exercise
                    </button>
                    <div className="pt-3 mt-3 border-t">
                      <input
                        type="text"
                        value={workoutPlan.weeks[week]?.setsInfo || ''}
                        onChange={(e) => updateWeekInfo(week, 'setsInfo', e.target.value)}
                        placeholder="(Each Muscle Group x2 Sets - Supersets)"
                        className="w-full text-sm text-gray-500 italic bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // CUSTOM CATEGORY VIEWS
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        
        {/* Header */}
        <div className={`bg-gradient-to-r ${getGradient()} text-white`}>
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="pl-12">
              <button onClick={() => setActiveView('home')} className="text-white/80 hover:text-white mb-4 font-medium">← Back</button>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={customCat.name}
                  onChange={(e) => updateCategory({ name: e.target.value })}
                  placeholder="Name this category..."
                  className="text-4xl font-bold bg-transparent focus:outline-none placeholder-white/50 flex-1"
                />
                {/* Color Picker Toggle */}
                <div className="relative">
                  <button 
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    🎨
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl p-3 flex gap-2 z-10">
                      {colors.map(c => (
                        <button
                          key={c.name}
                          onClick={() => { updateCategory({ color: c.name }); setShowColorPicker(false); }}
                          className={`w-8 h-8 rounded-full bg-gradient-to-r ${c.gradient} hover:scale-110 transition-transform ${customCat.color === c.name ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Sub-Tabs */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {(customCat.subTabs || []).map(tab => (
                  <div key={tab.id} className="relative group">
                    <button
                      onClick={() => updateCategory({ activeSubTab: tab.id })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        customCat.activeSubTab === tab.id
                          ? 'bg-white text-gray-800'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
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
                  className="px-3 py-2 rounded-full text-sm font-medium bg-white/20 text-white hover:bg-white/30 transition-all"
                >
                  + Add Tab
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {/* Tab Name Editor & Toolbar */}
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Current Tab Name */}
                <input
                  type="text"
                  value={currentSubTab?.name || ''}
                  onChange={(e) => renameSubTab(customCat.activeSubTab, e.target.value)}
                  placeholder="Tab name..."
                  className="px-3 py-2 border-2 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
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
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl p-2 flex flex-wrap gap-1 z-10 w-max max-w-xl">
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
                  <button onClick={() => { deleteSection(section.id); showSaveFeedback(); }} className="text-white/70 hover:text-white">✕</button>
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
                                )}}
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
                                            className="text-red-400 hover:text-red-600 text-sm"
                                          >✕</button>
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
                                            className="text-red-400 hover:text-red-600 text-sm"
                                          >✕</button>
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
                                      }} className="text-red-400 hover:text-red-600 text-sm">✕</button>
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
                                      }} className="text-red-400 hover:text-red-600 text-sm">✕</button>
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
                                }} className="float-right text-xs text-red-400 hover:text-red-600">✕</button>
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
                                }} className="text-xs text-gray-400 hover:text-red-400">✕</button>
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
                      <div className="pt-2 border-t border-gray-100">
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
                          <button onClick={() => updateSection(section.id, { content: section.content.filter(t => t.id !== task.id) })} className="text-red-400 hover:text-red-600">✕</button>
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
                        {section.studyMode && <span className="text-sm text-gray-500">Click cards to flip!</span>}
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


  // HOME VIEW
  if (activeView === 'home') {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "G'morning" : hour < 17 ? "G'day" : "G'evening";
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-24">
        <Sidebar />
        {/* Header with Net Worth */}
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 pt-16 pb-8 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl">🦘</div>
              <div className="flex-1">
                <div className="text-white/80 text-sm">{greeting}, {isElite && eliteName ? eliteName : 'mate'}!</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-white">{funnyGreetings ? dashFunnyGreeting : 'Welcome back legend!'}</div>
                  {isElite && (
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">
                      <svg width="16" height="16" viewBox="0 0 24 32" fill="none">
                        <path d="M12 0L22 8L20 16L24 16L12 32L0 16L4 16L2 8L12 0Z" fill="url(#eliteGrad)" />
                        <path d="M12 6L16 10L14 14L17 14L12 22L7 14L10 14L8 10L12 6Z" fill="white" fillOpacity="0.9" />
                        <defs><linearGradient id="eliteGrad" x1="12" y1="0" x2="12" y2="32"><stop stopColor="#FFD700"/><stop offset="1" stopColor="#FFA500"/></linearGradient></defs>
                      </svg>
                      <span className="text-xs font-bold text-white">ELITE</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {isElite && !eliteName && (
              <div className="bg-white/20 backdrop-blur rounded-2xl p-3 mb-4 flex items-center gap-3">
                <span className="text-white text-sm">Set your name for personalised greetings:</span>
                <input
                  type="text"
                  placeholder="Your name..."
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white/30 text-white placeholder-white/60 focus:outline-none focus:bg-white/40"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      setEliteName(e.target.value.trim());
                    }
                  }}
                />
              </div>
            )}
            {!isElite && (
              <div onClick={() => setActiveView('upgrade')} className="bg-white/20 backdrop-blur rounded-2xl p-3 mb-4 flex items-center justify-between cursor-pointer hover:bg-white/30 transition-colors">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 32" fill="none">
                    <path d="M12 0L22 8L20 16L24 16L12 32L0 16L4 16L2 8L12 0Z" fill="url(#eliteGrad2)" />
                    <path d="M12 6L16 10L14 14L17 14L12 22L7 14L10 14L8 10L12 6Z" fill="white" fillOpacity="0.9" />
                    <defs><linearGradient id="eliteGrad2" x1="12" y1="0" x2="12" y2="32"><stop stopColor="#FFD700"/><stop offset="1" stopColor="#FFA500"/></linearGradient></defs>
                  </svg>
                  <span className="text-white text-sm font-medium">Upgrade to Elite — $5/mo</span>
                </div>
                <span className="text-white/70 text-sm">→</span>
              </div>
            )}
            <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
              <div className="text-white/80 text-sm">Net Worth</div>
              <div className="text-4xl font-bold text-white">${netWorth.toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="max-w-4xl mx-auto px-6 -mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <StatCard icon={Wallet} label="Monthly Bills" value={"$" + totalMonthly.toFixed(0)} color="blue" onClick={() => setActiveView("varied")} />
            <StatCard icon={Target} label="Savings Rate" value={savingsRate.toFixed(0) + "%"} color="green" onClick={() => setActiveView("varied")} />
            <StatCard icon={TrendingUp} label="Portfolio" value={"$" + totalStocks.toLocaleString()} color="purple" onClick={() => setActiveView("investments")} />
          </div>
          
          {/* Achievements & Coming Up */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-4 border shadow-sm">
              <div className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" />Achievements</div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {(() => {
                  const completedDailyTasks = dailyTasks.filter(t => t.completed).length;
                  const totalDailyTasks = dailyTasks.length;
                  const achievementData = [
                    // Net Worth Milestones
                    { id: "first_1k", icon: "💰", title: "First $1K", current: netWorth, target: 1000, unit: "$", category: "wealth" },
                    { id: "5k_club", icon: "💵", title: "$5K Club", current: netWorth, target: 5000, unit: "$", category: "wealth" },
                    { id: "10k_club", icon: "🏆", title: "$10K Club", current: netWorth, target: 10000, unit: "$", category: "wealth" },
                    { id: "25k_club", icon: "💎", title: "$25K Club", current: netWorth, target: 25000, unit: "$", category: "wealth" },
                    { id: "50k_club", icon: "👑", title: "$50K Club", current: netWorth, target: 50000, unit: "$", category: "wealth" },
                    { id: "100k_club", icon: "🚀", title: "$100K Club", current: netWorth, target: 100000, unit: "$", category: "wealth" },
                    { id: "250k_club", icon: "⭐", title: "$250K Club", current: netWorth, target: 250000, unit: "$", category: "wealth" },
                    { id: "500k_club", icon: "🌟", title: "$500K Club", current: netWorth, target: 500000, unit: "$", category: "wealth" },
                    { id: "1m_club", icon: "🎯", title: "Millionaire", current: netWorth, target: 1000000, unit: "$", category: "wealth" },
                    { id: "10m_club", icon: "🏰", title: "Deca-Millionaire", current: netWorth, target: 10000000, unit: "$", category: "wealth" },
                    { id: "100m_club", icon: "🛸", title: "Centi-Millionaire", current: netWorth, target: 100000000, unit: "$", category: "wealth" },
                    { id: "1b_club", icon: "🌍", title: "Billionaire", current: netWorth, target: 1000000000, unit: "$", category: "wealth" },
                    
                    // Savings Rate
                    { id: "saver_10", icon: "🌱", title: "Baby Saver", current: savingsRate, target: 10, unit: "%", category: "savings" },
                    { id: "saver_20", icon: "🌿", title: "Growing Saver", current: savingsRate, target: 20, unit: "%", category: "savings" },
                    { id: "super_saver", icon: "💪", title: "Super Saver", current: savingsRate, target: 50, unit: "%", category: "savings" },
                    { id: "mega_saver", icon: "🦸", title: "Mega Saver", current: savingsRate, target: 70, unit: "%", category: "savings" },
                    
                    // Portfolio
                    { id: "first_stock", icon: "📈", title: "First Investment", current: stocks.length, target: 1, unit: " stocks", category: "investing" },
                    { id: "diversified", icon: "🎯", title: "Diversified", current: stocks.length, target: 5, unit: " stocks", category: "investing" },
                    { id: "portfolio_pro", icon: "📊", title: "Portfolio Pro", current: stocks.length, target: 10, unit: " stocks", category: "investing" },
                    { id: "stock_enthusiast", icon: "💹", title: "Stock Enthusiast", current: stocks.length, target: 15, unit: " stocks", category: "investing" },
                    { id: "market_veteran", icon: "🦈", title: "Market Veteran", current: stocks.length, target: 20, unit: " stocks", category: "investing" },
                    { id: "wall_street_wolf", icon: "🐺", title: "Wall Street Wolf", current: stocks.length, target: 25, unit: " stocks", category: "investing" },
                    
                    // Tasks
                    { id: "task_starter", icon: "✅", title: "Task Starter", current: completedDailyTasks, target: 1, unit: " tasks", category: "productivity" },
                    { id: "task_master", icon: "🎖️", title: "Task Master", current: completedDailyTasks, target: 5, unit: " tasks", category: "productivity" },
                    
                    // Assets
                    { id: "asset_owner", icon: "🏠", title: "Asset Owner", current: assets.length, target: 1, unit: " assets", category: "assets" },
                    { id: "asset_collector", icon: "🏰", title: "Asset Collector", current: assets.length, target: 5, unit: " assets", category: "assets" },
                    { id: "asset_stacker", icon: "🏗️", title: "Asset Stacker", current: assets.length, target: 10, unit: " assets", category: "assets" },
                    { id: "asset_hoarder", icon: "🗄️", title: "Asset Hoarder", current: assets.length, target: 15, unit: " assets", category: "assets" },
                    { id: "asset_mogul", icon: "🎩", title: "Asset Mogul", current: assets.length, target: 20, unit: " assets", category: "assets" },
                    { id: "asset_tycoon", icon: "💼", title: "Asset Tycoon", current: assets.length, target: 25, unit: " assets", category: "assets" },
                  ];
                  
                  // Sort: incomplete first (by progress desc), then complete
                  const sorted = [...achievementData].sort((a, b) => {
                    const aProgress = Math.min((a.current / a.target) * 100, 100);
                    const bProgress = Math.min((b.current / b.target) * 100, 100);
                    const aComplete = aProgress >= 100;
                    const bComplete = bProgress >= 100;
                    if (aComplete && !bComplete) return 1;
                    if (!aComplete && bComplete) return -1;
                    return bProgress - aProgress;
                  });
                  
                  return sorted.map(a => {
                    const progress = Math.min((a.current / a.target) * 100, 100);
                    const isComplete = progress >= 100;
                    return (
                      <div key={a.id} className={`p-3 rounded-xl border ${isComplete ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`text-2xl ${isComplete ? '' : 'grayscale opacity-60'}`}>{a.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{a.title}</div>
                            <div className="text-xs text-gray-500">
                              {isComplete ? '🎉 Complete!' : `${a.unit === "$" ? "$" : ""}${a.current.toLocaleString(undefined, {maximumFractionDigits: 0})}${a.unit !== "$" ? a.unit : ""} / ${a.unit === "$" ? "$" : ""}${a.target.toLocaleString()}${a.unit !== "$" ? a.unit : ""}`}
                            </div>
                          </div>
                          {isComplete && <Trophy className="w-5 h-5 text-amber-500" />}
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {!isComplete && <div className="text-xs text-right text-gray-400 mt-1">{progress.toFixed(0)}%</div>}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border shadow-sm">
              <div className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-pink-500" />Coming Up</div>
              <div className="space-y-2">
                {(() => {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const sortedBdays = [...birthdays].filter(b => b.date && b.name).map(b => {
                    const bday = new Date(b.date);
                    bday.setHours(0, 0, 0, 0);
                    bday.setFullYear(now.getFullYear());
                    if (bday < now) bday.setFullYear(now.getFullYear() + 1);
                    const diff = Math.round((bday - now) / (1000 * 60 * 60 * 24));
                    return { ...b, daysAway: diff };
                  }).sort((a, b) => a.daysAway - b.daysAway);

                  const sortedRems = [...reminders].filter(r => r.date && r.title).map(r => {
                    const rDate = new Date(r.date);
                    rDate.setHours(0, 0, 0, 0);
                    const diff = Math.round((rDate - now) / (1000 * 60 * 60 * 24));
                    return { ...r, daysAway: diff };
                  }).filter(r => r.daysAway >= 0).sort((a, b) => a.daysAway - b.daysAway);

                  const allEvents = [
                    ...sortedBdays.map(b => ({ type: 'birthday', name: b.name, daysAway: b.daysAway })),
                    ...sortedRems.map(r => ({ type: 'reminder', name: r.title, daysAway: r.daysAway }))
                  ].sort((a, b) => a.daysAway - b.daysAway).slice(0, 5);

                  if (allEvents.length === 0) return <div className="text-gray-400 text-center py-4">Nothing scheduled</div>;

                  return allEvents.map((ev, i) => (
                    <div key={i} className={`p-2 ${ev.type === 'birthday' ? 'bg-pink-50' : 'bg-blue-50'} rounded-xl flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ev.type === 'birthday' ? '🎂' : '🔔'}</span>
                        <span className="text-sm font-medium">{ev.name}</span>
                      </div>
                      <span className={`text-xs font-medium ${ev.daysAway === 0 ? 'text-green-600' : ev.daysAway <= 7 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {ev.daysAway === 0 ? 'Today!' : ev.daysAway === 1 ? 'Tomorrow' : `${ev.daysAway}d`}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Daily Quote */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white mb-6">
            <div className="text-lg italic mb-2">"{todayQuote.quote}"</div>
            <div className="text-sm text-slate-400">— {todayQuote.author}</div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onClick={() => setActiveView('tasks')} className="bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all text-left">
              <CheckCircle2 className="w-6 h-6 text-purple-500 mb-2" />
              <div className="font-medium text-gray-800">Tasks</div>
              <div className="text-xs text-gray-500">{dailyTasks.filter(t => t.completed).length}/{dailyTasks.length} done</div>
            </button>
            <button onClick={() => setActiveView('diet')} className="bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all text-left">
              <ShoppingCart className="w-6 h-6 text-orange-500 mb-2" />
              <div className="font-medium text-gray-800">Diet</div>
              <div className="text-xs text-gray-500">{groceries.length} items</div>
            </button>
            <button onClick={() => setActiveView('gym')} className="bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all text-left">
              <Dumbbell className="w-6 h-6 text-green-500 mb-2" />
              <div className="font-medium text-gray-800">Fitness</div>
              <div className="text-xs text-gray-500">{workoutPlan.stepsGoal.toLocaleString()} step goal</div>
            </button>
            <button onClick={() => setActiveView('assets')} className="bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all text-left">
              <DollarSign className="w-6 h-6 text-blue-500 mb-2" />
              <div className="font-medium text-gray-800">Assets</div>
              <div className="text-xs text-gray-500">${totalAssets.toLocaleString()}</div>
            </button>
          </div>
        </div>
        
        {/* Floating Chat */}
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="pl-12">
                <button onClick={() => setActiveView('home')} className="text-blue-500 mb-4 font-medium">← Back</button>
                <h1 className="text-4xl font-semibold">Bills Management</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setBillsSubTab('bills')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billsSubTab === 'bills'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Bills
            </button>
            <button
              onClick={() => setBillsSubTab('calendar')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billsSubTab === 'calendar'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setBillsSubTab('goals')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billsSubTab === 'goals'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setBillsSubTab('debts')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billsSubTab === 'debts'
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Debts
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
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🍺 Personal
            </button>
            <button
              onClick={() => setBillsType('business')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                billsType === 'business'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              💼 Business
            </button>
          </div>

          {/* Salary Input */}
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{billsType === 'personal' ? 'Monthly Income' : 'Monthly Revenue'}</h2>
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
                <h2 className="text-xl font-semibold">{billsType === 'personal' ? 'Income' : 'Revenue'}</h2>
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
              <h2 className="text-xl font-semibold">{billsType === 'personal' ? '🍺 Personal Bills' : '💼 Business Bills'}</h2>
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
                    }} className="text-red-400 hover:text-red-600 text-sm ml-auto">
                      ✕
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
                <h2 className="text-xl font-semibold">Cost Breakdown</h2>
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
                    <span className="text-xs text-gray-500">$0</span>
                    <span className="text-xs text-gray-500">${salaryNum.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-semibold">Subscription</th>
                      <th className="text-center py-3 px-3 font-semibold">Due</th>
                      <th className="text-right py-3 px-3 font-semibold">Daily</th>
                      <th className="text-right py-3 px-3 font-semibold">Weekly</th>
                      <th className="text-right py-3 px-3 font-semibold">Monthly</th>
                      <th className="text-right py-3 px-3 font-semibold">Quarterly</th>
                      <th className="text-right py-3 px-3 font-semibold">Half-Year</th>
                      <th className="text-right py-3 px-3 font-semibold">Annually</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filledSubs].sort((a, b) => {
                      const parseDay = (str) => {
                        if (!str) return 32;
                        const num = parseInt(str.replace(/\D/g, ''));
                        return isNaN(num) ? 32 : num;
                      };
                      return parseDay(a.dueDate) - parseDay(b.dueDate);
                    }).map((sub, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {sub.name}
                          {sub.dateAdded && (
                            <span className="ml-2 text-xs text-gray-400">
                              ({getHoldingDuration(sub.dateAdded)})
                            </span>
                          )}
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
                        <h2 className="text-xl font-semibold">Muzz's Money Tips</h2>
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
                <h2 className="text-xl font-semibold">Bills vs Income</h2>
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
                      <p className="text-sm text-gray-500">Bills</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{(100 - parseFloat(calcPercentage(totalMonthly, salaryNum))).toFixed(1)}%</p>
                      <p className="text-sm text-gray-500">Savings</p>
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
                      <h2 className="text-xl font-semibold">Bills Calendar</h2>
                      <p className="text-sm text-gray-500">Track when bills are due</p>
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
                      <p className="text-sm text-gray-500">Add or manage bills</p>
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
                                className="text-red-400 hover:text-red-600"
                              >
                                ✕
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
                  <p className="text-sm text-gray-500">
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
                              className="text-red-400 hover:text-red-600 text-sm"
                            >
                              ✕
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
                  <h2 className="text-xl font-semibold">Small Goals</h2>
                  <p className="text-sm text-gray-500">Short-term savings targets</p>
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
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Target:</span>
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
                            <span className="text-xs text-gray-500">Saved:</span>
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
                  <h2 className="text-xl font-semibold">Big Goals</h2>
                  <p className="text-sm text-gray-500">Long-term financial targets</p>
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
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Target:</span>
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
                            <span className="text-xs text-gray-500">Saved:</span>
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
                    <button onClick={() => deleteDebt(debt.id)} className="text-red-400 hover:text-red-600">✕</button>
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
                      <span className="text-xs text-gray-500">{Math.round(pct)}% paid off</span>
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
                        <p className="text-xs text-gray-500">Total Debt</p>
                        <p className="text-lg font-bold text-red-600">${totalDebt.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <p className="text-xs text-gray-500">Total Paid</p>
                        <p className="text-lg font-bold text-green-600">${totalPaid.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <p className="text-xs text-gray-500">Remaining</p>
                        <p className="text-lg font-bold text-orange-600">${totalOwed.toLocaleString()}</p>
                      </div>
                    </div>
                    {totalDebt > 0 && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500">Overall Progress</span>
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
                        <h2 className="text-xl font-semibold">Personal Debts</h2>
                        <p className="text-sm text-gray-500">{personalDebts.length} debt{personalDebts.length !== 1 ? 's' : ''} — ${personalDebts.reduce((s, d) => s + Math.max((parseFloat(d.total) || 0) - (parseFloat(d.paid) || 0), 0), 0).toLocaleString()} remaining</p>
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
                        <h2 className="text-xl font-semibold">Business Debts</h2>
                        <p className="text-sm text-gray-500">{businessDebts.length} debt{businessDebts.length !== 1 ? 's' : ''} — ${businessDebts.reduce((s, d) => s + Math.max((parseFloat(d.total) || 0) - (parseFloat(d.paid) || 0), 0), 0).toLocaleString()} remaining</p>
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
        </div>
      </div>
    );
  }

  // FEEDBACK & SUPPORT VIEW
  if (activeView === 'feedback') {

    const handleSendFeedback = () => {
      if (!feedbackMsg.trim()) return;
      const subject = feedbackType === 'feedback' ? 'Muzz App Feedback' : feedbackType === 'bug' ? 'Muzz Bug Report' : 'Muzz Support Request';
      const body = encodeURIComponent(`From: ${userEmail}\nType: ${feedbackType}\n\n${feedbackMsg}`);
      window.open(`mailto:lauchy23@outlook.com?subject=${encodeURIComponent(subject)}&body=${body}`);
      setFeedbackSent(true);
      setFeedbackMsg('');
      setTimeout(() => setFeedbackSent(false), 3000);
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
        <Sidebar />
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 pt-16 pb-12 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Feedback & Support</h1>
            <p className="text-white/80">We'd love to hear from you, legend.</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 -mt-6">
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <div className="flex gap-2 mb-6">
              {[{ id: 'feedback', label: '💡 Feedback', desc: 'Ideas & suggestions' }, { id: 'bug', label: '🐛 Bug Report', desc: 'Something broken?' }, { id: 'support', label: '🆘 Support', desc: 'Need help?' }].map(t => (
                <button key={t.id} onClick={() => setFeedbackType(t.id)} className={`flex-1 p-3 rounded-2xl text-center transition-all ${feedbackType === t.id ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
            <a href="mailto:lauchy23@outlook.com" className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-white" /></div>
              <div>
                <div className="font-medium text-gray-800">Email Support</div>
                <div className="text-sm text-gray-500">lauchy23@outlook.com</div>
              </div>
            </a>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4">❓ FAQ</h3>
            <div className="space-y-3">
              {[
                { q: "How do I upgrade to Elite?", a: "Head to the 'Upgrade to Elite' section in the sidebar. It's $5/month and unlocks all features!" },
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
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-24">
        <Sidebar />
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 pt-16 pb-12 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <svg width="64" height="80" viewBox="0 0 24 32" fill="none" className="mx-auto mb-4">
              <path d="M12 0L22 8L20 16L24 16L12 32L0 16L4 16L2 8L12 0Z" fill="url(#eliteGradBig)" />
              <path d="M12 6L16 10L14 14L17 14L12 22L7 14L10 14L8 10L12 6Z" fill="white" fillOpacity="0.9" />
              <defs><linearGradient id="eliteGradBig" x1="12" y1="0" x2="12" y2="32"><stop stopColor="#FFD700"/><stop offset="1" stopColor="#FFA500"/></linearGradient></defs>
            </svg>
            <h1 className="text-4xl font-bold text-white mb-2">{isElite ? 'Elite Member' : 'Upgrade to Elite'}</h1>
            <p className="text-white/80">{isElite ? "You've got the full Muzz experience, legend." : '$5/month — Unlock everything Muzz has to offer'}</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {/* Elite Name Setting */}
          {isElite && (
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-3">Your Elite Profile</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-500">Display Name:</label>
                <input
                  type="text"
                  value={eliteName}
                  onChange={(e) => setEliteName(e.target.value)}
                  placeholder="Enter your name..."
                  className="flex-1 px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">This is used for personalised greetings on your dashboard</p>
            </div>
          )}

          {/* Funny Greetings Toggle */}
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-3">Preferences</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Funny Greetings</div>
                <div className="text-xs text-gray-400">Show cheeky greetings like "Welcome back daddy 🔥" on your dashboard</div>
              </div>
              <button
                onClick={() => setFunnyGreetings(!funnyGreetings)}
                className={`relative w-12 h-6 rounded-full transition-colors ${funnyGreetings ? 'bg-orange-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${funnyGreetings ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">What you get</h2>
            </div>
            <div className="divide-y">
              {[
                { feature: 'Tasks & Daily Planner', free: true, elite: true },
                { feature: 'Reminders & Birthdays', free: true, elite: true },
                { feature: 'Diet (Groceries, Meals, Water)', free: true, elite: true },
                { feature: '1 Custom Category', free: true, elite: true },
                { feature: 'AI Chat (10 msgs/day)', free: true, elite: false },
                { feature: 'AI Chat (30 msgs/day)', free: false, elite: true },
                { feature: 'Fitness & Gym Tracker', free: false, elite: true },
                { feature: 'Bills & Debt Tracker', free: false, elite: true },
                { feature: 'Assets Management', free: false, elite: true },
                { feature: 'Investment Portfolio', free: false, elite: true },
                { feature: 'Unlimited Custom Categories', free: false, elite: true },
                { feature: 'Elite Badge & Name', free: false, elite: true },
                { feature: 'Ad Free', free: false, elite: true },
              ].map((row, i) => (
                <div key={i} className="flex items-center px-6 py-3">
                  <span className="flex-1 text-sm text-gray-700">{row.feature}</span>
                  <span className="w-16 text-center">{row.free ? '✅' : '❌'}</span>
                  <span className="w-16 text-center">{row.elite ? '✅' : '—'}</span>
                </div>
              ))}
              <div className="flex items-center px-6 py-2 bg-gray-50 font-semibold text-sm">
                <span className="flex-1"></span>
                <span className="w-16 text-center text-gray-500">Free</span>
                <span className="w-16 text-center text-amber-600">Elite</span>
              </div>
            </div>
          </div>

          {/* Upgrade Button */}
          {!isElite && (
            <div className="text-center space-y-4">
              <button
                onClick={handleUpgrade}
                className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl text-lg font-bold shadow-lg hover:scale-105 transition-all"
              >
                Become Elite — $5/month
              </button>
              <p className="text-xs text-gray-400">Cancel anytime. Your data stays safe.</p>
            </div>
          )}

          {/* Subscription Management for paying Elite members */}
          {isElite && !isVIP && subscriptionInfo && (
            <div className="bg-white rounded-3xl shadow-sm border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Subscription</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Status: <span className="font-semibold text-green-600">Active</span></p>
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

          {isElite && isVIP && (
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-3xl p-6 text-center">
              <p className="text-amber-800 font-semibold">VIP Account — Lifetime Elite Access</p>
              <p className="text-amber-600 text-sm mt-1">You're a founder. No subscription needed, ever.</p>
            </div>
          )}
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="pl-12">
                <button onClick={() => setActiveView('home')} className="text-blue-500 mb-4 font-medium">← Back</button>
                <h1 className="text-4xl font-semibold">Assets Management</h1>
              </div>
            </div>
            {/* Sub-tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setAssetsSubTab('assets')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  assetsSubTab === 'assets'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Assets
              </button>
              <button
                onClick={() => setAssetsSubTab('goals')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  assetsSubTab === 'goals'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Goals
              </button>
              <button
                onClick={() => setAssetsSubTab('knowledge')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  assetsSubTab === 'knowledge'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Knowledge Guide
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
                  <h2 className="text-xl font-semibold">Assets</h2>
                  <p className="text-sm text-gray-500">Property, super, cash, vehicles, etc.</p>
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
                      className="text-red-400 hover:text-red-600 text-lg mt-1"
                    >
                      ✕
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
                <h2 className="text-xl font-semibold">Breakdown by Type</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-right py-3 px-4 font-semibold">Value</th>
                      <th className="text-right py-3 px-4 font-semibold">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetCategories
                      .map(cat => ({
                        ...cat,
                        total: filledAssets.filter(a => a.category === cat.id).reduce((sum, a) => sum + a.value, 0)
                      }))
                      .filter(cat => cat.total > 0)
                      .sort((a, b) => a.total - b.total)
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
                <h2 className="text-xl font-semibold">Assets Breakdown</h2>
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
                  <h2 className="text-xl font-semibold">Small Goals</h2>
                  <p className="text-sm text-gray-500">Short-term savings targets</p>
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
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Target:</span>
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
                            <span className="text-xs text-gray-500">Saved:</span>
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
                  <h2 className="text-xl font-semibold">Big Goals</h2>
                  <p className="text-sm text-gray-500">Long-term wealth targets</p>
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
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Target:</span>
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
                            <span className="text-xs text-gray-500">Saved:</span>
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
                  <h2 className="text-xl font-semibold">📚 The 3 Asset Categories (Buffett's Framework)</h2>
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
        </div>
      </div>
    );
  }

  // INVESTMENTS VIEW
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="pl-12">
                <button onClick={() => setActiveView('home')} className="text-blue-500 mb-4 font-medium">← Back</button>
                <h1 className="text-4xl font-semibold">Investments Management</h1>
              </div>
            </div>
            {/* Sub-tabs - scrollable on mobile */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-2 px-2">
              <button
                onClick={() => setInvestmentsSubTab('portfolio')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'portfolio'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setInvestmentsSubTab('research')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  (investmentsSubTab === 'research' || investmentsSubTab === 'declined' || investmentsSubTab === 'economics' || investmentsSubTab === 'risks')
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Research
              </button>
              <button
                onClick={() => setInvestmentsSubTab('goals')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'goals'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Goals
              </button>
              <button
                onClick={() => setInvestmentsSubTab('notes')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'notes'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setInvestmentsSubTab('knowledge')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  (investmentsSubTab === 'knowledge' || investmentsSubTab === 'books')
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Knowledge Guide
              </button>
              <button
                onClick={() => setInvestmentsSubTab('accounting')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'accounting'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Accounting
              </button>
              <button
                onClick={() => setInvestmentsSubTab('sp500')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  investmentsSubTab === 'sp500'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                S&P 500
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
                  <h2 className="text-xl font-semibold">Stocks & ETFs</h2>
                  <p className="text-sm text-gray-500">Individual stocks, ETFs, index funds</p>
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
                            className="text-red-400 hover:text-red-600 text-lg mt-1"
                          >
                            ✕
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
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">📊 Live Stock Prices</h2>
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
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase font-medium">Total Cost</div>
                                <div className="text-lg font-bold text-gray-800">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase font-medium">Market Value</div>
                                <div className="text-lg font-bold text-gray-800">${totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-gray-500 uppercase font-medium">Total P/L</div>
                                <div className={`text-lg font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  <span className="text-sm ml-1">({totalPL >= 0 ? '+' : ''}{totalPLPct.toFixed(2)}%)</span>
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
                                className="text-red-400 hover:text-red-600 text-lg mt-1"
                              >
                                ✕
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
                    <h2 className="text-xl font-semibold">Portfolio by Name</h2>
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
                            <span className="text-sm text-gray-600">{stock.name}</span>
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
                    <h2 className="text-xl font-semibold">Portfolio by Industry</h2>
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
                            <span className="text-sm text-gray-600">{ind.name}</span>
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
                    <h2 className="text-xl font-semibold">Portfolio by Industry</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left py-3 px-4 font-semibold">Industry</th>
                          <th className="text-center py-3 px-4 font-semibold">Holdings</th>
                          <th className="text-right py-3 px-4 font-semibold">Value</th>
                          <th className="text-right py-3 px-4 font-semibold">% of Portfolio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocksByIndustry.map(ind => (
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

          {(investmentsSubTab === 'research' || investmentsSubTab === 'declined' || investmentsSubTab === 'economics' || investmentsSubTab === 'risks') && (
            <>
              {/* Inner tabs for Research sub-sections */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setInvestmentsSubTab('research')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'research'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Research
                </button>
                <button
                  onClick={() => setInvestmentsSubTab('economics')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'economics'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Company Economics
                </button>
                <button
                  onClick={() => setInvestmentsSubTab('risks')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'risks'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Biggest Risks
                </button>
                <button
                  onClick={() => setInvestmentsSubTab('declined')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'declined'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Declined Companies
                </button>
              </div>
            </>
          )}

          {investmentsSubTab === 'research' && (
            <>
              {/* Holdings Research */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">Holdings Research</h2>
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
                          className="text-red-400 hover:text-red-600 text-lg mt-1"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Row 2: Toll Booth */}
                      <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 block">Toll Booth Economics?</label>
                        <input
                          type="text"
                          value={holding?.tollBooth || ''}
                          onChange={(e) => {
                            setHoldingsResearch(prev => {
                              const updated = [...prev];
                              if (!updated[index]) updated[index] = {};
                              updated[index] = { ...updated[index], tollBooth: e.target.value };
                              return updated;
                            });
                          }}
                          placeholder="Y/N"
                          className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:border-green-500"
                        />
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
                    <h2 className="text-xl font-semibold">Company Economics</h2>
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
                          className="text-red-400 hover:text-red-600 text-lg mt-1"
                        >
                          ✕
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
                    <h2 className="text-xl font-semibold">Biggest Risks</h2>
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
                          className="text-red-400 hover:text-red-600 text-lg mt-1"
                        >
                          ✕
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
                  <h2 className="text-xl font-semibold">Small Goals</h2>
                  <p className="text-sm text-gray-500">Short-term investment targets</p>
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
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Target:</span>
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
                            <span className="text-xs text-gray-500">Saved:</span>
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
                  <h2 className="text-xl font-semibold">Big Goals</h2>
                  <p className="text-sm text-gray-500">Long-term investment targets</p>
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
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-4 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Target:</span>
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
                            <span className="text-xs text-gray-500">Saved:</span>
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
                      }}
                      ref={(el) => {
                        // Only run once on mount using a data attribute flag
                        if (el && !el.dataset.initialized) {
                          el.dataset.initialized = 'true';
                          // Delay to avoid scroll jump during render
                          setTimeout(() => {
                            el.style.height = 'auto';
                            el.style.height = Math.max(300, el.scrollHeight) + 'px';
                          }, 50);
                        }
                      }}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.max(300, e.target.scrollHeight) + 'px';
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
                  <h2 className="text-xl font-semibold">Declined Companies</h2>
                  <p className="text-sm text-gray-500">Track companies you've passed on and why</p>
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
                          className="text-red-400 hover:text-red-600 text-lg mt-1"
                        >
                          ✕
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
                        <h2 className="text-xl font-semibold">Declined by Industry</h2>
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
                                <span className="text-sm text-gray-600">{ind.name}</span>
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
                        <h2 className="text-xl font-semibold">Declined Companies Breakdown</h2>
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
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Knowledge
                </button>
                <button
                  onClick={() => setInvestmentsSubTab('books')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    investmentsSubTab === 'books'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  <h2 className="text-xl font-semibold">📈 Equity Investment Breakdown Guide</h2>
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
                  <h2 className="text-xl font-semibold">🧠 Self-Assessment Questions</h2>
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
                  <h2 className="text-xl font-semibold">📖 Philip Fisher's Rules</h2>
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
                  <h2 className="text-xl font-semibold">🏰 Types of Durable Competitive Advantages</h2>
                  <p className="text-sm text-gray-500 mt-1">Buffett classifies great businesses into three categories</p>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                      <div className="text-3xl mb-2">🎁</div>
                      <h3 className="text-md font-bold text-blue-800 mb-2">1. Unique Products</h3>
                      <p className="text-sm text-gray-600 mb-2">Embedded into consumer habits through consistency, marketing, and experience.</p>
                      <p className="text-xs text-blue-600 font-medium">Examples: Coca-Cola, Hershey, Wrigley, P&G</p>
                    </div>

                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                      <div className="text-3xl mb-2">🛎️</div>
                      <h3 className="text-md font-bold text-purple-800 mb-2">2. Unique Services</h3>
                      <p className="text-sm text-gray-600 mb-2">Trusted, recurring services tied to the brand—not individuals.</p>
                      <p className="text-xs text-purple-600 font-medium">Examples: Moody's, H&R Block, AmEx</p>
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
                  <h2 className="text-xl font-semibold">🍺 The Beer & Foam Analogy</h2>
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
                    <p className="text-sm text-gray-700">When you pour a beer, sometimes you get mostly foam. Markets work the same way — during bull runs and hype cycles, prices can be 90% foam and 10% beer. When the foam settles (and it always does), you're left holding a glass that's mostly empty.</p>
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
                  <h2 className="text-xl font-semibold">📚 Recommended Reading List</h2>
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
                  <h2 className="text-xl font-semibold">📊 Core Ratios & Metrics</h2>
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
                  <h2 className="text-xl font-semibold">📉 Breakdown Metrics – Trend Checks</h2>
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
                  <h2 className="text-xl font-semibold">📄 What to Look for in the Income Statement</h2>
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
                  <h2 className="text-xl font-semibold">📈 EPS (Earnings Per Share) Analysis</h2>
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
                  <h2 className="text-xl font-semibold">📋 What to Look for in the Balance Sheet</h2>
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
                  <h2 className="text-xl font-semibold">💸 Cash Flow Statement Insights</h2>
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
                      <p className="text-sm text-gray-700">Great businesses: Coca-Cola uses 19% of earnings on CapEx, Moody's only 5%</p>
                      <p className="text-sm text-gray-700">Weak businesses: GM or Goodyear often use &gt;100% of earnings for CapEx (funded by debt)</p>
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
                  <h2 className="text-xl font-semibold">🚪 When You May Consider Selling</h2>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                      <div className="text-2xl mb-2">🎯</div>
                      <h3 className="text-md font-bold text-blue-800 mb-2">1. Better Opportunity</h3>
                      <p className="text-sm text-gray-600">Sell only if you find a better company at a better price.</p>
                    </div>

                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                      <div className="text-2xl mb-2">📉</div>
                      <h3 className="text-md font-bold text-orange-800 mb-2">2. Competitive Advantage Fades</h3>
                      <p className="text-sm text-gray-600">Sell if the company is losing its edge (e.g., newspapers vs internet).</p>
                    </div>

                    <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                      <div className="text-2xl mb-2">🎈</div>
                      <h3 className="text-md font-bold text-red-800 mb-2">3. Market Euphoria</h3>
                      <p className="text-sm text-gray-600">If price goes way above intrinsic value (e.g., P/E &gt; 40), consider selling.</p>
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
                  <h2 className="text-xl font-semibold">🧠 Buffett's Definition of Investing (2011)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <p className="text-sm text-gray-700 italic font-medium">"Investing is giving up purchasing power today, with a reasoned expectation of receiving MORE purchasing power — after taxes — in the future."</p>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <h3 className="text-md font-bold text-red-800 mb-2">Buffett's REAL Definition of Risk</h3>
                    <p className="text-sm text-gray-700">Not volatility. Not beta.</p>
                    <p className="text-sm text-gray-700 font-semibold mt-1">Risk = The chance your investment won't protect (or grow) your purchasing power over time.</p>
                  </div>
                </div>
              </div>

              {/* Buffett's Will Instructions */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                  <h2 className="text-xl font-semibold">📜 Buffett's Personal Will Instructions (2013)</h2>
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
                  <h2 className="text-xl font-semibold">📊 The Tailwind: S&P 500 vs the Dollar (1964–2014)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                      <h3 className="text-md font-bold text-green-800 mb-2">S&P 500 Performance</h3>
                      <p className="text-sm text-gray-700">Rose from <strong>84 → 2,059</strong></p>
                      <p className="text-sm text-gray-700">Including reinvested dividends:</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">11,196% total return</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                      <h3 className="text-md font-bold text-red-800 mb-2">Dollar Purchasing Power</h3>
                      <p className="text-sm text-gray-700">Fell <strong>87%</strong> over same period</p>
                      <p className="text-sm text-gray-700">What cost $0.13 in 1965 costs $1.00 in 2014</p>
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
                  <h2 className="text-xl font-semibold">⚖️ Voting Machine vs Weighing Machine (2017)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                      <h3 className="text-md font-bold text-red-800 mb-2">Short Term</h3>
                      <p className="text-sm text-gray-700">Market is a <strong>voting machine</strong> (popularity contest). Stock prices surge and swoon seemingly unconnected to underlying value.</p>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                      <h3 className="text-md font-bold text-green-800 mb-2">Long Term</h3>
                      <p className="text-sm text-gray-700">Market is a <strong>weighing machine</strong> (business reality). Retained earnings + ROE + moat + management shows up in price.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Berkshire Drawdowns */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
                  <h2 className="text-xl font-semibold">📉 Berkshire's Major Drawdowns — Price Crashes Are Normal</h2>
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
                  <h2 className="text-xl font-semibold">🚫 The Strongest Argument Against Using Debt in Stocks</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <p className="text-sm text-gray-700 italic font-medium">"This table offers the strongest argument I can muster against ever using borrowed money to own stocks."</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">• You can't predict how far or how fast stocks can fall short-term</p>
                    <p className="text-sm text-gray-700">• Even small borrowings can wreck your decision-making — headlines + crashing values = fear = panic selling</p>
                    <p className="text-sm text-gray-700">• An unsettled mind makes bad decisions at the worst possible time</p>
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
                  <h2 className="text-xl font-semibold">💎 Crashes as Opportunities (If You're Not in Debt)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-700">For the unleveraged investor, big drops are "extraordinary opportunities" — a chance to buy great businesses at bargain prices.</p>
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200">
                    <p className="text-sm text-gray-700 font-medium mb-2">The mindset you need (from Kipling's "If"):</p>
                    <p className="text-sm text-gray-700">• Keep your head while others lose theirs</p>
                    <p className="text-sm text-gray-700">• Be patient and not worn out by waiting</p>
                    <p className="text-sm text-gray-700">• Think clearly but don't over-obsess</p>
                    <p className="text-sm text-gray-700">• Trust yourself when others doubt you</p>
                  </div>
                </div>
              </div>

              {/* The Bet */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-yellow-50">
                  <h2 className="text-xl font-semibold">🏆 The Bet: S&P 500 vs Hedge Funds (2007–2017)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-700">Buffett bet that a zero-fee S&P 500 index fund would beat five fund-of-funds (each holding 200+ hedge funds) over 10 years.</p>
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
                  <h2 className="text-xl font-semibold">❌ Why Almost All Hedge Funds Fail Long-Term</h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                    <p className="text-sm text-gray-700"><strong>1. Size:</strong> Good performance attracts money, size explodes — big money is harder to compound.</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-sm text-gray-700"><strong>2. Luck mistaken for skill:</strong> A manager could be lucky for 3, 5, even 10 years.</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                    <p className="text-sm text-gray-700"><strong>3. Fee incentive:</strong> More AUM = more fees, so managers keep growing, lowering future returns.</p>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200 mt-2">
                    <p className="text-sm text-gray-700 italic font-medium">"What is easy with millions becomes impossible with billions."</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                    <p className="text-sm text-gray-700"><strong>Why active investors lose:</strong> Active investors, in aggregate, ARE the market. Passive investors match the market. Active investors have far higher costs. Therefore passive investors MUST win. It's simple arithmetic, not theory.</p>
                  </div>
                </div>
              </div>

              {/* The American Tailwind */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h2 className="text-xl font-semibold">🇺🇸 The American Tailwind (2018)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-700">Buffett made his first investment on March 11, 1942 at age 11 — $114.75 for 3 shares of Cities Service. He traces what happened across 77 years.</p>
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
                    <p className="text-sm text-gray-700">America prospered under 7 Republican and 7 Democratic presidents from 1942–2019. Despite high inflation, 21% prime rates, wars, housing collapse, financial panic, and presidential resignation — U.S. household wealth reached $108 trillion.</p>
                  </div>
                </div>
              </div>

              {/* Buffett's Recommendation */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                  <h2 className="text-xl font-semibold">✅ Buffett's Recommendation (60 Years Straight)</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-green-50 rounded-2xl p-5 border-2 border-green-300 text-center">
                    <p className="text-lg font-bold text-green-700">"Buy a low-cost S&P 500 index fund."</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">• Middle-class people follow the advice</p>
                    <p className="text-sm text-gray-700">• Rich people almost NEVER follow it</p>
                    <p className="text-sm text-gray-700">• Institutions never follow it</p>
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
                  <h2 className="text-xl font-semibold">⭐ Ultimate Lessons</h2>
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
                  <h2 className="text-xl font-semibold">💬 Classic Buffett Lines</h2>
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

        </div>
      </div>
    );
  }

  // FALLBACK
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Sidebar />
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 pt-16 pb-6 px-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setActiveView('home')} className="text-white/80 mb-4 text-sm hover:text-white transition-colors">← Back</button>
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
    </div>
  );
}

// ============================================
// APP WRAPPER WITH AUTH
// ============================================
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-6xl animate-bounce">🦘</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <MuzzApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
