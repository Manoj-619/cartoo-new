import { currentUser } from '@clerk/nextjs/server';

// Master vendor emails - can manage all stores
// Configure via MASTER_VENDOR_EMAILS env variable (comma-separated)
// Falls back to hardcoded list if env not set
const getDefaultMasterEmails = () => [
    'eswaricartoo123@gmail.com',
    'yuvi2k22@gmail.com',
    'chrismanoj62@gmail.com'
]

const MASTER_VENDOR_EMAILS = process.env.MASTER_VENDOR_EMAILS 
    ? process.env.MASTER_VENDOR_EMAILS.split(',').map(e => e.trim())
    : getDefaultMasterEmails()

/**
 * Check if the current user is a master vendor
 * @param {string} userId - The user ID from Clerk
 * @returns {Promise<boolean>} - True if user is a master vendor
 */
export const isMasterVendor = async (userId) => {
    try {
        if (!userId) return false
        
        const user = await currentUser()
        if (!user) return false
        
        const userEmail = user.emailAddresses?.[0]?.emailAddress
        return MASTER_VENDOR_EMAILS.includes(userEmail)
    } catch (error) {
        console.error('Error checking master vendor:', error)
        return false
    }
}

/**
 * Check if email is a master vendor (for use in API routes)
 * @param {string} email - The user's email
 * @returns {boolean} - True if email is a master vendor
 */
export const isMasterVendorEmail = (email) => {
    return MASTER_VENDOR_EMAILS.includes(email)
}

/**
 * Get master vendor emails list
 * @returns {string[]} - Array of master vendor emails
 */
export const getMasterVendorEmails = () => {
    return MASTER_VENDOR_EMAILS
}

export default isMasterVendor
