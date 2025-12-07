'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function SalesWholesaleReturnPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const [formData, setFormData] = useState({
    return_number: '',
    return_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    store_id: '',
    sales_wholesale_id: '',
    return_reason: '',
    refund_method: 'cash',
    description: '',
    employee_id: '',
    items: []
  });

  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [wholesaleSales, setWholesaleSales] = useState([]);

  useEffect(() => {
    fetchReturns();
    fetchDropdowns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/sales-wholesale-return');
      setReturns(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [customersData, storesData, employeesData, wholesaleData] = await Promise.all([
        apiClient.get('/customers'),
        apiClient.get('/stores'),
        apiClient.get('/employees'),
        apiClient.get('/sales-wholesale')
      ]);
      setCustomers(customersData);
      setStores(storesData);
      setEmployees(employeesData);
      setWholesaleSales(wholesaleData);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/sales-wholesale-return', formData);
      setShowForm(false);
      setFormData({
        return_number: '',
        return_date: new Date().toISOString().split('T')[0],
        customer_id: '',
        store_id: '',
        sales_wholesale_id: '',
        return_reason: '',
        refund_method: 'cash',
        description: '',
        employee_id: '',
        items: []
      });
      fetchReturns();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleView = async (id) => {
    try {
      const data = await apiClient.get(`/sales-wholesale-return/${id}`);
      setSelectedReturn(data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Wholesale Sales Returns</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'New Return'}
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Return Number"
              value={formData.return_number}
              onChange={(e) => setFormData({...formData, return_number: e.target.value})}
              className="border p-2 rounded"
              required
            />
            <input
              type="date"
              value={formData.return_date}
              onChange={(e) => setFormData({...formData, return_date: e.target.value})}
              className="border p-2 rounded"
              required
            />
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Customer</option>
              {customers.filter(c => c.type === 'wholesale').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={formData.store_id}
              onChange={(e) => setFormData({...formData, store_id: e.target.value})}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Store</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              value={formData.return_reason}
              onChange={(e) => setFormData({...formData, return_reason: e.target.value})}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Return Reason</option>
              <option value="Defective">Defective</option>
              <option value="Expired">Expired</option>
              <option value="Wrong Item">Wrong Item</option>
              <option value="Damaged">Damaged</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={formData.refund_method}
              onChange={(e) => setFormData({...formData, refund_method: e.target.value})}
              className="border p-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
              <option value="cheque">Cheque</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
              className="border p-2 rounded"
            >
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="border p-2 rounded w-full mb-4"
            rows="3"
          />
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Save Return
          </button>
        </form>
      )}

      {selectedReturn && (
        <div className="bg-white p-6 rounded shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Return Details: {selectedReturn.return.return_number}</h2>
            <button onClick={() => setSelectedReturn(null)} className="text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <p><strong>Return Date:</strong> {selectedReturn.return.return_date}</p>
            <p><strong>Customer:</strong> {selectedReturn.return.customer_name}</p>
            <p><strong>Store:</strong> {selectedReturn.return.store_name}</p>
            <p><strong>Return Reason:</strong> {selectedReturn.return.return_reason}</p>
            <p><strong>Refund Method:</strong> {selectedReturn.return.refund_method}</p>
          </div>
          <h3 className="font-bold mb-2">Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Batch No</th>
                  <th className="p-2 text-right">Original Qty</th>
                  <th className="p-2 text-right">Return Qty</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">Refund Value</th>
                </tr>
              </thead>
              <tbody>
                {selectedReturn.items.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{item.item_name}</td>
                    <td className="p-2">{item.batch_no}</td>
                    <td className="p-2 text-right">{item.original_qty}</td>
                    <td className="p-2 text-right">{item.return_qty}</td>
                    <td className="p-2 text-right">{item.unit_price}</td>
                    <td className="p-2 text-right">{item.refund_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Return #</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Store</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Refund Method</th>
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {returns.map(ret => (
              <tr key={ret.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{ret.return_number}</td>
                <td className="p-3">{ret.return_date}</td>
                <td className="p-3">{ret.customer_name}</td>
                <td className="p-3">{ret.store_name}</td>
                <td className="p-3">{ret.return_reason}</td>
                <td className="p-3">{ret.refund_method}</td>
                <td className="p-3">{ret.employee_name}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleView(ret.id)}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}