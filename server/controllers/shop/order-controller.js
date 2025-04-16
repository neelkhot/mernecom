
const crypto = require("crypto");
const razorpay = require("../../helpers/razorpay");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
require("dotenv").config();



const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
    } = req.body;

    // Razorpay requires amount in paise (multiply by 100)
    const options = {
      amount: totalAmount * 100, 
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
      payment_capture: 1, 
    };
     console.log("order is runnign");
    const razorpayOrder = await razorpay.orders.create(options);
    console.log("order that we are getting: " , JSON.stringify(razorpayOrder, null, 2));

    // Save order details in DB
    const newlyCreatedOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      paymentId: razorpayOrder.id, // Save Razorpay order ID
   
    });

    await newlyCreatedOrder.save();
    console.log("✅ Backend Order Created:", newlyCreatedOrder);

    console.log("Sending response to frontend:", {
      success: true,
      orderId: newlyCreatedOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
     
    });


    
     
      res.status(201).json({
      success: true,
      orderId: newlyCreatedOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
 
    console.log("the data has been sent to funtend");
  
  
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error creating Razorpay order!",
    });
  }
};

const capturePayment = async (req, res) => {
  try {
    console.log("🔹 Incoming request:", req.body);

    const { paymentId, orderId, signature } = req.body;
    
    if (!paymentId || !orderId || !signature) {
      return res.status(400).json({ success: false, message: "Missing required parameters!" });
    }

    // 🔹 Fetch the Order from DB
    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
     
    const razorpayOrderId = order.paymentId;

    // 🔹 Verify Razorpay Signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + paymentId)
      .digest("hex");
      console.log("🔑 Using Razorpay Secret (first 5 chars):", process.env.RAZORPAY_KEY_SECRET?.slice(0, 5));
      console.log("📝 Order ID used for signature:", orderId);
      console.log("🔹 Razorpay Order ID:", razorpayOrderId);
      console.log("🔹 Order ID:", orderId);
      console.log("🔹 Payment ID:", paymentId);
      console.log("🔹 Received Signature from Razorpay:", signature);
      console.log("🔹 Computed Expected Signature:", expectedSignature);

    console.log("✅ Expected Signature:", expectedSignature);
    console.log("✅ Received Signature:", signature);

    if (expectedSignature !== signature) {
      console.error("❌ Signature mismatch!");
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // 🔹 Fetch Payment Details from Razorpay
    let payment;
    try {
      console.log("🔍 Fetching payment details for Payment ID:", paymentId);
      payment = await razorpay.payments.fetch(paymentId);
      console.log("✅ Payment Details:", payment);
    } catch (error) {
      console.error("❌ Error fetching payment details:", error);
      return res.status(500).json({ success: false, message: "Error fetching payment details" });
    }

    // 🔹 Check if Payment is Already Captured
    if (payment.status !== "captured") {
      console.error("❌ Payment not captured yet:", payment.status);
      return res.status(400).json({ success: false, message: "Payment is not captured yet" });
    }

    console.log("✅ Payment is captured! Updating order...");

    // 🔹 Update Order Status
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    await order.save();

    console.log("✅ Order updated successfully:", order);

    res.status(200).json({
      success: true,
      message: "Payment verified and order updated",
      data: order,
    });

  } catch (error) {
    console.error("❌ Error processing payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



const getAllOrdersForAdmin = async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 }); // Sort orders by latest

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log("Error fetching orders:", e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders!",
    });
  }
};



const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error fetching orders!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error fetching order details!",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    await Order.findByIdAndUpdate(id, { orderStatus });

    res.status(200).json({
      success: true,
      message: "Order status is updated successfully!",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
  getAllOrdersForAdmin,
  updateOrderStatus,
};
