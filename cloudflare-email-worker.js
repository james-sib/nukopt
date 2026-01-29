/**
 * Cloudflare Email Worker for NukOpt
 * 
 * Receives emails at *@nukopt.com and forwards to our webhook.
 * 
 * SETUP:
 * 1. Go to Cloudflare Dashboard → Workers & Pages → Create Worker
 * 2. Paste this code
 * 3. Go to Email → Email Routing → Routing Rules
 * 4. Add catch-all: * → Send to Worker → Select this worker
 */

export default {
  async email(message, env, ctx) {
    // Extract email data
    const emailData = {
      from: message.from,
      to: message.to,
      subject: message.headers.get("subject") || "(no subject)",
      messageId: message.headers.get("message-id"),
      date: message.headers.get("date"),
      headers: Object.fromEntries(message.headers),
    };

    // Read the raw email body
    try {
      const rawEmail = await new Response(message.raw).text();
      emailData.raw = rawEmail;
      
      // Try to extract text content (simple approach)
      // For full MIME parsing, would need a library
      const textMatch = rawEmail.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\r\n)/i);
      if (textMatch) {
        emailData.text = textMatch[1].trim();
      }
      
      const htmlMatch = rawEmail.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\r\n)/i);
      if (htmlMatch) {
        emailData.html = htmlMatch[1].trim();
      }
      
      // If no multipart, try to get plain body
      if (!emailData.text && !emailData.html) {
        const bodyStart = rawEmail.indexOf("\r\n\r\n");
        if (bodyStart > -1) {
          emailData.text = rawEmail.slice(bodyStart + 4).trim();
        }
      }
    } catch (e) {
      emailData.error = `Failed to read body: ${e.message}`;
    }

    // Forward to NukOpt webhook
    const webhookUrl = env.WEBHOOK_URL || "https://nukopt.onrender.com/api/webhook/email";
    const webhookSecret = env.WEBHOOK_SECRET || "nukopt_webhook_0af6427517d75214f9ec9f3a01c5cb8b";

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": webhookSecret,
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${response.status} ${await response.text()}`);
        // Still accept the email to prevent bounce
      } else {
        console.log(`Email forwarded: ${emailData.to} - ${emailData.subject}`);
      }
    } catch (e) {
      console.error(`Webhook error: ${e.message}`);
      // Accept email anyway to prevent bounce loops
    }

    // Accept the email (don't reject/bounce)
    // message.forward() or message.reject() are other options
  },
};
