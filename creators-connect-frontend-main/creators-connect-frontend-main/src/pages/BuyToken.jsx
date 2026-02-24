import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { createOrder, getPlans, verifyPayment } from "../api/paymentApi";
import { errorToast, successToast } from "../utils/toast";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser } from "../api/authApi";

const BuyToken = () => {
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [processingPlanId, setProcessingPlanId] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useAuth();

    useEffect(() => {
        fetchPlans();
    }, []);

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

    const fetchPlans = async () => {
        try {
            const data = await getPlans();
            setPlans(data || []);
        } catch (error) {
            errorToast(error.response?.data?.message || "Failed to load plans");
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleBuy = async (planId) => {
        setProcessingPlanId(planId);

        try {
            const sdkReady = await loadRazorpayScript();
            if (!sdkReady) {
                errorToast("Razorpay SDK failed to load");
                return;
            }

            const orderData = await createOrder(planId);

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Creators Connect",
                description: "Buy tokens",
                order_id: orderData.orderId,
                theme: {
                    color: "#10B981"
                },
                handler: async (response) => {
                    await verifyPayment(response);
                    const updatedUser = await getCurrentUser();
                    setUser(updatedUser);

                    setPaymentSuccess(true);
                    successToast("Payment successful. Tokens added.");

                    setTimeout(() => {
                        navigate("/dashboard");
                    }, 1200);
                },
                modal: {
                    ondismiss: () => {
                        setProcessingPlanId(null);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            errorToast(error.response?.data?.message || "Payment failed");
        } finally {
            setProcessingPlanId(null);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-2 text-[#E5E7EB]">Buy Tokens</h2>
            <p className="text-[#9CA3AF] mb-6">Choose a plan and complete payment to add tokens.</p>

            {paymentSuccess && (
                <div className="mb-5 rounded-lg border border-[#10B981] bg-[#111827] px-4 py-3 text-[#10B981]">
                    Payment successful. Redirecting to dashboard...
                </div>
            )}

            {loadingPlans ? (
                <div className="text-[#9CA3AF]">Loading plans...</div>
            ) : plans.length === 0 ? (
                <div className="text-[#9CA3AF]">No plans available right now.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan._id}
                            className="bg-[#1F2937] border border-[#374151] rounded-xl p-5 flex flex-col"
                        >
                            <h3 className="text-xl font-semibold text-[#E5E7EB]">{plan.name}</h3>
                            <p className="text-3xl font-bold text-[#10B981] mt-3">₹{plan.price}</p>
                            <p className="text-[#D1D5DB] mt-2">Tokens: {plan.tokens}</p>
                            <p className="text-[#9CA3AF] text-sm">Bonus: {plan.bonusTokens || 0}</p>

                            <div className="mt-5">
                                <Button
                                    onClick={() => handleBuy(plan._id)}
                                    loading={processingPlanId === plan._id}
                                    disabled={processingPlanId !== null}
                                >
                                    Buy Now
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BuyToken;