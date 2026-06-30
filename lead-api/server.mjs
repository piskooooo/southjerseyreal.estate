import http from "node:http";
import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";

const env = process.env;
const port = Number(env.PORT || 3000);
const maxBodyBytes = Number(env.MAX_BODY_BYTES || 32_768);
const rateLimitWindowMs = Number(env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const rateLimitMax = Number(env.RATE_LIMIT_MAX || 20);
const requestsByIp = new Map();

const csv = (value = "") => value.split(",").map((item) => item.trim()).filter(Boolean);
const allowedOrigins = csv(env.ALLOWED_ORIGINS);

const hasWebhook = Boolean(env.LEAD_WEBHOOK_URL);
const hasSmtp = Boolean(env.LEAD_SMTP_HOST && env.LEAD_TO_EMAIL);

const json = (res, statusCode, body, extraHeaders = {}) => {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    ...extraHeaders,
  });
  res.end(payload);
};

const corsHeaders = (req) => {
  const origin = req.headers.origin;
  if (!origin) return {};
  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      vary: "Origin",
    };
  }
  return {};
};

const getIp = (req) => {
  const forwarded = String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || "");
  return forwarded.split(",")[0].trim() || req.socket.remoteAddress || "unknown";
};

const isRateLimited = (ip) => {
  const now = Date.now();
  const entry = requestsByIp.get(ip) || { resetAt: now + rateLimitWindowMs, count: 0 };

  if (entry.resetAt <= now) {
    entry.resetAt = now + rateLimitWindowMs;
    entry.count = 0;
  }

  entry.count += 1;
  requestsByIp.set(ip, entry);
  return entry.count > rateLimitMax;
};

const readJson = (req) => {
  return new Promise((resolve, reject) => {
    let size = 0;
    let raw = "";

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(Object.assign(new Error("Request body is too large."), { statusCode: 413 }));
        req.destroy();
        return;
      }
      raw += chunk;
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(new Error("Request body must be valid JSON."), { statusCode: 400 }));
      }
    });

    req.on("error", reject);
  });
};

const clean = (value, max = 500) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

const validateLead = (payload) => {
  const lead = {
    firstName: clean(payload.firstName, 80),
    lastName: clean(payload.lastName, 80),
    email: clean(payload.email, 160),
    phone: clean(payload.phone, 80),
    interest: clean(payload.interest, 80),
    message: clean(payload.message, 3000),
    sourceUrl: clean(payload.sourceUrl, 500),
    pagePath: clean(payload.pagePath, 160),
    company: clean(payload.company, 160),
  };

  if (lead.company) return { lead, bot: true, errors: [] };

  const errors = [];
  for (const field of ["firstName", "lastName", "email", "phone", "interest", "message"]) {
    if (!lead[field]) errors.push(`${field} is required`);
  }
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) errors.push("email is invalid");

  return { lead, bot: false, errors };
};

const leadText = (lead, meta) => [
  "New South Jersey Real Estate lead",
  "",
  `Name: ${lead.firstName} ${lead.lastName}`,
  `Email: ${lead.email}`,
  `Phone: ${lead.phone}`,
  `Interest: ${lead.interest}`,
  `Source: ${lead.sourceUrl || lead.pagePath || "unknown"}`,
  `Submitted: ${meta.submittedAt}`,
  `IP: ${meta.ip}`,
  "",
  "Message:",
  lead.message,
].join("\n");

const leadHtml = (lead, meta) => `
  <h2>New South Jersey Real Estate lead</h2>
  <p><strong>Name:</strong> ${lead.firstName} ${lead.lastName}</p>
  <p><strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></p>
  <p><strong>Phone:</strong> <a href="tel:${lead.phone}">${lead.phone}</a></p>
  <p><strong>Interest:</strong> ${lead.interest}</p>
  <p><strong>Source:</strong> ${lead.sourceUrl || lead.pagePath || "unknown"}</p>
  <p><strong>Submitted:</strong> ${meta.submittedAt}</p>
  <p><strong>IP:</strong> ${meta.ip}</p>
  <h3>Message</h3>
  <p>${lead.message.replace(/\n/g, "<br>")}</p>
`;

const sendSmtp = async (lead, meta) => {
  if (!hasSmtp) return undefined;

  const secure = String(env.LEAD_SMTP_SECURE || "").toLowerCase() === "true" || Number(env.LEAD_SMTP_PORT) === 465;
  const transporter = nodemailer.createTransport({
    host: env.LEAD_SMTP_HOST,
    port: Number(env.LEAD_SMTP_PORT || (secure ? 465 : 587)),
    secure,
    auth: env.LEAD_SMTP_USER && env.LEAD_SMTP_PASS
      ? { user: env.LEAD_SMTP_USER, pass: env.LEAD_SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: env.LEAD_FROM_EMAIL || env.LEAD_SMTP_USER || "South Jersey Real Estate <leads@southjerseyreal.estate>",
    to: env.LEAD_TO_EMAIL,
    replyTo: lead.email,
    subject: `New real estate lead: ${lead.firstName} ${lead.lastName} (${lead.interest})`,
    text: leadText(lead, meta),
    html: leadHtml(lead, meta),
  });

  return "smtp";
};

const sendWebhook = async (lead, meta) => {
  if (!hasWebhook) return undefined;

  const headers = { "content-type": "application/json" };
  if (env.LEAD_WEBHOOK_HEADER_NAME && env.LEAD_WEBHOOK_HEADER_VALUE) {
    headers[env.LEAD_WEBHOOK_HEADER_NAME] = env.LEAD_WEBHOOK_HEADER_VALUE;
  }

  const response = await fetch(env.LEAD_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ lead, meta }),
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`);
  }

  return "webhook";
};

const handleLead = async (req, res) => {
  const headers = corsHeaders(req);
  const ip = getIp(req);

  if (isRateLimited(ip)) {
    json(res, 429, { ok: false, error: "Too many lead submissions. Please try again later." }, headers);
    return;
  }

  if (!hasWebhook && !hasSmtp) {
    json(res, 503, { ok: false, error: "Lead destination is not configured." }, headers);
    return;
  }

  const payload = await readJson(req);
  const { lead, bot, errors } = validateLead(payload);

  if (bot) {
    json(res, 202, { ok: true }, headers);
    return;
  }

  if (errors.length) {
    json(res, 400, { ok: false, error: "Please complete the required fields.", fields: errors }, headers);
    return;
  }

  const meta = {
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    ip,
    userAgent: String(req.headers["user-agent"] || ""),
  };

  const deliveries = [];
  for (const deliver of [sendSmtp, sendWebhook]) {
    const result = await deliver(lead, meta);
    if (result) deliveries.push(result);
  }

  console.info(JSON.stringify({ event: "lead_delivered", id: meta.id, deliveries, interest: lead.interest }));
  json(res, 202, { ok: true, id: meta.id, deliveries }, headers);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const headers = corsHeaders(req);

  try {
    if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      res.writeHead(204, headers);
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      json(res, 200, {
        ok: true,
        destinations: {
          smtp: hasSmtp,
          webhook: hasWebhook,
        },
      }, headers);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/leads") {
      await handleLead(req, res);
      return;
    }

    json(res, 404, { ok: false, error: "Not found." }, headers);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    console.error(JSON.stringify({ event: "lead_api_error", statusCode, message: error.message }));
    json(res, statusCode, { ok: false, error: statusCode >= 500 ? "Lead delivery failed." : error.message }, headers);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.info(JSON.stringify({
    event: "lead_api_started",
    port,
    destinations: { smtp: hasSmtp, webhook: hasWebhook },
  }));
});
