export type ContactNotificationWork = {
  inquiryId: string;
  notificationKey: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  sourcePath: string;
  createdAt: string;
  firstAttemptAt: string;
  attemptCount: number;
};

function submissionTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "America/New_York",
  }).format(date);
}

export function renderContactNotification(work: ContactNotificationWork): {
  subject: string;
  textContent: string;
} {
  const subject = `[Website Inquiry] ${work.interest} - ${work.name}`.slice(
    0,
    180,
  );
  const lines = [
    "A new South Jersey Real Estate website inquiry was received.",
    "",
    `Name: ${work.name}`,
    `Email: ${work.email}`,
    `Phone: ${work.phone}`,
    `Interest: ${work.interest}`,
    `Submitted: ${submissionTime(work.createdAt)}`,
    `Source: ${work.sourcePath}`,
    `Inquiry ID: ${work.inquiryId}`,
    "",
    "Message:",
    work.message,
    "",
    "Reply to this email to respond directly to the visitor.",
    "This contact inquiry did not subscribe the visitor to newsletters.",
  ];
  return { subject, textContent: lines.join("\n") };
}
