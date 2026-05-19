const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * SmartUzhavan Notification Service
 * Handles future and current email/push notification integration.
 * Currently prints and logs notifications in Dev mode and prepares fully for SMTP transmission in Prod.
 */
class NotificationService {
  constructor() {
    this.transporter = null;
    this.adminEmail = config.smtp.adminEmail;

    // Check if SMTP is configured
    if (config.smtp.user && config.smtp.pass) {
      this.initializeTransporter();
    } else {
      logger.warn('[NotificationService] SMTP credentials are not configured. Falling back to Log-only mode.');
    }
  }

  /**
   * Initialize nodemailer transporter
   */
  initializeTransporter() {
    try {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465, // True for port 465, false for other ports
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      logger.info(`[NotificationService] NodeMailer SMTP transporter initialized successfully for host: ${config.smtp.host}`);
    } catch (error) {
      logger.error(`[NotificationService] SMTP initialization failed: ${error.message}`);
    }
  }

  /**
   * Send mail utility
   * @param {Object} mailOptions { to, subject, text, html }
   */
  async sendMail(mailOptions) {
    const formattedOptions = {
      from: `"SmartUzhavan Notifications" <no-reply@smartuzhavan.com>`,
      ...mailOptions
    };

    // Event Logging Hook
    logger.info(`[NotificationService] 🔔 Triggered Notification Event: "${formattedOptions.subject}" to ${formattedOptions.to}`);

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail(formattedOptions);
        logger.info(`[NotificationService] ✉️ Email sent successfully: ${info.messageId}`);
        return info;
      } catch (error) {
        logger.error(`[NotificationService] ❌ Failed to transmit SMTP mail: ${error.message}`);
        // Do not crash server; log error and proceed
        return null;
      }
    } else {
      // Dev Mode / Log Mode Fallback
      logger.info(`[NotificationService] [LOG-ONLY-MODE] Notification Details:
      TO: ${formattedOptions.to}
      SUBJECT: ${formattedOptions.subject}
      TEXT CONTENT: ${formattedOptions.text}`);
      return { logOnly: true, status: 'logged' };
    }
  }

  /**
   * Alert admin when a driver registers a new expense.
   * Useful future event hook.
   * @param {Object} expense The expense mongoose object
   * @param {Object} driver The driver user profile object
   */
  async alertAdminOnExpense(expense, driver) {
    const subject = `⚠️ [Expense Alert] Driver ${driver.name} Added a New Expense`;
    const text = `Hello Admin,

Driver ${driver.name} (Phone: ${driver.phone || 'N/A'}) has uploaded a new expense entry:

* Expense Category: ${expense.category}
* Amount: ₹${expense.amount.toFixed(2)}
* Description: ${expense.description || 'No description provided'}
* Date: ${new Date(expense.date).toLocaleDateString()}

Please log in to the SmartUzhavan Dashboard to review or approve this transaction.

SmartUzhavan Automated System`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #E2E8F0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #C53030; border-bottom: 2px solid #C53030; padding-bottom: 8px;">SmartUzhavan Expense Alert</h2>
        <p>Hello Admin,</p>
        <p><strong>Driver ${driver.name}</strong> (Phone: ${driver.phone || 'N/A'}) has registered a new business expense:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #EDF2F7; font-weight: bold;">Category:</td>
            <td style="padding: 8px; border-bottom: 1px solid #EDF2F7;">${expense.category}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #EDF2F7; font-weight: bold;">Amount:</td>
            <td style="padding: 8px; border-bottom: 1px solid #EDF2F7; color: #C53030; font-size: 1.1rem; font-weight: bold;">₹${expense.amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #EDF2F7; font-weight: bold;">Description:</td>
            <td style="padding: 8px; border-bottom: 1px solid #EDF2F7;">${expense.description || 'No description provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #EDF2F7; font-weight: bold;">Date:</td>
            <td style="padding: 8px; border-bottom: 1px solid #EDF2F7;">${new Date(expense.date).toLocaleDateString()}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">Please login to the <a href="${config.frontendUrl}" style="color: #3182CE; text-decoration: none; font-weight: bold;">SmartUzhavan Admin Dashboard</a> to manage this transaction.</p>
        <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        <p style="font-size: 0.8rem; color: #718096;">This is an automated notification. Please do not reply directly to this email.</p>
      </div>
    `;

    return this.sendMail({
      to: this.adminEmail,
      subject,
      text,
      html
    });
  }
}

module.exports = new NotificationService();
