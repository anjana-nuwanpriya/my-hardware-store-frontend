'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Download,
  Calendar,
  Filter,
  FileText,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(today.getDate() - 30);
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    return {
      start_date: oneMonthAgo.toISOString().split('T')[0],
      end_date: tomorrow.toISOString().split('T')[0]
    };
  });

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState(null);
  const [salesReport, setSalesReport] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [stockMovements, setStockMovements] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);

  useEffect(() => {
    loadReports();
  }, [dateRange, activeTab]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'dashboard':
          await loadDashboard();
          break;
        case 'sales':
          await loadSalesReport();
          break;
        case 'products':
          await loadTopProducts();
          break;
        case 'inventory':
          await loadInventoryReport();
          break;
        case 'movements':
          await loadStockMovements();
          break;
        case 'payments':
          await loadPaymentMethods();
          break;
        case 'profit-loss':
          await loadProfitLoss();
          break;
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    const response = await api.get(`/reports/dashboard?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`);
    setDashboardData(response.data);
  };

  const loadSalesReport = async () => {
    const response = await api.get(`/reports/sales?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`);
    setSalesReport(response.data.sales || []);
  };

  const loadTopProducts = async () => {
    const response = await api.get(`/reports/top-products?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}&limit=10`);
    setTopProducts(response.data.topProducts || []);
  };

  const loadInventoryReport = async () => {
    const response = await api.get('/reports/inventory');
    setInventoryReport(response.data);
  };

  const loadStockMovements = async () => {
    const response = await api.get(`/reports/stock-movements?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`);
    setStockMovements(response.data.movements || []);
  };

  const loadPaymentMethods = async () => {
    const response = await api.get(`/reports/payment-methods?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`);
    setPaymentMethods(response.data.paymentMethods || []);
  };

  const loadProfitLoss = async () => {
    const response = await api.get(`/reports/profit-loss?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`);
    setProfitLoss(response.data);
  };

  const exportToCSV = (data, filename) => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

