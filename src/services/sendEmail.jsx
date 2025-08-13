import axios from "axios";
const baseUrl =  "https://eim-learning-backend.vercel.app/send-email";


    const sendEmail = async (formData) => {
        try {
        const response = await axios.post(baseUrl, formData);
        return response.data;
        } catch (error) {
        console.error("Error sending email:", error);
        throw error;
        }
    };
    

export default sendEmail;