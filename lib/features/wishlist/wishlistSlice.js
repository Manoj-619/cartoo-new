import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

// Fetch user's wishlist
export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist',
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
            return data
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message)
        }
    }
)

// Add item to wishlist
export const addToWishlist = createAsyncThunk('wishlist/addToWishlist',
    async ({ productId, getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            await axios.post('/api/wishlist', { productId }, { headers: { Authorization: `Bearer ${token}` } })
            return productId
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message)
        }
    }
)

// Remove item from wishlist
export const removeFromWishlist = createAsyncThunk('wishlist/removeFromWishlist',
    async ({ productId, getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            await axios.delete(`/api/wishlist?productId=${productId}`, { headers: { Authorization: `Bearer ${token}` } })
            return productId
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message)
        }
    }
)

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        items: [],
        productIds: [],
        loading: false,
        error: null
    },
    reducers: {
        clearWishlist: (state) => {
            state.items = []
            state.productIds = []
        }
    },
    extraReducers: (builder) => {
        // Fetch wishlist
        builder.addCase(fetchWishlist.pending, (state) => {
            state.loading = true
            state.error = null
        })
        builder.addCase(fetchWishlist.fulfilled, (state, action) => {
            state.loading = false
            state.items = action.payload.wishlist
            state.productIds = action.payload.productIds
        })
        builder.addCase(fetchWishlist.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
        })

        // Add to wishlist
        builder.addCase(addToWishlist.fulfilled, (state, action) => {
            if (!state.productIds.includes(action.payload)) {
                state.productIds.push(action.payload)
            }
        })

        // Remove from wishlist
        builder.addCase(removeFromWishlist.fulfilled, (state, action) => {
            state.productIds = state.productIds.filter(id => id !== action.payload)
            state.items = state.items.filter(item => item.productId !== action.payload)
        })
    }
})

export const { clearWishlist } = wishlistSlice.actions

export default wishlistSlice.reducer
