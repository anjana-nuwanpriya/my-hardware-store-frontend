'use client';

import { useState, useEffect } from 'react';

export default function PurchaseGRN() {
  const [records, setRecords] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    grn_number: '',
    grn_date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    store_id: '',
    invoice_number: '',
    invoice_date: '',
    description: '',
    items: [{ item_id: '', ordered_qty: '', received_qty: '', cost_price: '', batch_no: '', discount_percent: 0, discount_value: 0, net_value: 0 }]
  });

  useEffect(() => {
    fetchRecords();
    fetchSuppliers();
    fetchStores();
    fetchItems();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/purchase-grn');
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/suppliers');
      setSuppliers(await res.json());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/stores');
      setStores(await res.json());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/items');
      setItems(await res.json());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Calculate net value
    if (field === 'received_qty' || field === 'cost_price' || field === 'discount_percent') {
      const qty = parseFloat(newItems[index].received_qty) || 0;
      const price = parseFloat(newItems[index].cost_price) || 0;
      const discountPercent = parseFloat(newItems[index].discount_percent) || 0;
      const subtotal = qty * price;
      const discountValue = (subtotal * discountPercent) / 100;
      newItems[index].discount_value = discountValue.toFixed(2);
      newItems[index].net_value = (subtotal - discountValue).toFixed(2);
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/purchase-grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchRecords();
        setShowForm(false);
        setFormData({
          grn_number: '',
          grn_date: new Date().toISOString().split('T')[0],
          supplier_id: '',
          store_id: '',
          invoice_number: '',
          invoice_date: '',
          description: '',
          items: [{ item_id: '', ordered_qty: '', received_qty: '', cost_price: '', batch_no: '', discount_percent: 0, discount_value: 0, net_value: 0 }]
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase GRN (Goods Received Note)</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create GRN'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="GRN Number"
              value={formData.grn_number}
              onChange={(e) => setFormData({ ...formData, grn_number: e.target.value })}
              className="px-3 py-2 border rounded"
              required
            />
            <input
              type="date"
              value={formData.grn_date}
              onChange={(e) => setFormData({ ...formData, grn_date: e.target.value })}
              className="px-3 py-2 border rounded"
              required
            />
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="px-3 py-2 border rounded"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={formData.store_id}
              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              className="px-3 py-2 border rounded"
              required
            >
              <option value="">Select Store</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input type="text" placeholder="Invoice Number" value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} className="px-3 py-2 border rounded" />
            <input type="date" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} className="px-3 py-2 border rounded" />
            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="px-3 py-2 border rounded col-span-2" />
          </div>

          <h3 className="text-lg font-bold mb-3">Items</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left">Item</th>
                  <th className="px-2 py-2 text-center">Ordered Qty</th>
                  <th className="px-2 py-2 text-center">Received Qty</th>
                  <th className="px-2 py-2 text-center">Cost Price</th>
                  <th className="px-2 py-2 text-left">Batch No</th>
                  <th className="px-2 py-2 text-center">Discount %</th>
                  <th className="px-2 py-2 text-right">Net Value</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-2 py-2"><select value={item.item_id} onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)} className="w-full px-2 py-1 border rounded text-sm"><option value="">Select Item</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></td>
                    <td className="px-2 py-2"><input type="number" value={item.ordered_qty} onChange={(e) => handleItemChange(idx, 'ordered_qty', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></td>
                    <td className="px-2 py-2"><input type="number" value={item.received_qty} onChange={(e) => handleItemChange(idx, 'received_qty', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" required /></td>
                    <td className="px-2 py-2"><input type="number" value={item.cost_price} onChange={(e) => handleItemChange(idx, 'cost_price', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" step="0.01" required /></td>
                    <td className="px-2 py-2"><input type="text" value={item.batch_no} onChange={(e) => handleItemChange(idx, 'batch_no', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></td>
                    <td className="px-2 py-2"><input type="number" value={item.discount_percent} onChange={(e) => handleItemChange(idx, 'discount_percent', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" step="0.01" /></td>
                    <td className="px-2 py-2 text-right">{item.net_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, items: [...formData.items, { item_id: '', ordered_qty: '', received_qty: '', cost_price: '', batch_no: '', discount_percent: 0, discount_value: 0, net_value: 0 }] })}
            className="mb-4 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            + Add Item
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create GRN
          </button>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">GRN #</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">Store</th>
              <th className="px-4 py-3 text-left">Invoice</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-bold">{record.grn_number}</td>
                <td className="px-4 py-3">{new Date(record.grn_date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{record.supplier_name}</td>
                <td className="px-4 py-3">{record.store_name}</td>
                <td className="px-4 py-3">{record.invoice_number || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-white text-xs ${record.payment_status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    {record.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="text-blue-600 hover:text-blue-800 mr-2 text-xs">View</button>
                  <button className="text-red-600 hover:text-red-800 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
