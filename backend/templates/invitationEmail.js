export const generateInvitationEmail = (
  inviteeName,
  workspaceName,
  inviterName,
  acceptLink,
) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join ${workspaceName}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f9fafb;
            }
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
            }
            .content {
                padding: 40px 20px;
            }
            .greeting {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 20px;
                color: #1f2937;
            }
            .message {
                font-size: 14px;
                line-height: 1.8;
                margin-bottom: 25px;
                color: #4b5563;
            }
            .highlight {
                font-weight: 600;
                color: #667eea;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 40px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
                margin: 30px 0;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            .link-section {
                margin: 30px 0;
                padding: 20px;
                background-color: #f3f4f6;
                border-radius: 6px;
                word-break: break-all;
            }
            .link-label {
                font-size: 12px;
                color: #9ca3af;
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            .link-text {
                color: #667eea;
                font-size: 14px;
                font-family: 'Courier New', monospace;
            }
            .footer {
                background-color: #f9fafb;
                padding: 30px 20px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }
            .footer-text {
                font-size: 12px;
                color: #9ca3af;
                margin-bottom: 10px;
            }
            .divider {
                width: 60px;
                height: 2px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 20px auto;
            }
            .warning {
                font-size: 12px;
                color: #9ca3af;
                margin-top: 20px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>🚀 You're Invited!</h1>
                <p>Join ${workspaceName} today</p>
            </div>
            
            <div class="content">
                <div class="greeting">Hi ${inviteeName},</div>
                
                <div class="message">
                    <p><span class="highlight">${inviterName}</span> has invited you to join <span class="highlight">${workspaceName}</span> on our project management platform.</p>
                </div>
                
                <div class="message">
                    <p>Accept this invitation to start collaborating with your team and manage projects efficiently.</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${acceptLink}" class="cta-button">Accept Invitation</a>
                </div>
                
                <div class="link-section">
                    <div class="link-label">Or copy this link:</div>
                    <div class="link-text">${acceptLink}</div>
                </div>
                
                <div class="message" style="margin-top: 30px;">
                    <p>Once you accept, you'll be added as a member of the workspace and can start collaborating right away.</p>
                </div>
                
                <div class="warning">
                    This invitation expires in 7 days. Act now to join the workspace!
                </div>
            </div>
            
            <div class="footer">
                <div class="divider"></div>
                <div class="footer-text">
                    You're receiving this email because you were invited to a workspace.
                </div>
                <div class="footer-text">
                    If you didn't expect this invitation, you can safely ignore this email.
                </div>
                <div class="footer-text" style="margin-top: 20px; color: #6b7280;">
                    © 2026 Project Management. All rights reserved.
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};
