const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config(); 
const multer = require('multer');
const upload = multer();
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure environment variables are loaded

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
        subject: req.body.subject, // Email subject
        text: `Message from: ${req.body.first_name} ${req.body.last_name} (${req.body.email})\n\n${req.body.message}`
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        res.send('Email sent: ' + info.response);
    } catch (error) {
        res.status(500).send('Error sending email: ' + error.message);
    }
});



/**app.post('/send-email',(req, res) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Use environment variable
            pass: process.env.EMAIL_PASS  // Use environment variable
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER, // sender address
        to: 'eimconsultld@gmail.com', // list of receivers
        subject: req.body.subject, // Subject line
        text: `Message from: ${req.body.first_name} ${req.body.last_name} (${req.body.email})\n\n${req.body.message}` // plain text body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending email: ' + error.message);
        }
        res.send('Email sent: ' + info.response);
    });
}); **/

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
