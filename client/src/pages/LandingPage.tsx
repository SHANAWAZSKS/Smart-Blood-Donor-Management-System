import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  HeartPulse,
  Users,
  Droplet,
  ShieldCheck,
  Building2,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Sparkles,
} from "lucide-react";

type LandingPageProps = {
  onLoginSuccess: (message: string) => void;
  onExploreGuest: () => void;
};

export function LandingPage({ onLoginSuccess, onExploreGuest }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  // Signup specifics
  const [fullName, setFullName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [livingCity, setLivingCity] = useState("");
  const [role, setRole] = useState<"user" | "admin">("admin");
  const [formError, setFormError] = useState("");

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.sessionToken) {
        try {
          sessionStorage.setItem("manus-cookie", `app_session=${data.sessionToken}`);
        } catch {}
      }
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      onLoginSuccess(`Welcome back, ${data.user.name || "Member"}! Account signed in.`);
    },
    onError: (err) => {
      setFormError(err.message || "Failed to process authentication.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const targetEmail = activeTab === "signup"
      ? (emailOrPhone.includes("@") ? emailOrPhone : `${fullName.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}@lifelink.ai`)
      : (emailOrPhone.includes("@") ? emailOrPhone : `${emailOrPhone.replace(/[^a-z0-9]/g, "") || "user"}@lifelink.ai`);

    if (!emailOrPhone.trim()) {
      setFormError(activeTab === "signup" ? "Email or Mobile Number is required" : "Email or Phone Number is required");
      return;
    }

    let resolvedName = "Dr. Kavya Deshmukh";
    if (activeTab === "signup") {
      resolvedName = fullName.trim() || "Dr. Kavya Deshmukh";
    } else {
      if (emailOrPhone.toLowerCase().includes("kavya")) {
        resolvedName = "Dr. Kavya Deshmukh";
      } else if (emailOrPhone.toLowerCase().includes("admin")) {
        resolvedName = "St. Mary's Admin";
      } else {
        const prefix = emailOrPhone.split("@")[0] || "Dr. Kavya Deshmukh";
        resolvedName = prefix.split(".").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }
    }

    loginMutation.mutate({
      name: resolvedName,
      email: targetEmail.trim(),
      role,
      mobileNumber: emailOrPhone.includes("@") ? "+91 98765 43210" : emailOrPhone,
      bloodGroup,
      livingCity,
    });
  };

  const handleQuickDemo = (demoName: string, demoEmail: string, demoRole: "user" | "admin") => {
    setFormError("");
    loginMutation.mutate({
      name: demoName,
      email: demoEmail,
      role: demoRole,
      mobileNumber: "+91 98765 43210",
      bloodGroup: "O+",
      livingCity: "Hyderabad",
    });
  };

  return (
    <div className="landing-container">
      {/* Background Image Overlay */}
      <div className="landing-bg" />

      {/* Left Content Side */}
      <div className="landing-left">
        {/* Brand Header */}
        <div className="landing-brand">
          <div className="landing-brand__icon">
            <Droplet size={22} className="text-red-500 fill-red-500" />
          </div>
          <div>
            <h1 className="landing-brand__title">Blood Donor</h1>
            <p className="landing-brand__subtitle">Management System</p>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="landing-hero">
          <h2>
            One donation can save <br />
            up to <span className="highlight-red">3 lives</span>
          </h2>
        </div>

        {/* Feature List */}
        <div className="landing-features">
          <div className="feature-item">
            <div className="feature-icon">
              <HeartPulse size={20} />
            </div>
            <div>
              <h3>Be a Donor</h3>
              <p>Give Blood. Give Hope.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Users size={20} />
            </div>
            <div>
              <h3>Save Lives</h3>
              <p>Your donation matters.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <Droplet size={20} />
            </div>
            <div>
              <h3>Build a Healthier Tomorrow</h3>
              <p>Together we can.</p>
            </div>
          </div>
        </div>

        {/* Bottom Neon Heartbeat Graphic */}
        <div className="landing-ecg">
          <div className="ecg-line-left" />
          <div className="ecg-heart">
            <HeartPulse size={22} />
          </div>
          <div className="ecg-line-right" />
        </div>
      </div>

      {/* Right Sign-In / Sign-Up Panel */}
      <div className="landing-right">
        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === "signin" ? "active" : ""}`}
              onClick={() => { setActiveTab("signin"); setFormError(""); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => { setActiveTab("signup"); setFormError(""); }}
            >
              Create Account
            </button>
          </div>

          {formError && (
            <div className="auth-error-banner">
              {formError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {activeTab === "signup" && (
              <div className="input-group">
                <span className="input-icon"><User size={18} /></span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Kavya Deshmukh"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="input-group">
              <span className="input-icon"><User size={18} /></span>
              <input
                type="text"
                required
                placeholder="Email or Phone Number"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
              />
            </div>

            <div className="input-group">
              <span className="input-icon"><Lock size={18} /></span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {activeTab === "signup" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <span className="input-icon" style={{ fontSize: 13, fontWeight: 700, color: "#ff2a4b" }}>🩸</span>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      style={{ background: "transparent", color: "#fff", border: "none", width: "100%", outline: "none", fontSize: 14 }}
                    >
                      <option value="A+" style={{ background: "#0f172a" }}>Blood A+</option>
                      <option value="A−" style={{ background: "#0f172a" }}>Blood A−</option>
                      <option value="B+" style={{ background: "#0f172a" }}>Blood B+</option>
                      <option value="B−" style={{ background: "#0f172a" }}>Blood B−</option>
                      <option value="AB+" style={{ background: "#0f172a" }}>Blood AB+</option>
                      <option value="AB−" style={{ background: "#0f172a" }}>Blood AB−</option>
                      <option value="O+" style={{ background: "#0f172a" }}>Blood O+</option>
                      <option value="O−" style={{ background: "#0f172a" }}>Blood O−</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <span className="input-icon"><MapPin size={16} /></span>
                    <input
                      type="text"
                      placeholder="City"
                      value={livingCity}
                      onChange={(e) => setLivingCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: 12 }}>
                  <span className="input-icon"><Building2 size={16} /></span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "user" | "admin")}
                    style={{ background: "transparent", color: "#fff", border: "none", width: "100%", outline: "none", fontSize: 14 }}
                  >
                    <option value="admin" style={{ background: "#0f172a" }}>Hospital Admin / Broadcaster</option>
                    <option value="user" style={{ background: "#0f172a" }}>Blood Donor Member</option>
                  </select>
                </div>
              </>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              className="btn-primary-red"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Authenticating…" : (activeTab === "signin" ? "Sign In →" : "Create Account →")}
            </button>
          </form>

          {/* Forgot Password Link */}
          {activeTab === "signin" && (
            <div className="forgot-link-wrap">
              <button
                type="button"
                className="forgot-link"
                onClick={() => handleQuickDemo("St. Mary's Admin", "admin@stmarys.org", "admin")}
              >
                Forgot password? (Or click for instant demo login)
              </button>
            </div>
          )}

          {/* OR Divider */}
          <div className="or-divider">
            <span className="or-line" />
            <span className="or-text">OR</span>
            <span className="or-line" />
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            className="btn-google"
            disabled={loginMutation.isPending}
            onClick={() => handleQuickDemo("St. Mary's Hospital Admin", "admin@stmarys.org", "admin")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          {/* Quick Demo Sign In Pills */}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn-demo-pill"
              disabled={loginMutation.isPending}
              onClick={() => handleQuickDemo("St. Mary's Admin", "admin@stmarys.org", "admin")}
            >
              <Building2 size={13} /> Hospital Admin Demo
            </button>
            <button
              type="button"
              className="btn-demo-pill"
              disabled={loginMutation.isPending}
              onClick={() => handleQuickDemo("Dr. Kavya DeshmukhDr. Kavya Deshmukh", "kavya@lifelink.ai", "user")}
            >
              <UserCheck size={13} /> Donor Member Demo
            </button>
          </div>

          {/* Footer Switcher */}
          <div className="auth-footer-text">
            {activeTab === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="link-red"
                  onClick={() => { setActiveTab("signup"); setFormError(""); }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="link-red"
                  onClick={() => { setActiveTab("signin"); setFormError(""); }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Guest Dashboard Access Link */}
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button
              type="button"
              onClick={onExploreGuest}
              style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
            >
              Skip & explore system as guest visitor →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
