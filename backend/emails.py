"""
Partners - emails.py
Handles all transactional emails via Resend.
Fails silently — email should never break the main flow.
"""

import os
import resend

resend.api_key = os.environ.get("RESEND_API_KEY", "")

FROM_ADDRESS = "onboarding@resend.dev"
APP_URL = os.environ.get("APP_URL", "https://partners1.vercel.app")

VIBE_COLORS = {
    "🔥 Strong vibe": "#00FF41",
    "✨ Good match":  "#00BFFF",
    "🤝 Could work":  "#A855F7",
    "🌱 Different paths": "#94A3B8",
}


def _base_template(content: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#060A14;font-family:'Courier New',monospace;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

              <!-- Header -->
              <tr>
                <td style="padding-bottom:32px;">
                  <span style="color:#00FF41;font-size:12px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;">
                    PARTNERS_v1.0
                  </span>
                </td>
              </tr>

              <!-- Content -->
              {content}

              <!-- Footer -->
              <tr>
                <td style="padding-top:40px;border-top:1px solid #1E293B;">
                  <p style="color:#334155;font-size:10px;margin:0;letter-spacing:2px;">
                    PARTNERS · FIND SOMEONE TO BUILD WITH · NO PITCH DECKS
                  </p>
                  <p style="color:#1E293B;font-size:10px;margin:8px 0 0;">
                    <a href="{APP_URL}" style="color:#334155;text-decoration:none;">Open app</a>
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


def send_match_notification(
    to_email: str,
    to_username: str,
    from_username: str,
    from_avatar: str,
    chemistry_score: int,
    vibe: str,
    why: str,
    build_idea: str,
) -> bool:
    """
    Notify a builder that someone checked their chemistry.
    Returns True if sent, False if failed.
    """
    if not resend.api_key:
        print("[email] RESEND_API_KEY not set — skipping")
        return False

    score_color = VIBE_COLORS.get(vibe, "#00FF41")

    # Score bar width
    bar_width = max(10, chemistry_score)

    content = f"""
    <tr>
      <td style="padding-bottom:32px;">
        <p style="color:#64748B;font-size:11px;margin:0 0 16px;letter-spacing:3px;text-transform:uppercase;">
          New_Chemistry_Check
        </p>
        <h1 style="color:#FFFFFF;font-size:28px;margin:0 0 8px;font-weight:900;line-height:1.2;">
          @{from_username} wants<br/>to build with you
        </h1>
      </td>
    </tr>

    <!-- Score Card -->
    <tr>
      <td style="background:#0D1525;border:1px solid #1E293B;border-radius:16px;padding:24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="color:#64748B;font-size:10px;margin:0 0 8px;letter-spacing:3px;text-transform:uppercase;">
                Chemistry_Score
              </p>
              <!-- Score bar -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td style="background:#1E293B;border-radius:4px;height:8px;overflow:hidden;">
                    <div style="background:linear-gradient(90deg,{score_color},{score_color}88);width:{bar_width}%;height:8px;border-radius:4px;"></div>
                  </td>
                </tr>
              </table>
              <p style="color:{score_color};font-size:32px;font-weight:900;margin:0 0 4px;">{chemistry_score}%</p>
              <p style="color:{score_color};font-size:12px;margin:0;">{vibe}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr><td style="height:16px;"></td></tr>

    <!-- Why -->
    <tr>
      <td style="background:#0D1525;border:1px solid #1E293B;border-radius:16px;padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:16px;">
              <p style="color:#64748B;font-size:10px;margin:0 0 8px;letter-spacing:3px;text-transform:uppercase;">Why_You_Match</p>
              <p style="color:#CBD5E1;font-size:14px;margin:0;line-height:1.6;">
                <span style="color:{score_color};">&gt;</span> {why}
              </p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #1E293B;padding-top:16px;">
              <p style="color:#64748B;font-size:10px;margin:0 0 8px;letter-spacing:3px;text-transform:uppercase;">Build_Idea</p>
              <p style="color:#FFFFFF;font-size:14px;margin:0;font-style:italic;">
                "{build_idea}"
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr><td style="height:32px;"></td></tr>

    <!-- CTA -->
    <tr>
      <td align="center">
        <a href="{APP_URL}"
           style="display:inline-block;background:#00FF41;color:#060A14;font-size:12px;
                  font-weight:900;letter-spacing:3px;text-decoration:none;
                  padding:16px 32px;border-radius:12px;text-transform:uppercase;">
          VIEW_THEIR_PROFILE
        </a>
      </td>
    </tr>

    <tr><td style="height:24px;"></td></tr>

    <tr>
      <td align="center">
        <p style="color:#334155;font-size:11px;margin:0;">
          @{to_username} · someone checked your chemistry on Partners
        </p>
      </td>
    </tr>
    """

    try:
        resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": to_email,
            "subject": f"⚡ @{from_username} checked your chemistry — {chemistry_score}% match",
            "html": _base_template(content),
        })
        print(f"[email] Match notification sent to {to_username}")
        return True
    except Exception as e:
        print(f"[email] Failed to send match notification: {type(e).__name__}: {e}")
        return False


def send_welcome_email(to_email: str, to_username: str) -> bool:
    """Send welcome email after registration."""
    if not resend.api_key:
        return False

    content = f"""
    <tr>
      <td style="padding-bottom:32px;">
        <p style="color:#64748B;font-size:11px;margin:0 0 16px;letter-spacing:3px;text-transform:uppercase;">
          Protocol_Established
        </p>
        <h1 style="color:#FFFFFF;font-size:28px;margin:0 0 8px;font-weight:900;line-height:1.2;">
          Welcome to Partners,<br/>
          <span style="color:#00FF41;">@{to_username}</span>
        </h1>
      </td>
    </tr>

    <tr>
      <td style="background:#0D1525;border:1px solid #1E293B;border-radius:16px;padding:24px;">
        <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;line-height:1.7;">
          You're now in the directory. Builders in your city and stack can find you,
          check your chemistry, and propose ideas.
        </p>

        <p style="color:#64748B;font-size:10px;margin:0 0 12px;letter-spacing:3px;text-transform:uppercase;">
          To get better matches:
        </p>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 0;">
              <span style="color:#00FF41;">→</span>
              <span style="color:#CBD5E1;font-size:13px;margin-left:8px;">Add what you're learning</span>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;">
              <span style="color:#00FF41;">→</span>
              <span style="color:#CBD5E1;font-size:13px;margin-left:8px;">Set your current idea</span>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;">
              <span style="color:#00FF41;">→</span>
              <span style="color:#CBD5E1;font-size:13px;margin-left:8px;">Set your availability</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr><td style="height:32px;"></td></tr>

    <tr>
      <td align="center">
        <a href="{APP_URL}"
           style="display:inline-block;background:#00FF41;color:#060A14;font-size:12px;
                  font-weight:900;letter-spacing:3px;text-decoration:none;
                  padding:16px 32px;border-radius:12px;text-transform:uppercase;">
          OPEN_PARTNERS
        </a>
      </td>
    </tr>
    """

    try:
        resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": to_email,
            "subject": "⚡ You're in — Partners",
            "html": _base_template(content),
        })
        print(f"[email] Welcome email sent to {to_username}")
        return True
    except Exception as e:
        print(f"[email] Failed to send welcome email: {type(e).__name__}: {e}")
        return False
