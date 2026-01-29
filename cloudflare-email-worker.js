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
      
      // Extract boundary from Content-Type header if multipart
      const boundaryMatch = rawEmail.match(/boundary="?([^"\r\n]+)"?/i);
      const boundary = boundaryMatch ? boundaryMatch[1] : null;
      
      // Helper to decode content based on transfer encoding
      function decodeContent(content, encoding) {
        if (!content) return content;
        encoding = (encoding || '').toLowerCase();
        if (encoding === 'base64') {
          try {
            return atob(content.replace(/\s/g, ''));
          } catch (e) {
            return content;
          }
        }
        if (encoding === 'quoted-printable') {
          return content
            .replace(/=\r?\n/g, '')
            .replace(/=([0-9A-F]{2})/gi, (_, hex) => 
              String.fromCharCode(parseInt(hex, 16)));
        }
        return content;
      }
      
      // Try to extract text content
      if (boundary) {
        // Multipart: find text/plain section
        const textSectionMatch = rawEmail.match(
          new RegExp(`Content-Type:\\s*text/plain[^\\r\\n]*([\\s\\S]*?)(?=\\r\\n--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i')
        );
        if (textSectionMatch) {
          const section = textSectionMatch[1];
          const encodingMatch = section.match(/Content-Transfer-Encoding:\\s*([^\r\n]+)/i);
          const encoding = encodingMatch ? encodingMatch[1].trim() : '';
          const bodyStart = section.indexOf('\r\n\r\n');
          if (bodyStart > -1) {
            const body = section.slice(bodyStart + 4).trim();
            emailData.text = decodeContent(body, encoding);
          }
        }
        
        // Find HTML section
        const htmlSectionMatch = rawEmail.match(
          new RegExp(`Content-Type:\\s*text/html[^\\r\\n]*([\\s\\S]*?)(?=\\r\\n--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i')
        );
        if (htmlSectionMatch) {
          const section = htmlSectionMatch[1];
          const encodingMatch = section.match(/Content-Transfer-Encoding:\\s*([^\r\n]+)/i);
          const encoding = encodingMatch ? encodingMatch[1].trim() : '';
          const bodyStart = section.indexOf('\r\n\r\n');
          if (bodyStart > -1) {
            const body = section.slice(bodyStart + 4).trim();
            emailData.html = decodeContent(body, encoding);
          }
        }
      }
      
      // If no multipart or extraction failed, try simple body extraction
      if (!emailData.text && !emailData.html) {
        const encodingMatch = rawEmail.match(/Content-Transfer-Encoding:\\s*([^\r\n]+)/i);
        const encoding = encodingMatch ? encodingMatch[1].trim() : '';
        const bodyStart = rawEmail.indexOf("\r\n\r\n");
        if (bodyStart > -1) {
          const body = rawEmail.slice(bodyStart + 4).trim();
          emailData.text = decodeContent(body, encoding);
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
