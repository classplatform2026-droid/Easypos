import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  CheckCircle2,
  Coins,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Minus,
  CreditCard,
  ArrowRight,
  Phone,
  Search,
  ShoppingCart,
  Check,
  ShieldCheck,
  Sparkles,
  Headphones,
  CalendarClock,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { AdjustExpiryModal, ExpiryStoreTarget } from '../components/AdjustExpiryModal';

interface AdminDashboardScreenProps {
  onNavigateToShops: (shopId?: string) => void;
  onNavigateToPayments: () => void;
  onNavigateToSupport?: () => void;
  onReviewPayment?: (payment: any) => void;
  onAddPayment?: () => void;
  onSwitchToOwnerPos?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'danger') => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onNavigateToShops,
  onNavigateToPayments,
  onNavigateToSupport,
  onReviewPayment,
  onAddPayment,
  onSwitchToOwnerPos,
  onShowToast,
}) => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'Today' | '7 Days' | '30 Days' | 'This Month'>('30 Days');
  const [mobileTab, setMobileTab] = useState<'all' | 'shops' | 'payments'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTrx, setCopiedTrx] = useState<string | null>(null);

  const [stats, setStats] = useState<any>({
    totalShops: 0,
    activeShops: 0,
    monthlyRevenueFormatted: '৳ 0',
    pendingPayments: 0,
  });
  const [recentShops, setRecentShops] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminMetrics();
      if (!res) return;
      if (res.stats) setStats(res.stats);
      setRecentShops(res.recentShops || []);
      setPendingPayments(res.pendingPayments || []);
    } catch (err) {
      console.warn('Metrics notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleCopyTrx = (trx: string) => {
    navigator.clipboard?.writeText(trx);
    setCopiedTrx(trx);
    setTimeout(() => setCopiedTrx(null), 2000);
  };

  // Expiry Adjustment States & Handlers
  const [selectedStoreForExpiry, setSelectedStoreForExpiry] = useState<ExpiryStoreTarget | null>(null);
  const [expiryModalOpen, setExpiryModalOpen] = useState(false);
  const [quickPickerOpen, setQuickPickerOpen] = useState(false);
  const [allStoresForPicker, setAllStoresForPicker] = useState<any[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);

  const handleOpenExpiryModalForStore = (store: any) => {
    setSelectedStoreForExpiry({
      id: store.id || store._id,
      name: store.name,
      branch: store.branch,
      owner: store.owner || store.ownerName,
      ownerName: store.owner || store.ownerName,
      phone: store.phone,
      plan: store.plan || store.subscription?.plan,
      subscription: store.subscription,
      expiryDate: store.expiryDate || store.subscription?.expiryDate || store.subscription?.endDate,
    });
    setExpiryModalOpen(true);
  };

  const handleOpenQuickExpiryPicker = async () => {
    setQuickPickerOpen(true);
    setPickerLoading(true);
    try {
      const res = await api.getAdminStores();
      if (res?.stores) {
        setAllStoresForPicker(res.stores);
      }
    } catch (err) {
      console.warn('Could not load stores for quick picker:', err);
    } finally {
      setPickerLoading(false);
    }
  };

  const handleExpirySuccess = (_updatedStore: any) => {
    loadMetrics();
  };

  // Filtered lists for mobile quick-find
  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return recentShops;
    const q = searchQuery.toLowerCase();
    return recentShops.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.owner?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.branch?.toLowerCase().includes(q)
    );
  }, [recentShops, searchQuery]);

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return pendingPayments;
    const q = searchQuery.toLowerCase();
    return pendingPayments.filter(
      (p) =>
        p.shop?.toLowerCase().includes(q) ||
        p.transactionId?.toLowerCase().includes(q) ||
        p.method?.toLowerCase().includes(q)
    );
  }, [pendingPayments, searchQuery]);

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-28 md:pb-8">
      {/* Top Header & Actions - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                Admin Dashboard
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-store management & live SaaS performance
            </p>
          </div>

          {/* Quick Refresh Icon on mobile */}
          <button
            type="button"
            onClick={loadMetrics}
            disabled={loading}
            className="sm:hidden p-2 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl active:scale-95 transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        {/* Action Controls & Date Chips */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Quick Date Chips (Touch-friendly horizontal scroll) */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl text-[11px] font-semibold text-slate-600 overflow-x-auto w-full sm:w-auto">
            {(['Today', '7 Days', '30 Days', 'This Month'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setDateRange(r);
                  loadMetrics();
                }}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
                  dateRange === r
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigateToShops()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Shop</span>
            </button>

            {onAddPayment && (
              <button
                type="button"
                onClick={onAddPayment}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Add Payment</span>
              </button>
            )}

            {onNavigateToSupport && (
              <button
                type="button"
                onClick={onNavigateToSupport}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-500/20 transition-all cursor-pointer"
                title="Customer Support & Tickets"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Customer Support</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadMetrics}
              disabled={loading}
              className="hidden sm:flex items-center gap-1.5 p-2 px-3 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Refresh database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Mobile Action Cards: 1-Tap Access on Phone & Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={() => onNavigateToShops()}
          className="p-3 bg-white border border-slate-200/80 rounded-2xl text-left shadow-2xs hover:border-blue-400 active:scale-[0.98] transition-all flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Manage Shops</p>
            <p className="text-[10px] text-slate-400 truncate">{stats.totalShops || 0} registered</p>
          </div>
        </button>

        <button
          type="button"
          onClick={handleOpenQuickExpiryPicker}
          className="p-3 bg-white border border-slate-200/80 rounded-2xl text-left shadow-2xs hover:border-indigo-400 active:scale-[0.98] transition-all flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Adjust Expiry</p>
            <p className="text-[10px] text-indigo-600 font-semibold truncate">+ / - Owner dates</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onAddPayment || onNavigateToPayments}
          className="p-3 bg-white border border-slate-200/80 rounded-2xl text-left shadow-2xs hover:border-emerald-400 active:scale-[0.98] transition-all flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Add Payment</p>
            <p className="text-[10px] text-emerald-600 font-semibold truncate">+ Record bill</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onNavigateToPayments}
          className="p-3 bg-white border border-slate-200/80 rounded-2xl text-left shadow-2xs hover:border-amber-400 active:scale-[0.98] transition-all flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Approvals</p>
            <p className="text-[10px] text-amber-600 font-bold truncate">
              {pendingPayments.length} pending
            </p>
          </div>
        </button>

        {onNavigateToSupport && (
          <button
            type="button"
            onClick={onNavigateToSupport}
            className="p-3 bg-white border border-slate-200/80 rounded-2xl text-left shadow-2xs hover:border-purple-400 active:scale-[0.98] transition-all flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Customer Support</p>
              <p className="text-[10px] text-purple-600 font-semibold truncate">
                {stats.openTickets !== undefined && stats.openTickets > 0 ? `${stats.openTickets} tickets open` : 'Help & Tickets'}
              </p>
            </div>
          </button>
        )}

        {onSwitchToOwnerPos && (
          <button
            type="button"
            onClick={onSwitchToOwnerPos}
            className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-left shadow-sm shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">POS Terminal</p>
              <p className="text-[10px] text-blue-100 truncate">Switch to POS</p>
            </div>
          </button>
        )}
      </div>

      {/* Primary Metrics: 2 columns on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Shops */}
        <div
          onClick={() => onNavigateToShops()}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-2xs cursor-pointer hover:border-blue-400 hover:shadow-xs transition-all active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              <span className="truncate">Total Shops</span>
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              <span>+8.4%</span>
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {stats.totalShops?.toLocaleString() || '0'}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Registered businesses</p>
          </div>
        </div>

        {/* Active Shops */}
        <div
          onClick={() => onNavigateToShops()}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-xs transition-all active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span className="truncate">Active Shops</span>
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              <span>+6.2%</span>
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono text-emerald-600">
              {stats.activeShops?.toLocaleString() || '0'}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Live & operating</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div
          onClick={onNavigateToPayments}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-2xs cursor-pointer hover:border-indigo-400 hover:shadow-xs transition-all active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
              <span className="truncate">Revenue</span>
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              <span>+12%</span>
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono truncate">
              {stats.monthlyRevenueFormatted || '৳ 0'}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Monthly subscription</p>
          </div>
        </div>

        {/* Pending Payments */}
        <div
          onClick={onNavigateToPayments}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-2xs cursor-pointer hover:border-amber-400 hover:shadow-xs transition-all active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
              <span className="truncate">Pending</span>
            </span>
            {pendingPayments.length > 0 && (
              <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                Action Req
              </span>
            )}
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
              {pendingPayments.length}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Awaiting approval</p>
          </div>
        </div>
      </div>

      {/* Mobile Search & Section Switcher */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shops or transactions..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mobile Segmented View Tabs (Shops vs Pending) */}
          <div className="sm:hidden flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setMobileTab('all')}
              className={`px-2 py-1.5 rounded-lg transition-all ${
                mobileTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('shops')}
              className={`px-2 py-1.5 rounded-lg transition-all ${
                mobileTab === 'shops' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Shops
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('payments')}
              className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                mobileTab === 'payments' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <span>Pay</span>
              {pendingPayments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center">
                  {pendingPayments.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Recent Shops & Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Shops Section */}
        {(mobileTab === 'all' || mobileTab === 'shops') && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Recent Shops</h2>
                <p className="text-[11px] text-slate-400">Newly registered stores</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToShops()}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-3 px-2 font-semibold">Shop</th>
                    <th className="py-3 px-2 font-semibold">Owner</th>
                    <th className="py-3 px-2 font-semibold">Plan</th>
                    <th className="py-3 px-2 font-semibold">Expiry Date</th>
                    <th className="py-3 px-2 font-semibold">Status</th>
                    <th className="py-3 px-2 font-semibold text-right">Quick Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShops.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <Store className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No shops found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredShops.map((s, idx) => {
                      const exp = s.expiryDate || s.subscription?.expiryDate || s.subscription?.endDate;
                      const expDate = exp ? new Date(exp) : null;
                      const daysLeft = expDate && !isNaN(expDate.getTime())
                        ? Math.round((expDate.getTime() - Date.now()) / 86400000)
                        : null;

                      return (
                        <tr
                          key={s.id || idx}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td
                            className="py-3 px-2 font-bold text-slate-800 cursor-pointer"
                            onClick={() => onNavigateToShops(s.id)}
                          >
                            <div className="hover:text-blue-600 transition-colors">{s.name}</div>
                            {s.branch && <div className="text-[10px] text-slate-400">{s.branch}</div>}
                          </td>
                          <td className="py-3 px-2 text-slate-600">
                            <div>{s.owner}</div>
                            {s.phone && <div className="text-[10px] text-slate-400 font-mono">{s.phone}</div>}
                          </td>
                          <td className="py-3 px-2 font-medium text-slate-600">
                            <span className="font-semibold text-slate-800">{s.plan}</span>
                          </td>
                          <td className="py-3 px-2">
                            {expDate && !isNaN(expDate.getTime()) ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-800 block text-[11px]">
                                  {expDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span
                                  className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                    daysLeft !== null && daysLeft > 5
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : daysLeft !== null && daysLeft >= 0
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {daysLeft !== null
                                    ? daysLeft > 0
                                      ? `${daysLeft}d left`
                                      : daysLeft === 0
                                      ? 'Expires today'
                                      : `Expired ${Math.abs(daysLeft)}d ago`
                                    : 'N/A'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No date set</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                s.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {s.status === 'active' ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenExpiryModalForStore(s);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                              title="Increase or Decrease Expiry Date"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              <span>+/- Expiry</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Easy touch & direct quick adjustment) */}
            <div className="sm:hidden divide-y divide-slate-100 pt-1">
              {filteredShops.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <Store className="w-7 h-7 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No shops found</p>
                </div>
              ) : (
                filteredShops.slice(0, 8).map((s, idx) => {
                  const exp = s.expiryDate || s.subscription?.expiryDate || s.subscription?.endDate;
                  const expDate = exp ? new Date(exp) : null;
                  const daysLeft = expDate && !isNaN(expDate.getTime())
                    ? Math.round((expDate.getTime() - Date.now()) / 86400000)
                    : null;

                  return (
                    <div
                      key={s.id || idx}
                      className="py-3 space-y-2 cursor-pointer active:bg-slate-50/50 transition-colors"
                      onClick={() => onNavigateToShops(s.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {s.name ? s.name.substring(0, 2).toUpperCase() : 'SH'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {s.owner} · <span className="font-semibold text-slate-700">{s.plan}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {s.status === 'active' ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                          <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {expDate && !isNaN(expDate.getTime())
                              ? expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'No date'}
                          </span>
                          {daysLeft !== null && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                                daysLeft > 5
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : daysLeft >= 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {daysLeft > 0 ? `${daysLeft}d left` : `Expired`}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenExpiryModalForStore(s);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3 h-3 text-indigo-600" />
                          <Minus className="w-3 h-3 text-indigo-600" />
                          <span>Expiry</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Pending Payments Section */}
        {(mobileTab === 'all' || mobileTab === 'payments') && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Pending Payments</h2>
                <p className="text-[11px] text-slate-400">Awaiting approval</p>
              </div>
              <div className="flex items-center gap-2">
                {onAddPayment && (
                  <button
                    type="button"
                    onClick={onAddPayment}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onNavigateToPayments}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-3 px-2 font-semibold">Shop</th>
                    <th className="py-3 px-2 font-semibold">Amount</th>
                    <th className="py-3 px-2 font-semibold">Method</th>
                    <th className="py-3 px-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No pending payments</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          All subscription payments are up to date.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-2 font-bold text-slate-800">{p.shop}</td>
                        <td className="py-3 px-2 font-mono font-extrabold text-slate-900">{p.amount}</td>
                        <td className="py-3 px-2">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {p.method}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (onReviewPayment) {
                                onReviewPayment(p);
                              } else {
                                onNavigateToPayments();
                              }
                            }}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200/80 cursor-pointer transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Easy touch & direct quick review) */}
            <div className="sm:hidden divide-y divide-slate-100 pt-1">
              {filteredPayments.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <Clock className="w-7 h-7 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No pending payments</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">All accounts are settled.</p>
                </div>
              ) : (
                filteredPayments.map((p, idx) => (
                  <div key={p.id || idx} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{p.shop}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-black text-xs text-slate-900">{p.amount}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-bold">
                          {p.method}
                        </span>
                        {p.transactionId && (
                          <button
                            type="button"
                            onClick={() => handleCopyTrx(p.transactionId)}
                            className="text-[10px] text-slate-400 font-mono underline hover:text-slate-600"
                            title="Copy TrxID"
                          >
                            {copiedTrx === p.transactionId ? 'Copied!' : 'TrxID'}
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onReviewPayment) {
                          onReviewPayment(p);
                        } else {
                          onNavigateToPayments();
                        }
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer shrink-0"
                    >
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Adjust Expiry Modal for targeted shop */}
      <AdjustExpiryModal
        isOpen={expiryModalOpen}
        store={selectedStoreForExpiry}
        onClose={() => {
          setExpiryModalOpen(false);
          setSelectedStoreForExpiry(null);
        }}
        onSuccess={handleExpirySuccess}
        onShowToast={onShowToast}
      />

      {/* Quick Shop Picker Modal (When clicking "Adjust Expiry" from Quick Actions) */}
      {quickPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Select Shop to Adjust Expiry
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Choose any registered store to increase or decrease validity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPickerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search store by name, branch or phone..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 pr-0.5">
                {pickerLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading stores...</span>
                  </div>
                ) : (
                  (() => {
                    const list = (allStoresForPicker.length > 0 ? allStoresForPicker : recentShops).filter(
                      (st) =>
                        !pickerSearch.trim() ||
                        st.name?.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                        st.ownerName?.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                        st.owner?.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                        st.phone?.includes(pickerSearch) ||
                        st.branch?.toLowerCase().includes(pickerSearch.toLowerCase())
                    );

                    if (list.length === 0) {
                      return (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No matching stores found.
                        </div>
                      );
                    }

                    return list.map((st) => {
                      const exp = st.expiryDate || st.subscription?.expiryDate || st.subscription?.endDate;
                      const expDate = exp ? new Date(exp) : null;
                      const daysLeft = expDate && !isNaN(expDate.getTime())
                        ? Math.round((expDate.getTime() - Date.now()) / 86400000)
                        : null;

                      return (
                        <div
                          key={st._id || st.id}
                          onClick={() => {
                            setQuickPickerOpen(false);
                            handleOpenExpiryModalForStore(st);
                          }}
                          className="py-2.5 px-2 hover:bg-indigo-50/50 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{st.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {st.ownerName || st.owner || 'Owner'} • {st.phone}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-600 font-mono block">
                              {expDate && !isNaN(expDate.getTime())
                                ? expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'No date'}
                            </span>
                            {daysLeft !== null && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                  daysLeft > 5
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : daysLeft >= 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {daysLeft > 0 ? `${daysLeft}d left` : `Expired`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setQuickPickerOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
