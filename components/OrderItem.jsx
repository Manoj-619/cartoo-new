'use client'
import Image from "next/image";
import { DotIcon, StoreIcon } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";

const OrderItem = ({ order }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
    const [ratingModal, setRatingModal] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const { ratings } = useSelector(state => state.rating);

    return (
        <>
            <tr className="text-sm">
                <td className="text-left">
                    <div className="flex flex-col gap-6">
                        {/* Store Info */}
                        {order.store && (
                            <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                                <StoreIcon size={14} />
                                <span>Sold by: <span className="font-medium">{order.store.name}</span></span>
                            </div>
                        )}
                        
                        {order.orderItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md">
                                    <Image
                                        className="h-14 w-auto"
                                        src={item.product.images[0]}
                                        alt="product_img"
                                        width={50}
                                        height={50}
                                    />
                                </div>
                                <div className="flex flex-col justify-center text-sm">
                                    <p className="font-medium text-slate-600 text-base">{item.product.name}</p>
                                    <p>{currency}{item.price} × {item.quantity}</p>
                                    {item.gstAmount > 0 && (
                                        <p className="text-xs text-slate-400">
                                            GST ({item.gstPercent}%): +{currency}{item.gstAmount.toFixed(2)}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-400">{new Date(order.createdAt).toDateString()}</p>
                                    <div className="mt-1">
                                        {ratings.find(rating => order.id === rating.orderId && item.product.id === rating.productId)
                                            ? <Rating value={ratings.find(rating => order.id === rating.orderId && item.product.id === rating.productId).rating} />
                                            : <button onClick={() => setRatingModal({ orderId: order.id, productId: item.product.id })} className={`text-green-500 hover:bg-green-50 transition ${order.status !== "DELIVERED" && 'hidden'}`}>Rate Product</button>
                                        }
                                    </div>
                                    {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </td>

                <td className="text-center max-md:hidden">
                    <div className="flex flex-col items-center">
                        <p className="font-semibold text-slate-700">{currency}{order.total.toFixed(2)}</p>
                        <button 
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-xs text-purple-600 hover:underline mt-1"
                        >
                            {showDetails ? 'Hide' : 'View'} breakdown
                        </button>
                        {showDetails && (
                            <div className="text-xs text-slate-500 mt-2 text-left bg-slate-50 p-2 rounded">
                                <p>Subtotal: {currency}{(order.subtotal || 0).toFixed(2)}</p>
                                {order.gstAmount > 0 && (
                                    <p>GST: +{currency}{order.gstAmount.toFixed(2)}</p>
                                )}
                                {order.shippingCharge > 0 && (
                                    <p>Shipping: +{currency}{order.shippingCharge.toFixed(2)}</p>
                                )}
                                {order.isCouponUsed && (
                                    <p className="text-green-600">Discount applied</p>
                                )}
                            </div>
                        )}
                    </div>
                </td>

                <td className="text-left max-md:hidden">
                    <p>{order.address.name}, {order.address.street},</p>
                    <p>{order.address.city}, {order.address.state}, {order.address.zip}, {order.address.country},</p>
                    <p>{order.address.phone}</p>
                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden">
                    <div
                        className={`flex items-center justify-center gap-1 rounded-full p-1 ${
                            order.status === 'DELIVERED'
                                ? 'text-green-500 bg-green-100'
                                : order.status === 'SHIPPED'
                                    ? 'text-blue-500 bg-blue-100'
                                    : order.status === 'PROCESSING'
                                        ? 'text-yellow-500 bg-yellow-100'
                                        : 'text-slate-500 bg-slate-100'
                        }`}
                    >
                        <DotIcon size={10} className="scale-250" />
                        {order.status.split('_').join(' ').toLowerCase()}
                    </div>
                    <div className="text-xs text-slate-400">
                        {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 
                         order.paymentMethod === 'RAZORPAY' ? 'Paid Online' : 
                         order.paymentMethod === 'STRIPE' ? 'Paid via Stripe' : ''}
                        {order.isPaid && <span className="text-green-600 ml-1">✓</span>}
                    </div>
                </td>
            </tr>
            {/* Mobile */}
            <tr className="md:hidden">
                <td colSpan={5}>
                    {/* Store Info Mobile */}
                    {order.store && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                            <StoreIcon size={14} />
                            <span>Sold by: <span className="font-medium">{order.store.name}</span></span>
                        </div>
                    )}
                    
                    {/* Price Breakdown Mobile */}
                    <div className="bg-slate-50 p-3 rounded-lg mb-3">
                        <p className="font-semibold text-slate-700">Total: {currency}{order.total.toFixed(2)}</p>
                        <div className="text-xs text-slate-500 mt-1">
                            <p>Subtotal: {currency}{(order.subtotal || 0).toFixed(2)}</p>
                            {order.gstAmount > 0 && <p>GST: +{currency}{order.gstAmount.toFixed(2)}</p>}
                            {order.shippingCharge > 0 && <p>Shipping: +{currency}{order.shippingCharge.toFixed(2)}</p>}
                        </div>
                    </div>
                    
                    <p>{order.address.name}, {order.address.street}</p>
                    <p>{order.address.city}, {order.address.state}, {order.address.zip}, {order.address.country}</p>
                    <p>{order.address.phone}</p>
                    <br />
                    <div className="flex items-center justify-between">
                        <span className={`px-4 py-1.5 rounded text-sm ${
                            order.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'SHIPPED'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-700'
                        }`}>
                            {order.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <span className="text-xs text-slate-400">
                            {order.paymentMethod === 'COD' ? 'COD' : 'Paid'}
                        </span>
                    </div>
                </td>
            </tr>
            <tr>
                <td colSpan={4}>
                    <div className="border-b border-slate-300 w-6/7 mx-auto" />
                </td>
            </tr>
        </>
    )
}

export default OrderItem
