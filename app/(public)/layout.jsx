'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { useUser, useAuth } from "@clerk/nextjs";
import { fetchCart, uploadCart } from "@/lib/features/cart/cartSlice";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";

export default function PublicLayout({ children }) {

    const dispatch = useDispatch()
    const {user} = useUser()
    const {getToken} = useAuth()
    const isFirstRender = useRef(true)

    const {cartItems, initialized} = useSelector((state)=>state.cart)

    useEffect(()=>{
        dispatch(fetchProducts({}))
    },[])

    // Fetch cart from DB when user logs in
    useEffect(()=>{
        if(user){
            dispatch(fetchCart({getToken}))
            dispatch(fetchAddress({getToken}))
            dispatch(fetchUserRatings({getToken}))
        }
    },[user])

    // Sync cart to DB when cart changes (skip first render to avoid overwriting with empty cart)
    useEffect(()=>{
        if(user && initialized){
            // Skip first render after initialization to avoid double sync
            if(isFirstRender.current){
                isFirstRender.current = false
                return
            }
            dispatch(uploadCart({getToken, cartItems}))
        }
    },[cartItems])

    // Reset first render flag when user changes
    useEffect(()=>{
        isFirstRender.current = true
    },[user])

    return (
        <>
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
