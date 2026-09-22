import nodemailer from "nodemailer";
import { config } from "../config/env";
import { logService } from "../services/log.service";

// Create transporter
const createTransporter = () => {
  // For development, you can use ethereal email or your SMTP settings
  return nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_PORT === 465,
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });
};

export const emailService = {
  // Send password reset email
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    name: string,
  ) {
    const transporter = createTransporter();

    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.APP_NAME || "Admin Portal"}" <${config.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #f2f2f2; }
            .button { display: inline-block; padding: 12px 30px; background-color: #000; color: #fff !important; text-decoration: none; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>You recently requested to reset your password for your Admin Portal account. Click the button below to reset it:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" style="color: #fff" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
              <p>Best regards,<br>Admin Portal Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello ${name},
        
        You recently requested to reset your password for your Admin Portal account.
        
        Click the link below to reset it:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you did not request a password reset, please ignore this email or contact support if you have concerns.
        
        Best regards,
        Admin Portal Team
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Password reset email sent successfully:", {
        messageId: info.messageId,
        to: email,
        accepted: info.accepted,
        rejected: info.rejected,
      });
      return true;
    } catch (error) {
      await logService.create({
        type: "ERROR",
        action: "Error sending password reset email",
        note: `Error sending password reset email to ${email}`,
        metadata: { error },
      });
      console.error("Error sending password reset email:", error);

      throw error;
    }
  },

  // Send welcome email (optional - for new users)
  async sendWelcomeEmail(email: string, name: string, tempPassword: string) {
    const transporter = createTransporter();

    const loginUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login`;

    const mailOptions = {
      from: `"${process.env.APP_NAME || "Admin Portal"}" <${config.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Admin Portal",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #f2f2f2; }
            .credentials { background-color: #fff; padding: 15px; border: 1px solid #f2f2f2; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background-color: #000; color: #fff; text-decoration: none; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Admin Portal</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Your account has been created successfully. Here are your login credentials:</p>
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              </div>
              <p><strong>Important:</strong> Please change your password after your first login for security reasons.</p>
              <p style="text-align: center;">
                <a href="${loginUrl}" style="color: #fff" class="button">Login Now</a>
              </p>
              <p>If you have any questions, please contact your administrator.</p>
              <p>Best regards,<br>Admin Portal Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Welcome email sent:", info.messageId);
      return true;
    } catch (error) {
      await logService.create({
        type: "ERROR",
        action: "Error sending email",
        note: `Error sending welcome email to ${email}`,
        metadata: { error },
      });
      console.error("Error sending welcome email:", error);
      throw error;
    }
  },
};
