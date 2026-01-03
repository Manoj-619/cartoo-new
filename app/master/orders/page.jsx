'use client'
import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { 
    Package, Truck, CheckCircle, Clock, X, 
    TrendingUp, IndianRupee, Store as StoreIcon, Search
} from "lucide-react"
import Image from "next/image"
import Loading from "@/components/Loading"
import { toast } from "react-hot-toast"

const statusOptions = [
    { value: 'ORDER_PLACED', label: 'Order Placed', icon: Clock, color: 'bg-blue-100 text-blue-700' },
    { value: 'PROCESSING', label: 'Processing', icon: Package, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'SHIPPED', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-700' },
    { value: 'DELIVERED', label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
]


export default function MasterAllOrders() {
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState([])
    const [stores, setStores] = useState([])
    const [financials, setFinancials] = useState({})
    const [vendorBreakdown, setVendorBreakdown] = useState([])
    
    // Filters
    const [filterStore, setFilterStore] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    
    // Order detail modal
    const [selectedOrder, setSelectedOrder] = useState(null)
    // Vendor breakdown modal
    const [showVendorBreakdown, setShowVendorBreakdown] = useState(false)

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const token = await getToken()
            
            const params = new URLSearchParams()
            if (filterStore !== 'all') params.append('storeId', filterStore)
            if (filterStatus !== 'all') params.append('status', filterStatus)
            
            const { data } = await axios.get(`/api/master/all-orders?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            setOrders(data.orders)
            setStores(data.stores)
            setFinancials(data.financials)
            setVendorBreakdown(data.vendorBreakdown)
        } catch (error) {
            toast.error('Failed to fetch orders')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [filterStore, filterStatus])

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

    // Filter orders by search query
    const filteredOrders = useMemo(() => {
        if (!searchQuery) return orders
        const query = searchQuery.toLowerCase()
        return orders.filter(order => 
            order.id.toLowerCase().includes(query) ||
            order.user?.name?.toLowerCase().includes(query) ||
            order.user?.email?.toLowerCase().includes(query) ||
            order.store?.name?.toLowerCase().includes(query)
        )
    }, [orders, searchQuery])

    const getStatusConfig = (status) => {
        return statusOptions.find(s => s.value === status) || statusOptions[0]
    }

    // Get selected vendor financials
    const selectedVendorFinancials = useMemo(() => {
        if (filterStore === 'all') return null
        return vendorBreakdown.find(v => v.store?.id === filterStore)
    }, [filterStore, vendorBreakdown])

    if (loading) return <Loading />

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">All Orders</h1>
                <p className="text-slate-500 mt-1">Manage orders across all vendors</p>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 sm:p-2.5 bg-purple-100 rounded-lg">
                            <TrendingUp size={20} className="text-purple-600" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500">Total Revenue</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-800">
                        {currency}{(selectedVendorFinancials?.totalRevenue || financials.totalRevenue || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                        {selectedVendorFinancials?.totalOrders || financials.totalOrders || 0} orders
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 sm:p-2.5 bg-green-100 rounded-lg">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500">Delivered</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {currency}{(financials.deliveredRevenue || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                        {financials.deliveredOrders || 0} orders delivered
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 sm:p-2.5 bg-orange-100 rounded-lg">
                            <Truck size={20} className="text-orange-600" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500">In Transit</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">
                        {financials.shippedOrders || 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                        Orders shipped
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg">
                            <IndianRupee size={20} className="text-blue-600" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500">GST Collected</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {currency}{(selectedVendorFinancials?.gstCollected || financials.totalGst || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                        Tax amount
                    </p>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 sm:p-5 text-white">
                    <p className="text-xs sm:text-sm opacity-80">Average Order Value</p>
                    <p className="text-lg sm:text-xl font-bold mt-1.5">{currency}{(financials.averageOrderValue || 0).toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 sm:p-5 text-white">
                    <p className="text-xs sm:text-sm opacity-80">Delivered Orders</p>
                    <p className="text-lg sm:text-xl font-bold mt-1.5">{financials.deliveredOrders || 0}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-5 text-white">
                    <p className="text-xs sm:text-sm opacity-80">Processing</p>
                    <p className="text-lg sm:text-xl font-bold mt-1.5">{financials.processingOrders || 0}</p>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 sm:p-5 text-white">
                    <p className="text-xs sm:text-sm opacity-80">Subtotal (excl. GST)</p>
                    <p className="text-lg sm:text-xl font-bold mt-1.5">{currency}{(financials.totalSubtotal || 0).toFixed(2)}</p>
                </div>
            </div>

            {/* Vendor Breakdown Button */}
            {filterStore === 'all' && vendorBreakdown.length > 0 && (
                <button
                    onClick={() => setShowVendorBreakdown(true)}
                    className="mb-6 px-4 py-2.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition flex items-center gap-2"
                >
                    <StoreIcon size={16} />
                    View Vendor-wise Breakdown ({vendorBreakdown.length} vendors)
                </button>
            )}

            {/* Filters Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 mb-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                    {/* Search */}
                    <div className="flex-1 min-w-0">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by order ID, customer name, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 text-sm"
                            />
                        </div>
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap gap-3">
                        {/* Store Filter */}
                        <select
                            value={filterStore}
                            onChange={(e) => setFilterStore(e.target.value)}
                            className="px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white text-sm min-w-[140px]"
                        >
                            <option value="all">All Vendors</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white text-sm min-w-[130px]"
                        >
                            <option value="all">All Status</option>
                            {statusOptions.map(status => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Status Quick Filters */}
            <div className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
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
                        <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 lg:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-slate-800">Order #{order.id.slice(-8).toUpperCase()}</p>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                            <StatusIcon size={12} className="inline mr-1" />
                                            {statusConfig.label}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Paid
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                    {/* Vendor Info */}
                                    <div className="flex items-center gap-2">
                                        {order.store?.logo ? (
                                            <Image src={order.store.logo} alt="" width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-semibold">
                                                {order.store?.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-sm text-slate-500">{order.store?.name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={order.status}
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                        className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-purple-400 bg-white"
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                                {order.orderItems.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <Image 
                                            src={item.product?.images?.[0] || '/placeholder.png'} 
                                            alt="" 
                                            width={44} 
                                            height={44}
                                            className="w-11 h-11 rounded-lg object-cover"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 truncate max-w-[140px] sm:max-w-[180px]">{item.product?.name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity} × {currency}{item.price}</p>
                                        </div>
                                    </div>
                                ))}
                                {order.orderItems.length > 3 && (
                                    <div className="flex items-center text-sm text-slate-500 px-2">
                                        +{order.orderItems.length - 3} more
                                    </div>
                                )}
                                <div className="flex-1 min-w-[60px]"></div>
                                <div className="text-right ml-auto">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
                                    <p className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5">{currency}{order.total.toFixed(2)}</p>
                                    <p className="text-xs text-green-600 mt-0.5">Paid via Razorpay</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {filteredOrders.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                    <Package size={56} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 text-lg">No orders found</p>
                    <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
                </div>
            )}

            {/* Vendor Breakdown Modal */}
            {showVendorBreakdown && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Vendor-wise Breakdown</h2>
                                <p className="text-sm text-slate-500 mt-1">{vendorBreakdown.length} vendors with orders</p>
                            </div>
                            <button 
                                onClick={() => setShowVendorBreakdown(false)} 
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {vendorBreakdown.map((vendor, idx) => (
                                <div key={idx} className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 pb-4 border-b border-slate-200">
                                        <div className="flex items-center gap-3 flex-1">
                                            {vendor.store?.logo ? (
                                                <Image src={vendor.store.logo} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-lg">
                                                    {vendor.store?.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-slate-800">{vendor.store?.name}</p>
                                                <p className="text-sm text-slate-500">@{vendor.store?.username}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setFilterStore(vendor.store?.id)
                                                setShowVendorBreakdown(false)
                                            }}
                                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition whitespace-nowrap"
                                        >
                                            View Orders
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="text-xs text-slate-500 mb-1">Total Orders</p>
                                            <p className="text-lg font-bold text-slate-800">{vendor.totalOrders}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
                                            <p className="text-lg font-bold text-slate-800">{currency}{vendor.totalRevenue.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="text-xs text-slate-500 mb-1">GST Collected</p>
                                            <p className="text-lg font-bold text-blue-600">{currency}{vendor.gstCollected.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3">
                                            <p className="text-xs text-slate-500 mb-1">Delivered</p>
                                            <p className="text-lg font-bold text-green-600">{vendor.deliveredOrders}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowVendorBreakdown(false)}
                            className="w-full mt-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Order Details</h2>
                                <p className="text-sm text-slate-500 mt-1">#{selectedOrder.id.slice(-8).toUpperCase()}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)} 
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Order Info */}
                            <div className="p-4 sm:p-5 bg-slate-50 rounded-xl">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Date</p>
                                        <p className="font-medium text-slate-800 text-sm">
                                            {new Date(selectedOrder.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Payment</p>
                                        <p className="font-medium text-green-600 text-sm">Paid via Razorpay</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Order Status</p>
                                        <p className="font-medium text-slate-800 text-sm">{getStatusConfig(selectedOrder.status).label}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Razorpay ID</p>
                                        <p className="font-medium text-slate-800 text-sm truncate">{selectedOrder.razorpayPaymentId || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Vendor Info */}
                            <div className="p-4 sm:p-5 bg-purple-50 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Vendor</p>
                                <div className="flex items-center gap-3">
                                    {selectedOrder.store?.logo ? (
                                        <Image src={selectedOrder.store.logo} alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 font-semibold">
                                            {selectedOrder.store?.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-slate-800">{selectedOrder.store?.name}</p>
                                        <p className="text-sm text-slate-500">@{selectedOrder.store?.username}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="p-4 sm:p-5 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Customer</p>
                                <div className="flex items-center gap-3">
                                    {selectedOrder.user?.image && (
                                        <Image src={selectedOrder.user.image} alt="" width={44} height={44} className="w-11 h-11 rounded-full" />
                                    )}
                                    <div>
                                        <p className="font-semibold text-slate-800">{selectedOrder.user?.name}</p>
                                        <p className="text-sm text-slate-500">{selectedOrder.user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="p-4 sm:p-5 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Shipping Address</p>
                                <div className="space-y-1">
                                    <p className="font-medium text-slate-800">{selectedOrder.address?.name}</p>
                                    <p className="text-slate-600 text-sm">{selectedOrder.address?.street}</p>
                                    <p className="text-slate-600 text-sm">
                                        {selectedOrder.address?.city}, {selectedOrder.address?.state} {selectedOrder.address?.zip}
                                    </p>
                                    <p className="text-slate-600 text-sm">{selectedOrder.address?.country}</p>
                                    <p className="text-slate-500 text-sm pt-1">📞 {selectedOrder.address?.phone}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="p-4 sm:p-5 bg-slate-50 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-4">Items</p>
                                <div className="space-y-4">
                                    {selectedOrder.orderItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Image 
                                                    src={item.product?.images?.[0] || '/placeholder.png'} 
                                                    alt="" 
                                                    width={52} 
                                                    height={52}
                                                    className="w-13 h-13 rounded-lg object-cover flex-shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-800 truncate">{item.product?.name}</p>
                                                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-slate-800 whitespace-nowrap">{currency}{(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Price Breakdown */}
                                <div className="mt-5 pt-4 border-t border-slate-200 space-y-2.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Subtotal</span>
                                        <span className="text-slate-700 font-medium">{currency}{(selectedOrder.subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">GST</span>
                                        <span className="text-slate-700 font-medium">{currency}{(selectedOrder.gstAmount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Shipping</span>
                                        <span className="text-slate-700 font-medium">{currency}{(selectedOrder.shippingCharge || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200">
                                        <p className="font-semibold text-slate-800">Total</p>
                                        <p className="text-xl sm:text-2xl font-bold text-slate-800">{currency}{selectedOrder.total.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="w-full mt-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
