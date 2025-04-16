


import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createNewOrder } from "@/store/admin/order-slice";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";


function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymemntStart] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const totalCartAmount =
    cartItems && cartItems.items && cartItems.items.length > 0
      ? cartItems.items.reduce(
          (sum, currentItem) =>
            sum +
            (currentItem?.salePrice > 0
              ? currentItem?.salePrice
              : currentItem?.price) *
              currentItem?.quantity,
          0
        )
      : 0;

 

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  
  async function handleInitiateRazorpayPayment() {
    if (!cartItems || cartItems.items.length === 0) {
      toast({
        title: "Your cart is empty. Please add items to proceed.",
        variant: "destructive",
      });
      return;
    }
  
    if (!currentSelectedAddress) {
      toast({
        title: "Please select an address to proceed.",
        variant: "destructive",
      });
      return;
    }
  
    const razorpayLoaded = await loadRazorpayScript();
    if (!razorpayLoaded) {
      toast({
        title: "Error",
        description: "Failed to load Razorpay SDK. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }
  
    const orderData = {
      
      userId: user?.id,
      cartId: cartItems?._id,
      cartItems: cartItems.items.map((singleCartItem) => ({
        productId: singleCartItem?.productId,
        title: singleCartItem?.title,
        image: singleCartItem?.image,
        price:
          singleCartItem?.salePrice > 0
            ? singleCartItem?.salePrice
            : singleCartItem?.price,
        quantity: singleCartItem?.quantity,
      })),
      addressInfo: {
        addressId: currentSelectedAddress?._id,
        address: currentSelectedAddress?.address,
        city: currentSelectedAddress?.city,
        pincode: currentSelectedAddress?.pincode,
        phone: currentSelectedAddress?.phone,
        notes: currentSelectedAddress?.notes,
      },
      orderStatus: "pending",
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      totalAmount: totalCartAmount,
      orderDate: new Date(),
      orderUpdateDate: new Date(),
      paymentId: "",
    };
  
    try {
      setIsPaymemntStart(true);
  
      // Step 1: Request Order Creation from Backend
    

      console.log("Sending order request with data:", orderData);
      const  data  = await dispatch(createNewOrder(orderData)).unwrap();
      
      
      if (!data.success || !data.orderId   || !data.razorpayOrderId ) {
        throw new Error("Invalid response from backend. Please try again.");
      }
  
      const { orderId, amount, currency, key } = data;
      

      // Step 2: Configure Razorpay Payment


      
      const options = {
        key, 
      amount: amount.toString(),  // Convert INR to paise
        currency,
        name: "Your Shop",
        description: "Order Payment",
        order_id: data.razorpayOrderId,  // ✅ Must be the Razorpay Order ID
        handler: async function (response) {
          console.log("Payment Response:", response);
          try {
            const paymentData = {
              paymentId: response.razorpay_payment_id,
              orderId,  // ✅ Backend Order ID for tracking
              signature: response.razorpay_signature,
            };
              console.log("this is the payment data begin sent to capture-payment :::::::::::::",paymentData);
              

            const captureResponse = await axios.post(
              "http://localhost:5000/api/shop/order/capture-payment",
              paymentData
            );
      
            if (captureResponse.data.success) {
              toast({ title: "Payment successful!", variant: "success" });
              window.location.href = "/shop/payment-success";
            } else {
              throw new Error("Payment capture failed.");
            }
          } catch (error) {
            console.error("Payment Error:", error);
            toast({
              title: "Payment failed!",
              description: error.message,
              variant: "destructive",
            });
          }
        },
      };
      
  
      // Step 4: Open Razorpay Checkout
      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error) {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
      setIsPaymemntStart(false);
    }
  }
  
  

  return (
    <div className="flex flex-col">
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />
        <div className="flex flex-col gap-4">
          {cartItems && cartItems.items && cartItems.items.length > 0
            ? cartItems.items.map((item) => (
                <UserCartItemsContent key={item.productId} cartItem={item} />
              ))
            : null}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">${totalCartAmount}</span>
            </div>
          </div>
          <div className="mt-4 w-full">
            <Button onClick={handleInitiateRazorpayPayment} className="w-full">
              {isPaymentStart
                ? "Processing Razorpay Payment..."
                : "Checkout with Razorpay"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
