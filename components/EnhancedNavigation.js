'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  Settings,
  ChevronDown,
  ChevronRight,
  Store,
  Building2,
  FolderTree,
  Tag,
  Palette,
  Ruler,
  Pill,
  FileStack,
  Factory,
  Receipt,
  ShoppingBag,
  FileOutput,
  ClipboardList,
  BoxIcon,
  RotateCcw,
  CreditCard,
  FileEdit,
  Banknote,
  Wallet,
  BookOpen,
  ArrowDownUp,
  Wrench,
  HelpCircle,
  LogOut,
  Menu,
  X,
  TrendingUp
} from 'lucide-react';

export default function EnhancedNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // All sections expanded by default
  const [expandedSections, setExpandedSections] = useState({
    masters: true,
    transactions: true,
    reports: true,
    utilities: true,
    helps: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (path) => pathname === path;

  // Main Navigation Items
  const mainNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Point of Sale', path: '/pos', icon: ShoppingCart },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Customers', path: '/customers', icon: Users },
  ];

  // Masters Section - Complete list from screenshot
  const mastersItems = [
    { name: 'Supplier', path: '/suppliers', icon: Users },
    { name: 'Customer', path: '/customers', icon: Users },
    { name: 'Stores', path: '/stores', icon: Store },
    { name: 'Department', path: '/departments', icon: Building2 },
    { name: 'Category', path: '/categories', icon: FolderTree },
    { name: 'Brand', path: '/brands', icon: Tag },
    { name: 'Made', path: '/made', icon: Factory },
    { name: 'Colour', path: '/colours', icon: Palette },
    { name: 'Size', path: '/sizes', icon: Ruler },
    { name: 'Generic', path: '/generic', icon: Pill },
    { name: 'Item Details', path: '/item-details', icon: FileStack },
    { name: 'Production Template', path: '/production-template', icon: Factory },
  ];

  // Transaction Section - Complete list from screenshot
  const transactionItems = [
    { name: 'Supplier OP Balance', path: '/supplier-op-balance', icon: Banknote },
    { name: 'Customer OP Balance', path: '/customer-op-balance', icon: Wallet },
    { name: 'Opening Stock Entry', path: '/opening-stock', icon: BoxIcon },
    { name: 'Pos Billing 2', path: '/pos-billing-2', icon: Receipt },
    { name: 'Wholesale Sales', path: '/wholesale', icon: ShoppingBag },
    { name: 'Quotation', path: '/quotation', icon: FileEdit },
    { name: 'Item Dispatch Note', path: '/dispatch-note', icon: FileOutput },
    { name: 'Purchase Order', path: '/purchase-orders', icon: ClipboardList },
    { name: 'Purchase(GRN)', path: '/purchase-grn', icon: BoxIcon },
    { name: 'Production', path: '/production', icon: Factory },
    { name: 'Purchase Return', path: '/purchase-return', icon: RotateCcw },
    { name: 'Supplier Payments', path: '/supplier-payments', icon: CreditCard },
    { name: 'Supplier Debit Note', path: '/supplier-debit', icon: FileEdit },
    { name: 'Sales', path: '/sales', icon: TrendingUp },
    { name: 'Internal Sale New', path: '/internal-sale-new', icon: ShoppingCart },
    { name: 'Internal Sale', path: '/internal-sale', icon: ShoppingCart },
    { name: 'Sales Return', path: '/returns', icon: RotateCcw },
    { name: 'Sales Return (Whole Sales)', path: '/sales-return-whole', icon: RotateCcw },
    { name: 'Stock Adjustment', path: '/stock-adjustment', icon: ArrowDownUp },
    { name: 'Customer Payment', path: '/customer-payment', icon: CreditCard },
    { name: 'Customer Credit note', path: '/customer-credit', icon: FileEdit },
    { name: 'Payment Voucher', path: '/payment-voucher', icon: Receipt },
    { name: 'Petty Cash Voucher', path: '/petty-cash', icon: Wallet },
    { name: 'General Receipts', path: '/general-receipts', icon: Receipt },
    { name: 'Bank Entries', path: '/bank-entries', icon: Banknote },
  ];

  // Reports Section
  const reportsItems = [
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  // Utilities Section
  const utilitiesItems = [
    { name: 'Utilities', path: '/utilities', icon: Wrench },
  ];

  // Helps Section
  const helpsItems = [
    { name: 'Helps', path: '/helps', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl z-40 w-64 transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Hardware Shop
          </h1>
          <p className="text-xs text-center text-gray-400 mt-1">Management System</p>
        </div>

        {/* Main Navigation */}
        <div className="p-2">
          {mainNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                router.push(item.path);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg scale-105'
                  : 'hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          ))}
        </div>

        {/* Masters Section */}
        <div className="px-2 mt-4">
          <button
            onClick={() => toggleSection('masters')}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5" />
              <span className="text-sm font-semibold">Masters</span>
            </div>
            {expandedSections.masters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.masters && (
            <div className="ml-4 mt-1 border-l-2 border-gray-700 pl-2">
              {mastersItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-600 shadow-md'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Section */}
        <div className="px-2 mt-2">
          <button
            onClick={() => toggleSection('transactions')}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              <span className="text-sm font-semibold">Transaction</span>
            </div>
            {expandedSections.transactions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.transactions && (
            <div className="ml-4 mt-1 border-l-2 border-gray-700 pl-2 max-h-96 overflow-y-auto">
              {transactionItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-600 shadow-md'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reports Section */}
        <div className="px-2 mt-2">
          <button
            onClick={() => toggleSection('reports')}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-semibold">Reports</span>
            </div>
            {expandedSections.reports ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.reports && (
            <div className="ml-4 mt-1 border-l-2 border-gray-700 pl-2">
              {reportsItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-600 shadow-md'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Utilities Section */}
        <div className="px-2 mt-2">
          <button
            onClick={() => toggleSection('utilities')}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              <span className="text-sm font-semibold">Utilities</span>
            </div>
            {expandedSections.utilities ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.utilities && (
            <div className="ml-4 mt-1 border-l-2 border-gray-700 pl-2">
              {utilitiesItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-600 shadow-md'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Helps Section */}
        <div className="px-2 mt-2">
          <button
            onClick={() => toggleSection('helps')}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">Helps</span>
            </div>
            {expandedSections.helps ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.helps && (
            <div className="ml-4 mt-1 border-l-2 border-gray-700 pl-2">
              {helpsItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-600 shadow-md'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="px-2 mt-2">
          <button
            onClick={() => {
              router.push('/settings');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
              isActive('/settings')
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-semibold">Settings</span>
          </button>
        </div>

        {/* Logout */}
        <div className="p-2 mt-4 mb-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main content spacer */}
      <div className="lg:ml-64"></div>
    </>
  );
}