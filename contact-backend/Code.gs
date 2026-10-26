/**
 * Private contact-form backend for Hasan Khan's GitHub Pages site.
 *
 * Keep CONTACT_RECIPIENT in Apps Script > Project Settings > Script Properties.
 * Do not place the recipient email in the website or this repository.
 */
const SITE_URL = "https://hasan2201.github.io";
const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_PER_HOUR = 20;
const MAX_PER_SENDER_PER_HOUR = 2;

function doPost(e) {
  const params = (e && e.parameter) || {};
  const recipient = PropertiesService.getScriptProperties().getProperty("CONTACT_RECIPIENT");

  // Quietly discard bot submissions that fill the hidden honeypot.
  if (String(params.website || "").trim()) {
    return resultPage("Message received", "Thanks for reaching out.", true);
  }

  if (!recipient) {
    return resultPage("Setup needed", "The contact form is not fully configured yet. Please try again later.", false);
  }

  const name = cleanField(params.name, MAX_NAME_LENGTH);
  const email = cleanField(params.email, 254);
  const message = cleanField(params.message, MAX_MESSAGE_LENGTH);
  const startedAt = Number(params.startedAt || 0);
  const elapsed = Date.now() - startedAt;

  if (!name || !isValidEmail(email) || !message) {
    return resultPage("Please check the form", "Add your name, a valid email address, and a message, then try again.", false);
  }

  // Require a real page interaction and reject very old form timestamps.
  if (!startedAt || elapsed < 2500 || elapsed > 24 * 60 * 60 * 1000) {
    return resultPage("Please try again", "Reload the contact page and submit your message again.", false);
  }

  const hour = new Date().toISOString().slice(0, 13);
  const senderHash = shortHash(email.toLowerCase());
  if (!incrementWithinLimit("contact-global-" + hour, MAX_PER_HOUR) ||
      !incrementWithinLimit("contact-sender-" + senderHash + "-" + hour, MAX_PER_SENDER_PER_HOUR)) {
    return resultPage("Please try again later", "The contact form has reached its short-term message limit. Please try again later.", false);
  }

  const subject = "New message from Hasan Khan's website";
  const body = [
    "A visitor sent a message through Hasan Khan's website.",
    "",
    "Name: " + name,
    "Email: " + email,
    "",
    "Message:",
    message
  ].join("\n");

  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: body,
      replyTo: email,
      name: "Hasan Khan website"
    });
  } catch (error) {
    return resultPage("Message not sent", "Something went wrong while sending your message. Please try again later.", false);
  }

  return resultPage("Message sent", "Thanks for reaching out. Your message has been sent.", true);
}

function cleanField(value, maxLength) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function shortHash(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value);
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, "").slice(0, 24);
}

function incrementWithinLimit(key, limit) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const cache = CacheService.getScriptCache();
    const count = Number(cache.get(key) || "0");
    if (count >= limit) return false;
    cache.put(key, String(count + 1), 7200);
    return true;
  } finally {
    lock.releaseLock();
  }
}

function resultPage(title, message, success) {
  const accent = success ? "#8f7cf5" : "#c06a6a";
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const html = [
    "<!doctype html><html lang='en'><head><meta charset='utf-8'>",
    "<meta name='viewport' content='width=device-width, initial-scale=1'>",
    "<title>", safeTitle, " — Hasan Khan</title>",
    "<style>",
    "body{margin:0;background:#101a22;color:#f7f7fb;font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px}",
    "main{max-width:560px;padding:clamp(28px,7vw,54px);border:1px solid rgba(255,255,255,.14);border-radius:16px;background:#182630;box-shadow:0 24px 70px rgba(0,0,0,.25)}",
    "p.kicker{color:", accent, ";font-size:.75rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}",
    "h1{margin:.25em 0;font:500 clamp(2.5rem,8vw,4rem)/1 Georgia,serif;letter-spacing:-.04em}",
    "p{color:#c4ced2}",
    "a{display:inline-block;margin-top:16px;padding:11px 17px;border-radius:999px;background:#9b8cf5;color:#101a22;font-weight:750;text-decoration:none}",
    "</style></head><body><main>",
    "<p class='kicker'>Hasan Khan · Contact</p><h1>", safeTitle, "</h1>",
    "<p>", safeMessage, "</p><a href='", SITE_URL, "'>Return to the site</a>",
    "</main></body></html>"
  ].join("");
  return HtmlService.createHtmlOutput(html).setTitle(title + " — Hasan Khan");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character];
  });
}
