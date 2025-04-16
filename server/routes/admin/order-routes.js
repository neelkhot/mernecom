const express = require("express");

const {
  
  getAllOrdersByUser,
  getOrderDetails,
  getAllOrdersForAdmin,
  updateOrderStatus,
  
} = require("../../controllers/admin/order-controller");

const router = express.Router();


router.put("/update/:id",updateOrderStatus);
router.get("/get",getAllOrdersForAdmin);
router.get("/list/:userId", getAllOrdersByUser);
router.get("/details/:id", getOrderDetails);

module.exports = router;
