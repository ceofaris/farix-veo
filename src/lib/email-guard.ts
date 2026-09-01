/** Shared (client + server) checks for public signup emails. */

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "sharklasers.com",
  "grr.la",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "tempmailo.com",
  "temp-mail.io",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.fr",
  "getnada.com",
  "nada.email",
  "dispostable.com",
  "trashmail.com",
  "trashmail.de",
  "mailnesia.com",
  "fakeinbox.com",
  "maildrop.cc",
  "moakt.com",
  "mohmal.com",
  "emailondeck.com",
  "spamgourmet.com",
  "mytemp.email",
  "tempinbox.com",
  "burnermail.io",
  "mailcatch.com",
  "inboxbear.com",
  "email-temp.com",
  "tmail.ws",
  "luxusmail.org",
  "cloud-mail.top",
  "byom.de",
  "1secmail.com",
  "1secmail.org",
  "vomoto.com",
  "instantemailaddress.com",
]);

const DISPOSABLE_PATTERNS = [
  /temp.*mail/i,
  /mail.*temp/i,
  /throwaway/i,
  /trash.*mail/i,
  /fake.*mail/i,
  /disposable/i,
  /minutemail/i,
  /burner/i,
];

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Returns an error message when the email is not acceptable, else null. */
export function checkSignupEmail(rawEmail: string): string | null {
  const email = normalizeEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return "Enter a valid email address.";
  const domain = email.split("@")[1] ?? "";
  if (DISPOSABLE_DOMAINS.has(domain) || DISPOSABLE_PATTERNS.some((re) => re.test(domain))) {
    return "Temporary / disposable emails are not allowed. Please use a real email (Gmail, Outlook, etc.).";
  }
  return null;
}
