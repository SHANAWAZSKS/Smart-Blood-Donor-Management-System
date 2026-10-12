import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { X, Check, ArrowRight, ShieldCheck, UserCheck, Building2, UserPlus, LogIn } from "lucide-react";

type AuthModalProps = {
  isOpen: boolean;
  initialTab?: "login" | "register";
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function AuthModal({ isOpen, initialTab = "register", onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  
  // Registration / Login form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
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
      onSuccess(`Welcome, ${data.user.name || "Member"}! Account signed in.`);
      onClose();
    },
    onError: (err) => {
      setFormError(err.message || "Failed to process authentication request.");
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const resolvedName = name.trim();

    if (!email.trim() || !email.includes("@")) {
      setFormError("Please provide a valid email address.");
      return;
    }

    loginMutation.mutate({
      name: tab === "register" ? resolvedName : (resolvedName || email.split("@")[0]),
      email: email.trim(),
      role,
      mobileNumber,
      bloodGroup,
      livingCity,
    });
  };

  const handleQuickLogin = (demoName: string, demoEmail: string, demoRole: "user" | "admin") => {
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
    <div className="profile-modal-backdrop" style={{ zIndex: 9999 }}>
      <section className="profile-modal" role="dialog" aria-modal="true" style={{ maxWidth: 460, width: "100%" }}>
        <div className="profile-modal__head">
          <div>
            <span className="section-eyebrow section-eyebrow--red" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={14} /> LifeLink Authentication
            </span>
            <h2>{tab === "register" ? "Create an Account" : "Sign In to LifeLink"}</h2>
            <p>Access hospital emergency broadcasting and donor coordination.</p>
          </div>
          <button className="icon-button icon-button--soft" onClick={onClose} aria-label="Close modal">
            <X size={17} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="auth-modal-tabs">
          <button
            type="button"
            className={`button ${tab === "register" ? "button--dark" : "button--ghost"}`}
            style={{ flex: 1, justifyContent: "center", padding: "8px 12px", fontSize: 13 }}
            onClick={() => { setTab("register"); setFormError(""); }}
          >
            <UserPlus size={15} /> Create Account
          </button>
          <button
            type="button"
            className={`button ${tab === "login" ? "button--dark" : "button--ghost"}`}
            style={{ flex: 1, justifyContent: "center", padding: "8px 12px", fontSize: 13 }}
            onClick={() => { setTab("login"); setFormError(""); }}
          >
            <LogIn size={15} /> Sign In
          </button>
        </div>

        {formError && (
          <div className="auth-form-error">
            {formError}
          </div>
        )}

        {tab === "register" ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <label>
              Full name
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Kavya Deshmukh"
              />
            </label>

            <label>
              Work or Personal Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. kavya@stmarys.org"
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                Blood group
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                  <option value="A+">A+</option>
                  <option value="A−">A−</option>
                  <option value="B+">B+</option>
                  <option value="B−">B−</option>
                  <option value="AB+">AB+</option>
                  <option value="AB−">AB−</option>
                  <option value="O+">O+</option>
                  <option value="O−">O−</option>
                </select>
              </label>

              <label>
                Living City
                <input
                  required
                  type="text"
                  value={livingCity}
                  onChange={(e) => setLivingCity(e.target.value)}
                  placeholder="e.g. Hyderabad"
                />
              </label>
            </div>

            <label>
              Mobile number
              <input
                required
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>

            <label>
              Account Type
              <select value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")}>
                <option value="admin">Hospital Member / Admin (Broadcaster)</option>
                <option value="user">Registered Blood Donor</option>
              </select>
            </label>

            <div className="profile-form__actions" style={{ marginTop: 24 }}>
              <button type="button" className="button button--ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button button--dark" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Creating Account…" : "Create Account & Proceed"} <ArrowRight size={15} />
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="auth-demo-box">
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Quick Demo Sign In
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="button button--dark"
                  style={{ justifyContent: "flex-start", padding: "10px 14px", width: "100%" }}
                  disabled={loginMutation.isPending}
                  onClick={() => handleQuickLogin("St. Mary's Admin", "admin@stmarys.org", "admin")}
                >
                  <Building2 size={16} /> Sign in as Hospital Admin (St. Mary's)
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  style={{ justifyContent: "flex-start", padding: "10px 14px", width: "100%", border: "1px solid rgba(255,255,255,0.15)" }}
                  disabled={loginMutation.isPending}
                  onClick={() => handleQuickLogin("Dr. Kavya Deshmukh", "kavya@lifelink.ai", "user")}
                >
                  <UserCheck size={16} /> Sign in as Donating Member (Dr. Kavya)
                </button>
              </div>
            </div>

            <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", margin: "4px 0" }}>OR SIGN IN WITH EMAIL</div>

            <form onSubmit={handleSubmit} className="profile-form">
              <label>
                Email Address
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter registered email"
                />
              </label>

              <div className="profile-form__actions" style={{ marginTop: 16 }}>
                <button type="button" className="button button--ghost" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="button button--dark" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in…" : "Sign In"} <LogIn size={15} />
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
