// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardTitle } from "@/components/ui/card";
// import { useNavigate } from "react-router-dom";

// function PaymentSuccessPage() {
//   const navigate = useNavigate();

//   return (
//     <Card className="p-10">
//       <CardHeader className="p-0">
//         <CardTitle className="text-4xl">Payment is successfull!</CardTitle>
//       </CardHeader>
//       <Button className="mt-5" onClick={() => navigate("/shop/account")}>
//         View Orders
//       </Button>
//     </Card>
//   );
// }

// export default PaymentSuccessPage;


import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react"; // ✅ Success icon for better UI feedback

function PaymentSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem("currentOrderId"); // ✅ Ensure previous order info is cleared
  }, []);

  return (
    <Card className="p-10 flex flex-col items-center text-center">
      <CheckCircle className="text-green-500 w-16 h-16 mb-4" />  {/* ✅ Success Icon */}
      <CardHeader className="p-0">
        <CardTitle className="text-3xl font-semibold">
          Payment Successful!
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-2 text-gray-600">
        Thank you for your purchase. You can view your orders anytime.
      </CardContent>
      <Button className="mt-6" onClick={() => navigate("/shop/account")}>
        View Orders
      </Button>
    </Card>
  );
}

export default PaymentSuccessPage;
