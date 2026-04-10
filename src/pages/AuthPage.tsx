import React, { useState, useEffect, useRef, useCallback } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/app-toast";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// Password strength calculator
const getPasswordStrength = (pw: string): { level: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Weak", color: "bg-destructive" };
  if (score <= 2) return { level: 2, label: "Fair", color: "bg-amber-500" };
  if (score <= 3) return { level: 3, label: "Good", color: "bg-yellow-400" };
  if (score <= 4) return { level: 4, label: "Strong", color: "bg-emerald-400" };
  return { level: 5, label: "Very Strong", color: "bg-emerald-500" };
};

// Runaway messages
const runawayMessages = [
  "Fill in all fields first! 😜",
  "Not so fast! Complete the form 📝",
  "Almost there! Just fill everything ✍️",
  "Hey! I need all your info first 🏃",
  "Catch me after filling the form! 🎯",
];

const AuthPage: React.FC = () => {
  useSeoMeta("auth", "Sign In | Store");
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as any)?.from || "/";

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  // OTP verification state
  const [otpMode, setOtpMode] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpEmail, setOtpEmail] = useState("");

  // Runaway button state
  const [runawayMsg, setRunawayMsg] = useState("");
  const btnX = useMotionValue(0);
  const btnY = useMotionValue(0);
  const smoothX = useSpring(btnX, { stiffness: 300, damping: 20 });
  const smoothY = useSpring(btnY, { stiffness: 300, damping: 20 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isLoginFormValid = email.trim() && password.trim() && password.length >= 6;
  const isSignUpFormValid = email.trim() && password.trim() && password.length >= 6 && fullName.trim();
  const isForgotFormValid = email.trim();
  const isFormValid = forgotMode ? isForgotFormValid : isSignUp ? isSignUpFormValid : isLoginFormValid;

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; dx: number; dy: number; size: number }[] = [];
    const mouse = { x: -1000, y: -1000, radius: 120 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const init = () => {
      particles = [];
      const count = Math.min((canvas.width * canvas.height) / 12000, 150);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          dx: (Math.random() - 0.5) * 0.8,
          dy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 2 + 0.5,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const ddx = mouse.x - p.x;
        const ddy = mouse.y - p.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < mouse.radius) {
          if (mouse.x < p.x) p.x += 2;
          if (mouse.x > p.x) p.x -= 2;
          if (mouse.y < p.y) p.y += 2;
          if (mouse.y > p.y) p.y -= 2;
        }
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx = -p.dx;
        if (p.y < 0 || p.y > canvas.height) p.dy = -p.dy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "hsl(190 30% 40% / 0.5)";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const dx2 = p.x - particles[j].x;
          const dy2 = p.y - particles[j].y;
          const d2 = dx2 * dx2 + dy2 * dy2;
          if (d2 < 15000) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsl(190 30% 40% / ${0.3 - d2 / 50000})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };

    const onMouse = (e: MouseEvent) => { mouse.x = e.x; mouse.y = e.y; };
    const onOut = () => { mouse.x = -1000; mouse.y = -1000; };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("mouseout", onOut);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseout", onOut);
    };
  }, []);

  // Runaway button logic
  const handleRunaway = useCallback((clientX: number, clientY: number) => {
    if (isFormValid || !btnRef.current || !containerRef.current) return;

    const btnRect = btnRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const btnCenterX = btnRect.left + btnRect.width / 2;
    const btnCenterY = btnRect.top + btnRect.height / 2;

    const dx = clientX - btnCenterX;
    const dy = clientY - btnCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 120) {
      // Run away from cursor
      const angle = Math.atan2(dy, dx);
      const moveDistance = 100 + Math.random() * 60;
      let newX = -Math.cos(angle) * moveDistance;
      let newY = -Math.sin(angle) * moveDistance;

      // Keep within container bounds
      const maxX = (containerRect.width - btnRect.width) / 2 - 10;
      const maxY = 80;
      newX = Math.max(-maxX, Math.min(maxX, btnX.get() + newX));
      newY = Math.max(-maxY, Math.min(maxY, btnY.get() + newY));

      btnX.set(newX);
      btnY.set(newY);

      setRunawayMsg(runawayMessages[Math.floor(Math.random() * runawayMessages.length)]);
    }
  }, [isFormValid, btnX, btnY]);

  // Reset button position when form becomes valid
  useEffect(() => {
    if (isFormValid) {
      btnX.set(0);
      btnY.set(0);
      setRunawayMsg("");
    }
  }, [isFormValid, btnX, btnY]);

  if (user) return <Navigate to="/home" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast({ title: "Login failed", description: error.message, variant: "destructive" });
    else navigate(fromPath === "/" ? "/home" : fromPath);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      setOtpEmail(email);
      setOtpMode(true);
      toast({ title: "Verification code sent!", description: "Check your email for the 8-digit code." });
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 8) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail,
      token: otpValue,
      type: "signup",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account verified!" });
      navigate("/home");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isForgotFormValid) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Email sent", description: "Check your inbox for the reset link." });
  };

  const handleBack = () => {
    if (fromPath === "/" || fromPath === "/auth") navigate("/");
    else navigate(fromPath);
  };

  const pwStrength = getPasswordStrength(password);
  const inputCls = "w-full pl-11 pr-4 py-3.5 bg-transparent border-b-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body";

  // OTP screen
  if (otpMode) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ background: "hsl(var(--background))" }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-[90vw] max-w-[450px] liquid-glass-card rounded-3xl p-8 md:p-12 flex flex-col items-center gap-6"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">Verify Your Email</h1>
          <p className="text-sm text-muted-foreground text-center">
            We sent an 8-digit code to <span className="text-foreground font-medium">{otpEmail}</span>
          </p>

          <InputOTP maxLength={8} value={otpValue} onChange={setOtpValue}>
            <InputOTPGroup>
              {Array.from({ length: 8 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleVerifyOtp}
            disabled={loading || otpValue.length !== 8}
            className="w-full btn-pill bg-gradient-primary text-primary-foreground font-semibold py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : "Verify & Continue"}
          </motion.button>

          <button onClick={() => { setOtpMode(false); setOtpValue(""); }} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ background: "hsl(var(--background))" }} />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={handleBack}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-subtle text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </motion.button>

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-[90vw] max-w-[850px] min-h-[520px] liquid-glass-card rounded-3xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Sign In form */}
        <div className={`absolute md:relative top-0 left-0 w-full md:w-1/2 h-full transition-all duration-500 ease-in-out flex items-center justify-center ${isSignUp ? "md:translate-x-full opacity-0 pointer-events-none md:pointer-events-auto" : "opacity-100"}`}
          style={{ zIndex: isSignUp ? 1 : 2 }}>
          {forgotMode ? (
            <form onSubmit={handleForgot} className="w-full px-8 md:px-12 py-10 flex flex-col items-center gap-4">
              <h1 className="text-2xl font-bold font-display text-foreground">Reset Password</h1>
              <p className="text-sm text-muted-foreground text-center">Enter your email to receive a reset link</p>
              <div className="relative w-full">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} />
              </div>
              <div className="relative w-full">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  disabled={loading || !isForgotFormValid}
                  className="w-full btn-pill bg-gradient-primary text-primary-foreground font-semibold py-3.5 disabled:opacity-50"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto" /> : "Send Reset Link"}
                </motion.button>
              </div>
              <button type="button" onClick={() => setForgotMode(false)} className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to Sign In
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleLogin}
              className="w-full px-8 md:px-12 py-10 flex flex-col items-center gap-4"
              onMouseMove={(e) => handleRunaway(e.clientX, e.clientY)}
            >
              <h1 className="text-2xl font-bold font-display text-foreground">Sign In</h1>
              <p className="text-xs text-muted-foreground mb-2">Use your account credentials</p>
              <div className="relative w-full">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} />
              </div>
              <div className="relative w-full">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline self-end">Forgot password?</button>

              {/* Runaway button */}
              <div className="relative w-full">
                <AnimatePresence>
                  {runawayMsg && !isFormValid && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-primary text-center mb-2 font-medium"
                    >
                      {runawayMsg}
                    </motion.p>
                  )}
                </AnimatePresence>
                <motion.button
                  ref={!isSignUp ? btnRef : undefined}
                  whileTap={isFormValid ? { scale: 0.96 } : {}}
                  type={isFormValid ? "submit" : "button"}
                  disabled={loading}
                  style={!isFormValid ? { x: smoothX, y: smoothY } : {}}
                  onTouchStart={(e) => {
                    if (!isFormValid) {
                      const touch = e.touches[0];
                      handleRunaway(touch.clientX, touch.clientY);
                    }
                  }}
                  className="w-full btn-pill bg-gradient-primary text-primary-foreground font-semibold py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                </motion.button>
              </div>

              <button type="button" onClick={() => setIsSignUp(true)} className="md:hidden text-sm text-primary hover:underline mt-2">
                Don't have an account? Sign Up
              </button>
            </form>
          )}
        </div>

        {/* Sign Up form */}
        <div className={`absolute md:relative top-0 left-0 w-full md:w-1/2 h-full transition-all duration-500 ease-in-out flex items-center justify-center ${isSignUp ? "opacity-100" : "md:translate-x-0 opacity-0 pointer-events-none md:pointer-events-auto"}`}
          style={{ zIndex: isSignUp ? 5 : 1 }}>
          <form
            onSubmit={handleSignup}
            className="w-full px-8 md:px-12 py-10 flex flex-col items-center gap-4"
            onMouseMove={(e) => handleRunaway(e.clientX, e.clientY)}
          >
            <h1 className="text-2xl font-bold font-display text-foreground">Create Account</h1>
            <p className="text-xs text-muted-foreground mb-2">Enter your details to get started</p>
            <div className="relative w-full">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required className={inputCls} />
            </div>
            <div className="relative w-full">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} />
            </div>
            <div className="relative w-full">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={`${inputCls} pr-11`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="w-full space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors ${level <= pwStrength.level ? pwStrength.color : "bg-muted"}`} />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  {pwStrength.level <= 2 ? <ShieldAlert className="w-3 h-3 text-destructive" /> : <Shield className="w-3 h-3 text-emerald-400" />}
                  <span className="text-[10px] text-muted-foreground">{pwStrength.label}</span>
                </div>
              </div>
            )}

            {/* Runaway button */}
            <div className="relative w-full">
              <AnimatePresence>
                {runawayMsg && !isFormValid && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-primary text-center mb-2 font-medium"
                  >
                    {runawayMsg}
                  </motion.p>
                )}
              </AnimatePresence>
              <motion.button
                ref={isSignUp ? btnRef : undefined}
                whileTap={isFormValid ? { scale: 0.96 } : {}}
                type={isFormValid ? "submit" : "button"}
                disabled={loading}
                style={!isFormValid ? { x: smoothX, y: smoothY } : {}}
                onTouchStart={(e) => {
                  if (!isFormValid) {
                    const touch = e.touches[0];
                    handleRunaway(touch.clientX, touch.clientY);
                  }
                }}
                className="w-full btn-pill bg-gradient-primary text-primary-foreground font-semibold py-3.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <>Sign Up <ArrowRight className="w-4 h-4" /></>}
              </motion.button>
            </div>

            <button type="button" onClick={() => setIsSignUp(false)} className="md:hidden text-sm text-primary hover:underline mt-2">
              Already have an account? Sign In
            </button>
          </form>
        </div>

        {/* Overlay panel (desktop only) */}
        <div className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-[100] transition-transform duration-500 ease-in-out ${isSignUp ? "-translate-x-full" : ""}`}>
          <div className={`relative h-full w-[200%] -left-full bg-gradient-primary transition-transform duration-500 ease-in-out ${isSignUp ? "translate-x-1/2" : ""}`}>
            <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-10 text-center transition-transform duration-500 ${isSignUp ? "translate-x-0" : "-translate-x-[20%]"}`}>
              <h2 className="text-2xl font-bold font-display text-primary-foreground mb-3">Welcome Back!</h2>
              <p className="text-primary-foreground/80 text-sm mb-6">To keep connected with us please login with your personal info</p>
              <button onClick={() => setIsSignUp(false)}
                className="btn-pill border-2 border-primary-foreground text-primary-foreground font-semibold px-8 py-2.5 hover:bg-primary-foreground/10 transition-colors">
                Sign In
              </button>
            </div>
            <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-10 text-center transition-transform duration-500 ${isSignUp ? "translate-x-[20%]" : "translate-x-0"}`}>
              <h2 className="text-2xl font-bold font-display text-primary-foreground mb-3">Hello, Friend!</h2>
              <p className="text-primary-foreground/80 text-sm mb-6">Enter your personal details and start your journey with us</p>
              <button onClick={() => setIsSignUp(true)}
                className="btn-pill border-2 border-primary-foreground text-primary-foreground font-semibold px-8 py-2.5 hover:bg-primary-foreground/10 transition-colors">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
