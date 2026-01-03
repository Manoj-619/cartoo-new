import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchProducts = createAsyncThunk('product/fetchProducts', 
    async ({ storeId }, thunkAPI) => {
        try {
            const { data } = await axios.get('/api/products' + (storeId ? `?storeId=${storeId}` : ''))
            return data.products
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || { error: error.message })
        }
    }
)

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        loading: true,
        error: null
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload
            state.loading = false
        },
        clearProduct: (state) => {
            state.list = []
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        }
    },
    extraReducers: (builder)=>{
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.list = action.payload
                state.loading = false
                state.error = null
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload?.error || 'Failed to fetch products'
            })
    }
})

export const { setProduct, clearProduct, setLoading } = productSlice.actions

export default productSlice.reducer
