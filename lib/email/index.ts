export { getResendClient, sendEmail } from "@/lib/email/client";
export type { SendEmailInput } from "@/lib/email/client";
export { welcomeEmailTemplate } from "@/lib/email/templates/welcome";
export type { EmailTemplate } from "@/lib/email/templates/welcome";
export {
  sendCustomerTrackingEmail,
  sendSupplierOrderEmail,
} from "@/lib/email/fulfillment";
