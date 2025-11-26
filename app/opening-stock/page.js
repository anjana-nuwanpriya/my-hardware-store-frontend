'use client';

import { useState, useEffect } from 'react';
import { BoxIcon, Plus, Trash2, Search, Calendar } from 'lucide-react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';

export default function OpeningStockPage() {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    store_id: '',
    quantity: '',
    rate: '',
    entry_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesRes, productsRes, storesRes] = await Promise.all([
        api.get('/opening-balances/stock'),
        api.get('/products'),
        api.get('/stores')
      ]);
      setEntries(entriesRes.data.entries || []);
      setProducts(productsRes.data.products || []);
      setStores(storesRes.data.stores || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/opening-balances/stock', formData);
      loadData();
      closeModal();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert(error.response?.data?.error || 'Failed to save opening stock');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this opening stock entry?')) return;
    try {
      await api.delete(`/opening-balances/stock/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete opening stock');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      product_id: '',
      store_id: '',
      quantity: '',
      rate: '',
      entry_date: new Date().toISOString().split('T')[0]
    });
  };

  const filteredEntries = entries.filter(entry =>
    entry.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.products?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.stores?.store_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = filteredEntries.reduce((sum, e) => sum + parseFloat(e.total || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <div className="p-6 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BoxIcon className="w-8 h-8 text-purple-600" />
              Opening Stock Entry
            </h1>
            <p className="text-gray-600 mt-1">Add initial stock when starting the system (One-time setup)</p>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Opening Stock Value</p>
                <p className="text-3xl font-bold">Rs. {totalValue.toLocaleString()}</p>
              </div>
              <BoxIcon className="w-16 h-16 opacity-50" />
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products or stores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-5 h-5" />
                Add Opening Stock
              </button>
            </div>
          </div>

          {/* Entries Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading entries...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Store</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Rate</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{entry.products?.name}</div>
                        <div className="text-xs text-gray-500">SKU: {entry.products?.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {entry.stores?.store_name}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {parseFloat(entry.quantity).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        Rs. {parseFloat(entry.rate).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-purple-600">
                          Rs. {parseFloat(entry.total).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredEntries.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <BoxIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>No opening stock entries found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Add Opening Stock Entry
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product *
                </label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store *
                </label>
                <select
                  value={formData.store_id}
                  onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.store_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate (Cost Price) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {formData.quantity && formData.rate && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-bold text-purple-600">
                    Rs. {(parseFloat(formData.quantity || 0) * parseFloat(formData.rate || 0)).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}