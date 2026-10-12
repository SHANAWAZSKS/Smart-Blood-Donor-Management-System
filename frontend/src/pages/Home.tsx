﻿import { useEffect, useMemo, useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthModal } from "@/components/AuthModal";
import { LandingPage } from "./LandingPage";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Droplets,
  HeartPulse,
  LayoutDashboard,
  ListFilter,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Navigation,
  PackageCheck,
  Phone,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateMatchScore } from "../../../shared/lifelink";
import { LiveDonorMap } from "@/components/LiveDonorMap";
import { trpc } from "@/lib/trpc";

type View = "overview" | "find" | "map" | "emergency" | "inventory" | "eligibility" | "history" | "analytics";
type BloodGroup = "A+" | "A−" | "B+" | "B−" | "AB+" | "AB−" | "O+" | "O−";

type Donor = {
  name: string;
  initials: string;
  group: string;
  distance: string;
  lastDonation: string;
  score: number;
  status: string;
  color: string;
};

const donors: Donor[] = [
  { name: "Aarav Mehta", initials: "AM", group: "O+", distance: "1.8 km away", lastDonation: "Donated 84 days ago", score: calculateMatchScore({ bloodGroupMatch: true, distanceKm: 1.8, eligible: true, available: true }), status: "Available now", color: "mint" },
  { name: "Diya Sharma", initials: "DS", group: "O+", distance: "3.2 km away", lastDonation: "Donated 102 days ago", score: calculateMatchScore({ bloodGroupMatch: true, distanceKm: 3.2, eligible: true, available: true }), status: "Available today", color: "lavender" },
  { name: "Rohan Iyer", initials: "RI", group: "O−", distance: "4.7 km away", lastDonation: "Donated 121 days ago", score: calculateMatchScore({ bloodGroupMatch: true, distanceKm: 4.7, eligible: true, available: true }), status: "Available now", color: "peach" },
];

const inventory = [
  { group: "O+", units: 42, capacity: 70, level: "Healthy", tone: "green" },
  { group: "A+", units: 18, capacity: 55, level: "Watch", tone: "amber" },
  { group: "B+", units: 31, capacity: 50, level: "Healthy", tone: "green" },
  { group: "AB−", units: 7, capacity: 25, level: "Urgent", tone: "red" },
  { group: "O−", units: 12, capacity: 30, level: "Watch", tone: "amber" },
];

const navSections = [
  {
    label: "Workspace",
    items: [
      { id: "overview" as View, label: "Overview", icon: LayoutDashboard },
      { id: "find" as View, label: "Find a donor", icon: UsersRound, count: "12" },
      { id: "map" as View, label: "Live donor map", icon: Navigation, count: "6" },
      { id: "emergency" as View, label: "Emergency request", icon: Zap, urgent: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "inventory" as View, label: "Blood inventory", icon: PackageCheck },
      { id: "eligibility" as View, label: "My eligibility", icon: ShieldCheck },
      { id: "history" as View, label: "Donation history", icon: Clock3 },
      { id: "analytics" as View, label: "Impact analytics", icon: TrendingUp },
    ],
  },
];

function BloodMark({ small = false }: { small?: boolean }) {
  return (
    <div className={cn("blood-mark", small && "blood-mark--small")} aria-hidden="true">
      <Droplets size={small ? 16 : 20} fill="currentColor" strokeWidth={2.5} />
    </div>
  );
}

