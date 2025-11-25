'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, DollarSign, ShoppingCart, Package, Users, ArrowUp, ArrowDown } from 'lucide-react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    sales: { today: 0, yesterday: 0, change: 0 },
    orders: { today: 0, pending: 0, completed: 0 },
    inventory: { totalProducts: 0, lowStock: 0, value: 0 },
    customers: { total: 0, new: 0, returning: 0 },
    recentSales: [],
    topProducts: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStart = tomorrow.toISOString().split('T')[0];
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = yesterday.toISOString().split('T')[0];

      const dashboardResponse = await api.get(`/reports/dashboard?start_date=${todayStart}&end_date=${tomorrowStart}`);
      const yesterdayResponse = await api.get(`/reports/dashboard?start_date=${yesterdayStart}&end_date=${todayStart}`);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const salesResponse = await api.get(`/reports/sales?start_date=${sevenDaysAgo.toISOString().split('T')[0]}&end_date=${tomorrowStart}`);
      const topProductsResponse = await api.get(`/reports/top-products?start_date=${sevenDaysAgo.toISOString().split('T')[0]}&end_date=${tomorrowStart}&limit=5`);
      const inventoryResponse = await api.get('/reports/inventory');
      const customersResponse = await api.get('/customers');
      
      const todaySales = dashboardResponse.data.totalSales || 0;
      const yesterdaySales = yesterdayResponse.data.totalSales || 0;
      const change = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales * 100).toFixed(1) : 0;
      
      const todayOrders = salesResponse.data.sales.filter(sale => {
        const saleDate = new Date(sale.created_at).toDateString();
        return saleDate === new Date().toDateString();
      });
      
      const pendingOrders = todayOrders.filter(o => o.status === 'pending').length;
      const completedOrders = todayOrders.filter(o => o.status === 'completed').length;
      
      const allCustomers = customersResponse.data.customers || [];
      const newCustomers = allCustomers.filter(c => {
        const createdDate = new Date(c.created_at);
        return createdDate >= sevenDaysAgo;
      }).length;

      setData({
        sales: { 
          today: todaySales, 
          yesterday: yesterdaySales, 
          change: parseFloat(change) 
        },
        orders: { 
          today: todayOrders.length, 
          pending: pendingOrders, 
          completed: completedOrders 
        },
        inventory: { 
          totalProducts: inventoryResponse.data.summary.totalProducts || 0, 
          lowStock: inventoryResponse.data.summary.lowStock || 0, 
          value: inventoryResponse.data.summary.totalValue || 0 
        },
        customers: { 
          total: allCustomers.length, 
          new: newCustomers, 
          returning: allCustomers.length - newCustomers 
        },
        recentSales: salesResponse.data.sales.slice(0, 7) || [],
        topProducts: topProductsResponse.data.topProducts || []
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDailySales = () => {
    const salesByDate = {};
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(dateStr);
      salesByDate[dateStr] = 0;
    }
    
    data.recentSales.forEach(sale => {
      const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
      if (salesByDate.hasOwnProperty(saleDate)) {
        salesByDate[saleDate] += parseFloat(sale.total_amount);
      }
    });
    
    return last7Days.map(date => ({
      date,
      amount: salesByDate[date]
    }));
  };

  const dailySalesData = getDailySales();
  const maxSale = Math.max(...dailySalesData.map(d => d.amount), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <EnhancedNavigation />
        <div className="lg:ml-64 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <EnhancedNavigation />
      
      {/* Main Content with sidebar spacing */}
      <div className="lg:ml-64 p-6 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="mb-6 backdrop-blur-xl bg-white/40 rounded-2xl p-6 shadow-xl border border-white/20">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Sales Card */}
            <div className="group backdrop-blur-xl bg-white/30 rounded-2xl p-5 shadow-xl border border-white/40 hover:bg-white/40 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-lg font-bold text-white pr-1">Rs</span>
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${
                  data.sales.change >= 0 
                    ? 'text-green-600 bg-green-100/80' 
                    : 'text-red-600 bg-red-100/80'
                }`}>
                  {data.sales.change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(data.sales.change)}%
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Today's Sales</h3>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Rs {data.sales.today.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">vs Rs {data.sales.yesterday.toFixed(2)} yesterday</p>
            </div>

            {/* Orders Card */}
            <div className="group backdrop-blur-xl bg-white/30 rounded-2xl p-5 shadow-xl border border-white/40 hover:bg-white/40 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                {data.orders.pending > 0 && (
                  <span className="px-3 py-1 bg-orange-100/80 text-orange-600 text-xs font-semibold rounded-full">
                    {data.orders.pending} pending
                  </span>
                )}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Orders Today</h3>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {data.orders.today}
              </p>
              <p className="text-xs text-gray-500 mt-1">{data.orders.completed} completed</p>
            </div>

            {/* Inventory Card */}
            <div className="group backdrop-blur-xl bg-white/30 rounded-2xl p-5 shadow-xl border border-white/40 hover:bg-white/40 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-white" />
                </div>
                {data.inventory.lowStock > 0 && (
                  <span className="px-3 py-1 bg-red-100/80 text-red-600 text-xs font-semibold rounded-full">
                    {data.inventory.lowStock} low
                  </span>
                )}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Products</h3>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {data.inventory.totalProducts}
              </p>
              <p className="text-xs text-gray-500 mt-1">Rs {data.inventory.value.toFixed(2)} value</p>
            </div>

            {/* Customers Card */}
            <div className="group backdrop-blur-xl bg-white/30 rounded-2xl p-5 shadow-xl border border-white/40 hover:bg-white/40 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                {data.customers.new > 0 && (
                  <span className="px-3 py-1 bg-green-100/80 text-green-600 text-xs font-semibold rounded-full">
                    +{data.customers.new} new
                  </span>
                )}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Customers</h3>
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {data.customers.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">{data.customers.returning} returning</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Sales Chart */}
            <div className="backdrop-blur-xl bg-white/30 rounded-2xl p-5 shadow-xl border border-white/40">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Sales Last 7 Days
              </h2>
              <div className="space-y-3">
                {dailySalesData.map((day, index) => {
                  const percentage = maxSale > 0 ? (day.amount / maxSale) * 100 : 0;
                  const date = new Date(day.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">{dayName}</span>
                        <span className="text-gray-900 font-semibold">Rs {day.amount.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200/50 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Products */}
            <div className="backdrop-blur-xl bg-white/30 rounded-2xl p-5 shadow-xl border border-white/40">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Top Products
              </h2>
              {data.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {data.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 backdrop-blur-lg bg-white/40 rounded-xl border border-white/60">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.total_quantity} sold</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm">Rs {product.total_revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No sales data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="backdrop-blur-xl bg-white/30 rounded-2xl p-6 shadow-xl border border-white/40">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button 
                onClick={() => router.push('/pos')}
                className="p-4 backdrop-blur-lg bg-white/50 rounded-xl border border-white/60 hover:bg-white/70 transition-all hover:scale-105 shadow-lg"
              >
                <ShoppingCart className="w-7 h-7 text-blue-600 mb-2 mx-auto" />
                <p className="font-semibold text-gray-700 text-sm">New Sale</p>
              </button>
              <button 
                onClick={() => router.push('/inventory')}
                className="p-4 backdrop-blur-lg bg-white/50 rounded-xl border border-white/60 hover:bg-white/70 transition-all hover:scale-105 shadow-lg"
              >
                <Package className="w-7 h-7 text-purple-600 mb-2 mx-auto" />
                <p className="font-semibold text-gray-700 text-sm">Manage Inventory</p>
              </button>
              <button 
                onClick={() => router.push('/customers')}
                className="p-4 backdrop-blur-lg bg-white/50 rounded-xl border border-white/60 hover:bg-white/70 transition-all hover:scale-105 shadow-lg"
              >
                <Users className="w-7 h-7 text-orange-600 mb-2 mx-auto" />
                <p className="font-semibold text-gray-700 text-sm">View Customers</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}