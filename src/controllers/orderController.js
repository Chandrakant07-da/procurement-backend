const Order = require('../models/Order');

//Create Order (PM only)
exports.createOrder = async (req, res) => {
  try {
    const { clientId, details, inspectionManagerId, checklistTemplateId } = req.body;
    const order = await Order.create({
      procurementManagerId: req.user._id,
      clientId,
      inspectionManagerId,
      checklistTemplateId,
      details
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all orders (Filtered by Role)
exports.getOrders = async (req, res) => {
  try {
    let filter = {};

    // RBAC dynamic filtering
    if (req.user.role === 'procurement_manager') {
      filter.procurementManagerId = req.user._id;
    } else if (req.user.role === 'inspection_manager') {
      filter.inspectionManagerId = req.user._id;
    } else if (req.user.role === 'client') {
      filter.clientId = req.user._id;
    } // Admin sees all (filter remains empty)

    const orders = await Order.find(filter)
      .populate('procurementManagerId', 'email role mobile')
      .populate('clientId', 'email role mobile')
      .populate('inspectionManagerId', 'email role mobile')
      .populate('checklistTemplateId', 'title');

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const id = req.params.id || req.params.orderId;
    const order = await Order.findById(id)
      .populate('procurementManagerId', 'email role mobile')
      .populate('clientId', 'email role mobile')
      .populate('inspectionManagerId', 'email role mobile')
      .populate('checklistTemplateId', 'title');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Authorization checks:
    const isOwner = req.user.role === 'admin' ||
      (req.user.role === 'procurement_manager' && order.procurementManagerId?._id.toString() === req.user._id.toString()) ||
      (req.user.role === 'inspection_manager' && order.inspectionManagerId?._id.toString() === req.user._id.toString()) ||
      (req.user.role === 'client' && order.clientId?._id.toString() === req.user._id.toString());

    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update order details (Admin/PM only)
exports.updateOrder = async (req, res) => {
  try {
    const id = req.params.id || req.params.orderId;
    const { clientId, inspectionManagerId, checklistTemplateId, details, status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Authorization: Only admin or the creating PM can update order details
    if (req.user.role !== 'admin' && order.procurementManagerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to modify this order' });
    }

    if (clientId !== undefined) order.clientId = clientId;
    if (inspectionManagerId !== undefined) order.inspectionManagerId = inspectionManagerId || null;
    if (checklistTemplateId !== undefined) order.checklistTemplateId = checklistTemplateId || null;
    if (details !== undefined) order.details = details;
    if (status !== undefined) order.status = status;

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update status (Admin, PM, IM)
exports.updateOrderStatus = async (req, res) => {
  try {
    const id = req.params.id || req.params.orderId;
    const { status } = req.body;
    
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // IM, PM, and Admin can update status
    const isAuthorized = req.user.role === 'admin' ||
      (req.user.role === 'procurement_manager' && order.procurementManagerId.toString() === req.user._id.toString()) ||
      (req.user.role === 'inspection_manager' && order.inspectionManagerId && order.inspectionManagerId.toString() === req.user._id.toString());

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to update status on this order' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Link Checklist to Order (PM only)
exports.linkChecklistToOrder = async (req, res) => {
  try {
    const { orderId, checklistTemplateId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Authorization: Must be Admin/PM only who created the order
    if (req.user.role !== 'admin' && order.procurementManagerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to modify this order' });
    }

    order.checklistTemplateId = checklistTemplateId;
    await order.save();
    
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete Order (Admin/PM only)
exports.deleteOrder = async (req, res) => {
  try {
    const id = req.params.id || req.params.orderId;
    const order = await Order.findById(id);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Authorization: Only admin or the creating PM can delete
    if (req.user.role !== 'admin' && order.procurementManagerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this order' });
    }

    await Order.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};