import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP configuration error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

const sendEmail = async ({ to, subject, body }) => {
  try {
    console.log("Sending email to:", to);
    console.log("SMTP Config:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER ? "***" : "NOT SET",
    });

    const response = await transporter.sendMail({
      from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      html: body,
    });

    console.log("Email sent successfully:", response.messageId);
    return response;
  } catch (error) {
    console.error("Email sending error:", error.message);
    console.error("Full error:", error);
    throw error;
  }
};

export default sendEmail;
