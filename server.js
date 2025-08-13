const express = require('express');
const cors = require('cors'); 
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config(); 
const multer = require('multer');
const upload = multer();
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist')));





app.post('/send-email',(req, res) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Use environment variable
            pass: process.env.EMAIL_PASS  // Use environment variable
        }
    });

    // In your app.post('/send-email', ...) route
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: 'info@eimconsultld.com',
		subject: req.body.subject,
		// Change these lines to use camelCase
		text: `Message from: ${req.body.firstName} ${req.body.lastName} (${req.body.email})\n\n${req.body.message}`
	};

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending email: ' + error.message);
        }
        res.send('Email sent: ' + info.response);
    });
});

// IMPORTANT: Add this catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
