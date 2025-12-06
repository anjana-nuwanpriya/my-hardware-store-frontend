'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, Search, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';

export default function BankEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    store_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    entry_type: 'deposit',
    amount: '',
    bank_account: '',
    description: '',
    reference_no: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesRes, storesRes] = await Promise.all([
        api.get('/financial/bank-entries'),
        api.get('/stores')
      ]);
      setEntries(entriesRes.data.entries || []);
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
      await api.post('/financial/bank-entries', formData);
      loadData();
      closeModal();
      alert('Bank entry recorded successfully!');
    } catch (error) {
      console.error('Error saving entry:', error);
      alert(error.response?.data?.error || 'Failed to save bank entry');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      await api.delete(`/financial/bank-entries/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      store_id: '',
      entry_date: new Date().toISOString().split('T')[0],
      entry_type: 'deposit',
      amount: '',
      bank_account: '',
      description: '',
      reference_no: ''
    });
  };

  const filteredEntries = entries.filter(entry =>
    entry.entry_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.bank_account?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDeposits = filteredEntries
    .filter(e => e.entry_type === 'deposit')
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const totalWithdrawals = filteredEntries
    .filter(e => e.entry_type === 'withdrawal')
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const netBalance = totalDeposits - totalWithdrawals;

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <div className="p-6 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              Bank Entries
            </h1>
            <p className="text-gray-600 mt-1">Track bank deposits, withdrawals, and transfers</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Deposits</p>
                  <p className="text-2xl font-bold">Rs. {totalDeposits.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Total Withdrawals</p>
                  <p className="text-2xl font-bold">Rs. {totalWithdrawals.toLocaleString()}</p>
                </div>
                <TrendingDown className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Net Balance</p>
                  <p className="text-2xl font-bold">Rs. {netBalance.toLocaleString()}</p>
                </div>
                <Building2 className="w-12 h-12 opacity-50" />
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
                    placeholder="Search bank entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Entry
              </button>
            </div>
          </div>

          {/* Entries Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading entries...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Entry #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Store</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Bank Account</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reference</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-blue-600">{entry.entry_number}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {entry.stores?.store_name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {entry.entry_type === 'deposit' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                            <TrendingUp className="w-3 h-3" />
                            Deposit
                          </span>
                        ) : entry.entry_type === 'withdrawal' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
                            <TrendingDown className="w-3 h-3" />
                            Withdrawal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                            Transfer
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                        {entry.bank_account}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {entry.description}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {entry.reference_no || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${
                          entry.entry_type === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.entry_type === 'deposit' ? '+' : '-'} Rs. {parseFloat(entry.amount).toLocaleString()}
                        </span>
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
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>No bank entries found</p>
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
              Add Bank Entry
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Type *
                </label>
                <select
                  value={formData.entry_type}
                  onChange={(e) => setFormData({ ...formData, entry_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="deposit">Deposit (Money In)</option>
                  <option value="withdrawal">Withdrawal (Money Out)</option>
                  <option value="transfer">Transfer</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account *
                </label>
                <input
                  type="text"
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  placeholder="e.g., BOC - 123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Daily sales deposit, Supplier payment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  placeholder="Transaction ID, Cheque number, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}