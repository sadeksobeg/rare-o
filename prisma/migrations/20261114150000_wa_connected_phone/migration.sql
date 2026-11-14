-- Additive: the phone number of the linked WhatsApp account (digits, E.164 without +).
-- Set by the worker on connect; used as the wa.me handoff target. No data touched.
ALTER TABLE "WhatsAppConnectionHealth" ADD COLUMN "connectedPhone" TEXT;
