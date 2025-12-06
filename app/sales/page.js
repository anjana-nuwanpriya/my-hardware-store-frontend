'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import EnhancedNavigation from '@/components/EnhancedNavigation';

export default function SalesRetailPage() {
  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    customer_id: '',
    store_id: '',
    description: '',
    employee_id: '',
    payment_method: 'cash',
    payment_status: 'paid'
  });

  const [items, setItems] = useState([
    { 
      item_id: '', 
      code: '', 
      item_name: '', 
      batch_no: '', 
      quantity: '', 
      unit_price: '', 
      discount_percent: '0', 
      discount_value: '0', 
      net_value: '0',
      current_stock: '0'
    }
  ]);

  const [dropdowns, setDropdowns] = useState({
    allItems: [],
    stores: [],
    customers: [],
    employees: []
  });

  const [totals, setTotals] = useState({
    total_value: 0,
    item_discount: 0,
    net_total: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropdowns();
    fetchNextInvoiceNumber();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [items]);

  const fetchDropdowns = async () => {
    try {
      const [itemsRes, storesRes, customersRes, employeesRes] = await Promise.all([
        api.get('/items'),
        api.get('/stores'),
        api.get('/customers'),
        api.get('/employees')
      ]);

      setDropdowns({
        allItems: itemsRes.data.items || [],
        stores: storesRes.data.stores || [],
        customers: customersRes.data.customers || [],
        employees: employeesRes.data.employees || []
      });
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  const fetchNextInvoiceNumber = async () => {
    try {
      const res = await api.get('/sales-retail/next/invoice-number');
      setFormData(prev => ({ ...prev, invoice_number: res.data.invoiceNumber }));
    } catch (error) {
      console.error('Error fetching invoice number:', error);
    }
  };

  const handleItemSelect = (index, itemId) => {
    const selectedItem = dropdowns.allItems.find(i => i.id === itemId);
    if (selectedItem) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        item_id: selectedItem.id,
        code: selectedItem.code,
        item_name: selectedItem.name,
        unit_price: selectedItem.retail_price || '0',
        current_stock: selectedItem.stock_quantity || '0'
      };
      setItems(newItems);
      calculateLineTotal(index, newItems);
    }
  };

  const handleQuantityChange = (index, quantity) => {
    const newItems = [...items];
    const currentStock = parseFloat(newItems[index].current_stock || 0);
    
    if (parseFloat(quantity) > currentStock) {
      alert(`Insufficient stock! Available: ${currentStock}`);
      return;
    }
    
    newItems[index].quantity = quantity;
    setItems(newItems);
    calculateLineTotal(index, newItems);
  };

  const handleDiscountPercentChange = (index, percent) => {
    const newItems = [...items];
    newItems[index].discount_percent = percent;
    
    const gross = parseFloat(newItems[index].quantity || 0) * parseFloat(newItems[index].unit_price || 0);
    const discountValue = gross * (parseFloat(percent || 0) / 100);
    
    newItems[index].discount_value = discountValue.toFixed(2);
    newItems[index].net_value = (gross - discountValue).toFixed(2);
    
    setItems(newItems);
  };

  const handleDiscountValueChange = (index, value) => {
    const newItems = [...items];
    newItems[index].discount_value = value;
    
    const gross = parseFloat(newItems[index].quantity || 0) * parseFloat(newItems[index].unit_price || 0);
    const discountPercent = gross > 0 ? (parseFloat(value || 0) / gross) * 100 : 0;
    
    newItems[index].discount_percent = discountPercent.toFixed(2);
    newItems[index].net_value = (gross - parseFloat(value || 0)).toFixed(2);
    
    setItems(newItems);
  };

  const calculateLineTotal = (index, itemsArray) => {
    const item = itemsArray[index];
    const gross = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
    const discountValue = gross * (parseFloat(item.discount_percent || 0) / 100);
    
    itemsArray[index].discount_value = discountValue.toFixed(2);
    itemsArray[index].net_value = (gross - discountValue).toFixed(2);
  };

  const calculateTotals = () => {
    const total_value = items.reduce((sum, item) => {
      const gross = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
      return sum + gross;
    }, 0);

    const item_discount = items.reduce((sum, item) => 
      sum + parseFloat(item.discount_value || 0), 0
    );

    const net_total = items.reduce((sum, item) => 
      sum + parseFloat(item.net_value || 0), 0
    );

    setTotals({ total_value, item_discount, net_total });
  };

  const addRow = () => {
    setItems([...items, { 
      item_id: '', 
      code: '', 
      item_name: '', 
      batch_no: '', 
      quantity: '', 
      unit_price: '', 
      discount_percent: '0', 
      discount_value: '0', 
      net_value: '0',
      current_stock: '0'
    }]);
  };

  const removeRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.store_id) {
        alert('Please select a store');
        return;
      }

      const validItems = items.filter(item => item.item_id && parseFloat(item.quantity) > 0);
      if (validItems.length === 0) {
        alert('Please add at least one item');
        return;
      }

      // Validate stock for all items
      for (const item of validItems) {
        if (parseFloat(item.quantity) > parseFloat(item.current_stock)) {
          alert(`Insufficient stock for ${item.item_name}! Available: ${item.current_stock}`);
          return;
        }
      }

      setLoading(true);

      await api.post('/sales-retail', {
        ...formData,
        items: validItems
      });

      alert('Sale created successfully!');
      resetForm();
      fetchNextInvoiceNumber();
    } catch (error) {
      console.error('Error saving:', error);
      alert(error.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sale_date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      customer_id: '',
      store_id: '',
      description: '',
      employee_id: '',
      payment_method: 'cash',
      payment_status: 'paid'
    });
    setItems([{ 
      item_id: '', 
      code: '', 
      item_name: '', 
      batch_no: '', 
      quantity: '', 
      unit_price: '', 
      discount_percent: '0', 
      discount_value: '0', 
      net_value: '0',
      current_stock: '0'
    }]);
  };

  const filteredItems = dropdowns.allItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <EnhancedNavigation />
      <div className="min-h-screen bg-gray-100 p-4 lg:ml-64">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Sales - Retail</h1>
            <div className="flex gap-4">
              <input
                type="date"
                value={formData.sale_date}
                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={formData.invoice_number}
                readOnly
                className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                placeholder="Invoice Number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Walk-in Customer</option>
              {dropdowns.customers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>

            <select
              value={formData.store_id}
              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">From Store *</option>
              {dropdowns.stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>

            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="credit">Credit</option>
            </select>

            <select
              value={formData.payment_status}
              onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Not Paid</option>
            </select>
          </div>

          <div className="overflow-x-auto mb-6 bg-gray-50 rounded-lg p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Code</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Item</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Stock</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Batch No</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Price</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Qty</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Dis%</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Dis Val</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-600">Net Value</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-2">
                      <input type="text" value={item.code} readOnly className="w-20 px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm" />
                    </td>
                    <td className="p-2">
                      <select value={item.item_id} onChange={(e) => handleItemSelect(index, e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Item</option>
                        {filteredItems.map(itm => (
                          <option key={itm.id} value={itm.id}>{itm.name} ({itm.code})</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input type="text" value={item.current_stock} readOnly className="w-16 px-2 py-1 border border-gray-300 rounded bg-blue-50 text-sm text-center font-semibold" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={item.batch_no} onChange={(e) => { const newItems = [...items]; newItems[index].batch_no = e.target.value; setItems(newItems); }} className="w-24 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Batch" />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.01" value={item.unit_price} readOnly className="w-24 px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm" />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.01" value={item.quantity} onChange={(e) => handleQuantityChange(index, e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0" />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.01" value={item.discount_percent} onChange={(e) => handleDiscountPercentChange(index, e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0" />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.01" value={item.discount_value} onChange={(e) => handleDiscountValueChange(index, e.target.value)} className="w-24 px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0.00" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={item.net_value} readOnly className="w-28 px-2 py-1 border border-gray-300 rounded bg-green-50 text-sm font-semibold" />
                    </td>
                    <td className="p-2">
                      <button onClick={() => removeRow(index)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button onClick={addRow} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              <Plus className="w-4 h-4" />Add Row
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              
              <select value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Employee (Optional)</option>
                {dropdowns.employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <input type="text" value={`Total Value: LKR ${totals.total_value.toFixed(2)}`} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-semibold" />
              <input type="text" value={`Item Discount: LKR ${totals.item_discount.toFixed(2)}`} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-semibold" />
              <input type="text" value={`Net Total: LKR ${totals.net_total.toFixed(2)}`} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-green-50 font-bold text-green-700 text-lg" />
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={() => window.history.back()} className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">&lt; Esc &gt; Exit</button>
            <button onClick={handleSave} disabled={loading} className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:bg-gray-400">{loading ? 'Saving...' : '< F8 > Save'}</button>
            <button onClick={resetForm} className="px-8 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium">&lt; F9 &gt; Delete</button>
            <button onClick={resetForm} className="px-8 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium">&lt; F12 &gt; Cancel</button>
            <button className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">&lt; F2 &gt; Print</button>
          </div>
        </div>
      </div>
    </>
  );
}