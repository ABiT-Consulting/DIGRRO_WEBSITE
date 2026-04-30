const Stripe = require("stripe");
const stripe = Stripe("sk_test_XXXX");

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const mailUser = "rft5567@gmail.com";

// DB
const db = new sqlite3.Database("./database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    token TEXT,
    checkout_url TEXT,
    verified INTEGER DEFAULT 0
  )
`);

db.all("PRAGMA table_info(users)", (err, columns) => {
  if (err) {
    console.error("[db] Could not inspect users schema:", err.message);
    return;
  }

  const hasCheckoutUrl = columns.some(
    (column) => column.name === "checkout_url",
  );
  if (hasCheckoutUrl) {
    console.log("[db] users.checkout_url column is ready");
    return;
  }

  db.run("ALTER TABLE users ADD COLUMN checkout_url TEXT", (alterErr) => {
    if (alterErr) {
      console.error(
        "[db] Could not add checkout_url column:",
        alterErr.message,
      );
      return;
    }

    console.log("[db] Added users.checkout_url column");
  });
});

function isValidCheckoutUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "buy.stripe.com";
  } catch (err) {
    return false;
  }
}

// Email transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: mailUser,
    pass: "qmjj kovr nzhl ftjh",
  },
});

console.log("[email] Nodemailer configured for Gmail user:", mailUser);
transporter.verify((err) => {
  if (err) {
    console.error("[email] Transporter verification failed:", err.message);
    return;
  }

  console.log("[email] Transporter is ready to send mail");
});

// 1. Register + Send Email
app.post("/register", (req, res) => {
  console.log("[register] /register endpoint hit");

  const { email, checkoutUrl, checkout_url } = req.body;
  const checkoutUrlToStore = checkoutUrl || checkout_url;
  console.log("[register] request payload email:", email);
  console.log("[register] request payload checkoutUrl:", checkoutUrlToStore);

  if (!email) {
    console.error("[register] Missing email in request payload");
    return res.status(400).json({ ok: false, message: "Email is required" });
  }

  if (!isValidCheckoutUrl(checkoutUrlToStore)) {
    console.error("[register] Missing or invalid checkout URL");
    return res
      .status(400)
      .json({ ok: false, message: "Valid Stripe checkout URL is required" });
  }

  const token = uuidv4();
  console.log("[register] token generated:", token);

  db.run(
    "INSERT INTO users (email, token, checkout_url) VALUES (?, ?, ?)",
    [email, token, checkoutUrlToStore],
    (err) => {
      if (err) {
        console.error("[register] Database insert failed:", err.message);
        return res
          .status(500)
          .json({ ok: false, message: "Database insert failed" });
      }

      const link = `http://127.0.0.1:3000/verify-email?token=${token}`;
      console.log("[register] verification link:", link);

      transporter.sendMail(
        {
          from: mailUser,
          to: email,
          subject: "Verify your email",
          html: `<a href="${link}">Verify Email</a>`,
        },
        (mailErr, info) => {
          if (mailErr) {
            console.error("[register] Email send failed:", mailErr.message);
            return res.status(500).json({
              ok: false,
              message: "Email send failed",
              error: mailErr.message,
            });
          }

          console.log("[register] Email sent successfully:", info.messageId);
          res.json({ ok: true, message: "Verification email sent" });
        },
      );
    },
  );
});

// 2. Verify Email
app.get("/verify-email", (req, res) => {
  console.log("[verify-email] /verify-email route hit");

  const { token } = req.query;
  console.log("[verify-email] token received:", token);

  const frontendSuccessUrl = "http://127.0.0.1:5174/verified-success";

  db.get(
    "SELECT id, checkout_url FROM users WHERE token = ? LIMIT 1",
    [token],
    (lookupErr, user) => {
      if (lookupErr) {
        console.error(
          "[verify-email] Database lookup failed:",
          lookupErr.message,
        );
        console.log("[verify-email] redirecting to frontend with error status");
        return res.redirect(`${frontendSuccessUrl}?status=error`);
      }

      if (!user) {
        console.error("[verify-email] Invalid or already used token");
        console.log(
          "[verify-email] redirecting to frontend with invalid status",
        );
        return res.redirect(`${frontendSuccessUrl}?status=invalid`);
      }

      if (!isValidCheckoutUrl(user.checkout_url)) {
        console.error(
          "[verify-email] Missing or invalid checkout URL for token",
        );
        console.log("[verify-email] redirecting to frontend with error status");
        return res.redirect(`${frontendSuccessUrl}?status=error`);
      }

      db.run(
        "UPDATE users SET verified = 1 WHERE id = ?",
        [user.id],
        function (updateErr) {
          if (updateErr) {
            console.error(
              "[verify-email] Database update failed:",
              updateErr.message,
            );
            console.log(
              "[verify-email] redirecting to frontend with error status",
            );
            return res.redirect(`${frontendSuccessUrl}?status=error`);
          }

          const verifiedSuccessUrl = new URL(frontendSuccessUrl);
          verifiedSuccessUrl.searchParams.set("redirect", user.checkout_url);

          console.log("[verify-email] Email verified successfully");
          console.log(
            "[verify-email] redirecting to frontend confirmation page:",
            verifiedSuccessUrl.toString(),
          );
          res.redirect(verifiedSuccessUrl.toString());
        },
      );
    },
  );
});

app.listen(3000, () => console.log("Server running on port 3000"));
