'use client';

import { useState, useEffect, useRef } from 'react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';

export default function WholesalePage() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stores] = useState([{ id: 1, code: 'MAIN', name: 'Main Store' }]);
  const [selectedStore, setSelectedStore] = useState(stores[0]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [description, setDescription] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const itemInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadInitialData();
    generateBillNumbers();
    setCurrentDate(new Date().toLocaleDateString('en-GB'));
    setTimeout(() => itemInputRef.current?.focus(), 100);

    const handleKeyDown = (e) => {
      if (e.key === 'F8') { e.preventDefault(); handleSave(); }
      if (e.key === 'F9') { e.preventDefault(); handleDelete(); }
      if (e.key === 'F12') { e.preventDefault(); handleCancel(); }
      if (e.key === 'F2') { e.preventDefault(); handlePrint(); }
      if (e.key === 'Escape' && !showDropdown) { handleExit(); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    try {
      const [prodRes, custRes, staffRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers'),
        api.get('/staff').catch(() => ({ data: { staff: [] } }))
      ]);
      setProducts(prodRes.data.products || []);
      setCustomers(custRes.data.customers || []);
      setStaff(staffRes.data.staff || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateBillNumbers = async () => {
    try {
      const response = await api.get('/orders');
      const orders = response.data.orders || [];
      if (orders.length > 0) {
        const lastOrder = orders[0];
        const orderNumber = lastOrder.order_number || 'WS-000000';
        const lastNumber = parseInt(orderNumber.split('-')[1]) || 0;
        setBillNumber(`WS-${String(lastNumber + 1).padStart(6, '0')}`);
        setRefNumber(`WS-${String(lastNumber).padStart(6, '0')}`);
      } else {
        setBillNumber('WS-000001');
        setRefNumber('WS-000000');
      }
    } catch (error) {
      setBillNumber('WS-000001');
      setRefNumber('WS-000000');
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);
    if (value.trim().length === 0) {
      setFilteredProducts([]);
      setShowDropdown(false);
      return;
    }
    const filtered = products.filter(product => {
      const searchLower = value.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.barcode?.toLowerCase().includes(searchLower)
      );
    }).slice(0, 10);
    setFilteredProducts(filtered);
    setShowDropdown(filtered.length > 0);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) {
      if (e.key === 'Enter' && searchTerm.trim()) {
        const exactMatch = products.find(p => 
          p.sku?.toLowerCase() === searchTerm.toLowerCase() || 
          p.barcode?.toLowerCase() === searchTerm.toLowerCase()
        );
        if (exactMatch) selectProduct(exactMatch);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => prev < filteredProducts.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
        selectProduct(filteredProducts[selectedIndex]);
      } else if (filteredProducts.length > 0) {
        selectProduct(filteredProducts[0]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSearchTerm('');
      setSelectedIndex(-1);
    }
  };

  const selectProduct = (product) => {
    addItemToCart(product);
    setSearchTerm('');
    setFilteredProducts([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setTimeout(() => itemInputRef.current?.focus(), 100);
  };

  const addItemToCart = (product) => {
    const existingIndex = orderItems.findIndex(item => item.product_id === product.id);
    if (existingIndex >= 0) {
      const newItems = [...orderItems];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].line_total = newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
      setOrderItems(newItems);
    } else {
      const newItem = {
        product_id: product.id,
        code: product.sku,
        name: product.name,
        batch_no: '',
        quantity: 1,
        unit_price: parseFloat(product.selling_price || 0),
        discount_percentage: 0,
        discount_value: 0,
        line_total: parseFloat(product.selling_price || 0)
      };
      setOrderItems([...orderItems, newItem]);
      setSelectedRow(orderItems.length);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'unit_price' || field === 'discount_percentage') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].unit_price) || 0;
      const discPer = parseFloat(newItems[index].discount_percentage) || 0;
      const subtotal = qty * price;
      const discValue = (subtotal * discPer) / 100;
      newItems[index].discount_value = discValue;
      newItems[index].line_total = subtotal - discValue;
    }
    setOrderItems(newItems);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
    setSelectedRow(null);
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalDiscount = orderItems.reduce((sum, item) => sum + (item.discount_value || 0), 0);
    const netTotal = subtotal - totalDiscount;
    return { subtotal, totalDiscount, netTotal };
  };

  const handleSave = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to the order');
      return;
    }
    try {
      const totals = calculateTotals();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const orderData = {
        customer_id: selectedCustomer?.id || null,
        staff_id: selectedStaff?.id || user.id,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          sku: item.code,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          discount_amount: item.discount_value
        })),
        subtotal: totals.subtotal,
        discount_amount: totals.totalDiscount,
        total_amount: totals.netTotal,
        payment_method: 'cash',
        payment_status: 'paid',
        notes: description || 'Wholesale Sale'
      };
      const response = await api.post('/orders', orderData);
      alert(`✅ Wholesale order saved successfully!\nOrder #: ${response.data.order_number || billNumber}`);
      printReceipt({
        ...orderData,
        order_number: response.data.order_number || billNumber,
        subtotal: totals.subtotal,
        discount_amount: totals.totalDiscount,
        total_amount: totals.netTotal
      });
      handleCancel();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save order: ' + (error.response?.data?.error || error.message));
    }
  };

  const printReceipt = (order) => {
    try {
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);
      const printDocument = printFrame.contentWindow.document;
      printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Wholesale Receipt - ${order.order_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 18px; }
            .info { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .info div { display: flex; justify-content: space-between; margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th { border-bottom: 1px solid #000; text-align: left; padding: 5px 0; }
            td { padding: 5px 0; border-bottom: 1px dotted #ccc; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .totals div { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HARDWARE SHOP</h1>
            <p>WHOLESALE INVOICE</p>
            <p>${selectedStore?.name || 'Main Store'}</p>
          </div>
          <div class="info">
            <div><span>Date:</span><span>${currentDate}</span></div>
            <div><span>Invoice #:</span><span>${order.order_number}</span></div>
            ${selectedCustomer ? `<div><span>Customer:</span><span>${selectedCustomer.first_name} ${selectedCustomer.last_name}</span></div>` : ''}
            ${selectedStaff ? `<div><span>Staff:</span><span>${selectedStaff.first_name} ${selectedStaff.last_name}</span></div>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${item.unit_price.toFixed(2)}</td>
                  <td class="text-right">${(item.unit_price * item.quantity).toFixed(2)}</td>
                </tr>
                ${item.discount_percentage > 0 ? `
                  <tr>
                    <td colspan="4" style="font-size: 10px; color: #666;">
                      Discount ${item.discount_percentage}%: -Rs ${item.discount_amount.toFixed(2)}
                    </td>
                  </tr>
                ` : ''}
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal:</span><span>Rs ${order.subtotal.toFixed(2)}</span></div>
            ${order.discount_amount > 0 ? `<div style="color: #dc2626;"><span>Total Discount:</span><span>Rs ${order.discount_amount.toFixed(2)}</span></div>` : ''}
            <div class="grand-total"><span>NET TOTAL:</span><span>Rs ${order.total_amount.toFixed(2)}</span></div>
          </div>
          <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>Wholesale Department</p>
          </div>
        </body>
        </html>
      `);
      printDocument.close();
      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        setTimeout(() => document.body.removeChild(printFrame), 1000);
      }, 250);
    } catch (error) {
      alert('Failed to print: ' + error.message);
    }
  };

  const handlePrint = () => {
    if (orderItems.length === 0) {
      alert('No items to print');
      return;
    }
    const totals = calculateTotals();
    printReceipt({
      order_number: billNumber,
      items: orderItems.map(item => ({ ...item, discount_amount: item.discount_value })),
      subtotal: totals.subtotal,
      discount_amount: totals.totalDiscount,
      total_amount: totals.netTotal
    });
  };

  const handleDelete = () => {
    if (selectedRow !== null && orderItems[selectedRow]) {
      if (confirm('Delete this item?')) removeItem(selectedRow);
    } else {
      alert('Please select an item to delete');
    }
  };

  const handleCancel = () => {
    if (orderItems.length > 0 && !confirm('Cancel this order? All items will be cleared.')) return;
    setOrderItems([]);
    setSelectedCustomer(null);
    setSelectedStaff(null);
    setDescription('');
    setSelectedRow(null);
    setSearchTerm('');
    setShowDropdown(false);
    generateBillNumbers();
    setTimeout(() => itemInputRef.current?.focus(), 100);
  };

  const handleExit = () => {
    if (orderItems.length > 0 && !confirm('Exit? Unsaved changes will be lost.')) return;
    window.history.back();
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      <div className="lg:ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-[32px] shadow-lg p-10">
            {/* Header Badge */}
            <div className="flex items-center justify-center mb-6">
              {/* <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-semibold">
                WHOLESALE
              </div> */}
            </div>

            <div className="flex justify-end gap-4 mb-8">
              <div className="text-right">
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input type="text" value={currentDate} readOnly className="w-40 px-6 py-3 bg-white border border-gray-300 rounded-full text-center text-sm text-gray-600" />
              </div>
              <div className="text-right">
                <label className="block text-xs text-gray-500 mb-1">Ref Number</label>
                <input type="text" value={refNumber} readOnly className="w-40 px-6 py-3 bg-white border border-gray-300 rounded-full text-center text-sm text-gray-600" />
              </div>
            </div>
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative" ref={dropdownRef}>
                <input ref={itemInputRef} type="text" value={searchTerm} onChange={handleSearchChange} onKeyDown={handleKeyDown} placeholder="Search item by name, SKU, or barcode..." className="w-full px-6 py-3 bg-white border-2 border-purple-400 rounded-full text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200" />
                {showDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-2xl shadow-2xl max-h-80 overflow-y-auto">
                    {filteredProducts.map((product, index) => (
                      <div key={product.id} onClick={() => selectProduct(product)} className={`px-6 py-3 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-purple-100 border-l-4 border-purple-500' : 'hover:bg-gray-50'} ${index !== filteredProducts.length - 1 ? 'border-b border-gray-200' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-1">SKU: {product.sku} {product.barcode && `• Barcode: ${product.barcode}`}</p>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="font-bold text-purple-600">Rs {parseFloat(product.selling_price || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Stock: {product.inventory?.[0]?.quantity || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <select value={selectedStore?.id} onChange={(e) => setSelectedStore(stores.find(s => s.id === parseInt(e.target.value)))} className="px-6 py-3 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:border-purple-400">
                {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
              </select>
              <select value={selectedCustomer?.id || ''} onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value))} className="px-6 py-3 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:border-purple-400">
                <option value="">Customer</option>
                {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.first_name} {customer.last_name}</option>)}
              </select>
            </div>
            <div className="bg-gray-50 rounded-3xl p-5 mb-6">
              <div className="grid grid-cols-12 gap-2 mb-3 px-2">
                <div className="col-span-1 text-xs font-medium text-gray-600">Code</div>
                <div className="col-span-3 text-xs font-medium text-gray-600">Item</div>
                <div className="col-span-2 text-xs font-medium text-gray-600">Batch No.</div>
                <div className="col-span-1 text-xs font-medium text-gray-600 text-right">Price</div>
                <div className="col-span-1 text-xs font-medium text-gray-600 text-center">Qty</div>
                <div className="col-span-1 text-xs font-medium text-gray-600 text-right">Dis%</div>
                <div className="col-span-1 text-xs font-medium text-gray-600 text-right">Dis Val</div>
                <div className="col-span-2 text-xs font-medium text-gray-600 text-right">Net Value</div>
              </div>
              <div className="bg-white rounded-2xl min-h-[250px] max-h-[250px] overflow-y-auto p-3">
                {orderItems.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Start typing to search and add items...</div>
                ) : (
                  <div className="space-y-1">
                    {orderItems.map((item, index) => (
                      <div key={index} onClick={() => setSelectedRow(index)} className={`grid grid-cols-12 gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${selectedRow === index ? 'bg-purple-100 border-2 border-purple-400' : 'hover:bg-gray-50'}`}>
                        <div className="col-span-1 text-sm text-gray-700">{item.code}</div>
                        <div className="col-span-3 text-sm text-gray-700 truncate" title={item.name}>{item.name}</div>
                        <input type="text" value={item.batch_no} onChange={(e) => updateItem(index, 'batch_no', e.target.value)} className="col-span-2 text-sm px-2 bg-transparent focus:outline-none focus:bg-white focus:border focus:border-purple-300 rounded" placeholder="-" />
                        <input type="number" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} className="col-span-1 text-sm text-right px-2 bg-transparent focus:outline-none focus:bg-white focus:border focus:border-purple-300 rounded" step="0.01" />
                        <input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} className="col-span-1 text-sm text-center px-2 bg-transparent focus:outline-none focus:bg-white focus:border focus:border-purple-300 rounded" min="1" />
                        <input type="number" value={item.discount_percentage} onChange={(e) => updateItem(index, 'discount_percentage', parseFloat(e.target.value) || 0)} className="col-span-1 text-sm text-right px-2 bg-transparent focus:outline-none focus:bg-white focus:border focus:border-purple-300 rounded" step="0.01" />
                        <div className="col-span-1 text-sm text-right text-red-600 font-medium px-2">{item.discount_value.toFixed(2)}</div>
                        <div className="col-span-2 text-sm text-right font-semibold px-2">Rs {item.line_total.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full px-6 py-3 bg-white border border-gray-300 rounded-2xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 resize-none" rows="3" />
                <select value={selectedStaff?.id || ''} onChange={(e) => setSelectedStaff(staff.find(s => s.id === e.target.value))} className="w-full px-6 py-3 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:border-purple-400">
                  <option value="">Employee</option>
                  {staff.map(employee => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <div className="px-6 py-3 bg-white border border-gray-300 rounded-full flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Value</span>
                  <span className="text-base font-semibold text-gray-800">Rs {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="px-6 py-3 bg-white border border-gray-300 rounded-full flex justify-between items-center">
                  <span className="text-sm text-gray-600">Item Discount</span>
                  <span className="text-base font-semibold text-red-600">Rs {totals.totalDiscount.toFixed(2)}</span>
                </div>
                <div className="px-6 py-3 bg-white border border-gray-300 rounded-full flex justify-between items-center">
                  <span className="text-sm text-gray-600">Net Total</span>
                  <span className="text-lg font-bold text-gray-900">Rs {totals.netTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <button onClick={handleExit} className="py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-medium text-sm shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 transition-all">&lt; Esc &gt; Exit</button>
              <button onClick={handleSave} className="py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-medium text-sm shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all">&lt; F8 &gt; Save</button>
              <button onClick={handleDelete} className="py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-medium text-sm shadow-md hover:shadow-lg hover:from-yellow-500 hover:to-orange-600 transition-all">&lt; F9 &gt; Delete</button>
              <button onClick={handleCancel} className="py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-50 transition-all">&lt; F12 &gt; Cancel</button>
              <button onClick={handlePrint} className="py-4 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-full font-medium text-sm shadow-md hover:shadow-lg hover:from-purple-500 hover:to-pink-600 transition-all">&lt; F2 &gt; Print</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}