function StatCard({ label, value, detail, trend, icon: Icon, tone }: { label: string; value: string; detail: string; trend?: "up" | "down"; icon: typeof Activity; tone: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card__top">
        <span className={cn("icon-disc", tone)}><Icon size={18} /></span>
        {trend && <span className={cn("trend", trend)}>{trend === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {trend === "up" ? "+12%" : "-4%"}</span>}
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__detail">{detail}</div>
    </div>
  );
}

function DonorRow({ donor, compact = false, onRequest }: { donor: Donor; compact?: boolean; onRequest: (name: string) => void }) {
  return (
    <div className={cn("donor-row", compact && "donor-row--compact")}>
      <div className={cn("avatar", donor.color)}>{donor.initials}</div>
      <div className="donor-row__identity">
        <div className="donor-row__name">{donor.name} <span className="blood-chip">{donor.group}</span></div>
        <div className="donor-row__meta"><MapPin size={12} /> {donor.distance} <span className="meta-dot" /> {donor.lastDonation}</div>
      </div>
      <div className="donor-row__score"><span>{donor.score}%</span><small>match</small></div>
      {!compact && <button className="icon-button icon-button--soft" onClick={() => onRequest(donor.name)} aria-label={`Contact ${donor.name}`}><MessageCircle size={16} /></button>}
      {compact && <button className="text-button" onClick={() => onRequest(donor.name)}>Request <ChevronRight size={14} /></button>}
    </div>
  );
}

function SupplyBar({ group, units, capacity, level, tone }: (typeof inventory)[number]) {
  const width = Math.round((units / capacity) * 100);
  return (
    <div className="supply-row">
      <div className="supply-row__title"><span className="group-pill">{group}</span><strong>{units} units</strong><span className={cn("supply-status", tone)}>{level}</span></div>
      <div className="supply-track"><span className={cn("supply-fill", tone)} style={{ width: `${Math.max(width, 14)}%` }} /></div>
      <div className="supply-row__foot"><span>Current stock</span><span>Capacity {capacity}</span></div>
    </div>
  );
}

function EmptyHint({ title, description, icon: Icon }: { title: string; description: string; icon: typeof Activity }) {
  return <div className="empty-hint"><span className="empty-hint__icon"><Icon size={20} /></span><div><strong>{title}</strong><p>{description}</p></div></div>;
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState<View>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("register");
  const [guestMode, setGuestMode] = useState(false);

  const [profileForm, setProfileForm] = useState<{ name: string; mobileNumber: string; bloodGroup: BloodGroup; livingCity: string }>({ name: "", mobileNumber: "", bloodGroup: "O+", livingCity: "" });
  const [emergencyForm, setEmergencyForm] = useState({ group: "O+", units: "2", hospital: "St. Mary’s Medical Centre", note: "" });
  const broadcastMutation = trpc.hospital.broadcast.useMutation();
  const profileMutation = trpc.profile.update.useMutation();
  const { user, isAuthenticated, loading: authLoading, logout, refresh } = useAuth();

  useEffect(() => {
    const handleOpenAuthModal = (e: CustomEvent<{ tab?: "login" | "register" }>) => {
      setAuthModalTab(e.detail?.tab || "register");
      setAuthModalOpen(true);
      setAccountOpen(false);
    };
    window.addEventListener("open-auth-modal" as any, handleOpenAuthModal);
    return () => window.removeEventListener("open-auth-modal" as any, handleOpenAuthModal);
  }, []);

  // Guard: if unauthenticated user presses Back, block the dashboard from showing.
  useEffect(() => {
    const handlePopState = () => {
      if (!isAuthenticated && !guestMode) {
        window.history.replaceState({ loggedOut: true }, "", window.location.pathname);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAuthenticated, guestMode]);

  const openLogin = () => {
    setAuthModalTab("login");
    setAuthModalOpen(true);
    setAccountOpen(false);
  };

  const openRegister = () => {
    setAuthModalTab("register");
    setAuthModalOpen(true);
    setAccountOpen(false);
  };

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || "", mobileNumber: user.mobileNumber || "", bloodGroup: (user.bloodGroup as BloodGroup) || "O+", livingCity: user.livingCity || "" });
    if (isAuthenticated && (!user.mobileNumber || !user.bloodGroup || !user.livingCity)) setProfileOpen(true);
  }, [user, isAuthenticated]);

  const filteredDonors = useMemo(() => {
    if (!searchTerm.trim()) return donors;
    const term = searchTerm.toLowerCase();
    return donors.filter((donor) => donor.name.toLowerCase().includes(term) || donor.group.toLowerCase().includes(term) || donor.distance.includes(term));
  }, [searchTerm]);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3400);
  };

  const requestDonor = (name: string) => {
    setRequestSent(true);
    notify(`Request sent to ${name}. We'll keep you posted.`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Reset all dashboard state so the user lands on LandingPage after logout.
      // guestMode MUST be cleared: it is the root cause of the back-navigation bug.
      // Without this, !isAuthenticated && !guestMode stays false, keeping dashboard visible.
      setAccountOpen(false);
      setGuestMode(false);
      setActiveView("overview");
      setProfileOpen(false);
      setMobileNav(false);
      notify("You’ve been logged out safely.");
    } catch {
      notify("We couldn’t log you out. Please try again.");
    }
  };

  const displayName = user?.name || "Guest visitor";
  const displayInitials = useMemo(() => {
    if (!user?.name) return "GU";
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user?.name]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    profileMutation.mutate(profileForm, {
      onSuccess: async () => {
        setProfileOpen(false);
        notify("Your LifeLink account details are saved.");
        await refresh();
      },
      onError: () => notify("Please check your details and try again."),
    });
  };

  const enablePushNotifications = async () => {
    if (!("Notification" in window)) {
      notify("This browser does not support push notifications.");
      return;
    }
    const permission = await window.Notification.requestPermission();
    setPushEnabled(permission === "granted");
    notify(permission === "granted" ? "Push notifications are enabled for this hospital workspace." : "Push notifications remain off. You can still use in-app alerts.");
  };

  const broadcastEmergencyRequest = () => {
    broadcastMutation.mutate({ bloodGroup: emergencyForm.group, units: Number(emergencyForm.units), hospital: emergencyForm.hospital, note: emergencyForm.note, radiusKm: 10, pushEnabled }, {
      onSuccess: (result) => {
        setRequestSent(true);
        notify(`${result.requestId} broadcast to ${result.matchedDonors} eligible donors.`);
        setActiveView("map");
      },
      onError: () => notify("We couldn't broadcast this request. Please try again."),
    });
  };

  const pageMeta: Record<View, { eyebrow: string; title: string; description: string }> = {
    overview: { eyebrow: todayFormatted, title: `${greeting}, ${displayName}`, description: "Here’s the latest pulse on your blood network." },
    find: { eyebrow: "Smart matching", title: "Find a donor", description: "AI-ranked matches based on blood group, distance, availability, and eligibility." },
    map: { eyebrow: "Real-time coordination", title: "Live donor map", description: "See urgent blood requests and nearby eligible donors in one view." },
    emergency: { eyebrow: "Priority channel", title: "Create an emergency request", description: "Alert the closest eligible donors and partner hospitals in seconds." },
    inventory: { eyebrow: "Live stock visibility", title: "Blood inventory", description: "A real-time view of available units across your connected network." },
    eligibility: { eyebrow: "Donor health", title: "My eligibility", description: "Your next donation window, guided by safe donation intervals." },
    history: { eyebrow: "Your contribution", title: "Donation history", description: "Every donation, every milestone, and the lives you helped move forward." },
    analytics: { eyebrow: "Network intelligence", title: "Impact analytics", description: "Understand response times, supply health, and the reach of your network." },
  };

  const renderOverview = () => (
    <>
      <section className="hero-strip">
        <div className="hero-strip__copy">
          <div className="hero-kicker"><Sparkles size={14} /> Network health is strong</div>
          <h2>Every match is a moment<br /><em>that matters.</em></h2>
          <p>You've helped coordinate <strong>18 successful donations</strong> this month.</p>
          <button className="button button--light" onClick={() => setActiveView("analytics")}>View your impact <ArrowUpRight size={16} /></button>
        </div>
        <div className="hero-strip__art" aria-hidden="true">
          <div className="pulse-ring pulse-ring--one" /><div className="pulse-ring pulse-ring--two" /><div className="pulse-ring pulse-ring--three" />
          <div className="hero-heart"><HeartPulse size={58} /></div>
          <span className="orbit-dot orbit-dot--one" /><span className="orbit-dot orbit-dot--two" /><span className="orbit-dot orbit-dot--three" />
        </div>
      </section>
      <div className="stats-grid">
        <StatCard label="Lives touched" value="248" detail="Across your network" trend="up" icon={HeartPulse} tone="rose" />
        <StatCard label="Active donors" value="1,284" detail="92 available today" trend="up" icon={UsersRound} tone="blue" />
        <StatCard label="Open requests" value="06" detail="2 need attention" icon={AlertCircle} tone="amber" />
        <StatCard label="Avg. response" value="11m" detail="4m faster this week" trend="up" icon={Zap} tone="green" />
      </div>
      <div className="content-grid content-grid--wide">
        <section className="panel panel--requests">
          <div className="panel-heading"><div><span className="section-eyebrow">Priority queue</span><h3>Requests needing you</h3></div><button className="text-button" onClick={() => setActiveView("emergency")}>See all <ChevronRight size={15} /></button></div>
          <div className="request-card request-card--critical">
            <div className="request-card__top"><span className="urgent-badge"><span className="urgent-dot" /> Critical</span><span className="request-time">8 min ago</span></div>
            <div className="request-card__body"><div className="request-blood">O<sup>+</sup></div><div><strong>2 units of O+ blood needed</strong><p>St. Mary’s Medical Centre · Emergency ward</p></div><button className="icon-button icon-button--dark" onClick={() => setActiveView("emergency")}><ChevronRight size={17} /></button></div>
            <div className="request-card__foot"><span><Clock3 size={13} /> Needed within 2 hours</span><span><UsersRound size={13} /> 4 matches found</span></div>
          </div>
          <div className="request-card">
            <div className="request-card__top"><span className="status-badge status-badge--blue">Looking for matches</span><span className="request-time">42 min ago</span></div>
            <div className="request-card__body"><div className="request-blood request-blood--blue">A<sup>−</sup></div><div><strong>1 unit of A− blood needed</strong><p>CityCare Hospital · Surgery ward</p></div><button className="icon-button icon-button--soft" onClick={() => setActiveView("find")}><ChevronRight size={17} /></button></div>
            <div className="request-card__foot"><span><Clock3 size={13} /> Needed within 8 hours</span><span><UsersRound size={13} /> 2 matches found</span></div>
          </div>
        </section>
        <section className="panel panel--supply">
          <div className="panel-heading"><div><span className="section-eyebrow">Connected hospitals</span><h3>Blood supply</h3></div><button className="icon-button icon-button--soft" onClick={() => setActiveView("inventory")}><MoreHorizontal size={17} /></button></div>
          <div className="supply-summary"><div><strong>110</strong><span>total units</span></div><div className="supply-summary__trend"><TrendingUp size={15} /> 8.4% <small>this week</small></div></div>
          <div className="supply-list">{inventory.slice(0, 4).map((item) => <SupplyBar key={item.group} {...item} />)}</div>
        </section>
      </div>
      <section className="panel panel--matching">
        <div className="panel-heading"><div><span className="section-eyebrow">AI recommendation engine</span><h3>Top donor matches</h3></div><button className="text-button" onClick={() => setActiveView("find")}>Open matching <ChevronRight size={15} /></button></div>
        <div className="donor-list">{donors.map((donor) => <DonorRow key={donor.name} donor={donor} compact onRequest={requestDonor} />)}</div>
      </section>
    </>
  );

  const renderFind = () => (
    <>
      <section className="search-hero"><div className="search-hero__content"><div className="hero-kicker hero-kicker--dark"><Target size={14} /> Matches ranked for you</div><h2>Find the right donor,<br /><em>right when you need them.</em></h2><p>We found 12 eligible donors within 10 km of St. Mary’s Medical Centre.</p></div><div className="matching-visual"><div className="matching-visual__scan" /><div className="matching-visual__core"><HeartPulse size={28} /></div><span className="scan-label scan-label--top">Blood group</span><span className="scan-label scan-label--right">Distance</span><span className="scan-label scan-label--left">Eligibility</span></div></section>
      <div className="toolbar"><div className="search-field"><Search size={17} /><input aria-label="Search donors" placeholder="Search by name, blood group, or distance" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /><kbd>⌘ K</kbd></div><button className="filter-button"><ListFilter size={16} /> Filters <span>3</span></button></div>
      <section className="panel"><div className="panel-heading"><div><span className="section-eyebrow">Sorted by match score</span><h3>{filteredDonors.length} recommended donors</h3></div><button className="sort-button">Best match <ChevronDown size={15} /></button></div><div className="donor-list donor-list--expanded">{filteredDonors.length ? filteredDonors.map((donor) => <DonorRow key={donor.name} donor={donor} onRequest={requestDonor} />) : <EmptyHint title="No donors found" description="Try a different name, group, or distance." icon={Search} />}</div></section>
      {requestSent && <div className="inline-success"><Check size={16} /> The donor request is active. We’ll notify you when they respond.</div>}
    </>
  );

  const renderMap = () => (
    <LiveDonorMap
      onCreateRequest={() => setActiveView("emergency")}
      onViewDonorList={() => setActiveView("find")}
    />
  );

  const renderEmergency = () => (
    <div className="emergency-layout"><section className="panel form-panel"><div className="panel-heading"><div><span className="section-eyebrow section-eyebrow--red">Hospital broadcast</span><h3>Tell us what’s needed</h3></div><span className="secure-note"><ShieldCheck size={14} /> Secure</span></div><div className="form-grid"><label>Blood group<select value={emergencyForm.group} onChange={(e) => setEmergencyForm({ ...emergencyForm, group: e.target.value })}><option>O+</option><option>A+</option><option>B+</option><option>AB−</option><option>O−</option></select></label><label>Units needed<select value={emergencyForm.units} onChange={(e) => setEmergencyForm({ ...emergencyForm, units: e.target.value })}><option>1</option><option>2</option><option>3</option><option>4</option></select></label><label className="form-span">Hospital / care centre<select value={emergencyForm.hospital} onChange={(e) => setEmergencyForm({ ...emergencyForm, hospital: e.target.value })}><option>St. Mary’s Medical Centre</option><option>CityCare Hospital</option><option>Northside General Hospital</option></select></label><label className="form-span">Additional note <textarea placeholder="Add ward, patient, or timing details (optional)" value={emergencyForm.note} onChange={(e) => setEmergencyForm({ ...emergencyForm, note: e.target.value })} /></label></div><div className="broadcast-options"><div><div className="broadcast-options__icon"><Bell size={16} /></div><div><strong>Push notifications</strong><p>Notify eligible donors within 10 km as soon as this request is broadcast.</p></div></div><button className={cn("toggle", pushEnabled && "on")} onClick={() => pushEnabled ? setPushEnabled(false) : enablePushNotifications()} aria-label="Toggle push notifications"><span /></button></div><div className="form-actions"><button className="button button--ghost" onClick={() => setActiveView("overview")}>Cancel</button><button className="button button--danger" onClick={broadcastEmergencyRequest} disabled={broadcastMutation.isPending}><Send size={16} /> {broadcastMutation.isPending ? "Broadcasting…" : "Broadcast urgent request"}</button></div></section><aside className="emergency-aside"><div className="emergency-aside__pulse"><div className="pulse-icon"><AlertCircle size={23} /></div><div><strong>Fast lane enabled</strong><p>Your request will be prioritised and sent to eligible donors within 10 km.</p></div></div><div className="panel mini-panel"><span className="section-eyebrow">Broadcast flow</span><div className="step-list"><div className="step done"><span><Check size={14} /></span><div><strong>Request is verified</strong><small>Usually under 30 seconds</small></div></div><div className="step active"><span>2</span><div><strong>Donors are notified</strong><small>{pushEnabled ? "Push + in-app alerts enabled" : "In-app alerts enabled"}</small></div></div><div className="step"><span>3</span><div><strong>Live map is updated</strong><small>Track responses near the hospital</small></div></div></div></div><div className="trust-card"><ShieldCheck size={18} /><div><strong>Designed for safe coordination</strong><p>LifeLink never replaces clinical guidance. Always confirm requirements with the care team.</p></div></div></aside></div>
  );

  const renderInventory = () => (
    <><div className="inventory-callout"><div><div className="hero-kicker hero-kicker--dark"><Activity size={14} /> Live network status</div><h2>Enough for today.<br /><em>Ready for tomorrow.</em></h2><p>110 total units across 4 connected hospitals. O− and AB− need attention.</p></div><div className="inventory-dial"><span>76%</span><small>network health</small></div></div><section className="panel"><div className="panel-heading"><div><span className="section-eyebrow">By blood group</span><h3>Current stock levels</h3></div><button className="filter-button"><MapPin size={15} /> All hospitals <ChevronDown size={15} /></button></div><div className="inventory-grid">{inventory.map((item) => <div className="inventory-card" key={item.group}><div className="inventory-card__head"><span className="big-group">{item.group}</span><span className={cn("supply-status", item.tone)}>{item.level}</span></div><strong>{item.units} <small>units</small></strong><div className="supply-track"><span className={cn("supply-fill", item.tone)} style={{ width: `${Math.max((item.units / item.capacity) * 100, 14)}%` }} /></div><div className="supply-row__foot"><span>Updated 4m ago</span><span>{item.capacity} max</span></div></div>)}</div></section></>
  );

  const renderEligibility = () => (
    <div className="eligibility-layout"><section className="eligibility-card"><div className="eligibility-card__top"><div><span className="section-eyebrow">Your donor status</span><h2>Eligible to donate</h2><p>Your body has had enough time to recover since your last donation.</p></div><div className="eligibility-ring"><svg viewBox="0 0 120 120"><circle className="ring-bg" cx="60" cy="60" r="50" /><circle className="ring-value" cx="60" cy="60" r="50" /></svg><span>100%</span></div></div><div className="eligibility-date"><CalendarDays size={17} /><div><span>Next recommended donation</span><strong>Today · 11 Sep 2026</strong></div><button className="button button--dark" onClick={() => setActiveView("history")}>See history</button></div></section><section className="panel"><div className="panel-heading"><div><span className="section-eyebrow">Safety checklist</span><h3>Before you donate</h3></div><CircleHelp size={18} className="muted-icon" /></div><div className="check-list"><div><span className="check-list__icon"><Check size={15} /></span><div><strong>More than 56 days since last donation</strong><small>Last donation: 19 June 2026</small></div></div><div><span className="check-list__icon"><Check size={15} /></span><div><strong>Keep hydrated and well rested</strong><small>Have a light meal before you donate</small></div></div><div><span className="check-list__icon"><Check size={15} /></span><div><strong>Bring a valid photo ID</strong><small>Hospital staff will confirm details on arrival</small></div></div></div></section></div>
  );

  const renderHistory = () => (
    <div className="history-layout"><section className="panel impact-panel"><div className="impact-number">18</div><span className="section-eyebrow">Total donations</span><h3>That’s a lot of good.</h3><p>At an average of 3 lives supported per donation, your generosity may have touched <strong>54 lives</strong>.</p><div className="impact-line"><span /><span /><span /><span /><span /><span /></div><div className="impact-line-label"><span>2025</span><span>2026</span></div></section><section className="panel"><div className="panel-heading"><div><span className="section-eyebrow">Recent activity</span><h3>Donation history</h3></div><button className="text-button">Export <ArrowUpRight size={14} /></button></div><div className="timeline"><div className="timeline-item"><span className="timeline-dot" /><div><strong>Whole blood donation</strong><p>St. Mary’s Medical Centre · O+</p></div><time>19 Jun 2026</time></div><div className="timeline-item"><span className="timeline-dot" /><div><strong>Whole blood donation</strong><p>CityCare Hospital · O+</p></div><time>03 Apr 2026</time></div><div className="timeline-item"><span className="timeline-dot" /><div><strong>Whole blood donation</strong><p>St. Mary’s Medical Centre · O+</p></div><time>12 Jan 2026</time></div><div className="timeline-item timeline-item--milestone"><span className="timeline-dot"><Sparkles size={12} /></span><div><strong>Milestone reached: 15 donations</strong><p>You earned the “Steady heartbeat” badge</p></div><time>12 Jan 2026</time></div></div></section></div>
  );

  const renderAnalytics = () => (
    <><div className="analytics-summary"><div><span className="section-eyebrow">Your network impact</span><h2>Good work compounds.</h2><p>Small actions across the network add up to faster, safer care.</p></div><div className="analytics-total"><strong>248</strong><span>lives touched</span><small>↑ 18% vs last month</small></div></div><div className="analytics-grid"><section className="panel"><div className="panel-heading"><div><span className="section-eyebrow">Last 30 days</span><h3>Request response time</h3></div><span className="chart-badge"><TrendingUp size={13} /> 4m faster</span></div><div className="bar-chart">{[42, 64, 52, 74, 68, 88, 79, 94, 82, 100, 91, 96].map((height, i) => <span key={i} style={{ height: `${height}%` }} className={i > 8 ? "active" : ""} />)}</div><div className="chart-axis"><span>Aug 14</span><span>Sep 11</span></div></section><section className="panel insight-panel"><span className="section-eyebrow">AI insight</span><div className="insight-icon"><Sparkles size={18} /></div><h3>Keep your O+ community warm</h3><p>O+ requests are rising 14% week-over-week in your area. A reminder campaign to recently eligible donors could reduce response time by up to 8 minutes.</p><button className="text-button" onClick={() => notify("Reminder campaign drafted for review.")}>Draft a campaign <ArrowUpRight size={15} /></button></section></div><div className="achievement-row"><div className="achievement-card"><div className="achievement-icon achievement-icon--gold">♛</div><div><strong>Steady heartbeat</strong><p>15 donations completed</p></div><Check size={16} className="achievement-check" /></div><div className="achievement-card"><div className="achievement-icon achievement-icon--blue"><UsersRound size={19} /></div><div><strong>Community anchor</strong><p>10 successful matches</p></div><Check size={16} className="achievement-check" /></div><div className="achievement-card achievement-card--locked"><div className="achievement-icon"><ShieldCheck size={19} /></div><div><strong>Rapid responder</strong><p>2 more emergency responses</p></div><ArrowUpRight size={16} className="muted-icon" /></div></div></>
  );

  const renderHospitalAccessGate = () => {
    if (authLoading) return <section className="auth-gate"><div className="auth-gate__icon"><ShieldCheck size={22} /></div><span className="section-eyebrow">Checking access</span><h2>Verifying your hospital workspace</h2><p>We’re checking your secure session before opening emergency broadcasting.</p></section>;
    return <section className="auth-gate"><div className="auth-gate__icon"><ShieldCheck size={22} /></div><span className="section-eyebrow section-eyebrow--red">Hospital access only</span><h2>Sign in to broadcast an emergency request</h2><p>Only authenticated hospital workspace members can alert eligible donors and partner hospitals.</p><div className="auth-gate__actions"><button className="button button--dark" onClick={openLogin}><ArrowUpRight size={16} /> Log in</button><button className="button button--ghost" onClick={openRegister}><Plus size={16} /> Create an account</button></div></section>;
  };

  const renderContent = () => {
    if (activeView === "find") return renderFind();
    if (activeView === "map") return renderMap();
    if (activeView === "emergency") return isAuthenticated ? renderEmergency() : renderHospitalAccessGate();
    if (activeView === "inventory") return renderInventory();
    if (activeView === "eligibility") return renderEligibility();
    if (activeView === "history") return renderHistory();
    if (activeView === "analytics") return renderAnalytics();
    return renderOverview();
  };

  if (!isAuthenticated && !guestMode) {
    return (
      <LandingPage
        onLoginSuccess={(msg: string) => {
          notify(msg);
          setGuestMode(true);
        }}
        onExploreGuest={() => setGuestMode(true)}
      />
    );
  }

  return (
    <div className="app-shell">
      {notice && <div className="toast-note"><span><Check size={15} /></span>{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(msg: string) => notify(msg)}
      />
      {profileOpen && isAuthenticated && <div className="profile-modal-backdrop"><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><div className="profile-modal__head"><div><span className="section-eyebrow">Account setup</span><h2 id="profile-title">Tell us a little about you</h2><p>These details help LifeLink match you with nearby blood requests safely.</p></div><button className="icon-button icon-button--soft" onClick={() => setProfileOpen(false)} aria-label="Close profile setup"><X size={17} /></button></div><form onSubmit={saveProfile} className="profile-form"><label>Full name<input required minLength={2} maxLength={120} value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} placeholder="e.g. Kavya Deshmukh" /></label><label>Mobile number<input required type="tel" pattern="\+?[0-9 ()-]{8,20}" value={profileForm.mobileNumber} onChange={(event) => setProfileForm({ ...profileForm, mobileNumber: event.target.value })} placeholder="e.g. +91 98765 43210" /></label><label>Blood group<select required value={profileForm.bloodGroup} onChange={(event) => setProfileForm({ ...profileForm, bloodGroup: event.target.value as BloodGroup })}><option value="A+">A+</option><option value="A−">A−</option><option value="B+">B+</option><option value="B−">B−</option><option value="AB+">AB+</option><option value="AB−">AB−</option><option value="O+">O+</option><option value="O−">O−</option></select></label><label>Living city<input required minLength={2} maxLength={120} value={profileForm.livingCity} onChange={(event) => setProfileForm({ ...profileForm, livingCity: event.target.value })} placeholder="e.g. Hyderabad" /></label><div className="profile-form__actions"><button type="button" className="button button--ghost" onClick={() => setProfileOpen(false)}>Complete later</button><button type="submit" className="button button--dark" disabled={profileMutation.isPending}>{profileMutation.isPending ? "Saving…" : "Save account details"} <Check size={15} /></button></div></form></section></div>}
      <aside className={cn("sidebar", mobileNav && "sidebar--open")}>
        <div className="brand"><BloodMark /><span>LifeLink <b>AI</b></span><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
        <div className="workspace-switcher"><div className="workspace-avatar">SM</div><div><strong>St. Mary’s Network</strong><small>Healthcare team</small></div><ChevronDown size={15} /></div>
        <div className="sidebar-label">Main menu</div>
        <nav>{navSections.map((section) => <div className="nav-section" key={section.label}><div className="nav-section__label">{section.label}</div>{section.items.map(({ id, label, icon: Icon, count, urgent }) => <button key={id} className={cn("nav-item", activeView === id && "active", urgent && "urgent")} onClick={() => { setActiveView(id); setMobileNav(false); }}><Icon size={17} /><span>{label}</span>{count && <small>{count}</small>}{urgent && <span className="nav-pulse" />}</button>)}</div>)}</nav>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-card__icon"><CircleHelp size={16} /></div><div><strong>Need a hand?</strong><p>Our support team is here.</p></div><ChevronRight size={14} /></div><button className="nav-item"><Settings2 size={17} /><span>Settings</span></button><div className="profile-mini"><div className="avatar avatar--profile">{displayInitials}</div><div><strong>{displayName}</strong><small>{isAuthenticated ? "Network member" : "Guest visitor"}</small></div><MoreHorizontal size={17} /></div></div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}>
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>LifeLink</span>
            <ChevronRight size={13} />
            <strong>{activeView === "overview" ? "Overview" : pageMeta[activeView].title}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="topbar-action"
              aria-label="Toggle theme"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="topbar-action" aria-label="Search" onClick={() => setActiveView("find")}>
              <Search size={18} />
            </button>
            <button className="topbar-action topbar-action--notification" aria-label="Notifications" onClick={() => notify("You're all caught up.")}>
              <Bell size={18} />
              <span />
            </button>
            <div className="account-menu-wrap">
              <button className="topbar-profile" onClick={() => setAccountOpen((open) => !open)} aria-label="Account menu" aria-expanded={accountOpen}>
                <div className="avatar avatar--profile">{authLoading ? "…" : displayInitials}</div>
                <ChevronDown size={14} />
              </button>
              {accountOpen && (
                <div className="account-menu">
                  <div className="account-menu__identity">
                    <div className="avatar avatar--profile">{displayInitials}</div>
                    <div>
                      <strong>{displayName}</strong>
                      <small>{isAuthenticated ? (user?.email || "Signed in") : "Not signed in"}</small>
                    </div>
                  </div>
                  <div className="account-menu__divider" />
                  {isAuthenticated ? (
                    <>
                      <button onClick={() => { setProfileOpen(true); setAccountOpen(false); }}>
                        <UserRound size={15} /> Account details
                      </button>
                      <button onClick={handleLogout} className="account-menu__danger">
                        <ArrowDownRight size={15} /> Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setGuestMode(false)}>
                        <ArrowUpRight size={15} /> Back to Sign In
                      </button>
                      <button onClick={openRegister} className="account-menu__primary">
                        <Plus size={15} /> Create an account
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="page-content"><div className="page-header"><div><span className="page-eyebrow">{pageMeta[activeView].eyebrow}</span><h1>{pageMeta[activeView].title}</h1><p>{pageMeta[activeView].description}</p></div>{activeView === "overview" && <button className="button button--dark" onClick={() => setActiveView("emergency")}><Plus size={16} /> New request</button>}{activeView === "find" && <button className="button button--dark" onClick={() => setActiveView("emergency")}><Zap size={16} /> Emergency request</button>}</div>{renderContent()}</div>
      </main>
    </div>
  );
}
