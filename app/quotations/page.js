'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const [formData, setFormData] = useState({
    quotation_number: '',
    quotation_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    store_id: '',
    valid_until: '',
    terms_conditions: '',
    notes: '',
    employee_id: '',
    items: []
  });

  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchQuotations();
    fetchDropdowns();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/quotations');
      setQuotations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [customersData, storesData, employeesData, itemsData] = await Promise.all([
        apiClient.get('/customers'),
        apiClient.get('/stores'),
        apiClient.get('/employees'),
        apiClient.get('/items')
      ]);
      setCustomers(customersData);
      setStores(storesData);
      setEmployees(employeesData);
      setItems(itemsData);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/quotations', formData);
      setShowForm(false);
      setFormData({
        quotation_number: '',
        quotation_date: new Date().toISOString().split('T')[0],
        customer_id: '',
        store_id: '',
        valid_until: '',
        terms_conditions: '',
        notes: '',
        employee_id: '',
        items: []
      });
      fetchQuotations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleView = async (id) => {
    try {
      const data = await apiClient.get(`/quotations/${id}`);
      setSelectedQuotation(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await apiClient.delete(`/quotations/${id}`);
        fetchQuotations();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quotations</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'New Quotation'}
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Quotation Number"
              value={formData.quotation_number}
              onChange={(e) => setFormData({...formData, quotation_number: e.target.value})}
              className="border p-2 rounded"
              required
            />
            <input
              type="date"
              value={formData.quotation_date}
              onChange={(e) => setFormData({...formData, quotation_date: e.target.value})}
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
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            <input
              type="date"
              placeholder="Valid Until"
              value={formData.valid_until}
              onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
              className="border p-2 rounded"
              required
            />
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
            placeholder="Terms & Conditions"
            value={formData.terms_conditions}
            onChange={(e) => setFormData({...formData, terms_conditions: e.target.value})}
            className="border p-2 rounded w-full mb-4"
            rows="2"
          />
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="border p-2 rounded w-full mb-4"
            rows="2"
          />
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Save Quotation
          </button>
        </form>
      )}

      {selectedQuotation && (
        <div className="bg-white p-6 rounded shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Quotation: {selectedQuotation.quotation.quotation_number}</h2>
            <button onClick={() => setSelectedQuotation(null)} className="text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <p><strong>Date:</strong> {selectedQuotation.quotation.quotation_date}</p>
            <p><strong>Valid Until:</strong> {selectedQuotation.quotation.valid_until}</p>
            <p><strong>Customer:</strong> {selectedQuotation.quotation.customer_name}</p>
            <p><strong>Store:</strong> {selectedQuotation.quotation.store_name}</p>
            <p><strong>Employee:</strong> {selectedQuotation.quotation.employee_name}</p>
          </div>
          {selectedQuotation.quotation.terms_conditions && (
            <div className="mb-4">
              <p><strong>Terms & Conditions:</strong></p>
              <p className="text-sm text-gray-600">{selectedQuotation.quotation.terms_conditions}</p>
            </div>
          )}
          <h3 className="font-bold mb-2">Quoted Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Batch No</th>
                  <th className="p-2 text-right">Quantity</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">Discount %</th>
                  <th className="p-2 text-right">Net Value</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuotation.items.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{item.item_name}</td>
                    <td className="p-2">{item.batch_no}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">{item.unit_price}</td>
                    <td className="p-2 text-right">{item.discount_percent}%</td>
                    <td className="p-2 text-right font-semibold">{item.net_value}</td>
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
              <th className="p-3 text-left">Quotation #</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Store</th>
              <th className="p-3 text-left">Valid Until</th>
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{q.quotation_number}</td>
                <td className="p-3">{q.quotation_date}</td>
                <td className="p-3">{q.customer_name}</td>
                <td className="p-3">{q.store_name}</td>
                <td className="p-3">{q.valid_until}</td>
                <td className="p-3">{q.employee_name}</td>
                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => handleView(q.id)}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
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