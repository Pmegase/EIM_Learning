const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📌 Email Route
app.post('/send-email', async (req, res) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: { ciphers: 'SSLv3' }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'eimconsultld@gmail.com',
        subject: req.body.subject || "No Subject",
        text: `Message from: ${req.body.first_name || "Unknown"} ${req.body.last_name || ""} (${req.body.email || "No Email"})\n\n${req.body.message || "No Message"}`
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Email sent successfully!', info: info.response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 📌 Required for Vercel
module.exports = app;
