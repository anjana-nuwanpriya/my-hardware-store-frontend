import offlineStorage from './offlineStorage';
import api from './api';

class SyncManager {
  constructor() {
    this.syncInProgress = false;
    this.syncListeners = [];
  }

  async init() {
    await offlineStorage.init();
    
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    if (navigator.onLine) {
      this.syncAll();
    }

    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('sync-orders');
      });
    }
  }

  handleOnline() {
    console.log('🌐 Back online! Starting sync...');
    this.notifyListeners('online');
    this.syncAll();
  }

  handleOffline() {
    console.log('📴 Offline mode activated');
    this.notifyListeners('offline');
  }

  async syncAll() {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    this.notifyListeners('syncStart');

    try {
      await this.syncPendingOrders();
      await this.pullProducts();
      await this.pullCustomers();
      await this.processSyncQueue();

      this.notifyListeners('syncComplete');
    } catch (error) {
      console.error('Sync error:', error);
      this.notifyListeners('syncError', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncPendingOrders() {
    const pendingOrders = await offlineStorage.getPendingOrders();
    
    for (const order of pendingOrders) {
      try {
        const response = await api.post('/orders', order);
        await offlineStorage.markOrderAsSynced(order.localId, response.data.id);
        console.log(`✅ Synced order ${order.localId}`);
      } catch (error) {
        console.error(`❌ Failed to sync order ${order.localId}:`, error);
      }
    }
  }

  async pullProducts() {
    const lastSync = await offlineStorage.getMetadata('lastProductSync');
    
    try {
      const params = lastSync ? { updatedAfter: lastSync } : {};
      const response = await api.get('/products', { params });
      
      if (response.data.products) {
        await offlineStorage.saveProducts(response.data.products);
        console.log(`✅ Synced ${response.data.products.length} products`);
      }
    } catch (error) {
      console.error('Failed to pull products:', error);
    }
  }

  async pullCustomers() {
    const lastSync = await offlineStorage.getMetadata('lastCustomerSync');
    
    try {
      const params = lastSync ? { updatedAfter: lastSync } : {};
      const response = await api.get('/customers', { params });
      
      if (response.data.customers) {
        await offlineStorage.saveCustomers(response.data.customers);
        console.log(`✅ Synced ${response.data.customers.length} customers`);
      }
    } catch (error) {
      console.error('Failed to pull customers:', error);
    }
  }

  async processSyncQueue() {
    const queue = await offlineStorage.getSyncQueue();
    
    for (const item of queue) {
      try {
        await this.executeQueueItem(item);
        await offlineStorage.removeSyncItem(item.id);
      } catch (error) {
        console.error('Failed to process queue item:', error);
        if (item.retryCount < 3) {
          item.retryCount++;
          await offlineStorage.put('syncQueue', item);
        }
      }
    }
  }

  async executeQueueItem(item) {
    const { type, data } = item;
    
    switch (type) {
      case 'createProduct':
        return api.post('/products', data);
      case 'updateProduct':
        return api.put(`/products/${data.id}`, data);
      case 'updateInventory':
        return api.put(`/inventory/${data.productId}`, data);
      case 'createCustomer':
        return api.post('/customers', data);
      default:
        throw new Error(`Unknown queue item type: ${type}`);
    }
  }

  onSync(callback) {
    this.syncListeners.push(callback);
  }

  notifyListeners(event, data) {
    this.syncListeners.forEach(listener => listener(event, data));
  }

  async getSyncStatus() {
    const pendingOrders = await offlineStorage.getPendingOrders();
    const syncQueue = await offlineStorage.getSyncQueue();
    
    return {
      isOnline: navigator.onLine,
      pendingOrders: pendingOrders.length,
      queuedItems: syncQueue.length,
      lastSync: {
        products: await offlineStorage.getMetadata('lastProductSync'),
        customers: await offlineStorage.getMetadata('lastCustomerSync')
      }
    };
  }
}

const syncManager = new SyncManager();
export default syncManager;