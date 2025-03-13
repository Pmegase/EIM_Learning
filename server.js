const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json()); // Parses JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded form data

// 📌 POST route for sending email
app.post('/send-email', async (req, res) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.office365.com", // Office 365 SMTP server
        port: 587, // Use port 587 for TLS (recommended)
        secure: false, // Must be false for TLS
        auth: {
            user: process.env.EMAIL_USER, // Your Office 365 email
            pass: process.env.EMAIL_PASS  // Your Office 365 password or App Password
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender email
        to: 'eimconsultld@gmail.com', // Recipient email
        subject: req.body.subject || "No Subject", // Email subject (handle missing subject)
        text: `Message from: ${req.body.first_name || "Unknown"} ${req.body.last_name || ""} (${req.body.email || "No Email"})\n\n${req.body.message || "No Message"}` // Email body
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Email sent successfully!', info: info.response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}/`);
});
