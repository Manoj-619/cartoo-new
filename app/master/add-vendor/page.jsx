'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { UserPlus, ArrowLeft, Upload } from "lucide-react"
import Image from "next/image"
import { assets } from "@/assets/assets"
import { toast } from "react-hot-toast"
import MasterLayout from "@/components/master/MasterLayout"

export default function MasterAddVendor() {
    const router = useRouter()
    const { getToken } = useAuth()
    
    const [loading, setLoading] = useState(false)
    const [logo, setLogo] = useState(null)
    const [autoApprove, setAutoApprove] = useState(true)
    
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        description: "",
        email: "",
        contact: "",
        address: "",
        bankAccount: "",
        bankIfsc: "",
        bankName: "",
        bankUpi: ""
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.name || !formData.username || !formData.email || !formData.contact || !formData.address || !formData.description) {
            return toast.error("Please fill all required fields")
        }

        if (!formData.bankAccount || !formData.bankIfsc || !formData.bankName) {
            return toast.error("Bank details are required")
        }

        setLoading(true)
        
        try {
            const token = await getToken()
            const data = new FormData()
            
            data.append("name", formData.name)
            data.append("username", formData.username)
            data.append("description", formData.description)
            data.append("email", formData.email)
            data.append("contact", formData.contact)
            data.append("address", formData.address)
            data.append("bankAccount", formData.bankAccount)
            data.append("bankIfsc", formData.bankIfsc)
            data.append("bankName", formData.bankName)
            data.append("bankUpi", formData.bankUpi)
            data.append("autoApprove", autoApprove.toString())
            
            if (logo) {
                data.append("image", logo)
            }

            const response = await axios.post('/api/master/vendor', data, {
                headers: { Authorization: `Bearer ${token}` }
            })

            toast.success(response.data.message)
            router.push('/master/stores')
            
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <MasterLayout>
            <div className="max-w-2xl">
                <button 
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <div className="flex items-center gap-3 mb-2">
                    <UserPlus className="text-purple-600" size={28} />
                    <h1 className="text-2xl font-semibold text-slate-800">Add New Vendor</h1>
                </div>
                <p className="text-slate-500 mb-6">Create a new vendor store on behalf of a seller</p>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    {/* Logo Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Store Logo</label>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer">
                                <Image
                                    src={logo ? URL.createObjectURL(logo) : assets.upload_area}
                                    alt=""
                                    width={80}
                                    height={80}
                                    className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setLogo(e.target.files[0])}
                                    className="hidden"
                                />
                            </label>
                            <div className="text-sm text-slate-500">
                                <p>Click to upload logo</p>
                                <p className="text-xs text-slate-400">PNG, JPG up to 2MB</p>
                            </div>
                        </div>
                    </div>

                    {/* Store Name & Username */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Store Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Tech Store"
                                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Username <span className="text-red-400">*</span>
                            </label>
                            <div className="flex items-center">
                                <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500">@</span>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="techstore"
                                    className="w-full p-2.5 border border-slate-200 rounded-r-lg outline-none focus:border-purple-400"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email & Contact */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="vendor@example.com"
                                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Contact Number <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="contact"
                                value={formData.contact}
                                onChange={handleChange}
                                placeholder="+91 9876543210"
                                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400"
                                required
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Address <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="123 Main St, City, State - 123456"
                            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Brief description about the store..."
                            rows={3}
                            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 resize-none"
                            required
                        />
                    </div>

                    {/* Bank Details Section */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-medium text-slate-700 mb-1">Bank Details</h3>
                        <p className="text-sm text-slate-500 mb-4">Required for payment settlements</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Account Holder Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    placeholder="Enter account holder name"
                                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white"
                                    required
                                />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Account Number <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="bankAccount"
                                        value={formData.bankAccount}
                                        onChange={handleChange}
                                        placeholder="Enter account number"
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        IFSC Code <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="bankIfsc"
                                        value={formData.bankIfsc}
                                        onChange={handleChange}
                                        placeholder="e.g., SBIN0001234"
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    UPI ID <span className="text-slate-400 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="bankUpi"
                                    value={formData.bankUpi}
                                    onChange={handleChange}
                                    placeholder="e.g., yourname@upi"
                                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Auto Approve Toggle */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <p className="font-medium text-slate-700">Auto-approve store</p>
                                <p className="text-sm text-slate-500">Store will be active immediately after creation</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={autoApprove}
                                    onChange={(e) => setAutoApprove(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-purple-600 transition"></div>
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
                            </div>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Creating Vendor...' : 'Create Vendor'}
                    </button>
                </form>
            </div>
        </MasterLayout>
    )
}
