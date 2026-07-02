import { useState, useCallback } from "react";
import {
  LayoutDashboard, Key, Download, RefreshCw, Repeat, Cloud,
  Users, ShoppingCart, Shield, BarChart2, Settings, Lock,
  ChevronLeft, ChevronRight, Bell, HelpCircle, Search,
  Copy, CheckCircle, AlertCircle, XCircle, PauseCircle,
  TrendingUp, TrendingDown, Calendar,
  MoreVertical, Filter, Download as DownloadIcon, Trash2,
  Activity, CreditCard, Package, RotateCcw, Check,
  MonitorSmartphone, Server, Laptop, ChevronDown, Layers,
  DollarSign, UserPlus, MousePointerClick, Mail, ArrowUpRight,
  MapPin, Globe, Phone, ExternalLink, Star, Clock, Zap, Eye,
  FileText, Hash, ShieldCheck, Ban, Send, Edit3, Tag,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── M3 Color Tokens ──────────────────────────────────────────────────────────
const M3 = {
  primary: "#6750A4",
  onPrimary: "#FFFFFF",
  primaryContainer: "#EADDFF",
  onPrimaryContainer: "#21005D",
  secondary: "#625B71",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#E8DEF8",
  onSecondaryContainer: "#1D192B",
  surface: "#FFFBFE",
  surfaceContainerLow: "#F7F2FA",
  surfaceContainer: "#F3EDF7",
  surfaceContainerHigh: "#ECE6F0",
  onSurface: "#1C1B1F",
  onSurfaceVariant: "#49454F",
  outline: "#79747E",
  outlineVariant: "#CAC4D0",
  error: "#B3261E",
  success: "#386A20",
  successContainer: "#C2E7A0",
  warning: "#7A5900",
  warningContainer: "#FFDEA5",
  info: "#00629D",
  infoContainer: "#C8E6FF",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type Page =
  | "overview" | "licenses" | "license-summary" | "license-detail" | "customer-detail" | "subscriptions"
  | "analytics" | "analytics-subscriptions" | "analytics-affiliates" | "analytics-abandoned-cart"
  | "settings" | "downloads" | "updates" | "saas" | "saas-detail" | "affiliates" | "affiliate-detail" | "abandoned-cart" | "security";

interface Module {
  name: string;
  desc: string;
  phase: string;
  enabled: boolean;
  navId: Page | null;
}

// ─── Module → Nav mapping ──────────────────────────────────────────────────────
const INITIAL_MODULES: Module[] = [
  { name: "Secure Downloads",   desc: "Protect download links with expiring tokens",      phase: "Phase 1", enabled: true,  navId: "downloads" },
  { name: "License Manager",    desc: "Issue and validate software licenses",              phase: "Phase 1", enabled: true,  navId: "licenses" },
  { name: "Update Manager",     desc: "Serve plugin/theme update packages",               phase: "Phase 1", enabled: true,  navId: "updates" },
  { name: "Subscriptions",      desc: "Recurring billing and subscription management",     phase: "Phase 1", enabled: true,  navId: "subscriptions" },
  { name: "SaaS Provisioning",  desc: "Automated account and seat management",            phase: "Phase 2", enabled: true,  navId: "saas" },
  { name: "Affiliate Program",  desc: "Track referrals and manage commissions",           phase: "Phase 2", enabled: true,  navId: "affiliates" },
  { name: "Abandoned Cart",     desc: "Recover lost sales with automated emails",         phase: "Phase 2", enabled: true,  navId: "abandoned-cart" },
  { name: "Analytics",          desc: "Advanced reporting and revenue dashboards",        phase: "Phase 1", enabled: true,  navId: "analytics" },
  { name: "Security Suite",     desc: "Fraud detection and IP blocking",                  phase: "Phase 3", enabled: true,  navId: "security" },
];

// ─── Nav items definition ──────────────────────────────────────────────────────
const NAV_SCHEMA: Array<{ id: Page; icon: React.ElementType; label: string; moduleKey: string | null; dividerBefore?: boolean }> = [
  { id: "overview",       icon: LayoutDashboard, label: "Overview",       moduleKey: null },
  { id: "licenses",       icon: Key,             label: "Licenses",       moduleKey: "License Manager" },
  { id: "downloads",      icon: Download,        label: "Downloads",      moduleKey: "Secure Downloads" },
  { id: "updates",        icon: RefreshCw,       label: "Updates",        moduleKey: "Update Manager" },
  { id: "subscriptions",  icon: Repeat,          label: "Subscriptions",  moduleKey: "Subscriptions" },
  { id: "saas",           icon: Cloud,           label: "SaaS Accounts",  moduleKey: "SaaS Provisioning" },
  { id: "affiliates",     icon: Users,           label: "Affiliates",     moduleKey: "Affiliate Program" },
  { id: "abandoned-cart", icon: ShoppingCart,    label: "Abandoned Cart", moduleKey: "Abandoned Cart" },
  { id: "security",       icon: Shield,          label: "Security",       moduleKey: "Security Suite" },
  { id: "analytics",      icon: BarChart2,       label: "Analytics",      moduleKey: "Analytics" },
  { id: "settings",       icon: Settings,        label: "Settings",       moduleKey: null, dividerBefore: true },
];

// ─── Sample Data ───────────────────────────────────────────────────────────────
const mrrData = [
  { month: "Jul", mrr: 18400, arr: 220800 },
  { month: "Aug", mrr: 21200, arr: 254400 },
  { month: "Sep", mrr: 23800, arr: 285600 },
  { month: "Oct", mrr: 22100, arr: 265200 },
  { month: "Nov", mrr: 26500, arr: 318000 },
  { month: "Dec", mrr: 30200, arr: 362400 },
  { month: "Jan", mrr: 28900, arr: 346800 },
  { month: "Feb", mrr: 32400, arr: 388800 },
  { month: "Mar", mrr: 35100, arr: 421200 },
  { month: "Apr", mrr: 37800, arr: 453600 },
  { month: "May", mrr: 41200, arr: 494400 },
  { month: "Jun", mrr: 44600, arr: 535200 },
];

const licenseStatusData = [
  { name: "Active",    value: 8432, color: M3.success },
  { name: "Expired",   value: 1241, color: M3.error },
  { name: "Suspended", value: 312,  color: M3.warning },
  { name: "Revoked",   value: 89,   color: M3.onSurfaceVariant },
];

const recentLicenses = [
  { key: "WDD-A1B2-C3D4-E5F6", product: "Plugin Pro",   customer: "Sarah Johnson",    status: "active",    date: "2h ago" },
  { key: "WDD-B2C3-D4E5-F6G7", product: "Theme Bundle", customer: "Marcus Chen",      status: "active",    date: "4h ago" },
  { key: "WDD-C3D4-E5F6-G7H8", product: "SaaS Starter", customer: "Emily Davis",      status: "expired",   date: "6h ago" },
  { key: "WDD-D4E5-F6G7-H8I9", product: "Plugin Pro",   customer: "James Wilson",     status: "active",    date: "8h ago" },
  { key: "WDD-E5F6-G7H8-I9J0", product: "Theme Bundle", customer: "Olivia Martinez",  status: "suspended", date: "12h ago" },
];

const recentDownloads = [
  { country: "🇺🇸", ip: "192.168.1.1",  product: "Plugin Pro v2.4.1",       time: "3m ago" },
  { country: "🇩🇪", ip: "10.0.0.52",    product: "Theme Bundle v1.8.0",     time: "7m ago" },
  { country: "🇬🇧", ip: "172.16.0.8",   product: "Plugin Pro v2.4.1",       time: "12m ago" },
  { country: "🇨🇦", ip: "192.168.2.45", product: "SaaS Connector v3.1.0",   time: "18m ago" },
  { country: "🇦🇺", ip: "10.20.30.40",  product: "Plugin Pro v2.4.1",       time: "25m ago" },
];

const expiringLicenses = [
  { key: "WDD-X1Y2-Z3A4-B5C6", customer: "Tom Baker",   product: "Plugin Pro",   expiresIn: "2 days" },
  { key: "WDD-Y2Z3-A4B5-C6D7", customer: "Nina Patel",  product: "Theme Bundle", expiresIn: "5 days" },
  { key: "WDD-Z3A4-B5C6-D7E8", customer: "David Kim",   product: "Plugin Pro",   expiresIn: "7 days" },
  { key: "WDD-A4B5-C6D7-E8F9", customer: "Lisa Wang",   product: "SaaS Starter", expiresIn: "9 days" },
];

const licensesTableData = [
  { id: 1, key: "WDD-A1B2-C3D4-E5F6", customer: "Sarah Johnson",   email: "sarah@example.com",  product: "Plugin Pro",   plan: "Annual",   sites: "1/1", status: "active",    expires: "2025-06-15" },
  { id: 2, key: "WDD-B2C3-D4E5-F6G7", customer: "Marcus Chen",     email: "marcus@example.com", product: "Theme Bundle", plan: "Lifetime", sites: "3/5", status: "active",    expires: "Lifetime" },
  { id: 3, key: "WDD-C3D4-E5F6-G7H8", customer: "Emily Davis",     email: "emily@example.com",  product: "SaaS Starter", plan: "Monthly",  sites: "1/1", status: "expired",   expires: "2024-12-01" },
  { id: 4, key: "WDD-D4E5-F6G7-H8I9", customer: "James Wilson",    email: "james@example.com",  product: "Plugin Pro",   plan: "Annual",   sites: "2/3", status: "active",    expires: "2025-08-20" },
  { id: 5, key: "WDD-E5F6-G7H8-I9J0", customer: "Olivia Martinez", email: "olivia@example.com", product: "Theme Bundle", plan: "Annual",   sites: "0/5", status: "suspended", expires: "2025-03-10" },
  { id: 6, key: "WDD-F6G7-H8I9-J0K1", customer: "Noah Thompson",   email: "noah@example.com",   product: "Plugin Pro",   plan: "Monthly",  sites: "1/1", status: "active",    expires: "2025-01-30" },
  { id: 7, key: "WDD-G7H8-I9J0-K1L2", customer: "Ava Garcia",      email: "ava@example.com",    product: "SaaS Pro",     plan: "Annual",   sites: "5/10",status: "active",    expires: "2025-11-14" },
  { id: 8, key: "WDD-H8I9-J0K1-L2M3", customer: "Liam Anderson",   email: "liam@example.com",   product: "Plugin Pro",   plan: "Lifetime", sites: "1/1", status: "revoked",   expires: "N/A" },
];

const subscriptionsData = [
  { id: "SUB-001", customer: "Sarah Johnson",   product: "Plugin Pro",   amount: "$99/yr",  cycle: "Annual",  status: "active",    nextPayment: "2025-06-15" },
  { id: "SUB-002", customer: "Marcus Chen",     product: "Theme Bundle", amount: "$29/mo",  cycle: "Monthly", status: "paused",    nextPayment: "—" },
  { id: "SUB-003", customer: "Emily Davis",     product: "SaaS Starter", amount: "$49/mo",  cycle: "Monthly", status: "past-due",  nextPayment: "2025-01-08" },
  { id: "SUB-004", customer: "James Wilson",    product: "Plugin Pro",   amount: "$99/yr",  cycle: "Annual",  status: "active",    nextPayment: "2025-08-20" },
  { id: "SUB-005", customer: "Olivia Martinez", product: "Theme Bundle", amount: "$99/yr",  cycle: "Annual",  status: "cancelled", nextPayment: "—" },
  { id: "SUB-006", customer: "Noah Thompson",   product: "Plugin Pro",   amount: "$9/mo",   cycle: "Monthly", status: "active",    nextPayment: "2025-01-30" },
  { id: "SUB-007", customer: "Ava Garcia",      product: "SaaS Pro",     amount: "$199/yr", cycle: "Annual",  status: "trialing",  nextPayment: "2025-01-22" },
];

const analyticsBarData = [
  { month: "Jan", active: 6200, expired: 820,  suspended: 210, revoked: 45 },
  { month: "Feb", active: 6800, expired: 790,  suspended: 195, revoked: 52 },
  { month: "Mar", active: 7100, expired: 870,  suspended: 230, revoked: 60 },
  { month: "Apr", active: 7400, expired: 910,  suspended: 248, revoked: 68 },
  { month: "May", active: 7900, expired: 980,  suspended: 275, revoked: 74 },
  { month: "Jun", active: 8432, expired: 1241, suspended: 312, revoked: 89 },
];

const topCountries = [
  { flag: "🇺🇸", country: "United States", downloads: 14823, pct: 100 },
  { flag: "🇩🇪", country: "Germany",       downloads: 7214,  pct: 49 },
  { flag: "🇬🇧", country: "United Kingdom",downloads: 6891,  pct: 46 },
  { flag: "🇨🇦", country: "Canada",        downloads: 5432,  pct: 37 },
  { flag: "🇦🇺", country: "Australia",     downloads: 4876,  pct: 33 },
  { flag: "🇫🇷", country: "France",        downloads: 4201,  pct: 28 },
  { flag: "🇳🇱", country: "Netherlands",   downloads: 3812,  pct: 26 },
  { flag: "🇸🇪", country: "Sweden",        downloads: 2941,  pct: 20 },
];

const versionData = [
  { name: "v2.4.x", value: 38, color: M3.primary },
  { name: "v2.3.x", value: 27, color: M3.secondary },
  { name: "v2.2.x", value: 18, color: M3.info },
  { name: "v2.1.x", value: 10, color: M3.warning },
  { name: "older",  value: 7,  color: M3.outlineVariant },
];

const activationData = [
  { domain: "example.com",         env: "production", ip: "93.184.216.34", activatedAt: "2024-06-15 09:23", id: 1 },
  { domain: "staging.example.com", env: "staging",    ip: "93.184.216.35", activatedAt: "2024-06-14 14:11", id: 2 },
  { domain: "dev.local",           env: "local",      ip: "127.0.0.1",     activatedAt: "2024-06-10 08:00", id: 3 },
];

const eventLog = [
  { type: "activated", desc: "License activated on example.com",    time: "2024-06-15 09:23", icon: CheckCircle, color: M3.success },
  { type: "renewed",   desc: "License renewed — Annual plan",        time: "2024-06-01 00:00", icon: RefreshCw,   color: M3.info },
  { type: "warning",   desc: "Expiry reminder sent to customer",     time: "2024-05-15 08:00", icon: Bell,        color: M3.warning },
  { type: "created",   desc: "License issued after purchase #1234",  time: "2023-06-01 10:42", icon: Key,         color: M3.primary },
];

// ─── Customer Data ─────────────────────────────────────────────────────────────
interface CustomerLicense {
  id: number; key: string; product: string; plan: string;
  sites: string; status: string; expires: string; created: string;
}
interface CustomerSubscription {
  id: string; product: string; amount: string; cycle: string;
  status: string; started: string; nextPayment: string;
}
interface CustomerDownload {
  product: string; version: string; ip: string; country: string;
  flag: string; date: string; size: string;
}
interface CustomerEvent {
  type: string; desc: string; time: string;
  icon: React.ElementType; color: string; meta?: string;
}

const CUSTOMER_SARAH = {
  id: "CUST-001",
  name: "Sarah Johnson",
  email: "sarah@example.com",
  phone: "+1 (415) 555-0182",
  location: "San Francisco, CA, US",
  flag: "🇺🇸",
  website: "example.com",
  joinDate: "Jun 3, 2022",
  lastActive: "2h ago",
  avatar: "SJ",
  ltv: "$842",
  totalSpent: "$842.00",
  ordersCount: 9,
  notes: "Enterprise customer — prefers annual billing. Reached out about volume licensing in Dec 2024.",
  tags: ["annual", "enterprise", "plugin-pro"],
  spendHistory: [
    { month: "Jul", spend: 0 },
    { month: "Aug", spend: 0 },
    { month: "Sep", spend: 99 },
    { month: "Oct", spend: 0 },
    { month: "Nov", spend: 0 },
    { month: "Dec", spend: 49 },
    { month: "Jan", spend: 0 },
    { month: "Feb", spend: 99 },
    { month: "Mar", spend: 199 },
    { month: "Apr", spend: 0 },
    { month: "May", spend: 99 },
    { month: "Jun", spend: 297 },
  ],
  licenses: [
    { id: 1, key: "WDD-A1B2-C3D4-E5F6", product: "Plugin Pro",     plan: "Annual",   sites: "1/1",  status: "active",    expires: "2025-06-15", created: "2024-06-15" },
    { id: 2, key: "WDD-P9Q8-R7S6-T5U4", product: "Theme Bundle",   plan: "Lifetime", sites: "2/5",  status: "active",    expires: "Lifetime",   created: "2023-09-01" },
    { id: 3, key: "WDD-V3W2-X1Y0-Z9A8", product: "Plugin Pro",     plan: "Annual",   sites: "0/1",  status: "expired",   expires: "2024-06-14", created: "2023-06-15" },
    { id: 4, key: "WDD-B7C6-D5E4-F3G2", product: "SaaS Connector", plan: "Monthly",  sites: "1/1",  status: "active",    expires: "2025-01-30", created: "2024-12-30" },
  ] as CustomerLicense[],
  subscriptions: [
    { id: "SUB-001", product: "Plugin Pro",     amount: "$99/yr",  cycle: "Annual",  status: "active",    started: "2024-06-15", nextPayment: "2025-06-15" },
    { id: "SUB-009", product: "SaaS Connector", amount: "$29/mo",  cycle: "Monthly", status: "active",    started: "2024-12-30", nextPayment: "2025-01-30" },
    { id: "SUB-003", product: "Plugin Pro",     amount: "$99/yr",  cycle: "Annual",  status: "cancelled", started: "2023-06-15", nextPayment: "—" },
  ] as CustomerSubscription[],
  downloads: [
    { product: "Plugin Pro",     version: "v2.4.1", ip: "93.184.216.34", country: "United States", flag: "🇺🇸", date: "2025-01-12 09:23", size: "1.8 MB" },
    { product: "Plugin Pro",     version: "v2.4.0", ip: "93.184.216.34", country: "United States", flag: "🇺🇸", date: "2025-01-02 14:10", size: "1.8 MB" },
    { product: "Theme Bundle",   version: "v1.8.0", ip: "93.184.216.34", country: "United States", flag: "🇺🇸", date: "2024-12-20 11:05", size: "4.2 MB" },
    { product: "Plugin Pro",     version: "v2.3.2", ip: "93.184.216.34", country: "United States", flag: "🇺🇸", date: "2024-11-15 08:41", size: "1.7 MB" },
    { product: "Theme Bundle",   version: "v1.7.5", ip: "93.184.216.34", country: "United States", flag: "🇺🇸", date: "2024-10-08 16:22", size: "4.1 MB" },
    { product: "Plugin Pro",     version: "v2.3.0", ip: "93.184.216.34", country: "United States", flag: "🇺🇸", date: "2024-09-01 10:00", size: "1.7 MB" },
    { product: "SaaS Connector", version: "v3.1.0", ip: "93.184.216.34", country: "United States", flag: "🇺🇸", date: "2024-12-31 00:05", size: "2.4 MB" },
  ] as CustomerDownload[],
  events: [
    { type: "download",    desc: 'Downloaded Plugin Pro v2.4.1',                 time: "2025-01-12 09:23", icon: Download,      color: M3.info },
    { type: "renewal",     desc: 'Subscription SUB-001 auto-renewed — $99',      time: "2025-01-01 00:00", icon: RefreshCw,     color: M3.success,  meta: "$99.00" },
    { type: "activated",   desc: 'SaaS Connector activated on example.com',      time: "2024-12-31 00:05", icon: CheckCircle,   color: M3.success },
    { type: "purchase",    desc: 'Purchased SaaS Connector Monthly — $29',       time: "2024-12-30 18:42", icon: CreditCard,    color: M3.primary,  meta: "$29.00" },
    { type: "download",    desc: 'Downloaded Theme Bundle v1.8.0',               time: "2024-12-20 11:05", icon: Download,      color: M3.info },
    { type: "email",       desc: 'Expiry reminder sent for WDD-V3W2',            time: "2024-05-15 08:00", icon: Mail,          color: M3.warning },
    { type: "expired",     desc: 'License WDD-V3W2 expired',                     time: "2024-06-14 23:59", icon: XCircle,       color: M3.error },
    { type: "renewal",     desc: 'Subscription renewed — Plugin Pro Annual',     time: "2024-06-15 00:00", icon: RefreshCw,     color: M3.success,  meta: "$99.00" },
    { type: "purchase",    desc: 'Purchased Theme Bundle Lifetime — $199',       time: "2023-09-01 12:14", icon: CreditCard,    color: M3.primary,  meta: "$199.00" },
    { type: "purchase",    desc: 'Purchased Plugin Pro Annual — $99',            time: "2022-06-03 10:42", icon: CreditCard,    color: M3.primary,  meta: "$99.00" },
    { type: "joined",      desc: 'Customer account created',                     time: "2022-06-03 10:38", icon: UserPlus,      color: M3.secondary },
  ] as CustomerEvent[],
};

// ─── Downloads Page Data ───────────────────────────────────────────────────────
const downloadsData = [
  { id: 1,  customer: "Sarah Johnson",   email: "sarah@example.com",   product: "Plugin Pro",     version: "v2.4.1", license: "WDD-A1B2-C3D4", ip: "93.184.216.34",  country: "United States", flag: "🇺🇸", date: "2025-01-12 09:23", size: "1.8 MB", valid: true  },
  { id: 2,  customer: "Marcus Chen",     email: "marcus@example.com",  product: "Theme Bundle",   version: "v1.8.0", license: "WDD-B2C3-D4E5", ip: "45.33.32.156",   country: "Germany",       flag: "🇩🇪", date: "2025-01-12 08:11", size: "4.2 MB", valid: true  },
  { id: 3,  customer: "Emily Davis",     email: "emily@example.com",   product: "Plugin Pro",     version: "v2.3.2", license: "WDD-C3D4-E5F6", ip: "104.21.14.101",  country: "United Kingdom",flag: "🇬🇧", date: "2025-01-11 22:44", size: "1.7 MB", valid: false },
  { id: 4,  customer: "James Wilson",    email: "james@example.com",   product: "Plugin Pro",     version: "v2.4.1", license: "WDD-D4E5-F6G7", ip: "198.41.128.84",  country: "Canada",        flag: "🇨🇦", date: "2025-01-11 17:09", size: "1.8 MB", valid: true  },
  { id: 5,  customer: "Ava Garcia",      email: "ava@example.com",     product: "SaaS Pro",       version: "v3.1.0", license: "WDD-G7H8-I9J0", ip: "185.199.108.1",  country: "Australia",     flag: "🇦🇺", date: "2025-01-11 14:30", size: "2.4 MB", valid: true  },
  { id: 6,  customer: "Noah Thompson",   email: "noah@example.com",    product: "Plugin Pro",     version: "v2.4.0", license: "WDD-F6G7-H8I9", ip: "151.101.65.69",  country: "France",        flag: "🇫🇷", date: "2025-01-11 11:05", size: "1.8 MB", valid: true  },
  { id: 7,  customer: "Olivia Martinez", email: "olivia@example.com",  product: "Theme Bundle",   version: "v1.7.5", license: "WDD-E5F6-G7H8", ip: "23.235.46.133",  country: "Netherlands",   flag: "🇳🇱", date: "2025-01-10 20:18", size: "4.1 MB", valid: false },
  { id: 8,  customer: "Liam Anderson",   email: "liam@example.com",    product: "Plugin Pro",     version: "v2.4.1", license: "WDD-H8I9-J0K1", ip: "103.21.244.0",   country: "Japan",         flag: "🇯🇵", date: "2025-01-10 16:42", size: "1.8 MB", valid: true  },
  { id: 9,  customer: "Sophia Brown",    email: "sophia@example.com",  product: "Security Module",version: "v1.2.3", license: "WDD-I9J0-K1L2", ip: "216.163.128.20", country: "Sweden",        flag: "🇸🇪", date: "2025-01-10 09:55", size: "0.9 MB", valid: true  },
  { id: 10, customer: "Ethan Clark",     email: "ethan@example.com",   product: "Theme Bundle",   version: "v1.8.0", license: "WDD-J0K1-L2M3", ip: "162.158.0.1",    country: "Brazil",        flag: "🇧🇷", date: "2025-01-09 23:01", size: "4.2 MB", valid: true  },
];

// ─── Updates Page Data ─────────────────────────────────────────────────────────
const packagesData = [
  { id: 1, product: "Plugin Pro",      slug: "plugin-pro",      current: "v2.4.1", previous: "v2.4.0", released: "2025-01-08", downloads: 14823, channel: "stable",  status: "live",    changelog: "Performance improvements, security patches, PHP 8.3 compat" },
  { id: 2, product: "Theme Bundle",    slug: "theme-bundle",    current: "v1.8.0", previous: "v1.7.5", released: "2024-12-20", downloads: 9214,  channel: "stable",  status: "live",    changelog: "New block patterns, dark mode improvements, WP 6.7 support" },
  { id: 3, product: "SaaS Connector",  slug: "saas-connector",  current: "v3.1.0", previous: "v3.0.4", released: "2024-12-01", downloads: 6441,  channel: "stable",  status: "live",    changelog: "Webhooks v2 API, improved provisioning speed, bug fixes" },
  { id: 4, product: "Security Module", slug: "security-module", current: "v1.2.4", previous: "v1.2.3", released: "2025-01-10", downloads: 4892,  channel: "beta",    status: "beta",    changelog: "IP reputation feed integration, enhanced 2FA options" },
  { id: 5, product: "Analytics Add-on",slug: "analytics",       current: "v2.1.0", previous: "v2.0.1", released: "—",          downloads: 0,     channel: "draft",   status: "draft",   changelog: "Revenue attribution model, custom date ranges, CSV export v2" },
  { id: 6, product: "Update Manager",  slug: "update-manager",  current: "v1.0.3", previous: "v1.0.2", released: "2024-11-15", downloads: 3109,  channel: "stable",  status: "live",    changelog: "Rollback support, delta updates, Composer integration" },
];

const releaseHistoryData = [
  { product: "Plugin Pro",   version: "v2.4.1", date: "2025-01-08", downloads: 14823, type: "patch" },
  { product: "Plugin Pro",   version: "v2.4.0", date: "2024-11-30", downloads: 8912,  type: "minor" },
  { product: "Theme Bundle", version: "v1.8.0", date: "2024-12-20", downloads: 9214,  type: "minor" },
  { product: "Plugin Pro",   version: "v2.3.2", date: "2024-10-14", downloads: 6234,  type: "patch" },
  { product: "SaaS Connector",version: "v3.1.0",date: "2024-12-01", downloads: 6441,  type: "minor" },
  { product: "Theme Bundle", version: "v1.7.5", date: "2024-09-05", downloads: 4100,  type: "patch" },
];

// ─── SaaS Accounts Page Data ───────────────────────────────────────────────────
const saasAccountsData = [
  { id: "SAAS-001", account: "Acme Corp",          owner: "tom.baker@acme.com",      plan: "Business",    seats: "18/25", mrr: "$299",  status: "active",    created: "2024-03-12", nextBilling: "2025-02-12" },
  { id: "SAAS-002", account: "Startup Hub",        owner: "nina@startuphub.io",      plan: "Starter",     seats: "4/5",   mrr: "$49",   status: "active",    created: "2024-06-01", nextBilling: "2025-02-01" },
  { id: "SAAS-003", account: "DevAgency GmbH",     owner: "ops@devagency.de",        plan: "Enterprise",  seats: "48/50", mrr: "$599",  status: "active",    created: "2023-09-18", nextBilling: "2025-09-18" },
  { id: "SAAS-004", account: "CloudBase Ltd",      owner: "admin@cloudbase.co.uk",   plan: "Business",    seats: "0/25",  mrr: "$299",  status: "suspended", created: "2024-01-07", nextBilling: "—" },
  { id: "SAAS-005", account: "Solo Freelancer",    owner: "alex@freelance.me",       plan: "Starter",     seats: "1/1",   mrr: "$19",   status: "trialing",  created: "2025-01-10", nextBilling: "2025-01-24" },
  { id: "SAAS-006", account: "Pixel Studio",       owner: "hello@pixelstudio.com",   plan: "Starter",     seats: "3/5",   mrr: "$49",   status: "active",    created: "2024-08-22", nextBilling: "2025-02-22" },
  { id: "SAAS-007", account: "Merchant Pro",       owner: "it@merchantpro.com",      plan: "Enterprise",  seats: "23/50", mrr: "$599",  status: "past-due",  created: "2023-12-01", nextBilling: "2025-01-01" },
];

// ─── Affiliates Page Data ──────────────────────────────────────────────────────
const affiliatesData = [
  { id: "AFF-001", name: "WP Beginner",      email: "partners@wpbeginner.com",  code: "WPBEG",    clicks: 5840, conversions: 712, revenue: "$9,600",  commission: "$960",   rate: "10%", status: "active",   joined: "2023-01-15", paid: "$8,640" },
  { id: "AFF-002", name: "Kinsta Blog",      email: "affiliate@kinsta.com",    code: "KINSTA",   clicks: 3210, conversions: 391, revenue: "$5,280",  commission: "$528",   rate: "10%", status: "active",   joined: "2023-03-20", paid: "$5,040" },
  { id: "AFF-003", name: "Code Canyon",      email: "promos@codecanyon.net",   code: "CANYON",   clicks: 2980, conversions: 310, revenue: "$4,184",  commission: "$627",   rate: "15%", status: "active",   joined: "2022-11-08", paid: "$3,762" },
  { id: "AFF-004", name: "WP Lift",          email: "hello@wplift.com",        code: "WPLIFT",   clicks: 2140, conversions: 248, revenue: "$3,353",  commission: "$503",   rate: "15%", status: "active",   joined: "2023-06-01", paid: "$4,024" },
  { id: "AFF-005", name: "ThemeIsle",        email: "partner@themeisle.com",   code: "ISLE",     clicks: 1870, conversions: 215, revenue: "$2,904",  commission: "$290",   rate: "10%", status: "pending",  joined: "2025-01-05", paid: "$0" },
  { id: "AFF-006", name: "WPMU Dev",         email: "affiliates@wpmudev.com",  code: "WPMU",     clicks: 1450, conversions: 178, revenue: "$2,407",  commission: "$361",   rate: "15%", status: "active",   joined: "2023-09-12", paid: "$1,805" },
  { id: "AFF-007", name: "Spam Partner",     email: "bad@spamsite.net",        code: "SPAM1",    clicks: 8900, conversions: 2,   revenue: "$27",     commission: "$3",     rate: "10%", status: "suspended",joined: "2024-12-01", paid: "$0" },
];

// ─── Abandoned Cart Page Data ──────────────────────────────────────────────────
const abandonedCartData = [
  { id: "CART-001", customer: "Peter Harris",    email: "peter@harris.com",   product: "Plugin Pro Annual",     value: "$99",  abandoned: "2025-01-12 14:23", emailsSent: 2, lastEmail: "2h ago",   status: "recovering",  recovered: false },
  { id: "CART-002", customer: "Anna Schmidt",    email: "anna@schmidt.de",    product: "SaaS Pro Annual",       value: "$199", abandoned: "2025-01-12 09:41", emailsSent: 1, lastEmail: "6h ago",   status: "recovering",  recovered: false },
  { id: "CART-003", customer: "Chris Evans",     email: "chris@evans.io",     product: "Theme Bundle",          value: "$59",  abandoned: "2025-01-11 22:15", emailsSent: 3, lastEmail: "12h ago",  status: "recovered",   recovered: true  },
  { id: "CART-004", customer: "Maria Lopez",     email: "maria@lopez.mx",     product: "Plugin Pro Monthly",    value: "$9",   abandoned: "2025-01-11 18:08", emailsSent: 2, lastEmail: "18h ago",  status: "dismissed",   recovered: false },
  { id: "CART-005", customer: "Yuki Tanaka",     email: "yuki@tanaka.jp",     product: "Plugin Pro Annual",     value: "$99",  abandoned: "2025-01-11 11:55", emailsSent: 3, lastEmail: "1d ago",   status: "lost",        recovered: false },
  { id: "CART-006", customer: "Felix Wagner",    email: "felix@wagner.de",    product: "SaaS Business Plan",    value: "$299", abandoned: "2025-01-10 08:30", emailsSent: 1, lastEmail: "2d ago",   status: "recovering",  recovered: false },
  { id: "CART-007", customer: "Sophie Martin",   email: "sophie@martin.fr",   product: "Theme Bundle",          value: "$59",  abandoned: "2025-01-09 16:44", emailsSent: 3, lastEmail: "3d ago",   status: "recovered",   recovered: true  },
  { id: "CART-008", customer: "Oliver White",    email: "oliver@white.co.uk", product: "Plugin Pro Annual",     value: "$99",  abandoned: "2025-01-08 20:10", emailsSent: 0, lastEmail: "—",        status: "new",         recovered: false },
];

// ─── Security Page Data ────────────────────────────────────────────────────────
const blockedIPsData = [
  { id: 1,  ip: "185.220.101.45",  country: "Romania",        flag: "🇷🇴", reason: "Brute force — 48 attempts",     severity: "critical", blocked: "2025-01-12 08:14", expires: "Permanent",        hits: 48  },
  { id: 2,  ip: "91.108.4.18",     country: "Russia",         flag: "🇷🇺", reason: "Invalid license enumeration",   severity: "high",     blocked: "2025-01-12 06:31", expires: "2025-01-19 06:31", hits: 312 },
  { id: 3,  ip: "103.21.244.0",    country: "China",          flag: "🇨🇳", reason: "Download scraping detected",    severity: "high",     blocked: "2025-01-11 22:10", expires: "2025-01-18 22:10", hits: 188 },
  { id: 4,  ip: "45.142.212.100",  country: "Netherlands",    flag: "🇳🇱", reason: "Repeated 403 on API endpoints", severity: "medium",   blocked: "2025-01-11 17:44", expires: "2025-01-14 17:44", hits: 74  },
  { id: 5,  ip: "198.235.24.109",  country: "United States",  flag: "🇺🇸", reason: "Flagged by threat intelligence",severity: "medium",   blocked: "2025-01-10 09:00", expires: "Permanent",        hits: 22  },
  { id: 6,  ip: "5.188.206.26",    country: "Ukraine",        flag: "🇺🇦", reason: "Tor exit node",                 severity: "low",      blocked: "2025-01-09 14:22", expires: "2025-01-23 14:22", hits: 9   },
  { id: 7,  ip: "162.247.74.201",  country: "United States",  flag: "🇺🇸", reason: "Tor exit node",                 severity: "low",      blocked: "2025-01-08 11:05", expires: "2025-01-22 11:05", hits: 4   },
  { id: 8,  ip: "77.247.181.162",  country: "Sweden",         flag: "🇸🇪", reason: "Known credential stuffing IP",  severity: "critical", blocked: "2025-01-07 03:41", expires: "Permanent",        hits: 921 },
];

const loginAttemptsData = [
  { id: 1,  ip: "185.220.101.45", country: "Romania",       flag: "🇷🇴", email: "admin@example.com",        attempts: 48, lastAttempt: "2025-01-12 08:13", status: "blocked",   target: "WP Admin" },
  { id: 2,  ip: "91.108.4.18",    country: "Russia",        flag: "🇷🇺", email: "sarah@example.com",        attempts: 12, lastAttempt: "2025-01-12 06:28", status: "monitoring",target: "API" },
  { id: 3,  ip: "103.21.244.0",   country: "China",         flag: "🇨🇳", email: "info@acmecorp.com",        attempts: 7,  lastAttempt: "2025-01-11 22:05", status: "blocked",   target: "API" },
  { id: 4,  ip: "45.142.212.100", country: "Netherlands",   flag: "🇳🇱", email: "noah@example.com",         attempts: 4,  lastAttempt: "2025-01-11 17:40", status: "monitoring",target: "WP Admin" },
  { id: 5,  ip: "203.0.113.55",   country: "Brazil",        flag: "🇧🇷", email: "marcus@example.com",       attempts: 3,  lastAttempt: "2025-01-11 14:12", status: "allowed",   target: "API" },
  { id: 6,  ip: "198.51.100.22",  country: "Canada",        flag: "🇨🇦", email: "ava@example.com",          attempts: 2,  lastAttempt: "2025-01-10 09:30", status: "allowed",   target: "API" },
];

const suspiciousDownloadsData = [
  { id: 1,  ip: "91.108.4.18",   country: "Russia",        flag: "🇷🇺", customer: "Unknown",         license: "WDD-XXXX-INVALID",  product: "Plugin Pro",     version: "v2.4.1", date: "2025-01-12 06:29", reason: "Invalid license key",       severity: "critical" },
  { id: 2,  ip: "103.21.244.0",  country: "China",         flag: "🇨🇳", customer: "Emily Davis",      license: "WDD-C3D4-E5F6-G7H8",product: "Plugin Pro",     version: "v2.3.2", date: "2025-01-11 22:01", reason: "Expired license used",       severity: "high"     },
  { id: 3,  ip: "45.142.212.100",country: "Netherlands",   flag: "🇳🇱", customer: "Unknown",          license: "WDD-FAKE-0000-0000", product: "Theme Bundle",   version: "v1.8.0", date: "2025-01-11 17:38", reason: "License key forgery attempt", severity: "critical" },
  { id: 4,  ip: "185.234.219.8", country: "Germany",       flag: "🇩🇪", customer: "Marcus Chen",      license: "WDD-B2C3-D4E5-F6G7", product: "Theme Bundle",   version: "v1.8.0", date: "2025-01-11 10:14", reason: "Geo mismatch (VPN detected)",  severity: "medium"   },
  { id: 5,  ip: "198.235.24.109",country: "United States", flag: "🇺🇸", customer: "Unknown",          license: "WDD-C3D4-E5F6-G7H8", product: "SaaS Connector", version: "v3.1.0", date: "2025-01-10 08:55", reason: "License shared — 8 IPs",      severity: "high"     },
];

const firewallRulesData = [
  { id: 1,  name: "Rate Limit — License Validation", type: "rate-limit", target: "/api/v1/licenses/validate", limit: "60 req/min",  action: "block",    enabled: true,  hits: 1284 },
  { id: 2,  name: "Rate Limit — Download Endpoint",  type: "rate-limit", target: "/api/v1/downloads",         limit: "10 req/min",  action: "throttle", enabled: true,  hits: 342  },
  { id: 3,  name: "Geo-Block — High Risk Countries", type: "geo-block",  target: "ALL endpoints",             limit: "BY COUNTRY",  action: "block",    enabled: false, hits: 0    },
  { id: 4,  name: "Block Tor Exit Nodes",            type: "ip-list",    target: "ALL endpoints",             limit: "IP reputation",action: "block",    enabled: true,  hits: 89   },
  { id: 5,  name: "Block Known VPN Ranges",          type: "ip-list",    target: "/api/v1/downloads",         limit: "IP reputation",action: "challenge",enabled: false, hits: 0    },
  { id: 6,  name: "HMAC Signature Validation",       type: "signature",  target: "/api/v1/*",                 limit: "ALL requests", action: "block",    enabled: true,  hits: 4    },
  { id: 7,  name: "License Key Entropy Check",       type: "validation", target: "/api/v1/licenses/*",        limit: "ALL requests", action: "reject",   enabled: true,  hits: 27   },
];

const auditLogData = [
  { id: 1,  type: "block",    desc: "IP 185.220.101.45 auto-blocked after 48 failed attempts",     actor: "System",       time: "2025-01-12 08:14", severity: "critical" },
  { id: 2,  type: "alert",    desc: "Suspicious download flagged — invalid license WDD-XXXX",       actor: "System",       time: "2025-01-12 06:29", severity: "high"     },
  { id: 3,  type: "block",    desc: "IP 91.108.4.18 blocked — license enumeration pattern",         actor: "System",       time: "2025-01-12 06:31", severity: "high"     },
  { id: 4,  type: "config",   desc: "Firewall rule 'Rate Limit — Download' threshold changed 20→10","actor": "Admin",       time: "2025-01-12 05:00", severity: "info"     },
  { id: 5,  type: "unblock",  desc: "IP 203.0.113.42 manually unblocked",                          actor: "Admin",        time: "2025-01-11 23:10", severity: "info"     },
  { id: 6,  type: "alert",    desc: "License key WDD-C3D4 used from expired account",               actor: "System",       time: "2025-01-11 22:01", severity: "high"     },
  { id: 7,  type: "block",    desc: "IP 103.21.244.0 blocked — download scraping pattern",          actor: "System",       time: "2025-01-11 22:10", severity: "high"     },
  { id: 8,  type: "config",   desc: "Geo-block rule disabled by Admin",                             actor: "Admin",        time: "2025-01-11 18:00", severity: "info"     },
  { id: 9,  type: "alert",    desc: "Brute-force wave detected from /24 subnet 185.220.101.0",      actor: "System",       time: "2025-01-11 08:00", severity: "critical" },
  { id: 10, type: "rule",     desc: "New firewall rule 'License Key Entropy Check' created",        actor: "Admin",        time: "2025-01-10 14:30", severity: "info"     },
  { id: 11, type: "unblock",  desc: "IP 77.88.55.60 removed from allowlist",                        actor: "Admin",        time: "2025-01-10 11:15", severity: "info"     },
  { id: 12, type: "block",    desc: "77.247.181.162 permanently blocked — credential stuffing",      actor: "System",       time: "2025-01-07 03:41", severity: "critical" },
];

const threatTrendData = [
  { day: "Mon", blocked: 12, alerts: 5,  logins: 28 },
  { day: "Tue", blocked: 8,  alerts: 3,  logins: 19 },
  { day: "Wed", blocked: 19, alerts: 9,  logins: 44 },
  { day: "Thu", blocked: 6,  alerts: 2,  logins: 14 },
  { day: "Fri", blocked: 23, alerts: 11, logins: 61 },
  { day: "Sat", blocked: 31, alerts: 14, logins: 78 },
  { day: "Sun", blocked: 48, alerts: 18, logins: 92 },
];

// ── Subscription analytics data ────────────────────────────────────────────────
const subTrendData = [
  { month: "Jan", active: 4100, new: 420, churned: 190, paused: 310 },
  { month: "Feb", active: 4330, new: 510, churned: 210, paused: 298 },
  { month: "Mar", active: 4620, new: 480, churned: 180, paused: 320 },
  { month: "Apr", active: 4880, new: 540, churned: 200, paused: 305 },
  { month: "May", active: 5100, new: 610, churned: 230, paused: 290 },
  { month: "Jun", active: 5241, new: 580, churned: 215, paused: 412 },
];
const subPlanMix = [
  { name: "Annual",   value: 58, color: M3.primary },
  { name: "Monthly",  value: 31, color: M3.secondary },
  { name: "Lifetime", value: 11, color: M3.info },
];
const subRevenueByProduct = [
  { product: "Plugin Pro",   revenue: 24800 },
  { product: "Theme Bundle", revenue: 11200 },
  { product: "SaaS Pro",     revenue: 6400 },
  { product: "SaaS Starter", revenue: 2200 },
];

// ── Affiliate analytics data ───────────────────────────────────────────────────
const affiliateTrendData = [
  { month: "Jan", clicks: 3200, signups: 410, revenue: 4800 },
  { month: "Feb", clicks: 3800, signups: 490, revenue: 5600 },
  { month: "Mar", clicks: 4100, signups: 530, revenue: 6200 },
  { month: "Apr", clicks: 4600, signups: 580, revenue: 7100 },
  { month: "May", clicks: 5200, signups: 640, revenue: 8400 },
  { month: "Jun", clicks: 5840, signups: 712, revenue: 9600 },
];
const topAffiliates = [
  { name: "wpbeginner.com", clicks: 1840, conversions: 214, revenue: "$3,420", rate: "11.6%" },
  { name: "kinsta.com",     clicks: 1210, conversions: 148, revenue: "$2,368", rate: "12.2%" },
  { name: "codecanyon.net", clicks:  980, conversions: 102, revenue: "$1,632", rate: "10.4%" },
  { name: "wplift.com",     clicks:  760, conversions:  88, revenue: "$1,408", rate: "11.6%" },
  { name: "wpforms.com",    clicks:  620, conversions:  71, revenue: "$1,136", rate: "11.5%" },
];
const affiliateConversionFunnel = [
  { name: "Link Clicks",   value: 5840 },
  { name: "Landing Views", value: 4210 },
  { name: "Sign-ups",      value: 712 },
  { name: "Purchases",     value: 384 },
];

// ── Abandoned cart analytics data ──────────────────────────────────────────────
const cartTrendData = [
  { month: "Jan", abandoned: 920, recovered: 210, revenue: 3200 },
  { month: "Feb", abandoned: 1040, recovered: 260, revenue: 3900 },
  { month: "Mar", abandoned: 980, recovered: 290, revenue: 4350 },
  { month: "Apr", abandoned: 1150, recovered: 340, revenue: 5100 },
  { month: "May", abandoned: 1280, recovered: 390, revenue: 5850 },
  { month: "Jun", abandoned: 1340, recovered: 430, revenue: 6450 },
];
const emailSeqPerf = [
  { seq: "Email 1 (1h)",  sent: 1340, opened: 832, clicked: 418, recovered: 210 },
  { seq: "Email 2 (24h)", sent: 910,  opened: 501, clicked: 230, recovered: 130 },
  { seq: "Email 3 (72h)", sent: 680,  opened: 320, clicked: 148, recovered:  90 },
];
const topAbandonedProducts = [
  { product: "Plugin Pro Annual",     carts: 312, value: "$30,888", recoveryRate: "32%" },
  { product: "Theme Bundle",          carts: 248, value: "$14,824", recoveryRate: "28%" },
  { product: "SaaS Pro Annual",       carts: 189, value: "$37,611", recoveryRate: "22%" },
  { product: "Plugin Pro Monthly",    carts: 142, value: "$1,278",  recoveryRate: "38%" },
  { product: "SaaS Starter Monthly",  carts: 98,  value: "$4,802",  recoveryRate: "19%" },
];

// ─── Small UI Helpers ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    active:     { bg: "#C2E7A0", text: M3.success,          label: "Active" },
    expired:    { bg: "#FFDAD6", text: M3.error,            label: "Expired" },
    suspended:  { bg: "#FFDEA5", text: "#5C4200",           label: "Suspended" },
    revoked:    { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant, label: "Revoked" },
    paused:     { bg: "#C8E6FF", text: M3.info,             label: "Paused" },
    cancelled:  { bg: "#FFDAD6", text: M3.error,            label: "Cancelled" },
    "past-due": { bg: "#FFDEA5", text: "#5C4200",           label: "Past Due" },
    trialing:   { bg: M3.primaryContainer, text: M3.onPrimaryContainer, label: "Trialing" },
    pending:    { bg: M3.surfaceContainer, text: M3.onSurfaceVariant, label: "Pending" },
  };
  const s = styles[status] ?? styles.pending;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text, fontFamily: "Roboto, sans-serif" }}>
      {s.label}
    </span>
  );
}

function TrendChip({ value, isPositive }: { value: string; isPositive: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: isPositive ? "#C2E7A0" : "#FFDAD6", color: isPositive ? M3.success : M3.error }}>
      {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {value}
    </span>
  );
}

function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-xl ${className}`}
      style={{ backgroundColor: M3.surface, boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)", ...style }}>
      {children}
    </div>
  );
}

function FilledButton({ children, onClick, danger = false, small = false }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; small?: boolean }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full font-medium transition-all"
      style={{ backgroundColor: danger ? M3.error : M3.primary, color: danger ? "#FFF" : M3.onPrimary, padding: small ? "6px 16px" : "10px 24px", fontSize: small ? "13px" : "14px", fontFamily: "Roboto, sans-serif", letterSpacing: "0.1px", border: "none", cursor: "pointer" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}>
      {children}
    </button>
  );
}

function OutlinedButton({ children, onClick, danger = false, small = false }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; small?: boolean }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full font-medium transition-all"
      style={{ backgroundColor: "transparent", color: danger ? M3.error : M3.primary, padding: small ? "5px 16px" : "9px 24px", fontSize: small ? "13px" : "14px", fontFamily: "Roboto, sans-serif", letterSpacing: "0.1px", border: `1px solid ${danger ? M3.error : M3.outline}`, cursor: "pointer" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = danger ? "#FFDAD6" : M3.primaryContainer; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
      {children}
    </button>
  );
}

function TonalButton({ children, onClick, small = false }: { children: React.ReactNode; onClick?: () => void; small?: boolean }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full font-medium transition-all"
      style={{ backgroundColor: M3.secondaryContainer, color: M3.onSecondaryContainer, padding: small ? "6px 16px" : "10px 24px", fontSize: small ? "13px" : "14px", fontFamily: "Roboto, sans-serif", letterSpacing: "0.1px", border: "none", cursor: "pointer" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}>
      {children}
    </button>
  );
}

function TextButton({ children, onClick, danger = false, small = false }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; small?: boolean }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full font-medium transition-all"
      style={{ backgroundColor: "transparent", color: danger ? M3.error : M3.primary, fontSize: small ? "12px" : "13px", fontFamily: "Roboto, sans-serif", letterSpacing: "0.1px", border: "none", cursor: "pointer", padding: small ? "4px 10px" : "6px 12px" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = danger ? "#FFDAD6" : M3.primaryContainer; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
      {children}
    </button>
  );
}

function IconButton({ icon: Icon, onClick, title = "" }: { icon: React.ElementType; onClick?: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title}
      className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
      style={{ color: M3.onSurfaceVariant, border: "none", background: "transparent", cursor: "pointer" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
      <Icon size={20} />
    </button>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className="relative flex items-center rounded-full transition-all"
      style={{ width: 52, height: 32, backgroundColor: on ? M3.primary : M3.outlineVariant, border: on ? "none" : `2px solid ${M3.outline}`, cursor: "pointer", padding: 0 }}>
      <span className="absolute rounded-full transition-all"
        style={{ width: on ? 24 : 16, height: on ? 24 : 16, backgroundColor: on ? M3.onPrimary : M3.outline, left: on ? "calc(100% - 28px)" : 6, top: "50%", transform: "translateY(-50%)" }} />
    </button>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== "All";
  return (
    <div className="relative" style={{ isolation: "isolate" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all"
        style={{
          backgroundColor: active ? M3.primaryContainer : M3.surfaceContainerHigh,
          color: active ? M3.onPrimaryContainer : M3.onSurfaceVariant,
          border: `1.5px solid ${active ? M3.primary : M3.outlineVariant}`,
          fontFamily: "Roboto, sans-serif", cursor: "pointer",
          fontWeight: active ? 500 : 400,
        }}>
        <Filter size={13} />
        <span>{active ? value : label}</span>
        {active ? (
          <span
            onClick={e => { e.stopPropagation(); onChange("All"); setOpen(false); }}
            style={{ cursor: "pointer", fontWeight: 700, fontSize: 14, lineHeight: 1, marginLeft: 1, color: M3.primary }}>
            ×
          </span>
        ) : (
          <ChevronDown size={13} />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 rounded-xl overflow-hidden"
            style={{ top: "calc(100% + 4px)", minWidth: 168, backgroundColor: M3.surface, boxShadow: "0 4px 8px rgba(0,0,0,0.12),0 8px 24px rgba(0,0,0,0.10)", border: `1px solid ${M3.outlineVariant}` }}>
            <div className="py-1">
              {["All", ...options].map(opt => (
                <button key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-left"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: value === opt || (opt === "All" && value === "All") ? M3.primary : M3.onSurface,
                    backgroundColor: (value === opt && opt !== "All") ? `${M3.primary}10` : "transparent",
                    fontFamily: "Roboto, sans-serif", fontWeight: value === opt ? 500 : 400,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = value === opt && opt !== "All" ? `${M3.primary}10` : M3.surfaceContainerHigh; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = value === opt && opt !== "All" ? `${M3.primary}10` : "transparent"; }}>
                  {opt === "All" ? `All ${label}s` : opt}
                  {value === opt && opt !== "All" && <Check size={13} color={M3.primary} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Date range filter helper ──────────────────────────────────────────────────
function isInDateRange(dateStr: string, range: string): boolean {
  if (!range || range === "All time") return true;
  const d = new Date(dateStr.replace(" ", "T"));
  if (isNaN(d.getTime())) return true;
  const msPerDay = 86400000;
  const now = Date.now();
  const days: Record<string, number> = { "Today": 1, "This week": 7, "This month": 30, "Last 3 months": 90, "Last year": 365 };
  const n = days[range];
  return !!n && d.getTime() >= now - n * msPerDay;
}

const DATE_RANGE_OPTIONS = ["Today", "This week", "This month", "Last 3 months", "Last year"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-medium text-sm mb-4" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, trend, trendUp, icon: Icon }: { label: string; value: string; trend: string; trendUp: boolean; icon: React.ElementType }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: M3.primaryContainer }}>
          <Icon size={14} color={M3.primary} />
        </div>
      </div>
      <div className="text-3xl font-light mb-2" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{value}</div>
      <TrendChip value={trend} isPositive={trendUp} />
    </Card>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ activePage, onNav, collapsed, onToggle, enabledModules }: {
  activePage: Page; onNav: (p: Page) => void; collapsed: boolean; onToggle: () => void; enabledModules: Set<string>;
}) {
  return (
    <aside className="flex flex-col h-full transition-all duration-200 flex-shrink-0"
      style={{ width: collapsed ? 80 : 256, backgroundColor: M3.surfaceContainerLow, borderRadius: "0 16px 16px 0", boxShadow: "1px 0 2px rgba(0,0,0,0.06)", overflow: "hidden" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 flex-shrink-0" style={{ minHeight: 72 }}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: M3.primary }}>
          <Package size={20} color={M3.onPrimary} />
        </div>
        {!collapsed && (
          <div>
            <div className="font-semibold text-sm leading-tight" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Woo Digital</div>
            <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Downloads</div>
          </div>
        )}
        <button onClick={onToggle} className="ml-auto flex items-center justify-center w-8 h-8 rounded-full transition-all flex-shrink-0"
          style={{ color: M3.onSurfaceVariant, border: "none", background: "transparent", cursor: "pointer" }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto pb-4">
        {NAV_SCHEMA.map((item) => {
          const active = activePage === item.id || (item.id === "analytics" && activePage.startsWith("analytics"));
          const enabled = item.moduleKey === null || enabledModules.has(item.moduleKey);
          const Icon = item.icon;
          return (
            <div key={item.id}>
              {item.dividerBefore && <div className="my-2" style={{ borderTop: `1px solid ${M3.outlineVariant}` }} />}
              <button
                onClick={() => enabled && onNav(item.id)}
                className="relative flex items-center w-full transition-all mb-0.5"
                style={{
                  height: 56, borderRadius: 9999,
                  backgroundColor: active ? M3.secondaryContainer : "transparent",
                  color: active ? M3.onSecondaryContainer : M3.onSurfaceVariant,
                  opacity: enabled ? 1 : 0.38,
                  border: "none", cursor: enabled ? "pointer" : "default",
                  paddingLeft: collapsed ? 0 : 16, paddingRight: collapsed ? 0 : 16,
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: collapsed ? 0 : 12,
                }}
                onMouseEnter={e => { if (!active && enabled) (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                <Icon size={22} />
                {!collapsed && (
                  <span className="text-sm font-medium" style={{ fontFamily: "Roboto, sans-serif", letterSpacing: "0.1px" }}>
                    {item.label}
                  </span>
                )}
                {!enabled && !collapsed && <Lock size={12} className="ml-auto opacity-60" />}
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── Top Bar ───────────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<Page, string> = {
  overview: "Overview", licenses: "Licenses", "license-summary": "License Summary", "license-detail": "License Detail", "customer-detail": "Customer Profile",
  subscriptions: "Subscriptions", analytics: "Analytics",
  "analytics-subscriptions": "Subscription Analytics",
  "analytics-affiliates": "Affiliate Analytics",
  "analytics-abandoned-cart": "Abandoned Cart Analytics",
  settings: "Settings", downloads: "Downloads", updates: "Updates",
  saas: "SaaS Accounts", "saas-detail": "Account Details", affiliates: "Affiliates", "affiliate-detail": "Affiliate Details", "abandoned-cart": "Abandoned Cart", security: "Security",
};

function TopBar({ page, onNav }: { page: Page; onNav: (p: Page) => void }) {
  const crumbs: Array<{ label: string; page?: Page }> = [{ label: "Woo Digital Downloads" }];
  if (page.startsWith("analytics-")) {
    crumbs.push({ label: "Analytics", page: "analytics" });
    crumbs.push({ label: PAGE_TITLES[page] });
  } else if (page === "customer-detail") {
    crumbs.push({ label: "Licenses", page: "licenses" });
    crumbs.push({ label: CUSTOMER_SARAH.name });
  } else if (page === "saas-detail") {
    crumbs.push({ label: "SaaS Accounts", page: "saas" });
    crumbs.push({ label: "Account Details" });
  } else if (page === "affiliate-detail") {
    crumbs.push({ label: "Affiliates", page: "affiliates" });
    crumbs.push({ label: "Affiliate Details" });
  } else if (page === "license-summary") {
    crumbs.push({ label: "Licenses", page: "licenses" });
    crumbs.push({ label: "Summary" });
  } else if (page === "license-detail") {
    crumbs.push({ label: "Licenses", page: "licenses" });
    crumbs.push({ label: "License Detail" });
  } else if (page !== "overview") {
    crumbs.push({ label: PAGE_TITLES[page] });
  }

  return (
    <header className="flex items-center px-6 flex-shrink-0"
      style={{ height: 64, backgroundColor: M3.surface, borderBottom: `1px solid ${M3.outlineVariant}` }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} />}
              {c.page
                ? <button onClick={() => onNav(c.page!)} style={{ background: "none", border: "none", cursor: "pointer", color: M3.primary, fontFamily: "Roboto, sans-serif", fontSize: 12, padding: 0 }}>{c.label}</button>
                : <span>{c.label}</span>}
            </span>
          ))}
        </div>
        <h1 className="font-medium leading-tight" style={{ fontSize: 22, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
          {PAGE_TITLES[page]}
        </h1>
      </div>
      <div className="flex items-center gap-1">
        <IconButton icon={HelpCircle} title="Help" />
        <IconButton icon={Bell} title="Notifications" />
        <div className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium ml-1 cursor-pointer"
          style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>
          AD
        </div>
      </div>
    </header>
  );
}

// ─── Dashboard Overview ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, trend, trendUp, warning = false, actions = [] }: {
  icon: React.ElementType; label: string; value: string; trend: string; trendUp: boolean; warning?: boolean; actions?: ActionItem[];
}) {
  return (
    <Card className="p-5 flex flex-col gap-3 cursor-default group"
      style={{ borderLeft: warning ? `4px solid ${M3.warning}` : "none", transition: "box-shadow 0.15s", overflow: "visible" }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ backgroundColor: warning ? M3.warningContainer : M3.primaryContainer }}>
          <Icon size={20} color={warning ? M3.warning : M3.primary} />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionDropdown actions={actions} />
        </div>
      </div>
      <div>
        <div className="font-light" style={{ fontSize: 36, color: M3.onSurface, fontFamily: "Roboto, sans-serif", lineHeight: 1.1 }}>{value}</div>
        <div className="text-sm mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{label}</div>
      </div>
      <TrendChip value={trend} isPositive={trendUp} />
    </Card>
  );
}

function OverviewPage({ onNav }: { onNav: (p: Page) => void }) {
  const [toast, setToast] = useState<ToastProps>({ message: "", type: "success", visible: false });
  const showToast = (msg: string, type: ToastProps["type"] = "success") => { setToast({ message: msg, type, visible: true }); setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000); };

  const licenseActions: ActionItem[] = [
    { label: "View All Licenses",        icon: Key,          onClick: () => onNav("licenses") },
    { label: "Filter: Active Only",      icon: Filter,       onClick: () => { onNav("licenses"); showToast("Filter applied — Active licenses", "info"); } },
    { label: "View Expiring Soon",       icon: AlertCircle,  onClick: () => { onNav("licenses"); showToast("Filtered to expiring licenses", "info"); } },
    { label: "Export Active Licenses",   icon: DownloadIcon, onClick: () => showToast("Active licenses exported as CSV", "success"), dividerBefore: true },
    { label: "Copy Count",               icon: Copy,         onClick: () => { navigator.clipboard?.writeText("8432"); showToast("Count copied: 8,432", "info"); } },
    { label: "Set Alert Threshold",      icon: Bell,         onClick: () => showToast("Alert threshold saved", "success"), dividerBefore: true },
  ];

  const mrrActions: ActionItem[] = [
    { label: "View in Analytics",        icon: BarChart2,    onClick: () => onNav("analytics") },
    { label: "View Subscription MRR",    icon: Repeat,       onClick: () => onNav("analytics-subscriptions") },
    { label: "MRR Breakdown by Product", icon: Layers,       onClick: () => showToast("MRR breakdown opened in Analytics", "info") },
    { label: "Export Revenue Report",    icon: DownloadIcon, onClick: () => showToast("Revenue report exported as CSV", "success"), dividerBefore: true },
    { label: "Copy Value",               icon: Copy,         onClick: () => { navigator.clipboard?.writeText("44600"); showToast("Value copied: $44,600", "info"); } },
    { label: "Set MRR Alert",            icon: Bell,         onClick: () => showToast("MRR alert threshold saved", "success"), dividerBefore: true },
  ];

  const downloadsActions: ActionItem[] = [
    { label: "View All Downloads",       icon: Download,     onClick: () => onNav("downloads") },
    { label: "Filter: This Month",       icon: Calendar,     onClick: () => { onNav("downloads"); showToast("Filter applied — this month", "info"); } },
    { label: "Top Products This Month",  icon: BarChart2,    onClick: () => showToast("Top products breakdown opened", "info") },
    { label: "Top Countries This Month", icon: Globe,        onClick: () => showToast("Top countries breakdown opened", "info") },
    { label: "Export Download Log",      icon: DownloadIcon, onClick: () => showToast("Download log exported as CSV", "success"), dividerBefore: true },
    { label: "Copy Count",               icon: Copy,         onClick: () => { navigator.clipboard?.writeText("12847"); showToast("Count copied: 12,847", "info"); } },
  ];

  const expiringActions: ActionItem[] = [
    { label: "View Expiring Licenses",   icon: Key,          onClick: () => { onNav("licenses"); showToast("Filtered to expiring licenses", "info"); } },
    { label: "Send Bulk Reminder",       icon: Mail,         onClick: () => showToast("Bulk reminder sent to 187 customers", "success") },
    { label: "Auto-Extend All (7 days)", icon: Calendar,     onClick: () => showToast("All 187 expiring licenses extended by 7 days", "success") },
    { label: "Export Expiring List",     icon: DownloadIcon, onClick: () => showToast("Expiring licenses exported as CSV", "success"), dividerBefore: true },
    { label: "Copy Count",               icon: Copy,         onClick: () => { navigator.clipboard?.writeText("187"); showToast("Count copied: 187", "info"); } },
    { label: "Change Alert Window",      icon: Bell,         onClick: () => showToast("Alert window updated to 30 days", "success"), dividerBefore: true },
  ];

  const subscriptionsActions: ActionItem[] = [
    { label: "View All Subscriptions",    icon: Repeat,       onClick: () => onNav("subscriptions") },
    { label: "View Active Only",          icon: CheckCircle,  onClick: () => { onNav("subscriptions"); showToast("Filtered to active subscriptions", "info"); } },
    { label: "View Past Due",             icon: AlertCircle,  onClick: () => { onNav("subscriptions"); showToast("Filtered to past-due subscriptions", "info"); } },
    { label: "Subscription Analytics",   icon: BarChart2,    onClick: () => onNav("analytics-subscriptions") },
    { label: "Export Subscriptions",      icon: DownloadIcon, onClick: () => showToast("Subscriptions exported as CSV", "success"), dividerBefore: true },
    { label: "Copy Active Count",         icon: Copy,         onClick: () => { navigator.clipboard?.writeText("5241"); showToast("Count copied: 5,241", "info"); } },
    { label: "Set Churn Alert",           icon: Bell,         onClick: () => showToast("Churn rate alert saved", "success"), dividerBefore: true },
  ];

  const affiliatesActions: ActionItem[] = [
    { label: "View All Affiliates",       icon: Users,        onClick: () => onNav("affiliates") },
    { label: "View Pending Approvals",    icon: Clock,        onClick: () => { onNav("affiliates"); showToast("Filtered to pending affiliates", "info"); } },
    { label: "Affiliate Analytics",       icon: BarChart2,    onClick: () => onNav("analytics-affiliates") },
    { label: "Pay All Commissions",       icon: DollarSign,   onClick: () => showToast("Commission payments queued for all active affiliates", "success") },
    { label: "Export Affiliate Report",   icon: DownloadIcon, onClick: () => showToast("Affiliate report exported as CSV", "success"), dividerBefore: true },
    { label: "Copy Total Clicks",         icon: Copy,         onClick: () => { navigator.clipboard?.writeText("17490"); showToast("Count copied: 17,490", "info"); } },
    { label: "Add New Affiliate",         icon: UserPlus,     onClick: () => { onNav("affiliates"); showToast("New affiliate form opened", "info"); }, dividerBefore: true },
  ];

  const abandonedCartActions: ActionItem[] = [
    { label: "View All Carts",            icon: ShoppingCart, onClick: () => onNav("abandoned-cart") },
    { label: "View Recovering",           icon: Activity,     onClick: () => { onNav("abandoned-cart"); showToast("Filtered to recovering carts", "info"); } },
    { label: "Abandoned Cart Analytics",  icon: BarChart2,    onClick: () => onNav("analytics-abandoned-cart") },
    { label: "Send All Recovery Emails",  icon: Send,         onClick: () => showToast("Recovery emails queued for all eligible carts", "success") },
    { label: "Export Cart Report",        icon: DownloadIcon, onClick: () => showToast("Abandoned cart report exported as CSV", "success"), dividerBefore: true },
    { label: "Copy Abandoned Count",      icon: Copy,         onClick: () => { navigator.clipboard?.writeText("1340"); showToast("Count copied: 1,340", "info"); } },
    { label: "Configure Email Sequence",  icon: Settings,     onClick: () => { onNav("settings"); showToast("Abandoned Cart settings opened", "info"); }, dividerBefore: true },
  ];

  const securityActions: ActionItem[] = [
    { label: "View Security Dashboard",   icon: Shield,       onClick: () => onNav("security") },
    { label: "View IP Blocklist",         icon: Ban,          onClick: () => { onNav("security"); showToast("IP Blocklist tab opened", "info"); } },
    { label: "View Suspicious Downloads", icon: AlertCircle,  onClick: () => { onNav("security"); showToast("Suspicious Downloads tab opened", "info"); } },
    { label: "View Audit Log",            icon: FileText,     onClick: () => { onNav("security"); showToast("Audit Log tab opened", "info"); } },
    { label: "Export Security Report",    icon: DownloadIcon, onClick: () => showToast("Security report exported as CSV", "success"), dividerBefore: true },
    { label: "Copy Blocked IP Count",     icon: Copy,         onClick: () => { navigator.clipboard?.writeText("8"); showToast("Count copied: 8", "info"); } },
    { label: "Configure Firewall Rules",  icon: Settings,     onClick: () => { onNav("security"); showToast("Firewall Rules tab opened", "info"); }, dividerBefore: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Key}         label="Active Licenses"            value="8,432"   trend="▲ +124 this month" trendUp    actions={licenseActions} />
        <StatCard icon={CreditCard}  label="Monthly Recurring Revenue"  value="$44,600" trend="▲ +8.3% MoM"       trendUp    actions={mrrActions} />
        <StatCard icon={Download}    label="Downloads This Month"       value="12,847"  trend="▲ +2,104 vs last"  trendUp    actions={downloadsActions} />
        <StatCard icon={AlertCircle} label="Expiring Soon (30d)"        value="187"     trend="▼ needs attention"  trendUp={false} warning actions={expiringActions} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Repeat}      label="Active Subscriptions"       value="5,241"   trend="▲ +141 this month" trendUp    actions={subscriptionsActions} />
        <StatCard icon={Users}       label="Active Affiliates"          value="6"        trend="▲ +1 this month"   trendUp    actions={affiliatesActions} />
        <StatCard icon={ShoppingCart}label="Abandoned Carts (30d)"      value="1,340"   trend="▼ +4.7% vs last"   trendUp={false} actions={abandonedCartActions} />
        <StatCard icon={Shield}      label="Security Threats Blocked"   value="8"        trend="▲ +3 today"        trendUp={false} warning actions={securityActions} />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
        <Card className="p-5">
          <SectionTitle>MRR &amp; ARR Trend — 12 months</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mrrData}>
              <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
              <YAxis tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Roboto, sans-serif" }} />
              <Line type="monotone" dataKey="mrr" name="MRR" stroke={M3.primary}    strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="arr" name="ARR" stroke={M3.secondary}  strokeWidth={2} dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <SectionTitle>License Status</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={licenseStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {licenseStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-2">
            {licenseStatusData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span style={{ color: M3.onSurfaceVariant }}>{d.name}</span>
                </div>
                <span className="font-medium" style={{ color: M3.onSurface }}>{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Recent Licenses</span>
            <TextButton onClick={() => onNav("licenses")}>View all</TextButton>
          </div>
          <div className="flex flex-col gap-1">
            {recentLicenses.map(l => (
              <div key={l.key} className="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all" style={{ cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerLow; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                <StatusBadge status={l.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{l.key}</div>
                  <div className="text-xs truncate" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{l.product}</div>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{l.date}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Recent Downloads</span>
            <TextButton onClick={() => onNav("downloads")}>View all</TextButton>
          </div>
          <div className="flex flex-col gap-1">
            {recentDownloads.map((d, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg">
                <span className="text-base leading-none">{d.country}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{d.product}</div>
                  <div className="text-xs truncate" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{d.ip}</div>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{d.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Expiring Soon</span>
            <TextButton onClick={() => onNav("licenses")}>View all</TextButton>
          </div>
          <div className="flex flex-col gap-1">
            {expiringLicenses.map(l => (
              <div key={l.key} className="flex items-center gap-2 py-1.5 px-2 rounded-lg">
                <div className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 text-xs font-bold"
                  style={{ backgroundColor: M3.warningContainer, color: M3.warning, fontFamily: "Roboto, sans-serif" }}>
                  {l.expiresIn.split(" ")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{l.customer}</div>
                  <div className="text-xs truncate" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{l.product}</div>
                </div>
                <TextButton small onClick={() => showToast(`Reminder sent to ${l.customer}`, "success")}>Remind</TextButton>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Generic Action Dropdown ───────────────────────────────────────────────────
interface ActionItem {
  label: string;
  icon: React.ElementType;
  danger?: boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
  onClick: () => void;
}
function ActionDropdown({ actions, hint }: { actions: ActionItem[]; hint?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" style={{ isolation: "isolate" }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
        style={{ color: open ? M3.primary : M3.onSurfaceVariant, backgroundColor: open ? M3.primaryContainer : "transparent", border: "none", cursor: "pointer" }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 rounded-xl overflow-hidden"
            style={{ top: "calc(100% + 4px)", minWidth: 210, backgroundColor: M3.surface, boxShadow: "0 4px 8px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.10)", border: `1px solid ${M3.outlineVariant}` }}>
            {hint && (
              <div className="px-4 py-2.5" style={{ backgroundColor: M3.surfaceContainerLow, borderBottom: `1px solid ${M3.outlineVariant}` }}>
                <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{hint}</div>
              </div>
            )}
            <div className="py-1">
              {actions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i}>
                    {a.dividerBefore && <div className="my-1 mx-3" style={{ borderTop: `1px solid ${M3.outlineVariant}` }} />}
                    <button
                      disabled={a.disabled}
                      onClick={e => { e.stopPropagation(); if (!a.disabled) { a.onClick(); setOpen(false); } }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left"
                      style={{ background: "none", border: "none", cursor: a.disabled ? "default" : "pointer", color: a.disabled ? M3.outlineVariant : a.danger ? M3.error : M3.onSurface, opacity: a.disabled ? 0.4 : 1, fontFamily: "Roboto, sans-serif" }}
                      onMouseEnter={e => { if (!a.disabled) (e.currentTarget as HTMLElement).style.backgroundColor = a.danger ? "#FFDAD6" : M3.surfaceContainerHigh; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                      <Icon size={15} color={a.disabled ? M3.outlineVariant : a.danger ? M3.error : M3.onSurfaceVariant} />
                      {a.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  icon?: React.ElementType;
  onConfirm: () => void;
  onCancel: () => void;
}
function ConfirmDialog({ open, title, body, confirmLabel, danger = false, icon: Icon, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="flex flex-col rounded-3xl overflow-hidden" style={{ width: 400, backgroundColor: M3.surfaceContainer, boxShadow: "0 8px 32px rgba(0,0,0,0.24)" }}>
        <div className="px-6 pt-6 pb-4 flex flex-col gap-3">
          {Icon && (
            <div className="flex items-center justify-center w-12 h-12 rounded-full self-center mb-1"
              style={{ backgroundColor: danger ? "#FFDAD6" : M3.primaryContainer }}>
              <Icon size={22} color={danger ? M3.error : M3.primary} />
            </div>
          )}
          <div className="text-center">
            <div className="font-semibold text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{title}</div>
          </div>
          <div className="text-sm text-center" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", lineHeight: 1.6 }}>{body}</div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
          <TextButton onClick={onCancel}>Cancel</TextButton>
          <FilledButton danger={danger} small onClick={onConfirm}>{confirmLabel}</FilledButton>
        </div>
      </div>
    </div>
  );
}

// ─── Toast notification ────────────────────────────────────────────────────────
interface ToastProps { message: string; type: "success" | "info" | "warning" | "error"; visible: boolean; }
function Toast({ message, type, visible }: ToastProps) {
  const colors = { success: M3.success, info: M3.info, warning: M3.warning, error: M3.error };
  const icons  = { success: CheckCircle, info: AlertCircle, warning: AlertCircle, error: XCircle };
  const Icon   = icons[type];
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)` }}>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl"
        style={{ backgroundColor: M3.onSurface, fontFamily: "Roboto, sans-serif", minWidth: 280 }}>
        <Icon size={16} color={colors[type]} />
        <span className="text-sm" style={{ color: M3.surface }}>{message}</span>
      </div>
    </div>
  );
}

// ─── Row Action Menu ───────────────────────────────────────────────────────────
interface MenuAction {
  label: string;
  icon: React.ElementType;
  danger?: boolean;
  dividerBefore?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

interface RowMenuProps {
  row: typeof licensesTableData[0];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onViewDetail: () => void;
  onViewCustomer: () => void;
  onCopyKey: () => void;
  onExtendExpiry: () => void;
  onResetActivations: () => void;
  onSendReminder: () => void;
  onSuspend: () => void;
  onReinstate: () => void;
  onRevoke: () => void;
  onDuplicate: () => void;
}

function RowActionMenu({ row, open, onOpen, onClose, onViewDetail, onViewCustomer, onCopyKey, onExtendExpiry, onResetActivations, onSendReminder, onSuspend, onReinstate, onRevoke, onDuplicate }: RowMenuProps) {
  const isSuspended = row.status === "suspended";
  const isRevoked   = row.status === "revoked";
  const isExpired   = row.status === "expired";
  const isActive    = row.status === "active";

  const actions: MenuAction[] = [
    { label: "View License Detail", icon: FileText,     onClick: onViewDetail },
    { label: "View Customer",       icon: Users,        onClick: onViewCustomer },
    { label: "Copy License Key",    icon: Copy,         onClick: onCopyKey },
    { label: "Duplicate License",   icon: Layers,       onClick: onDuplicate, dividerBefore: true },
    { label: "Extend Expiry",       icon: Calendar,     onClick: onExtendExpiry, disabled: isRevoked },
    { label: "Reset Activations",   icon: RotateCcw,    onClick: onResetActivations, disabled: isRevoked || isExpired },
    { label: "Send Reminder Email", icon: Mail,         onClick: onSendReminder },
    ...(isSuspended
      ? [{ label: "Reinstate License", icon: CheckCircle, onClick: onReinstate, dividerBefore: true }]
      : isActive
        ? [{ label: "Suspend License",  icon: PauseCircle, onClick: onSuspend, dividerBefore: true, danger: false }]
        : []),
    { label: "Revoke License",      icon: XCircle,      onClick: onRevoke, danger: true, dividerBefore: !isSuspended && !isActive, disabled: isRevoked },
  ];

  return (
    <div className="relative" style={{ isolation: "isolate" }}>
      <button
        onClick={e => { e.stopPropagation(); open ? onClose() : onOpen(); }}
        className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
        style={{
          color: open ? M3.primary : M3.onSurfaceVariant,
          backgroundColor: open ? M3.primaryContainer : "transparent",
          border: "none", cursor: "pointer",
        }}>
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={onClose} />
          {/* Menu */}
          <div className="absolute right-0 z-40 rounded-xl overflow-hidden"
            style={{
              top: "calc(100% + 4px)",
              minWidth: 220,
              backgroundColor: M3.surface,
              boxShadow: "0 4px 8px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.10)",
              border: `1px solid ${M3.outlineVariant}`,
            }}>
            {/* Header — license key hint */}
            <div className="px-4 py-2.5" style={{ backgroundColor: M3.surfaceContainerLow, borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <div className="text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>License actions</div>
              <div className="text-xs mt-0.5" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.key.substring(0, 19)}…</div>
            </div>

            {/* Items */}
            <div className="py-1">
              {actions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <div key={i}>
                    {action.dividerBefore && <div className="my-1 mx-3" style={{ borderTop: `1px solid ${M3.outlineVariant}` }} />}
                    <button
                      disabled={action.disabled}
                      onClick={e => { e.stopPropagation(); if (!action.disabled) { action.onClick(); onClose(); } }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-all"
                      style={{
                        background: "none", border: "none", cursor: action.disabled ? "default" : "pointer",
                        color: action.disabled ? M3.outlineVariant : action.danger ? M3.error : M3.onSurface,
                        opacity: action.disabled ? 0.4 : 1,
                        fontFamily: "Roboto, sans-serif",
                      }}
                      onMouseEnter={e => {
                        if (!action.disabled) (e.currentTarget as HTMLElement).style.backgroundColor = action.danger ? "#FFDAD6" : M3.surfaceContainerHigh;
                      }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                      <Icon size={15} color={action.disabled ? M3.outlineVariant : action.danger ? M3.error : M3.onSurfaceVariant} />
                      {action.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── License Summary Data ──────────────────────────────────────────────────────
const licenseIssuedTrend = [
  { month: "Feb", issued: 312, renewed: 198, revoked: 14 },
  { month: "Mar", issued: 389, renewed: 231, revoked: 9  },
  { month: "Apr", issued: 421, renewed: 256, revoked: 17 },
  { month: "May", issued: 378, renewed: 214, revoked: 22 },
  { month: "Jun", issued: 445, renewed: 289, revoked: 11 },
  { month: "Jul", issued: 502, renewed: 318, revoked: 8  },
  { month: "Aug", issued: 467, renewed: 301, revoked: 19 },
  { month: "Sep", issued: 531, renewed: 342, revoked: 13 },
  { month: "Oct", issued: 488, renewed: 327, revoked: 16 },
  { month: "Nov", issued: 612, renewed: 391, revoked: 7  },
  { month: "Dec", issued: 574, renewed: 368, revoked: 21 },
  { month: "Jan", issued: 649, renewed: 412, revoked: 12 },
];

const licensesByProduct = [
  { product: "Plugin Pro",      active: 4812, expired: 621, suspended: 184, revoked: 49  },
  { product: "Theme Bundle",    active: 2108, expired: 389, suspended: 91,  revoked: 22  },
  { product: "SaaS Connector",  active: 891,  expired: 142, suspended: 28,  revoked: 11  },
  { product: "Security Module", active: 421,  expired: 64,  suspended: 7,   revoked: 4   },
  { product: "Analytics Add-on",active: 200,  expired: 25,  suspended: 2,   revoked: 3   },
];

const licensesByPlan = [
  { name: "Annual",   value: 5820, color: M3.primary   },
  { name: "Monthly",  value: 1944, color: M3.secondary },
  { name: "Lifetime", value: 668,  color: M3.info      },
];

const activationRateByProduct = [
  { product: "Plugin Pro",       rate: 94, total: 4812 },
  { product: "Theme Bundle",     rate: 72, total: 2108 },
  { product: "SaaS Connector",   rate: 88, total: 891  },
  { product: "Security Module",  rate: 63, total: 421  },
  { product: "Analytics Add-on", rate: 51, total: 200  },
];

const topCustomersByLicense = [
  { name: "Acme Corp",        licenses: 12, active: 11, ltv: "$2,388" },
  { name: "DevAgency GmbH",   licenses: 8,  active: 8,  ltv: "$1,592" },
  { name: "Pixel Studio",     licenses: 5,  active: 4,  ltv: "$995"   },
  { name: "Sarah Johnson",    licenses: 4,  active: 3,  ltv: "$842"   },
  { name: "Startup Hub",      licenses: 3,  active: 3,  ltv: "$597"   },
  { name: "Marcus Chen",      licenses: 3,  active: 2,  ltv: "$447"   },
];

const recentLicenseActivity = [
  { type: "issued",    customer: "Yuki Tanaka",    product: "Plugin Pro",     plan: "Annual",   time: "8m ago",  icon: Key,       color: M3.primary  },
  { type: "renewed",   customer: "Acme Corp",       product: "Theme Bundle",   plan: "Lifetime", time: "24m ago", icon: RefreshCw, color: M3.success  },
  { type: "expired",   customer: "Felix Wagner",    product: "SaaS Connector", plan: "Monthly",  time: "1h ago",  icon: XCircle,   color: M3.error    },
  { type: "revoked",   customer: "Spam Corp",       product: "Plugin Pro",     plan: "Annual",   time: "2h ago",  icon: Ban,       color: M3.error    },
  { type: "issued",    customer: "Sophie Martin",   product: "Analytics",      plan: "Annual",   time: "3h ago",  icon: Key,       color: M3.primary  },
  { type: "suspended", customer: "Oliver White",    product: "Theme Bundle",   plan: "Monthly",  time: "5h ago",  icon: PauseCircle,color: M3.warning },
  { type: "issued",    customer: "Peter Harris",    product: "Plugin Pro",     plan: "Lifetime", time: "6h ago",  icon: Key,       color: M3.primary  },
  { type: "renewed",   customer: "Anna Schmidt",    product: "Security Module",plan: "Annual",   time: "8h ago",  icon: RefreshCw, color: M3.success  },
];

// ─── License Summary Page ──────────────────────────────────────────────────────
function LicenseSummaryPage({ onBack, onViewAll }: { onBack: () => void; onViewAll: () => void }) {
  const [range, setRange] = useState("12m");
  const ranges = ["3m", "6m", "12m", "All time"];

  const totalActive    = licensesByProduct.reduce((s, r) => s + r.active, 0);
  const totalExpired   = licensesByProduct.reduce((s, r) => s + r.expired, 0);
  const totalSuspended = licensesByProduct.reduce((s, r) => s + r.suspended, 0);
  const totalRevoked   = licensesByProduct.reduce((s, r) => s + r.revoked, 0);
  const totalAll       = totalActive + totalExpired + totalSuspended + totalRevoked;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Sub-nav ── */}
      <div className="flex items-center justify-between">
        <TextButton onClick={onBack}>← Back to Licenses</TextButton>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full overflow-hidden" style={{ border: `1px solid ${M3.outlineVariant}` }}>
            {ranges.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className="px-4 py-1.5 text-sm transition-all"
                style={{ backgroundColor: range === r ? M3.primary : "transparent", color: range === r ? M3.onPrimary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                {r}
              </button>
            ))}
          </div>
          <FilledButton small onClick={onViewAll}><Key size={14} /> View All Licenses</FilledButton>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "Total",      value: totalAll.toLocaleString(),       color: M3.onSurface,        bg: M3.surfaceContainerHigh },
          { label: "Active",     value: totalActive.toLocaleString(),    color: M3.success,           bg: M3.successContainer     },
          { label: "Expired",    value: totalExpired.toLocaleString(),   color: M3.error,             bg: "#FFDAD6"               },
          { label: "Suspended",  value: totalSuspended.toLocaleString(), color: M3.warning,           bg: M3.warningContainer     },
          { label: "Revoked",    value: totalRevoked.toLocaleString(),   color: M3.onSurfaceVariant,  bg: M3.surfaceContainerHigh },
          { label: "Expiring 30d", value: "187",                         color: M3.warning,           bg: M3.warningContainer     },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center flex flex-col items-center gap-1">
            <div className="text-2xl font-light" style={{ color: s.color, fontFamily: "Roboto, sans-serif" }}>{s.value}</div>
            <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{s.label}</div>
            <div className="h-1 w-full rounded-full mt-1" style={{ backgroundColor: s.bg }}>
              <div className="h-full rounded-full" style={{ width: "100%", backgroundColor: s.color, opacity: 0.4 }} />
            </div>
          </Card>
        ))}
      </div>

      {/* ── Trend chart + Plan mix ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
        <Card className="p-5">
          <SectionTitle>License Activity — {range}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={licenseIssuedTrend} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
              <YAxis tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Roboto, sans-serif" }} />
              <Bar dataKey="issued"  name="Issued"  fill={M3.primary}   radius={[3,3,0,0]} />
              <Bar dataKey="renewed" name="Renewed" fill={M3.success}   radius={[3,3,0,0]} />
              <Bar dataKey="revoked" name="Revoked" fill={M3.error}     radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <SectionTitle>Plan Mix</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={licensesByPlan} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                {licensesByPlan.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-1">
            {licensesByPlan.map(d => {
              const pct = Math.round((d.value / (licensesByPlan.reduce((s, x) => s + x.value, 0))) * 100);
              return (
                <div key={d.name} className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span style={{ color: M3.onSurfaceVariant }}>{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: M3.onSurface }}>{d.value.toLocaleString()}</span>
                    <span style={{ color: M3.outlineVariant }}>·</span>
                    <span style={{ color: M3.onSurfaceVariant }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── By product ── */}
      <Card className="p-5">
        <SectionTitle>Licenses by Product</SectionTitle>
        <table className="w-full">
          <thead>
            <tr>
              {["Product", "Active", "Expired", "Suspended", "Revoked", "Total", "Health"].map(h => (
                <th key={h} className="text-left pb-3 text-xs font-medium"
                  style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {licensesByProduct.map((row, i) => {
              const total  = row.active + row.expired + row.suspended + row.revoked;
              const health = Math.round((row.active / total) * 100);
              return (
                <tr key={row.product} style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
                  <td className="py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</td>
                  <td className="py-3 text-sm font-semibold" style={{ color: M3.success, fontFamily: "Roboto Mono, monospace" }}>{row.active.toLocaleString()}</td>
                  <td className="py-3 text-sm" style={{ color: M3.error, fontFamily: "Roboto Mono, monospace" }}>{row.expired.toLocaleString()}</td>
                  <td className="py-3 text-sm" style={{ color: M3.warning, fontFamily: "Roboto Mono, monospace" }}>{row.suspended.toLocaleString()}</td>
                  <td className="py-3 text-sm" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.revoked.toLocaleString()}</td>
                  <td className="py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{total.toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full flex-1" style={{ maxWidth: 80, backgroundColor: M3.outlineVariant }}>
                        <div className="h-full rounded-full" style={{ width: `${health}%`, backgroundColor: health >= 85 ? M3.success : health >= 65 ? M3.warning : M3.error }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: health >= 85 ? M3.success : health >= 65 ? M3.warning : M3.error, fontFamily: "Roboto, sans-serif" }}>{health}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* ── Activation rate + Top customers ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card className="p-5">
          <SectionTitle>Activation Rate by Product</SectionTitle>
          <div className="flex flex-col gap-4">
            {activationRateByProduct.map(row => (
              <div key={row.product}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.total.toLocaleString()} licenses</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: row.rate >= 85 ? M3.successContainer : row.rate >= 65 ? M3.warningContainer : "#FFDAD6", color: row.rate >= 85 ? M3.success : row.rate >= 65 ? M3.warning : M3.error, fontFamily: "Roboto, sans-serif" }}>
                      {row.rate}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: M3.surfaceContainerHigh }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${row.rate}%`, backgroundColor: row.rate >= 85 ? M3.success : row.rate >= 65 ? M3.warning : M3.error }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTop: `1px solid ${M3.outlineVariant}`, color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
            <span>Overall average</span>
            <span className="font-semibold" style={{ color: M3.primary }}>
              {Math.round(activationRateByProduct.reduce((s, r) => s + r.rate, 0) / activationRateByProduct.length)}%
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle>Top Customers by License Count</SectionTitle>
          <div className="flex flex-col gap-0">
            {topCustomersByLicense.map((row, i) => (
              <div key={row.name}
                className="flex items-center gap-3 py-3 transition-all cursor-default"
                style={{ borderBottom: i < topCustomersByLicense.length - 1 ? `1px solid ${M3.outlineVariant}` : "none" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.name}</div>
                  <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>LTV {row.ltv}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.licenses}</div>
                  <div className="text-xs" style={{ color: row.active === row.licenses ? M3.success : M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    {row.active} active
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Recent activity feed ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Recent License Activity</SectionTitle>
          <TextButton onClick={onViewAll}>View all licenses →</TextButton>
        </div>
        <div className="grid gap-0" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {recentLicenseActivity.map((evt, i) => {
            const Icon = evt.icon;
            const isLeft = i % 2 === 0;
            return (
              <div key={i} className="flex items-center gap-3 py-3"
                style={{ borderBottom: i < recentLicenseActivity.length - 2 ? `1px solid ${M3.outlineVariant}` : "none", paddingLeft: isLeft ? 0 : 24, paddingRight: isLeft ? 24 : 0 }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${evt.color}18` }}>
                  <Icon size={14} color={evt.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium capitalize px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${evt.color}18`, color: evt.color, fontFamily: "Roboto, sans-serif" }}>
                      {evt.type}
                    </span>
                    <span className="text-xs font-medium truncate" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{evt.customer}</span>
                  </div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    {evt.product} · {evt.plan} · {evt.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
}

// ─── Licenses Page ─────────────────────────────────────────────────────────────
function LicensesPage({ onDetail, onCustomer, onSummary }: { onDetail: () => void; onCustomer: () => void; onSummary: () => void }) {
  const [selected, setSelected]     = useState<number[]>([]);
  const [search, setSearch]         = useState("");
  const [copied, setCopied]         = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [tableData, setTableData]   = useState(licensesTableData);
  const [filterStatus, setFilterStatus]   = useState("All");
  const [filterProduct, setFilterProduct] = useState("All");
  const [filterDate, setFilterDate]       = useState("All");
  const [toast, setToast]           = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]         = useState<{
    open: boolean; title: string; body: React.ReactNode; confirmLabel: string;
    danger: boolean; icon?: React.ElementType; onConfirm: () => void;
  }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });

  const showToast = (message: string, type: ToastProps["type"] = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));

  const updateStatus = (id: number, status: string) =>
    setTableData(rows => rows.map(r => r.id === id ? { ...r, status } : r));

  const toggleSelect = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCopy = (key: string) => {
    navigator.clipboard?.writeText(key).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
    showToast("License key copied to clipboard", "info");
  };

  const filtered = tableData.filter(l => {
    const matchSearch  = !search || l.customer.toLowerCase().includes(search.toLowerCase()) || l.key.toLowerCase().includes(search.toLowerCase()) || l.product.toLowerCase().includes(search.toLowerCase());
    const matchStatus  = filterStatus  === "All" || l.status  === filterStatus.toLowerCase();
    const matchProduct = filterProduct === "All" || l.product === filterProduct;
    const matchDate    = filterDate    === "All" || isInDateRange(l.expires === "Lifetime" ? l.expires : l.expires, filterDate);
    return matchSearch && matchStatus && matchProduct && matchDate;
  });

  // Per-row action handlers
  const makeHandlers = (row: typeof tableData[0]) => ({
    onViewDetail:       () => onDetail(),
    onViewCustomer:     () => onCustomer(),
    onCopyKey:          () => handleCopy(row.key),
    onDuplicate:        () => showToast(`Duplicate license issued for ${row.customer}`, "success"),
    onExtendExpiry:     () => openDialog({
      open: true, danger: false, icon: Calendar,
      title: "Extend License Expiry",
      body: <span>Add 12 months to <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.key.substring(0, 16)}…</strong><br />New expiry: <strong>Jan 12, 2026</strong></span>,
      confirmLabel: "Extend",
      onConfirm: () => { updateStatus(row.id, row.status); showToast(`Expiry extended for ${row.customer}`, "success"); closeDialog(); },
    }),
    onResetActivations: () => openDialog({
      open: true, danger: false, icon: RotateCcw,
      title: "Reset Activations?",
      body: <span>All site activations for <strong>{row.customer}</strong> will be cleared. They will need to reactivate.</span>,
      confirmLabel: "Reset",
      onConfirm: () => { showToast(`Activations reset for ${row.key.substring(0, 16)}…`, "info"); closeDialog(); },
    }),
    onSendReminder:     () => { showToast(`Reminder email sent to ${row.customer}`, "success"); },
    onSuspend:          () => openDialog({
      open: true, danger: false, icon: PauseCircle,
      title: "Suspend License?",
      body: <span>The license for <strong>{row.customer}</strong> will be suspended. Downloads and activations will be blocked until reinstated.</span>,
      confirmLabel: "Suspend",
      onConfirm: () => { updateStatus(row.id, "suspended"); showToast(`License suspended for ${row.customer}`, "warning"); closeDialog(); },
    }),
    onReinstate:        () => openDialog({
      open: true, danger: false, icon: CheckCircle,
      title: "Reinstate License?",
      body: <span>Restore access for <strong>{row.customer}</strong>? The license will return to Active status.</span>,
      confirmLabel: "Reinstate",
      onConfirm: () => { updateStatus(row.id, "active"); showToast(`License reinstated for ${row.customer}`, "success"); closeDialog(); },
    }),
    onRevoke:           () => openDialog({
      open: true, danger: true, icon: XCircle,
      title: "Revoke License?",
      body: <span>This will permanently revoke <br /><strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.key}</strong><br />for <strong>{row.customer}</strong>. This cannot be undone.</span>,
      confirmLabel: "Revoke License",
      onConfirm: () => { updateStatus(row.id, "revoked"); showToast(`License revoked for ${row.customer}`, "error"); closeDialog(); },
    }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <FilledButton danger small onClick={() => openDialog({
              open: true, danger: true, icon: XCircle,
              title: `Revoke ${selected.length} Licenses?`,
              body: `This will permanently revoke all ${selected.length} selected licenses. This cannot be undone.`,
              confirmLabel: "Revoke All",
              onConfirm: () => {
                setTableData(rows => rows.map(r => selected.includes(r.id) ? { ...r, status: "revoked" } : r));
                showToast(`${selected.length} licenses revoked`, "error");
                setSelected([]);
                closeDialog();
              },
            })}>
              <Trash2 size={14} /> Revoke {selected.length} Selected
            </FilledButton>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TonalButton small onClick={onSummary}><BarChart2 size={14} /> Summary</TonalButton>
          <OutlinedButton small><DownloadIcon size={14} /> Export CSV</OutlinedButton>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-lg"
          style={{ backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${M3.outlineVariant}` }}>
          <Search size={16} color={M3.onSurfaceVariant} />
          <input type="text" placeholder="Search licenses…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", border: "none" }} />
        </div>
        <FilterChip label="Status"  value={filterStatus}  options={["Active","Expired","Suspended","Revoked"]}                         onChange={setFilterStatus} />
        <FilterChip label="Product" value={filterProduct} options={["Plugin Pro","Theme Bundle","SaaS Starter","SaaS Pro","SaaS Connector"]} onChange={setFilterProduct} />
        <FilterChip label="Date Range" value={filterDate} options={DATE_RANGE_OPTIONS}                                                       onChange={setFilterDate} />
        {(filterStatus !== "All" || filterProduct !== "All" || filterDate !== "All") && (
          <button onClick={() => { setFilterStatus("All"); setFilterProduct("All"); setFilterDate("All"); }}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{ color: M3.error, border: `1px solid ${M3.error}`, background: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            Clear all
          </button>
        )}
      </div>

      <Card style={{ overflow: "visible" }}>
        <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
          <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox"
                    onChange={e => setSelected(e.target.checked ? filtered.map(l => l.id) : [])}
                    checked={selected.length === filtered.length && filtered.length > 0} />
                </th>
                {["License Key", "Customer", "Product", "Plan", "Sites", "Status", "Expires", ""].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium"
                    style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const isSelected = selected.includes(row.id);
                const [used, max] = row.sites.split("/").map(Number);
                const handlers = makeHandlers(row);
                return (
                  <tr key={row.id}
                    style={{ backgroundColor: isSelected ? `${M3.primary}14` : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow, transition: "background-color 0.1s" }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? `${M3.primary}14` : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(row.id)} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs" style={{ fontFamily: "Roboto Mono, monospace", color: M3.onSurface }}>{row.key.substring(0, 16)}…</span>
                        <button onClick={() => handleCopy(row.key)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} className="opacity-50 hover:opacity-100 transition-opacity">
                          {copied === row.key ? <Check size={13} color={M3.success} /> : <Copy size={13} color={M3.onSurfaceVariant} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={onCustomer} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                        <div className="text-sm font-medium hover:underline" style={{ color: M3.primary, fontFamily: "Roboto, sans-serif" }}>{row.customer}</div>
                      </button>
                      <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.email}</div>
                    </td>
                    <td className="px-3 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: M3.secondaryContainer, color: M3.onSecondaryContainer, fontFamily: "Roboto, sans-serif" }}>{row.plan}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs mb-0.5" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.sites}</div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ width: 48, backgroundColor: M3.outlineVariant }}>
                        <div className="h-full rounded-full" style={{ width: `${(used / max) * 100}%`, backgroundColor: M3.primary }} />
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.expires}</td>
                    <td className="px-3 py-3" style={{ overflow: "visible" }}>
                      <RowActionMenu
                        row={row}
                        open={openMenuId === row.id}
                        onOpen={() => setOpenMenuId(row.id)}
                        onClose={() => setOpenMenuId(null)}
                        {...handlers}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
          <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
            Showing {filtered.length} of {tableData.length} licenses
          </span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-full text-xs" style={{ color: M3.onSurfaceVariant, border: `1px solid ${M3.outlineVariant}`, background: "transparent", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>Previous</button>
            {[1,2,3].map(n => (
              <button key={n} onClick={() => setCurrentPage(n)} className="w-8 h-8 rounded-full text-xs"
                style={{ backgroundColor: currentPage === n ? M3.primary : "transparent", color: currentPage === n ? M3.onPrimary : M3.onSurfaceVariant, border: currentPage === n ? "none" : `1px solid ${M3.outlineVariant}`, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                {n}
              </button>
            ))}
            <button className="px-3 py-1.5 rounded-full text-xs" style={{ color: M3.onSurfaceVariant, border: `1px solid ${M3.outlineVariant}`, background: "transparent", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>Next</button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        body={dialog.body}
        confirmLabel={dialog.confirmLabel}
        danger={dialog.danger}
        icon={dialog.icon}
        onConfirm={dialog.onConfirm}
        onCancel={closeDialog}
      />

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── License Detail ────────────────────────────────────────────────────────────
function LicenseDetailPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab]         = useState<"activations" | "events">("activations");
  const [copied, setCopied]   = useState(false);
  const [status, setStatus]   = useState("active");
  const [expiry, setExpiry]   = useState("Jun 15, 2025");
  const [sitesUsed, setSitesUsed] = useState(1);
  const [activations, setActivations] = useState(activationData);
  const [toast, setToast]     = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]   = useState<{ open: boolean; title: string; body: React.ReactNode; confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });

  const showToast  = (msg: string, type: ToastProps["type"] = "success") => { setToast({ message: msg, type, visible: true }); setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000); };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));
  const handleCopy = () => { setCopied(true); navigator.clipboard?.writeText("WDD-A1B2-C3D4-E5F6"); setTimeout(() => setCopied(false), 1500); showToast("License key copied", "info"); };

  return (
    <div className="flex flex-col gap-4">
      <TextButton onClick={onBack}>← Back to Licenses</TextButton>
      <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 3fr" }}>
        <Card className="p-6 flex flex-col gap-5">
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>License Key</div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium leading-snug" style={{ fontFamily: "Roboto Mono, monospace", color: M3.onSurface, wordBreak: "break-all" }}>WDD-A1B2-C3D4-E5F6</span>
              <button onClick={handleCopy} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                {copied ? <Check size={16} color={M3.success} /> : <Copy size={16} color={M3.onSurfaceVariant} />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Since Jun 15, 2024</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold flex-shrink-0"
              style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>SJ</div>
            <div>
              <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Sarah Johnson</div>
              <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>sarah@example.com</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Product</div>
              <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Plugin Pro</div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>Plugin</span>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
              <span>Sites Used</span><span>{sitesUsed} / 1</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ backgroundColor: M3.outlineVariant }}>
              <div className="h-full rounded-full" style={{ width: `${sitesUsed * 100}%`, backgroundColor: M3.primary }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} color={M3.onSurfaceVariant} />
            <span className="text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Expires {expiry}</span>
          </div>
          <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
            <OutlinedButton danger small
              onClick={() => openDialog({ open: true, danger: true, icon: XCircle,
                title: "Revoke License?",
                body: <span>Permanently revoke <strong style={{ fontFamily: "Roboto Mono, monospace" }}>WDD-A1B2-C3D4-E5F6</strong> for Sarah Johnson? All active site activations will be invalidated immediately.</span>,
                confirmLabel: "Revoke License",
                onConfirm: () => { setStatus("revoked"); setActivations([]); showToast("License WDD-A1B2-C3D4-E5F6 revoked", "error"); closeDialog(); } })}>
              <XCircle size={14} /> Revoke License
            </OutlinedButton>
            <TonalButton small
              onClick={() => openDialog({ open: true, danger: false, icon: Calendar,
                title: "Extend License Expiry",
                body: <span>Add 12 months to this license.<br />Current expiry: <strong>{expiry}</strong><br />New expiry: <strong>Jun 15, 2026</strong></span>,
                confirmLabel: "Extend +12 months",
                onConfirm: () => { setExpiry("Jun 15, 2026"); showToast("Expiry extended to Jun 15, 2026", "success"); closeDialog(); } })}>
              <Calendar size={14} /> Extend Expiry
            </TonalButton>
            <TextButton
              onClick={() => openDialog({ open: true, danger: false, icon: RotateCcw,
                title: "Reset Activations?",
                body: "All site activations will be cleared. Sarah Johnson will need to re-activate on each domain. Their license remains valid.",
                confirmLabel: "Reset Activations",
                onConfirm: () => { setSitesUsed(0); setActivations([]); showToast("Activations reset — 0 / 1 sites active", "info"); closeDialog(); } })}>
              <RotateCcw size={14} /> Reset Activations
            </TextButton>
          </div>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <div className="flex" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
            {(["activations", "events"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="px-6 py-4 text-sm font-medium capitalize transition-all"
                style={{ color: tab === t ? M3.primary : M3.onSurfaceVariant, borderBottom: tab === t ? `2px solid ${M3.primary}` : "2px solid transparent", background: "none", border: "none", borderBottom: tab === t ? `2px solid ${M3.primary}` : "2px solid transparent", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                {t === "activations" ? `Activations (${activations.length})` : "Event Log"}
              </button>
            ))}
          </div>
          {tab === "activations" && (
            <div className="overflow-x-auto flex-1">
              {activations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <RotateCcw size={32} color={M3.outlineVariant} />
                  <div className="text-sm" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>No active site activations</div>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                      {["Domain", "Environment", "IP Address", "Activated At", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                          style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activations.map(row => (
                      <tr key={row.id} style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
                        <td className="px-4 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.domain}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: row.env === "production" ? M3.primaryContainer : row.env === "staging" ? M3.secondaryContainer : M3.surfaceContainerHigh, color: row.env === "production" ? M3.onPrimaryContainer : row.env === "staging" ? M3.onSecondaryContainer : M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                            {row.env === "production" ? <Server size={10} /> : row.env === "staging" ? <MonitorSmartphone size={10} /> : <Laptop size={10} />}
                            {row.env}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.ip}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.activatedAt}</td>
                        <td className="px-4 py-3">
                          <TextButton danger small onClick={() => openDialog({ open: true, danger: true, icon: XCircle,
                            title: "Deactivate Site?",
                            body: <span>Deactivate <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.domain}</strong>? This slot will become available for a new site.</span>,
                            confirmLabel: "Deactivate",
                            onConfirm: () => { setActivations(a => a.filter(x => x.id !== row.id)); setSitesUsed(s => Math.max(0, s - 1)); showToast(`${row.domain} deactivated`, "warning"); closeDialog(); } })}>
                            <XCircle size={12} /> Deactivate
                          </TextButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {tab === "events" && (
            <div className="p-6 flex flex-col gap-0">
              {eventLog.map((evt, i) => {
                const Icon = evt.icon;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: `${evt.color}20` }}>
                        <Icon size={15} color={evt.color} />
                      </div>
                      {i < eventLog.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: M3.outlineVariant }} />}
                    </div>
                    <div className="pb-6">
                      <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{evt.desc}</div>
                      <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{evt.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
      <ConfirmDialog open={dialog.open} title={dialog.title} body={dialog.body} confirmLabel={dialog.confirmLabel} danger={dialog.danger} icon={dialog.icon} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Subscriptions Page ────────────────────────────────────────────────────────
const PLAN_OPTIONS = [
  { label: "Monthly",  amount: "$9/mo",   cycle: "Monthly", note: "Billed every month, cancel any time." },
  { label: "Annual",   amount: "$99/yr",  cycle: "Annual",  note: "Save 8% vs monthly. Billed once per year." },
  { label: "Lifetime", amount: "$249",    cycle: "Lifetime",note: "One-time payment, never pay again." },
];

const DISCOUNT_DURATIONS = ["Once", "3 months", "6 months", "Forever"] as const;

// Static payment history per subscription (keyed by sub ID)
const paymentHistory: Record<string, Array<{ date: string; amount: string; method: string; status: string }>> = {
  "SUB-001": [
    { date: "2025-01-01", amount: "$99.00", method: "Visa ···4242", status: "paid" },
    { date: "2024-01-01", amount: "$99.00", method: "Visa ···4242", status: "paid" },
    { date: "2023-01-01", amount: "$99.00", method: "Visa ···4242", status: "paid" },
  ],
  "SUB-002": [
    { date: "2025-01-02", amount: "$29.00", method: "Mastercard ···1234", status: "paid" },
    { date: "2024-12-02", amount: "$29.00", method: "Mastercard ···1234", status: "paid" },
    { date: "2024-11-02", amount: "$29.00", method: "Mastercard ···1234", status: "failed" },
    { date: "2024-10-02", amount: "$29.00", method: "Mastercard ···1234", status: "paid" },
  ],
  "SUB-003": [
    { date: "2025-01-08", amount: "$49.00", method: "PayPal", status: "failed" },
    { date: "2024-12-08", amount: "$49.00", method: "PayPal", status: "paid" },
  ],
  "SUB-004": [
    { date: "2025-01-01", amount: "$99.00", method: "Visa ···9999", status: "paid" },
  ],
  "SUB-007": [
    { date: "2025-01-10", amount: "$0.00",  method: "—",              status: "trial" },
  ],
};

function SubscriptionsPage() {
  const [tableData, setTableData] = useState(subscriptionsData);
  const [selected, setSelected]   = useState<string[]>([]);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus]   = useState("All");
  const [filterProduct, setFilterProduct] = useState("All");
  const [filterCycle, setFilterCycle]     = useState("All");
  const [toast, setToast]         = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]       = useState<{
    open: boolean; title: string; body: React.ReactNode;
    confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void;
  }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });

  // Change Plan modal
  const [planRow, setPlanRow]           = useState<typeof tableData[0] | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(0);

  // Apply Discount modal
  const [discountRow, setDiscountRow]     = useState<typeof tableData[0] | null>(null);
  const [discountPct, setDiscountPct]     = useState("10");
  const [discountDur, setDiscountDur]     = useState<typeof DISCOUNT_DURATIONS[number]>("Once");

  // Payment History modal
  const [historyRow, setHistoryRow] = useState<typeof tableData[0] | null>(null);

  const showToast  = (msg: string, type: ToastProps["type"] = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));

  const updateRow    = (id: string, patch: Partial<typeof tableData[0]>) =>
    setTableData(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));
  const deleteRow    = (id: string) => setTableData(rows => rows.filter(r => r.id !== id));
  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filtered = tableData.filter(r => {
    const matchSearch  = !search || r.customer.toLowerCase().includes(search.toLowerCase()) || r.product.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const statusKey = r.status.replace("-", " ");
    const matchStatus  = filterStatus  === "All" || statusKey === filterStatus.toLowerCase() || r.status === filterStatus.toLowerCase();
    const matchProduct = filterProduct === "All" || r.product === filterProduct;
    const matchCycle   = filterCycle   === "All" || r.cycle   === filterCycle;
    return matchSearch && matchStatus && matchProduct && matchCycle;
  });

  // ── Row actions ─────────────────────────────────────────────────────────────
  const rowActions = (row: typeof tableData[0]): ActionItem[] => [

    // ── Navigation ─────────────────────────────────────────────────────────
    {
      label: "View Customer",
      icon: Users,
      onClick: () => showToast(`Customer profile for ${row.customer} opened`, "info"),
    },
    {
      label: "View Payment History",
      icon: FileText,
      onClick: () => setHistoryRow(row),
    },
    {
      label: "Send Payment Receipt",
      icon: Mail,
      onClick: () => showToast(`Receipt emailed to ${row.customer}`, "success"),
    },

    // ── Billing ────────────────────────────────────────────────────────────
    ...(row.status === "past-due" ? [{
      label: "Retry Payment Now",
      icon: RefreshCw,
      dividerBefore: true,
      onClick: () => openDialog({
        open: true, danger: false, icon: RefreshCw,
        title: "Retry Payment?",
        body: (
          <span>
            Attempt to charge <strong>{row.amount}</strong> from{" "}
            <strong>{row.customer}</strong>'s payment method on file immediately?
          </span>
        ),
        confirmLabel: "Retry Payment",
        onConfirm: () => {
          updateRow(row.id, { status: "active", nextPayment: "2025-02-15" });
          showToast(`Payment retried successfully for ${row.customer}`, "success");
          closeDialog();
        },
      }),
    }] : []),
    {
      label: "Update Payment Method",
      icon: CreditCard,
      dividerBefore: row.status !== "past-due",
      onClick: () => showToast(`Payment method update link sent to ${row.customer}`, "success"),
    },

    // ── Plan management ─────────────────────────────────────────────────────
    {
      label: "Change Plan",
      icon: Repeat,
      dividerBefore: true,
      disabled: row.status === "cancelled",
      onClick: () => {
        const idx = PLAN_OPTIONS.findIndex(p => p.cycle === row.cycle);
        setSelectedPlan(idx >= 0 ? idx : 0);
        setPlanRow(row);
      },
    },
    {
      label: "Apply Discount",
      icon: Tag,
      disabled: row.status === "cancelled",
      onClick: () => {
        setDiscountPct("10");
        setDiscountDur("Once");
        setDiscountRow(row);
      },
    },
    ...(row.status === "trialing" ? [{
      label: "Extend Trial (+7 days)",
      icon: Calendar,
      onClick: () => openDialog({
        open: true, danger: false, icon: Calendar,
        title: "Extend Trial?",
        body: (
          <span>
            Add 7 more days to <strong>{row.customer}</strong>'s trial for{" "}
            <strong>{row.product}</strong>?
          </span>
        ),
        confirmLabel: "Extend Trial",
        onConfirm: () => {
          updateRow(row.id, { nextPayment: "2025-01-29" });
          showToast(`Trial extended for ${row.customer}`, "success");
          closeDialog();
        },
      }),
    }] : []),

    // ── Status transitions ──────────────────────────────────────────────────
    ...(row.status === "active" ? [{
      label: "Pause Subscription",
      icon: PauseCircle,
      dividerBefore: true,
      onClick: () => openDialog({
        open: true, danger: false, icon: PauseCircle,
        title: "Pause Subscription?",
        body: (
          <span>
            Pause <strong>{row.product}</strong> for <strong>{row.customer}</strong>?
            They will keep access until the end of the current billing period, then billing stops.
          </span>
        ),
        confirmLabel: "Pause Subscription",
        onConfirm: () => {
          updateRow(row.id, { status: "paused", nextPayment: "—" });
          showToast(`Subscription paused for ${row.customer}`, "warning");
          closeDialog();
        },
      }),
    }] : []),
    ...(row.status === "paused" ? [{
      label: "Resume Subscription",
      icon: CheckCircle,
      dividerBefore: true,
      onClick: () => openDialog({
        open: true, danger: false, icon: CheckCircle,
        title: "Resume Subscription?",
        body: (
          <span>
            Resume billing for <strong>{row.customer}</strong>?
            Their next payment of <strong>{row.amount}</strong> will be charged immediately
            and then on the regular cycle.
          </span>
        ),
        confirmLabel: "Resume Subscription",
        onConfirm: () => {
          updateRow(row.id, { status: "active", nextPayment: "2025-02-15" });
          showToast(`Subscription resumed for ${row.customer}`, "success");
          closeDialog();
        },
      }),
    }] : []),

    // ── Destructive ─────────────────────────────────────────────────────────
    {
      label: "Cancel Subscription",
      icon: XCircle,
      danger: true,
      dividerBefore: true,
      disabled: row.status === "cancelled",
      onClick: () => openDialog({
        open: true, danger: true, icon: XCircle,
        title: "Cancel Subscription?",
        body: (
          <span>
            Cancel <strong>{row.product}</strong> ({row.amount}) for{" "}
            <strong>{row.customer}</strong>?
            Access ends immediately and billing stops. This cannot be reversed without a new purchase.
          </span>
        ),
        confirmLabel: "Cancel Subscription",
        onConfirm: () => {
          updateRow(row.id, { status: "cancelled", nextPayment: "—" });
          showToast(`Subscription cancelled for ${row.customer}`, "error");
          closeDialog();
        },
      }),
    },
    {
      label: "Refund Last Payment",
      icon: RotateCcw,
      danger: true,
      disabled: row.status === "cancelled" || row.status === "trialing",
      onClick: () => openDialog({
        open: true, danger: true, icon: RotateCcw,
        title: "Refund Last Payment?",
        body: (
          <span>
            Issue a full refund of <strong>{row.amount}</strong> to{" "}
            <strong>{row.customer}</strong>?
            The refund will be credited to their original payment method within 5–10 business days.
          </span>
        ),
        confirmLabel: "Issue Refund",
        onConfirm: () => {
          showToast(`Refund of ${row.amount} issued to ${row.customer}`, "warning");
          closeDialog();
        },
      }),
    },
    {
      label: "Delete Record",
      icon: Trash2,
      danger: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: Trash2,
        title: "Delete Subscription Record?",
        body: (
          <span>
            Permanently delete the subscription record <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.id}</strong>{" "}
            for <strong>{row.customer}</strong>?
            All payment history will be lost and this cannot be undone.
          </span>
        ),
        confirmLabel: "Delete Record",
        onConfirm: () => {
          deleteRow(row.id);
          showToast(`Subscription ${row.id} deleted`, "error");
          closeDialog();
        },
      }),
    },
  ];

  // ── Plan change handler ──────────────────────────────────────────────────
  const handlePlanChange = () => {
    if (!planRow) return;
    const plan = PLAN_OPTIONS[selectedPlan];
    updateRow(planRow.id, { cycle: plan.cycle, amount: plan.amount, nextPayment: plan.cycle === "Lifetime" ? "—" : "2025-02-15" });
    showToast(`${planRow.customer} moved to ${plan.label} plan`, "success");
    setPlanRow(null);
  };

  // ── Discount apply handler ───────────────────────────────────────────────
  const handleApplyDiscount = () => {
    if (!discountRow) return;
    showToast(`${discountPct}% discount (${discountDur}) applied for ${discountRow.customer}`, "success");
    setDiscountRow(null);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active",               value: String(tableData.filter(r => r.status === "active").length),    color: M3.success, bg: M3.successContainer },
          { label: "Paused",               value: String(tableData.filter(r => r.status === "paused").length),    color: M3.info,    bg: M3.infoContainer },
          { label: "Past Due",             value: String(tableData.filter(r => r.status === "past-due").length),  color: M3.warning, bg: M3.warningContainer },
          { label: "Cancelled This Month", value: String(tableData.filter(r => r.status === "cancelled").length), color: M3.error,   bg: "#FFDAD6" },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-2.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <div>
              <div className="text-2xl font-light" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{s.value}</div>
              <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-lg"
          style={{ backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${M3.outlineVariant}` }}>
          <Search size={16} color={M3.onSurfaceVariant} />
          <input type="text" placeholder="Search subscriptions…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", border: "none" }} />
        </div>
        <FilterChip label="Status"  value={filterStatus}  options={["Active","Paused","Past Due","Cancelled","Trialing"]}   onChange={setFilterStatus} />
        <FilterChip label="Product" value={filterProduct} options={["Plugin Pro","Theme Bundle","SaaS Starter","SaaS Pro"]}      onChange={setFilterProduct} />
        <FilterChip label="Cycle"   value={filterCycle}   options={["Monthly","Annual","Lifetime"]}                               onChange={setFilterCycle} />
        {(filterStatus !== "All" || filterProduct !== "All" || filterCycle !== "All") && (
          <button onClick={() => { setFilterStatus("All"); setFilterProduct("All"); setFilterCycle("All"); }}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ color: M3.error, border: `1px solid ${M3.error}`, background: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            Clear all
          </button>
        )}
        <div className="ml-auto">
          <OutlinedButton small onClick={() => showToast("Subscriptions exported as CSV", "success")}>
            <DownloadIcon size={14} /> Export CSV
          </OutlinedButton>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card style={{ overflow: "visible" }}>
        <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox"
                    onChange={e => setSelected(e.target.checked ? filtered.map(s => s.id) : [])}
                    checked={selected.length === filtered.length && filtered.length > 0} />
                </th>
                {["ID", "Customer", "Product", "Amount", "Cycle", "Status", "Next Payment", ""].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium"
                    style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const isSelected = selected.includes(row.id);
                const isPastDue  = row.status === "past-due";
                return (
                  <tr key={row.id}
                    style={{
                      backgroundColor: isSelected
                        ? `${M3.primary}14`
                        : isPastDue
                          ? `${M3.error}08`
                          : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = isSelected
                        ? `${M3.primary}14`
                        : isPastDue ? `${M3.error}08`
                        : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow;
                    }}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(row.id)} />
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.id}</td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.customer}</div>
                      <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.product}</div>
                    </td>
                    <td className="px-3 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</td>
                    <td className="px-3 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.amount}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: M3.surfaceContainerHigh, color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                        {row.cycle}
                      </span>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-3 text-xs font-medium"
                      style={{ color: isPastDue ? M3.error : M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                      {isPastDue && <span className="mr-1">⚠</span>}{row.nextPayment}
                    </td>
                    <td className="px-3 py-3" style={{ overflow: "visible" }}>
                      <ActionDropdown actions={rowActions(row)} hint={`${row.id} · ${row.customer}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
          <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
            Showing {filtered.length} of {tableData.length} subscriptions
            {tableData.filter(r => r.status === "past-due").length > 0 && (
              <span className="ml-3 font-medium" style={{ color: M3.error }}>
                · {tableData.filter(r => r.status === "past-due").length} past due
              </span>
            )}
          </span>
          <div className="flex items-center gap-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: M3.error }} /> Past due (highlighted)
            </span>
          </div>
        </div>
      </Card>

      {/* ── Bulk action bar ─────────────────────────────────────────────────── */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl z-50"
          style={{ backgroundColor: M3.onSurface, boxShadow: "0 4px 16px rgba(0,0,0,0.24)" }}>
          <span className="text-sm font-medium" style={{ color: M3.surface, fontFamily: "Roboto, sans-serif" }}>
            {selected.length} selected
          </span>
          <div style={{ width: 1, height: 20, backgroundColor: M3.outlineVariant }} />
          <TextButton onClick={() => setSelected([])}>Cancel</TextButton>
          <TonalButton small onClick={() => openDialog({
            open: true, danger: false, icon: PauseCircle,
            title: `Pause ${selected.length} Subscriptions?`,
            body: `Pause billing for all ${selected.length} selected subscriptions? Customers will keep access until their current period ends.`,
            confirmLabel: `Pause ${selected.length}`,
            onConfirm: () => {
              setTableData(rows => rows.map(r => selected.includes(r.id) && r.status === "active" ? { ...r, status: "paused", nextPayment: "—" } : r));
              showToast(`${selected.length} subscriptions paused`, "warning");
              setSelected([]); closeDialog();
            },
          })}>
            <PauseCircle size={14} /> Pause All
          </TonalButton>
          <OutlinedButton small onClick={() => showToast(`Receipt sent to ${selected.length} customers`, "success")}>
            <Mail size={14} /> Send Receipts
          </OutlinedButton>
          <FilledButton danger small onClick={() => openDialog({
            open: true, danger: true, icon: XCircle,
            title: `Cancel ${selected.length} Subscriptions?`,
            body: `Immediately cancel billing for all ${selected.length} selected subscriptions. Access ends immediately. This cannot be reversed.`,
            confirmLabel: `Cancel ${selected.length} Subscriptions`,
            onConfirm: () => {
              setTableData(rows => rows.map(r => selected.includes(r.id) ? { ...r, status: "cancelled", nextPayment: "—" } : r));
              showToast(`${selected.length} subscriptions cancelled`, "error");
              setSelected([]); closeDialog();
            },
          })}>
            <XCircle size={14} /> Cancel {selected.length}
          </FilledButton>
        </div>
      )}

      {/* ── Change Plan modal ───────────────────────────────────────────────── */}
      {planRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
          onClick={e => { if (e.target === e.currentTarget) setPlanRow(null); }}>
          <div className="rounded-3xl overflow-hidden flex flex-col"
            style={{ width: 480, backgroundColor: M3.surfaceContainer, boxShadow: "0 8px 32px rgba(0,0,0,0.24)" }}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4"
                style={{ backgroundColor: M3.primaryContainer }}>
                <Repeat size={22} color={M3.primary} />
              </div>
              <div className="text-center font-semibold text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
                Change Plan
              </div>
              <div className="text-center text-sm mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                {planRow.customer} · {planRow.product}
              </div>
            </div>

            {/* Plan options */}
            <div className="px-6 pb-4 flex flex-col gap-2">
              {PLAN_OPTIONS.map((plan, i) => {
                const active = selectedPlan === i;
                const isCurrent = plan.cycle === planRow.cycle;
                return (
                  <button key={plan.label} onClick={() => setSelectedPlan(i)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all w-full"
                    style={{
                      border: `2px solid ${active ? M3.primary : M3.outlineVariant}`,
                      backgroundColor: active ? M3.primaryContainer : M3.surfaceContainerLow,
                      cursor: "pointer",
                    }}>
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ border: `2px solid ${active ? M3.primary : M3.outlineVariant}`, backgroundColor: active ? M3.primary : "transparent" }}>
                      {active && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: M3.onPrimary }} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{plan.label}</span>
                        {isCurrent && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: M3.secondaryContainer, color: M3.onSecondaryContainer, fontFamily: "Roboto, sans-serif" }}>
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{plan.note}</div>
                    </div>
                    <div className="text-sm font-semibold flex-shrink-0" style={{ color: active ? M3.primary : M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>
                      {plan.amount}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Proration note */}
            <div className="mx-6 mb-4 px-3 py-2.5 rounded-xl text-xs"
              style={{ backgroundColor: M3.infoContainer, color: M3.info, fontFamily: "Roboto, sans-serif" }}>
              ℹ The price difference will be prorated and charged or credited on the next billing cycle.
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4"
              style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <TextButton onClick={() => setPlanRow(null)}>Cancel</TextButton>
              <FilledButton small
                onClick={handlePlanChange}
                disabled={PLAN_OPTIONS[selectedPlan].cycle === planRow.cycle}>
                Confirm Plan Change
              </FilledButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Apply Discount modal ────────────────────────────────────────────── */}
      {discountRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
          onClick={e => { if (e.target === e.currentTarget) setDiscountRow(null); }}>
          <div className="rounded-3xl overflow-hidden flex flex-col"
            style={{ width: 420, backgroundColor: M3.surfaceContainer, boxShadow: "0 8px 32px rgba(0,0,0,0.24)" }}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4"
                style={{ backgroundColor: M3.secondaryContainer }}>
                <Tag size={22} color={M3.secondary} />
              </div>
              <div className="font-semibold text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Apply Discount</div>
              <div className="text-sm mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                {discountRow.customer} · {discountRow.product}
              </div>
            </div>

            <div className="px-6 pb-4 flex flex-col gap-4">
              {/* Discount % */}
              <div>
                <div className="text-xs font-medium mb-2"
                  style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Discount Percentage
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min={1} max={100}
                    value={discountPct}
                    onChange={e => setDiscountPct(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-lg text-2xl font-light outline-none text-center"
                    style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.primary}`, color: M3.primary, fontFamily: "Roboto Mono, monospace" }}
                  />
                  <span className="text-2xl font-light" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>%</span>
                </div>
                {/* Quick-select pills */}
                <div className="flex gap-2 mt-2">
                  {["10", "15", "20", "25", "50"].map(p => (
                    <button key={p} onClick={() => setDiscountPct(p)}
                      className="flex-1 py-1.5 rounded-full text-xs transition-all"
                      style={{
                        backgroundColor: discountPct === p ? M3.primary : M3.surfaceContainerHigh,
                        color: discountPct === p ? M3.onPrimary : M3.onSurfaceVariant,
                        border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif",
                      }}>
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <div className="text-xs font-medium mb-2"
                  style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Apply For
                </div>
                <div className="flex gap-2">
                  {DISCOUNT_DURATIONS.map(d => (
                    <button key={d} onClick={() => setDiscountDur(d)}
                      className="flex-1 py-2 rounded-lg text-xs transition-all"
                      style={{
                        backgroundColor: discountDur === d ? M3.secondaryContainer : M3.surfaceContainerLow,
                        color: discountDur === d ? M3.onSecondaryContainer : M3.onSurfaceVariant,
                        border: `1px solid ${discountDur === d ? M3.secondary : M3.outlineVariant}`,
                        cursor: "pointer", fontFamily: "Roboto, sans-serif",
                      }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: M3.surfaceContainerLow }}>
                <div className="text-xs font-medium mb-2" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Preview</div>
                <div className="flex items-center justify-between text-sm" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <span style={{ color: M3.onSurfaceVariant }}>Current price</span>
                  <span style={{ color: M3.onSurface }}>{discountRow.amount}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <span style={{ color: M3.onSurfaceVariant }}>After discount</span>
                  <span className="font-semibold" style={{ color: M3.success }}>
                    {(() => {
                      const base = parseFloat(discountRow.amount.replace(/[^0-9.]/g, ""));
                      const disc = base * (1 - parseInt(discountPct || "0") / 100);
                      const suffix = discountRow.amount.includes("/mo") ? "/mo" : discountRow.amount.includes("/yr") ? "/yr" : "";
                      return `$${disc.toFixed(2)}${suffix}`;
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <span style={{ color: M3.onSurfaceVariant }}>Duration</span>
                  <span style={{ color: M3.onSurface }}>{discountDur}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4"
              style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <TextButton onClick={() => setDiscountRow(null)}>Cancel</TextButton>
              <FilledButton small onClick={handleApplyDiscount}>Apply Discount</FilledButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment History modal ───────────────────────────────────────────── */}
      {historyRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
          onClick={e => { if (e.target === e.currentTarget) setHistoryRow(null); }}>
          <div className="rounded-3xl overflow-hidden flex flex-col"
            style={{ width: 520, backgroundColor: M3.surfaceContainer, boxShadow: "0 8px 32px rgba(0,0,0,0.24)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <div>
                <div className="font-semibold text-base" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
                  Payment History
                </div>
                <div className="text-sm mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                  {historyRow.customer} · {historyRow.product} · <span style={{ fontFamily: "Roboto Mono, monospace" }}>{historyRow.id}</span>
                </div>
              </div>
              <IconButton icon={XCircle} onClick={() => setHistoryRow(null)} />
            </div>

            {/* Payments list */}
            <div className="p-6 flex flex-col gap-1" style={{ maxHeight: 400, overflowY: "auto" }}>
              {(paymentHistory[historyRow.id] ?? [{ date: "—", amount: historyRow.amount, method: "—", status: "paid" }]).map((p, i) => {
                const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
                  paid:   { color: M3.success, bg: M3.successContainer, label: "Paid" },
                  failed: { color: M3.error,   bg: "#FFDAD6",           label: "Failed" },
                  trial:  { color: M3.info,    bg: M3.infoContainer,    label: "Trial" },
                };
                const s = statusStyle[p.status] ?? statusStyle.paid;
                return (
                  <div key={i} className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
                    style={{ backgroundColor: i % 2 === 0 ? M3.surfaceContainerLow : "transparent" }}>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{p.date}</div>
                      <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{p.method}</div>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{p.amount}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: s.bg, color: s.color, fontFamily: "Roboto, sans-serif" }}>
                      {s.label}
                    </span>
                    {p.status === "paid" && (
                      <button onClick={() => showToast(`Receipt for ${p.date} sent to ${historyRow.customer}`, "success")}
                        className="text-xs"
                        style={{ color: M3.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                        Receipt
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                {(paymentHistory[historyRow.id] ?? []).length} payment{(paymentHistory[historyRow.id] ?? []).length !== 1 ? "s" : ""} on record
              </span>
              <OutlinedButton small onClick={() => showToast("Payment history exported", "success")}>
                <DownloadIcon size={14} /> Export
              </OutlinedButton>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={dialog.open} title={dialog.title} body={dialog.body} confirmLabel={dialog.confirmLabel} danger={dialog.danger} icon={dialog.icon} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Analytics Hub (overview tab + module sub-pages) ──────────────────────────
function AnalyticsPage({ onNav, enabledModules }: { onNav: (p: Page) => void; enabledModules: Set<string> }) {
  const [range, setRange] = useState("30d");
  const ranges = ["7d", "30d", "90d", "12m", "Custom"];

  const analyticsModules = [
    { key: "Subscriptions",     page: "analytics-subscriptions" as Page,  icon: Repeat,       label: "Subscription Analytics",     desc: "MRR trend, churn, plan mix, revenue by product" },
    { key: "Affiliate Program", page: "analytics-affiliates" as Page,     icon: Users,        label: "Affiliate Analytics",         desc: "Clicks, conversions, top affiliates, funnel" },
    { key: "Abandoned Cart",    page: "analytics-abandoned-cart" as Page, icon: ShoppingCart, label: "Abandoned Cart Analytics",    desc: "Recovery rate, email sequence performance" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <div className="flex rounded-full overflow-hidden" style={{ border: `1px solid ${M3.outlineVariant}` }}>
          {ranges.map(r => (
            <button key={r} onClick={() => setRange(r)} className="px-4 py-2 text-sm transition-all"
              style={{ backgroundColor: range === r ? M3.primary : "transparent", color: range === r ? M3.onPrimary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="MRR"        value="$44,600" trend="▲ +8.3%" trendUp icon={DollarSign} />
        <KpiCard label="ARR"        value="$535,200" trend="▲ +8.1%" trendUp icon={TrendingUp} />
        <KpiCard label="Churn Rate" value="2.4%"    trend="▼ -0.3%" trendUp icon={Activity} />
        <KpiCard label="Avg LTV"    value="$847"    trend="▲ +$34"  trendUp icon={CreditCard} />
      </div>

      <Card className="p-5">
        <SectionTitle>MRR Trend</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={mrrData}>
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={M3.primary} stopOpacity={0.15} />
                <stop offset="95%" stopColor={M3.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
            <YAxis tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
            <Area type="monotone" dataKey="mrr" name="MRR" stroke={M3.primary} fill="url(#mrrGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
        <Card className="p-5">
          <SectionTitle>License Health by Month</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analyticsBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
              <YAxis tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Roboto, sans-serif" }} />
              <Bar dataKey="active"    name="Active"    stackId="a" fill={M3.success} />
              <Bar dataKey="expired"   name="Expired"   stackId="a" fill={M3.error} />
              <Bar dataKey="suspended" name="Suspended" stackId="a" fill={M3.warning} />
              <Bar dataKey="revoked"   name="Revoked"   stackId="a" fill={M3.onSurfaceVariant} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <SectionTitle>Top Countries by Downloads</SectionTitle>
          <div className="flex flex-col gap-2">
            {topCountries.map(c => (
              <div key={c.country} className="flex items-center gap-2">
                <span className="text-base leading-none w-5">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs truncate" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{c.country}</span>
                    <span className="text-xs ml-2 flex-shrink-0" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{(c.downloads/1000).toFixed(1)}k</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ backgroundColor: M3.outlineVariant }}>
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: M3.primary }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 3fr" }}>
        <Card className="p-5">
          <SectionTitle>Version Adoption</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={versionData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                {versionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-2">
            {versionData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span style={{ color: M3.onSurfaceVariant }}>{d.name}</span>
                </div>
                <span className="font-medium" style={{ color: M3.onSurface }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle>Product Downloads</SectionTitle>
          <table className="w-full">
            <thead>
              <tr>
                {["Product", "Version", "Downloads", "Trend"].map(h => (
                  <th key={h} className="text-left pb-2 text-xs font-medium"
                    style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { product: "Plugin Pro",       version: "v2.4.1", downloads: "14,823", up: true },
                { product: "Theme Bundle",      version: "v1.8.0", downloads: "9,214",  up: true },
                { product: "SaaS Connector",    version: "v3.1.0", downloads: "6,441",  up: false },
                { product: "Security Module",   version: "v1.2.3", downloads: "4,892",  up: true },
                { product: "Analytics Add-on",  version: "v2.0.1", downloads: "3,109",  up: true },
              ].map((row, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
                  <td className="py-2.5 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</td>
                  <td className="py-2.5 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.version}</td>
                  <td className="py-2.5 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.downloads}</td>
                  <td className="py-2.5">{row.up ? <TrendingUp size={14} color={M3.success} /> : <TrendingDown size={14} color={M3.error} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Module-specific analytics cards */}
      <div>
        <div className="font-medium text-sm mb-3" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Module Analytics</div>
        <div className="grid grid-cols-3 gap-4">
          {analyticsModules.map(m => {
            const active = enabledModules.has(m.key);
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                onClick={() => active && onNav(m.page)}
                disabled={!active}
                className="text-left rounded-xl p-5 flex flex-col gap-3 transition-all"
                style={{
                  backgroundColor: active ? M3.surface : M3.surfaceContainerLow,
                  boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)" : "none",
                  opacity: active ? 1 : 0.5,
                  border: `1px solid ${active ? M3.outlineVariant : M3.outlineVariant}`,
                  cursor: active ? "pointer" : "not-allowed",
                }}
                onMouseEnter={e => { if (active) (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = active ? "0 1px 2px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)" : "none"; }}>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: active ? M3.primaryContainer : M3.surfaceContainerHigh }}>
                    <Icon size={18} color={active ? M3.primary : M3.onSurfaceVariant} />
                  </div>
                  {active
                    ? <ArrowUpRight size={16} color={M3.primary} />
                    : <Lock size={14} color={M3.onSurfaceVariant} />}
                </div>
                <div>
                  <div className="text-sm font-medium mb-0.5" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{m.label}</div>
                  <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{m.desc}</div>
                </div>
                {!active && (
                  <span className="text-xs px-2 py-0.5 rounded-full self-start"
                    style={{ backgroundColor: M3.surfaceContainerHigh, color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    Enable module in Settings
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Subscription Analytics ────────────────────────────────────────────────────
function SubscriptionAnalyticsPage({ onBack }: { onBack: () => void }) {
  const [range, setRange] = useState("6m");
  const [toast, setToast] = useState<ToastProps>({ message: "", type: "success", visible: false });
  const showToast = (msg: string, type: ToastProps["type"] = "success") => { setToast({ message: msg, type, visible: true }); setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000); };
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <TextButton onClick={onBack}>← Back to Analytics</TextButton>
        <div className="flex rounded-full overflow-hidden" style={{ border: `1px solid ${M3.outlineVariant}` }}>
          {["30d","3m","6m","12m"].map(r => (
            <button key={r} onClick={() => setRange(r)} className="px-4 py-2 text-sm"
              style={{ backgroundColor: range === r ? M3.primary : "transparent", color: range === r ? M3.onPrimary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Active Subs"    value="5,241"   trend="▲ +141 this mo"  trendUp icon={Repeat} />
        <KpiCard label="New This Month" value="580"     trend="▲ +5.1%"         trendUp icon={UserPlus} />
        <KpiCard label="Churn Rate"     value="2.4%"    trend="▼ -0.3%"         trendUp icon={TrendingDown} />
        <KpiCard label="Sub MRR"        value="$38,200" trend="▲ +7.8%"         trendUp icon={DollarSign} />
      </div>

      {/* Active subs trend */}
      <Card className="p-5">
        <SectionTitle>Subscription Trend — Active / New / Churned / Paused</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={subTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
            <YAxis tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Roboto, sans-serif" }} />
            <Line type="monotone" dataKey="active"  name="Active"  stroke={M3.success}   strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="new"     name="New"     stroke={M3.primary}   strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="churned" name="Churned" stroke={M3.error}     strokeWidth={2} dot={false} strokeDasharray="5 3" />
            <Line type="monotone" dataKey="paused"  name="Paused"  stroke={M3.info}      strokeWidth={2} dot={false} strokeDasharray="3 2" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 3fr" }}>
        {/* Plan mix donut */}
        <Card className="p-5">
          <SectionTitle>Plan Mix</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={subPlanMix} cx="50%" cy="50%" innerRadius={48} outerRadius={75} dataKey="value" paddingAngle={3}>
                {subPlanMix.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-3">
            {subPlanMix.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span style={{ color: M3.onSurfaceVariant }}>{d.name}</span>
                </div>
                <span className="font-medium" style={{ color: M3.onSurface }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue by product bar */}
        <Card className="p-5">
          <SectionTitle>Subscription Revenue by Product</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subRevenueByProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="product" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} width={100} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
              <Bar dataKey="revenue" name="Revenue" fill={M3.primary} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Churn risk table */}
      <Card className="p-5">
        <SectionTitle>Churn Risk — Past Due &amp; Expiring Soon</SectionTitle>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
              {["Customer", "Product", "Plan", "Status", "Days Overdue / Left", "Action"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                  style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { customer: "Emily Davis",    product: "SaaS Starter", plan: "Monthly", status: "past-due",  days: "8 days overdue" },
              { customer: "Tom Baker",      product: "Plugin Pro",   plan: "Annual",  status: "expiring",  days: "2 days left" },
              { customer: "Nina Patel",     product: "Theme Bundle", plan: "Annual",  status: "expiring",  days: "5 days left" },
              { customer: "Olivia Martinez",product: "Theme Bundle", plan: "Annual",  status: "suspended", days: "Suspended" },
            ].map((row, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.customer}</td>
                <td className="px-4 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: M3.secondaryContainer, color: M3.onSecondaryContainer, fontFamily: "Roboto, sans-serif" }}>{row.plan}</span></td>
                <td className="px-4 py-3"><StatusBadge status={row.status === "expiring" ? "pending" : row.status} /></td>
                <td className="px-4 py-3 text-xs font-medium" style={{ color: row.status === "past-due" ? M3.error : M3.warning, fontFamily: "Roboto, sans-serif" }}>{row.days}</td>
                <td className="px-4 py-3"><TextButton small onClick={() => showToast(`Reminder sent to ${row.customer}`, "success")}>Send Reminder</TextButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Affiliate Analytics ───────────────────────────────────────────────────────
function AffiliateAnalyticsPage({ onBack }: { onBack: () => void }) {
  const [range, setRange] = useState("6m");
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <TextButton onClick={onBack}>← Back to Analytics</TextButton>
        <div className="flex rounded-full overflow-hidden" style={{ border: `1px solid ${M3.outlineVariant}` }}>
          {["30d","3m","6m","12m"].map(r => (
            <button key={r} onClick={() => setRange(r)} className="px-4 py-2 text-sm"
              style={{ backgroundColor: range === r ? M3.primary : "transparent", color: range === r ? M3.onPrimary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Clicks"    value="5,840"   trend="▲ +12.3%"  trendUp icon={MousePointerClick} />
        <KpiCard label="Conversions"     value="712"     trend="▲ +11.2%"  trendUp icon={UserPlus} />
        <KpiCard label="Affiliate MRR"   value="$9,600"  trend="▲ +14.3%"  trendUp icon={DollarSign} />
        <KpiCard label="Avg Conv. Rate"  value="12.2%"   trend="▲ +0.4%"   trendUp icon={Activity} />
      </div>

      {/* Click + conversion trend */}
      <Card className="p-5">
        <SectionTitle>Clicks, Sign-ups &amp; Revenue — 6 months</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={affiliateTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Roboto, sans-serif" }} />
            <Line yAxisId="left"  type="monotone" dataKey="clicks"  name="Clicks"   stroke={M3.secondary} strokeWidth={2} dot={false} />
            <Line yAxisId="left"  type="monotone" dataKey="signups" name="Sign-ups" stroke={M3.primary}   strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue"  stroke={M3.success}   strokeWidth={2} dot={false} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
        {/* Top affiliates table */}
        <Card className="p-5">
          <SectionTitle>Top Affiliates by Revenue</SectionTitle>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                {["Affiliate", "Clicks", "Conversions", "Revenue", "Conv. Rate"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium"
                    style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topAffiliates.map((row, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${M3.outlineVariant}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerLow; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                  <td className="px-3 py-3 text-sm font-medium" style={{ color: M3.primary, fontFamily: "Roboto, sans-serif" }}>{row.name}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.clicks.toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.conversions}</td>
                  <td className="px-3 py-3 text-sm font-medium" style={{ color: M3.success, fontFamily: "Roboto Mono, monospace" }}>{row.revenue}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: M3.successContainer, color: M3.success, fontFamily: "Roboto, sans-serif" }}>{row.rate}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Conversion funnel */}
        <Card className="p-5">
          <SectionTitle>Conversion Funnel</SectionTitle>
          <div className="flex flex-col gap-2 mt-2">
            {affiliateConversionFunnel.map((step, i) => {
              const pct = Math.round((step.value / affiliateConversionFunnel[0].value) * 100);
              return (
                <div key={step.name}>
                  <div className="flex items-center justify-between text-xs mb-1" style={{ fontFamily: "Roboto, sans-serif" }}>
                    <span style={{ color: M3.onSurfaceVariant }}>{step.name}</span>
                    <span className="font-medium" style={{ color: M3.onSurface }}>{step.value.toLocaleString()} <span style={{ color: M3.onSurfaceVariant }}>({pct}%)</span></span>
                  </div>
                  <div className="h-6 rounded-lg overflow-hidden" style={{ backgroundColor: M3.surfaceContainerHigh }}>
                    <div className="h-full rounded-lg flex items-center px-2 transition-all"
                      style={{ width: `${pct}%`, backgroundColor: i === 0 ? M3.primary : i === 1 ? M3.secondary : i === 2 ? M3.info : M3.success, minWidth: 32 }}>
                      <span className="text-xs font-medium text-white">{pct}%</span>
                    </div>
                  </div>
                  {i < affiliateConversionFunnel.length - 1 && (
                    <div className="flex justify-center my-0.5">
                      <ChevronDown size={14} color={M3.outlineVariant} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Abandoned Cart Analytics ──────────────────────────────────────────────────
function AbandonedCartAnalyticsPage({ onBack }: { onBack: () => void }) {
  const [range, setRange] = useState("6m");
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <TextButton onClick={onBack}>← Back to Analytics</TextButton>
        <div className="flex rounded-full overflow-hidden" style={{ border: `1px solid ${M3.outlineVariant}` }}>
          {["30d","3m","6m","12m"].map(r => (
            <button key={r} onClick={() => setRange(r)} className="px-4 py-2 text-sm"
              style={{ backgroundColor: range === r ? M3.primary : "transparent", color: range === r ? M3.onPrimary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Abandoned Carts"   value="1,340"   trend="▲ +4.7%"   trendUp={false} icon={ShoppingCart} />
        <KpiCard label="Recovered"         value="430"     trend="▲ +10.3%"  trendUp icon={CheckCircle} />
        <KpiCard label="Recovery Rate"     value="32.1%"   trend="▲ +1.8%"   trendUp icon={Activity} />
        <KpiCard label="Recovered Revenue" value="$6,450"  trend="▲ +10.3%"  trendUp icon={DollarSign} />
      </div>

      {/* Abandoned vs recovered trend */}
      <Card className="p-5">
        <SectionTitle>Abandoned vs. Recovered Carts — 6 months</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={cartTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Roboto, sans-serif" }} />
            <Bar yAxisId="left"  dataKey="abandoned" name="Abandoned" fill={`${M3.error}80`}   radius={[4,4,0,0]} />
            <Bar yAxisId="left"  dataKey="recovered" name="Recovered" fill={M3.success}         radius={[4,4,0,0]} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue ($)" stroke={M3.primary} strokeWidth={2} dot={false} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
        {/* Top abandoned products */}
        <Card className="p-5">
          <SectionTitle>Top Abandoned Products</SectionTitle>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                {["Product", "Carts", "Cart Value", "Recovery Rate"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium"
                    style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topAbandonedProducts.map((row, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${M3.outlineVariant}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerLow; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                  <td className="px-3 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</td>
                  <td className="px-3 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.carts}</td>
                  <td className="px-3 py-3 text-sm" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.value}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: M3.outlineVariant, maxWidth: 60 }}>
                        <div className="h-full rounded-full" style={{ width: row.recoveryRate, backgroundColor: M3.success }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: M3.success, fontFamily: "Roboto, sans-serif" }}>{row.recoveryRate}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Email sequence performance */}
        <Card className="p-5">
          <SectionTitle>Email Sequence Performance</SectionTitle>
          <div className="flex flex-col gap-4">
            {emailSeqPerf.map((seq, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: M3.surfaceContainerLow }}>
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={14} color={M3.primary} />
                  <span className="text-xs font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{seq.seq}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    { label: "Sent",      value: seq.sent,      color: M3.onSurfaceVariant },
                    { label: "Opened",    value: seq.opened,    color: M3.info },
                    { label: "Clicked",   value: seq.clicked,   color: M3.primary },
                    { label: "Recovered", value: seq.recovered, color: M3.success },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{stat.label}</span>
                      <span className="text-xs font-medium" style={{ color: stat.color, fontFamily: "Roboto Mono, monospace" }}>{stat.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Customer Detail Page ──────────────────────────────────────────────────────
function CustomerDetailPage({ onBack, onLicenseDetail }: { onBack: () => void; onLicenseDetail: () => void }) {
  const c = CUSTOMER_SARAH;
  const [tab, setTab]           = useState<"overview" | "licenses" | "subscriptions" | "downloads" | "activity">("overview");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [note, setNote]         = useState(c.notes);
  const [editingNote, setEditingNote] = useState(false);
  const [customerStatus, setCustomerStatus] = useState<"active" | "suspended" | "deleted">("active");
  const [licenses, setLicenses] = useState(c.licenses);
  const [subs, setSubs]         = useState(c.subscriptions);
  const [toast, setToast]       = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]     = useState<{ open: boolean; title: string; body: React.ReactNode; confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });
  const [editOpen, setEditOpen]         = useState(false);
  const [issueLicenseOpen, setIssueLicenseOpen] = useState(false);

  // Issue New License form state
  const [ilProduct, setIlProduct]   = useState("Plugin Pro");
  const [ilPlan, setIlPlan]         = useState<"Annual" | "Monthly" | "Lifetime">("Annual");
  const [ilSites, setIlSites]       = useState("1");
  const [ilExpiry, setIlExpiry]     = useState("365");
  const [ilSendEmail, setIlSendEmail] = useState(true);
  const [ilNotes, setIlNotes]       = useState("");

  const ISSUE_PRODUCTS = ["Plugin Pro", "Theme Bundle", "SaaS Connector", "Security Module", "Analytics Add-on", "Update Manager"];
  const ISSUE_PLANS    = ["Monthly", "Annual", "Lifetime"] as const;
  const planDays: Record<string, string> = { Monthly: "30", Annual: "365", Lifetime: "" };

  const showToast  = (msg: string, type: ToastProps["type"] = "success") => { setToast({ message: msg, type, visible: true }); setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000); };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));
  const handleCopy = (key: string) => { setCopiedKey(key); navigator.clipboard?.writeText(key); setTimeout(() => setCopiedKey(null), 1500); showToast("License key copied", "info"); };

  const moreMenuActions: ActionItem[] = [
    { label: "Copy Customer ID",        icon: Copy,         onClick: () => { navigator.clipboard?.writeText(c.id); showToast("Customer ID copied", "info"); } },
    { label: "View All Orders",         icon: FileText,     onClick: () => showToast("Order history opened", "info") },
    { label: "Send Password Reset",     icon: RotateCcw,    onClick: () => showToast(`Password reset email sent to ${c.email}`, "success") },
    { label: "Apply Account Credit",    icon: DollarSign,   onClick: () => showToast("Credit applied to account", "success"), dividerBefore: true },
    { label: "Merge Customer Record",   icon: Users,        onClick: () => showToast("Merge dialog coming soon", "info") },
    { label: "Export Customer Data",    icon: DownloadIcon, onClick: () => showToast("Customer data export queued", "info"), dividerBefore: true },
  ];

  const tabs = [
    { id: "overview"       as const, label: "Overview" },
    { id: "licenses"       as const, label: `Licenses (${c.licenses.length})` },
    { id: "subscriptions"  as const, label: `Subscriptions (${c.subscriptions.length})` },
    { id: "downloads"      as const, label: `Downloads (${c.downloads.length})` },
    { id: "activity"       as const, label: "Activity" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Hero header ── */}
      <Card className="overflow-hidden">
        {/* Purple band */}
        <div className="h-24 w-full" style={{ background: `linear-gradient(135deg, ${M3.primary} 0%, #9C82DB 100%)` }} />

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between" style={{ marginTop: -36 }}>
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl text-2xl font-semibold border-4 border-white shadow-sm"
                style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>
                {c.avatar}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{c.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: M3.successContainer, color: M3.success, fontFamily: "Roboto, sans-serif" }}>Active</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-sm flex items-center gap-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    <Mail size={12} />{c.email}
                  </span>
                  <span className="text-sm flex items-center gap-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    <MapPin size={12} />{c.flag} {c.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pb-1">
              <OutlinedButton small onClick={() => showToast(`Email composer opened for ${c.email}`, "info")}><Mail size={14} /> Send Email</OutlinedButton>
              <TonalButton small onClick={() => setEditOpen(e => !e)}><Edit3 size={14} /> Edit Customer</TonalButton>
              <ActionDropdown actions={moreMenuActions} />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
            {[
              { icon: Hash,        label: "Customer ID",   value: c.id },
              { icon: Calendar,    label: "Joined",        value: c.joinDate },
              { icon: Clock,       label: "Last Active",   value: c.lastActive },
              { icon: Globe,       label: "Website",       value: c.website },
              { icon: Phone,       label: "Phone",         value: c.phone },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-1.5">
                <m.icon size={13} color={M3.onSurfaceVariant} />
                <div>
                  <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{m.label}</div>
                  <div className="text-xs font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{m.value}</div>
                </div>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {c.tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: M3.secondaryContainer, color: M3.onSecondaryContainer, fontFamily: "Roboto, sans-serif" }}>
                  <Tag size={10} />{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: "Lifetime Value",       value: c.ltv,                color: M3.success,  bg: M3.successContainer },
          { icon: Key,        label: "Active Licenses",      value: String(c.licenses.filter(l => l.status === "active").length), color: M3.primary,  bg: M3.primaryContainer },
          { icon: Repeat,     label: "Active Subscriptions", value: String(c.subscriptions.filter(s => s.status === "active").length), color: M3.info, bg: M3.infoContainer },
          { icon: Download,   label: "Total Downloads",      value: String(c.downloads.length), color: M3.secondary, bg: M3.secondaryContainer },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: s.bg }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div className="text-2xl font-light" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{s.value}</div>
              <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Card className="flex flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="flex" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all"
              style={{
                color: tab === t.id ? M3.primary : M3.onSurfaceVariant,
                borderBottom: tab === t.id ? `2px solid ${M3.primary}` : "2px solid transparent",
                background: "none", border: "none",
                borderBottom: tab === t.id ? `2px solid ${M3.primary}` : "2px solid transparent",
                cursor: "pointer", fontFamily: "Roboto, sans-serif",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {tab === "overview" && (
          <div className="p-6 grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Spend chart */}
            <div>
              <div className="font-medium text-sm mb-3" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Spend History — 12 months</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={c.spendHistory}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={M3.primary} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={M3.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: M3.onSurfaceVariant }} />
                  <YAxis tick={{ fontSize: 10, fill: M3.onSurfaceVariant }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: number) => `$${v}`} contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif", fontSize: 12 }} />
                  <Area type="monotone" dataKey="spend" name="Spend" stroke={M3.primary} fill="url(#spendGrad)" strokeWidth={2} dot={(props: any) => props.payload.spend > 0 ? <circle cx={props.cx} cy={props.cy} r={3} fill={M3.primary} /> : <g />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick facts */}
            <div className="flex flex-col gap-3">
              <div className="font-medium text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Account Summary</div>
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: M3.surfaceContainerLow }}>
                {[
                  { label: "Total Spent",       value: c.totalSpent },
                  { label: "Orders",            value: String(c.ordersCount) },
                  { label: "Avg Order Value",   value: `$${(842 / 9).toFixed(2)}` },
                  { label: "First Purchase",    value: "Jun 3, 2022" },
                  { label: "Last Purchase",     value: "Dec 30, 2024" },
                  { label: "Support Tickets",   value: "2 (all resolved)" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.label}</span>
                    <span className="text-xs font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal note — full width */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Internal Note</div>
                <TextButton onClick={() => setEditingNote(e => !e)}>
                  <Edit3 size={12} /> {editingNote ? "Save" : "Edit"}
                </TextButton>
              </div>
              {editingNote ? (
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full p-3 rounded-xl text-sm resize-none outline-none"
                  rows={3}
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.primary}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif", boxSizing: "border-box" }}
                />
              ) : (
                <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: M3.surfaceContainerLow, color: note ? M3.onSurface : M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                  {note || "No notes yet. Click Edit to add one."}
                </div>
              )}
            </div>

            {/* Danger zone */}
            <div className="col-span-2 pt-2" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <div className="font-medium text-sm mb-3" style={{ color: M3.error, fontFamily: "Roboto, sans-serif" }}>Danger Zone</div>
              <div className="flex items-center gap-3">
                <OutlinedButton danger small
                  onClick={() => openDialog({ open: true, danger: true, icon: Ban,
                    title: customerStatus === "suspended" ? "Reinstate Account?" : "Suspend Account?",
                    body: customerStatus === "suspended"
                      ? <span>Restore full access for <strong>{c.name}</strong>?</span>
                      : <span>Suspend <strong>{c.name}</strong>? They will lose access to all downloads and portal features immediately.</span>,
                    confirmLabel: customerStatus === "suspended" ? "Reinstate" : "Suspend Account",
                    onConfirm: () => { setCustomerStatus(s => s === "suspended" ? "active" : "suspended"); showToast(customerStatus === "suspended" ? `${c.name} reinstated` : `${c.name} suspended`, customerStatus === "suspended" ? "success" : "warning"); closeDialog(); } })}>
                  <Ban size={14} /> {customerStatus === "suspended" ? "Reinstate Account" : "Suspend Account"}
                </OutlinedButton>
                <OutlinedButton danger small
                  onClick={() => openDialog({ open: true, danger: true, icon: ShieldCheck,
                    title: "Revoke All Licenses?",
                    body: <span>Revoke all <strong>{licenses.filter(l => l.status === "active").length} active licenses</strong> for <strong>{c.name}</strong>? All site activations will be immediately invalidated.</span>,
                    confirmLabel: "Revoke All",
                    onConfirm: () => { setLicenses(ls => ls.map(l => ({ ...l, status: "revoked" }))); showToast(`All licenses revoked for ${c.name}`, "error"); closeDialog(); } })}>
                  <ShieldCheck size={14} /> Revoke All Licenses
                </OutlinedButton>
                <OutlinedButton danger small
                  onClick={() => openDialog({ open: true, danger: true, icon: Trash2,
                    title: "Delete Customer?",
                    body: <span>Permanently delete <strong>{c.name}</strong> and all associated data? This cannot be undone. Their licenses will be revoked and subscriptions cancelled.</span>,
                    confirmLabel: "Delete Customer",
                    onConfirm: () => { showToast(`${c.name} deleted — redirecting…`, "error"); closeDialog(); setTimeout(onBack, 1200); } })}>
                  <Trash2 size={14} /> Delete Customer
                </OutlinedButton>
              </div>
              {customerStatus === "suspended" && (
                <div className="mt-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2" style={{ backgroundColor: M3.warningContainer, color: M3.warning, fontFamily: "Roboto, sans-serif" }}>
                  <AlertCircle size={13} /> This account is currently suspended.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Licenses tab ── */}
        {tab === "licenses" && (
          <div>
            {/* ── Licenses toolbar ── */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <span className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
                All Licenses
                <span className="ml-2 text-xs font-normal" style={{ color: M3.onSurfaceVariant }}>
                  {licenses.filter(l => l.status === "active").length} active / {licenses.length} total
                </span>
              </span>
              <FilledButton small onClick={() => setIssueLicenseOpen(o => !o)}>
                <Key size={14} /> Issue New License
              </FilledButton>
            </div>

            {/* ── Issue New License form panel ── */}
            {issueLicenseOpen && (
              <div style={{ borderBottom: `2px solid ${M3.primary}` }}>
                {/* Panel header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: M3.primaryContainer }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: M3.primary }}>
                      <Key size={16} color={M3.onPrimary} />
                    </div>
                    <div>
                      <div className="font-medium text-sm" style={{ color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>
                        Issue New License — {c.name}
                      </div>
                      <div className="text-xs" style={{ color: M3.onPrimaryContainer, opacity: 0.7, fontFamily: "Roboto, sans-serif" }}>
                        A unique license key is generated automatically. The customer will be notified if email is enabled.
                      </div>
                    </div>
                  </div>
                  <IconButton icon={XCircle} onClick={() => setIssueLicenseOpen(false)} />
                </div>

                {/* Form body */}
                <div className="p-6 grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>

                  {/* Left column */}
                  <div className="flex flex-col gap-4">
                    {/* Product */}
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Product *</div>
                      <select value={ilProduct} onChange={e => setIlProduct(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
                        {ISSUE_PRODUCTS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>

                    {/* Plan */}
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Plan / Billing Cycle *</div>
                      <div className="flex gap-2">
                        {ISSUE_PLANS.map(p => (
                          <button key={p} onClick={() => { setIlPlan(p); setIlExpiry(planDays[p]); }}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={{
                              backgroundColor: ilPlan === p ? M3.primary : M3.surfaceContainerLow,
                              color: ilPlan === p ? M3.onPrimary : M3.onSurfaceVariant,
                              border: `1.5px solid ${ilPlan === p ? M3.primary : M3.outlineVariant}`,
                              cursor: "pointer", fontFamily: "Roboto, sans-serif",
                            }}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Site activations */}
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Max Site Activations</div>
                      <div className="flex items-center gap-3">
                        <input type="number" min={1} max={100} value={ilSites} onChange={e => setIlSites(e.target.value)}
                          className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none text-center"
                          style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.primary}`, color: M3.primary, fontFamily: "Roboto Mono, monospace" }} />
                        <span className="text-sm" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>site(s)</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {["1","3","5","10","25"].map(n => (
                          <button key={n} onClick={() => setIlSites(n)}
                            className="flex-1 py-1 rounded-full text-xs transition-all"
                            style={{ backgroundColor: ilSites === n ? M3.primary : M3.surfaceContainerHigh, color: ilSites === n ? M3.onPrimary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Expiry */}
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Validity (days) {ilPlan === "Lifetime" && <span style={{ color: M3.success }}>— Lifetime (no expiry)</span>}
                      </div>
                      <input type="number" min={1} value={ilPlan === "Lifetime" ? "" : ilExpiry}
                        onChange={e => setIlExpiry(e.target.value)}
                        disabled={ilPlan === "Lifetime"}
                        placeholder={ilPlan === "Lifetime" ? "Lifetime" : "e.g. 365"}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ backgroundColor: ilPlan === "Lifetime" ? M3.surfaceContainerHigh : M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: ilPlan === "Lifetime" ? M3.onSurfaceVariant : M3.onSurface, fontFamily: "Roboto Mono, monospace" }} />
                      {ilPlan !== "Lifetime" && ilExpiry && (
                        <div className="text-xs mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                          Expires: {new Date(Date.now() + parseInt(ilExpiry) * 86400000).toISOString().split("T")[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="flex flex-col gap-4">
                    {/* Notes */}
                    <div className="flex-1">
                      <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Internal Notes (optional)</div>
                      <textarea value={ilNotes} onChange={e => setIlNotes(e.target.value)}
                        placeholder="e.g. Replacement for expired license, courtesy license for enterprise account…"
                        rows={5}
                        className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
                        style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif", lineHeight: 1.6 }} />
                    </div>

                    {/* Send email toggle */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Email license to customer</div>
                        <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                          Sends key + activation instructions to {c.email}
                        </div>
                      </div>
                      <Toggle on={ilSendEmail} onChange={setIlSendEmail} />
                    </div>

                    {/* Preview card */}
                    <div className="p-4 rounded-xl flex flex-col gap-2" style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}` }}>
                      <div className="text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>License Preview</div>
                      <div className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                        <span style={{ color: M3.onSurfaceVariant }}>Customer</span>
                        <span style={{ color: M3.onSurface, fontWeight: 500 }}>{c.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                        <span style={{ color: M3.onSurfaceVariant }}>Product</span>
                        <span style={{ color: M3.onSurface, fontWeight: 500 }}>{ilProduct}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                        <span style={{ color: M3.onSurfaceVariant }}>Plan</span>
                        <span style={{ color: M3.onSurface, fontWeight: 500 }}>{ilPlan}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                        <span style={{ color: M3.onSurfaceVariant }}>Sites</span>
                        <span style={{ color: M3.onSurface, fontWeight: 500 }}>0 / {ilSites}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                        <span style={{ color: M3.onSurfaceVariant }}>Expires</span>
                        <span style={{ color: ilPlan === "Lifetime" ? M3.success : M3.onSurface, fontWeight: 500 }}>
                          {ilPlan === "Lifetime" ? "Lifetime" : ilExpiry ? new Date(Date.now() + parseInt(ilExpiry) * 86400000).toISOString().split("T")[0] : "—"}
                        </span>
                      </div>
                      <div className="pt-2 mt-1" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
                        <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>License Key (auto-generated)</div>
                        <div className="text-xs font-medium mt-0.5" style={{ color: M3.primary, fontFamily: "Roboto Mono, monospace" }}>WDD-XXXX-XXXX-XXXX</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel footer */}
                <div className="flex items-center justify-between px-6 py-4"
                  style={{ borderTop: `1px solid ${M3.outlineVariant}`, backgroundColor: M3.surfaceContainerLow }}>
                  <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    {ilSendEmail
                      ? <span>✓ License key will be emailed to <strong>{c.email}</strong></span>
                      : <span>⚠ No email — customer must receive key manually</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <TextButton onClick={() => setIssueLicenseOpen(false)}>Cancel</TextButton>
                    <TonalButton small onClick={() => {
                      if (!ilProduct || !ilSites) { showToast("Select a product and site count", "error"); return; }
                      const key = `WDD-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
                      const newLic = {
                        id: Date.now(),
                        key,
                        product: ilProduct,
                        plan: ilPlan,
                        sites: `0/${ilSites}`,
                        status: "active",
                        expires: ilPlan === "Lifetime" ? "Lifetime" : new Date(Date.now() + parseInt(ilExpiry) * 86400000).toISOString().split("T")[0],
                        created: new Date().toISOString().split("T")[0],
                      };
                      setLicenses(ls => [newLic, ...ls]);
                      if (ilSendEmail) showToast(`License issued for ${ilProduct} — key emailed to ${c.email}`, "success");
                      else showToast(`License issued for ${ilProduct} — key: ${key}`, "success");
                      setIssueLicenseOpen(false);
                      setIlProduct("Plugin Pro"); setIlPlan("Annual"); setIlSites("1"); setIlExpiry("365"); setIlNotes(""); setIlSendEmail(true);
                    }}>
                      Issue License Only
                    </TonalButton>
                    <FilledButton small onClick={() => {
                      if (!ilProduct || !ilSites) { showToast("Select a product and site count", "error"); return; }
                      const key = `WDD-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
                      const newLic = {
                        id: Date.now(),
                        key,
                        product: ilProduct,
                        plan: ilPlan,
                        sites: `0/${ilSites}`,
                        status: "active",
                        expires: ilPlan === "Lifetime" ? "Lifetime" : new Date(Date.now() + parseInt(ilExpiry) * 86400000).toISOString().split("T")[0],
                        created: new Date().toISOString().split("T")[0],
                      };
                      setLicenses(ls => [newLic, ...ls]);
                      showToast(`License issued & ${ilSendEmail ? "email sent to " + c.email : "ready to copy"}`, "success");
                      setIssueLicenseOpen(false);
                      setIlProduct("Plugin Pro"); setIlPlan("Annual"); setIlSites("1"); setIlExpiry("365"); setIlNotes(""); setIlSendEmail(true);
                    }}>
                      <Key size={14} /> Issue &amp; {ilSendEmail ? "Email Customer" : "Copy Key"}
                    </FilledButton>
                  </div>
                </div>
              </div>
            )}

            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["License Key", "Product", "Plan", "Sites", "Status", "Created", "Expires", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {licenses.map((lic, i) => {
                  const [used, max] = lic.sites.split("/").map(Number);
                  return (
                    <tr key={lic.id}
                      style={{ backgroundColor: i % 2 === 0 ? M3.surface : M3.surfaceContainerLow, borderTop: `1px solid ${M3.outlineVariant}` }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ fontFamily: "Roboto Mono, monospace", color: M3.onSurface }}>
                            {lic.key.substring(0, 16)}…
                          </span>
                          <button onClick={() => handleCopy(lic.key)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} className="opacity-40 hover:opacity-100 transition-opacity">
                            {copiedKey === lic.key ? <Check size={12} color={M3.success} /> : <Copy size={12} color={M3.onSurfaceVariant} />}
                          </button>
                          <button onClick={onLicenseDetail} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} className="opacity-40 hover:opacity-100 transition-opacity" title="View license detail">
                            <ExternalLink size={12} color={M3.primary} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{lic.product}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: M3.secondaryContainer, color: M3.onSecondaryContainer, fontFamily: "Roboto, sans-serif" }}>{lic.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs mb-0.5" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{lic.sites}</div>
                        <div className="h-1 rounded-full" style={{ width: 40, backgroundColor: M3.outlineVariant }}>
                          <div className="h-full rounded-full" style={{ width: `${(used / max) * 100}%`, backgroundColor: lic.status === "active" ? M3.primary : M3.outlineVariant }} />
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={lic.status} /></td>
                      <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{lic.created}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: lic.expires === "Lifetime" ? M3.success : M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{lic.expires}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <TextButton small danger disabled={lic.status === "revoked"}
                            onClick={() => openDialog({ open: true, danger: true, icon: XCircle,
                              title: "Revoke License?",
                              body: <span>Revoke <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{lic.key.substring(0,16)}…</strong> ({lic.product})? This cannot be undone.</span>,
                              confirmLabel: "Revoke",
                              onConfirm: () => { setLicenses(ls => ls.map(l => l.id === lic.id ? { ...l, status: "revoked" } : l)); showToast(`${lic.product} license revoked`, "error"); closeDialog(); } })}>
                            <XCircle size={12} /> Revoke
                          </TextButton>
                          <TextButton small disabled={lic.expires === "Lifetime" || lic.status === "revoked"}
                            onClick={() => openDialog({ open: true, danger: false, icon: Calendar,
                              title: "Extend Expiry?",
                              body: <span>Add 12 months to <strong>{lic.product}</strong>?</span>,
                              confirmLabel: "Extend +12 months",
                              onConfirm: () => { showToast(`${lic.product} expiry extended`, "success"); closeDialog(); } })}>
                            <RefreshCw size={12} /> Extend
                          </TextButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Subscriptions tab ── */}
        {tab === "subscriptions" && (
          <div>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <span className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Subscription History</span>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["ID", "Product", "Amount", "Billing Cycle", "Status", "Started", "Next Payment", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.subscriptions.map((sub, i) => (
                  <tr key={sub.id}
                    style={{ backgroundColor: i % 2 === 0 ? M3.surface : M3.surfaceContainerLow, borderTop: `1px solid ${M3.outlineVariant}` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{sub.id}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{sub.product}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{sub.amount}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: M3.surfaceContainerHigh, color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{sub.cycle}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{sub.started}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{sub.nextPayment}</td>
                    <td className="px-4 py-3">
                      {(sub.status === "active" || sub.status === "paused") && (
                        <div className="flex items-center gap-1">
                          {sub.status === "active" && (
                            <TextButton small onClick={() => openDialog({ open: true, danger: false, icon: PauseCircle,
                              title: "Pause Subscription?",
                              body: <span>Pause <strong>{sub.product}</strong> for {c.name}? Billing stops until resumed.</span>,
                              confirmLabel: "Pause",
                              onConfirm: () => { setSubs(ss => ss.map(s => s.id === sub.id ? { ...s, status: "paused", nextPayment: "—" } : s)); showToast(`${sub.product} paused`, "warning"); closeDialog(); } })}>
                              <PauseCircle size={12} /> Pause
                            </TextButton>
                          )}
                          {sub.status === "paused" && (
                            <TextButton small onClick={() => { setSubs(ss => ss.map(s => s.id === sub.id ? { ...s, status: "active", nextPayment: "2025-02-15" } : s)); showToast(`${sub.product} resumed`, "success"); }}>
                              <CheckCircle size={12} /> Resume
                            </TextButton>
                          )}
                          <TextButton small danger onClick={() => openDialog({ open: true, danger: true, icon: XCircle,
                            title: "Cancel Subscription?",
                            body: <span>Cancel <strong>{sub.product}</strong> ({sub.amount}) for <strong>{c.name}</strong>? Billing will stop immediately.</span>,
                            confirmLabel: "Cancel Subscription",
                            onConfirm: () => { setSubs(ss => ss.map(s => s.id === sub.id ? { ...s, status: "cancelled", nextPayment: "—" } : s)); showToast(`${sub.product} cancelled`, "error"); closeDialog(); } })}>
                            <XCircle size={12} /> Cancel
                          </TextButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Downloads tab ── */}
        {tab === "downloads" && (
          <div>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <span className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Download History</span>
              <OutlinedButton small onClick={() => showToast("Download log exported as CSV", "success")}><DownloadIcon size={14} /> Export Log</OutlinedButton>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["Product", "Version", "File Size", "IP Address", "Country", "Date", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.downloads.map((dl, i) => (
                  <tr key={i}
                    style={{ backgroundColor: i % 2 === 0 ? M3.surface : M3.surfaceContainerLow, borderTop: `1px solid ${M3.outlineVariant}` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{dl.product}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto Mono, monospace" }}>{dl.version}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{dl.size}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{dl.ip}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span>{dl.flag}</span>
                        <span className="text-xs" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{dl.country}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{dl.date}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs" style={{ color: M3.success, fontFamily: "Roboto, sans-serif" }}>
                        <CheckCircle size={12} /> Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Activity tab ── */}
        {tab === "activity" && (
          <div className="p-6">
            <div className="font-medium text-sm mb-5" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Full Event Timeline</div>
            <div className="flex flex-col">
              {c.events.map((evt, i) => {
                const Icon = evt.icon;
                return (
                  <div key={i} className="flex gap-4">
                    {/* Spine */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full"
                        style={{ backgroundColor: `${evt.color}18`, border: `1.5px solid ${evt.color}50` }}>
                        <Icon size={14} color={evt.color} />
                      </div>
                      {i < c.events.length - 1 && <div className="w-px flex-1 my-1.5" style={{ backgroundColor: M3.outlineVariant, minHeight: 20 }} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-5 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{evt.desc}</div>
                          <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{evt.time}</div>
                        </div>
                        {evt.meta && (
                          <span className="text-sm font-semibold flex-shrink-0" style={{ color: M3.success, fontFamily: "Roboto Mono, monospace" }}>{evt.meta}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Edit Customer slide-over panel */}
      {editOpen && (
        <Card className="p-6 flex flex-col gap-4" style={{ border: `2px solid ${M3.primary}` }}>
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Edit Customer Details</div>
            <IconButton icon={XCircle} onClick={() => setEditOpen(false)} />
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {[
              { label: "Full Name",   defaultValue: c.name },
              { label: "Email",       defaultValue: c.email },
              { label: "Phone",       defaultValue: c.phone },
              { label: "Website",     defaultValue: c.website },
              { label: "Location",    defaultValue: c.location },
            ].map(f => (
              <div key={f.label}>
                <div className="text-xs font-medium mb-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{f.label}</div>
                <input defaultValue={f.defaultValue} className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <FilledButton small onClick={() => { setEditOpen(false); showToast("Customer details saved", "success"); }}>Save Changes</FilledButton>
            <TextButton onClick={() => setEditOpen(false)}>Cancel</TextButton>
          </div>
        </Card>
      )}

      <ConfirmDialog open={dialog.open} title={dialog.title} body={dialog.body} confirmLabel={dialog.confirmLabel} danger={dialog.danger} icon={dialog.icon} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Downloads Page ────────────────────────────────────────────────────────────
function DownloadsPage() {
  const [search, setSearch]       = useState("");
  const [tableData, setTableData] = useState(downloadsData);
  const [filterProduct, setFilterProduct] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [filterStatus, setFilterStatus]   = useState("All");
  const [filterDate, setFilterDate]       = useState("All");
  const [toast, setToast]         = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]       = useState<{
    open: boolean; title: string; body: React.ReactNode;
    confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void;
  }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });

  const showToast  = (msg: string, type: ToastProps["type"] = "info") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));

  const setValid = (id: number, valid: boolean) =>
    setTableData(rows => rows.map(r => r.id === id ? { ...r, valid } : r));
  const deleteRow = (id: number) =>
    setTableData(rows => rows.filter(r => r.id !== id));

  const filtered = tableData.filter(r => {
    const matchSearch  = !search || r.customer.toLowerCase().includes(search.toLowerCase()) || r.product.toLowerCase().includes(search.toLowerCase()) || r.ip.includes(search) || r.country.toLowerCase().includes(search.toLowerCase());
    const matchProduct = filterProduct === "All" || r.product === filterProduct;
    const matchCountry = filterCountry === "All" || r.country === filterCountry;
    const matchStatus  = filterStatus  === "All" || (filterStatus === "Valid" ? r.valid : !r.valid);
    const matchDate    = filterDate    === "All" || isInDateRange(r.date, filterDate);
    return matchSearch && matchProduct && matchCountry && matchStatus && matchDate;
  });

  const rowActions = (row: typeof tableData[0]): ActionItem[] => [
    // ── Info / navigation ───────────────────────────────────────────
    {
      label: "View License Detail",
      icon: Key,
      onClick: () => showToast(`License ${row.license} opened`, "info"),
    },
    {
      label: "View Customer Profile",
      icon: Users,
      onClick: () => showToast(`Customer profile for ${row.customer} opened`, "info"),
    },

    // ── Clipboard ───────────────────────────────────────────────────
    {
      label: "Copy IP Address",
      icon: Copy,
      dividerBefore: true,
      onClick: () => {
        navigator.clipboard?.writeText(row.ip);
        showToast(`IP ${row.ip} copied to clipboard`, "info");
      },
    },
    {
      label: "Copy License Key",
      icon: Copy,
      onClick: () => {
        navigator.clipboard?.writeText(row.license);
        showToast("License key copied to clipboard", "info");
      },
    },
    {
      label: "Copy Download URL",
      icon: Copy,
      onClick: () => {
        navigator.clipboard?.writeText(`https://cdn.example.com/${row.product.toLowerCase().replace(/ /g, "-")}/${row.version}.zip`);
        showToast("Download URL copied to clipboard", "info");
      },
    },

    // ── Validation ──────────────────────────────────────────────────
    ...(row.valid
      ? [{
          label: "Mark as Invalid",
          icon: XCircle,
          dividerBefore: true,
          onClick: () => openDialog({
            open: true, danger: true, icon: XCircle,
            title: "Mark Download as Invalid?",
            body: (
              <span>
                Mark this download by <strong>{row.customer}</strong> ({row.product}) as
                invalid? The record will be flagged for security review.
              </span>
            ),
            confirmLabel: "Mark Invalid",
            onConfirm: () => { setValid(row.id, false); showToast("Download marked as invalid", "warning"); closeDialog(); },
          }),
        }]
      : [{
          label: "Mark as Valid",
          icon: CheckCircle,
          dividerBefore: true,
          onClick: () => openDialog({
            open: true, danger: false, icon: CheckCircle,
            title: "Mark Download as Valid?",
            body: (
              <span>
                Clear the invalid flag on this download by <strong>{row.customer}</strong>?
              </span>
            ),
            confirmLabel: "Mark Valid",
            onConfirm: () => { setValid(row.id, true); showToast("Download marked as valid", "success"); closeDialog(); },
          }),
        }]
    ),

    // ── Security / destructive ──────────────────────────────────────
    {
      label: "Block IP (24 hours)",
      icon: Ban,
      danger: true,
      dividerBefore: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: Ban,
        title: "Block IP Address?",
        body: (
          <span>
            Block <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong>{" "}
            ({row.country}) for 24 hours? All requests from this IP will be rejected.
          </span>
        ),
        confirmLabel: "Block for 24 hours",
        onConfirm: () => { showToast(`${row.ip} blocked for 24 hours`, "error"); closeDialog(); },
      }),
    },
    {
      label: "Block IP Permanently",
      icon: Ban,
      danger: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: Ban,
        title: "Permanently Block IP?",
        body: (
          <span>
            Permanently block <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong>?
            This will add it to the permanent blocklist. You can remove it from the Security page.
          </span>
        ),
        confirmLabel: "Block Permanently",
        onConfirm: () => { showToast(`${row.ip} permanently blocked`, "error"); closeDialog(); },
      }),
    },
    {
      label: "Flag as Suspicious",
      icon: AlertCircle,
      danger: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: AlertCircle,
        title: "Flag as Suspicious?",
        body: (
          <span>
            Flag this download by <strong>{row.customer}</strong> for security review?
            An alert will be sent to the security team.
          </span>
        ),
        confirmLabel: "Flag Download",
        onConfirm: () => { setValid(row.id, false); showToast("Download flagged — security team notified", "warning"); closeDialog(); },
      }),
    },
    {
      label: "Revoke License",
      icon: XCircle,
      danger: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: XCircle,
        title: "Revoke License?",
        body: (
          <span>
            Revoke license <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.license}</strong>{" "}
            for <strong>{row.customer}</strong>? All site activations will be immediately invalidated.
          </span>
        ),
        confirmLabel: "Revoke License",
        onConfirm: () => { showToast(`License ${row.license} revoked`, "error"); closeDialog(); },
      }),
    },
    {
      label: "Delete Log Entry",
      icon: Trash2,
      danger: true,
      dividerBefore: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: Trash2,
        title: "Delete Log Entry?",
        body: (
          <span>
            Permanently delete this download record for <strong>{row.customer}</strong>?
            This cannot be undone and the entry will be removed from all reports.
          </span>
        ),
        confirmLabel: "Delete Entry",
        onConfirm: () => { deleteRow(row.id); showToast("Log entry deleted", "error"); closeDialog(); },
      }),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Downloads"  value="38,474"  trend="▲ +12.3%" trendUp icon={Download} />
        <KpiCard label="Downloads Today"  value="1,284"   trend="▲ +8.1%"  trendUp icon={Activity} />
        <KpiCard label="Unique IPs Today" value="891"     trend="▲ +4.6%"  trendUp icon={Globe} />
        <KpiCard label="Bandwidth Used"   value="142 GB"  trend="▲ +9.2%"  trendUp icon={Zap} />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-lg"
          style={{ backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${M3.outlineVariant}` }}>
          <Search size={16} color={M3.onSurfaceVariant} />
          <input
            type="text"
            placeholder="Search by customer, product, IP…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", border: "none" }}
          />
        </div>
        <FilterChip label="Product"    value={filterProduct} options={["Plugin Pro","Theme Bundle","SaaS Pro","Security Module","Analytics Add-on"]} onChange={setFilterProduct} />
        <FilterChip label="Country"    value={filterCountry} options={["United States","Germany","United Kingdom","Canada","Australia","France","Netherlands","Japan","Sweden","Brazil"]} onChange={setFilterCountry} />
        <FilterChip label="Status"     value={filterStatus}  options={["Valid","Invalid"]}              onChange={setFilterStatus} />
        <FilterChip label="Date Range" value={filterDate}    options={DATE_RANGE_OPTIONS}               onChange={setFilterDate} />
        {(filterProduct !== "All" || filterCountry !== "All" || filterStatus !== "All" || filterDate !== "All") && (
          <button onClick={() => { setFilterProduct("All"); setFilterCountry("All"); setFilterStatus("All"); setFilterDate("All"); }}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ color: M3.error, border: `1px solid ${M3.error}`, background: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            Clear all
          </button>
        )}
        <div className="ml-auto">
          <OutlinedButton small onClick={() => showToast("Download log exported as CSV", "success")}>
            <DownloadIcon size={14} /> Export Log
          </OutlinedButton>
        </div>
      </div>

      {/* Table */}
      <Card style={{ overflow: "visible" }}>
        <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                {["Customer", "Product", "Version", "IP Address", "Country", "Date / Time", "Size", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: !row.valid
                      ? `${M3.error}08`
                      : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = !row.valid
                      ? `${M3.error}08`
                      : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow;
                  }}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.customer}</div>
                    <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.license}</div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto Mono, monospace" }}>
                      {row.version}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.ip}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      {row.flag}
                      <span className="text-xs" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.country}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.date}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.size}</td>
                  <td className="px-4 py-3">
                    {row.valid
                      ? <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: M3.success }}><CheckCircle size={12} /> Valid</span>
                      : <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: M3.error }}><XCircle size={12} /> Invalid</span>}
                  </td>
                  <td className="px-4 py-3" style={{ overflow: "visible" }}>
                    <ActionDropdown actions={rowActions(row)} hint={`${row.customer} · ${row.product}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
          <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
            Showing {filtered.length} of {tableData.length} records
            {tableData.filter(r => !r.valid).length > 0 && (
              <span className="ml-3 font-medium" style={{ color: M3.error }}>
                · {tableData.filter(r => !r.valid).length} invalid
              </span>
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: M3.success }} />
            <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Valid</span>
            <div className="w-2 h-2 rounded-full ml-3" style={{ backgroundColor: M3.error }} />
            <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Invalid (highlighted)</span>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        body={dialog.body}
        confirmLabel={dialog.confirmLabel}
        danger={dialog.danger}
        icon={dialog.icon}
        onConfirm={dialog.onConfirm}
        onCancel={closeDialog}
      />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Updates Page ──────────────────────────────────────────────────────────────
const PRODUCTS_LIST = ["Plugin Pro", "Theme Bundle", "SaaS Connector", "Security Module", "Analytics Add-on", "Update Manager"];
const RELEASE_TYPES = ["patch", "minor", "major"] as const;
const CHANNELS      = ["draft", "beta", "stable"] as const;

function UpdatesPage() {
  const [tableData, setTableData]   = useState(packagesData);
  const [toast, setToast]           = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]         = useState<{
    open: boolean; title: string; body: React.ReactNode;
    confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void;
  }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });

  // New Release form state
  const [newReleaseOpen, setNewReleaseOpen]     = useState(false);
  const [nrProduct,   setNrProduct]             = useState(PRODUCTS_LIST[0]);
  const [nrVersion,   setNrVersion]             = useState("");
  const [nrType,      setNrType]                = useState<typeof RELEASE_TYPES[number]>("patch");
  const [nrChannel,   setNrChannel]             = useState<typeof CHANNELS[number]>("draft");
  const [nrChangelog, setNrChangelog]           = useState("");
  const [nrFileReady, setNrFileReady]           = useState(false);
  const [nrDragOver,  setNrDragOver]            = useState(false);

  // Edit Package panel state
  const [editRow, setEditRow]                   = useState<typeof tableData[0] | null>(null);
  const [editVersion,   setEditVersion]         = useState("");
  const [editChangelog, setEditChangelog]       = useState("");
  const [editChannel,   setEditChannel]         = useState<string>("");

  // Changelog viewer modal
  const [changelogRow, setChangelogRow]         = useState<typeof tableData[0] | null>(null);

  const showToast  = (msg: string, type: ToastProps["type"] = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));

  const updateRow   = (id: number, patch: Partial<typeof tableData[0]>) =>
    setTableData(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));
  const deleteRow   = (id: number) =>
    setTableData(rows => rows.filter(r => r.id !== id));

  const openEdit = (row: typeof tableData[0]) => {
    setEditRow(row);
    setEditVersion(row.current);
    setEditChangelog(row.changelog);
    setEditChannel(row.channel);
  };

  // ── Row actions ─────────────────────────────────────────────────────────────
  const rowActions = (row: typeof tableData[0]): ActionItem[] => [
    // Info
    {
      label: "Edit Package",
      icon: Edit3,
      onClick: () => openEdit(row),
    },
    {
      label: "View Changelog",
      icon: FileText,
      onClick: () => setChangelogRow(row),
    },
    {
      label: "Download ZIP",
      icon: Download,
      onClick: () => showToast(`Downloading ${row.product} ${row.current}.zip…`, "info"),
    },
    {
      label: "Copy Download URL",
      icon: Copy,
      onClick: () => {
        navigator.clipboard?.writeText(`https://cdn.example.com/${row.slug}/${row.current}.zip`);
        showToast("Download URL copied to clipboard", "info");
      },
    },
    {
      label: "View Download Stats",
      icon: BarChart2,
      onClick: () => showToast(`Download stats for ${row.product} opened`, "info"),
    },

    // Workflow transitions (context-aware)
    ...(row.status === "draft" ? [{
      label: "Publish to Beta",
      icon: Zap,
      dividerBefore: true,
      onClick: () => openDialog({
        open: true, danger: false, icon: Zap,
        title: "Publish to Beta Channel?",
        body: (
          <span>
            Move <strong>{row.product} {row.current}</strong> to the beta channel?
            Beta customers will be offered this update immediately.
          </span>
        ),
        confirmLabel: "Publish to Beta",
        onConfirm: () => {
          updateRow(row.id, { status: "beta", channel: "beta" });
          showToast(`${row.product} ${row.current} published to beta`, "success");
          closeDialog();
        },
      }),
    }] : []),
    ...(row.status === "beta" ? [{
      label: "Promote to Stable",
      icon: CheckCircle,
      dividerBefore: true,
      onClick: () => openDialog({
        open: true, danger: false, icon: CheckCircle,
        title: "Promote to Stable Channel?",
        body: (
          <span>
            Push <strong>{row.product} {row.current}</strong> to the stable channel?
            All customers on stable will receive this update automatically.
          </span>
        ),
        confirmLabel: "Promote to Stable",
        onConfirm: () => {
          updateRow(row.id, { status: "live", channel: "stable", released: new Date().toISOString().split("T")[0] });
          showToast(`${row.product} ${row.current} is now live on stable`, "success");
          closeDialog();
        },
      }),
    }] : []),
    ...((row.status === "beta" || row.status === "live") ? [{
      label: "Revert to Draft",
      icon: RotateCcw,
      onClick: () => openDialog({
        open: true, danger: false, icon: RotateCcw,
        title: "Revert to Draft?",
        body: (
          <span>
            Pull <strong>{row.product} {row.current}</strong> back to draft?
            {row.status === "live" && " Customers will immediately stop receiving this update."}
          </span>
        ),
        confirmLabel: "Revert to Draft",
        onConfirm: () => {
          updateRow(row.id, { status: "draft", channel: "draft", released: "—" });
          showToast(`${row.product} ${row.current} reverted to draft`, "warning");
          closeDialog();
        },
      }),
    }] : []),

    // Destructive
    {
      label: "Rollback to Previous",
      icon: RotateCcw,
      danger: true,
      dividerBefore: true,
      disabled: !row.previous || row.status === "draft",
      onClick: () => openDialog({
        open: true, danger: true, icon: RotateCcw,
        title: "Rollback Release?",
        body: (
          <span>
            Roll <strong>{row.product}</strong> back from{" "}
            <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.current}</strong> to{" "}
            <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.previous}</strong>?
            All customers on {row.current} will be downgraded on their next update check.
          </span>
        ),
        confirmLabel: "Rollback",
        onConfirm: () => {
          updateRow(row.id, { current: row.previous, previous: "—", downloads: 0, released: new Date().toISOString().split("T")[0] });
          showToast(`${row.product} rolled back to ${row.previous}`, "warning");
          closeDialog();
        },
      }),
    },
    {
      label: "Unpublish Package",
      icon: XCircle,
      danger: true,
      disabled: row.status === "draft",
      onClick: () => openDialog({
        open: true, danger: true, icon: XCircle,
        title: "Unpublish Package?",
        body: (
          <span>
            Remove <strong>{row.product} {row.current}</strong> from the update feed?
            Customers will no longer be offered this version. The package file is kept.
          </span>
        ),
        confirmLabel: "Unpublish",
        onConfirm: () => {
          updateRow(row.id, { status: "draft", channel: "draft" });
          showToast(`${row.product} ${row.current} unpublished`, "warning");
          closeDialog();
        },
      }),
    },
    {
      label: "Delete Package",
      icon: Trash2,
      danger: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: Trash2,
        title: "Delete Package?",
        body: (
          <span>
            Permanently delete <strong>{row.product} {row.current}</strong>?
            The ZIP file and all download records for this version will be removed.
            This cannot be undone.
          </span>
        ),
        confirmLabel: "Delete Package",
        onConfirm: () => {
          deleteRow(row.id);
          showToast(`${row.product} ${row.current} deleted`, "error");
          closeDialog();
        },
      }),
    },
  ];

  // ── Channel / status badge styles ──────────────────────────────────────────
  const channelColor: Record<string, { bg: string; text: string }> = {
    stable: { bg: M3.successContainer,     text: M3.success          },
    beta:   { bg: M3.warningContainer,     text: M3.warning          },
    draft:  { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant },
  };
  const statusColor: Record<string, { bg: string; text: string }> = {
    live:  { bg: M3.successContainer,     text: M3.success          },
    beta:  { bg: M3.warningContainer,     text: M3.warning          },
    draft: { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant },
  };

  // ── New Release submit ─────────────────────────────────────────────────────
  const handleCreateRelease = () => {
    if (!nrVersion.trim()) { showToast("Please enter a version number", "error"); return; }
    const newPkg = {
      id: Date.now(),
      product: nrProduct,
      slug: nrProduct.toLowerCase().replace(/ /g, "-"),
      current: nrVersion.trim(),
      previous: tableData.find(r => r.product === nrProduct)?.current ?? "—",
      released: nrChannel === "draft" ? "—" : new Date().toISOString().split("T")[0],
      downloads: 0,
      channel: nrChannel,
      status: nrChannel === "stable" ? "live" : nrChannel,
      changelog: nrChangelog.trim() || "No changelog provided.",
    };
    setTableData(d => [newPkg, ...d]);
    showToast(`${nrProduct} ${nrVersion} created as ${nrChannel}`, "success");
    setNewReleaseOpen(false);
    setNrVersion(""); setNrChangelog(""); setNrFileReady(false);
    setNrChannel("draft"); setNrType("patch");
  };

  // ── Edit Package save ──────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editRow) return;
    updateRow(editRow.id, { current: editVersion, changelog: editChangelog, channel: editChannel,
      status: editChannel === "stable" ? "live" : editChannel });
    showToast(`${editRow.product} updated`, "success");
    setEditRow(null);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Live Packages"  value={String(tableData.filter(r => r.status === "live").length)}  trend="▲ +1 this week"   trendUp icon={Package} />
        <KpiCard label="Downloads Today" value="2,104"                                                     trend="▲ +6.8%"           trendUp icon={Download} />
        <KpiCard label="Beta Packages"  value={String(tableData.filter(r => r.status === "beta").length)}  trend="Needs promotion"   trendUp={false} icon={Zap} />
        <KpiCard label="Draft Packages" value={String(tableData.filter(r => r.status === "draft").length)} trend="Pending release"   trendUp={false} icon={FileText} />
      </div>

      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
          Update Packages
        </div>
        <FilledButton small onClick={() => setNewReleaseOpen(true)}>
          <Zap size={14} /> New Release
        </FilledButton>
      </div>

      {/* ── New Release form panel ──────────────────────────────────────────── */}
      {newReleaseOpen && (
        <Card className="overflow-hidden" style={{ border: `2px solid ${M3.primary}` }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-4"
            style={{ backgroundColor: M3.primaryContainer, borderBottom: `1px solid ${M3.outlineVariant}` }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: M3.primary }}>
                <Zap size={16} color={M3.onPrimary} />
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>
                  Create New Release
                </div>
                <div className="text-xs" style={{ color: M3.onPrimaryContainer, opacity: 0.7, fontFamily: "Roboto, sans-serif" }}>
                  Fill in the details below — you can save as draft and publish later.
                </div>
              </div>
            </div>
            <IconButton icon={XCircle} onClick={() => setNewReleaseOpen(false)} />
          </div>

          <div className="p-6 grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Left column */}
            <div className="flex flex-col gap-4">
              {/* Product */}
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Product *</div>
                <select value={nrProduct} onChange={e => setNrProduct(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
                  {PRODUCTS_LIST.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {/* Version */}
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Version Number *</div>
                <input
                  type="text"
                  placeholder="e.g. v2.5.0"
                  value={nrVersion}
                  onChange={e => setNrVersion(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${nrVersion ? M3.primary : M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}
                />
              </div>

              {/* Release type */}
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Release Type</div>
                <div className="flex gap-2">
                  {RELEASE_TYPES.map(t => (
                    <button key={t} onClick={() => setNrType(t)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all"
                      style={{
                        backgroundColor: nrType === t ? M3.primary : M3.surfaceContainerLow,
                        color: nrType === t ? M3.onPrimary : M3.onSurfaceVariant,
                        border: `1px solid ${nrType === t ? M3.primary : M3.outlineVariant}`,
                        cursor: "pointer", fontFamily: "Roboto, sans-serif",
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="text-xs mt-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                  {nrType === "patch" && "Bug fixes and security patches only."}
                  {nrType === "minor" && "New features, backwards compatible."}
                  {nrType === "major" && "Breaking changes — communicate clearly."}
                </div>
              </div>

              {/* Channel */}
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Release Channel</div>
                <div className="flex gap-2">
                  {CHANNELS.map(ch => {
                    const style = channelColor[ch];
                    const active = nrChannel === ch;
                    return (
                      <button key={ch} onClick={() => setNrChannel(ch)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all"
                        style={{
                          backgroundColor: active ? style.bg : M3.surfaceContainerLow,
                          color: active ? style.text : M3.onSurfaceVariant,
                          border: `1px solid ${active ? style.text : M3.outlineVariant}`,
                          cursor: "pointer", fontFamily: "Roboto, sans-serif",
                        }}>
                        {ch}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs mt-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                  {nrChannel === "draft"  && "Saved but not visible to customers yet."}
                  {nrChannel === "beta"   && "Pushed to beta testers immediately on save."}
                  {nrChannel === "stable" && "Pushed to all customers immediately on save."}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Changelog */}
              <div className="flex-1 flex flex-col">
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Changelog</div>
                <textarea
                  placeholder={"• Fixed: PHP 8.3 compatibility issue\n• Added: New block pattern for hero sections\n• Improved: License validation response time by 40%"}
                  value={nrChangelog}
                  onChange={e => setNrChangelog(e.target.value)}
                  className="flex-1 w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
                  rows={7}
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif", lineHeight: 1.6 }}
                />
              </div>

              {/* File upload */}
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Package File (ZIP)</div>
                <div
                  onDragOver={e => { e.preventDefault(); setNrDragOver(true); }}
                  onDragLeave={() => setNrDragOver(false)}
                  onDrop={e => { e.preventDefault(); setNrDragOver(false); setNrFileReady(true); showToast("Package file ready", "success"); }}
                  onClick={() => setNrFileReady(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all"
                  style={{
                    border: `2px dashed ${nrDragOver ? M3.primary : nrFileReady ? M3.success : M3.outlineVariant}`,
                    backgroundColor: nrDragOver ? `${M3.primary}08` : nrFileReady ? `${M3.success}08` : M3.surfaceContainerLow,
                    padding: "20px 16px",
                  }}>
                  {nrFileReady ? (
                    <>
                      <CheckCircle size={24} color={M3.success} />
                      <div className="text-sm font-medium" style={{ color: M3.success, fontFamily: "Roboto, sans-serif" }}>
                        {nrProduct.toLowerCase().replace(/ /g, "-")}-{nrVersion || "x.x.x"}.zip ready
                      </div>
                      <button onClick={e => { e.stopPropagation(); setNrFileReady(false); }}
                        className="text-xs" style={{ color: M3.onSurfaceVariant, background: "none", border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <DownloadIcon size={24} color={M3.onSurfaceVariant} style={{ transform: "rotate(180deg)" }} />
                      <div className="text-sm" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                        Drop ZIP here, or <span style={{ color: M3.primary, fontWeight: 500 }}>click to select</span>
                      </div>
                      <div className="text-xs" style={{ color: M3.outlineVariant, fontFamily: "Roboto, sans-serif" }}>
                        Max 50 MB · .zip only
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Panel footer */}
          <div className="flex items-center justify-between px-6 py-4"
            style={{ backgroundColor: M3.surfaceContainerLow, borderTop: `1px solid ${M3.outlineVariant}` }}>
            <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
              {!nrFileReady && <span style={{ color: M3.warning }}>⚠ No package file attached — customers won't be able to download.</span>}
              {nrFileReady && <span style={{ color: M3.success }}>✓ Package file attached.</span>}
            </div>
            <div className="flex items-center gap-2">
              <TextButton onClick={() => setNewReleaseOpen(false)}>Cancel</TextButton>
              <TonalButton small onClick={() => { setNrChannel("draft"); handleCreateRelease(); }}>
                <FileText size={14} /> Save as Draft
              </TonalButton>
              <FilledButton small onClick={handleCreateRelease}>
                <Zap size={14} /> Create Release
              </FilledButton>
            </div>
          </div>
        </Card>
      )}

      {/* ── Edit Package panel ──────────────────────────────────────────────── */}
      {editRow && (
        <Card className="overflow-hidden" style={{ border: `2px solid ${M3.secondary}` }}>
          <div className="flex items-center justify-between px-6 py-4"
            style={{ backgroundColor: M3.secondaryContainer, borderBottom: `1px solid ${M3.outlineVariant}` }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: M3.secondary }}>
                <Edit3 size={16} color={M3.onSecondary} />
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: M3.onSecondaryContainer, fontFamily: "Roboto, sans-serif" }}>
                  Edit Package — {editRow.product}
                </div>
                <div className="text-xs" style={{ color: M3.onSecondaryContainer, opacity: 0.7, fontFamily: "Roboto, sans-serif" }}>
                  Currently <strong>{editRow.current}</strong> · {editRow.downloads.toLocaleString()} downloads
                </div>
              </div>
            </div>
            <IconButton icon={XCircle} onClick={() => setEditRow(null)} />
          </div>

          <div className="p-6 grid gap-5" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div>
              <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Version</div>
              <input value={editVersion} onChange={e => setEditVersion(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.primary}`, color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }} />
            </div>
            <div>
              <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Channel</div>
              <div className="flex gap-2">
                {CHANNELS.map(ch => (
                  <button key={ch} onClick={() => setEditChannel(ch)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium capitalize"
                    style={{
                      backgroundColor: editChannel === ch ? M3.primary : M3.surfaceContainerLow,
                      color: editChannel === ch ? M3.onPrimary : M3.onSurfaceVariant,
                      border: `1px solid ${editChannel === ch ? M3.primary : M3.outlineVariant}`,
                      cursor: "pointer", fontFamily: "Roboto, sans-serif",
                    }}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Replace ZIP</div>
              <button onClick={() => showToast("File picker opened", "info")}
                className="w-full py-2.5 rounded-lg text-xs flex items-center justify-center gap-2"
                style={{ backgroundColor: M3.surfaceContainerLow, border: `1px dashed ${M3.outlineVariant}`, color: M3.onSurfaceVariant, cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                <DownloadIcon size={13} style={{ transform: "rotate(180deg)" }} /> Upload new ZIP
              </button>
            </div>
            <div className="col-span-3">
              <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Changelog</div>
              <textarea value={editChangelog} onChange={e => setEditChangelog(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
                rows={3}
                style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif", lineHeight: 1.6 }} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4"
            style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
            <TextButton onClick={() => setEditRow(null)}>Cancel</TextButton>
            <FilledButton small onClick={handleSaveEdit}>Save Changes</FilledButton>
          </div>
        </Card>
      )}

      {/* ── Packages table ─────────────────────────────────────────────────── */}
      <Card style={{ overflow: "visible" }}>
        <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                {["Product", "Current Version", "Previous", "Released", "Downloads", "Channel", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={row.id}
                  style={{
                    backgroundColor: editRow?.id === row.id
                      ? `${M3.secondary}10`
                      : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow,
                    opacity: row.status === "draft" ? 0.75 : 1,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = editRow?.id === row.id ? `${M3.secondary}10` : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow;
                    (e.currentTarget as HTMLElement).style.opacity = row.status === "draft" ? "0.75" : "1";
                  }}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</div>
                    <div className="text-xs font-normal mt-0.5 max-w-xs truncate" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.changelog}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto Mono, monospace" }}>
                      {row.current}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.previous}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.released}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.downloads.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ backgroundColor: channelColor[row.channel]?.bg, color: channelColor[row.channel]?.text, fontFamily: "Roboto, sans-serif" }}>
                      {row.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ backgroundColor: statusColor[row.status]?.bg, color: statusColor[row.status]?.text, fontFamily: "Roboto, sans-serif" }}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ overflow: "visible" }}>
                    <ActionDropdown actions={rowActions(row)} hint={`${row.product} · ${row.current}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
          <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
            {tableData.length} packages · {tableData.filter(r => r.status === "live").length} live · {tableData.filter(r => r.status === "beta").length} beta · {tableData.filter(r => r.status === "draft").length} draft
          </span>
        </div>
      </Card>

      {/* ── Release history ─────────────────────────────────────────────────── */}
      <Card className="p-5">
        <SectionTitle>Recent Release History</SectionTitle>
        <table className="w-full">
          <thead>
            <tr>
              {["Product", "Version", "Release Date", "Downloads", "Type"].map(h => (
                <th key={h} className="text-left pb-2 text-xs font-medium"
                  style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {releaseHistoryData.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
                <td className="py-2.5 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{r.product}</td>
                <td className="py-2.5">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto Mono, monospace" }}>
                    {r.version}
                  </span>
                </td>
                <td className="py-2.5 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{r.date}</td>
                <td className="py-2.5 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{r.downloads.toLocaleString()}</td>
                <td className="py-2.5">
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: r.type === "minor" ? M3.primaryContainer : M3.surfaceContainerHigh, color: r.type === "minor" ? M3.onPrimaryContainer : M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    {r.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── Changelog viewer modal ──────────────────────────────────────────── */}
      {changelogRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
          onClick={e => { if (e.target === e.currentTarget) setChangelogRow(null); }}>
          <div className="rounded-3xl overflow-hidden flex flex-col" style={{ width: 560, maxHeight: "80vh", backgroundColor: M3.surfaceContainer, boxShadow: "0 8px 32px rgba(0,0,0,0.24)" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <div>
                <div className="font-semibold text-base" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
                  {changelogRow.product}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto Mono, monospace" }}>
                    {changelogRow.current}
                  </span>
                  <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    Released {changelogRow.released} · {changelogRow.downloads.toLocaleString()} downloads
                  </span>
                </div>
              </div>
              <IconButton icon={XCircle} onClick={() => setChangelogRow(null)} />
            </div>

            {/* Changelog body */}
            <div className="px-6 py-5 overflow-y-auto flex-1">
              <div className="text-xs font-medium mb-3"
                style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                What's changed
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", lineHeight: 1.8 }}>
                {changelogRow.changelog}
              </div>

              <div className="mt-5 pt-4 flex flex-col gap-2" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
                <div className="text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Release info</div>
                {[
                  { label: "Channel",  value: changelogRow.channel },
                  { label: "Status",   value: changelogRow.status },
                  { label: "Previous", value: changelogRow.previous },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                    <span style={{ color: M3.onSurfaceVariant }}>{item.label}</span>
                    <span className="font-medium capitalize" style={{ color: M3.onSurface }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4"
              style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <OutlinedButton small onClick={() => { navigator.clipboard?.writeText(changelogRow.changelog); showToast("Changelog copied", "info"); }}>
                <Copy size={14} /> Copy
              </OutlinedButton>
              <FilledButton small onClick={() => { openEdit(changelogRow); setChangelogRow(null); }}>
                <Edit3 size={14} /> Edit
              </FilledButton>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={dialog.open} title={dialog.title} body={dialog.body} confirmLabel={dialog.confirmLabel} danger={dialog.danger} icon={dialog.icon} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── SaaS Account Detail Data ─────────────────────────────────────────────────
const saasDetailUsers: Record<string, Array<{
  id: number; name: string; email: string; role: string;
  lastLogin: string; status: string; avatar: string;
}>> = {
  "SAAS-001": [
    { id: 1, name: "Tom Baker",      email: "tom@acme.com",     role: "Admin",  lastLogin: "2h ago",    status: "active",  avatar: "TB" },
    { id: 2, name: "Rachel Green",   email: "rachel@acme.com",  role: "Admin",  lastLogin: "1d ago",    status: "active",  avatar: "RG" },
    { id: 3, name: "Marcus Hill",    email: "marcus@acme.com",  role: "Member", lastLogin: "3h ago",    status: "active",  avatar: "MH" },
    { id: 4, name: "Priya Sharma",   email: "priya@acme.com",   role: "Member", lastLogin: "5d ago",    status: "active",  avatar: "PS" },
    { id: 5, name: "David Chen",     email: "david@acme.com",   role: "Member", lastLogin: "2d ago",    status: "active",  avatar: "DC" },
    { id: 6, name: "Julia West",     email: "julia@acme.com",   role: "Viewer", lastLogin: "Never",     status: "invited", avatar: "JW" },
    { id: 7, name: "Liam Torres",    email: "liam@acme.com",    role: "Member", lastLogin: "1w ago",    status: "active",  avatar: "LT" },
    { id: 8, name: "Amy Rodriguez",  email: "amy@acme.com",     role: "Viewer", lastLogin: "3d ago",    status: "active",  avatar: "AR" },
  ],
  "SAAS-002": [
    { id: 1, name: "Nina Patel",     email: "nina@startuphub.io", role: "Admin",  lastLogin: "30m ago", status: "active",  avatar: "NP" },
    { id: 2, name: "Jake Morris",    email: "jake@startuphub.io", role: "Member", lastLogin: "6h ago",  status: "active",  avatar: "JM" },
    { id: 3, name: "Sara Kim",       email: "sara@startuphub.io", role: "Member", lastLogin: "Never",   status: "invited", avatar: "SK" },
    { id: 4, name: "Ben Clarke",     email: "ben@startuphub.io",  role: "Viewer", lastLogin: "2d ago",  status: "active",  avatar: "BC" },
  ],
  "SAAS-003": [
    { id: 1, name: "Max Gruber",     email: "max@devagency.de",   role: "Admin",  lastLogin: "1h ago",  status: "active",  avatar: "MG" },
    { id: 2, name: "Lena Wolf",      email: "lena@devagency.de",  role: "Admin",  lastLogin: "4h ago",  status: "active",  avatar: "LW" },
    { id: 3, name: "Felix Braun",    email: "felix@devagency.de", role: "Member", lastLogin: "2h ago",  status: "active",  avatar: "FB" },
    { id: 4, name: "Anna Bauer",     email: "anna@devagency.de",  role: "Member", lastLogin: "1d ago",  status: "active",  avatar: "AB" },
    { id: 5, name: "Klaus Richter",  email: "klaus@devagency.de", role: "Member", lastLogin: "3d ago",  status: "active",  avatar: "KR" },
  ],
};

const saasBilling: Record<string, Array<{
  invoice: string; date: string; amount: string; status: string; period: string;
}>> = {
  "SAAS-001": [
    { invoice: "INV-2025-001", date: "2025-01-12", amount: "$299.00", status: "paid",    period: "Jan 2025" },
    { invoice: "INV-2024-012", date: "2024-12-12", amount: "$299.00", status: "paid",    period: "Dec 2024" },
    { invoice: "INV-2024-011", date: "2024-11-12", amount: "$299.00", status: "paid",    period: "Nov 2024" },
    { invoice: "INV-2024-010", date: "2024-10-12", amount: "$249.00", status: "paid",    period: "Oct 2024" },
    { invoice: "INV-2024-009", date: "2024-09-12", amount: "$249.00", status: "paid",    period: "Sep 2024" },
  ],
  "SAAS-002": [
    { invoice: "INV-2025-002", date: "2025-02-01", amount: "$49.00",  status: "paid",    period: "Feb 2025" },
    { invoice: "INV-2025-001", date: "2025-01-01", amount: "$49.00",  status: "paid",    period: "Jan 2025" },
    { invoice: "INV-2024-012", date: "2024-12-01", amount: "$49.00",  status: "paid",    period: "Dec 2024" },
  ],
  "SAAS-003": [
    { invoice: "INV-2025-001", date: "2025-09-18", amount: "$599.00", status: "pending", period: "Sep 2025" },
    { invoice: "INV-2024-001", date: "2024-09-18", amount: "$599.00", status: "paid",    period: "Sep 2024" },
    { invoice: "INV-2023-001", date: "2023-09-18", amount: "$499.00", status: "paid",    period: "Sep 2023" },
  ],
};

const saasActivity: Record<string, Array<{
  type: string; desc: string; time: string; actor: string;
  icon: React.ElementType; color: string; meta?: string;
}>> = {
  "SAAS-001": [
    { type: "seat_added",    desc: "New user Marcus Hill invited and accepted",        time: "2025-01-10 09:12", actor: "tom@acme.com",   icon: UserPlus,   color: M3.success,   meta: "+1 seat" },
    { type: "login",         desc: "Admin Tom Baker logged in from 93.184.216.34",     time: "2025-01-10 08:55", actor: "System",         icon: CheckCircle,color: M3.info },
    { type: "plan_change",   desc: "Plan upgraded from Business (10) to Business (25)",time: "2024-12-01 14:00", actor: "tom@acme.com",   icon: ArrowUpRight,color: M3.primary,  meta: "$299/mo" },
    { type: "payment",       desc: "Invoice INV-2024-012 paid — $299",                 time: "2024-12-12 00:00", actor: "System",         icon: CreditCard, color: M3.success,  meta: "$299.00" },
    { type: "seat_removed",  desc: "User Chris Evans removed by admin",                time: "2024-11-20 11:23", actor: "tom@acme.com",   icon: XCircle,    color: M3.error,    meta: "-1 seat" },
    { type: "payment",       desc: "Invoice INV-2024-011 paid — $299",                 time: "2024-11-12 00:00", actor: "System",         icon: CreditCard, color: M3.success,  meta: "$299.00" },
    { type: "created",       desc: "Account created — Business plan",                  time: "2024-03-12 10:38", actor: "System",         icon: Cloud,      color: M3.secondary },
  ],
};

const saasUsageMetrics: Record<string, {
  apiCalls: number; apiLimit: number;
  storage: string; storageLimit: string;
  bandwidth: string; bandwidthLimit: string;
  integrations: number; lastActive: string;
  uptimePct: number;
  apiTrend: Array<{ day: string; calls: number }>;
}> = {
  "SAAS-001": {
    apiCalls: 48291, apiLimit: 100000,
    storage: "2.4 GB", storageLimit: "10 GB",
    bandwidth: "18.7 GB", bandwidthLimit: "100 GB",
    integrations: 3, lastActive: "2h ago", uptimePct: 99.97,
    apiTrend: [
      { day: "Mon", calls: 6200 }, { day: "Tue", calls: 5800 },
      { day: "Wed", calls: 7100 }, { day: "Thu", calls: 6500 },
      { day: "Fri", calls: 7400 }, { day: "Sat", calls: 4200 },
      { day: "Sun", calls: 3800 },
    ],
  },
  "SAAS-002": {
    apiCalls: 8120, apiLimit: 50000,
    storage: "0.8 GB", storageLimit: "5 GB",
    bandwidth: "4.2 GB", bandwidthLimit: "50 GB",
    integrations: 1, lastActive: "30m ago", uptimePct: 100,
    apiTrend: [
      { day: "Mon", calls: 1100 }, { day: "Tue", calls: 1300 },
      { day: "Wed", calls: 1050 }, { day: "Thu", calls: 1250 },
      { day: "Fri", calls: 1420 }, { day: "Sat", calls: 600 },
      { day: "Sun", calls: 400 },
    ],
  },
  "SAAS-003": {
    apiCalls: 89240, apiLimit: 200000,
    storage: "8.1 GB", storageLimit: "20 GB",
    bandwidth: "64.2 GB", bandwidthLimit: "200 GB",
    integrations: 7, lastActive: "1h ago", uptimePct: 99.91,
    apiTrend: [
      { day: "Mon", calls: 12400 }, { day: "Tue", calls: 13800 },
      { day: "Wed", calls: 12100 }, { day: "Thu", calls: 14200 },
      { day: "Fri", calls: 13900 }, { day: "Sat", calls: 7800 },
      { day: "Sun", calls: 6200 },
    ],
  },
};

// ─── SaaS Account Detail Page ─────────────────────────────────────────────────
function SaasDetailPage({ accountId, onBack }: { accountId: string; onBack: () => void }) {
  const account    = saasAccountsData.find(a => a.id === accountId) ?? saasAccountsData[0];
  const users      = saasDetailUsers[accountId]  ?? saasDetailUsers["SAAS-001"];
  const billing    = saasBilling[accountId]       ?? saasBilling["SAAS-001"];
  const activity   = saasActivity[accountId]      ?? saasActivity["SAAS-001"];
  const usage      = saasUsageMetrics[accountId]  ?? saasUsageMetrics["SAAS-001"];

  const [tab, setTab]               = useState<"overview" | "users" | "usage" | "billing" | "activity">("overview");
  const [userRows, setUserRows]     = useState(users);
  const [toast, setToast]           = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]         = useState<{
    open: boolean; title: string; body: React.ReactNode;
    confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void;
  }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });
  const [inviteEmail, setInviteEmail]   = useState("");
  const [inviteRole, setInviteRole]     = useState("Member");
  const [inviteOpen, setInviteOpen]     = useState(false);

  const showToast  = (msg: string, type: ToastProps["type"] = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));

  const [used, max]   = account.seats.split("/").map(Number);
  const seatPct       = Math.round((used / max) * 100);
  const apiPct        = Math.round((usage.apiCalls / usage.apiLimit) * 100);

  const planColor: Record<string, { bg: string; text: string }> = {
    Starter:    { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant    },
    Business:   { bg: M3.secondaryContainer,   text: M3.onSecondaryContainer },
    Enterprise: { bg: M3.primaryContainer,     text: M3.onPrimaryContainer  },
  };

  const roleColor: Record<string, { bg: string; text: string }> = {
    Admin:  { bg: M3.primaryContainer,  text: M3.onPrimaryContainer  },
    Member: { bg: M3.secondaryContainer,text: M3.onSecondaryContainer },
    Viewer: { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant },
  };

  const tabs = [
    { id: "overview"  as const, label: "Overview"           },
    { id: "users"     as const, label: `Users (${userRows.length})` },
    { id: "usage"     as const, label: "Usage"              },
    { id: "billing"   as const, label: `Billing (${billing.length})` },
    { id: "activity"  as const, label: "Activity"           },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* ── Sub-nav ── */}
      <TextButton onClick={onBack}>← Back to SaaS Accounts</TextButton>

      {/* ── Hero card ── */}
      <Card className="overflow-hidden">
        <div className="h-24 w-full" style={{ background: `linear-gradient(135deg, ${M3.secondary} 0%, #9C82DB 100%)` }} />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between" style={{ marginTop: -36 }}>
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl text-2xl font-semibold border-4 border-white shadow-sm"
                style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>
                {account.account.slice(0, 2).toUpperCase()}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{account.account}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: planColor[account.plan]?.bg, color: planColor[account.plan]?.text, fontFamily: "Roboto, sans-serif" }}>
                    {account.plan}
                  </span>
                  <StatusBadge status={account.status} />
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-sm flex items-center gap-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    <Mail size={12} />{account.owner}
                  </span>
                  <span className="text-sm flex items-center gap-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    <Hash size={12} />{account.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2 pb-1">
              <OutlinedButton small onClick={() => showToast(`Invoice sent to ${account.owner}`, "success")}>
                <Mail size={14} /> Send Invoice
              </OutlinedButton>
              <TonalButton small onClick={() => showToast("Account editor opened", "info")}>
                <Edit3 size={14} /> Edit Account
              </TonalButton>
              <ActionDropdown actions={[
                { label: "Copy Account ID",       icon: Copy,         onClick: () => { navigator.clipboard?.writeText(account.id); showToast("Account ID copied", "info"); } },
                { label: "View All Invoices",     icon: FileText,     onClick: () => setTab("billing") },
                { label: "Send Welcome Email",    icon: Send,         onClick: () => showToast(`Welcome email sent to ${account.owner}`, "success") },
                { label: "Export Account Data",   icon: DownloadIcon, onClick: () => showToast("Account data export queued", "success"), dividerBefore: true },
                { label: "Force Logout All Users",icon: ShieldCheck,  danger: true, dividerBefore: true,
                  onClick: () => openDialog({ open: true, danger: true, icon: ShieldCheck, title: "Force Logout All Users?",
                    body: <span>End all active sessions for <strong>{account.account}</strong>? All {used} users will be signed out immediately.</span>,
                    confirmLabel: "Force Logout", onConfirm: () => { showToast(`All sessions ended for ${account.account}`, "warning"); closeDialog(); } }) },
              ]} />
            </div>
          </div>

          {/* Meta strip */}
          <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
            {[
              { icon: Calendar,   label: "Created",       value: account.created      },
              { icon: Clock,      label: "Last Active",   value: usage.lastActive      },
              { icon: CreditCard, label: "MRR",           value: account.mrr           },
              { icon: Globe,      label: "Next Billing",  value: account.nextBilling   },
              { icon: Activity,   label: "Uptime (30d)",  value: `${usage.uptimePct}%` },
              { icon: Zap,        label: "Integrations",  value: String(usage.integrations) },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-1.5">
                <m.icon size={13} color={M3.onSurfaceVariant} />
                <div>
                  <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{m.label}</div>
                  <div className="text-xs font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Users,        label: "Seats Used",      value: `${used} / ${max}`, sub: `${seatPct}% capacity`, color: seatPct >= 90 ? M3.error : seatPct >= 70 ? M3.warning : M3.primary, bg: seatPct >= 90 ? "#FFDAD6" : seatPct >= 70 ? M3.warningContainer : M3.primaryContainer },
          { icon: DollarSign,   label: "Monthly MRR",     value: account.mrr,        sub: "Current plan",         color: M3.success,   bg: M3.successContainer   },
          { icon: Activity,     label: "API Calls (30d)", value: usage.apiCalls.toLocaleString(), sub: `of ${(usage.apiLimit/1000).toFixed(0)}k limit`, color: M3.secondary, bg: M3.secondaryContainer },
          { icon: Zap,          label: "Storage Used",    value: usage.storage,      sub: `of ${usage.storageLimit}`, color: M3.info,  bg: M3.infoContainer },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: s.bg }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div className="text-2xl font-light" style={{ color: s.color, fontFamily: "Roboto, sans-serif" }}>{s.value}</div>
              <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{s.label}</div>
              <div className="text-xs" style={{ color: M3.outlineVariant, fontFamily: "Roboto, sans-serif" }}>{s.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Tabbed panel ── */}
      <Card className="flex flex-col" style={{ overflow: "visible" }}>
        {/* Tab bar */}
        <div className="flex" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all"
              style={{ color: tab === t.id ? M3.primary : M3.onSurfaceVariant, borderBottom: tab === t.id ? `2px solid ${M3.primary}` : "2px solid transparent", background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${M3.primary}` : "2px solid transparent", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════ OVERVIEW ════ */}
        {tab === "overview" && (
          <div className="p-6 grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Usage bars */}
            <div>
              <div className="font-medium text-sm mb-4" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Resource Usage</div>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Seats",     used: used,              max,                     unit: "seats",    pct: seatPct },
                  { label: "API Calls", used: usage.apiCalls,    max: usage.apiLimit,      unit: "calls",    pct: apiPct  },
                  { label: "Storage",   used: 2.4,               max: 10,                  unit: "GB",       pct: 24      },
                  { label: "Bandwidth", used: 18.7,              max: 100,                 unit: "GB",       pct: 19      },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1.5 text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                      <span style={{ color: M3.onSurface }}>{row.label}</span>
                      <span style={{ color: row.pct >= 90 ? M3.error : M3.onSurfaceVariant }}>
                        {typeof row.used === "number" && row.used > 100
                          ? `${row.used.toLocaleString()} / ${(row.max as number).toLocaleString()} ${row.unit}`
                          : `${row.used} / ${row.max} ${row.unit}`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: M3.surfaceContainerHigh }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${row.pct}%`, backgroundColor: row.pct >= 90 ? M3.error : row.pct >= 70 ? M3.warning : M3.primary }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account summary */}
            <div>
              <div className="font-medium text-sm mb-4" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Account Summary</div>
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: M3.surfaceContainerLow }}>
                {[
                  { label: "Account ID",     value: account.id },
                  { label: "Plan",           value: account.plan },
                  { label: "Status",         value: account.status.charAt(0).toUpperCase() + account.status.slice(1) },
                  { label: "Seats",          value: account.seats },
                  { label: "Owner",          value: account.owner },
                  { label: "Created",        value: account.created },
                  { label: "Next Billing",   value: account.nextBilling },
                  { label: "Uptime (30d)",   value: `${usage.uptimePct}%` },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.label}</span>
                    <span className="text-xs font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* API trend chart */}
            <div className="col-span-2">
              <div className="font-medium text-sm mb-3" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>API Calls — Last 7 days</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={usage.apiTrend} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
                  <YAxis tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
                  <Bar dataKey="calls" name="API Calls" fill={M3.primary} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ════ USERS ════ */}
        {tab === "users" && (
          <div>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <span className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
                {userRows.filter(u => u.status === "active").length} active · {userRows.filter(u => u.status === "invited").length} pending · {used}/{max} seats used
              </span>
              <FilledButton small onClick={() => setInviteOpen(o => !o)}>
                <UserPlus size={14} /> Invite User
              </FilledButton>
            </div>

            {/* Invite form */}
            {inviteOpen && (
              <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: M3.primaryContainer, borderBottom: `1px solid ${M3.outlineVariant}` }}>
                <input type="email" placeholder="user@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: M3.surface, border: `1px solid ${M3.outline}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }} />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: M3.surface, border: `1px solid ${M3.outline}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
                  {["Admin", "Member", "Viewer"].map(r => <option key={r}>{r}</option>)}
                </select>
                <FilledButton small onClick={() => {
                  if (!inviteEmail.trim()) { showToast("Enter an email address", "error"); return; }
                  setUserRows(u => [...u, { id: Date.now(), name: inviteEmail.split("@")[0], email: inviteEmail, role: inviteRole, lastLogin: "Never", status: "invited", avatar: inviteEmail.slice(0, 2).toUpperCase() }]);
                  showToast(`Invite sent to ${inviteEmail}`, "success");
                  setInviteEmail(""); setInviteOpen(false);
                }}>
                  Send Invite
                </FilledButton>
                <TextButton onClick={() => setInviteOpen(false)}>Cancel</TextButton>
              </div>
            )}

            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["User", "Role", "Last Login", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userRows.map((u, i) => (
                  <tr key={u.id}
                    style={{ backgroundColor: i % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>
                          {u.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{u.name}</div>
                          <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: roleColor[u.role]?.bg, color: roleColor[u.role]?.text, fontFamily: "Roboto, sans-serif" }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{u.lastLogin}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: u.status === "active" ? M3.successContainer : M3.warningContainer, color: u.status === "active" ? M3.success : M3.warning, fontFamily: "Roboto, sans-serif" }}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ overflow: "visible" }}>
                      <ActionDropdown
                        hint={u.email}
                        actions={[
                          { label: "Change Role to Admin",  icon: ArrowUpRight, disabled: u.role === "Admin",  onClick: () => { setUserRows(rows => rows.map(r => r.id === u.id ? { ...r, role: "Admin" } : r));  showToast(`${u.name} is now Admin`, "success"); } },
                          { label: "Change Role to Member", icon: Users,        disabled: u.role === "Member", onClick: () => { setUserRows(rows => rows.map(r => r.id === u.id ? { ...r, role: "Member" } : r)); showToast(`${u.name} is now Member`, "success"); } },
                          { label: "Change Role to Viewer", icon: Eye,          disabled: u.role === "Viewer", onClick: () => { setUserRows(rows => rows.map(r => r.id === u.id ? { ...r, role: "Viewer" } : r)); showToast(`${u.name} is now Viewer`, "success"); } },
                          ...(u.status === "invited" ? [{ label: "Resend Invite", icon: Send,   onClick: () => showToast(`Invite resent to ${u.email}`, "success") }] : []),
                          { label: "Remove User", icon: Trash2, danger: true, dividerBefore: true,
                            onClick: () => openDialog({ open: true, danger: true, icon: Trash2,
                              title: "Remove User?",
                              body: <span>Remove <strong>{u.name}</strong> from <strong>{account.account}</strong>? They will lose access immediately and their seat will be freed.</span>,
                              confirmLabel: "Remove User",
                              onConfirm: () => { setUserRows(rows => rows.filter(r => r.id !== u.id)); showToast(`${u.name} removed`, "error"); closeDialog(); } }) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════ USAGE ════ */}
        {tab === "usage" && (
          <div className="p-6 flex flex-col gap-5">
            {/* Usage bars */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {[
                { label: "Seats Used",           used: `${used}`,              total: `${max}`,          pct: seatPct, unit: "seats"  },
                { label: "API Calls (30d)",       used: usage.apiCalls.toLocaleString(), total: (usage.apiLimit/1000).toFixed(0)+"k", pct: apiPct, unit: "calls" },
                { label: "Storage",               used: usage.storage,          total: usage.storageLimit, pct: 24, unit: "" },
                { label: "Bandwidth (30d)",        used: usage.bandwidth,        total: usage.bandwidthLimit, pct: 19, unit: "" },
              ].map(m => (
                <Card key={m.label} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{m.label}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: m.pct >= 90 ? "#FFDAD6" : m.pct >= 70 ? M3.warningContainer : M3.successContainer, color: m.pct >= 90 ? M3.error : m.pct >= 70 ? M3.warning : M3.success, fontFamily: "Roboto, sans-serif" }}>
                      {m.pct}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden mb-2" style={{ backgroundColor: M3.surfaceContainerHigh }}>
                    <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.pct >= 90 ? M3.error : m.pct >= 70 ? M3.warning : M3.primary }} />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>
                    <span>{m.used}</span><span>{m.total}</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* API trend */}
            <Card className="p-5">
              <div className="font-medium text-sm mb-3" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>API Calls — Last 7 days</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={usage.apiTrend}>
                  <defs>
                    <linearGradient id="apiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={M3.primary} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={M3.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
                  <YAxis tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
                  <Area type="monotone" dataKey="calls" name="API Calls" stroke={M3.primary} fill="url(#apiGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Logins (30d)",  value: "1,284" },
                { label: "Active Integrations", value: String(usage.integrations) },
                { label: "Uptime (30d)",         value: `${usage.uptimePct}%` },
                { label: "Avg Session (min)",   value: "24" },
                { label: "Failed Auth (30d)",   value: "12" },
                { label: "Data Exports",         value: "3" },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-xl text-center" style={{ backgroundColor: M3.surfaceContainerLow }}>
                  <div className="text-2xl font-light" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ BILLING ════ */}
        {tab === "billing" && (
          <div>
            {/* Current plan summary */}
            <div className="px-5 py-4 flex items-center gap-4" style={{ borderBottom: `1px solid ${M3.outlineVariant}`, backgroundColor: M3.surfaceContainerLow }}>
              <div className="flex-1">
                <div className="text-xs font-medium mb-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Plan</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{account.plan} Plan</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: planColor[account.plan]?.bg, color: planColor[account.plan]?.text, fontFamily: "Roboto, sans-serif" }}>{account.plan}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                  {max} seats · {account.mrr}/month · Next billing: {account.nextBilling}
                </div>
              </div>
              <OutlinedButton small onClick={() => showToast("Plan upgrade dialog opened", "info")}>
                <ArrowUpRight size={14} /> Change Plan
              </OutlinedButton>
            </div>

            {/* Invoice table */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <span className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Invoice History</span>
              <OutlinedButton small onClick={() => showToast("Invoice history exported", "success")}>
                <DownloadIcon size={14} /> Export
              </OutlinedButton>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["Invoice", "Period", "Date", "Amount", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {billing.map((inv, i) => (
                  <tr key={inv.invoice}
                    style={{ backgroundColor: i % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.primary, fontFamily: "Roboto Mono, monospace" }}>{inv.invoice}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{inv.period}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{inv.date}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{inv.amount}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: inv.status === "paid" ? M3.successContainer : inv.status === "pending" ? M3.warningContainer : "#FFDAD6", color: inv.status === "paid" ? M3.success : inv.status === "pending" ? M3.warning : M3.error, fontFamily: "Roboto, sans-serif" }}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.status === "paid" && (
                        <TextButton small onClick={() => showToast(`Invoice ${inv.invoice} downloaded`, "info")}>
                          <DownloadIcon size={12} /> PDF
                        </TextButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════ ACTIVITY ════ */}
        {tab === "activity" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="font-medium text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Account Event Log</div>
              <OutlinedButton small onClick={() => showToast("Activity log exported", "success")}>
                <DownloadIcon size={14} /> Export
              </OutlinedButton>
            </div>
            <div className="flex flex-col">
              {activity.map((evt, i) => {
                const Icon = evt.icon;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${evt.color}15`, border: `1.5px solid ${evt.color}40` }}>
                        <Icon size={15} color={evt.color} />
                      </div>
                      {i < activity.length - 1 && <div className="w-px flex-1 my-1.5" style={{ backgroundColor: M3.outlineVariant, minHeight: 16 }} />}
                    </div>
                    <div className="flex-1 pb-5 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{evt.desc}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{evt.time}</span>
                            <span style={{ color: M3.outlineVariant }}>·</span>
                            <span className="text-xs font-medium" style={{ color: evt.actor === "System" ? M3.secondary : M3.primary, fontFamily: "Roboto, sans-serif" }}>{evt.actor}</span>
                          </div>
                        </div>
                        {evt.meta && (
                          <span className="text-sm font-semibold flex-shrink-0" style={{ color: M3.success, fontFamily: "Roboto Mono, monospace" }}>{evt.meta}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog open={dialog.open} title={dialog.title} body={dialog.body} confirmLabel={dialog.confirmLabel} danger={dialog.danger} icon={dialog.icon} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── SaaS Accounts Page ────────────────────────────────────────────────────────
const SAAS_PLANS = [
  { label: "Starter",    seats: 5,  mrr: "$19",  note: "Up to 5 seats, core features." },
  { label: "Business",   seats: 25, mrr: "$299", note: "Up to 25 seats, priority support." },
  { label: "Enterprise", seats: 50, mrr: "$599", note: "Up to 50 seats, SLA + custom integrations." },
];

function SaasPage({ onViewDetail }: { onViewDetail: (id: string) => void }) {
  const [tableData, setTableData] = useState(saasAccountsData);
  const [search, setSearch]       = useState("");
  const [filterPlan, setFilterPlan]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [toast, setToast]         = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]       = useState<{
    open: boolean; title: string; body: React.ReactNode;
    confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void;
  }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });

  // New Account form
  const [newOpen, setNewOpen]       = useState(false);
  const [naName, setNaName]         = useState("");
  const [naEmail, setNaEmail]       = useState("");
  const [naWebsite, setNaWebsite]   = useState("");
  const [naPlan, setNaPlan]         = useState(0);
  const [naSeats, setNaSeats]       = useState("5");
  const [naTrial, setNaTrial]       = useState(true);
  const [naWelcome, setNaWelcome]   = useState(true);

  // Manage Seats modal
  const [seatsRow, setSeatsRow]     = useState<typeof tableData[0] | null>(null);
  const [seatsValue, setSeatsValue] = useState("");

  // Change Plan modal
  const [planRow, setPlanRow]       = useState<typeof tableData[0] | null>(null);
  const [planIdx, setPlanIdx]       = useState(0);

  // Usage Report modal
  const [usageRow, setUsageRow]     = useState<typeof tableData[0] | null>(null);

  const showToast  = (msg: string, type: ToastProps["type"] = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));
  const updateRow   = (id: string, patch: Partial<typeof tableData[0]>) =>
    setTableData(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));
  const deleteRow   = (id: string) => setTableData(rows => rows.filter(r => r.id !== id));

  const filtered = tableData.filter(r => {
    const matchSearch  = !search || r.account.toLowerCase().includes(search.toLowerCase()) || r.owner.toLowerCase().includes(search.toLowerCase()) || r.plan.toLowerCase().includes(search.toLowerCase());
    const matchPlan    = filterPlan   === "All" || r.plan   === filterPlan;
    const matchStatus  = filterStatus === "All" || r.status === filterStatus.toLowerCase().replace(" ", "-");
    return matchSearch && matchPlan && matchStatus;
  });

  const planColor: Record<string, { bg: string; text: string }> = {
    Starter:    { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant    },
    Business:   { bg: M3.secondaryContainer,   text: M3.onSecondaryContainer },
    Enterprise: { bg: M3.primaryContainer,     text: M3.onPrimaryContainer  },
  };

  // ── Row actions ─────────────────────────────────────────────────────────────
  const rowActions = (row: typeof tableData[0]): ActionItem[] => [
    // Navigation
    {
      label: "View Account Details",
      icon: Users,
      onClick: () => onViewDetail(row.id),
    },
    {
      label: "View Usage Report",
      icon: BarChart2,
      onClick: () => setUsageRow(row),
    },
    {
      label: "Manage Seats",
      icon: UserPlus,
      onClick: () => { setSeatsValue(row.seats.split("/")[1]); setSeatsRow(row); },
    },

    // Billing
    {
      label: "Send Invoice",
      icon: Mail,
      dividerBefore: true,
      onClick: () => showToast(`Invoice sent to ${row.owner}`, "success"),
    },
    {
      label: "Send Welcome Email",
      icon: Send,
      onClick: () => showToast(`Welcome email sent to ${row.owner}`, "success"),
    },
    ...(row.status === "past-due" ? [{
      label: "Retry Payment",
      icon: RefreshCw,
      onClick: () => openDialog({
        open: true, danger: false, icon: RefreshCw,
        title: "Retry Payment?",
        body: <span>Retry the outstanding payment for <strong>{row.account}</strong> ({row.mrr})?</span>,
        confirmLabel: "Retry Payment",
        onConfirm: () => { updateRow(row.id, { status: "active", nextBilling: "2025-02-12" }); showToast(`Payment retried for ${row.account}`, "success"); closeDialog(); },
      }),
    }] : []),

    // Plan management
    {
      label: "Change Plan",
      icon: Repeat,
      dividerBefore: true,
      disabled: row.status === "suspended",
      onClick: () => {
        const idx = SAAS_PLANS.findIndex(p => p.label === row.plan);
        setPlanIdx(idx >= 0 ? idx : 0);
        setPlanRow(row);
      },
    },
    {
      label: "Apply Coupon",
      icon: Tag,
      onClick: () => openDialog({
        open: true, danger: false, icon: Tag,
        title: "Apply Coupon Code",
        body: (
          <div className="flex flex-col gap-3">
            <span>Enter a coupon code to apply to <strong>{row.account}</strong>'s next invoice.</span>
            <input
              type="text" placeholder="COUPON_CODE"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none text-center uppercase tracking-widest"
              style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outline}`, color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}
            />
          </div>
        ),
        confirmLabel: "Apply Coupon",
        onConfirm: () => { showToast(`Coupon applied to ${row.account}`, "success"); closeDialog(); },
      }),
    },
    {
      label: "Transfer Ownership",
      icon: Users,
      onClick: () => openDialog({
        open: true, danger: false, icon: Users,
        title: "Transfer Account Ownership?",
        body: (
          <div className="flex flex-col gap-3">
            <span>Transfer <strong>{row.account}</strong> to a new owner. Enter the new owner's email:</span>
            <input
              type="email" placeholder="newowner@company.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outline}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}
            />
          </div>
        ),
        confirmLabel: "Transfer Ownership",
        onConfirm: () => { showToast(`Ownership transfer initiated for ${row.account}`, "success"); closeDialog(); },
      }),
    },

    // Destructive
    {
      label: row.status === "suspended" ? "Reinstate Account" : "Suspend Account",
      icon: row.status === "suspended" ? CheckCircle : Ban,
      danger: row.status !== "suspended",
      dividerBefore: true,
      onClick: () => openDialog({
        open: true,
        danger: row.status !== "suspended",
        icon: row.status === "suspended" ? CheckCircle : Ban,
        title: row.status === "suspended" ? "Reinstate Account?" : "Suspend Account?",
        body: row.status === "suspended"
          ? <span>Restore full access for <strong>{row.account}</strong>? All users will regain their seats immediately.</span>
          : <span>Suspend <strong>{row.account}</strong>? All <strong>{row.seats.split("/")[0]} active users</strong> will lose access immediately.</span>,
        confirmLabel: row.status === "suspended" ? "Reinstate Account" : "Suspend Account",
        onConfirm: () => {
          updateRow(row.id, { status: row.status === "suspended" ? "active" : "suspended" });
          showToast(row.status === "suspended" ? `${row.account} reinstated` : `${row.account} suspended`, row.status === "suspended" ? "success" : "error");
          closeDialog();
        },
      }),
    },
    {
      label: "Force Logout All Users",
      icon: ShieldCheck,
      danger: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: ShieldCheck,
        title: "Force Logout All Users?",
        body: <span>Invalidate all active sessions for <strong>{row.account}</strong>? All <strong>{row.seats.split("/")[0]} users</strong> will be logged out immediately and must sign in again.</span>,
        confirmLabel: "Force Logout",
        onConfirm: () => { showToast(`All sessions ended for ${row.account}`, "warning"); closeDialog(); },
      }),
    },
    {
      label: "Delete Account",
      icon: Trash2,
      danger: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: Trash2,
        title: "Delete Account?",
        body: <span>Permanently delete <strong>{row.account}</strong>? All users, data, and billing history will be destroyed. This cannot be undone.</span>,
        confirmLabel: "Delete Account",
        onConfirm: () => { deleteRow(row.id); showToast(`${row.account} deleted`, "error"); closeDialog(); },
      }),
    },
  ];

  // ── New Account submit ──────────────────────────────────────────────────────
  const handleCreateAccount = () => {
    if (!naName.trim() || !naEmail.trim()) { showToast("Account name and email are required", "error"); return; }
    const plan = SAAS_PLANS[naPlan];
    const newAcc = {
      id: `SAAS-${String(tableData.length + 1).padStart(3, "0")}`,
      account: naName.trim(),
      owner: naEmail.trim(),
      plan: plan.label,
      seats: `0/${naSeats}`,
      mrr: plan.mrr,
      status: naTrial ? "trialing" : "active",
      created: new Date().toISOString().split("T")[0],
      nextBilling: naTrial ? new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0] : new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    };
    setTableData(d => [newAcc, ...d]);
    if (naWelcome) showToast(`Account created & welcome email sent to ${naEmail}`, "success");
    else showToast(`${naName} account created`, "success");
    setNewOpen(false);
    setNaName(""); setNaEmail(""); setNaWebsite(""); setNaPlan(0); setNaSeats("5"); setNaTrial(true); setNaWelcome(true);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Accounts" value={String(tableData.length)}                                              trend="▲ +3 this month"  trendUp icon={Cloud} />
        <KpiCard label="Active"         value={String(tableData.filter(r => r.status === "active").length)}           trend="▲ +2"             trendUp icon={CheckCircle} />
        <KpiCard label="Trialing"       value={String(tableData.filter(r => r.status === "trialing").length)}         trend="Converts in 12d"  trendUp={false} icon={Clock} />
        <KpiCard label="MRR from SaaS"  value="$1,814"                                                                trend="▲ +6.1%"           trendUp icon={DollarSign} />
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-lg"
          style={{ backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${M3.outlineVariant}` }}>
          <Search size={16} color={M3.onSurfaceVariant} />
          <input type="text" placeholder="Search accounts…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", border: "none" }} />
        </div>
        <FilterChip label="Plan"   value={filterPlan}   options={["Starter","Business","Enterprise"]}                    onChange={setFilterPlan} />
        <FilterChip label="Status" value={filterStatus} options={["Active","Trialing","Suspended","Past Due"]}           onChange={setFilterStatus} />
        {(filterPlan !== "All" || filterStatus !== "All") && (
          <button onClick={() => { setFilterPlan("All"); setFilterStatus("All"); }}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ color: M3.error, border: `1px solid ${M3.error}`, background: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            Clear all
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <OutlinedButton small onClick={() => showToast("Accounts exported as CSV", "success")}>
            <DownloadIcon size={14} /> Export
          </OutlinedButton>
          <FilledButton small onClick={() => setNewOpen(true)}>
            <UserPlus size={14} /> New Account
          </FilledButton>
        </div>
      </div>

      {/* ── New Account form panel ── */}
      {newOpen && (
        <Card className="overflow-hidden" style={{ border: `2px solid ${M3.primary}` }}>
          <div className="flex items-center justify-between px-6 py-4"
            style={{ backgroundColor: M3.primaryContainer, borderBottom: `1px solid ${M3.outlineVariant}` }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: M3.primary }}>
                <Cloud size={16} color={M3.onPrimary} />
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>
                  Create New SaaS Account
                </div>
                <div className="text-xs" style={{ color: M3.onPrimaryContainer, opacity: 0.7, fontFamily: "Roboto, sans-serif" }}>
                  The account owner will receive a welcome email with login instructions.
                </div>
              </div>
            </div>
            <IconButton icon={XCircle} onClick={() => setNewOpen(false)} />
          </div>

          <div className="p-6 grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Left column */}
            <div className="flex flex-col gap-4">
              {[
                { label: "Company / Account Name *", value: naName,    setter: setNaName,    placeholder: "Acme Corp",             type: "text" },
                { label: "Owner Email *",             value: naEmail,   setter: setNaEmail,   placeholder: "owner@company.com",     type: "email" },
                { label: "Website",                   value: naWebsite, setter: setNaWebsite, placeholder: "https://company.com",   type: "url" },
                { label: "Initial Seat Count",        value: naSeats,   setter: setNaSeats,   placeholder: "5",                     type: "number" },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                  <input
                    type={f.type} value={f.value} placeholder={f.placeholder}
                    onChange={e => f.setter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${f.value ? M3.primary : M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}
                  />
                </div>
              ))}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Plan selection */}
              <div>
                <div className="text-xs font-medium mb-2" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Plan *</div>
                <div className="flex flex-col gap-2">
                  {SAAS_PLANS.map((plan, i) => {
                    const active = naPlan === i;
                    const pc = planColor[plan.label];
                    return (
                      <button key={plan.label} onClick={() => { setNaPlan(i); setNaSeats(String(plan.seats)); }}
                        className="flex items-center gap-3 p-3 rounded-xl text-left w-full transition-all"
                        style={{ border: `2px solid ${active ? M3.primary : M3.outlineVariant}`, backgroundColor: active ? M3.primaryContainer : M3.surfaceContainerLow, cursor: "pointer" }}>
                        <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ border: `2px solid ${active ? M3.primary : M3.outlineVariant}`, backgroundColor: active ? M3.primary : "transparent" }}>
                          {active && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: M3.onPrimary }} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: pc.bg, color: pc.text, fontFamily: "Roboto, sans-serif" }}>{plan.label}</span>
                            <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{plan.note}</span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold flex-shrink-0" style={{ color: active ? M3.primary : M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{plan.mrr}/mo</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3 pt-2" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
                {[
                  { label: "Start with 14-day free trial",         desc: "No charge until trial ends.",          value: naTrial,   setter: setNaTrial },
                  { label: "Send welcome email to owner",           desc: "Includes login link and onboarding.",  value: naWelcome, setter: setNaWelcome },
                ].map(opt => (
                  <div key={opt.label} className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{opt.label}</div>
                      <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{opt.desc}</div>
                    </div>
                    <Toggle on={opt.value} onChange={opt.setter} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4"
            style={{ borderTop: `1px solid ${M3.outlineVariant}`, backgroundColor: M3.surfaceContainerLow }}>
            <TextButton onClick={() => setNewOpen(false)}>Cancel</TextButton>
            <FilledButton small onClick={handleCreateAccount}><Cloud size={14} /> Create Account</FilledButton>
          </div>
        </Card>
      )}

      {/* ── Table ── */}
      <Card style={{ overflow: "visible" }}>
        <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                {["Account", "Plan", "Seats", "MRR", "Status", "Next Billing", "Created", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const [used, max] = row.seats.split("/").map(Number);
                const pct = Math.round((used / max) * 100);
                return (
                  <tr key={row.id}
                    style={{ backgroundColor: idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: M3.primaryContainer, color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>
                          {row.account.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <button onClick={() => onViewDetail(row.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                            <div className="text-sm font-medium hover:underline" style={{ color: M3.primary, fontFamily: "Roboto, sans-serif" }}>{row.account}</div>
                          </button>
                          <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.owner}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: planColor[row.plan]?.bg, color: planColor[row.plan]?.text, fontFamily: "Roboto, sans-serif" }}>
                        {row.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs mb-1" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>
                        {row.seats} <span style={{ color: M3.onSurfaceVariant }}>({pct}%)</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ width: 64, backgroundColor: M3.outlineVariant }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? M3.error : pct >= 70 ? M3.warning : M3.primary }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.mrr}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-xs"
                      style={{ color: row.status === "past-due" ? M3.error : M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                      {row.status === "past-due" && "⚠ "}{row.nextBilling}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.created}</td>
                    <td className="px-4 py-3" style={{ overflow: "visible" }}>
                      <ActionDropdown actions={rowActions(row)} hint={row.account} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
          <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
            Showing {filtered.length} of {tableData.length} accounts
          </span>
        </div>
      </Card>

      {/* ── Manage Seats modal ── */}
      {seatsRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
          onClick={e => { if (e.target === e.currentTarget) setSeatsRow(null); }}>
          <div className="rounded-3xl overflow-hidden" style={{ width: 420, backgroundColor: M3.surfaceContainer, boxShadow: "0 8px 32px rgba(0,0,0,0.24)" }}>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: M3.primaryContainer }}><UserPlus size={22} color={M3.primary} /></div>
              <div className="font-semibold text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Manage Seats</div>
              <div className="text-sm mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{seatsRow.account} · currently {seatsRow.seats} seats used</div>
            </div>
            <div className="px-6 pb-4 flex flex-col gap-3">
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>New Seat Limit</div>
                <input type="number" min={1} max={200} value={seatsValue} onChange={e => setSeatsValue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-2xl font-light outline-none text-center"
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.primary}`, color: M3.primary, fontFamily: "Roboto Mono, monospace" }} />
              </div>
              <div className="flex gap-2">
                {["5","10","25","50","100"].map(n => (
                  <button key={n} onClick={() => setSeatsValue(n)}
                    className="flex-1 py-1.5 rounded-full text-xs transition-all"
                    style={{ backgroundColor: seatsValue === n ? M3.primary : M3.surfaceContainerHigh, color: seatsValue === n ? M3.onPrimary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="text-xs px-3 py-2.5 rounded-xl" style={{ backgroundColor: M3.infoContainer, color: M3.info, fontFamily: "Roboto, sans-serif" }}>
                ℹ Seat changes take effect immediately. Reducing seats below current usage will block new logins.
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <TextButton onClick={() => setSeatsRow(null)}>Cancel</TextButton>
              <FilledButton small onClick={() => {
                const used = seatsRow.seats.split("/")[0];
                updateRow(seatsRow.id, { seats: `${used}/${seatsValue}` });
                showToast(`${seatsRow.account} seat limit updated to ${seatsValue}`, "success");
                setSeatsRow(null);
              }}>Update Seats</FilledButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Plan modal ── */}
      {planRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
          onClick={e => { if (e.target === e.currentTarget) setPlanRow(null); }}>
          <div className="rounded-3xl overflow-hidden" style={{ width: 460, backgroundColor: M3.surfaceContainer, boxShadow: "0 8px 32px rgba(0,0,0,0.24)" }}>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: M3.primaryContainer }}><Repeat size={22} color={M3.primary} /></div>
              <div className="font-semibold text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Change Plan</div>
              <div className="text-sm mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{planRow.account} · currently on {planRow.plan}</div>
            </div>
            <div className="px-6 pb-4 flex flex-col gap-2">
              {SAAS_PLANS.map((plan, i) => {
                const active  = planIdx === i;
                const current = plan.label === planRow.plan;
                const pc = planColor[plan.label];
                return (
                  <button key={plan.label} onClick={() => setPlanIdx(i)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left w-full transition-all"
                    style={{ border: `2px solid ${active ? M3.primary : M3.outlineVariant}`, backgroundColor: active ? M3.primaryContainer : M3.surfaceContainerLow, cursor: "pointer" }}>
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ border: `2px solid ${active ? M3.primary : M3.outlineVariant}`, backgroundColor: active ? M3.primary : "transparent" }}>
                      {active && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: M3.onPrimary }} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: pc.bg, color: pc.text, fontFamily: "Roboto, sans-serif" }}>{plan.label}</span>
                        {current && <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>· Current</span>}
                      </div>
                      <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{plan.note}</div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: active ? M3.primary : M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{plan.mrr}/mo</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <TextButton onClick={() => setPlanRow(null)}>Cancel</TextButton>
              <FilledButton small disabled={SAAS_PLANS[planIdx].label === planRow.plan}
                onClick={() => {
                  const plan = SAAS_PLANS[planIdx];
                  updateRow(planRow.id, { plan: plan.label, mrr: plan.mrr, seats: `${planRow.seats.split("/")[0]}/${plan.seats}` });
                  showToast(`${planRow.account} moved to ${plan.label} plan`, "success");
                  setPlanRow(null);
                }}>
                Confirm Plan Change
              </FilledButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Usage Report modal ── */}
      {usageRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
          onClick={e => { if (e.target === e.currentTarget) setUsageRow(null); }}>
          <div className="rounded-3xl overflow-hidden" style={{ width: 520, backgroundColor: M3.surfaceContainer, boxShadow: "0 8px 32px rgba(0,0,0,0.24)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <div>
                <div className="font-semibold text-base" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Usage Report</div>
                <div className="text-sm mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{usageRow.account} · {usageRow.plan} plan</div>
              </div>
              <IconButton icon={XCircle} onClick={() => setUsageRow(null)} />
            </div>
            <div className="p-6 flex flex-col gap-4">
              {[
                { label: "Active Seats",        value: usageRow.seats,  max: usageRow.seats.split("/")[1], color: M3.primary },
                { label: "API Calls (30d)",      value: "48,291",        max: "100,000",                   color: M3.secondary },
                { label: "Storage Used",         value: "2.4 GB",        max: "10 GB",                     color: M3.info },
                { label: "Bandwidth (30d)",      value: "18.7 GB",       max: "100 GB",                    color: M3.success },
              ].map(item => {
                const [used, max] = [parseFloat(item.value), parseFloat(item.max)];
                const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{item.label}</span>
                      <span className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>
                        {item.value} / {item.max}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: M3.surfaceContainerHigh }}>
                      <div className="h-full rounded-full" style={{ width: `${pct || 48}%`, backgroundColor: pct >= 90 ? M3.error : item.color }} />
                    </div>
                  </div>
                );
              })}
              <div className="grid grid-cols-3 gap-3 pt-2" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
                {[
                  { label: "Logins (30d)",    value: "1,284" },
                  { label: "Integrations",    value: "3 active" },
                  { label: "Last Active",     value: "2h ago" },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl text-center" style={{ backgroundColor: M3.surfaceContainerLow }}>
                    <div className="text-lg font-light" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{s.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end px-6 py-4" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <OutlinedButton small onClick={() => showToast("Usage report exported", "success")}>
                <DownloadIcon size={14} /> Export Report
              </OutlinedButton>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={dialog.open} title={dialog.title} body={dialog.body} confirmLabel={dialog.confirmLabel} danger={dialog.danger} icon={dialog.icon} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Affiliate Detail Data ─────────────────────────────────────────────────────
const affiliateConversions: Record<string, Array<{
  id: number; customer: string; product: string; saleValue: string;
  commission: string; date: string; status: string; orderRef: string;
}>> = {
  "AFF-001": [
    { id: 1,  customer: "felix@wagner.de",   product: "Plugin Pro Annual",    saleValue: "$99",  commission: "$9.90",  date: "2025-01-10", status: "approved", orderRef: "ORD-8821" },
    { id: 2,  customer: "sophie@martin.fr",  product: "Theme Bundle",         saleValue: "$59",  commission: "$5.90",  date: "2025-01-08", status: "approved", orderRef: "ORD-8817" },
    { id: 3,  customer: "yuki@tanaka.jp",    product: "Plugin Pro Annual",    saleValue: "$99",  commission: "$9.90",  date: "2025-01-05", status: "pending",  orderRef: "ORD-8809" },
    { id: 4,  customer: "peter@harris.com",  product: "SaaS Starter",         saleValue: "$49",  commission: "$4.90",  date: "2024-12-28", status: "approved", orderRef: "ORD-8791" },
    { id: 5,  customer: "anna@schmidt.de",   product: "Plugin Pro Monthly",   saleValue: "$9",   commission: "$0.90",  date: "2024-12-20", status: "approved", orderRef: "ORD-8778" },
    { id: 6,  customer: "oliver@white.co",   product: "Theme Bundle",         saleValue: "$59",  commission: "$5.90",  date: "2024-12-15", status: "approved", orderRef: "ORD-8762" },
    { id: 7,  customer: "maria@lopez.mx",    product: "Plugin Pro Annual",    saleValue: "$99",  commission: "$9.90",  date: "2024-12-10", status: "refunded",  orderRef: "ORD-8748" },
    { id: 8,  customer: "chris@evans.io",    product: "Security Module",      saleValue: "$39",  commission: "$3.90",  date: "2024-12-05", status: "approved", orderRef: "ORD-8731" },
  ],
  "AFF-002": [
    { id: 1,  customer: "noah@example.com",  product: "Plugin Pro Annual",    saleValue: "$99",  commission: "$9.90",  date: "2025-01-09", status: "approved", orderRef: "ORD-8820" },
    { id: 2,  customer: "ava@example.com",   product: "SaaS Pro Annual",      saleValue: "$199", commission: "$19.90", date: "2025-01-06", status: "approved", orderRef: "ORD-8810" },
    { id: 3,  customer: "liam@example.com",  product: "Theme Bundle",         saleValue: "$59",  commission: "$5.90",  date: "2024-12-22", status: "pending",  orderRef: "ORD-8785" },
  ],
};

const affiliatePayouts: Record<string, Array<{
  id: string; date: string; amount: string; method: string; status: string; ref: string;
}>> = {
  "AFF-001": [
    { id: "PAY-041", date: "2025-01-01", amount: "$320.00", method: "PayPal",      status: "paid",    ref: "PP-84920" },
    { id: "PAY-033", date: "2024-12-01", amount: "$280.00", method: "PayPal",      status: "paid",    ref: "PP-79341" },
    { id: "PAY-025", date: "2024-11-01", amount: "$310.00", method: "PayPal",      status: "paid",    ref: "PP-74122" },
    { id: "PAY-017", date: "2024-10-01", amount: "$250.00", method: "PayPal",      status: "paid",    ref: "PP-68901" },
    { id: "PAY-009", date: "2024-09-01", amount: "$300.00", method: "PayPal",      status: "paid",    ref: "PP-63421" },
  ],
  "AFF-002": [
    { id: "PAY-040", date: "2025-01-01", amount: "$180.00", method: "Bank Transfer",status: "paid",   ref: "TXN-29182" },
    { id: "PAY-032", date: "2024-12-01", amount: "$210.00", method: "Bank Transfer",status: "paid",   ref: "TXN-27441" },
  ],
};

const affiliateLinks: Record<string, Array<{
  id: number; label: string; url: string; clicks: number; conversions: number; created: string;
}>> = {
  "AFF-001": [
    { id: 1, label: "Homepage Banner",        url: "https://example.com/?ref=WPBEG&utm_source=banner",   clicks: 2841, conversions: 312, created: "2023-02-01" },
    { id: 2, label: "Review Article",         url: "https://example.com/?ref=WPBEG&utm_source=review",  clicks: 1940, conversions: 289, created: "2023-04-15" },
    { id: 3, label: "Email Newsletter",       url: "https://example.com/?ref=WPBEG&utm_source=email",   clicks: 812,  conversions: 89,  created: "2023-06-10" },
    { id: 4, label: "YouTube Video",          url: "https://example.com/?ref=WPBEG&utm_source=youtube", clicks: 247,  conversions: 22,  created: "2024-01-20" },
  ],
  "AFF-002": [
    { id: 1, label: "Blog Post — Best Plugins", url: "https://example.com/?ref=KINSTA&utm_source=blog",    clicks: 1890, conversions: 241, created: "2023-04-01" },
    { id: 2, label: "Resource Page",            url: "https://example.com/?ref=KINSTA&utm_source=resource",clicks: 1320, conversions: 150, created: "2023-07-12" },
  ],
};

const affiliateClickTrend: Record<string, Array<{ month: string; clicks: number; conversions: number }>> = {
  "AFF-001": [
    { month: "Aug", clicks: 420, conversions: 52 }, { month: "Sep", clicks: 510, conversions: 61 },
    { month: "Oct", clicks: 480, conversions: 58 }, { month: "Nov", clicks: 620, conversions: 79 },
    { month: "Dec", clicks: 590, conversions: 71 }, { month: "Jan", clicks: 649, conversions: 82 },
  ],
  "AFF-002": [
    { month: "Aug", clicks: 240, conversions: 29 }, { month: "Sep", clicks: 280, conversions: 34 },
    { month: "Oct", clicks: 310, conversions: 38 }, { month: "Nov", clicks: 290, conversions: 35 },
    { month: "Dec", clicks: 340, conversions: 41 }, { month: "Jan", clicks: 360, conversions: 44 },
  ],
};

const affiliateTopProducts: Record<string, Array<{ product: string; conversions: number; revenue: string; pct: number }>> = {
  "AFF-001": [
    { product: "Plugin Pro Annual",  conversions: 389, revenue: "$38,511", pct: 100 },
    { product: "Theme Bundle",       conversions: 210, revenue: "$12,390", pct:  54 },
    { product: "SaaS Starter",       conversions:  89, revenue: "$4,361",  pct:  23 },
    { product: "Security Module",    conversions:  24, revenue: "$936",    pct:   6 },
  ],
  "AFF-002": [
    { product: "Plugin Pro Annual",  conversions: 201, revenue: "$19,899", pct: 100 },
    { product: "SaaS Pro Annual",    conversions:  98, revenue: "$19,502", pct:  49 },
    { product: "Theme Bundle",       conversions:  92, revenue: "$5,428",  pct:  46 },
  ],
};

// ─── Affiliate Detail Page ─────────────────────────────────────────────────────
function AffiliateDetailPage({ affiliateId, onBack }: { affiliateId: string; onBack: () => void }) {
  const aff        = affiliatesData.find(a => a.id === affiliateId) ?? affiliatesData[0];
  const conversions= affiliateConversions[affiliateId] ?? affiliateConversions["AFF-001"];
  const payouts    = affiliatePayouts[affiliateId]     ?? affiliatePayouts["AFF-001"];
  const links      = affiliateLinks[affiliateId]       ?? affiliateLinks["AFF-001"];
  const clickTrend = affiliateClickTrend[affiliateId]  ?? affiliateClickTrend["AFF-001"];
  const topProds   = affiliateTopProducts[affiliateId] ?? affiliateTopProducts["AFF-001"];

  const [tab, setTab]       = useState<"overview" | "conversions" | "links" | "payouts" | "activity">("overview");
  const [toast, setToast]   = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog] = useState<{
    open: boolean; title: string; body: React.ReactNode;
    confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void;
  }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });

  // Edit rate inline
  const [editRate, setEditRate]   = useState(false);
  const [rateValue, setRateValue] = useState(aff.rate.replace("%", ""));

  // New link form
  const [addLinkOpen, setAddLinkOpen]   = useState(false);
  const [linkLabel, setLinkLabel]       = useState("");
  const [linkSource, setLinkSource]     = useState("blog");
  const [localLinks, setLocalLinks]     = useState(links);

  const showToast  = (msg: string, type: ToastProps["type"] = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));

  const convRate = Math.round((aff.conversions / Math.max(aff.clicks, 1)) * 100);

  const statusStyle: Record<string, { bg: string; text: string }> = {
    active:    { bg: M3.successContainer, text: M3.success },
    pending:   { bg: M3.warningContainer, text: M3.warning },
    suspended: { bg: "#FFDAD6",           text: M3.error   },
  };

  const convStatusStyle: Record<string, { bg: string; text: string }> = {
    approved: { bg: M3.successContainer,     text: M3.success          },
    pending:  { bg: M3.warningContainer,     text: M3.warning          },
    refunded: { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant },
  };

  const tabs = [
    { id: "overview"     as const, label: "Overview"                        },
    { id: "conversions"  as const, label: `Conversions (${conversions.length})` },
    { id: "links"        as const, label: `Referral Links (${localLinks.length})` },
    { id: "payouts"      as const, label: `Payouts (${payouts.length})`     },
    { id: "activity"     as const, label: "Activity"                        },
  ];

  return (
    <div className="flex flex-col gap-5">

      <TextButton onClick={onBack}>← Back to Affiliates</TextButton>

      {/* ── Hero card ── */}
      <Card className="overflow-hidden">
        <div className="h-24 w-full" style={{ background: `linear-gradient(135deg, ${M3.secondary} 0%, #7B6FA0 100%)` }} />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between" style={{ marginTop: -36 }}>
            <div className="flex items-end gap-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl text-2xl font-semibold border-4 border-white shadow-sm"
                style={{ backgroundColor: M3.secondaryContainer, color: M3.onSecondaryContainer, fontFamily: "Roboto, sans-serif" }}>
                {aff.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{aff.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: statusStyle[aff.status]?.bg, color: statusStyle[aff.status]?.text, fontFamily: "Roboto, sans-serif" }}>
                    {aff.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-sm flex items-center gap-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    <Mail size={12} />{aff.email}
                  </span>
                  <span className="text-sm flex items-center gap-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    <Globe size={12} />{aff.email.split("@")[1]}
                  </span>
                </div>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2 pb-1">
              <OutlinedButton small onClick={() => openDialog({
                open: true, danger: false, icon: DollarSign,
                title: "Send Commission Payment?",
                body: <span>Pay <strong>{aff.commission}</strong> owed commission to <strong>{aff.name}</strong>? Balance resets to $0.</span>,
                confirmLabel: "Send Payment",
                onConfirm: () => { showToast(`${aff.commission} paid to ${aff.name}`, "success"); closeDialog(); },
              })}>
                <DollarSign size={14} /> Pay Commission
              </OutlinedButton>
              <TonalButton small onClick={() => showToast(`Message sent to ${aff.email}`, "success")}>
                <Mail size={14} /> Send Message
              </TonalButton>
              <ActionDropdown actions={[
                { label: "Copy Referral Code",  icon: Copy,        onClick: () => { navigator.clipboard?.writeText(aff.code); showToast("Referral code copied", "info"); } },
                { label: "Copy Referral Link",  icon: Copy,        onClick: () => { navigator.clipboard?.writeText(`https://example.com/?ref=${aff.code}`); showToast("Referral link copied", "info"); } },
                { label: "Edit Commission Rate",icon: Edit3,       onClick: () => setEditRate(true) },
                { label: "View All Payouts",    icon: FileText,    onClick: () => setTab("payouts") },
                { label: "Export Affiliate Data",icon: DownloadIcon,onClick: () => showToast("Affiliate data exported", "success"), dividerBefore: true },
                { label: "Regenerate Referral Code", icon: RefreshCw, danger: true, dividerBefore: true,
                  onClick: () => openDialog({ open: true, danger: true, icon: RefreshCw,
                    title: "Regenerate Referral Code?",
                    body: <span>Replace code <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{aff.code}</strong>? All existing links using this code will immediately break.</span>,
                    confirmLabel: "Regenerate Code",
                    onConfirm: () => { showToast("New referral code generated", "success"); closeDialog(); } }) },
              ]} />
            </div>
          </div>

          {/* Meta strip */}
          <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
            {[
              { icon: Hash,          label: "Affiliate ID",      value: aff.id         },
              { icon: Calendar,      label: "Joined",            value: aff.joined      },
              { icon: Tag,           label: "Commission Rate",   value: aff.rate        },
              { icon: DollarSign,    label: "Total Paid Out",    value: aff.paid        },
              { icon: MousePointerClick, label: "Conv. Rate",    value: `${convRate}%`  },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-1.5">
                <m.icon size={13} color={M3.onSurfaceVariant} />
                <div>
                  <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{m.label}</div>
                  <div className="text-xs font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{m.value}</div>
                </div>
              </div>
            ))}

            {/* Referral code badge */}
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: M3.primaryContainer, border: `1px solid ${M3.outlineVariant}` }}>
              <span className="text-xs font-medium" style={{ color: M3.onPrimaryContainer, fontFamily: "Roboto Mono, monospace" }}>{aff.code}</span>
              <button onClick={() => { navigator.clipboard?.writeText(`https://example.com/?ref=${aff.code}`); showToast("Referral link copied", "info"); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, opacity: 0.7 }}>
                <Copy size={12} color={M3.onPrimaryContainer} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: MousePointerClick, label: "Total Clicks",      value: aff.clicks.toLocaleString(), sub: "All time",         color: M3.primary,   bg: M3.primaryContainer  },
          { icon: UserPlus,          label: "Total Conversions", value: String(aff.conversions),     sub: `${convRate}% conv. rate`, color: M3.success, bg: M3.successContainer },
          { icon: DollarSign,        label: "Revenue Generated", value: aff.revenue,                 sub: "All time",         color: M3.secondary, bg: M3.secondaryContainer },
          { icon: Tag,               label: "Commission Owed",   value: aff.commission,              sub: `${aff.rate} rate`, color: M3.warning,   bg: M3.warningContainer  },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: s.bg }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div className="text-2xl font-light" style={{ color: s.color, fontFamily: "Roboto, sans-serif" }}>{s.value}</div>
              <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{s.label}</div>
              <div className="text-xs" style={{ color: M3.outlineVariant, fontFamily: "Roboto, sans-serif" }}>{s.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Edit Rate inline card ── */}
      {editRate && (
        <Card className="p-5 flex items-center gap-5" style={{ border: `2px solid ${M3.secondary}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: M3.secondaryContainer }}>
            <Edit3 size={18} color={M3.secondary} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
              Edit Commission Rate — <span style={{ color: M3.secondary }}>{aff.name}</span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
              Current: <strong>{aff.rate}</strong> · Revenue generated: {aff.revenue}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={50} value={rateValue} onChange={e => setRateValue(e.target.value)}
                className="w-20 px-3 py-2 rounded-lg text-lg font-light outline-none text-center"
                style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.secondary}`, color: M3.secondary, fontFamily: "Roboto Mono, monospace" }} />
              <span className="text-lg" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>%</span>
            </div>
            <div className="flex gap-1">
              {["5","10","15","20","25"].map(p => (
                <button key={p} onClick={() => setRateValue(p)}
                  className="w-10 h-8 rounded-lg text-xs"
                  style={{ backgroundColor: rateValue === p ? M3.secondary : M3.surfaceContainerHigh, color: rateValue === p ? M3.onSecondary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  {p}%
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <TextButton onClick={() => setEditRate(false)}>Cancel</TextButton>
            <TonalButton small onClick={() => { showToast(`Commission rate updated to ${rateValue}% for ${aff.name}`, "success"); setEditRate(false); }}>Save Rate</TonalButton>
          </div>
        </Card>
      )}

      {/* ── Tabbed panel ── */}
      <Card className="flex flex-col" style={{ overflow: "visible" }}>
        {/* Tab bar */}
        <div className="flex" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all"
              style={{ color: tab === t.id ? M3.primary : M3.onSurfaceVariant, borderBottom: tab === t.id ? `2px solid ${M3.primary}` : "2px solid transparent", background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${M3.primary}` : "2px solid transparent", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════ OVERVIEW ════ */}
        {tab === "overview" && (
          <div className="p-6 flex flex-col gap-6">
            {/* Click & conversion trend */}
            <div>
              <div className="font-medium text-sm mb-3" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Clicks &amp; Conversions — Last 6 months</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={clickTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
                  <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Roboto, sans-serif" }} />
                  <Line yAxisId="left"  type="monotone" dataKey="clicks"      name="Clicks"      stroke={M3.primary}   strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="conversions" name="Conversions" stroke={M3.success}   strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top products + account summary side by side */}
            <div className="grid gap-5" style={{ gridTemplateColumns: "3fr 2fr" }}>
              <div>
                <div className="font-medium text-sm mb-3" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Top Products by Conversions</div>
                <div className="flex flex-col gap-3">
                  {topProds.map(p => (
                    <div key={p.product}>
                      <div className="flex items-center justify-between mb-1 text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                        <span style={{ color: M3.onSurface }}>{p.product}</span>
                        <div className="flex items-center gap-3">
                          <span style={{ color: M3.success }}>{p.revenue}</span>
                          <span style={{ color: M3.onSurfaceVariant }}>{p.conversions} conv.</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: M3.surfaceContainerHigh }}>
                        <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: M3.primary }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-medium text-sm mb-3" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Performance Summary</div>
                <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {[
                    { label: "Affiliate ID",     value: aff.id },
                    { label: "Status",           value: aff.status.charAt(0).toUpperCase() + aff.status.slice(1) },
                    { label: "Referral Code",    value: aff.code },
                    { label: "Commission Rate",  value: aff.rate },
                    { label: "Joined",           value: aff.joined },
                    { label: "Total Paid Out",   value: aff.paid },
                    { label: "Conv. Rate",       value: `${convRate}%` },
                    { label: "Active Links",     value: String(localLinks.length) },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.label}</span>
                      <span className="text-xs font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ CONVERSIONS ════ */}
        {tab === "conversions" && (
          <div>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <span className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
                {conversions.filter(c => c.status === "approved").length} approved · {conversions.filter(c => c.status === "pending").length} pending · {conversions.filter(c => c.status === "refunded").length} refunded
              </span>
              <OutlinedButton small onClick={() => showToast("Conversions exported as CSV", "success")}>
                <DownloadIcon size={14} /> Export
              </OutlinedButton>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["Order Ref", "Customer", "Product", "Sale Value", "Commission", "Date", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conversions.map((c, idx) => (
                  <tr key={c.id}
                    style={{ backgroundColor: idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.primary, fontFamily: "Roboto Mono, monospace" }}>{c.orderRef}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{c.customer}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{c.product}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{c.saleValue}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: M3.success, fontFamily: "Roboto Mono, monospace" }}>{c.commission}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{c.date}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: convStatusStyle[c.status]?.bg, color: convStatusStyle[c.status]?.text, fontFamily: "Roboto, sans-serif" }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.status === "pending" && (
                        <TextButton small onClick={() => openDialog({ open: true, danger: false, icon: CheckCircle,
                          title: "Approve Conversion?",
                          body: <span>Approve order <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{c.orderRef}</strong> ({c.saleValue}) and credit <strong>{c.commission}</strong> to {aff.name}?</span>,
                          confirmLabel: "Approve",
                          onConfirm: () => { showToast(`${c.orderRef} approved — ${c.commission} credited`, "success"); closeDialog(); } })}>
                          Approve
                        </TextButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════ REFERRAL LINKS ════ */}
        {tab === "links" && (
          <div>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <span className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Tracking Links</span>
              <FilledButton small onClick={() => setAddLinkOpen(o => !o)}>
                <ArrowUpRight size={14} /> New Link
              </FilledButton>
            </div>

            {/* New link form */}
            {addLinkOpen && (
              <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: M3.primaryContainer, borderBottom: `1px solid ${M3.outlineVariant}` }}>
                <input type="text" placeholder="Label (e.g. Email Newsletter)" value={linkLabel} onChange={e => setLinkLabel(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: M3.surface, border: `1px solid ${M3.outline}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }} />
                <select value={linkSource} onChange={e => setLinkSource(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: M3.surface, border: `1px solid ${M3.outline}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
                  {["blog", "email", "social", "youtube", "podcast", "banner", "review"].map(s => <option key={s}>{s}</option>)}
                </select>
                <FilledButton small onClick={() => {
                  if (!linkLabel.trim()) { showToast("Enter a link label", "error"); return; }
                  setLocalLinks(l => [...l, { id: Date.now(), label: linkLabel, url: `https://example.com/?ref=${aff.code}&utm_source=${linkSource}`, clicks: 0, conversions: 0, created: new Date().toISOString().split("T")[0] }]);
                  showToast(`New tracking link created`, "success");
                  setLinkLabel(""); setAddLinkOpen(false);
                }}>
                  Create Link
                </FilledButton>
                <TextButton onClick={() => setAddLinkOpen(false)}>Cancel</TextButton>
              </div>
            )}

            <div className="flex flex-col gap-0">
              {localLinks.map((link, idx) => (
                <div key={link.id} className="flex items-start gap-4 px-5 py-4 transition-all"
                  style={{ borderBottom: `1px solid ${M3.outlineVariant}`, backgroundColor: idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: M3.primaryContainer }}>
                    <Globe size={15} color={M3.primary} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{link.label}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: M3.primary, fontFamily: "Roboto Mono, monospace" }}>{link.url}</div>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                        <strong style={{ color: M3.onSurface }}>{link.clicks.toLocaleString()}</strong> clicks
                      </span>
                      <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                        <strong style={{ color: M3.onSurface }}>{link.conversions}</strong> conversions
                      </span>
                      {link.clicks > 0 && (
                        <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                          <strong style={{ color: M3.success }}>{Math.round((link.conversions / link.clicks) * 100)}%</strong> conv. rate
                        </span>
                      )}
                      <span className="text-xs" style={{ color: M3.outlineVariant, fontFamily: "Roboto, sans-serif" }}>Created {link.created}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { navigator.clipboard?.writeText(link.url); showToast("Link copied to clipboard", "info"); }}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all"
                      style={{ backgroundColor: M3.surfaceContainerHigh, color: M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                      <Copy size={11} /> Copy
                    </button>
                    <button onClick={() => openDialog({ open: true, danger: true, icon: Trash2,
                      title: "Delete Tracking Link?",
                      body: <span>Delete the tracking link <strong>"{link.label}"</strong>? Clicks and conversions history will be lost.</span>,
                      confirmLabel: "Delete Link",
                      onConfirm: () => { setLocalLinks(l => l.filter(x => x.id !== link.id)); showToast("Link deleted", "error"); closeDialog(); } })}
                      className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                      style={{ background: "none", border: "none", cursor: "pointer", color: M3.error }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FFDAD6"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ PAYOUTS ════ */}
        {tab === "payouts" && (
          <div>
            {/* Summary banner */}
            <div className="flex items-center gap-6 px-5 py-4" style={{ backgroundColor: M3.surfaceContainerLow, borderBottom: `1px solid ${M3.outlineVariant}` }}>
              {[
                { label: "Total Paid Out", value: aff.paid,       color: M3.success  },
                { label: "Commission Owed",value: aff.commission,  color: M3.warning  },
                { label: "Payout Count",   value: String(payouts.length), color: M3.onSurface },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xl font-light" style={{ color: s.color, fontFamily: "Roboto Mono, monospace" }}>{s.value}</div>
                  <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{s.label}</div>
                </div>
              ))}
              <div className="ml-auto">
                <FilledButton small onClick={() => openDialog({ open: true, danger: false, icon: DollarSign,
                  title: "Send Commission Payment?",
                  body: <span>Pay <strong>{aff.commission}</strong> to <strong>{aff.name}</strong> via their registered payment method?</span>,
                  confirmLabel: "Send Payment",
                  onConfirm: () => { showToast(`${aff.commission} paid to ${aff.name}`, "success"); closeDialog(); } })}>
                  <DollarSign size={14} /> Pay Now ({aff.commission})
                </FilledButton>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["Payment ID", "Date", "Amount", "Method", "Reference", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p, idx) => (
                  <tr key={p.id}
                    style={{ backgroundColor: idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.primary, fontFamily: "Roboto Mono, monospace" }}>{p.id}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{p.date}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: M3.success, fontFamily: "Roboto Mono, monospace" }}>{p.amount}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{p.method}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{p.ref}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: p.status === "paid" ? M3.successContainer : M3.warningContainer, color: p.status === "paid" ? M3.success : M3.warning, fontFamily: "Roboto, sans-serif" }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════ ACTIVITY ════ */}
        {tab === "activity" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="font-medium text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Affiliate Event Log</div>
              <OutlinedButton small onClick={() => showToast("Activity log exported", "success")}>
                <DownloadIcon size={14} /> Export
              </OutlinedButton>
            </div>
            <div className="flex flex-col">
              {[
                { icon: UserPlus,   color: M3.success,   desc: `${aff.name} joined the affiliate program`,          time: aff.joined + " 10:00", actor: "System"   },
                { icon: CheckCircle,color: M3.success,   desc: "Application approved by admin",                     time: aff.joined + " 10:05", actor: "Admin"    },
                { icon: Tag,        color: M3.primary,   desc: `Commission rate set to ${aff.rate}`,                time: aff.joined + " 10:06", actor: "Admin"    },
                { icon: MousePointerClick, color: M3.info, desc: "First referral click recorded",                  time: "2023-02-15 14:22",    actor: "System"   },
                { icon: DollarSign, color: M3.success,   desc: `First conversion — Plugin Pro Annual ($99)`,       time: "2023-02-28 09:11",    actor: "System",  meta: `+$${Math.round(99 * parseInt(aff.rate) / 100)}.00` },
                { icon: CreditCard, color: M3.success,   desc: `Commission payment sent — ${aff.paid}`,            time: "2025-01-01 00:00",    actor: "Admin",   meta: aff.paid },
                { icon: RefreshCw,  color: M3.secondary, desc: "Referral code refreshed by affiliate",             time: "2024-06-01 11:30",    actor: aff.email  },
              ].map((evt, i) => {
                const Icon = evt.icon;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${evt.color}15`, border: `1.5px solid ${evt.color}40` }}>
                        <Icon size={15} color={evt.color} />
                      </div>
                      {i < 6 && <div className="w-px flex-1 my-1.5" style={{ backgroundColor: M3.outlineVariant, minHeight: 16 }} />}
                    </div>
                    <div className="flex-1 pb-5 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{evt.desc}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{evt.time}</span>
                            <span style={{ color: M3.outlineVariant }}>·</span>
                            <span className="text-xs font-medium" style={{ color: evt.actor === "System" ? M3.secondary : M3.primary, fontFamily: "Roboto, sans-serif" }}>{evt.actor}</span>
                          </div>
                        </div>
                        {(evt as any).meta && (
                          <span className="text-sm font-semibold flex-shrink-0" style={{ color: M3.success, fontFamily: "Roboto Mono, monospace" }}>{(evt as any).meta}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog open={dialog.open} title={dialog.title} body={dialog.body} confirmLabel={dialog.confirmLabel} danger={dialog.danger} icon={dialog.icon} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Affiliates Page ───────────────────────────────────────────────────────────
function AffiliatesPage({ onViewDetail }: { onViewDetail: (id: string) => void }) {
  const [tableData, setTableData]   = useState(affiliatesData);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRate, setFilterRate]     = useState("All");
  const [toast, setToast]           = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]         = useState<{
    open: boolean; title: string; body: React.ReactNode;
    confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void;
  }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });

  // Add Affiliate form
  const [addOpen, setAddOpen]       = useState(false);
  const [afName, setAfName]         = useState("");
  const [afEmail, setAfEmail]       = useState("");
  const [afWebsite, setAfWebsite]   = useState("");
  const [afRate, setAfRate]         = useState("10");
  const [afNotes, setAfNotes]       = useState("");
  const [afAutoApprove, setAfAutoApprove] = useState(false);
  const [afWelcome, setAfWelcome]   = useState(true);

  // Edit Commission Rate panel
  const [editRateRow, setEditRateRow]   = useState<typeof tableData[0] | null>(null);
  const [editRateValue, setEditRateValue] = useState("");

  // Conversion History modal
  const [historyRow, setHistoryRow] = useState<typeof tableData[0] | null>(null);

  const showToast  = (msg: string, type: ToastProps["type"] = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));
  const updateRow   = (id: string, patch: Partial<typeof tableData[0]>) =>
    setTableData(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));
  const deleteRow   = (id: string) => setTableData(rows => rows.filter(r => r.id !== id));

  const filtered = tableData.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus.toLowerCase();
    const matchRate   = filterRate   === "All" || r.rate === filterRate;
    return matchSearch && matchStatus && matchRate;
  });

  const statusStyle: Record<string, { bg: string; text: string }> = {
    active:    { bg: M3.successContainer, text: M3.success },
    pending:   { bg: M3.warningContainer, text: M3.warning },
    suspended: { bg: "#FFDAD6",           text: M3.error   },
  };

  // ── Row actions ─────────────────────────────────────────────────────────────
  const rowActions = (row: typeof tableData[0]): ActionItem[] => [
    // Navigation
    {
      label: "View Affiliate Details",
      icon: BarChart2,
      onClick: () => onViewDetail(row.id),
    },
    {
      label: "View Conversion History",
      icon: FileText,
      onClick: () => setHistoryRow(row),
    },
    {
      label: "Copy Referral Link",
      icon: Copy,
      onClick: () => {
        navigator.clipboard?.writeText(`https://example.com/?ref=${row.code}`);
        showToast(`Referral link for ${row.name} copied`, "info");
      },
    },

    // Payments & rates
    {
      label: "Edit Commission Rate",
      icon: Edit3,
      dividerBefore: true,
      onClick: () => { setEditRateValue(row.rate.replace("%", "")); setEditRateRow(row); },
    },
    {
      label: "Send Commission Payment",
      icon: DollarSign,
      disabled: row.status !== "active" || row.commission === "$0",
      onClick: () => openDialog({
        open: true, danger: false, icon: DollarSign,
        title: "Send Commission Payment?",
        body: (
          <span>
            Pay <strong>{row.commission}</strong> owed commission to <strong>{row.name}</strong>?
            This will be recorded as paid and reset the owed balance to $0.
          </span>
        ),
        confirmLabel: "Send Payment",
        onConfirm: () => { updateRow(row.id, { paid: `$${(parseFloat(row.paid.replace("$","").replace(",","")) + parseFloat(row.commission.replace("$","").replace(",",""))).toLocaleString()}`, commission: "$0" }); showToast(`${row.commission} paid to ${row.name}`, "success"); closeDialog(); },
      }),
    },
    {
      label: "Send Message",
      icon: Mail,
      onClick: () => showToast(`Message sent to ${row.email}`, "success"),
    },

    // Status transitions
    ...(row.status === "pending" ? [
      {
        label: "Approve Affiliate",
        icon: CheckCircle,
        dividerBefore: true,
        onClick: () => openDialog({
          open: true, danger: false, icon: CheckCircle,
          title: "Approve Affiliate?",
          body: (
            <span>
              Approve <strong>{row.name}</strong> as an affiliate partner?
              They will receive an email with their referral code and dashboard access.
            </span>
          ),
          confirmLabel: "Approve Affiliate",
          onConfirm: () => { updateRow(row.id, { status: "active" }); showToast(`${row.name} approved as affiliate`, "success"); closeDialog(); },
        }),
      },
      {
        label: "Reject Application",
        icon: XCircle,
        danger: true,
        onClick: () => openDialog({
          open: true, danger: true, icon: XCircle,
          title: "Reject Application?",
          body: <span>Reject <strong>{row.name}</strong>'s affiliate application? They will be notified by email.</span>,
          confirmLabel: "Reject Application",
          onConfirm: () => { deleteRow(row.id); showToast(`${row.name}'s application rejected`, "warning"); closeDialog(); },
        }),
      },
    ] : []),
    ...(row.status === "suspended" ? [{
      label: "Reinstate Affiliate",
      icon: CheckCircle,
      dividerBefore: true,
      onClick: () => openDialog({
        open: true, danger: false, icon: CheckCircle,
        title: "Reinstate Affiliate?",
        body: <span>Restore <strong>{row.name}</strong>'s affiliate status? Their referral links will start converting again immediately.</span>,
        confirmLabel: "Reinstate",
        onConfirm: () => { updateRow(row.id, { status: "active" }); showToast(`${row.name} reinstated`, "success"); closeDialog(); },
      }),
    }] : row.status === "active" ? [{
      label: "Suspend Affiliate",
      icon: Ban,
      danger: true,
      dividerBefore: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: Ban,
        title: "Suspend Affiliate?",
        body: <span>Suspend <strong>{row.name}</strong>? Their referral code <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.code}</strong> will stop converting immediately.</span>,
        confirmLabel: "Suspend Affiliate",
        onConfirm: () => { updateRow(row.id, { status: "suspended" }); showToast(`${row.name} suspended`, "error"); closeDialog(); },
      }),
    }] : []),

    // Destructive
    {
      label: "Regenerate Referral Code",
      icon: RefreshCw,
      danger: true,
      dividerBefore: row.status !== "pending",
      onClick: () => openDialog({
        open: true, danger: true, icon: RefreshCw,
        title: "Regenerate Referral Code?",
        body: (
          <span>
            Generate a new referral code for <strong>{row.name}</strong>?
            Their current code <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.code}</strong> will stop working immediately.
            Any existing links using the old code will break.
          </span>
        ),
        confirmLabel: "Regenerate Code",
        onConfirm: () => {
          const newCode = row.name.split(" ")[0].toUpperCase().slice(0, 5) + Math.floor(Math.random() * 90 + 10);
          updateRow(row.id, { code: newCode });
          showToast(`New referral code generated: ${newCode}`, "success");
          closeDialog();
        },
      }),
    },
    {
      label: "Remove Affiliate",
      icon: Trash2,
      danger: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: Trash2,
        title: "Remove Affiliate?",
        body: <span>Remove <strong>{row.name}</strong> from the program? Their referral code will be deactivated. Conversion history will be retained for reporting.</span>,
        confirmLabel: "Remove Affiliate",
        onConfirm: () => { deleteRow(row.id); showToast(`${row.name} removed from affiliate program`, "error"); closeDialog(); },
      }),
    },
  ];

  // ── Add Affiliate submit ─────────────────────────────────────────────────
  const handleAddAffiliate = () => {
    if (!afName.trim() || !afEmail.trim()) { showToast("Name and email are required", "error"); return; }
    const code = afName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 5) + Math.floor(Math.random() * 90 + 10);
    const newAff = {
      id: `AFF-${String(tableData.length + 1).padStart(3, "0")}`,
      name: afName.trim(),
      email: afEmail.trim(),
      code,
      clicks: 0, conversions: 0,
      revenue: "$0", commission: "$0",
      rate: `${afRate}%`,
      status: afAutoApprove ? "active" : "pending",
      joined: new Date().toISOString().split("T")[0],
      paid: "$0",
    };
    setTableData(d => [newAff, ...d]);
    if (afWelcome) showToast(`${afName} added & welcome email sent`, "success");
    else showToast(`${afName} added as affiliate`, "success");
    setAddOpen(false);
    setAfName(""); setAfEmail(""); setAfWebsite(""); setAfRate("10"); setAfNotes(""); setAfAutoApprove(false); setAfWelcome(true);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Affiliates" value={String(tableData.length)}                                           trend="▲ +2 this month" trendUp icon={Users} />
        <KpiCard label="Active"           value={String(tableData.filter(r => r.status === "active").length)}        trend="▲ +1"           trendUp icon={CheckCircle} />
        <KpiCard label="Total Clicks"     value="17,490"                                                             trend="▲ +14.2%"       trendUp icon={MousePointerClick} />
        <KpiCard label="Commission Owed"  value="$2,683"                                                             trend="▲ +18.1%"       trendUp icon={DollarSign} />
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-lg"
          style={{ backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${M3.outlineVariant}` }}>
          <Search size={16} color={M3.onSurfaceVariant} />
          <input type="text" placeholder="Search affiliates…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", border: "none" }} />
        </div>
        <FilterChip label="Status" value={filterStatus} options={["Active","Pending","Suspended"]}  onChange={setFilterStatus} />
        <FilterChip label="Rate"   value={filterRate}   options={["10%","12.2%","15%"]}              onChange={setFilterRate} />
        {(filterStatus !== "All" || filterRate !== "All") && (
          <button onClick={() => { setFilterStatus("All"); setFilterRate("All"); }}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ color: M3.error, border: `1px solid ${M3.error}`, background: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            Clear all
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <OutlinedButton small onClick={() => showToast("Affiliates exported as CSV", "success")}>
            <DownloadIcon size={14} /> Export
          </OutlinedButton>
          <FilledButton small onClick={() => setAddOpen(true)}>
            <UserPlus size={14} /> Add Affiliate
          </FilledButton>
        </div>
      </div>

      {/* ── Add Affiliate form panel ── */}
      {addOpen && (
        <Card className="overflow-hidden" style={{ border: `2px solid ${M3.primary}` }}>
          <div className="flex items-center justify-between px-6 py-4"
            style={{ backgroundColor: M3.primaryContainer, borderBottom: `1px solid ${M3.outlineVariant}` }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: M3.primary }}>
                <UserPlus size={16} color={M3.onPrimary} />
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>
                  Add New Affiliate
                </div>
                <div className="text-xs" style={{ color: M3.onPrimaryContainer, opacity: 0.7, fontFamily: "Roboto, sans-serif" }}>
                  A unique referral code is generated automatically on submission.
                </div>
              </div>
            </div>
            <IconButton icon={XCircle} onClick={() => setAddOpen(false)} />
          </div>

          <div className="p-6 grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Left */}
            <div className="flex flex-col gap-4">
              {[
                { label: "Full Name *",          value: afName,    setter: setAfName,    placeholder: "Jane Smith",              type: "text" },
                { label: "Email Address *",       value: afEmail,   setter: setAfEmail,   placeholder: "jane@theirblog.com",      type: "email" },
                { label: "Website / Platform",    value: afWebsite, setter: setAfWebsite, placeholder: "https://theirblog.com",   type: "url" },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                  <input
                    type={f.type} value={f.value} placeholder={f.placeholder}
                    onChange={e => f.setter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${f.value ? M3.primary : M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}
                  />
                </div>
              ))}
              {/* Commission rate */}
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Commission Rate (%)</div>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min={1} max={50} value={afRate}
                    onChange={e => setAfRate(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.primary}`, color: M3.primary, fontFamily: "Roboto Mono, monospace" }}
                  />
                  <span className="text-sm" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>%</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {["5","10","15","20","25"].map(p => (
                    <button key={p} onClick={() => setAfRate(p)}
                      className="flex-1 py-1.5 rounded-full text-xs transition-all"
                      style={{ backgroundColor: afRate === p ? M3.primary : M3.surfaceContainerHigh, color: afRate === p ? M3.onPrimary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes (internal)</div>
                <textarea
                  placeholder="e.g. Reached out via email, runs a WP tutorial blog with 50k monthly readers."
                  value={afNotes} onChange={e => setAfNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
                  rows={5}
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif", lineHeight: 1.6 }}
                />
              </div>

              {/* Options */}
              <div className="flex flex-col gap-4 pt-2" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
                {[
                  { label: "Auto-approve (skip review)",   desc: "Set status to Active immediately.",           value: afAutoApprove, setter: setAfAutoApprove },
                  { label: "Send welcome email",           desc: "Includes referral code and dashboard link.",  value: afWelcome,     setter: setAfWelcome },
                ].map(opt => (
                  <div key={opt.label} className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{opt.label}</div>
                      <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{opt.desc}</div>
                    </div>
                    <Toggle on={opt.value} onChange={opt.setter} />
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: M3.surfaceContainerLow }}>
                <div className="text-xs font-medium mb-2" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Preview</div>
                <div className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <span style={{ color: M3.onSurfaceVariant }}>Referral Code</span>
                  <span className="font-medium" style={{ color: M3.primary, fontFamily: "Roboto Mono, monospace" }}>
                    {afName ? afName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 5) + "XX" : "CODE_XX"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <span style={{ color: M3.onSurfaceVariant }}>Commission</span>
                  <span className="font-medium" style={{ color: M3.onSurface }}>{afRate}%</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <span style={{ color: M3.onSurfaceVariant }}>Initial Status</span>
                  <span className="font-medium" style={{ color: afAutoApprove ? M3.success : M3.warning }}>{afAutoApprove ? "Active" : "Pending Review"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4"
            style={{ borderTop: `1px solid ${M3.outlineVariant}`, backgroundColor: M3.surfaceContainerLow }}>
            <TextButton onClick={() => setAddOpen(false)}>Cancel</TextButton>
            <FilledButton small onClick={handleAddAffiliate}>
              <UserPlus size={14} /> Add Affiliate
            </FilledButton>
          </div>
        </Card>
      )}

      {/* ── Edit Commission Rate panel ── */}
      {editRateRow && (
        <Card className="p-5 flex items-center gap-5" style={{ border: `2px solid ${M3.secondary}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: M3.secondaryContainer }}>
            <Edit3 size={18} color={M3.secondary} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
              Edit Commission Rate — <span style={{ color: M3.secondary }}>{editRateRow.name}</span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
              Current rate: <strong>{editRateRow.rate}</strong> · Revenue generated: {editRateRow.revenue}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={50} value={editRateValue}
                onChange={e => setEditRateValue(e.target.value)}
                className="w-20 px-3 py-2 rounded-lg text-lg font-light outline-none text-center"
                style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.secondary}`, color: M3.secondary, fontFamily: "Roboto Mono, monospace" }}
              />
              <span className="text-lg" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>%</span>
            </div>
            <div className="flex gap-1">
              {["5","10","15","20"].map(p => (
                <button key={p} onClick={() => setEditRateValue(p)}
                  className="w-10 h-8 rounded-lg text-xs"
                  style={{ backgroundColor: editRateValue === p ? M3.secondary : M3.surfaceContainerHigh, color: editRateValue === p ? M3.onSecondary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                  {p}%
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <TextButton onClick={() => setEditRateRow(null)}>Cancel</TextButton>
            <TonalButton small onClick={() => {
              updateRow(editRateRow.id, { rate: `${editRateValue}%` });
              showToast(`Commission rate updated to ${editRateValue}% for ${editRateRow.name}`, "success");
              setEditRateRow(null);
            }}>
              Save Rate
            </TonalButton>
          </div>
        </Card>
      )}

      {/* ── Table ── */}
      <Card style={{ overflow: "visible" }}>
        <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                {["Affiliate", "Ref. Code", "Clicks", "Conversions", "Revenue", "Commission", "Rate", "Status", "Paid Out", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row.id}
                  style={{ backgroundColor: editRateRow?.id === row.id ? `${M3.secondary}10` : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = editRateRow?.id === row.id ? `${M3.secondary}10` : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                  <td className="px-4 py-3">
                    <button onClick={() => onViewDetail(row.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                      <div className="text-sm font-medium hover:underline" style={{ color: M3.primary, fontFamily: "Roboto, sans-serif" }}>{row.name}</div>
                    </button>
                    <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium" style={{ fontFamily: "Roboto Mono, monospace", color: M3.primary }}>{row.code}</span>
                      <button
                        onClick={() => { navigator.clipboard?.writeText(`https://example.com/?ref=${row.code}`); showToast("Referral link copied", "info"); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, opacity: 0.5 }}>
                        <Copy size={11} color={M3.onSurfaceVariant} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.conversions}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.success, fontFamily: "Roboto Mono, monospace" }}>{row.revenue}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.primary, fontFamily: "Roboto Mono, monospace" }}>{row.commission}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: M3.surfaceContainerHigh, color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                      {row.rate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ backgroundColor: statusStyle[row.status]?.bg, color: statusStyle[row.status]?.text, fontFamily: "Roboto, sans-serif" }}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.paid}</td>
                  <td className="px-4 py-3" style={{ overflow: "visible" }}>
                    <ActionDropdown actions={rowActions(row)} hint={`${row.name} · ${row.code}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
          <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
            Showing {filtered.length} of {tableData.length} affiliates
            {tableData.filter(r => r.status === "pending").length > 0 && (
              <span className="ml-3 font-medium" style={{ color: M3.warning }}>
                · {tableData.filter(r => r.status === "pending").length} pending approval
              </span>
            )}
          </span>
        </div>
      </Card>

      {/* ── Conversion History modal ── */}
      {historyRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
          onClick={e => { if (e.target === e.currentTarget) setHistoryRow(null); }}>
          <div className="rounded-3xl overflow-hidden" style={{ width: 560, backgroundColor: M3.surfaceContainer, boxShadow: "0 8px 32px rgba(0,0,0,0.24)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              <div>
                <div className="font-semibold text-base" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Conversion History</div>
                <div className="text-sm mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                  {historyRow.name} · Code: <span style={{ fontFamily: "Roboto Mono, monospace", color: M3.primary }}>{historyRow.code}</span>
                </div>
              </div>
              <IconButton icon={XCircle} onClick={() => setHistoryRow(null)} />
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-0" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
              {[
                { label: "Total Clicks",     value: historyRow.clicks.toLocaleString() },
                { label: "Conversions",      value: String(historyRow.conversions) },
                { label: "Total Revenue",    value: historyRow.revenue },
              ].map((s, i) => (
                <div key={s.label} className="p-4 text-center" style={{ borderRight: i < 2 ? `1px solid ${M3.outlineVariant}` : "none" }}>
                  <div className="text-xl font-light" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent conversions */}
            <div className="p-5 flex flex-col gap-1" style={{ maxHeight: 320, overflowY: "auto" }}>
              <div className="text-xs font-medium mb-2" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Conversions</div>
              {[
                { customer: "felix@wagner.de",    product: "Plugin Pro Annual",  value: "$99",  commission: `$${Math.round(99 * parseInt(historyRow.rate) / 100)}`,  date: "2025-01-10" },
                { customer: "sophie@martin.fr",   product: "Theme Bundle",       value: "$59",  commission: `$${Math.round(59 * parseInt(historyRow.rate) / 100)}`,  date: "2025-01-08" },
                { customer: "yuki@tanaka.jp",     product: "Plugin Pro Annual",  value: "$99",  commission: `$${Math.round(99 * parseInt(historyRow.rate) / 100)}`,  date: "2025-01-05" },
                { customer: "peter@harris.com",   product: "SaaS Starter",       value: "$49",  commission: `$${Math.round(49 * parseInt(historyRow.rate) / 100)}`,  date: "2024-12-28" },
                { customer: "anna@schmidt.de",    product: "Plugin Pro Monthly", value: "$9",   commission: `$${Math.round(9  * parseInt(historyRow.rate) / 100)}`,  date: "2024-12-20" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: i % 2 === 0 ? M3.surfaceContainerLow : "transparent" }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{item.product}</div>
                    <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{item.customer} · {item.date}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{item.value}</div>
                    <div className="text-xs" style={{ color: M3.success, fontFamily: "Roboto Mono, monospace" }}>+{item.commission}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end px-6 py-4" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <OutlinedButton small onClick={() => showToast("Conversion history exported", "success")}>
                <DownloadIcon size={14} /> Export CSV
              </OutlinedButton>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={dialog.open} title={dialog.title} body={dialog.body} confirmLabel={dialog.confirmLabel} danger={dialog.danger} icon={dialog.icon} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Abandoned Cart Page ───────────────────────────────────────────────────────
function AbandonedCartPage() {
  const [tableData, setTableData] = useState(abandonedCartData);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus]   = useState("All");
  const [filterProduct, setFilterProduct] = useState("All");
  const [toast, setToast]         = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]       = useState<{
    open: boolean; title: string; body: React.ReactNode;
    confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void;
  }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });

  // Apply Discount modal state
  const [discountRow, setDiscountRow]   = useState<typeof tableData[0] | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountPct, setDiscountPct]   = useState("10");

  const showToast  = (msg: string, type: ToastProps["type"] = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));
  const updateStatus = (id: string, status: string, recovered?: boolean) =>
    setTableData(rows => rows.map(r => r.id === id ? { ...r, status, recovered: recovered ?? r.recovered } : r));
  const incrementEmails = (id: string) =>
    setTableData(rows => rows.map(r => r.id === id ? { ...r, emailsSent: r.emailsSent + 1, lastEmail: "Just now", status: "recovering" } : r));

  const filtered = tableData.filter(r => {
    const matchSearch  = !search || r.customer.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()) || r.product.toLowerCase().includes(search.toLowerCase());
    const matchStatus  = filterStatus  === "All" || r.status === filterStatus.toLowerCase();
    const matchProduct = filterProduct === "All" || r.product.includes(filterProduct);
    return matchSearch && matchStatus && matchProduct;
  });

  const cartStatusStyle: Record<string, { bg: string; text: string; label: string }> = {
    new:        { bg: M3.primaryContainer,     text: M3.onPrimaryContainer, label: "New"        },
    recovering: { bg: M3.warningContainer,     text: M3.warning,            label: "Recovering" },
    recovered:  { bg: M3.successContainer,     text: M3.success,            label: "Recovered"  },
    dismissed:  { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant,   label: "Dismissed"  },
    lost:       { bg: "#FFDAD6",               text: M3.error,              label: "Lost"       },
  };

  const rowActions = (row: typeof tableData[0]): ActionItem[] => [
    // ── Navigation ──────────────────────────────────────────────────────
    {
      label: "View Customer Profile",
      icon: Users,
      onClick: () => showToast(`Customer profile for ${row.customer} opened`, "info"),
    },
    {
      label: "Copy Customer Email",
      icon: Copy,
      onClick: () => {
        navigator.clipboard?.writeText(row.email);
        showToast(`${row.email} copied to clipboard`, "info");
      },
    },
    {
      label: "View Cart Contents",
      icon: ShoppingCart,
      onClick: () => showToast(`Cart: ${row.product} — ${row.value}`, "info"),
    },

    // ── Recovery actions ─────────────────────────────────────────────────
    {
      label: "Send Recovery Email",
      icon: Send,
      dividerBefore: true,
      disabled: row.recovered || row.status === "dismissed" || row.status === "lost",
      onClick: () => openDialog({
        open: true, danger: false, icon: Send,
        title: "Send Recovery Email?",
        body: (
          <span>
            Send email #{row.emailsSent + 1} to <strong>{row.customer}</strong> for their
            abandoned <strong>{row.product}</strong> cart ({row.value})?
            {row.emailsSent >= 3 && <span className="block mt-2" style={{ color: M3.warning }}>⚠ This is beyond the 3-email sequence.</span>}
          </span>
        ),
        confirmLabel: "Send Email",
        onConfirm: () => { incrementEmails(row.id); showToast(`Recovery email sent to ${row.customer}`, "success"); closeDialog(); },
      }),
    },
    {
      label: "Resend Last Email",
      icon: RefreshCw,
      disabled: row.emailsSent === 0 || row.recovered || row.status === "dismissed",
      onClick: () => openDialog({
        open: true, danger: false, icon: RefreshCw,
        title: "Resend Last Email?",
        body: <span>Resend the most recent recovery email to <strong>{row.customer}</strong> ({row.email})?</span>,
        confirmLabel: "Resend",
        onConfirm: () => { showToast(`Email resent to ${row.customer}`, "success"); closeDialog(); },
      }),
    },
    {
      label: "Apply Discount Code",
      icon: Tag,
      disabled: row.recovered || row.status === "dismissed",
      onClick: () => { setDiscountCode(""); setDiscountPct("10"); setDiscountRow(row); },
    },

    // ── Status changes ───────────────────────────────────────────────────
    {
      label: "Mark as Recovered",
      icon: CheckCircle,
      dividerBefore: true,
      disabled: row.recovered,
      onClick: () => openDialog({
        open: true, danger: false, icon: CheckCircle,
        title: "Mark as Recovered?",
        body: <span>Mark <strong>{row.customer}</strong>'s <strong>{row.product}</strong> cart ({row.value}) as manually recovered?</span>,
        confirmLabel: "Mark Recovered",
        onConfirm: () => { updateStatus(row.id, "recovered", true); showToast(`${row.customer}'s cart marked recovered`, "success"); closeDialog(); },
      }),
    },
    {
      label: "Mark as Lost",
      icon: XCircle,
      disabled: row.recovered || row.status === "lost" || row.status === "dismissed",
      onClick: () => openDialog({
        open: true, danger: false, icon: XCircle,
        title: "Mark as Lost?",
        body: <span>Stop all recovery attempts for <strong>{row.customer}</strong>'s cart and mark as lost? No further emails will be sent.</span>,
        confirmLabel: "Mark as Lost",
        onConfirm: () => { updateStatus(row.id, "lost"); showToast(`Cart marked as lost for ${row.customer}`, "warning"); closeDialog(); },
      }),
    },
    {
      label: "Dismiss Cart",
      icon: AlertCircle,
      disabled: row.recovered || row.status === "dismissed" || row.status === "lost",
      onClick: () => openDialog({
        open: true, danger: false, icon: AlertCircle,
        title: "Dismiss Cart?",
        body: <span>Stop all recovery emails for <strong>{row.customer}</strong>'s cart ({row.value}) and mark as dismissed?</span>,
        confirmLabel: "Dismiss",
        onConfirm: () => { updateStatus(row.id, "dismissed"); showToast(`Cart dismissed for ${row.customer}`, "warning"); closeDialog(); },
      }),
    },

    // ── Destructive ──────────────────────────────────────────────────────
    {
      label: "Blacklist Email Address",
      icon: Ban,
      danger: true,
      dividerBefore: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: Ban,
        title: "Blacklist Email Address?",
        body: (
          <span>
            Add <strong>{row.email}</strong> to the recovery email blacklist?
            This customer will <strong>never</strong> receive recovery emails again, even for future abandoned carts.
          </span>
        ),
        confirmLabel: "Blacklist Email",
        onConfirm: () => { updateStatus(row.id, "dismissed"); showToast(`${row.email} added to blacklist`, "error"); closeDialog(); },
      }),
    },
    {
      label: "Delete Record",
      icon: Trash2,
      danger: true,
      onClick: () => openDialog({
        open: true, danger: true, icon: Trash2,
        title: "Delete Cart Record?",
        body: (
          <span>
            Permanently delete this abandoned cart record for <strong>{row.customer}</strong> ({row.product}, {row.value})?
            This will be removed from all analytics and cannot be undone.
          </span>
        ),
        confirmLabel: "Delete Record",
        onConfirm: () => { setTableData(d => d.filter(r2 => r2.id !== row.id)); showToast("Cart record deleted", "error"); closeDialog(); },
      }),
    },
  ];

  const totalRecovered  = tableData.filter(r => r.recovered).length;
  const totalAbandoned  = tableData.length;
  const recoveryRate    = Math.round((totalRecovered / Math.max(totalAbandoned, 1)) * 100);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Abandoned"  value={String(totalAbandoned)}  trend="▲ +4.7% this week" trendUp={false} icon={ShoppingCart} />
        <KpiCard label="Recovered"        value={String(totalRecovered)}  trend="▲ +10.3%"           trendUp icon={CheckCircle} />
        <KpiCard label="Recovery Rate"    value={`${recoveryRate}%`}      trend="▲ +1.8%"            trendUp icon={Activity} />
        <KpiCard label="Revenue Saved"    value="$557"                    trend="▲ +10.3%"           trendUp icon={DollarSign} />
      </div>

      {/* Email sequence progress */}
      <Card className="p-5">
        <SectionTitle>Automated Email Sequence</SectionTitle>
        <div className="flex items-stretch gap-0">
          {[
            { seq: "Email 1",  delay: "1 hour after abandonment",  sent: tableData.filter(r => r.emailsSent >= 1).length, icon: Mail,  color: M3.primary },
            { seq: "Email 2",  delay: "24 hours after abandonment", sent: tableData.filter(r => r.emailsSent >= 2).length, icon: Mail,  color: M3.secondary },
            { seq: "Email 3",  delay: "72 hours after abandonment", sent: tableData.filter(r => r.emailsSent >= 3).length, icon: Mail,  color: M3.info },
          ].map((step, i) => (
            <div key={i} className="flex-1 flex items-center gap-0">
              <div className="flex-1 p-4 rounded-xl" style={{ backgroundColor: M3.surfaceContainerLow }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${step.color}20` }}>
                    <step.icon size={14} color={step.color} />
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{step.seq}</div>
                    <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{step.delay}</div>
                  </div>
                </div>
                <div className="text-xl font-light" style={{ color: step.color, fontFamily: "Roboto, sans-serif" }}>{step.sent} sent</div>
              </div>
              {i < 2 && <ChevronRight size={18} color={M3.outlineVariant} className="flex-shrink-0 mx-2" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-lg" style={{ backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${M3.outlineVariant}` }}>
          <Search size={16} color={M3.onSurfaceVariant} />
          <input type="text" placeholder="Search carts…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", border: "none" }} />
        </div>
        <FilterChip label="Status"  value={filterStatus}  options={["New","Recovering","Recovered","Dismissed","Lost"]}             onChange={setFilterStatus} />
        <FilterChip label="Product" value={filterProduct} options={["Plugin Pro","Theme Bundle","SaaS Starter","SaaS Pro","SaaS Business Plan"]} onChange={setFilterProduct} />
        {(filterStatus !== "All" || filterProduct !== "All") && (
          <button onClick={() => { setFilterStatus("All"); setFilterProduct("All"); }}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ color: M3.error, border: `1px solid ${M3.error}`, background: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
            Clear all
          </button>
        )}
        <div className="ml-auto"><OutlinedButton small onClick={() => showToast("Abandoned cart report exported as CSV", "success")}><DownloadIcon size={14} /> Export</OutlinedButton></div>
      </div>

      <Card style={{ overflow: "visible" }}>
        <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                {["Customer", "Product", "Cart Value", "Abandoned", "Emails Sent", "Last Email", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const s = cartStatusStyle[row.status] ?? cartStatusStyle.new;
                return (
                  <tr key={row.id}
                    style={{ backgroundColor: idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.customer}</div>
                      <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.value}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.abandoned}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {[1,2,3].map(n => (
                          <div key={n} className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{ backgroundColor: row.emailsSent >= n ? M3.primaryContainer : M3.surfaceContainerHigh, color: row.emailsSent >= n ? M3.onPrimaryContainer : M3.outlineVariant, fontFamily: "Roboto, sans-serif" }}>
                            {n}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.lastEmail}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text, fontFamily: "Roboto, sans-serif" }}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3" style={{ overflow: "visible" }}><ActionDropdown actions={rowActions(row)} hint={`${row.customer} · ${row.product}`} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
          <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Showing {filtered.length} of {tableData.length} carts</span>
        </div>
      </Card>

      {/* ── Apply Discount modal ── */}
      {discountRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
          onClick={e => { if (e.target === e.currentTarget) setDiscountRow(null); }}>
          <div className="rounded-3xl overflow-hidden" style={{ width: 420, backgroundColor: M3.surfaceContainer, boxShadow: "0 8px 32px rgba(0,0,0,0.24)" }}>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: M3.secondaryContainer }}>
                <Tag size={22} color={M3.secondary} />
              </div>
              <div className="font-semibold text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Apply Discount</div>
              <div className="text-sm mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                {discountRow.customer} · {discountRow.product} · {discountRow.value}
              </div>
            </div>
            <div className="px-6 pb-4 flex flex-col gap-4">
              {/* Coupon code input */}
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Coupon Code (optional)</div>
                <input type="text" placeholder="e.g. COMEBACK20" value={discountCode}
                  onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none tracking-widest text-center uppercase"
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${discountCode ? M3.primary : M3.outlineVariant}`, color: M3.primary, fontFamily: "Roboto Mono, monospace" }} />
              </div>
              {/* Discount % */}
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Discount Amount (%)</div>
                <div className="flex gap-2">
                  {["5","10","15","20","25","50"].map(p => (
                    <button key={p} onClick={() => setDiscountPct(p)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{ backgroundColor: discountPct === p ? M3.primary : M3.surfaceContainerHigh, color: discountPct === p ? M3.onPrimary : M3.onSurfaceVariant, border: "none", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: M3.surfaceContainerLow }}>
                <div className="flex items-center justify-between text-xs" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <span style={{ color: M3.onSurfaceVariant }}>Original cart value</span>
                  <span style={{ color: M3.onSurface }}>{discountRow.value}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold mt-1" style={{ fontFamily: "Roboto, sans-serif" }}>
                  <span style={{ color: M3.onSurfaceVariant }}>After {discountPct}% discount</span>
                  <span style={{ color: M3.success }}>
                    ${(parseFloat(discountRow.value.replace("$","")) * (1 - parseInt(discountPct)/100)).toFixed(2)}
                  </span>
                </div>
                {discountCode && <div className="text-xs mt-1" style={{ color: M3.primary, fontFamily: "Roboto Mono, monospace" }}>Code: {discountCode}</div>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <TextButton onClick={() => setDiscountRow(null)}>Cancel</TextButton>
              <FilledButton small onClick={() => {
                const msg = discountCode
                  ? `Discount code ${discountCode} (${discountPct}% off) sent to ${discountRow.customer}`
                  : `${discountPct}% discount applied for ${discountRow.customer}`;
                incrementEmails(discountRow.id);
                showToast(msg, "success");
                setDiscountRow(null);
              }}>
                Apply &amp; Send Email
              </FilledButton>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={dialog.open} title={dialog.title} body={dialog.body} confirmLabel={dialog.confirmLabel} danger={dialog.danger} icon={dialog.icon} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Security Page ────────────────────────────────────────────────────────────
const RULE_TYPES    = ["rate-limit","geo-block","ip-list","signature","validation"] as const;
const RULE_ACTIONS  = ["block","throttle","challenge","reject"] as const;
const BLOCK_DURATIONS = ["24 hours","7 days","30 days","Permanent"] as const;
const SEVERITIES    = ["low","medium","high","critical"] as const;

function SecurityPage() {
  const [tab, setTab]                   = useState<"overview" | "blocklist" | "logins" | "downloads" | "firewall" | "audit">("overview");
  const [blockedIPs, setBlockedIPs]     = useState(blockedIPsData);
  const [loginAttempts, setLoginAttempts] = useState(loginAttemptsData);
  const [suspDownloads, setSuspDownloads] = useState(suspiciousDownloadsData);
  const [firewallRules, setFirewallRules] = useState(firewallRulesData);
  const [search, setSearch]             = useState("");
  const [toast, setToast]               = useState<ToastProps>({ message: "", type: "success", visible: false });
  const [dialog, setDialog]             = useState<{
    open: boolean; title: string; body: React.ReactNode;
    confirmLabel: string; danger: boolean; icon?: React.ElementType; onConfirm: () => void;
  }>({ open: false, title: "", body: null, confirmLabel: "", danger: false, onConfirm: () => {} });

  // Block IP form state
  const [blockIPOpen, setBlockIPOpen]   = useState(false);
  const [biIP, setBiIP]                 = useState("");
  const [biReason, setBiReason]         = useState("");
  const [biSeverity, setBiSeverity]     = useState<typeof SEVERITIES[number]>("high");
  const [biDuration, setBiDuration]     = useState<typeof BLOCK_DURATIONS[number]>("24 hours");

  // Add Rule form state
  const [addRuleOpen, setAddRuleOpen]   = useState(false);
  const [arName, setArName]             = useState("");
  const [arType, setArType]             = useState<typeof RULE_TYPES[number]>("rate-limit");
  const [arTarget, setArTarget]         = useState("");
  const [arLimit, setArLimit]           = useState("");
  const [arAction, setArAction]         = useState<typeof RULE_ACTIONS[number]>("block");
  const [arEnabled, setArEnabled]       = useState(true);

  // Edit Rule state
  const [editRuleRow, setEditRuleRow]   = useState<typeof firewallRulesData[0] | null>(null);
  const [erName, setErName]             = useState("");
  const [erLimit, setErLimit]           = useState("");

  const showToast  = (msg: string, type: ToastProps["type"] = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };
  const openDialog = (opts: typeof dialog) => setDialog(opts);
  const closeDialog = () => setDialog(d => ({ ...d, open: false }));

  const severityStyle: Record<string, { bg: string; text: string; dot: string }> = {
    critical: { bg: "#FFDAD6",           text: M3.error,            dot: M3.error },
    high:     { bg: "#FFDEA5",           text: "#5C4200",           dot: M3.warning },
    medium:   { bg: M3.primaryContainer, text: M3.onPrimaryContainer,dot: M3.primary },
    low:      { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant, dot: M3.outline },
    info:     { bg: M3.infoContainer,    text: M3.info,             dot: M3.info },
  };

  const auditIcon: Record<string, { icon: React.ElementType; color: string }> = {
    block:   { icon: Ban,          color: M3.error    },
    alert:   { icon: AlertCircle,  color: M3.warning  },
    unblock: { icon: CheckCircle,  color: M3.success  },
    config:  { icon: Settings,     color: M3.primary  },
    rule:    { icon: Shield,       color: M3.secondary },
  };

  const tabs = [
    { id: "overview"   as const, label: "Overview" },
    { id: "blocklist"  as const, label: `IP Blocklist (${blockedIPs.length})` },
    { id: "logins"     as const, label: `Login Attempts (${loginAttempts.length})` },
    { id: "downloads"  as const, label: `Suspicious Downloads (${suspDownloads.length})` },
    { id: "firewall"   as const, label: `Firewall Rules (${firewallRules.length})` },
    { id: "audit"      as const, label: "Audit Log" },
  ];

  // ── Block IP submit ────────────────────────────────────────────────────────
  const handleBlockIP = () => {
    if (!biIP.trim()) { showToast("Enter an IP address", "error"); return; }
    const newBlock = {
      id: Date.now(),
      ip: biIP.trim(),
      country: "Unknown",
      flag: "🌐",
      reason: biReason.trim() || "Manually blocked by admin",
      severity: biSeverity,
      blocked: new Date().toISOString().replace("T", " ").slice(0, 16),
      expires: biDuration === "Permanent" ? "Permanent" : new Date(Date.now() + (biDuration === "24 hours" ? 864e5 : biDuration === "7 days" ? 6048e5 : 2592e6)).toISOString().replace("T", " ").slice(0, 16),
      hits: 0,
    };
    setBlockedIPs(d => [newBlock, ...d]);
    showToast(`${biIP} blocked (${biDuration})`, "error");
    setBlockIPOpen(false);
    setBiIP(""); setBiReason(""); setBiSeverity("high"); setBiDuration("24 hours");
    setTab("blocklist");
  };

  // ── Add Rule submit ─────────────────────────────────────────────────────────
  const handleAddRule = () => {
    if (!arName.trim() || !arTarget.trim()) { showToast("Name and target are required", "error"); return; }
    const newRule = {
      id: Date.now(),
      name: arName.trim(),
      type: arType,
      target: arTarget.trim(),
      limit: arLimit.trim() || "ALL requests",
      action: arAction,
      enabled: arEnabled,
      hits: 0,
    };
    setFirewallRules(d => [...d, newRule]);
    showToast(`Rule "${arName}" created`, "success");
    setAddRuleOpen(false);
    setArName(""); setArType("rate-limit"); setArTarget(""); setArLimit(""); setArAction("block"); setArEnabled(true);
    setTab("firewall");
  };

  /* ── Blocked IP actions ─────────────────────────────── */
  const blockedIPActions = (row: typeof blockedIPs[0]): ActionItem[] => [
    { label: "View Download History", icon: Download,    onClick: () => showToast(`Download history for ${row.ip} opened`, "info") },
    { label: "Lookup IP Reputation",  icon: Globe,       onClick: () => showToast(`WHOIS for ${row.ip} opened`, "info") },
    { label: "Copy IP Address",       icon: Copy,        onClick: () => { navigator.clipboard?.writeText(row.ip); showToast("IP copied", "info"); } },
    { label: "Add to Allowlist",      icon: CheckCircle, dividerBefore: true,
      onClick: () => openDialog({ open: true, danger: false, icon: CheckCircle, title: "Add to Allowlist?",
        body: <span>Add <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong> to the permanent allowlist? It will never be auto-blocked again.</span>,
        confirmLabel: "Add to Allowlist",
        onConfirm: () => { setBlockedIPs(d => d.filter(r => r.id !== row.id)); showToast(`${row.ip} added to allowlist`, "success"); closeDialog(); } }) },
    { label: "Extend Block (7 days)", icon: Clock,
      onClick: () => openDialog({ open: true, danger: false, icon: Clock, title: "Extend Block?",
        body: <span>Extend the block on <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong> by 7 more days?</span>,
        confirmLabel: "Extend 7 Days",
        onConfirm: () => { showToast(`Block on ${row.ip} extended by 7 days`, "success"); closeDialog(); } }) },
    { label: "Change to Permanent",   icon: Ban,
      disabled: row.expires === "Permanent",
      onClick: () => openDialog({ open: true, danger: true, icon: Ban, title: "Make Block Permanent?",
        body: <span>Make the block on <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong> permanent? It will never expire automatically.</span>,
        confirmLabel: "Make Permanent",
        onConfirm: () => { setBlockedIPs(d => d.map(r => r.id === row.id ? { ...r, expires: "Permanent" } : r)); showToast(`${row.ip} permanently blocked`, "error"); closeDialog(); } }) },
    { label: "Unblock IP", icon: XCircle, danger: true, dividerBefore: true,
      onClick: () => openDialog({ open: true, danger: true, icon: XCircle, title: "Unblock IP?",
        body: <span>Remove the block on <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong>? This IP had <strong>{row.hits} recorded hits</strong>. Unblocking may allow further attacks.</span>,
        confirmLabel: "Unblock IP",
        onConfirm: () => { setBlockedIPs(d => d.filter(r => r.id !== row.id)); showToast(`${row.ip} unblocked`, "warning"); closeDialog(); } }) },
    { label: "Delete Record",         icon: Trash2,      danger: true,
      onClick: () => openDialog({ open: true, danger: true, icon: Trash2, title: "Delete Block Record?",
        body: <span>Permanently delete the block record for <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong>? The IP will not be blocked after deletion.</span>,
        confirmLabel: "Delete Record",
        onConfirm: () => { setBlockedIPs(d => d.filter(r => r.id !== row.id)); showToast(`${row.ip} record deleted`, "error"); closeDialog(); } }) },
  ];

  /* ── Login attempt actions ──────────────────────────── */
  const loginActions = (row: typeof loginAttempts[0]): ActionItem[] => [
    { label: "View Customer",          icon: Users,       onClick: () => showToast(`Customer profile for ${row.email} opened`, "info") },
    { label: "Copy IP Address",        icon: Copy,        onClick: () => { navigator.clipboard?.writeText(row.ip); showToast("IP copied", "info"); } },
    { label: "Block IP Now",           icon: Ban,         danger: true, dividerBefore: true,
      disabled: row.status === "blocked",
      onClick: () => openDialog({ open: true, danger: true, icon: Ban, title: "Block IP?",
        body: <span>Block <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong>? All requests will be rejected immediately. {row.attempts} failed login attempts recorded.</span>,
        confirmLabel: "Block IP",
        onConfirm: () => { setLoginAttempts(d => d.map(r => r.id === row.id ? { ...r, status: "blocked" } : r)); showToast(`${row.ip} blocked`, "error"); closeDialog(); } }) },
    { label: "Force Password Reset",   icon: RotateCcw,
      onClick: () => openDialog({ open: true, danger: false, icon: RotateCcw, title: "Force Password Reset?",
        body: <span>Send a forced password reset link to <strong>{row.email}</strong>? Their current session will be invalidated.</span>,
        confirmLabel: "Send Reset",
        onConfirm: () => { showToast(`Password reset sent to ${row.email}`, "success"); closeDialog(); } }) },
    { label: "Whitelist IP",           icon: ShieldCheck,
      onClick: () => openDialog({ open: true, danger: false, icon: ShieldCheck, title: "Whitelist IP?",
        body: <span>Add <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong> to the permanent allowlist? It will never be auto-blocked.</span>,
        confirmLabel: "Whitelist IP",
        onConfirm: () => { setLoginAttempts(d => d.filter(r => r.id !== row.id)); showToast(`${row.ip} whitelisted`, "success"); closeDialog(); } }) },
    { label: "Dismiss Alert",          icon: XCircle,
      onClick: () => openDialog({ open: true, danger: false, icon: XCircle, title: "Dismiss Alert?",
        body: <span>Dismiss the login alert for <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong>? It will be removed from the monitoring list.</span>,
        confirmLabel: "Dismiss",
        onConfirm: () => { setLoginAttempts(d => d.filter(r => r.id !== row.id)); showToast("Alert dismissed", "info"); closeDialog(); } }) },
  ];

  /* ── Suspicious download actions ────────────────────── */
  const suspDownloadActions = (row: typeof suspDownloads[0]): ActionItem[] => [
    { label: "View License Detail",    icon: Key,         onClick: () => showToast(`License ${row.license} opened`, "info") },
    { label: "View Customer",          icon: Users,       onClick: () => showToast(`Viewing ${row.customer}`, "info"), disabled: row.customer === "Unknown" },
    { label: "Copy IP Address",        icon: Copy,        onClick: () => { navigator.clipboard?.writeText(row.ip); showToast("IP copied", "info"); } },
    { label: "Mark as Safe",           icon: ShieldCheck, dividerBefore: true,
      onClick: () => openDialog({ open: true, danger: false, icon: ShieldCheck, title: "Mark as Safe?",
        body: <span>Clear the suspicious flag on this download by <strong>{row.customer}</strong>? It will be removed from the suspicious list.</span>,
        confirmLabel: "Mark Safe",
        onConfirm: () => { setSuspDownloads(d => d.filter(r => r.id !== row.id)); showToast("Download marked safe & dismissed", "success"); closeDialog(); } }) },
    { label: "Block IP",               icon: Ban,         danger: true,
      onClick: () => openDialog({ open: true, danger: true, icon: Ban, title: "Block IP?",
        body: <span>Block <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.ip}</strong> ({row.country}) from all endpoints?</span>,
        confirmLabel: "Block IP",
        onConfirm: () => { setBlockedIPs(d => [{ id: Date.now(), ip: row.ip, country: row.country, flag: row.flag, reason: row.reason, severity: row.severity as any, blocked: new Date().toISOString().slice(0,16).replace("T"," "), expires: "24 hours", hits: 1 }, ...d]); showToast(`${row.ip} blocked`, "error"); closeDialog(); } }) },
    { label: "Revoke License",         icon: XCircle,     danger: true,
      onClick: () => openDialog({ open: true, danger: true, icon: XCircle, title: "Revoke License?",
        body: <span>Revoke <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.license}</strong>? All site activations will be immediately invalidated.</span>,
        confirmLabel: "Revoke License",
        onConfirm: () => { setSuspDownloads(d => d.filter(r => r.id !== row.id)); showToast(`License ${row.license} revoked`, "error"); closeDialog(); } }) },
    { label: "Delete Record",          icon: Trash2,      danger: true, dividerBefore: true,
      onClick: () => openDialog({ open: true, danger: true, icon: Trash2, title: "Delete Record?",
        body: <span>Permanently delete this suspicious download record for <strong>{row.customer}</strong>? This cannot be undone.</span>,
        confirmLabel: "Delete Record",
        onConfirm: () => { setSuspDownloads(d => d.filter(r => r.id !== row.id)); showToast("Record deleted", "error"); closeDialog(); } }) },
  ];

  /* ── Firewall rule actions ──────────────────────────── */
  const firewallActions = (row: typeof firewallRules[0]): ActionItem[] => [
    { label: "Edit Rule",              icon: Edit3,
      onClick: () => { setErName(row.name); setErLimit(row.limit); setEditRuleRow(row); } },
    { label: "View Hit Logs",          icon: FileText,
      onClick: () => showToast(`Hit log for "${row.name}" opened`, "info") },
    { label: "Duplicate Rule",         icon: Layers,
      onClick: () => openDialog({ open: true, danger: false, icon: Layers, title: "Duplicate Rule?",
        body: <span>Create a copy of <strong>"{row.name}"</strong>? The duplicate will be disabled by default.</span>,
        confirmLabel: "Duplicate",
        onConfirm: () => { setFirewallRules(d => [...d, { ...row, id: Date.now(), name: `${row.name} (copy)`, hits: 0, enabled: false }]); showToast("Rule duplicated", "success"); closeDialog(); } }) },
    { label: row.enabled ? "Disable Rule" : "Enable Rule",
      icon: row.enabled ? PauseCircle : CheckCircle,
      dividerBefore: true,
      onClick: () => openDialog({ open: true, danger: row.enabled, icon: row.enabled ? PauseCircle : CheckCircle,
        title: row.enabled ? "Disable Rule?" : "Enable Rule?",
        body: row.enabled
          ? <span>Disable <strong>"{row.name}"</strong>? Threats matching this rule will no longer be blocked.</span>
          : <span>Enable <strong>"{row.name}"</strong>? It will begin blocking/throttling matching traffic immediately.</span>,
        confirmLabel: row.enabled ? "Disable Rule" : "Enable Rule",
        onConfirm: () => { setFirewallRules(d => d.map(r => r.id === row.id ? { ...r, enabled: !r.enabled } : r)); showToast(`Rule ${row.enabled ? "disabled" : "enabled"}`, row.enabled ? "warning" : "success"); closeDialog(); } }) },
    { label: "Delete Rule",            icon: Trash2,      danger: true,
      onClick: () => openDialog({ open: true, danger: true, icon: Trash2, title: "Delete Rule?",
        body: <span>Permanently delete <strong>"{row.name}"</strong>? Traffic this rule was blocking will go unchecked immediately.</span>,
        confirmLabel: "Delete Rule",
        onConfirm: () => { setFirewallRules(d => d.filter(r => r.id !== row.id)); showToast(`"${row.name}" deleted`, "error"); closeDialog(); } }) },
  ];

  /* ── Rule type badge ────────────────────────────────── */
  const ruleTypeStyle: Record<string, { bg: string; text: string }> = {
    "rate-limit": { bg: M3.primaryContainer,   text: M3.onPrimaryContainer },
    "geo-block":  { bg: "#FFDEA5",             text: "#5C4200" },
    "ip-list":    { bg: M3.secondaryContainer, text: M3.onSecondaryContainer },
    "signature":  { bg: M3.successContainer,   text: M3.success },
    "validation": { bg: M3.infoContainer,      text: M3.info },
  };

  const securityScore = 84;
  const scoreColor = securityScore >= 80 ? M3.success : securityScore >= 60 ? M3.warning : M3.error;

  return (
    <div className="flex flex-col gap-5">
      {/* ── KPI strip ─────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {/* Security score card */}
        <Card className="p-5 flex flex-col gap-2 col-span-1">
          <div className="text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Security Score</div>
          <div className="flex items-end gap-3">
            <div className="text-5xl font-light leading-none" style={{ color: scoreColor, fontFamily: "Roboto, sans-serif" }}>{securityScore}</div>
            <div className="text-sm pb-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>/100</div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: M3.outlineVariant }}>
            <div className="h-full rounded-full" style={{ width: `${securityScore}%`, backgroundColor: scoreColor, transition: "width 0.5s ease" }} />
          </div>
          <div className="text-xs" style={{ color: scoreColor, fontFamily: "Roboto, sans-serif" }}>Good — 2 issues need attention</div>
        </Card>

        <KpiCard label="IPs Blocked (24h)"     value={String(blockedIPs.filter(r => r.severity === "critical" || r.severity === "high").length)} trend="▲ +3 today"  trendUp={false} icon={Ban} />
        <KpiCard label="Login Threats (24h)"   value={String(loginAttempts.reduce((a, r) => a + r.attempts, 0))} trend="▲ +18%"       trendUp={false} icon={AlertCircle} />
        <KpiCard label="Suspicious Downloads"  value={String(suspDownloads.length)} trend="▲ +2 today"   trendUp={false} icon={ShieldCheck} />
      </div>

      {/* ── Threat activity chart ──────────────────────────── */}
      <Card className="p-5">
        <SectionTitle>Threat Activity — Last 7 days</SectionTitle>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={threatTrendData}>
            <defs>
              <linearGradient id="blockGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={M3.error}   stopOpacity={0.18} />
                <stop offset="95%" stopColor={M3.error}   stopOpacity={0} />
              </linearGradient>
              <linearGradient id="loginGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={M3.warning} stopOpacity={0.18} />
                <stop offset="95%" stopColor={M3.warning} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={M3.outlineVariant} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
            <YAxis tick={{ fontSize: 11, fill: M3.onSurfaceVariant }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${M3.outlineVariant}`, fontFamily: "Roboto, sans-serif" }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Roboto, sans-serif" }} />
            <Area type="monotone" dataKey="logins"  name="Login Attempts" stroke={M3.warning} fill="url(#loginGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="blocked" name="IPs Blocked"    stroke={M3.error}   fill="url(#blockGrad)"  strokeWidth={2} />
            <Line type="monotone" dataKey="alerts"  name="Alerts"         stroke={M3.primary} strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <Card className="flex flex-col" style={{ overflow: "visible" }}>
        {/* Tab bar */}
        <div className="flex overflow-x-auto" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); }}
              className="px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{ color: tab === t.id ? M3.primary : M3.onSurfaceVariant, borderBottom: tab === t.id ? `2px solid ${M3.primary}` : "2px solid transparent", background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${M3.primary}` : "2px solid transparent", cursor: "pointer", fontFamily: "Roboto, sans-serif" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Search bar (shared across table tabs) ─────── */}
        {tab !== "overview" && tab !== "audit" && (
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
            <div className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-lg" style={{ backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${M3.outlineVariant}` }}>
              <Search size={15} color={M3.onSurfaceVariant} />
              <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", border: "none" }} />
            </div>
            {tab === "blocklist" && (
              <div className="ml-auto">
                <FilledButton small onClick={() => { setBlockIPOpen(o => !o); setAddRuleOpen(false); }}>
                  <Ban size={14} /> Block IP
                </FilledButton>
              </div>
            )}
            {tab === "firewall" && (
              <div className="ml-auto">
                <FilledButton small onClick={() => { setAddRuleOpen(o => !o); setBlockIPOpen(false); setEditRuleRow(null); }}>
                  <Shield size={14} /> Add Rule
                </FilledButton>
              </div>
            )}
          </div>
        )}

        {/* ── Block IP form panel ── */}
        {blockIPOpen && (
          <div className="mx-0" style={{ borderBottom: `2px solid ${M3.error}` }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#FFDAD6" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: M3.error }}>
                  <Ban size={16} color="#fff" />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: M3.error, fontFamily: "Roboto, sans-serif" }}>Block IP Address</div>
                  <div className="text-xs" style={{ color: M3.error, opacity: 0.8, fontFamily: "Roboto, sans-serif" }}>
                    The IP will be added to the blocklist immediately and all requests rejected.
                  </div>
                </div>
              </div>
              <IconButton icon={XCircle} onClick={() => setBlockIPOpen(false)} />
            </div>
            <div className="p-6 grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              {/* IP Address */}
              <div className="col-span-1">
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>IP Address / CIDR *</div>
                <input type="text" placeholder="e.g. 192.168.1.1 or 10.0.0.0/24" value={biIP} onChange={e => setBiIP(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${biIP ? M3.error : M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }} />
              </div>
              {/* Reason */}
              <div className="col-span-2">
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Reason</div>
                <input type="text" placeholder="e.g. Brute force attempt, credential stuffing…" value={biReason} onChange={e => setBiReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }} />
              </div>
              {/* Severity */}
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Severity</div>
                <div className="flex gap-1.5">
                  {SEVERITIES.map(s => {
                    const sev = { low: { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant }, medium: { bg: M3.primaryContainer, text: M3.onPrimaryContainer }, high: { bg: "#FFDEA5", text: "#5C4200" }, critical: { bg: "#FFDAD6", text: M3.error } }[s];
                    return (
                      <button key={s} onClick={() => setBiSeverity(s)}
                        className="flex-1 py-2 rounded-lg text-xs capitalize transition-all"
                        style={{ backgroundColor: biSeverity === s ? sev.bg : M3.surfaceContainerLow, color: biSeverity === s ? sev.text : M3.onSurfaceVariant, border: `1.5px solid ${biSeverity === s ? sev.text : M3.outlineVariant}`, cursor: "pointer", fontFamily: "Roboto, sans-serif", fontWeight: biSeverity === s ? 500 : 400 }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Duration */}
              <div className="col-span-2">
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Block Duration</div>
                <div className="flex gap-2">
                  {BLOCK_DURATIONS.map(d => (
                    <button key={d} onClick={() => setBiDuration(d)}
                      className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                      style={{ backgroundColor: biDuration === d ? M3.error : M3.surfaceContainerLow, color: biDuration === d ? "#fff" : M3.onSurfaceVariant, border: `1.5px solid ${biDuration === d ? M3.error : M3.outlineVariant}`, cursor: "pointer", fontFamily: "Roboto, sans-serif", fontWeight: biDuration === d ? 500 : 400 }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${M3.outlineVariant}`, backgroundColor: M3.surfaceContainerLow }}>
              <TextButton onClick={() => setBlockIPOpen(false)}>Cancel</TextButton>
              <FilledButton small danger onClick={handleBlockIP}><Ban size={14} /> Block IP Now</FilledButton>
            </div>
          </div>
        )}

        {/* ── Add Rule form panel ── */}
        {addRuleOpen && (
          <div className="mx-0" style={{ borderBottom: `2px solid ${M3.primary}` }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: M3.primaryContainer }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: M3.primary }}>
                  <Shield size={16} color="#fff" />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: M3.onPrimaryContainer, fontFamily: "Roboto, sans-serif" }}>Create Firewall Rule</div>
                  <div className="text-xs" style={{ color: M3.onPrimaryContainer, opacity: 0.7, fontFamily: "Roboto, sans-serif" }}>Rules are evaluated in order. Enabled rules apply immediately.</div>
                </div>
              </div>
              <IconButton icon={XCircle} onClick={() => setAddRuleOpen(false)} />
            </div>
            <div className="p-6 grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {/* Name */}
              <div className="col-span-2">
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rule Name *</div>
                <input type="text" placeholder="e.g. Rate Limit — License Validation" value={arName} onChange={e => setArName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${arName ? M3.primary : M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }} />
              </div>
              {/* Rule type */}
              <div>
                <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rule Type</div>
                <div className="flex flex-col gap-1.5">
                  {RULE_TYPES.map(t => {
                    const ruleTypeStyle: Record<string, { bg: string; text: string }> = { "rate-limit": { bg: M3.primaryContainer, text: M3.onPrimaryContainer }, "geo-block": { bg: "#FFDEA5", text: "#5C4200" }, "ip-list": { bg: M3.secondaryContainer, text: M3.onSecondaryContainer }, "signature": { bg: M3.successContainer, text: M3.success }, "validation": { bg: M3.infoContainer, text: M3.info } };
                    const s = ruleTypeStyle[t];
                    return (
                      <button key={t} onClick={() => setArType(t)}
                        className="px-3 py-2 rounded-lg text-xs text-left capitalize transition-all"
                        style={{ backgroundColor: arType === t ? s.bg : M3.surfaceContainerLow, color: arType === t ? s.text : M3.onSurfaceVariant, border: `1.5px solid ${arType === t ? s.text : M3.outlineVariant}`, cursor: "pointer", fontFamily: "Roboto, sans-serif", fontWeight: arType === t ? 500 : 400 }}>
                        {t.replace("-", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Right column fields */}
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Target Endpoint *</div>
                  <input type="text" placeholder="e.g. /api/v1/licenses/validate" value={arTarget} onChange={e => setArTarget(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${arTarget ? M3.primary : M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }} />
                </div>
                <div>
                  <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Limit / Logic</div>
                  <input type="text" placeholder="e.g. 60 req/min, BY COUNTRY, IP reputation" value={arLimit} onChange={e => setArLimit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }} />
                </div>
                <div>
                  <div className="text-xs font-medium mb-1.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Action on Match</div>
                  <div className="flex gap-2">
                    {RULE_ACTIONS.map(a => {
                      const c = { block: M3.error, throttle: M3.warning, challenge: M3.primary, reject: "#B3261E" }[a] ?? M3.primary;
                      return (
                        <button key={a} onClick={() => setArAction(a)}
                          className="flex-1 py-2 rounded-lg text-xs capitalize transition-all"
                          style={{ backgroundColor: arAction === a ? `${c}20` : M3.surfaceContainerLow, color: arAction === a ? c : M3.onSurfaceVariant, border: `1.5px solid ${arAction === a ? c : M3.outlineVariant}`, cursor: "pointer", fontFamily: "Roboto, sans-serif", fontWeight: arAction === a ? 600 : 400 }}>
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Enable immediately</div>
                    <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Rule activates as soon as saved.</div>
                  </div>
                  <Toggle on={arEnabled} onChange={setArEnabled} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${M3.outlineVariant}`, backgroundColor: M3.surfaceContainerLow }}>
              <TextButton onClick={() => setAddRuleOpen(false)}>Cancel</TextButton>
              <FilledButton small onClick={handleAddRule}><Shield size={14} /> Create Rule</FilledButton>
            </div>
          </div>
        )}

        {/* ── Edit Rule inline panel ── */}
        {editRuleRow && (
          <div className="px-6 py-4 flex items-center gap-4" style={{ backgroundColor: M3.secondaryContainer, borderBottom: `2px solid ${M3.secondary}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: M3.secondary }}>
              <Edit3 size={16} color={M3.onSecondary} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium mb-0.5" style={{ color: M3.onSecondaryContainer, fontFamily: "Roboto, sans-serif" }}>
                Editing: <span style={{ fontFamily: "Roboto Mono, monospace" }}>{editRuleRow.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs mb-1" style={{ color: M3.onSecondaryContainer, opacity: 0.7, fontFamily: "Roboto, sans-serif" }}>Rule Name</div>
                  <input value={erName} onChange={e => setErName(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: M3.surface, border: `1px solid ${M3.outline}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }} />
                </div>
                <div style={{ width: 180 }}>
                  <div className="text-xs mb-1" style={{ color: M3.onSecondaryContainer, opacity: 0.7, fontFamily: "Roboto, sans-serif" }}>Limit / Logic</div>
                  <input value={erLimit} onChange={e => setErLimit(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: M3.surface, border: `1px solid ${M3.outline}`, color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <TextButton onClick={() => setEditRuleRow(null)}>Cancel</TextButton>
              <TonalButton small onClick={() => {
                setFirewallRules(d => d.map(r => r.id === editRuleRow.id ? { ...r, name: erName, limit: erLimit } : r));
                showToast(`Rule "${erName}" updated`, "success");
                setEditRuleRow(null);
              }}>Save Changes</TonalButton>
            </div>
          </div>
        )}

        {/* ════════════════ OVERVIEW TAB ════════════════ */}
        {tab === "overview" && (
          <div className="p-5 grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Active threats */}
            <div>
              <div className="font-medium text-sm mb-3" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Active Threats</div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Critical IPs Blocked",       count: blockedIPs.filter(r => r.severity === "critical").length, color: M3.error,   bg: "#FFDAD6" },
                  { label: "High-severity Login Attacks", count: loginAttempts.filter(r => r.attempts >= 10).length,       color: M3.warning, bg: M3.warningContainer },
                  { label: "Suspicious Download Flags",  count: suspDownloads.filter(r => r.severity === "critical").length, color: M3.primary, bg: M3.primaryContainer },
                  { label: "Disabled Firewall Rules",    count: firewallRules.filter(r => !r.enabled).length,              color: M3.secondary,bg: M3.secondaryContainer },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: M3.surfaceContainerLow }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: item.bg, color: item.color, fontFamily: "Roboto Mono, monospace" }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent audit events */}
            <div>
              <div className="font-medium text-sm mb-3" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Recent Security Events</div>
              <div className="flex flex-col gap-0">
                {auditLogData.slice(0, 6).map((evt, i) => {
                  const meta = auditIcon[evt.type] ?? auditIcon.config;
                  const Icon = meta.icon;
                  const sev  = severityStyle[evt.severity] ?? severityStyle.info;
                  return (
                    <div key={evt.id} className="flex gap-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${meta.color}18`, flexShrink: 0 }}>
                          <Icon size={13} color={meta.color} />
                        </div>
                        {i < 5 && <div className="w-px flex-1 my-1" style={{ backgroundColor: M3.outlineVariant, minHeight: 12 }} />}
                      </div>
                      <div className="pb-3 flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 text-xs" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", lineHeight: 1.5 }}>{evt.desc}</div>
                          <span className="text-xs flex-shrink-0 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: sev.bg, color: sev.text, fontFamily: "Roboto, sans-serif" }}>{evt.severity}</span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{evt.time} · {evt.actor}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security recommendations */}
            <div className="col-span-2 pt-1" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
              <div className="font-medium text-sm mb-3" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Recommendations</div>
              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                {[
                  { icon: Globe,       title: "Enable Geo-Blocking",         desc: "Block high-risk countries to reduce attack surface.", action: "Enable Rule", color: M3.warning },
                  { icon: Zap,         title: "Enable VPN Detection",        desc: "Challenge VPN/proxy IPs on download endpoints.",      action: "Enable Rule", color: M3.primary },
                  { icon: ShieldCheck, title: "Rotate API Signing Secret",   desc: "Your HMAC secret is 142 days old. Rotate it.",        action: "Rotate Now",  color: M3.error },
                ].map(r => (
                  <div key={r.title} className="p-4 rounded-xl flex flex-col gap-2" style={{ border: `1px solid ${M3.outlineVariant}`, backgroundColor: M3.surfaceContainerLow }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${r.color}18` }}>
                        <r.icon size={14} color={r.color} />
                      </div>
                      <div className="text-xs font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{r.title}</div>
                    </div>
                    <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", lineHeight: 1.5 }}>{r.desc}</div>
                    <TextButton small onClick={() => showToast(`${r.action} triggered`, "success")}>{r.action} →</TextButton>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ BLOCKED IPs TAB ═════════════ */}
        {tab === "blocklist" && (
          <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["IP Address", "Country", "Reason", "Severity", "Blocked At", "Expires", "Hits", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blockedIPs.filter(r => !search || r.ip.includes(search) || r.country.toLowerCase().includes(search.toLowerCase()) || r.reason.toLowerCase().includes(search.toLowerCase())).map((row, idx) => {
                  const sev = severityStyle[row.severity] ?? severityStyle.low;
                  return (
                    <tr key={row.id}
                      style={{ backgroundColor: idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ fontFamily: "Roboto Mono, monospace", color: M3.onSurface }}>{row.ip}</td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1.5">{row.flag} <span className="text-xs" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.country}</span></span></td>
                      <td className="px-4 py-3 text-xs" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", maxWidth: 240 }}>{row.reason}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: sev.bg, color: sev.text, fontFamily: "Roboto, sans-serif" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sev.dot }} />
                          {row.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.blocked}</td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: row.expires === "Permanent" ? M3.error : M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.expires}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: row.hits > 100 ? M3.error : M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.hits.toLocaleString()}</td>
                      <td className="px-4 py-3" style={{ overflow: "visible" }}><ActionDropdown actions={blockedIPActions(row)} hint={row.ip} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════ LOGIN ATTEMPTS TAB ══════════ */}
        {tab === "logins" && (
          <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["IP Address", "Country", "Target Email", "Target", "Attempts", "Last Attempt", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loginAttempts.filter(r => !search || r.ip.includes(search) || r.email.toLowerCase().includes(search.toLowerCase()) || r.country.toLowerCase().includes(search.toLowerCase())).map((row, idx) => {
                  const statusStyle: Record<string, { bg: string; text: string }> = {
                    blocked:    { bg: "#FFDAD6",     text: M3.error },
                    monitoring: { bg: M3.warningContainer, text: M3.warning },
                    allowed:    { bg: M3.successContainer, text: M3.success },
                  };
                  const s = statusStyle[row.status] ?? statusStyle.allowed;
                  return (
                    <tr key={row.id}
                      style={{ backgroundColor: idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ fontFamily: "Roboto Mono, monospace", color: M3.onSurface }}>{row.ip}</td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1.5">{row.flag} <span className="text-xs" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.country}</span></span></td>
                      <td className="px-4 py-3 text-xs" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.email}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: M3.surfaceContainerHigh, color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.target}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full" style={{ width: 48, backgroundColor: M3.outlineVariant }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (row.attempts / 50) * 100)}%`, backgroundColor: row.attempts >= 30 ? M3.error : row.attempts >= 10 ? M3.warning : M3.success }} />
                          </div>
                          <span className="text-sm font-semibold" style={{ color: row.attempts >= 30 ? M3.error : row.attempts >= 10 ? M3.warning : M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.attempts}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.lastAttempt}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.text, fontFamily: "Roboto, sans-serif" }}>{row.status}</span></td>
                      <td className="px-4 py-3" style={{ overflow: "visible" }}><ActionDropdown actions={loginActions(row)} hint={`${row.ip} · ${row.attempts} attempts`} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════ SUSPICIOUS DOWNLOADS TAB ════ */}
        {tab === "downloads" && (
          <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["IP / Country", "Customer", "License Key", "Product", "Reason", "Severity", "Date", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suspDownloads.filter(r => !search || r.ip.includes(search) || r.customer.toLowerCase().includes(search.toLowerCase()) || r.license.toLowerCase().includes(search.toLowerCase()) || r.product.toLowerCase().includes(search.toLowerCase())).map((row, idx) => {
                  const sev = severityStyle[row.severity] ?? severityStyle.low;
                  return (
                    <tr key={row.id}
                      style={{ backgroundColor: idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow; }}>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium" style={{ fontFamily: "Roboto Mono, monospace", color: M3.onSurface }}>{row.ip}</div>
                        <div className="text-xs mt-0.5">{row.flag} <span style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.country}</span></div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: row.customer === "Unknown" ? M3.onSurfaceVariant : M3.onSurface, fontFamily: "Roboto, sans-serif", fontStyle: row.customer === "Unknown" ? "italic" : "normal" }}>{row.customer}</td>
                      <td className="px-4 py-3 text-xs" style={{ fontFamily: "Roboto Mono, monospace", color: M3.primary }}>{row.license}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.product}</div>
                        <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto Mono, monospace" }}>{row.version}</div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif", maxWidth: 200 }}>{row.reason}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: sev.bg, color: sev.text, fontFamily: "Roboto, sans-serif" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sev.dot }} />
                          {row.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{row.date}</td>
                      <td className="px-4 py-3" style={{ overflow: "visible" }}><ActionDropdown actions={suspDownloadActions(row)} hint={`${row.ip} · ${row.product}`} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════ FIREWALL RULES TAB ══════════ */}
        {tab === "firewall" && (
          <div className="overflow-x-auto" style={{ overflowY: "visible" }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: M3.surfaceContainerLow }}>
                  {["Rule Name", "Type", "Target", "Limit / Logic", "Action", "Hits", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {firewallRules.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase())).map((row, idx) => {
                  const rt = ruleTypeStyle[row.type] ?? ruleTypeStyle["ip-list"];
                  const actionColor: Record<string, string> = { block: M3.error, throttle: M3.warning, challenge: M3.primary, reject: M3.error };
                  return (
                    <tr key={row.id}
                      style={{ backgroundColor: !row.enabled ? M3.surfaceContainerLow : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow, opacity: row.enabled ? 1 : 0.55 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = M3.surfaceContainerHigh; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = !row.enabled ? M3.surfaceContainerLow : idx % 2 === 0 ? M3.surface : M3.surfaceContainerLow; (e.currentTarget as HTMLElement).style.opacity = row.enabled ? "1" : "0.55"; }}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{row.name}</div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: rt.bg, color: rt.text, fontFamily: "Roboto, sans-serif" }}>{row.type}</span></td>
                      <td className="px-4 py-3 text-xs" style={{ fontFamily: "Roboto Mono, monospace", color: M3.onSurfaceVariant }}>{row.target}</td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ fontFamily: "Roboto Mono, monospace", color: M3.onSurface }}>{row.limit}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: `${actionColor[row.action] ?? M3.primary}18`, color: actionColor[row.action] ?? M3.primary, fontFamily: "Roboto, sans-serif" }}>{row.action}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto Mono, monospace" }}>{row.hits.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Toggle on={row.enabled} onChange={() => { setFirewallRules(d => d.map(r => r.id === row.id ? { ...r, enabled: !r.enabled } : r)); showToast(`Rule ${row.enabled ? "disabled" : "enabled"}`, row.enabled ? "warning" : "success"); }} />
                      </td>
                      <td className="px-4 py-3" style={{ overflow: "visible" }}><ActionDropdown actions={firewallActions(row)} hint={row.name} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════ AUDIT LOG TAB ═══════════════ */}
        {tab === "audit" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="font-medium text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Full Security Audit Log</div>
              <OutlinedButton small onClick={() => showToast("Audit log exported as CSV", "success")}><DownloadIcon size={14} /> Export Log</OutlinedButton>
            </div>
            <div className="flex flex-col">
              {auditLogData.map((evt, i) => {
                const meta = auditIcon[evt.type] ?? auditIcon.config;
                const Icon = meta.icon;
                const sev  = severityStyle[evt.severity] ?? severityStyle.info;
                return (
                  <div key={evt.id} className="flex gap-4">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${meta.color}15`, border: `1.5px solid ${meta.color}40` }}>
                        <Icon size={15} color={meta.color} />
                      </div>
                      {i < auditLogData.length - 1 && <div className="w-px flex-1 my-1.5" style={{ backgroundColor: M3.outlineVariant, minHeight: 16 }} />}
                    </div>
                    <div className="flex-1 pb-5 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium leading-snug" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{evt.desc}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{evt.time}</span>
                            <span className="text-xs" style={{ color: M3.outlineVariant }}>·</span>
                            <span className="text-xs font-medium" style={{ color: evt.actor === "System" ? M3.secondary : M3.primary, fontFamily: "Roboto, sans-serif" }}>{evt.actor}</span>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 capitalize" style={{ backgroundColor: sev.bg, color: sev.text, fontFamily: "Roboto, sans-serif" }}>{evt.severity}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog open={dialog.open} title={dialog.title} body={dialog.body} confirmLabel={dialog.confirmLabel} danger={dialog.danger} icon={dialog.icon} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────────────────
const SETTINGS_TABS = ["Modules","Licensing","Downloads","Updates","Subscriptions","SaaS","Affiliates","Abandoned Cart","Security","Emails","Advanced"];

/* ── Reusable settings field ─── */
function SettingsField({ label, desc, type = "text", defaultValue, placeholder }: { label: string; desc?: string; type?: string; defaultValue?: string; placeholder?: string }) {
  return (
    <div className="flex items-start justify-between gap-8 py-4" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{desc}</div>}
      </div>
      <input type={type} defaultValue={defaultValue} placeholder={placeholder}
        className="px-3 py-2 rounded-lg text-sm outline-none"
        style={{ width: 260, backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: type === "number" ? "Roboto Mono, monospace" : "Roboto, sans-serif" }} />
    </div>
  );
}
function SettingsToggleField({ label, desc, defaultOn = false }: { label: string; desc?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-8 py-4" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
      <div>
        <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{desc}</div>}
      </div>
      <Toggle on={on} onChange={setOn} />
    </div>
  );
}
function SettingsSelectField({ label, desc, options, defaultValue }: { label: string; desc?: string; options: string[]; defaultValue?: string }) {
  return (
    <div className="flex items-start justify-between gap-8 py-4" style={{ borderBottom: `1px solid ${M3.outlineVariant}` }}>
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{desc}</div>}
      </div>
      <select defaultValue={defaultValue} className="px-3 py-2 rounded-lg text-sm outline-none"
        style={{ width: 260, backgroundColor: M3.surfaceContainerLow, border: `1px solid ${M3.outlineVariant}`, color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
function SettingsSectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-2 mt-5 first:mt-0">
      <div className="font-medium text-sm" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{title}</div>
      {desc && <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{desc}</div>}
    </div>
  );
}

/* ── Licensing Settings ─── */
function SettingsLicensing({ onSave }: { onSave: () => void }) {
  return (
    <div>
      <div className="mb-5"><h2 className="font-medium text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Licensing</h2><p className="text-sm mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Configure how licenses are issued, validated, and expired.</p></div>
      <SettingsSectionHeader title="License Generation" />
      <SettingsSelectField label="Key Format" desc="Pattern used when generating new license keys." options={["WDD-XXXX-XXXX-XXXX", "XXXX-XXXX-XXXX-XXXX", "Custom"]} defaultValue="WDD-XXXX-XXXX-XXXX" />
      <SettingsField label="Default Expiry (days)" desc="Default validity period for new licenses. Leave blank for lifetime." type="number" defaultValue="365" />
      <SettingsField label="Grace Period (days)" desc="Days after expiry before a license stops functioning." type="number" defaultValue="14" />
      <SettingsSectionHeader title="Activation Limits" />
      <SettingsField label="Default Site Activations" desc="Maximum sites a single license can activate on." type="number" defaultValue="1" />
      <SettingsToggleField label="Allow Staging Activations" desc="Staging and local domains don't count toward the activation limit." defaultOn />
      <SettingsToggleField label="Lock to IP on First Use" desc="Bind a license to the IP used during first activation." defaultOn={false} />
      <SettingsSectionHeader title="Validation API" />
      <SettingsField label="API Endpoint Base URL" desc="Public URL where plugins call for license validation." defaultValue="https://store.example.com/api/v1" />
      <SettingsToggleField label="Require HMAC Signature" desc="Validate each request with a shared HMAC-SHA256 secret." defaultOn />
      <SettingsField label="HMAC Secret" desc="Rotate this regularly. Changes take effect immediately." type="password" placeholder="••••••••••••••••••••••••••••••••" />
      <div className="mt-6"><FilledButton small onClick={onSave}>Save Licensing Settings</FilledButton></div>
    </div>
  );
}

/* ── Downloads Settings ─── */
function SettingsDownloads({ onSave }: { onSave: () => void }) {
  return (
    <div>
      <div className="mb-5"><h2 className="font-medium text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Downloads</h2><p className="text-sm mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Control how download links are generated, secured, and expired.</p></div>
      <SettingsSectionHeader title="Secure Link Settings" />
      <SettingsField label="Link Expiry (minutes)" desc="How long a generated download URL remains valid." type="number" defaultValue="60" />
      <SettingsField label="Max Downloads per Link" desc="Maximum number of times a single signed URL can be used." type="number" defaultValue="3" />
      <SettingsToggleField label="Bind Link to IP" desc="Download links are only valid from the IP that requested them." defaultOn={false} />
      <SettingsSectionHeader title="Storage" />
      <SettingsSelectField label="Storage Driver" desc="Where package files are stored." options={["Local (filesystem)", "Amazon S3", "Cloudflare R2", "DigitalOcean Spaces"]} defaultValue="Amazon S3" />
      <SettingsField label="CDN Base URL" desc="Public CDN domain used to serve download files." defaultValue="https://cdn.example.com/downloads" />
      <SettingsSectionHeader title="Rate Limiting" />
      <SettingsField label="Max Downloads / IP / Hour" desc="Set 0 to disable IP-level rate limiting." type="number" defaultValue="10" />
      <SettingsToggleField label="Block Tor Exit Nodes" desc="Automatically block download requests from known Tor IPs." defaultOn />
      <div className="mt-6"><FilledButton small onClick={onSave}>Save Download Settings</FilledButton></div>
    </div>
  );
}

/* ── Email Settings ─── */
function SettingsEmails({ onSave }: { onSave: () => void }) {
  return (
    <div>
      <div className="mb-5"><h2 className="font-medium text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Emails</h2><p className="text-sm mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Configure transactional email delivery and notification templates.</p></div>
      <SettingsSectionHeader title="SMTP / Delivery" />
      <SettingsSelectField label="Mail Driver" desc="Email delivery provider." options={["SMTP", "Postmark", "SendGrid", "Mailgun", "SES"]} defaultValue="Postmark" />
      <SettingsField label="From Name" defaultValue="Woo Digital Downloads" />
      <SettingsField label="From Email" type="email" defaultValue="noreply@example.com" />
      <SettingsField label="Reply-To Email" type="email" defaultValue="support@example.com" />
      <SettingsSectionHeader title="Notification Triggers" />
      <SettingsToggleField label="License Issued"            desc="Send email when a new license is created after purchase."          defaultOn />
      <SettingsToggleField label="License Expiry Reminder"   desc="Send reminder 7 days before license expiry."                      defaultOn />
      <SettingsToggleField label="License Revoked"           desc="Notify customer when their license is revoked by an admin."       defaultOn />
      <SettingsToggleField label="Subscription Renewal"      desc="Confirm each successful subscription renewal."                    defaultOn />
      <SettingsToggleField label="Subscription Failed"       desc="Alert customer when a renewal payment fails."                     defaultOn />
      <SettingsToggleField label="Abandoned Cart Recovery"   desc="Send recovery emails as configured in the Abandoned Cart module." defaultOn />
      <SettingsToggleField label="Admin Security Alerts"     desc="Email admin when critical security events are detected."          defaultOn />
      <div className="mt-6 flex gap-2">
        <FilledButton small onClick={onSave}>Save Email Settings</FilledButton>
        <TonalButton small onClick={() => {}}>Send Test Email</TonalButton>
      </div>
    </div>
  );
}

/* ── Advanced Settings ─── */
function SettingsAdvanced({ onSave }: { onSave: () => void }) {
  return (
    <div>
      <div className="mb-5"><h2 className="font-medium text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Advanced</h2><p className="text-sm mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>Low-level configuration. Change with care.</p></div>
      <SettingsSectionHeader title="API & Webhooks" />
      <SettingsField label="Webhook URL" desc="POST endpoint for license and subscription events." placeholder="https://your-app.com/webhooks/wdd" />
      <SettingsField label="Webhook Secret" type="password" desc="Used to sign webhook payloads." placeholder="••••••••••••••••" />
      <SettingsSelectField label="Webhook Events" desc="Which events trigger a webhook call." options={["All events", "License events only", "Subscription events only", "Security events only"]} defaultValue="All events" />
      <SettingsSectionHeader title="Data & Privacy" />
      <SettingsField label="Data Retention (days)" desc="How long logs and event records are kept. 0 = forever." type="number" defaultValue="365" />
      <SettingsToggleField label="Anonymise IP Addresses" desc="Store only the /24 subnet of customer IPs in logs." defaultOn={false} />
      <SettingsToggleField label="GDPR Deletion on Request" desc="Automatically delete all PII when a customer requests erasure." defaultOn />
      <SettingsSectionHeader title="Cache & Performance" />
      <SettingsField label="License Validation Cache (sec)" desc="How long a successful validation result is cached." type="number" defaultValue="300" />
      <SettingsToggleField label="Enable Query Cache" desc="Cache database queries for dashboard stats." defaultOn />
      <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${M3.outlineVariant}` }}>
        <div className="text-sm font-medium mb-3" style={{ color: M3.error, fontFamily: "Roboto, sans-serif" }}>Danger Zone</div>
        <div className="flex gap-2">
          <OutlinedButton danger small onClick={() => {}}>Flush All Caches</OutlinedButton>
          <OutlinedButton danger small onClick={() => {}}>Reset Plugin to Defaults</OutlinedButton>
        </div>
      </div>
      <div className="mt-4"><FilledButton small onClick={onSave}>Save Advanced Settings</FilledButton></div>
    </div>
  );
}

/* ── Generic tab (Updates, Subscriptions, SaaS, Affiliates, Abandoned Cart, Security) ─── */
function SettingsGenericTab({ name, onSave }: { name: string; onSave: () => void }) {
  const configs: Record<string, Array<{ type: "toggle" | "field" | "select"; label: string; desc?: string; defaultValue?: string; defaultOn?: boolean; options?: string[] }>> = {
    Updates: [
      { type: "toggle", label: "Auto-Publish Patch Releases",    desc: "Automatically promote x.x.N releases to stable without manual review.", defaultOn: false },
      { type: "field",  label: "Update Check Interval (hours)",  desc: "How often connected plugins check for updates.",           defaultValue: "12" },
      { type: "toggle", label: "Notify Admin on New Release",     desc: "Send admin email when a new package is published.",        defaultOn: true },
      { type: "select", label: "Default Release Channel",         options: ["stable", "beta", "nightly"],                          defaultValue: "stable" },
    ],
    Subscriptions: [
      { type: "field",  label: "Dunning Retry Attempts",   desc: "How many times to retry a failed payment before cancelling.", defaultValue: "3" },
      { type: "field",  label: "Retry Interval (days)",    desc: "Days between each payment retry.",                            defaultValue: "3" },
      { type: "toggle", label: "Prorate Plan Changes",     desc: "Charge/credit the difference when a customer changes plans.", defaultOn: true },
      { type: "toggle", label: "Allow Customer Pausing",   desc: "Let customers pause their own subscription from the portal.", defaultOn: true },
      { type: "select", label: "Cancellation Behaviour",   options: ["End of period", "Immediately", "Ask customer"],           defaultValue: "End of period" },
    ],
    SaaS: [
      { type: "field",  label: "Trial Period (days)",       desc: "Length of free trial for new SaaS accounts.",                defaultValue: "14" },
      { type: "toggle", label: "Require Credit Card on Trial", desc: "Require payment details before starting a trial.",        defaultOn: false },
      { type: "field",  label: "Seat Over-Provisioning (%)", desc: "Allow accounts to exceed their seat limit by this %.",      defaultValue: "10" },
      { type: "toggle", label: "Auto-Suspend on Non-Payment", desc: "Suspend account immediately if payment fails after dunning.", defaultOn: true },
    ],
    Affiliates: [
      { type: "field",  label: "Default Commission Rate (%)", desc: "Default % commission for new affiliates.",                 defaultValue: "10" },
      { type: "field",  label: "Cookie Duration (days)",     desc: "How long a referral cookie lasts before expiring.",        defaultValue: "60" },
      { type: "select", label: "Commission Trigger",         options: ["On purchase", "After refund window", "On subscription renewal"], defaultValue: "After refund window" },
      { type: "toggle", label: "Auto-Approve Affiliates",    desc: "Automatically approve new affiliate applications.",         defaultOn: false },
      { type: "field",  label: "Minimum Payout ($)",         desc: "Minimum balance required before a payout is triggered.",   defaultValue: "50" },
    ],
    "Abandoned Cart": [
      { type: "field",  label: "Abandon Timeout (minutes)", desc: "Minutes of inactivity before a cart is marked abandoned.",  defaultValue: "30" },
      { type: "field",  label: "Email 1 Delay (minutes)",   desc: "Send first recovery email X minutes after abandonment.",   defaultValue: "60" },
      { type: "field",  label: "Email 2 Delay (hours)",     desc: "Send second recovery email X hours after abandonment.",    defaultValue: "24" },
      { type: "field",  label: "Email 3 Delay (hours)",     desc: "Send third recovery email X hours after abandonment.",     defaultValue: "72" },
      { type: "toggle", label: "Include Discount in Email 3", desc: "Attach a one-time discount code to the final recovery email.", defaultOn: true },
      { type: "field",  label: "Auto-Discount Amount (%)",  desc: "% discount to include in the final recovery email.",       defaultValue: "10" },
    ],
    Security: [
      { type: "field",  label: "Max Login Attempts",        desc: "Failed logins before an IP is auto-blocked.",              defaultValue: "10" },
      { type: "field",  label: "Lockout Duration (minutes)", desc: "How long a blocked IP stays locked out.",                 defaultValue: "60" },
      { type: "toggle", label: "Block Tor Exit Nodes",       desc: "Auto-block all known Tor exit node IPs.",                 defaultOn: true },
      { type: "toggle", label: "Geo-Block High-Risk Countries", desc: "Block requests from countries flagged as high risk.",   defaultOn: false },
      { type: "toggle", label: "Alert Admin on Brute Force", desc: "Email admin when a brute-force wave is detected.",        defaultOn: true },
      { type: "select", label: "2FA Requirement",            options: ["None", "Admin users only", "All users"],              defaultValue: "Admin users only" },
    ],
  };
  const fields = configs[name] ?? [];
  return (
    <div>
      <div className="mb-5"><h2 className="font-medium text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{name} Settings</h2></div>
      {fields.map((f, i) =>
        f.type === "toggle" ? <SettingsToggleField key={i} label={f.label} desc={f.desc} defaultOn={f.defaultOn} />
        : f.type === "select" ? <SettingsSelectField key={i} label={f.label} desc={f.desc} options={f.options!} defaultValue={f.defaultValue} />
        : <SettingsField key={i} label={f.label} desc={f.desc} type="text" defaultValue={f.defaultValue} />
      )}
      <div className="mt-6"><FilledButton small onClick={onSave}>Save {name} Settings</FilledButton></div>
    </div>
  );
}

function SettingsPage({ modules, onToggleModule }: { modules: Module[]; onToggleModule: (name: string) => void }) {
  const [activeTab, setActiveTab] = useState("Modules");
  const [toast, setToast] = useState<ToastProps>({ message: "", type: "success", visible: false });
  const showSettingsToast = (msg: string) => { setToast({ message: msg, type: "success", visible: true }); setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000); };

  return (
    <div className="flex min-h-[600px]" style={{ gap: 0 }}>
      <div className="flex flex-col flex-shrink-0" style={{ width: 200, borderRight: `1px solid ${M3.outlineVariant}` }}>
        {SETTINGS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="text-left px-4 py-3 text-sm transition-all"
            style={{ backgroundColor: activeTab === tab ? M3.primaryContainer : "transparent", color: activeTab === tab ? M3.onPrimaryContainer : M3.onSurfaceVariant, borderRight: activeTab === tab ? `3px solid ${M3.primary}` : "3px solid transparent", border: "none", borderRight: activeTab === tab ? `3px solid ${M3.primary}` : "3px solid transparent", cursor: "pointer", fontFamily: "Roboto, sans-serif", fontWeight: activeTab === tab ? 500 : 400 }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6">
        {activeTab === "Modules" ? (
          <div className="flex flex-col gap-2">
            <div className="mb-4">
              <h2 className="font-medium text-lg" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>Plugin Modules</h2>
              <p className="text-sm mt-1" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                Enable or disable modules. Enabled modules appear in the sidebar and unlock their analytics.
              </p>
            </div>
            {modules.map(mod => (
              <Card key={mod.name} className="flex items-center gap-4 px-5 py-4">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: mod.enabled ? M3.success : M3.outlineVariant }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{mod.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>{mod.desc}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ border: `1px solid ${M3.outlineVariant}`, color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    {mod.phase}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: mod.enabled ? M3.successContainer : M3.surfaceContainerHigh, color: mod.enabled ? M3.success : M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>
                    {mod.enabled ? "Active" : "Disabled"}
                  </span>
                  <Toggle on={mod.enabled} onChange={() => onToggleModule(mod.name)} />
                </div>
              </Card>
            ))}
          </div>
        ) : activeTab === "Licensing" ? (
          <SettingsLicensing onSave={() => showSettingsToast("Licensing settings saved")} />
        ) : activeTab === "Downloads" ? (
          <SettingsDownloads onSave={() => showSettingsToast("Download settings saved")} />
        ) : activeTab === "Emails" ? (
          <SettingsEmails onSave={() => showSettingsToast("Email settings saved")} />
        ) : activeTab === "Advanced" ? (
          <SettingsAdvanced onSave={() => showSettingsToast("Advanced settings saved")} />
        ) : (
          <SettingsGenericTab name={activeTab} onSave={() => showSettingsToast(`${activeTab} settings saved`)} />
        )}
      </div>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ─── Placeholder ───────────────────────────────────────────────────────────────
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: M3.primaryContainer }}>
        <Layers size={22} color={M3.primary} />
      </div>
      <div className="text-sm font-medium" style={{ color: M3.onSurface, fontFamily: "Roboto, sans-serif" }}>{title}</div>
      <div className="text-xs" style={{ color: M3.onSurfaceVariant, fontFamily: "Roboto, sans-serif" }}>This module is enabled — content coming soon</div>
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [prevPage, setPrevPage] = useState<Page | null>(null);
  const [modules, setModules]           = useState<Module[]>(INITIAL_MODULES);
  const [saasDetailId, setSaasDetailId]           = useState<string>("SAAS-001");
  const [affiliateDetailId, setAffiliateDetailId] = useState<string>("AFF-001");

  const enabledModules = new Set(modules.filter(m => m.enabled).map(m => m.name));

  const navigate = useCallback((p: Page) => {
    setPrevPage(page);
    setPage(p);
  }, [page]);

  const goBack = () => { if (prevPage) setPage(prevPage); else setPage("licenses"); };

  const toggleModule = (name: string) => {
    setModules(prev => prev.map(m => m.name === name ? { ...m, enabled: !m.enabled } : m));
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: M3.surfaceContainerLow, fontFamily: "Roboto, sans-serif" }}>
      <Sidebar activePage={page} onNav={navigate} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} enabledModules={enabledModules} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar page={page} onNav={navigate} />

        <main className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
          {page === "overview"                 && <OverviewPage onNav={navigate} />}
          {page === "licenses"                 && <LicensesPage onDetail={() => navigate("license-detail")} onCustomer={() => navigate("customer-detail")} onSummary={() => navigate("license-summary")} />}
          {page === "license-summary"          && <LicenseSummaryPage onBack={goBack} onViewAll={() => navigate("licenses")} />}
          {page === "license-detail"           && <LicenseDetailPage onBack={goBack} />}
          {page === "customer-detail"          && <CustomerDetailPage onBack={goBack} onLicenseDetail={() => navigate("license-detail")} />}
          {page === "subscriptions"            && <SubscriptionsPage />}
          {page === "analytics"                && <AnalyticsPage onNav={navigate} enabledModules={enabledModules} />}
          {page === "analytics-subscriptions"  && <SubscriptionAnalyticsPage onBack={() => navigate("analytics")} />}
          {page === "analytics-affiliates"     && <AffiliateAnalyticsPage onBack={() => navigate("analytics")} />}
          {page === "analytics-abandoned-cart" && <AbandonedCartAnalyticsPage onBack={() => navigate("analytics")} />}
          {page === "downloads"                && <DownloadsPage />}
          {page === "updates"                  && <UpdatesPage />}
          {page === "saas"                     && <SaasPage onViewDetail={id => { setSaasDetailId(id); navigate("saas-detail"); }} />}
          {page === "saas-detail"              && <SaasDetailPage accountId={saasDetailId} onBack={goBack} />}
          {page === "affiliates"               && <AffiliatesPage onViewDetail={id => { setAffiliateDetailId(id); navigate("affiliate-detail"); }} />}
          {page === "affiliate-detail"         && <AffiliateDetailPage affiliateId={affiliateDetailId} onBack={goBack} />}
          {page === "abandoned-cart"           && <AbandonedCartPage />}
          {page === "settings"                 && <SettingsPage modules={modules} onToggleModule={toggleModule} />}
          {page === "security"                 && <SecurityPage />}
        </main>
      </div>
    </div>
  );
}
