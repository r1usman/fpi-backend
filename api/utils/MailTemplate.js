exports.MailTemplateOTP = (email, otp) => {
  return {
    from: {
      name: "Ali",
      address: "alishah19477.as@gmail.com",
    },
    to: email,
    subject: "Your OTP Code for Account Verification",
    text: `Hello Ali,\n\nYour OTP code is: ${otp}\n\nPlease enter this code to verify your account. If you did not request this, please ignore this message.`,
    html: `<!DOCTYPE html>
            <html><head><meta charset="UTF-8"><style>
                body { font-family: Arial; background: #f4f4f4; padding: 20px; }
                .container { background: white; padding: 20px; border-radius: 8px; }
                .otp-box { font-size: 1.5em; font-weight: bold; background: #eee; padding: 10px; border-radius: 8px; }
            </style></head><body>
                <div class="container">
                    <h1>Hello Ali,</h1>
                    <p>Please use the following OTP code to verify your account:</p>
                    <div class="otp-box">${otp}</div>
                    <p>If you did not request this, please ignore this message.</p>
                    <p style="font-size:0.8em;color:#777;">This is an automated message. Please do not reply.</p>
                </div>
            </body></html>`,
  };
};
