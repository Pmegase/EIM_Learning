const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/send-email', (req, res) => {
    // Create a Nodemailer transporter using SMTP
    let transporter = nodemailer.createTransport({
        // If using Gmail, for example
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com', // Your email
            pass: 'your-password' // Your password
        }
    });

    // Setup email data
    const mailOptions = {
        from: 'your-email@gmail.com', // sender address
        to: 'eimconsultld@gmail.com', // list of receivers
        subject: req.body.Subject, // Subject line
        text: `Message from: ${req.body.FirstName} ${req.body.LastName} (${req.body.Email})\n\n${req.body.Message}` // plain text body
    };

    // Send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending email: ' + error.message);
        }
        res.send('Email sent: ' + info.response);
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
