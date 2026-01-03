'use client'
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Package, Truck, CheckCircle, Clock, X, ChevronDown } from "lucide-react"
import Image from "next/image"
import ContentLoader from "@/components/ContentLoader"
import { toast } from "react-hot-toast"

const statusOptions = [
    { value: 'ORDER_PLACED', label: 'Order Placed', icon: Clock, color: 'bg-blue-100 text-blue-700' },
    { value: 'PROCESSING', label: 'Processing', icon: Package, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'SHIPPED', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-700' },
    { value: 'DELIVERED', label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
]

export default function MasterStoreOrders() {
    const { storeId } = useParams()
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState([])
    const [filterStatus, setFilterStatus] = useState('all')
    
    // Order detail modal
    const [selectedOrder, setSelectedOrder] = useState(null)

    const fetchOrders = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get(`/api/master/orders?storeId=${storeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setOrders(data.orders)
        } catch (error) {
            toast.error('Failed to fetch orders')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [storeId])

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = await getToken()
            await axios.put('/api/master/orders', {
                orderId,
                status: newStatus
            }, { headers: { Authorization: `Bearer ${token}` } })
            
            setOrders(prev => prev.map(o => 
                o.id === orderId ? { ...o, status: newStatus } : o
            ))
            toast.success('Order status updated')
        } catch (error) {
            toast.error('Failed to update order status')
        }
    }

    const filteredOrders = orders.filter(order => {
        if (filterStatus === 'all') return true
        return order.status === filterStatus
    })

    const getStatusConfig = (status) => {
        return statusOptions.find(s => s.value === status) || statusOptions[0]
    }

    if (loading) return <ContentLoader />

    return (
        <div className="max-w-5xl">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-800">Orders</h1>
                <p className="text-slate-500">{orders.length} total orders for this store</p>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                        filterStatus === 'all' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    All ({orders.length})
                </button>
                {statusOptions.map(status => {
                    const count = orders.filter(o => o.status === status.value).length
                    return (
                        <button
                            key={status.value}
                            onClick={() => setFilterStatus(status.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                                filterStatus === status.value 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {status.label} ({count})
                        </button>
                    )
                })}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.status)
                    const StatusIcon = statusConfig.icon
                    
                    return (
                        <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-slate-800">Order #{order.id.slice(-8).toUpperCase()}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                            <StatusIcon size={12} className="inline mr-1" />
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={order.status}
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-purple-400"
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                                {order.orderItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Image 
                                            src={item.product.images[0]} 
                                            alt="" 
                                            width={40} 
                                            height={40}
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{item.product.name}</p>
                                            <p className="text-xs text-slate-500">Qty: {item.quantity} × {currency}{item.price}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex-1"></div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Total</p>
                                    <p className="text-lg font-semibold text-slate-800">{currency}{order.total.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {filteredOrders.length === 0 && (
                <p className="text-center text-slate-500 py-12">No orders found</p>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-slate-800">Order Details</h2>
                            <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Order Info */}
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-500">Order ID</p>
                                <p className="font-medium text-slate-800">{selectedOrder.id}</p>
                                <p className="text-sm text-slate-500 mt-2">Date</p>
                                <p className="font-medium text-slate-800">
                                    {new Date(selectedOrder.createdAt).toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500 mt-2">Payment Method</p>
                                <p className="font-medium text-slate-800">{selectedOrder.paymentMethod}</p>
                                <p className="text-sm text-slate-500 mt-2">Payment Status</p>
                                <p className={`font-medium ${selectedOrder.isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                                    {selectedOrder.isPaid ? 'Paid' : 'Pending'}
                                </p>
                            </div>

                            {/* Customer Info */}
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-slate-700 mb-2">Customer</p>
                                <div className="flex items-center gap-3">
                                    {selectedOrder.user?.image && (
                                        <Image src={selectedOrder.user.image} alt="" width={40} height={40} className="w-10 h-10 rounded-full" />
                                    )}
                                    <div>
                                        <p className="font-medium text-slate-800">{selectedOrder.user?.name}</p>
                                        <p className="text-sm text-slate-500">{selectedOrder.user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-slate-700 mb-2">Shipping Address</p>
                                <p className="text-slate-800">{selectedOrder.address?.name}</p>
                                <p className="text-slate-600">{selectedOrder.address?.street}</p>
                                <p className="text-slate-600">
                                    {selectedOrder.address?.city}, {selectedOrder.address?.state} {selectedOrder.address?.zip}
                                </p>
                                <p className="text-slate-600">{selectedOrder.address?.country}</p>
                                <p className="text-slate-500 mt-1">Phone: {selectedOrder.address?.phone}</p>
                            </div>

                            {/* Items */}
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-slate-700 mb-3">Items</p>
                                <div className="space-y-3">
                                    {selectedOrder.orderItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Image 
                                                    src={item.product.images[0]} 
                                                    alt="" 
                                                    width={48} 
                                                    height={48}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-800">{item.product.name}</p>
                                                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="font-medium">{currency}{(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200">
                                    <p className="font-semibold text-slate-800">Total</p>
                                    <p className="text-xl font-bold text-slate-800">{currency}{selectedOrder.total.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="w-full mt-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
