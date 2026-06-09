const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  try {
    const { clientId, details } = req.body;
    const order = await Order.create({
      procurementManagerId: req.user._id,
      clientId,
      details
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    // Authorization check: IM, PM, and Admin can update status
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.linkChecklistToOrder = async (req, res) => {
  try {
    const { orderId, checklistTemplateId } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      orderId, 
      { checklistTemplateId }, 
      { new: true }
    );
    
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};