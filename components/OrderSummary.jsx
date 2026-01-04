import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useState, useMemo } from 'react'
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect, useAuth, useUser, useClerk } from '@clerk/nextjs'
import axios from 'axios';
import { fetchCart } from '@/lib/features/cart/cartSlice';
import Script from 'next/script';

const OrderSummary = ({ totalPrice, items }) => {

    const { user } = useUser()
    const { getToken, isSignedIn } = useAuth()
    const { openSignIn } = useClerk()
    const dispatch = useDispatch()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';

    // Feature toggle for COD - set NEXT_PUBLIC_ENABLE_COD=true in .env to enable
    const enableCOD = process.env.NEXT_PUBLIC_ENABLE_COD === 'true';

    const router = useRouter();

    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate GST breakdown
    const { subtotal, gstAmount, gstBreakdown } = useMemo(() => {
        let subtotal = 0;
        let gstAmount = 0;
        const gstBreakdown = {};

        items.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            const itemGstPercent = item.gst || 0;
            const itemGst = (itemSubtotal * itemGstPercent) / 100;

            subtotal += itemSubtotal;
            gstAmount += itemGst;

            // Group by GST percentage
            if (itemGstPercent > 0) {
                if (!gstBreakdown[itemGstPercent]) {
                    gstBreakdown[itemGstPercent] = 0;
                }
                gstBreakdown[itemGstPercent] += itemGst;
            }
        });

        return { subtotal, gstAmount, gstBreakdown };
    }, [items]);

    const handleCouponCode = async (event) => {
        event.preventDefault();
        try {
            if (!isSignedIn) {
                openSignIn()
                return
            }
            const token = await getToken();
            const { data } = await axios.post('/api/coupon', { code: couponCodeInput }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setCoupon(data.coupon)
            toast.success('Coupon Applied')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const handleRazorpayPayment = async () => {
        try {
            const token = await getToken();

            // Create order in backend
            const { data } = await axios.post('/api/razorpay/create-order', {
                addressId: selectedAddress.id,
                items: items.map(item => ({ id: item.id, quantity: item.quantity })),
                couponCode: coupon?.code
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { razorpayOrder, orderIds, breakdown } = data;

            // Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: "Cartoo",
                description: "Order Payment",
                order_id: razorpayOrder.id,
                handler: async function (response) {
                    try {
                        // Get fresh token for verification
                        const freshToken = await getToken();
                        
                        // Verify payment
                        await axios.post('/api/razorpay/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderIds
                        }, {
                            headers: { Authorization: `Bearer ${freshToken}` }
                        });

                        toast.success('Payment successful!');
                        dispatch(fetchCart({ getToken }));
                        router.push('/orders');
                    } catch (error) {
                        console.error('Verification error:', error);
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: user?.fullName || '',
                    email: user?.primaryEmailAddress?.emailAddress || '',
                },
                theme: {
                    color: "#334155" // slate-700
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        toast.error('Payment cancelled');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error('Payment failed: ' + response.error.description);
                setIsProcessing(false);
            });
            rzp.open();

        } catch (error) {
            toast.error(error?.response?.data?.error || error.message);
            setIsProcessing(false);
        }
    };

    const handleCODOrder = async () => {
        try {
            const token = await getToken();
            
            const { data } = await axios.post('/api/orders', {
                addressId: selectedAddress.id,
                items: items.map(item => ({ id: item.id, quantity: item.quantity })),
                paymentMethod: 'COD',
                couponCode: coupon?.code
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(data.message);
            dispatch(fetchCart({ getToken }));
            router.push('/orders');
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message);
        }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (!isSignedIn) {
            openSignIn()
            return
        }
        if (!selectedAddress) {
            return toast('Please select an address')
        }

        setIsProcessing(true);

        if (paymentMethod === 'RAZORPAY') {
            await handleRazorpayPayment();
        } else if (paymentMethod === 'COD') {
            await handleCODOrder();
            setIsProcessing(false);
        }
    }

    // Calculate totals
    const discountAmount = coupon ? (subtotal * coupon.discount) / 100 : 0;

    return (
        <>
            {/* Razorpay Script */}
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />

            <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
                <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>
                <p className='text-slate-400 text-xs my-4'>Payment Method</p>

                {/* Payment Methods */}
                <div className='space-y-1'>
                    <div className='flex gap-2 items-center'>
                        <input
                            type="radio"
                            id="RAZORPAY"
                            name='payment'
                            onChange={() => setPaymentMethod('RAZORPAY')}
                            checked={paymentMethod === 'RAZORPAY'}
                            className='accent-gray-500'
                        />
                        <label htmlFor="RAZORPAY" className='cursor-pointer'>Pay Online (UPI / Card / Netbanking)</label>
                    </div>
                    {enableCOD && (
                        <div className='flex gap-2 items-center'>
                            <input
                                type="radio"
                                id="COD"
                                name='payment'
                                onChange={() => setPaymentMethod('COD')}
                                checked={paymentMethod === 'COD'}
                                className='accent-gray-500'
                            />
                            <label htmlFor="COD" className='cursor-pointer'>Cash on Delivery</label>
                        </div>
                    )}
                </div>

                {/* Address Selection */}
                <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                    <p>Address</p>
                    {
                        selectedAddress ? (
                            <div className='flex gap-2 items-center'>
                                <p>{selectedAddress.name}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
                                <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer' size={18} />
                            </div>
                        ) : (
                            <div>
                                {
                                    addressList.length > 0 && (
                                        <select className='border border-slate-400 p-2 w-full my-3 outline-none rounded' onChange={(e) => setSelectedAddress(addressList[e.target.value])} >
                                            <option value="">Select Address</option>
                                            {
                                                addressList.map((address, index) => (
                                                    <option key={index} value={index}>{address.name}, {address.city}, {address.state}, {address.zip}</option>
                                                ))
                                            }
                                        </select>
                                    )
                                }
                                <button className='flex items-center gap-1 text-slate-600 mt-1' onClick={() => isSignedIn ? setShowAddressModal(true) : openSignIn()} >Add Address <PlusIcon size={18} /></button>
                            </div>
                        )
                    }
                </div>

                {/* Price Breakdown */}
                <div className='pb-4 border-b border-slate-200'>
                    <div className='flex justify-between'>
                        <div className='flex flex-col gap-1 text-slate-400'>
                            <p>Subtotal:</p>
                            {Object.keys(gstBreakdown).length > 0 && (
                                Object.entries(gstBreakdown).map(([percent, amount]) => (
                                    <p key={percent} className='text-xs'>GST ({percent}%):</p>
                                ))
                            )}
                            {gstAmount > 0 && Object.keys(gstBreakdown).length === 0 && (
                                <p className='text-xs'>GST:</p>
                            )}
                            <p>Shipping:</p>
                            {coupon && <p>Discount:</p>}
                        </div>
                        <div className='flex flex-col gap-1 font-medium text-right'>
                            <p>{currency}{subtotal.toLocaleString()}</p>
                            {Object.keys(gstBreakdown).length > 0 && (
                                Object.entries(gstBreakdown).map(([percent, amount]) => (
                                    <p key={percent} className='text-xs'>+{currency}{amount.toFixed(2)}</p>
                                ))
                            )}
                            {gstAmount > 0 && Object.keys(gstBreakdown).length === 0 && (
                                <p className='text-xs'>+{currency}{gstAmount.toFixed(2)}</p>
                            )}
                            <p><Protect plan={'plus'} fallback={`${currency}50`}>Free</Protect></p>
                            {coupon && <p className='text-green-600'>-{currency}{discountAmount.toFixed(2)}</p>}
                        </div>
                    </div>

                    {/* Coupon Input */}
                    {
                        !coupon ? (
                            <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...' })} className='flex justify-center gap-3 mt-3'>
                                <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                                <button className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'>Apply</button>
                            </form>
                        ) : (
                            <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                                <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                                <p>{coupon.description}</p>
                                <XIcon size={18} onClick={() => setCoupon('')} className='hover:text-red-700 transition cursor-pointer' />
                            </div>
                        )
                    }
                </div>

                {/* Total */}
                <div className='flex justify-between py-4'>
                    <p className='font-medium'>Total:</p>
                    <p className='font-semibold text-right text-slate-700'>
                        <Protect
                            plan={'plus'}
                            fallback={`${currency}${(subtotal + gstAmount + 50 - discountAmount).toFixed(2)}`}
                        >
                            {currency}{(subtotal + gstAmount - discountAmount).toFixed(2)}
                        </Protect>
                    </p>
                </div>

                {/* Place Order Button */}
                <button
                    onClick={e => toast.promise(handlePlaceOrder(e), { loading: 'Processing...' })}
                    disabled={isProcessing}
                    className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {isProcessing ? 'Processing...' : 'Place Order'}
                </button>

                {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
            </div>
        </>
    )
}

export default OrderSummary
