'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Store, Phone, Mail, MapPin, Building2, CreditCard, Save, RefreshCw } from "lucide-react"
import ContentLoader from "@/components/ContentLoader"
import { toast } from "react-hot-toast"

export default function StoreSettings() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    
    const [storeInfo, setStoreInfo] = useState({
        name: '',
        description: '',
        email: '',
        contact: '',
        address: '',
        bankAccount: '',
        bankIfsc: '',
        bankName: '',
        bankUpi: ''
    })

    const fetchStoreInfo = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/info', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setStoreInfo({
                name: data.store.name || '',
                description: data.store.description || '',
                email: data.store.email || '',
                contact: data.store.contact || '',
                address: data.store.address || '',
                bankAccount: data.store.bankAccount || '',
                bankIfsc: data.store.bankIfsc || '',
                bankName: data.store.bankName || '',
                bankUpi: data.store.bankUpi || ''
            })
        } catch (error) {
            toast.error('Failed to fetch store info')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStoreInfo()
    }, [])

    const handleSave = async (e) => {
        e.preventDefault()
        
        if (!storeInfo.name || !storeInfo.description || !storeInfo.email || !storeInfo.contact || !storeInfo.address) {
            return toast.error('Please fill all required fields')
        }

        if (!storeInfo.bankAccount || !storeInfo.bankIfsc || !storeInfo.bankName) {
            return toast.error('Bank details are required')
        }

        try {
            setSaving(true)
            const token = await getToken()
            await axios.put('/api/store/info', storeInfo, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success('Store details updated!')
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to update')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field, value) => {
        setStoreInfo(prev => ({ ...prev, [field]: value }))
    }

    if (loading) return <ContentLoader />

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-800">Store Settings</h1>
                <p className="text-slate-500 mt-1">Update your store and bank details</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Store Details */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                    <h2 className="text-lg font-medium text-slate-700 flex items-center gap-2">
                        <Store size={20} />
                        Store Information
                    </h2>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1.5">Store Name *</label>
                        <input
                            type="text"
                            value={storeInfo.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1.5">Description *</label>
                        <textarea
                            value={storeInfo.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={3}
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400 resize-none"
                            required
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                                <Mail size={14} /> Email *
                            </label>
                            <input
                                type="email"
                                value={storeInfo.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                                <Phone size={14} /> Contact *
                            </label>
                            <input
                                type="text"
                                value={storeInfo.contact}
                                onChange={(e) => handleChange('contact', e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                            <MapPin size={14} /> Address *
                        </label>
                        <input
                            type="text"
                            value={storeInfo.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                            required
                        />
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                    <h2 className="text-lg font-medium text-slate-700 flex items-center gap-2">
                        <CreditCard size={20} />
                        Bank Details
                    </h2>

                    <div>
                        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                            <Building2 size={14} /> Bank Name *
                        </label>
                        <input
                            type="text"
                            value={storeInfo.bankName}
                            onChange={(e) => handleChange('bankName', e.target.value)}
                            placeholder="e.g., HDFC Bank"
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                            required
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1.5">Account Number *</label>
                            <input
                                type="text"
                                value={storeInfo.bankAccount}
                                onChange={(e) => handleChange('bankAccount', e.target.value)}
                                placeholder="1234567890123"
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400 font-mono"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1.5">IFSC Code *</label>
                            <input
                                type="text"
                                value={storeInfo.bankIfsc}
                                onChange={(e) => handleChange('bankIfsc', e.target.value.toUpperCase())}
                                placeholder="HDFC0001234"
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400 font-mono uppercase"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 mb-1.5">UPI ID (Optional)</label>
                        <input
                            type="text"
                            value={storeInfo.bankUpi}
                            onChange={(e) => handleChange('bankUpi', e.target.value)}
                            placeholder="yourstore@upi"
                            className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={fetchStoreInfo}
                        className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Reset
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
