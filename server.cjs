const express = require("express");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

function parseEnvContent(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((values, line) => {
      const delimiterIndex = line.indexOf("=");
      if (delimiterIndex === -1) {
        return values;
      }

      const key = line.slice(0, delimiterIndex).trim();
      let value = line.slice(delimiterIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      values[key] = value;
      return values;
    }, {});
}

function loadLocalEnv() {
  return [".env", ".env.local"].reduce((values, fileName) => {
    const filePath = path.join(__dirname, fileName);
    if (!fs.existsSync(filePath)) {
      return values;
    }

    return {
      ...values,
      ...parseEnvContent(fs.readFileSync(filePath, "utf8")),
    };
  }, {});
}

const localEnv = loadLocalEnv();

for (const [key, value] of Object.entries(localEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

function pickEnv(...names) {
  for (const name of names) {
    const value = process.env[name] || localEnv[name];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return "";
}

const fromEmail = pickEnv("SMTP_FROM_EMAIL", "EMAIL_USER");
const fromName = pickEnv("SMTP_FROM_NAME") || "Digrro Academy";
const serverBaseUrl = pickEnv("SERVER_BASE_URL") || "http://127.0.0.1:3000";
if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is required for email verification redirects.");
}

const frontendUrl = String(process.env.FRONTEND_URL).replace(/\/+$/, "");
const frontendSuccessUrl = `${frontendUrl}/verified-success`;
const stripeLinksPath = path.join(
  __dirname,
  "academy-server",
  "api",
  "generated-payment-links.json",
);

// DB
const db = new sqlite3.Database("./database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    token TEXT,
    checkout_url TEXT,
    verified INTEGER DEFAULT 0,
    paid INTEGER DEFAULT 0
  )
`);
db.run("ALTER TABLE users ADD COLUMN paid INTEGER DEFAULT 0", (err) => {
  if (err && !err.message.includes("duplicate column")) {
    console.error("Error adding paid column:", err.message);
  }
});


db.all("PRAGMA table_info(users)", (err, columns) => {
  if (err) {
    console.error("[db] Could not inspect users schema:", err.message);
    return;
  }

  const hasCheckoutUrl = columns.some(
    (column) => column.name === "checkout_url",
  );
  if (hasCheckoutUrl) {
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

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function loadStripePaymentLinks() {
  try {
    return JSON.parse(fs.readFileSync(stripeLinksPath, "utf8"));
  } catch (err) {
    console.error(
      "[stripe] Could not load generated payment links:",
      err.message,
    );
    return { links: {} };
  }
}

function normalizePlanKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getCheckoutUrlForPlan(planKey, email, checkoutReference) {
  const paymentLinks = loadStripePaymentLinks();
  const links = paymentLinks.links || {};
  const preferredPlanKey = normalizePlanKey(planKey);
  const fallbackPlanKey = links.bootcamp ? "bootcamp" : Object.keys(links)[0];
  const selectedPlanKey = links[preferredPlanKey]
    ? preferredPlanKey
    : fallbackPlanKey;
  const checkoutUrl = links[selectedPlanKey]?.url;

  if (!checkoutUrl) {
    return "";
  }

  try {
    const url = new URL(checkoutUrl);
    if (!isValidCheckoutUrl(url.toString())) {
      return "";
    }

    url.searchParams.set("prefilled_email", email);
    url.searchParams.set("client_reference_id", checkoutReference);
    url.searchParams.set("utm_source", "digrro_academy");
    url.searchParams.set("utm_medium", "website");
    url.searchParams.set("utm_campaign", selectedPlanKey);
    return url.toString();
  } catch (err) {
    return "";
  }
}

// Email transporter
const transporter = nodemailer.createTransport({
  host: "mail.digrro.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("[email] Transporter verification failed:", err.message);
  }
});

function sendVerificationEmail(email, token, callback) {
  const link = `${serverBaseUrl.replace(/\/+$/, "")}/verify-email?token=${encodeURIComponent(token)}`;

  transporter.sendMail(
    {
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: "Verify your email",
      text: `Please verify your email for Digrro Academy:\n\n${link}`,
      html: `<p>Please verify your email for Digrro Academy.</p><p><a href="${link}">Verify Email</a></p>`,
    },
    callback,
  );
}

// 1. Register + Send Email
app.post("/register", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const planKey = normalizePlanKey(
    req.body.planKey || req.body.plan_key || req.get("x-plan-key"),
  );
  const { checkoutUrl, checkout_url } = req.body;

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ ok: false, message: "Valid email is required" });
  }

  db.get(
    "SELECT id, token, verified, paid FROM users WHERE email = ? ORDER BY paid DESC, verified DESC, id DESC LIMIT 1",
    [email],
    (lookupErr, user) => {
      if (lookupErr) {
        console.error("[register] Database lookup failed:", lookupErr.message);
        return res
          .status(500)
          .json({ ok: false, message: "Database lookup failed" });
      }

      if (user && (user.verified === 1 || user.paid === 1)) {
        return res.json({
          ok: true,
          success: true,
          alreadyExists: true,
          message: "This email is already registered",
        });
      }

      if (user) {
        if (!user.token) {
          return res.status(500).json({
            ok: false,
            message: "Verification token is unavailable",
          });
        }

        return sendVerificationEmail(email, user.token, (mailErr) => {
          if (mailErr) {
            console.error("[register] Email resend failed:", mailErr.message);
            return res.status(500).json({
              ok: false,
              message: "Email send failed",
              error: mailErr.message,
            });
          }

          res.json({
            ok: true,
            success: true,
            resent: true,
            message: "Verification email sent",
          });
        });
      }

      const token = uuidv4();
      const checkoutUrlToStore =
        checkoutUrl ||
        checkout_url ||
        getCheckoutUrlForPlan(planKey, email, token);

      if (checkoutUrlToStore && !isValidCheckoutUrl(checkoutUrlToStore)) {
        return res
          .status(400)
          .json({ ok: false, message: "Stripe checkout URL is invalid" });
      }

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

          sendVerificationEmail(email, token, (mailErr) => {
            if (mailErr) {
              console.error("[register] Email send failed:", mailErr.message);
              return res.status(500).json({
                ok: false,
                message: "Email send failed",
                error: mailErr.message,
              });
            }

            res.json({ ok: true, message: "Verification email sent", token });
          });
        },
      );
    },
  );
});

// 2. Verify Email
app.get("/verify-email", (req, res) => {
  const token = String(req.query.token || "").trim();

  db.get(
    "SELECT id, checkout_url FROM users WHERE token = ? LIMIT 1",
    [token],
    (lookupErr, user) => {
      if (lookupErr) {
        console.error(
          "[verify-email] Database lookup failed:",
          lookupErr.message,
        );
        return res.redirect(`${frontendSuccessUrl}?status=error`);
      }

      if (!user) {
        console.error("[verify-email] Invalid or already used token");
        return res.redirect(`${frontendSuccessUrl}?status=invalid`);
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
            return res.redirect(`${frontendSuccessUrl}?status=error`);
          }

          const verifiedSuccessUrl = new URL(frontendSuccessUrl);
          verifiedSuccessUrl.searchParams.set("token", token);

          res.redirect(verifiedSuccessUrl.toString());
        },
      );
    },
  );
});

app.get("/checkout-url", (req, res) => {
  const token = String(req.query.token || "").trim();

  if (!token) {
    return res.status(400).json({ ok: false, message: "Token is required" });
  }

  db.get(
    "SELECT email, checkout_url, verified, paid FROM users WHERE token = ? LIMIT 1",
    [token],
    (lookupErr, user) => {
      if (lookupErr) {
        console.error(
          "[checkout-url] Database lookup failed:",
          lookupErr.message,
        );
        return res
          .status(500)
          .json({ ok: false, message: "Could not load checkout URL" });
      }

      if (!user) {
        return res
          .status(404)
          .json({ ok: false, message: "Verification token was not found" });
      }

      if (!user.verified) {
        return res
          .status(403)
          .json({ ok: false, message: "Email has not been verified yet" });
      }

      if (user.paid === 1) {
        return res.json({
          ok: true,
          success: true,
          alreadyPaid: true,
          message: "Payment already completed",
        });
      }

      const checkoutUrl = isValidCheckoutUrl(user.checkout_url)
        ? user.checkout_url
        : getCheckoutUrlForPlan("bootcamp", user.email, token);

      if (!isValidCheckoutUrl(checkoutUrl)) {
        return res
          .status(404)
          .json({ ok: false, message: "Checkout URL is not available" });
      }

      res.json({
        ok: true,
        checkout_url: checkoutUrl,
        checkoutUrl,
      });
    },
  );
});
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const event = JSON.parse(req.body);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const email = session.customer_details?.email;

      console.log("Payment success for:", email);

      if (email) {
        db.run(
          `UPDATE users SET paid = 1 WHERE email = ?`,
          [email],
          (err) => {
            if (err) {
              console.error("DB update error:", err.message);
            } else {
              console.log("User marked as paid:", email);
            }
          }
        );
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.sendStatus(400);
  }
});





app.listen(3000, () => console.log("Server running on port 3000"));