// Custom Rs icon component
const RsIcon = () => (
  <span style={{ 
    fontWeight: '600', 
    fontSize: '0.9em',
    fontFamily: 'inherit'
  }}>
    Rs
  </span>
);

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'sales', name: 'Sales Report', icon: TrendingUp },
  { id: 'products', name: 'Top Products', icon: Package },
  { id: 'inventory', name: 'Inventory', icon: Package },
  { id: 'movements', name: 'Stock Movements', icon: Activity },
  { id: 'payments', name: 'Payment Methods', icon: RsIcon },
  { id: 'profit-loss', name: 'Profit & Loss', icon: PieChart }
];

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <div className="p-6 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">View detailed business insights and reports</p>
          </div>

          {/* Date Range Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
              </div>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
              Loading report...
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardView data={dashboardData} />}
              {activeTab === 'sales' && <SalesReportView data={salesReport} onExport={() => exportToCSV(salesReport, 'sales-report')} />}
              {activeTab === 'products' && <TopProductsView data={topProducts} onExport={() => exportToCSV(topProducts, 'top-products')} />}
              {activeTab === 'inventory' && <InventoryReportView data={inventoryReport} onExport={() => exportToCSV(inventoryReport?.inventory, 'inventory-report')} />}
              {activeTab === 'movements' && <StockMovementsView data={stockMovements} onExport={() => exportToCSV(stockMovements, 'stock-movements')} />}
              {activeTab === 'payments' && <PaymentMethodsView data={paymentMethods} />}
              {activeTab === 'profit-loss' && <ProfitLossView data={profitLoss} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Dashboard View Component
function DashboardView({ data }) {
  if (!data) return null;
  
  // Custom Rs icon component
const RsIcon = () => (
  <span style={{ 
    fontWeight: '600', 
    fontSize: '0.9em',
    fontFamily: 'inherit'
  }}>
    Rs
  </span>
);

 const cards = [
  { label: 'Total Sales', value: `Rs ${data.totalSales?.toFixed(2)}`, icon: RsIcon, color: 'bg-green-100 text-green-600' },
  { label: 'Total Orders', value: data.totalOrders, icon: ShoppingCart, color: 'bg-blue-100 text-blue-600' },
  { label: 'Total Products', value: data.totalProducts, icon: Package, color: 'bg-purple-100 text-purple-600' },
  { label: 'Low Stock Items', value: data.lowStockItems, icon: TrendingUp, color: 'bg-orange-100 text-orange-600' }
];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">{card.label}</p>
          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// Sales Report View Component
function SalesReportView({ data, onExport }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Sales Report</h2>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order #</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Payment</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((sale) => (
              <tr key={sale.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-sm font-medium">{sale.order_number}</td>
                <td className="py-3 px-4 text-sm">{new Date(sale.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-sm">
                  {sale.customers ? `${sale.customers.first_name} ${sale.customers.last_name}` : 'Walk-in'}
                </td>
                <td className="py-3 px-4 text-sm capitalize">{sale.payment_method}</td>
                <td className="py-3 px-4 text-sm font-semibold text-right">Rs {parseFloat(sale.total_amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="p-12 text-center text-gray-500">No sales data found for selected date range</div>
      )}
    </div>
  );
}

// Top Products View Component
function TopProductsView({ data, onExport }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Top Selling Products</h2>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Rank</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">SKU</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Quantity Sold</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((product, index) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-sm font-bold text-blue-600">#{index + 1}</td>
                <td className="py-3 px-4 text-sm font-medium">{product.name}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{product.sku}</td>
                <td className="py-3 px-4 text-sm text-right">{product.total_quantity}</td>
                <td className="py-3 px-4 text-sm font-semibold text-right">Rs {product.total_revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="p-12 text-center text-gray-500">No product data found for selected date range</div>
      )}
    </div>
  );
}

// Inventory Report View Component
function InventoryReportView({ data, onExport }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Total Inventory Value</p>
          <p className="text-2xl font-bold text-gray-900">Rs {data.summary.totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{data.summary.totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{data.summary.outOfStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">{data.summary.lowStock}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Inventory Details</h2>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">SKU</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Stock</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Cost Price</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Value</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.inventory.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium">{item.sku}</td>
                  <td className="py-3 px-4 text-sm">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold">{item.stock}</td>
                  <td className="py-3 px-4 text-sm text-right">Rs {parseFloat(item.cost_price || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold">Rs {item.value.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Out of Stock' ? 'bg-red-100 text-red-700' :
                      item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Stock Movements View Component
function StockMovementsView({ data, onExport }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Stock Movement History</h2>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reference</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((movement) => (
              <tr key={movement.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-sm">
                  {new Date(movement.created_at).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-sm font-medium">
                  {movement.products?.name || 'Unknown'}
                  <div className="text-xs text-gray-500">{movement.products?.sku}</div>
                </td>
                <td className="py-3 px-4 text-sm">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    movement.movement_type.includes('in') || movement.movement_type === 'adjustment_in' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {movement.movement_type.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-right font-semibold">
                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </td>
                <td className="py-3 px-4 text-sm capitalize">{movement.reference_type?.replace('_', ' ')}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{movement.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="p-12 text-center text-gray-500">No stock movements found for selected date range</div>
      )}
    </div>
  );
}

// Payment Methods View Component
function PaymentMethodsView({ data }) {
  const total = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Summary Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Methods Breakdown</h2>
        {data.map((method, index) => {
          const percentage = total > 0 ? (method.total / total * 100).toFixed(1) : 0;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">{method.method}</span>
                <span className="text-sm text-gray-500">{method.count} transactions</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">Rs {method.total.toFixed(2)}</span>
                <span className="text-sm font-semibold text-blue-600">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pie Chart Visualization */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Visual Breakdown</h3>
        <div className="flex items-center justify-center h-64">
          <PieChart className="w-32 h-32 text-blue-600" />
        </div>
        <div className="mt-6 space-y-2">
          {data.map((method, index) => {
            const percentage = total > 0 ? (method.total / total * 100).toFixed(1) : 0;
            return (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}></div>
                  <span className="capitalize">{method.method}</span>
                </div>
                <span className="font-semibold">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Profit & Loss View Component
function ProfitLossView({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-green-100 text-green-600">
  <span className="text-xl font-semibold">Rs</span>
</div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">Rs {data.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
    <div className="p-3 rounded-lg bg-green-100 text-green-600">
  <span className="text-xl font-semibold">Rs</span>
</div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-gray-900">Rs {data.totalCost.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Gross Profit</p>
          <p className="text-2xl font-bold text-blue-900">Rs {data.grossProfit.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
          <p className="text-2xl font-bold text-purple-900">{data.profitMargin}%</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Profit & Loss Statement</h2>
        
        <div className="space-y-4">
          {/* Revenue Section */}
          <div className="border-b pb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold text-gray-900">Revenue</span>
              <span className="text-lg font-bold text-green-600">Rs {data.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-600 pl-4">
              From {data.orderCount} completed orders
            </div>
          </div>

          {/* Cost Section */}
          <div className="border-b pb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold text-gray-900">Cost of Goods Sold</span>
              <span className="text-lg font-bold text-red-600">Rs {data.totalCost.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-600 pl-4">
              Direct product costs
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">Gross Profit</span>
              <span className="text-xl font-bold text-blue-900">Rs {data.grossProfit.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Profit Margin: {data.profitMargin}%
            </div>
          </div>

          {/* Performance Indicator */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance Indicator</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      parseFloat(data.profitMargin) >= 30 ? 'bg-green-500' :
                      parseFloat(data.profitMargin) >= 15 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(parseFloat(data.profitMargin) * 2, 100)}%` }}
                  ></div>
                </div>
              </div>
              <span className={`text-sm font-semibold ${
                parseFloat(data.profitMargin) >= 30 ? 'text-green-600' :
                parseFloat(data.profitMargin) >= 15 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {parseFloat(data.profitMargin) >= 30 ? 'Excellent' :
                 parseFloat(data.profitMargin) >= 15 ? 'Good' :
                 'Needs Improvement'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}