class OfflineStorage {
  constructor() {
    this.dbName = 'HardwareShopDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('sku', 'sku', { unique: true });
          productStore.createIndex('barcode', 'barcode', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('email', 'email', { unique: false });
        }

        if (!db.objectStoreNames.contains('pendingOrders')) {
          const orderStore = db.createObjectStore('pendingOrders', { keyPath: 'localId', autoIncrement: true });
          orderStore.createIndex('timestamp', 'timestamp', { unique: false });
          orderStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('inventory')) {
          db.createObjectStore('inventory', { keyPath: 'product_id' });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async add(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return store.add(data);
  }

  async put(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return store.put(data);
  }

  async get(storeName, key) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return store.get(key);
  }

  async getAll(storeName) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return store.getAll();
  }

  async delete(storeName, key) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return store.delete(key);
  }

  async clear(storeName) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return store.clear();
  }

  async saveProducts(products) {
    const tx = this.db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    for (const product of products) {
      await store.put(product);
    }
    await this.setMetadata('lastProductSync', Date.now());
  }

  async searchProducts(query) {
    const products = await this.getAll('products');
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.sku.toLowerCase().includes(lowerQuery) ||
      (p.barcode && p.barcode.toLowerCase().includes(lowerQuery))
    );
  }

  async getProductByBarcode(barcode) {
    const tx = this.db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const index = store.index('barcode');
    return index.get(barcode);
  }

  async saveCustomers(customers) {
    const tx = this.db.transaction('customers', 'readwrite');
    const store = tx.objectStore('customers');
    for (const customer of customers) {
      await store.put(customer);
    }
    await this.setMetadata('lastCustomerSync', Date.now());
  }

  async findCustomerByPhone(phone) {
    const tx = this.db.transaction('customers', 'readonly');
    const store = tx.objectStore('customers');
    const index = store.index('phone');
    return index.get(phone);
  }

  async savePendingOrder(order) {
    const orderData = {
      ...order,
      timestamp: Date.now(),
      synced: false
    };
    return this.add('pendingOrders', orderData);
  }

  async getPendingOrders() {
    const orders = await this.getAll('pendingOrders');
    return orders.filter(o => !o.synced);
  }

  async markOrderAsSynced(localId, serverId) {
    const order = await this.get('pendingOrders', localId);
    if (order) {
      order.synced = true;
      order.serverId = serverId;
      order.syncedAt = Date.now();
      await this.put('pendingOrders', order);
    }
  }

  async updateInventory(productId, quantity) {
    const inventory = await this.get('inventory', productId) || { product_id: productId };
    inventory.quantity_on_hand = quantity;
    inventory.last_updated = Date.now();
    await this.put('inventory', inventory);
  }

  async getInventory(productId) {
    return this.get('inventory', productId);
  }

  async addToSyncQueue(type, data) {
    return this.add('syncQueue', {
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    });
  }

  async getSyncQueue() {
    return this.getAll('syncQueue');
  }

  async removeSyncItem(id) {
    return this.delete('syncQueue', id);
  }

  async setMetadata(key, value) {
    return this.put('metadata', { key, value, timestamp: Date.now() });
  }

  async getMetadata(key) {
    const item = await this.get('metadata', key);
    return item ? item.value : null;
  }
}

const offlineStorage = new OfflineStorage();
export default offlineStorage;