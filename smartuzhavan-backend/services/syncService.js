const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');
const ChangeHistory = require('../models/ChangeHistory');
const logger = require('../utils/logger');

class SyncService {
  /**
   * Process offline updates sent by a reconnected client
   * @param {Array} updates - List of queued mutations
   * @param {Object} socket - The connected socket
   * @param {Object} io - The socket io instance
   */
  static async processOfflineQueue(updates, socket, io) {
    if (!Array.isArray(updates) || updates.length === 0) return;
    
    logger.info(`Processing ${updates.length} offline updates for client: ${socket.id}`);
    
    const results = [];
    
    for (const update of updates) {
      try {
        const { action, entity, data, timestamp } = update;
        
        if (entity !== 'farmers') {
          results.push({ id: update.id, status: 'ignored', reason: 'Unsupported entity' });
          continue;
        }

        switch (action) {
          case 'CREATE':
            const newFarmer = new Farmer({ ...data });
            // Since we don't have direct access to req.user here, we rely on data.createdBy
            // In a real scenario, socket session data should hold user ID.
            if (socket.request.session && socket.request.session.userId) {
               newFarmer.createdBy = socket.request.session.userId;
               newFarmer.updatedBy = socket.request.session.userId;
            }
            await newFarmer.save();
            io.emit('farmer:created', { farmer: newFarmer });
            results.push({ id: update.id, status: 'success', serverId: newFarmer._id });
            break;
            
          case 'UPDATE':
            const existingFarmer = await Farmer.findById(data._id);
            if (!existingFarmer) {
              results.push({ id: update.id, status: 'failed', reason: 'Not found' });
              continue;
            }
            
            // Conflict resolution based on timestamps
            const serverUpdatedAt = new Date(existingFarmer.updatedAt).getTime();
            const clientUpdatedAt = new Date(timestamp).getTime();
            
            if (serverUpdatedAt > clientUpdatedAt) {
              // Server has newer data, ignore client's outdated update
              results.push({ id: update.id, status: 'conflict', serverData: existingFarmer });
            } else {
              Object.assign(existingFarmer, data);
              if (socket.request.session && socket.request.session.userId) {
                existingFarmer.updatedBy = socket.request.session.userId;
              }
              existingFarmer.updatedAt = new Date();
              await existingFarmer.save();
              io.emit('farmer:updated', { farmerId: existingFarmer._id, changes: data });
              results.push({ id: update.id, status: 'success' });
            }
            break;
            
          case 'DELETE':
            const farmerToDelete = await Farmer.findById(data._id);
            if (farmerToDelete && !farmerToDelete.isDeleted) {
              farmerToDelete.isDeleted = true;
              if (socket.request.session && socket.request.session.userId) {
                farmerToDelete.updatedBy = socket.request.session.userId;
              }
              farmerToDelete.updatedAt = new Date();
              await farmerToDelete.save();
              io.emit('farmer:deleted', { farmerId: farmerToDelete._id });
            }
            results.push({ id: update.id, status: 'success' });
            break;
            
          default:
            results.push({ id: update.id, status: 'ignored', reason: 'Unknown action' });
        }
      } catch (err) {
        logger.error(`Error processing offline update: ${err.message}`);
        results.push({ id: update.id, status: 'failed', reason: err.message });
      }
    }
    
    // Notify the client that their sync queue is processed
    socket.emit('sync:completed', { results });
  }
}

module.exports = SyncService;
