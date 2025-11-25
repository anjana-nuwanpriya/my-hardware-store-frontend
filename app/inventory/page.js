'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Package, ChevronLeft, ChevronRight, X } from 'lucide-react';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import api from '@/lib/api';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    cost_price: '',
    selling_price: '',
    min_stock_level: 10,
    barcode: '',
    unit: 'Pieces'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', formData);
      alert('Product added successfully!');
      setShowAddModal(false);
      setFormData({
        sku: '',
        name: '',
        description: '',
        cost_price: '',
        selling_price: '',
        min_stock_level: 10,
        barcode: '',
        unit: 'Pieces'
      });
      loadProducts();
    } catch (error) {
      alert('Failed to add product: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAdjustStock = (product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  const saveStockAdjustment = async (adjustment) => {
    try {
      const response = await api.post('/inventory/adjust', {
        product_id: selectedProduct.id,
        quantity: adjustment,
        movement_type: adjustment > 0 ? 'adjustment_in' : 'adjustment_out',
        notes: 'Manual stock adjustment'
      });
      alert(`Stock adjusted successfully! New stock level: ${response.data.newStock}`);
      setShowAdjustModal(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (error) {
      alert('Failed to adjust stock: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStockStatus = (product) => {
    const stock = product.inventory?.[0]?.quantity || 0;
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
    if (stock <= product.min_stock_level) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const summaryStats = {
    total: products.length,
    lowStock: products.filter(p => {
      const stock = p.inventory?.[0]?.quantity || 0;
      return stock > 0 && stock <= p.min_stock_level;
    }).length,
    outOfStock: products.filter(p => (p.inventory?.[0]?.quantity || 0) === 0).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <div className="p-6 lg:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-8 h-8 text-blue-600" />
                Inventory Management
              </h1>
              <p className="text-gray-600 mt-1">Manage your product inventory and stock levels</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{summaryStats.lowStock}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{summaryStats.outOfStock}</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">Loading products...</div>
            ) : currentProducts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No products found</div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">SKU</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product Name</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Stock</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Cost</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product) => {
                      const status = getStockStatus(product);
                      const stock = product.inventory?.[0]?.quantity || 0;
                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{product.sku}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.barcode || 'No barcode'}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-lg font-bold">{stock}</span>
                          </td>
                          <td className="py-3 px-4 text-right">Rs {parseFloat(product.cost_price || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-semibold">Rs {parseFloat(product.selling_price || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleAdjustStock(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Classic Style Add Product Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-[#f5f0e8] rounded-lg shadow-2xl w-full max-w-3xl border-4 border-[#8b6f47]">
                {/* Header */}
                <div className="bg-gradient-to-b from-[#d4c4a8] to-[#c4b49a] px-6 py-4 border-b-4 border-[#8b6f47] flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#3d2817]">Item Details</h2>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="text-[#3d2817] hover:text-red-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                  {/* Item/Code Row */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-[#3d2817] mb-1">
                        Item
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 bg-white border-2 border-[#8b6f47] rounded focus:ring-2 focus:ring-[#d4a574] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#3d2817] mb-1">
                        Code
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        className="w-full px-3 py-2 bg-white border-2 border-[#8b6f47] rounded focus:ring-2 focus:ring-[#d4a574] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Barcode & Unit Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#3d2817] mb-1">
                        Barcode
                      </label>
                      <input
                        type="text"
                        value={formData.barcode}
                        onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                        className="w-full px-3 py-2 bg-white border-2 border-[#8b6f47] rounded focus:ring-2 focus:ring-[#d4a574] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#3d2817] mb-1">
                        Unit
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="w-full px-3 py-2 bg-white border-2 border-[#8b6f47] rounded focus:ring-2 focus:ring-[#d4a574] focus:outline-none"
                      >
                        <option value="Pieces">Pieces</option>
                        <option value="Kg">Kg</option>
                        <option value="Meters">Meters</option>
                        <option value="Box">Box</option>
                        <option value="Liters">Liters</option>
                      </select>
                    </div>
                  </div>

                  {/* Cost & Selling Price Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#3d2817] mb-1">
                        Cost Price (Rs)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                        className="w-full px-3 py-2 bg-white border-2 border-[#8b6f47] rounded focus:ring-2 focus:ring-[#d4a574] focus:outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#3d2817] mb-1">
                        Selling Price (Rs)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.selling_price}
                        onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                        className="w-full px-3 py-2 bg-white border-2 border-[#8b6f47] rounded focus:ring-2 focus:ring-[#d4a574] focus:outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Min Stock Level */}
                  <div>
                    <label className="block text-sm font-semibold text-[#3d2817] mb-1">
                      Min Stock Level
                    </label>
                    <input
                      type="number"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})}
                      className="w-full px-3 py-2 bg-white border-2 border-[#8b6f47] rounded focus:ring-2 focus:ring-[#d4a574] focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-[#3d2817] mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="4"
                      className="w-full px-3 py-2 bg-white border-2 border-[#8b6f47] rounded focus:ring-2 focus:ring-[#d4a574] focus:outline-none resize-none"
                    />
                  </div>

                  {/* Buttons - Classic Style */}
                  <div className="grid grid-cols-4 gap-3 pt-4 border-t-2 border-[#8b6f47]">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-3 bg-gradient-to-b from-[#d4c4a8] to-[#c4b49a] border-2 border-[#8b6f47] rounded font-semibold text-[#3d2817] hover:from-[#e4d4b8] hover:to-[#d4c4a8] shadow-md"
                    >
                      <span className="text-xs">Esc</span> › Exit
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-3 bg-gradient-to-b from-[#8bc34a] to-[#7cb342] border-2 border-[#689f38] rounded font-semibold text-white hover:from-[#9ccc65] hover:to-[#8bc34a] shadow-md"
                    >
                      <span className="text-xs">F8</span> › Save
                    </button>
                    <button
                      type="button"
                      className="px-4 py-3 bg-gradient-to-b from-[#f44336] to-[#e53935] border-2 border-[#c62828] rounded font-semibold text-white hover:from-[#ef5350] hover:to-[#f44336] shadow-md"
                    >
                      <span className="text-xs">F9</span> › Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-3 bg-gradient-to-b from-[#ff9800] to-[#f57c00] border-2 border-[#e65100] rounded font-semibold text-white hover:from-[#ffa726] hover:to-[#ff9800] shadow-md"
                    >
                      <span className="text-xs">F12</span> › Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Stock Adjustment Modal */}
          {showAdjustModal && selectedProduct && (
            <StockAdjustmentModal
              product={selectedProduct}
              onClose={() => {
                setShowAdjustModal(false);
                setSelectedProduct(null);
              }}
              onSave={saveStockAdjustment}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StockAdjustmentModal({ product, onClose, onSave }) {
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [quantity, setQuantity] = useState('');

  const handleSave = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    const adjustment = adjustmentType === 'add' ? qty : -qty;
    const currentStock = product.inventory?.[0]?.quantity || 0;
    if (adjustmentType === 'remove' && qty > currentStock) {
      alert(`Cannot remove ${qty} units. Only ${currentStock} units available.`);
      return;
    }
    onSave(adjustment);
  };

  const currentStock = product.inventory?.[0]?.quantity || 0;
  const newStock = adjustmentType === 'add' 
    ? currentStock + parseInt(quantity || 0)
    : currentStock - parseInt(quantity || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Adjust Stock</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Product</p>
            <p className="font-semibold">{product.name}</p>
            <p className="text-sm text-gray-600 mt-1">Current Stock: <span className="font-semibold">{currentStock}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAdjustmentType('add')}
                className={`py-3 rounded-lg font-medium ${
                  adjustmentType === 'add' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Add Stock
              </button>
              <button
                onClick={() => setAdjustmentType('remove')}
                className={`py-3 rounded-lg font-medium ${
                  adjustmentType === 'remove' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Remove Stock
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter quantity"
            />
          </div>

          {quantity && (
            <div className={`border rounded-lg p-4 ${newStock < 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-sm font-medium ${newStock < 0 ? 'text-red-900' : 'text-blue-900'}`}>
                New Stock Level
              </p>
              <p className={`text-2xl font-bold ${newStock < 0 ? 'text-red-900' : 'text-blue-900'}`}>
                {newStock}
              </p>
              {newStock < 0 && <p className="text-xs text-red-700 mt-1">⚠️ Cannot reduce stock below zero</p>}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!quantity || quantity <= 0 || newStock < 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Save Adjustment
          </button>
        </div>
      </div>
    </div>
  );
}