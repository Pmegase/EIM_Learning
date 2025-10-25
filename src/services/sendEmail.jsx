// src/services/sendEmail.js
import { apiClient } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';

const sendEmail = async (formData) => {
    try {
        console.log('Sending email with data:', formData);

        const response = await apiClient.post(API_ENDPOINTS.EMAIL, formData);

        console.log('Email sent successfully:', response);
        return response;
    } catch (error) {
        console.error("Error sending email:", error);

        // Enhanced error handling with specific messages
        let errorMessage = 'Failed to send email';

        if (error.message) {
            errorMessage = error.message;
        } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        }

        throw new Error(errorMessage);
    }
};

export default sendEmail;