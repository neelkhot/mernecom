

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  orderList: [],
  orderDetails: null,
  isLoading: false, // Ensure loading state exists
};



export const createNewOrder = createAsyncThunk(
  "/order/createNewOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      console.log("🟢 Sending Order Request:", orderData);
      console.log("🟢 createNewOrder method is being executed");

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL_API}/api/shop/order/create`,
        orderData
      );

      console.log("🟢 Response from Backend:", response.data);

      // Explicitly returning relevant fields to ensure they are available in the frontend
      return {
        success: response.data.success,
        orderId: response.data.orderId,
        razorpayOrderId: response.data.razorpayOrderId,
        key: response.data.key, // ✅ Add Razorpay key
        amount: response.data.amount, // ✅ Add order amount
        currency: response.data.currency, // ✅ Add currency (INR)
      };
    } catch (error) {
      console.error("🔴 Axios Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);



// ✅ Fetch all orders for admin
export const getAllOrdersForAdmin = createAsyncThunk(
  "/order/getAllOrdersForAdmin",
  async () => {
    const response = await axios.get(`${import.meta.env.VITE_BASE_URL_API}/api/admin/orders/get`);
    return response.data;
  }
);





// ✅ Fetch order details for admin
export const getOrderDetailsForAdmin = createAsyncThunk(
  "/order/getOrderDetailsForAdmin",
  async (id) => {
    const response = await axios.get(`${import.meta.env.VITE_BASE_URL_API}/api/admin/orders/details/${id}`);
    console.log(response.data);
    return response.data;
  }
);

// ✅ Update order status
export const updateOrderStatus = createAsyncThunk(
  "/order/updateOrderStatus",
  async ({ id, orderStatus }) => {
    const response = await axios.put(`${import.meta.env.VITE_BASE_URL_API}/api/admin/orders/update/${id}`, {
      orderStatus,
    });
    return response.data;
  }
);

// ✅ New: Capture Razorpay Payment (Replacement for PayPal Capture)
export const capturePayment = createAsyncThunk(
  "/order/capturePayment",
  async ({ paymentId, orderId, signature }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL_API}/api/shop/order/capture-payment`, {
        paymentId,
        orderId,
        razorpay_signature:signature,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);




const adminOrderSlice = createSlice({
  name: "adminOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllOrdersForAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllOrdersForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderList = action.payload.data;
      })
      .addCase(getAllOrdersForAdmin.rejected, (state) => {
        state.isLoading = false;
        state.orderList = [];
      })
      .addCase(getOrderDetailsForAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrderDetailsForAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetailsForAdmin.rejected, (state) => {
        state.isLoading = false;
        state.orderDetails = null;
      })
      // ✅ Handle Razorpay Capture Payment
      .addCase(capturePayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(capturePayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data; // Assuming backend returns updated order details
      })
      .addCase(capturePayment.rejected, (state) => {
        state.isLoading = false;
      })
      // ✅ 🔥 ADD createNewOrder.fulfilled CASE TO FIX razorpayOrderId ISSUE
      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log("🟢 Redux Store Updated with:", action.payload);

        state.orderDetails = {
          orderId: action.payload.orderId, // ✅ Backend Order ID
          razorpayOrderId: action.payload.razorpayOrderId, // ✅ Razorpay Order ID
        };
      });
  },
});


export const { resetOrderDetails } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;

