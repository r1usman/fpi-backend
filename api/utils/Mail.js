
import nodemailer from "nodemailer"
export const transporter = nodemailer.createTransport({
    Service: "email",
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for port 465, false for other ports
    auth: {
        user: "alishah19477.as@gmail.com", // your Gmail account
        pass: "xguwsazrpqqtielp", // App Password (not your regular Gmail password)
    }
});

// var mailOptions = {
//     from: {
//         name: "Ali",
//         address: "alishah19477.as@gmail.com"
//     },
//     to: 'alishah1234584.as@gmail.com',
//     subject: 'Sending Email using Node.js',
//     text: 'Hello Ali,\n\nWe hope this email finds you well. This is a sample email template that you can use to send messages to your contacts.\n\nFeel free to customize this template to fit your needs. You can add more sections, links, or images as needed.\n\nBest regards,\nYour Name\n\nThis is an automated message. Please do not reply directly to this email.',
//     html: `
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <meta charset="UTF-8">
//         <title>Email Template</title>
//         <style>
//             body {
//                 font-family: Arial, sans-serif;
//                 color: #333;
//                 margin: 0;
//                 padding: 20px;
//                 background-color: #f4f4f4;
//             }
//             .container {
//                 max-width: 600px;
//                 margin: auto;
//                 background: #fff;
//                 padding: 20px;
//                 border-radius: 8px;
//                 box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
//             }
//             h1 {
//                 color: #333;
//             }
//             p {
//                 line-height: 1.6;
//             }
//             .footer {
//                 margin-top: 20px;
//                 font-size: 0.8em;
//                 color: #777;
//             }
//         </style>
//     </head>
//     <body>
//         <div class="container">
//             <h1>Hello Ali,</h1>
//             <p>We hope this email finds you well. This is a sample email template that you can use to send messages to your contacts.</p>
//             <p>Feel free to customize this template to fit your needs. You can add more sections, links, or images as needed.</p>
//             <p>Best regards,<br>Your Name</p>
//             <div class="footer">
//                 <p>This is an automated message. Please do not reply directly to this email.</p>
//             </div>
//         </div>
//     </body>
//     </html>
//     `
// };



// const shouldSendEmail = false;
export const SendMail = async (transporter, mailOptions) => {


    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
    } catch (error) {
        console.log("Error sending email:", error);
    }
};
// SendMail(transporter, mailOptions)

// module.exports = { transporter, mailOptions, SendMail }




