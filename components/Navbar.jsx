'use client'
import { PackageIcon, Search, ShoppingCart, Heart, LayoutDashboard, Store, Briefcase } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {useUser, useClerk, UserButton, Protect, useAuth} from "@clerk/nextjs"
import { assets } from "@/assets/assets";
import { fetchWishlist } from "@/lib/features/wishlist/wishlistSlice";
import axios from "axios";

const Navbar = () => {

    const {user} = useUser()
    const {openSignIn} = useClerk()
    const { getToken, isSignedIn } = useAuth()
    const router = useRouter();
    const dispatch = useDispatch()

    const [search, setSearch] = useState('')
    const [isMaster, setIsMaster] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSeller, setIsSeller] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(true);

    const cartCount = useSelector(state => state.cart.total)
    const wishlistCount = useSelector(state => state.wishlist.productIds.length)

    // Fetch wishlist when user signs in
    useEffect(() => {
        if (isSignedIn) {
            dispatch(fetchWishlist({ getToken }))
        }
    }, [isSignedIn, dispatch, getToken])

    // Fetch user roles
    useEffect(() => {
        if (isSignedIn) {
            const fetchRoles = async () => {
                setLoadingRoles(true);
                try {
                    const token = await getToken();
                    const headers = { Authorization: `Bearer ${token}` };

                    const [masterRes, adminRes, sellerRes] = await Promise.all([
                        axios.get('/api/master/is-master', { headers }).catch(e => ({ data: { isMaster: false } })),
                        axios.get('/api/admin/is-admin', { headers }).catch(e => ({ data: { isAdmin: false } })),
                        axios.get('/api/store/is-seller', { headers }).catch(e => ({ data: { isSeller: false } }))
                    ]);

                    setIsMaster(masterRes.data.isMaster);
                    setIsAdmin(adminRes.data.isAdmin);
                    setIsSeller(sellerRes.data.isSeller);

                } catch (error) {
                    console.error("Error fetching user roles:", error);
                } finally {
                    setLoadingRoles(false);
                }
            };
            fetchRoles();
        } else {
            setIsMaster(false);
            setIsAdmin(false);
            setIsSeller(false);
            setLoadingRoles(false);
        }
    }, [isSignedIn, getToken]);

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/shop?search=${search}`)
    }

    // Build role-based menu items
    const roleMenuItems = [];

    // Show Master Dashboard if user is a master vendor
    if (isMaster) {
        roleMenuItems.push(
            <UserButton.Action 
                key="master"
                labelIcon={<LayoutDashboard size={16}/>} 
                label="Master Dashboard" 
                onClick={() => router.push('/master')} 
            />
        );
    }

    // Show Admin Dashboard if user is an admin
    if (isAdmin) {
        roleMenuItems.push(
            <UserButton.Action 
                key="admin"
                labelIcon={<LayoutDashboard size={16}/>} 
                label="Admin Dashboard" 
                onClick={() => router.push('/admin')} 
            />
        );
    }

    // Show My Store if user is a seller
    if (isSeller) {
        roleMenuItems.push(
            <UserButton.Action 
                key="seller"
                labelIcon={<Store size={16}/>} 
                label="My Store" 
                onClick={() => router.push('/store')} 
            />
        );
    }

    // Show Become a Vendor only if not loading and user has no vendor role
    if (!loadingRoles && !isMaster && !isSeller) {
        roleMenuItems.push(
            <UserButton.Action 
                key="vendor"
                labelIcon={<Briefcase size={16}/>} 
                label="Become a Vendor" 
                onClick={() => router.push('/create-store')} 
            />
        );
    }

    return (
        <nav className="relative bg-white">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4  transition-all">

                    <Link href="/" className="relative">
                        <Image src={assets.cartoo_logo} alt="Cartoo" className="h-16 w-auto" />
                        <Protect plan='plus'>
                             <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                            plus
                            </p>
                        </Protect>
                       
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
                        <Link href="/">Home</Link>
                        <Link href="/shop">Shop</Link>
                        <Link href="/">About</Link>
                        <Link href="/">Contact</Link>

                        <form onSubmit={handleSearch} className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full">
                            <Search size={18} className="text-slate-600" />
                            <input className="w-full bg-transparent outline-none placeholder-slate-600" type="text" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} required />
                        </form>

                        <Link href="/wishlist" className="relative flex items-center gap-2 text-slate-600">
                            <Heart size={18} />
                            Wishlist
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 left-3 text-[8px] text-white bg-red-500 size-3.5 rounded-full flex items-center justify-center">{wishlistCount}</span>
                            )}
                        </Link>

                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600">
                            <ShoppingCart size={18} />
                            Cart
                            <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{cartCount}</button>
                        </Link>

                    {
                        !user ? (
                            <button onClick={openSignIn} className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full">
                            Login
                            </button>
                        ) : (
                            <UserButton>
                                <UserButton.MenuItems>
                                    {roleMenuItems}
                                    <UserButton.Action labelIcon={<PackageIcon size={16}/>} label="My Orders" onClick={()=> router.push('/orders')}/>
                                </UserButton.MenuItems>
                            </UserButton>
                        )
                    }
                        

                    </div>

                    {/* Mobile User Button  */}
                    <div className="sm:hidden">
                        { user ? (
                            <div>
                            <UserButton>
                                <UserButton.MenuItems>
                                    {roleMenuItems}
                                    <UserButton.Action labelIcon={<Heart size={16}/>} label="Wishlist" onClick={()=> router.push('/wishlist')}/>
                                    <UserButton.Action labelIcon={<ShoppingCart size={16}/>} label="Cart" onClick={()=> router.push('/cart')}/>
                                    <UserButton.Action labelIcon={<PackageIcon size={16}/>} label="My Orders" onClick={()=> router.push('/orders')}/>
                                </UserButton.MenuItems>
                            </UserButton>
                            </div>
                        ) : (
                            <button onClick={openSignIn} className="px-7 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition text-white rounded-full">
                            Login
                        </button>
                        )
                        }
                        
                    </div>
                </div>
            </div>
            <hr className="border-gray-300" />
        </nav>
    )
}

export default Navbar
