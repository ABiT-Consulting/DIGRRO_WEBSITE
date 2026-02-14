import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactFormData {
  captchaToken: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  service?: string;
  message: string;
}

const verifyCaptcha = (token: string) => {
  const [leftRaw, rightRaw, answerRaw] = token.split(":");
  const left = Number.parseInt(leftRaw, 10);
  const right = Number.parseInt(rightRaw, 10);
  const answer = Number.parseInt(answerRaw, 10);

  if ([left, right, answer].some((value) => Number.isNaN(value))) {
    throw new Error("Invalid captcha format");
  }

  if (left < 2 || left > 9 || right < 2 || right > 9) {
    throw new Error("Invalid captcha challenge");
  }

  if (left + right !== answer) {
    throw new Error("Captcha verification failed");
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData: ContactFormData = await req.json();

    if (!formData.captchaToken) {
      throw new Error("Captcha token is required");
    }

    verifyCaptcha(formData.captchaToken);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const emailBody = `
${formData.message}

---
Contact Details:
Name: ${formData.name}
Email: ${formData.email}
${formData.company ? `Company: ${formData.company}` : ''}
${formData.phone ? `Phone: ${formData.phone}` : ''}
${formData.service ? `Service: ${formData.service}` : ''}
    `.trim();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #0ea5e9; }
    .message-box { background: white; padding: 20px; border-left: 4px solid #0ea5e9; margin-bottom: 20px; border-radius: 5px; }
    .contact-details { background: white; padding: 20px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${formData.company || 'New Contact'}</h1>
    </div>
    <div class="content">
      <div class="message-box">
        <div class="label">Project Details:</div>
        <p style="margin-top: 10px; white-space: pre-wrap;">${formData.message}</p>
      </div>
      <div class="contact-details">
        <div class="label" style="margin-bottom: 15px;">Contact Information:</div>
        <div class="field">
          <span class="label">Name:</span> ${formData.name}
        </div>
        <div class="field">
          <span class="label">Email:</span> ${formData.email}
        </div>
        ${formData.company ? `<div class="field"><span class="label">Company:</span> ${formData.company}</div>` : ''}
        ${formData.phone ? `<div class="field"><span class="label">Phone:</span> ${formData.phone}</div>` : ''}
        ${formData.service ? `<div class="field"><span class="label">Service:</span> ${formData.service}</div>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Digrro Contact Form <noreply@digrro.com>",
        to: ["info@digrro.com"],
        reply_to: formData.email,
        subject: formData.company || `Contact from ${formData.name}`,
        text: emailBody,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
