import * as Crypto from 'expo-crypto';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpvab3v9f";
const API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || "915544357637558";
const API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || "eQR7z9rrUXMTa2qjvScLyUdZrp4";

export const uploadImageToCloudinary = async (imageUri) => {
    if (!imageUri) return null;

    console.log('Cloudinary Config:', {
        cloudName: CLOUD_NAME,
        apiKey: API_KEY ? 'Present' : 'Missing',
        apiSecret: API_SECRET ? 'Present' : 'Missing'
    });

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
        console.error('Missing Cloudinary configuration');
        throw new Error('Missing Cloudinary configuration');
    }

    try {
        const timestamp = Math.round((new Date()).getTime() / 1000);
        const params = {
            timestamp: timestamp,
            folder: 'fitmaker_blogs', // Optional: organize in folder
        };

        // Generate signature
        // Sort keys and create string
        const sortedKeys = Object.keys(params).sort();
        const stringToSign = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + API_SECRET;

        const signature = await Crypto.digestStringAsync(
            'SHA-1',
            stringToSign
        );

        // Create form data
        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg', // Adjust based on file type if possible, or just use jpeg
            name: 'upload.jpg',
        });
        formData.append('api_key', API_KEY);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', 'fitmaker_blogs'); // Must match signed params

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.secure_url) {
            return data.secure_url;
        } else {
            console.error('Cloudinary upload error:', data);
            throw new Error(data.error?.message || 'Failed to upload image');
        }
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};
