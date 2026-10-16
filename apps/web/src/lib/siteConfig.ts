/**
 * Real contact details and social links go here, in one place.
 * Leave a value empty until it is confirmed: the UI shows a disabled,
 * clearly "pending configuration" state for anything empty.
 */
export const siteConfig = {
  /** WhatsApp number in international format, digits only, e.g. "91XXXXXXXXXX". */
  whatsappNumber: "",
  whatsappMessage: "Hello Pratyangi Fashions, I would like to know more about your sarees.",
  /** Full profile URLs, e.g. "https://www.instagram.com/<account>". */
  social: {
    instagram: "",
    youtube: "",
    facebook: "",
    linkedin: "",
    x: "",
  },
};

export type SocialKey = keyof typeof siteConfig.social;

/** `wa.me` link, or null while no number is configured. */
export const getWhatsAppHref = () =>
  siteConfig.whatsappNumber
    ? `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(siteConfig.whatsappMessage)}`
    : null;
