import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def send_email(to_email: str, subject: str, body_html: str):
    """
    Sends an email using SMTP (Brevo/Sendinblue recommended).
    """
    smtp_host = os.getenv("SMTP_HOST", "mail.smtp2go.com")
    smtp_port = int(os.getenv("SMTP_PORT", "2525"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    mail_from = os.getenv("MAIL_FROM", "onboarding@projectpulse.app")

    if not all([smtp_host, smtp_user, smtp_password]):
        print("Error: SMTP configuration missing in .env")
        return False

    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = mail_from
        message["To"] = to_email

        # Attach HTML body
        part = MIMEText(body_html, "html")
        message.attach(part)

        # Connect and send
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(mail_from, to_email, message.as_string())
        
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def send_invitation_email(to_email: str, team_name: str, role: str, invite_link: str):
    """
    Specifically for team invitations.
    """
    subject = f"You've been invited to join {team_name} in ProjectPulse"
    
    body_html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb;">Join ProjectPulse</h2>
                <p>Hello,</p>
                <p>You have been invited to join the <strong>{team_name}</strong> team as a <strong>{role}</strong>.</p>
                <p>ProjectPulse helps your team manage tickets, track analytics, and communicate with AI-driven insights.</p>
                
                <div style="margin: 30px 0;">
                    <a href="{invite_link}" 
                       style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       Accept Invitation & Join Discord
                    </a>
                </div>
                
                <p>If you don't have an account, you will be prompted to create one first.</p>
                <p>Welcome to the team!</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777;">This invitation was sent by ProjectPulse on behalf of your team admin.</p>
            </div>
        </body>
    </html>
    """
    return send_email(to_email, subject, body_html)
