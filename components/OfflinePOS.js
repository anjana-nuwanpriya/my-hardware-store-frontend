'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Wifi, WifiOff, Printer, User, X } from 'lucide-react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';
import offlineStorage from '@/lib/offlineStorage';

export default function OfflinePOS() {
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Cash payment modal states
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);
  const cashInputRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    // Initialize offline storage
    offlineStorage.init();
    
    // Load pending orders count
    loadPendingOrders();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 1) {
        await searchProducts();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus cash input when modal opens
  useEffect(() => {
    if (showCashModal && cashInputRef.current) {
      cashInputRef.current.focus();
    }
  }, [showCashModal]);

  // Calculate change when cash received changes
  useEffect(() => {
    if (cart.length > 0) {
      const { total } = calculateTotal();
      const received = parseFloat(cashReceived) || 0;
      const change = received - total;
      setChangeAmount(change >= 0 ? change : 0);
    }
  }, [cashReceived, cart]);

  const loadPendingOrders = async () => {
    try {
      const pending = await offlineStorage.getPendingOrders();
      setPendingOrders(pending.length);
    } catch (error) {
      console.error('Error loading pending orders:', error);
      setPendingOrders(0);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/pos/products/search?q=${searchQuery}`);
      setSearchResults(response.data.products || []);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to offline search
      try {
        const results = await offlineStorage.searchProducts(searchQuery);
        setSearchResults(results);
      } catch (offlineError) {
        console.error('Offline search failed:', offlineError);
        setSearchResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeInput = async (e) => {
    if (e.key === 'Enter' && searchQuery) {
      try {
        const response = await api.get(`/pos/products/barcode/${searchQuery}`);
        if (response.data) {
          addToCart(response.data);
          setSearchQuery('');
          setSearchResults([]);
        }
      } catch (error) {
        try {
          const product = await offlineStorage.getProductByBarcode(searchQuery);
          if (product) {
            addToCart(product);
            setSearchQuery('');
            setSearchResults([]);
          }
        } catch (offlineError) {
          console.error('Product not found:', offlineError);
        }
      }
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    const availableStock = product.inventory?.[0]?.quantity_available || product.stock || 0;
    
    if (existingItem) {
      if (existingItem.quantity < availableStock) {
        setCart(cart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        alert('Not enough stock available');
      }
    } else {
      setCart([...cart, { 
        ...product, 
        quantity: 1,
        unit_price: product.selling_price || product.price || 0
      }]);
    }
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + change;
        const availableStock = item.inventory?.[0]?.quantity_available || item.stock || 0;
        
        if (newQty < 1) return item;
        if (newQty > availableStock) {
          alert('Not enough stock available');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const searchCustomer = async () => {
    if (customerPhone) {
      try {
        const response = await api.get(`/customers/phone/${customerPhone}`);
        if (response.data) {
          setCustomer(response.data);
          setShowCustomerSearch(false);
        } else {
          alert('Customer not found');
        }
      } catch (error) {
        try {
          const foundCustomer = await offlineStorage.findCustomerByPhone(customerPhone);
          if (foundCustomer) {
            setCustomer(foundCustomer);
            setShowCustomerSearch(false);
          } else {
            alert('Customer not found');
          }
        } catch (offlineError) {
          alert('Customer not found');
        }
      }
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const tax = subtotal * 0.0875;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const openCashPayment = () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    setShowCashModal(true);
    setCashReceived('');
    setChangeAmount(0);
  };

  const handleCashInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      const { total } = calculateTotal();
      const received = parseFloat(cashReceived) || 0;
      
      if (received < total) {
        alert('Insufficient payment amount');
        return;
      }
      
      completeCashTransaction();
    }
  };

  const completeCashTransaction = async () => {
    const { total } = calculateTotal();
    const received = parseFloat(cashReceived) || 0;
    
    console.log('💰 Completing cash transaction');
    console.log('Total:', total, 'Received:', received, 'Change:', changeAmount);
    
    if (received < total) {
      alert('Insufficient payment amount');
      return;
    }

    await completeTransaction('cash', received, changeAmount);
    setShowCashModal(false);
  };

  const completeTransaction = async (paymentMethod, paidAmount = null, change = 0) => {
    console.log('🔄 Complete Transaction Called');
    console.log('Payment Method:', paymentMethod);
    console.log('Paid Amount:', paidAmount);
    console.log('Change:', change);
    
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const { subtotal, tax, total } = calculateTotal();
    const actualPaid = paidAmount || total;
    
    const order = {
      customer_id: customer?.id || null,
      items: cart.map(item => ({
        product_id: item.id,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price
      })),
      payment_method: paymentMethod,
      notes: `POS Sale - ${new Date().toLocaleString()}`
    };

    console.log('📦 Order object:', order);

    try {
      if (isOnline) {
        console.log('🌐 Attempting online checkout...');
        const response = await api.post('/pos/complete-sale', order);
        console.log('✅ Sale completed:', response.data);
        
        console.log('🖨️ Calling printReceipt...');
        printReceipt({ 
          ...order, 
          order_number: response.data.order.order_number,
          subtotal,
          tax_amount: tax,
          total_amount: total,
          paid_amount: actualPaid,
          change_amount: change
        });
        
        alert('✅ Sale completed successfully!');
      } else {
        console.log('📴 Offline mode - saving locally');
        await offlineStorage.savePendingOrder(order);
        setPendingOrders(prev => prev + 1);
        
        console.log('🖨️ Calling printReceipt (offline)...');
        printReceipt({ 
          ...order, 
          order_number: `OFFLINE-${Date.now()}`,
          subtotal,
          tax_amount: tax,
          total_amount: total,
          paid_amount: actualPaid,
          change_amount: change,
          offline: true
        });
        alert('✅ Sale completed offline. Will sync when online.');
      }
      
      setCart([]);
      setCustomer(null);
      setSearchQuery('');
      setSearchResults([]);
      setCashReceived('');
      setChangeAmount(0);
      
    } catch (error) {
      console.error('❌ Checkout error:', error);
      console.error('Error details:', error.response?.data);
      
      try {
        await offlineStorage.savePendingOrder(order);
        setPendingOrders(prev => prev + 1);
        
        console.log('🖨️ Calling printReceipt (error fallback)...');
        printReceipt({ 
          ...order, 
          order_number: `OFFLINE-${Date.now()}`,
          subtotal,
          tax_amount: tax,
          total_amount: total,
          paid_amount: actualPaid,
          change_amount: change,
          offline: true
        });
        alert('✅ Sale saved offline. Will sync when online.');
      } catch (offlineError) {
        console.error('Failed to save offline:', offlineError);
        alert('❌ Failed to complete transaction. Please try again.');
        return;
      }
      
      setCart([]);
      setCustomer(null);
      setCashReceived('');
      setChangeAmount(0);
    }
  };

  const printReceipt = (order) => {
    console.log('🖨️ printReceipt function called');
    console.log('Order data:', order);
    
    try {
      const receiptWindow = window.open('', 'PRINT', 'height=600,width=400');
      
      if (!receiptWindow) {
        console.error('❌ Failed to open print window - popup might be blocked');
        alert('Please allow popups to print receipts. Check your browser settings.');
        return;
      }
      
      console.log('✅ Print window opened');
      
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                padding: 20px;
                max-width: 300px;
                margin: 0 auto;
              }
              .header { 
                text-align: center; 
                margin-bottom: 20px;
                border-bottom: 2px dashed #000;
                padding-bottom: 10px;
              }
              .header h2 { margin: 5px 0; }
              .header p { margin: 2px 0; font-size: 12px; }
              .items { margin: 20px 0; }
              .item { 
                display: flex; 
                justify-content: space-between; 
                margin: 5px 0;
                font-size: 13px;
              }
              .item-name { flex: 1; }
              .item-qty { width: 30px; text-align: center; }
              .item-price { width: 70px; text-align: right; }
              .totals { 
                border-top: 2px solid #000; 
                margin-top: 10px; 
                padding-top: 10px; 
              }
              .total-line {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 13px;
              }
              .total-line.grand {
                font-size: 16px;
                font-weight: bold;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #000;
              }
              .payment-info {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 2px dashed #000;
              }
              .change-box {
                background: #f0f0f0;
                padding: 10px;
                margin: 10px 0;
                text-align: center;
                border: 2px solid #000;
              }
              .change-amount {
                font-size: 24px;
                font-weight: bold;
                margin: 5px 0;
              }
              .footer { 
                text-align: center;
                margin-top: 20px;
                padding-top: 10px;
                border-top: 2px dashed #000;
                font-size: 12px;
              }
              @media print {
                body { padding: 10px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>HARDWARE SHOP</h2>
              <p>Management System</p>
              <p>123 Main Street, Colombo</p>
              <p>Tel: +94 11 234 5678</p>
              <p style="margin-top: 10px;">${new Date().toLocaleString()}</p>
              ${order.order_number ? `<p><strong>Order #${order.order_number}</strong></p>` : ''}
            </div>
            
            <div class="items">
              ${order.items.map(item => `
                <div class="item">
                  <span class="item-name">${item.name}</span>
                  <span class="item-qty">x${item.quantity}</span>
                  <span class="item-price">Rs ${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
                <div style="font-size: 11px; color: #666; margin-left: 10px;">
                  @ Rs ${item.unit_price.toFixed(2)} each
                </div>
              `).join('')}
            </div>
            
            <div class="totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>Rs ${order.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-line">
                <span>Tax (8.75%):</span>
                <span>Rs ${order.tax_amount.toFixed(2)}</span>
              </div>
              <div class="total-line grand">
                <span>TOTAL:</span>
                <span>Rs ${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="payment-info">
              <div class="total-line">
                <span>Payment Method:</span>
                <span><strong>${order.payment_method.toUpperCase()}</strong></span>
              </div>
              ${order.payment_method === 'cash' && order.paid_amount ? `
                <div class="total-line">
                  <span>Cash Received:</span>
                  <span>Rs ${order.paid_amount.toFixed(2)}</span>
                </div>
                ${order.change_amount > 0 ? `
                  <div class="change-box">
                    <div>CHANGE</div>
                    <div class="change-amount">Rs ${order.change_amount.toFixed(2)}</div>
                  </div>
                ` : ''}
              ` : ''}
            </div>
            
            <div class="footer">
              <p><strong>Thank you for your business!</strong></p>
              <p>Please come again</p>
              ${order.offline ? '<p style="margin-top: 10px;"><strong>⚠️ OFFLINE TRANSACTION</strong></p>' : ''}
              <p style="margin-top: 10px; font-size: 10px;">
                Served by: ${order.created_by || 'Staff'}
              </p>
            </div>
          </body>
        </html>
      `);
      
      receiptWindow.document.close();
      receiptWindow.focus();
      
      console.log('⏳ Waiting 250ms before printing...');
      setTimeout(() => {
        console.log('🖨️ Calling print...');
        receiptWindow.print();
        receiptWindow.close();
        console.log('✅ Print dialog opened');
      }, 250);
      
    } catch (error) {
      console.error('❌ Error in printReceipt:', error);
      alert('Failed to print receipt: ' + error.message);
    }
  };

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      {/* Main Content Area with Sidebar Spacing */}
      <div className="lg:ml-64 p-3">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-3">
          <div className="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Point of Sale</h1>
            
            <div className="flex items-center gap-3">
              {pendingOrders > 0 && (
                <div className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                  {pendingOrders} pending sync
                </div>
              )}
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span className="font-medium text-sm">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="font-medium text-sm">Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left: Product Search & Selection */}
          <div className="lg:col-span-2 space-y-3">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products or scan barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleBarcodeInput}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-3 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-2">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          addToCart(product);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                      >
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 text-sm">Rs {product.selling_price?.toFixed(2) || product.price?.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Stock: {product.inventory?.[0]?.quantity_available || product.stock || 0}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart Items ({cart.length})
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Cart is empty. Search and add products to begin.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{item.name}</div>
                        <div className="text-xs text-gray-500">Rs {item.unit_price.toFixed(2)} each</div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-semibold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="font-semibold text-gray-900 w-20 text-right text-sm">
                        Rs {(item.unit_price * item.quantity).toFixed(2)}
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Customer & Checkout */}
          <div className="space-y-3">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h2 className="text-base font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer
              </h2>

              {customer ? (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-medium text-gray-900 text-sm">{customer.first_name} {customer.last_name}</div>
                  <div className="text-xs text-gray-600">{customer.phone}</div>
                  <div className="text-xs text-gray-600">{customer.email}</div>
                  <button
                    onClick={() => setCustomer(null)}
                    className="mt-1.5 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Change Customer
                  </button>
                </div>
              ) : (
                <div>
                  {showCustomerSearch ? (
                    <div className="space-y-2">
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={searchCustomer}
                          className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Search
                        </button>
                        <button
                          onClick={() => setShowCustomerSearch(false)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCustomerSearch(true)}
                      className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 text-sm"
                    >
                      + Add Customer (Optional)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Order Summary</h2>
              
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Subtotal:</span>
                  <span>Rs {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Tax (8.75%):</span>
                  <span>Rs {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-1.5 border-t">
                  <span>Total:</span>
                  <span>Rs {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-2">
                <button
                  onClick={openCashPayment}
                  disabled={cart.length === 0}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <span className="text-xs font-bold">Rs</span>
                  Pay Cash
                </button>
                <button
                  onClick={() => completeTransaction('card')}
                  disabled={cart.length === 0}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  💳 Pay Card
                </button>
                <button
                  onClick={() => printReceipt({ items: cart, subtotal, tax_amount: tax, total_amount: total, payment_method: 'reprint' })}
                  disabled={cart.length === 0}
                  className="w-full bg-gray-600 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
              </div>

              {!isOnline && cart.length > 0 && (
                <div className="mt-3 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-800">
                    ⚠️ Working offline. Transaction will sync when connection is restored.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    

      {/* Cash Payment Modal */}
      {showCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Cash Payment</h2>
              <button 
                onClick={() => setShowCashModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Total Amount */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-3xl font-bol
                d text-gray-900">Rs {total.toFixed(2)}</p>
              </div>

              {/* Cash Received Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Received
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl text-gray-500">Rs</span>
                  <input
                    ref={cashInputRef}
                    type="number"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    onKeyPress={handleCashInputKeyPress}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-4 text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Press Enter after typing amount</p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[1000, 2000, 5000, 10000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount.toString())}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700"
                  >
                    Rs {amount}
                  </button>
                ))}
              </div>

              {/* Change Display */}
              {cashReceived && parseFloat(cashReceived) >= total && (
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1 text-center">Change</p>
                  <p className="text-4xl font-bold text-green-600 text-center">
                    Rs {changeAmount.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Insufficient Amount Warning */}
              {cashReceived && parseFloat(cashReceived) < total && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
                  <p className="text-red-600 font-medium">
                    Insufficient amount. Need Rs {(total - parseFloat(cashReceived)).toFixed(2)} more
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowCashModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={completeCashTransaction}
                disabled={!cashReceived || parseFloat(cashReceived) < total}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Complete & Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}