import logging
import os
import smtplib
import ssl
from email.message import EmailMessage
from html import escape
from pathlib import Path
from asyncio import to_thread

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

logger = logging.getLogger(__name__)


def _env_bool(name, default=False):
    value = os.getenv(name)

    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


def _mail_config():
    required = [
        "MAIL_USERNAME",
        "MAIL_PASSWORD",
        "MAIL_FROM",
        "MAIL_SERVER",
    ]

    missing = [
        name
        for name in required
        if not os.getenv(name)
    ]

    if missing:
        raise RuntimeError(
            f"Missing mail environment variables: {', '.join(missing)}"
        )

    return {
        "username": os.getenv("MAIL_USERNAME"),
        "password": os.getenv("MAIL_PASSWORD"),
        "from_email": os.getenv("MAIL_FROM"),
        "port": int(os.getenv("MAIL_PORT", "587")),
        "server": os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        "starttls": _env_bool("MAIL_STARTTLS", True),
        "ssl_tls": _env_bool("MAIL_SSL_TLS", False),
    }


def _email_shell(candidate_name, heading, body, role=None):
    safe_name = escape(candidate_name or "Candidate")
    safe_heading = escape(heading)
    safe_body = escape(body)
    safe_role = escape(role or "")
    role_line = (
        f'<p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Role: <strong style="color: #111827;">{safe_role}</strong></p>'
        if safe_role
        else ""
    )

    return f"""
    <div style="margin:0;padding:0;background:#f9fafb;font-family:Inter,Arial,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #f3f4f6;border-radius:18px;overflow:hidden;">
              <tr>
                <td style="padding:24px 28px;background:#fff1f2;border-bottom:1px solid #ffe4e6;">
                  <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;">Vector<span style="color:#E11D48;">Hire</span></div>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 28px;">
                  <p style="margin:0 0 18px;color:#374151;font-size:15px;line-height:1.6;">Hello {safe_name},</p>
                  <h1 style="margin:0 0 14px;color:#111827;font-size:24px;line-height:1.3;font-weight:800;">{safe_heading}</h1>
                  {role_line}
                  <p style="margin:0 0 26px;color:#4b5563;font-size:15px;line-height:1.7;">{safe_body}</p>
                  <p style="margin:0;color:#4b5563;font-size:15px;line-height:1.6;">Best regards,<br><strong style="color:#111827;">VectorHire Recruitment Team</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    """


async def _send_email(to_email, candidate_name, role, subject, heading, body):
    config = _mail_config()
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = config["from_email"]
    message["To"] = to_email
    message.set_content(
        "This email contains an HTML message. Please view it in an HTML-compatible email client."
    )
    message.add_alternative(
        _email_shell(
            candidate_name=candidate_name,
            heading=heading,
            body=body,
            role=role
        ),
        subtype="html"
    )

    await to_thread(_send_smtp_message, config, message)

    return {
        "sent": True,
        "error": None
    }


def _send_smtp_message(config, message):
    context = ssl.create_default_context()

    if config["ssl_tls"]:
        with smtplib.SMTP_SSL(config["server"], config["port"], context=context) as smtp:
            smtp.login(config["username"], config["password"])
            smtp.send_message(message)
        return

    with smtplib.SMTP(config["server"], config["port"]) as smtp:
        if config["starttls"]:
            smtp.starttls(context=context)

        smtp.login(config["username"], config["password"])
        smtp.send_message(message)


async def send_shortlist_email(candidate_email, candidate_name, role):
    return await _send_email(
        to_email=candidate_email,
        candidate_name=candidate_name,
        role=role,
        subject="Application Shortlisted",
        heading="Your application has been shortlisted",
        body="Congratulations. Your application has been shortlisted for the next stage of the recruitment process. Our recruiting team will contact you soon with the next steps."
    )


async def send_rejection_email(candidate_email, candidate_name, role):
    return await _send_email(
        to_email=candidate_email,
        candidate_name=candidate_name,
        role=role,
        subject="Application Update",
        heading="Application update",
        body="Thank you for applying. After careful review, we regret to inform you that your application was not selected for the next stage. We appreciate your interest and wish you the best in your search."
    )


async def send_interview_email(candidate_email, candidate_name, role):
    return await _send_email(
        to_email=candidate_email,
        candidate_name=candidate_name,
        role=role,
        subject="Interview Invitation",
        heading="You have been selected for an interview",
        body="Congratulations. We would like to invite you to the interview round. Our recruiting team will contact you soon with scheduling details and next steps."
    )


async def send_candidate_otp_email(candidate_email, otp):
    return await _send_email(
        to_email=candidate_email,
        candidate_name="Candidate",
        role=None,
        subject="VectorHire email verification code",
        heading="Verify your email",
        body=f"Your VectorHire verification code is {otp}. This code expires in 10 minutes."
    )


async def safely_send_status_email(applicant, status):
    try:
        if status == "shortlisted":
            return await send_shortlist_email(
                applicant.get("email"),
                applicant.get("name"),
                applicant.get("role")
            )

        if status == "rejected":
            return await send_rejection_email(
                applicant.get("email"),
                applicant.get("name"),
                applicant.get("role")
            )

        if status == "interview":
            return await send_interview_email(
                applicant.get("email"),
                applicant.get("name"),
                applicant.get("role")
            )

        return {
            "sent": False,
            "error": None
        }

    except Exception as exc:
        logger.exception(
            "Failed to send %s email to candidate id=%s",
            status,
            applicant.get("id")
        )

        return {
            "sent": False,
            "error": str(exc)
        }
