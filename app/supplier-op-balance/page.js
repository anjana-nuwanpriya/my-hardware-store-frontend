'use client';

import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Search, Calendar, Edit2 } from 'lucide-react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';

export default function SupplierOPBalance() {
  const [records, setRecords] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    amount: '',
    balance_date: new Date().toISOString().split('T')[0],
    balance_type: 'payable',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsRes, suppliersRes] = await Promise.all([
        api.get('/opening-balances/supplier'),
        api.get('/suppliers')
      ]);
      setRecords(recordsRes.data.records || recordsRes.data || []);
      setSuppliers(suppliersRes.data.suppliers || suppliersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setRecords([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/opening-balances/supplier', formData);
      loadData();
      closeModal();
    } catch (error) {
      console.error('Error saving balance:', error);
      alert(error.response?.data?.error || 'Failed to save opening balance');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this opening balance?')) return;
    try {
      await api.delete(`/opening-balances/supplier/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting balance:', error);
      alert('Failed to delete opening balance');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      supplier_id: '',
      amount: '',
      balance_date: new Date().toISOString().split('T')[0],
      balance_type: 'payable',
      notes: ''
    });
  };

  const filteredRecords = records.filter(record =>
    `${record.suppliers?.name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.suppliers?.supplier_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayable = filteredRecords
    .filter(r => r.balance_type === 'payable')
    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  const totalAdvance = filteredRecords
    .filter(r => r.balance_type === 'advance')
    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <div className="p-6 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-8 h-8 text-orange-600" />
              Supplier Opening Balance
            </h1>
            <p className="text-gray-600 mt-1">Set initial payables and advances to suppliers (One-time setup)</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Opening Payables</p>
                  <p className="text-3xl font-bold">Rs. {totalPayable.toLocaleString()}</p>
                </div>
                <Wallet className="w-16 h-16 opacity-50" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Advances</p>
                  <p className="text-3xl font-bold">Rs. {totalAdvance.toLocaleString()}</p>
                </div>
                <Wallet className="w-16 h-16 opacity-50" />
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
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="w-5 h-5" />
                Add Opening Balance
              </button>
            </div>
          </div>

          {/* Records Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading balances...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Supplier</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Supplier #</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Notes</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {record.suppliers?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {record.suppliers?.supplier_number || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-orange-600">
                          Rs. {parseFloat(record.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          record.balance_type === 'payable' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {record.balance_type === 'payable' ? 'Payable' : 'Advance'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(record.balance_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {record.notes || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              /* Add edit functionality later */
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
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

              {filteredRecords.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>No opening balances found</p>
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
              Add Supplier Opening Balance
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.supplier_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balance Type *
                </label>
                <select
                  value={formData.balance_type}
                  onChange={(e) => setFormData({ ...formData, balance_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="payable">Payable</option>
                  <option value="advance">Advance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.balance_date}
                  onChange={(e) => setFormData({ ...formData, balance_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows="3"
                />
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
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
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