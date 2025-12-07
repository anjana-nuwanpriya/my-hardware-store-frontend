'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function StockAdjustmentPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [adjItems, setAdjItems] = useState([]);

  const [formData, setFormData] = useState({
    adjustment_number: '',
    adjustment_date: new Date().toISOString().split('T')[0],
    store_id: '',
    adjustment_type: 'addition',
    description: '',
    employee_id: ''
  });

  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchAdjustments();
    fetchDropdowns();
  }, []);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/stock-adjustment');
      setAdjustments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load adjustments');
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [storesData, employeesData, itemsData] = await Promise.all([
        apiClient.get('/stores'),
        apiClient.get('/employees'),
        apiClient.get('/items')
      ]);
      setStores(Array.isArray(storesData) ? storesData : []);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  const addItem = () => {
    setAdjItems([...adjItems, {
      item_id: '',
      batch_no: '',
      current_stock: 0,
      adjustment_qty: 0,
      reason: '',
      remarks: ''
    }]);
  };

  const removeItem = (index) => {
    setAdjItems(adjItems.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...adjItems];
    updated[index][field] = value;
    setAdjItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (adjItems.length === 0) {
      setError('Please add at least one item to the adjustment');
      return;
    }

    try {
      await apiClient.post('/stock-adjustment', {
        ...formData,
        items: adjItems
      });
      setShowForm(false);
      setAdjItems([]);
      setFormData({
        adjustment_number: '',
        adjustment_date: new Date().toISOString().split('T')[0],
        store_id: '',
        adjustment_type: 'addition',
        description: '',
        employee_id: ''
      });
      setError(null);
      fetchAdjustments();
    } catch (err) {
      setError(err.message || 'Failed to save adjustment');
    }
  };

  const handleView = async (id) => {
    try {
      const data = await apiClient.get(`/stock-adjustment/${id}`);
      setSelectedAdjustment(data.adjustment);
      setAdjItems(data.items || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this adjustment?')) {
      try {
        await apiClient.delete(`/stock-adjustment/${id}`);
        fetchAdjustments();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'addition': 'bg-green-100 text-green-800',
      'deduction': 'bg-red-100 text-red-800',
      'damaged': 'bg-orange-100 text-orange-800',
      'loss': 'bg-pink-100 text-pink-800',
      'count_diff': 'bg-blue-100 text-blue-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center">
      <div className="text-lg text-gray-600">Loading adjustments...</div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Stock Adjustments</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setAdjItems([]);
            setError(null);
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {showForm ? 'Cancel' : '+ New Adjustment'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
          <svg className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Create New Adjustment</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Number *</label>
                <input
                  type="text"
                  value={formData.adjustment_number}
                  onChange={(e) => setFormData({...formData, adjustment_number: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Date *</label>
                <input
                  type="date"
                  value={formData.adjustment_date}
                  onChange={(e) => setFormData({...formData, adjustment_date: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store *</label>
                <select
                  value={formData.store_id}
                  onChange={(e) => setFormData({...formData, store_id: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Store</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type *</label>
                <select
                  value={formData.adjustment_type}
                  onChange={(e) => setFormData({...formData, adjustment_type: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="addition">Addition</option>
                  <option value="deduction">Deduction</option>
                  <option value="damaged">Damaged</option>
                  <option value="loss">Loss</option>
                  <option value="count_diff">Count Difference</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  + Add Item
                </button>
              </div>

              {adjItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No items added. Click "Add Item" to start.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-300">
                      <tr>
                        <th className="p-3 text-left">Item</th>
                        <th className="p-3 text-left">Batch No</th>
                        <th className="p-3 text-right">Current Stock</th>
                        <th className="p-3 text-right">Adjustment Qty</th>
                        <th className="p-3 text-left">Reason</th>
                        <th className="p-3 text-left">Remarks</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3">
                            <select
                              value={item.item_id}
                              onChange={(e) => updateItem(idx, 'item_id', e.target.value)}
                              className="w-full border border-gray-300 p-1 rounded text-sm"
                            >
                              <option value="">Select Item</option>
                              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                            </select>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.batch_no}
                              onChange={(e) => updateItem(idx, 'batch_no', e.target.value)}
                              className="w-full border border-gray-300 p-1 rounded text-sm"
                              placeholder="Batch No"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={item.current_stock}
                              onChange={(e) => updateItem(idx, 'current_stock', e.target.value)}
                              className="w-full border border-gray-300 p-1 rounded text-sm text-right"
                              step="0.01"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={item.adjustment_qty}
                              onChange={(e) => updateItem(idx, 'adjustment_qty', e.target.value)}
                              className="w-full border border-gray-300 p-1 rounded text-sm text-right"
                              step="0.01"
                              required
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.reason}
                              onChange={(e) => updateItem(idx, 'reason', e.target.value)}
                              className="w-full border border-gray-300 p-1 rounded text-sm"
                              placeholder="Reason"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.remarks}
                              onChange={(e) => updateItem(idx, 'remarks', e.target.value)}
                              className="w-full border border-gray-300 p-1 rounded text-sm"
                              placeholder="Remarks"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Save Adjustment
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setAdjItems([]);
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedAdjustment && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Adjustment Details: {selectedAdjustment.adjustment_number}</h2>
            <button onClick={() => setSelectedAdjustment(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Adjustment Date</p>
              <p className="font-semibold text-gray-900">{selectedAdjustment.adjustment_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Store</p>
              <p className="font-semibold text-gray-900">{selectedAdjustment.store_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p><span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(selectedAdjustment.adjustment_type)}`}>{selectedAdjustment.adjustment_type}</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Employee</p>
              <p className="font-semibold text-gray-900">{selectedAdjustment.employee_name || '-'}</p>
            </div>
          </div>

          <h3 className="font-bold mb-3 text-gray-900">Adjusted Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-left">Batch No</th>
                  <th className="p-3 text-right">Current Stock</th>
                  <th className="p-3 text-right">Adjustment Qty</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {adjItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3">{item.item_name}</td>
                    <td className="p-3">{item.batch_no || '-'}</td>
                    <td className="p-3 text-right">{item.current_stock}</td>
                    <td className="p-3 text-right font-semibold">{item.adjustment_qty}</td>
                    <td className="p-3">{item.reason || '-'}</td>
                    <td className="p-3">{item.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-900">Adjustment #</th>
                <th className="p-4 text-left font-semibold text-gray-900">Date</th>
                <th className="p-4 text-left font-semibold text-gray-900">Store</th>
                <th className="p-4 text-left font-semibold text-gray-900">Type</th>
                <th className="p-4 text-left font-semibold text-gray-900">Employee</th>
                <th className="p-4 text-center font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No adjustments found. Create your first adjustment to get started.
                  </td>
                </tr>
              ) : (
                adjustments.map(adj => (
                  <tr key={adj.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-900">{adj.adjustment_number}</td>
                    <td className="p-4 text-gray-700">{adj.adjustment_date}</td>
                    <td className="p-4 text-gray-700">{adj.store_name}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(adj.adjustment_type)}`}>
                        {adj.adjustment_type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">{adj.employee_name || '-'}</td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleView(adj.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(adj.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}