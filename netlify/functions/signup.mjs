import nodemailer from "nodemailer";

const betaUrl = "https://play.google.com/store/apps/details?id=space.manus.moodjournal.t20260309042142";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const { email = "" } = await request.json().catch(() => ({}));
  const normalizedEmail = String(email).trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL || "MoodbloomJournal.app@gmail.com";

  if (!gmailUser || !gmailAppPassword) {
    return json(
      { error: "Email service is not configured yet. Add Netlify environment variables first." },
      500
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    }
  });

  try {
    await transporter.sendMail({
      from: `"Mood Bloom" <${gmailUser}>`,
      to: adminEmail,
      replyTo: normalizedEmail,
      subject: "New Mood Bloom beta signup",
      text: [
        "A new user joined the Mood Bloom beta waitlist.",
        "",
        `Email: ${normalizedEmail}`,
        `Manual follow-up inbox: ${adminEmail}`,
        `Beta URL to send later: ${betaUrl}`,
        `Submitted at: ${new Date().toISOString()}`
      ].join("\n")
    });

    return json({
      message: "Your beta request was received. We will email you the Google Play link soon."
    });
  } catch (error) {
    console.error("Signup email failed:", error);
    return json(
      { error: "We could not submit your beta request right now. Please try again." },
      500
    );
  }
};
