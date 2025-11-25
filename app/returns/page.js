'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Plus, Trash2, Search, Package } from 'lucide-react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';

export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    original_order_id: '',
    customer_id: '',
    reason: '',
    condition: 'good',
    items: [],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [returnsRes, ordersRes, customersRes] = await Promise.all([
        api.get('/returns'),
        api.get('/orders'),
        api.get('/customers')
      ]);
      setReturns(returnsRes.data.returns || []);
      setOrders(ordersRes.data.orders || []);
      setCustomers(customersRes.data.customers || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrder(response.data);
      setFormData({
        ...formData,
        original_order_id: orderId,
        customer_id: response.data.customer_id,
        items: response.data.items.map(item => ({
          ...item,
          return_quantity: 0
        }))
      });
    } catch (error) {
      console.error('Error loading order:', error);
    }
  };

  const updateReturnQuantity = (index, quantity) => {
    const newItems = [...formData.items];
    newItems[index].return_quantity = parseInt(quantity);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const itemsToReturn = formData.items
        .filter(item => item.return_quantity > 0)
        .map(item => ({
          product_id: item.product_id,
          quantity: item.return_quantity,
          unit_price: item.unit_price
        }));

      if (itemsToReturn.length === 0) {
        alert('Please select at least one item to return');
        return;
      }

      await api.post('/returns', {
        original_order_id: formData.original_order_id,
        customer_id: formData.customer_id,
        staff_id: user.id,
        reason: formData.reason,
        condition: formData.condition,
        items: itemsToReturn,
        notes: formData.notes
      });

      loadData();
      closeModal();
      alert('Return created successfully');
    } catch (error) {
      console.error('Error creating return:', error);
      alert('Failed to create return: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/returns/${id}/status`, { status });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this return?')) return;
    try {
      await api.delete(`/returns/${id}`);
      loadData();
      alert('Return deleted successfully');
    } catch (error) {
      console.error('Error deleting return:', error);
      alert('Failed to delete return');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setFormData({
      original_order_id: '',
      customer_id: '',
      reason: '',
      condition: 'good',
      items: [],
      notes: ''
    });
  };

  const filteredReturns = returns.filter(ret =>
    ret.return_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.customers?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.customers?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateRefundAmount = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price || 0) * parseInt(item.return_quantity || 0));
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
              <RotateCcw className="w-8 h-8 text-blue-600" />
              Returns Management
            </h1>
            <p className="text-gray-600 mt-1">Handle product returns and refunds</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Returns</p>
                  <p className="text-2xl font-bold text-gray-900">{returns.length}</p>
                </div>
                <RotateCcw className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {returns.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <Package className="w-12 h-12 text-orange-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Refunds</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rs {returns.reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0).toFixed(2)}
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
                    placeholder="Search returns..."
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
                New Return
              </button>
            </div>
          </div>

          {/* Returns Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading returns...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Return #</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order #</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reason</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Refund</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReturns.map((returnItem) => (
                      <tr key={returnItem.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{returnItem.return_number}</td>
                        <td className="py-3 px-4">
                          {returnItem.customers 
                            ? `${returnItem.customers.first_name} ${returnItem.customers.last_name}`
                            : 'N/A'
                          }
                        </td>
                        <td className="py-3 px-4 text-sm">{returnItem.orders?.order_number || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(returnItem.return_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm capitalize">{returnItem.reason}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          Rs {parseFloat(returnItem.refund_amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={returnItem.status}
                            onChange={(e) => handleUpdateStatus(returnItem.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                              returnItem.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                              returnItem.status === 'approved' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDelete(returnItem.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredReturns.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <RotateCcw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>No returns found</p>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Return</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Order *
                  </label>
                  <select
                    value={formData.original_order_id}
                    onChange={(e) => loadOrderDetails(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Order</option>
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        {order.order_number} - Rs {parseFloat(order.total_amount || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Reason *
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Reason</option>
                    <option value="defective">Defective Product</option>
                    <option value="wrong_item">Wrong Item Received</option>
                    <option value="not_needed">No Longer Needed</option>
                    <option value="damaged">Damaged During Shipping</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Condition *
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="new">New / Unused</option>
                    <option value="good">Good Condition</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              {selectedOrder && formData.items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Items to Return *
                  </label>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.products?.name || 'Product'}</p>
                          <p className="text-sm text-gray-600">
                            Ordered Qty: {item.quantity} | Unit Price: Rs {parseFloat(item.unit_price || 0).toFixed(2)}
                          </p>
                        </div>
                        <input
                          type="number"
                          placeholder="Return Qty"
                          value={item.return_quantity}
                          onChange={(e) => updateReturnQuantity(index, e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          min="0"
                          max={item.quantity}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder && formData.items.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>No items found in this order</p>
                </div>
              )}

              {!selectedOrder && (
                <div className="text-center py-4 text-gray-500">
                  <p>Please select an order to see items</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows="3"
                  placeholder="Add any additional information about this return..."
                />
              </div>

              {/* Refund Amount Display */}
              {selectedOrder && calculateRefundAmount() > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Estimated Refund Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      Rs {calculateRefundAmount().toFixed(2)}
                    </span>
                  </div>
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedOrder || formData.items.every(item => item.return_quantity === 0)}
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