import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

// Debounce timer for upload
let debounceTimer = null;

export const uploadCart = createAsyncThunk('cart/uploadCart', 
    async ({ getToken, cartItems }, thunkAPI) => {
        try {
            // Clear any existing timer
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            
            // Get cart items from state if not provided
            const cart = cartItems || thunkAPI.getState().cart.cartItems;
            
            // Debounce API call to avoid too many requests
            return new Promise((resolve, reject) => {
                debounceTimer = setTimeout(async () => {
                    try {
                        const token = await getToken();
                        if (token) {
                            await axios.post('/api/cart', { cart }, { 
                                headers: { Authorization: `Bearer ${token}` } 
                            });
                            resolve({ success: true });
                        } else {
                            resolve({ success: false });
                        }
                    } catch (error) {
                        console.error('Cart upload error:', error);
                        reject(error);
                    }
                }, 800);
            });
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchCart = createAsyncThunk('cart/fetchCart', 
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken();
            if (!token) {
                return { cart: {} };
            }
            
            const { data } = await axios.get('/api/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            return { cart: data.cart || {} };
        } catch (error) {
            console.error('Cart fetch error:', error);
            return { cart: {} };
        }
    }
);

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
        loading: false,
        initialized: false,
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload;
            if (state.cartItems[productId]) {
                state.cartItems[productId]++;
            } else {
                state.cartItems[productId] = 1;
            }
            state.total += 1;
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload;
            if (state.cartItems[productId]) {
                state.cartItems[productId]--;
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId];
                }
                state.total -= 1;
            }
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload;
            state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0;
            delete state.cartItems[productId];
        },
        clearCart: (state) => {
            state.cartItems = {};
            state.total = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                state.initialized = true;
                const cart = action.payload.cart || {};
                state.cartItems = cart;
                state.total = Object.values(cart).reduce((acc, item) => acc + (item || 0), 0);
            })
            .addCase(fetchCart.rejected, (state) => {
                state.loading = false;
                state.initialized = true;
            });
    }
});

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions;

export default cartSlice.reducer;
