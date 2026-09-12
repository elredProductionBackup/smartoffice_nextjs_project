// Backend renders these as HTML email bodies, substituting the `${...}`
// placeholders itself (per-recipient `${user.name}` from the contacts array,
// the rest from templateVariables). Keep the `${...}` tokens literal here —
// do not interpolate them on the frontend.

export const PRIVE_WORKSHOP_EMAIL_HTML = `<div style="font-family: Helvetica, Arial, sans-serif; min-width: 100%; overflow: auto; line-height: 1.6;">
    <div style="margin: 30px auto; max-width: 700px; padding: 20px;">

        <div style="border-bottom: 1px solid #E72D38; padding-bottom: 15px;">
            <a href=""
                style="font-size: 1.5em; color: #000; text-decoration: none; font-weight: 600;">
                Prive
            </a>
        </div>

        <p style="font-size: 1.1em;">
            Dear \${user.name},
        </p>

        <p>
            Welcome to Prive! 🎉
        </p>

        <p>
            Your registration for the
            <strong>\${workshopName}</strong>
            on <strong>\${workshopDate}</strong>
            is confirmed.
        </p>

        <div style="margin: 25px 0; padding: 20px; background: #f7f7f7; border-radius: 6px;">

            <p style="margin: 8px 0;">
                ⏰ <strong>Session Time:</strong>
                \${sessionTime} sharp
            </p>

            <p style="margin: 8px 0;">
                🕐 <strong>Arrival Time:</strong>
                \${arrivalTime}
            </p>

            <p style="margin: 8px 0;">
               📍 <strong>Venue:</strong>
                 \${venue}
            </p>

            <p style="margin: 8px 0;">
                👔 <strong>Dress Code:</strong>
                Jacket
            </p>

        </div>

        <p>
            We encourage all attendees to wear a jacket to complement
            the formal nature of the workshop.
        </p>

        <p>
            We look forward to welcoming you to an engaging and
            insightful session.
        </p>

        <p style="margin-top: 30px;">
            Warm regards,<br>
            <strong>Nandini</strong><br>
            Program Lead | Prive
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">

        <div style="color: #888; font-size: 0.8em; line-height: 1.4;">
            <p style="margin: 5px 0;">Prive</p>
            <p style="margin: 5px 0;">
                REXTONE DIGITAL PRIVATE LIMITED.
            </p>
        </div>

    </div>
</div>`;

// Stub content for now — "Prive media" doesn't collect workshop fields, only
// an attendee name, so venue has nothing to substitute until that changes.
export const PRIVE_MEDIA_EMAIL_HTML = `Hi \${user.name}, the venue is \${venue}`;

export function getEmailHtmlTemplate(templateId) {
  return templateId === "prive_media" ? PRIVE_MEDIA_EMAIL_HTML : PRIVE_WORKSHOP_EMAIL_HTML;
}
