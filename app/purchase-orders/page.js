'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Eye, Trash2, Search, Package, TrendingUp } from 'lucide-react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_date: '',
    items: [],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [poRes, suppRes, prodRes] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/suppliers'),
        api.get('/products')
      ]);
      setPurchaseOrders(poRes.data.purchaseOrders || []);
      setSuppliers(suppRes.data.suppliers || []);
      setProducts(prodRes.data.products || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItemToForm = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity_ordered: 1, unit_cost: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await api.post('/purchase-orders', {
        ...formData,
        staff_id: user.id
      });
      loadData();
      closeModal();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Failed to create purchase order');
    }
  };

  const handleReceive = async (po) => {
    try {
      const response = await api.get(`/purchase-orders/${po.id}`);
      setSelectedPO(response.data);
      setShowReceiveModal(true);
    } catch (error) {
      console.error('Error loading PO details:', error);
    }
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/purchase-orders/${selectedPO.id}/receive`, {
        items: selectedPO.items
      });
      loadData();
      setShowReceiveModal(false);
      setSelectedPO(null);
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      alert('Failed to receive purchase order');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await api.delete(`/purchase-orders/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      alert('Failed to delete purchase order');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      supplier_id: '',
      expected_date: '',
      items: [],
      notes: ''
    });
  };

  const filteredPOs = purchaseOrders.filter(po =>
    po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_cost || 0) * parseInt(item.quantity_ordered || 0));
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <div className="p-6 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-blue-600" />
              Purchase Orders
            </h1>
            <p className="text-gray-600 mt-1">Manage purchase orders from suppliers</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total POs</p>
                  <p className="text-2xl font-bold text-gray-900">{purchaseOrders.length}</p>
                </div>
                <Package className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {purchaseOrders.filter(po => po.status === 'pending').length}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Received</p>
                  <p className="text-2xl font-bold text-green-600">
                    {purchaseOrders.filter(po => po.status === 'received').length}
                  </p>
                </div>
                <Package className="w-12 h-12 text-green-600 opacity-20" />
              </div>
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
                    placeholder="Search purchase orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                New Purchase Order
              </button>
            </div>
          </div>

          {/* Purchase Orders Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading purchase orders...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">PO Number</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Supplier</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Expected</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map((po) => (
                    <tr key={po.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{po.po_number}</td>
                      <td className="py-3 px-4">{po.suppliers?.name || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(po.order_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        Rs {parseFloat(po.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          po.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          po.status === 'received' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {po.status === 'pending' && (
                            <button
                              onClick={() => handleReceive(po)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Receive"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(po.id)}
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

              {filteredPOs.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>No purchase orders found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Purchase Order</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier *
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    Expected Date
                  </label>
                  <input
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Items *</label>
                  <button
                    type="button"
                    onClick={addItemToForm}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity_ordered}
                        onChange={(e) => updateItem(index, 'quantity_ordered', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        min="1"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Cost"
                        value={item.unit_cost}
                        onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        min="0"
                        step="0.01"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {formData.items.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No items added yet</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows="2"
                />
              </div>

              {/* Total */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">Rs {calculateTotal().toFixed(2)}</span>
                </div>
              </div>

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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={formData.items.length === 0}
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Receive Purchase Order: {selectedPO.po_number}
            </h2>
            
            <form onSubmit={handleReceiveSubmit} className="space-y-4">
              <div className="space-y-2">
                {selectedPO.items.map((item, index) => (
                  <div key={item.id} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.products?.name}</p>
                      <p className="text-sm text-gray-600">
                        Ordered: {item.quantity_ordered} | Cost: Rs {parseFloat(item.unit_cost).toFixed(2)}
                      </p>
                    </div>
                    <input
                      type="number"
                      placeholder="Received Qty"
                      value={item.quantity_received || 0}
                      onChange={(e) => {
                        const newItems = [...selectedPO.items];
                        newItems[index].quantity_received = parseInt(e.target.value);
                        setSelectedPO({ ...selectedPO, items: newItems });
                      }}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      min="0"
                      max={item.quantity_ordered}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiveModal(false);
                    setSelectedPO(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}