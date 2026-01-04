'use client'
import { useState } from "react"
import Image from "next/image"
import { MapPin, Mail, Phone, Building2, CreditCard, ChevronDown, ChevronUp } from "lucide-react"

const StoreInfo = ({store, showBankDetails = true}) => {
    const [bankDetailsOpen, setBankDetailsOpen] = useState(false)

    return (
        <div className="flex-1 space-y-2 text-sm">
            {store.logo ? (
                <Image width={100} height={100} src={store.logo} alt={store.name} className="max-w-20 max-h-20 object-contain shadow rounded-full max-sm:mx-auto" />
            ) : (
                <div className="max-w-20 max-h-20 w-20 h-20 rounded-full shadow bg-slate-200 flex items-center justify-center text-slate-500 text-2xl font-semibold max-sm:mx-auto">
                    {store.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <h3 className="text-xl font-semibold text-slate-800"> {store.name} </h3>
                <span className="text-sm">@{store.username}</span>

                {/* Status Badge */}
                <span
                    className={`text-xs font-semibold px-4 py-1 rounded-full ${store.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : store.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}
                >
                    {store.status}
                </span>
            </div>

            <p className="text-slate-600 my-5 max-w-2xl">{store.description}</p>
            <p className="flex items-center gap-2"> <MapPin size={16} /> {store.address}</p>
            <p className="flex items-center gap-2"><Phone size={16} /> {store.contact}</p>
            <p className="flex items-center gap-2"><Mail size={16} />  {store.email}</p>

            {/* Bank Details Section */}
            {showBankDetails && (store.bankAccount || store.bankIfsc || store.bankName || store.bankUpi) && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <button 
                        onClick={() => setBankDetailsOpen(!bankDetailsOpen)}
                        className="flex items-center gap-2 text-slate-700 font-medium hover:text-slate-900 transition"
                    >
                        <CreditCard size={16} />
                        Bank Details
                        {bankDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {bankDetailsOpen && (
                        <div className="mt-3 p-4 bg-slate-50 rounded-lg space-y-2">
                            {store.bankName && (
                                <div className="flex items-start gap-2">
                                    <Building2 size={16} className="text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-400">Bank Name</p>
                                        <p className="text-slate-700 font-medium">{store.bankName}</p>
                                    </div>
                                </div>
                            )}
                            {store.bankAccount && (
                                <div className="flex items-start gap-2">
                                    <CreditCard size={16} className="text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-400">Account Number</p>
                                        <p className="text-slate-700 font-medium font-mono">{store.bankAccount}</p>
                                    </div>
                                </div>
                            )}
                            {store.bankIfsc && (
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-400 text-xs font-bold w-4">IF</span>
                                    <div>
                                        <p className="text-xs text-slate-400">IFSC Code</p>
                                        <p className="text-slate-700 font-medium font-mono">{store.bankIfsc}</p>
                                    </div>
                                </div>
                            )}
                            {store.bankUpi && (
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-400 text-xs font-bold w-4">@</span>
                                    <div>
                                        <p className="text-xs text-slate-400">UPI ID</p>
                                        <p className="text-slate-700 font-medium">{store.bankUpi}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <p className="text-slate-700 mt-5">Applied on <span className="text-xs">{new Date(store.createdAt).toLocaleDateString()}</span> by</p>
            <div className="flex items-center gap-2 text-sm ">
                <Image width={36} height={36} src={store.user.image} alt={store.user.name} className="w-9 h-9 rounded-full" />
                <div>
                    <p className="text-slate-600 font-medium">{store.user.name}</p>
                    <p className="text-slate-400">{store.user.email}</p>
                </div>
            </div>
        </div>
    )
}

export default StoreInfo