'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Plus, Eye, Trash2, Search } from 'lucide-react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';

export default function PurchaseReturnPage() {
  const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    grn_id: '',
    store_id: '',
    return_date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
    items: []
  });
  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    quantity: '',
    rate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [returnsRes, suppliersRes, storesRes, productsRes, grnsRes] = await Promise.all([
        api.get('/purchase-returns'),
        api.get('/suppliers'),
        api.get('/stores'),
        api.get('/products'),
        api.get('/grn')
      ]);
      setReturns(returnsRes.data.returns || []);
      setSuppliers(suppliersRes.data.suppliers || []);
      setStores(storesRes.data.stores || []);
      setProducts(productsRes.data.products || []);
      setGrns(grnsRes.data.grns || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!currentItem.product_id || !currentItem.quantity || !currentItem.rate) {
      alert('Please fill all item fields');
      return;
    }

    const product = products.find(p => p.id === currentItem.product_id);
    const newItem = {
      ...currentItem,
      product_name: product?.name,
      line_total: parseFloat(currentItem.quantity) * parseFloat(currentItem.rate)
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });

    setCurrentItem({ product_id: '', quantity: '', rate: '' });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.line_total, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      await api.post('/purchase-returns', formData);
      loadData();
      closeModal();
      alert('Purchase return created successfully!');
    } catch (error) {
      console.error('Error saving return:', error);
      alert(error.response?.data?.error || 'Failed to save purchase return');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this purchase return?')) return;
    try {
      await api.delete(`/purchase-returns/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting return:', error);
      alert('Failed to delete purchase return');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      supplier_id: '',
      grn_id: '',
      store_id: '',
      return_date: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
      items: []
    });
    setCurrentItem({ product_id: '', quantity: '', rate: '' });
  };

  const filteredReturns = returns.filter(ret =>
    ret.return_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <div className="p-6 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-8 h-8 text-red-600" />
              Purchase Returns
            </h1>
            <p className="text-gray-600 mt-1">Return damaged or incorrect items to suppliers</p>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search returns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Plus className="w-5 h-5" />
                Create Return
              </button>
            </div>
          </div>

          {/* Returns Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading returns...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Return #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Supplier</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Store</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reason</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map((ret) => (
                    <tr key={ret.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-red-600">{ret.return_number}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {ret.suppliers?.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {ret.stores?.store_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(ret.return_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-red-600">
                        Rs. {parseFloat(ret.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {ret.reason || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => alert('View details coming soon')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ret.id)}
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

              {filteredReturns.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <RotateCcw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>No purchase returns found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Return Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Create Purchase Return
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier *
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference GRN
                  </label>
                  <select
                    value={formData.grn_id}
                    onChange={(e) => setFormData({ ...formData, grn_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select GRN (Optional)</option>
                    {grns.map(grn => (
                      <option key={grn.id} value={grn.id}>{grn.grn_number}</option>
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
                      <option key={store.id} value={store.id}>{store.store_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Date *
                  </label>
                  <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason *
                  </label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Damaged items, Wrong items received"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Add Items Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Items to Return</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product
                    </label>
                    <select
                      value={currentItem.product_id}
                      onChange={(e) => setCurrentItem({ ...currentItem, product_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentItem.rate}
                      onChange={(e) => setCurrentItem({ ...currentItem, rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Item
                </button>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Items to Return</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600">Product</th>
                          <th className="text-right py-2 px-3 text-sm font-semibold text-gray-600">Qty</th>
                          <th className="text-right py-2 px-3 text-sm font-semibold text-gray-600">Rate</th>
                          <th className="text-right py-2 px-3 text-sm font-semibold text-gray-600">Total</th>
                          <th className="text-center py-2 px-3 text-sm font-semibold text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-3 text-sm">{item.product_name}</td>
                            <td className="py-2 px-3 text-sm text-right">{item.quantity}</td>
                            <td className="py-2 px-3 text-sm text-right">Rs. {parseFloat(item.rate).toLocaleString()}</td>
                            <td className="py-2 px-3 text-sm text-right font-semibold">Rs. {item.line_total.toLocaleString()}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan="3" className="py-3 px-3 text-right">Total Return Amount:</td>
                          <td className="py-3 px-3 text-right text-red-600">Rs. {calculateTotal().toLocaleString()}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={formData.items.length === 0}
                >
                  Create Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}