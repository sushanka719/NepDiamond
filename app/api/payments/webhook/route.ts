import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextRequest } from "next/server";
import Stripe from "stripe";

export const config = { api: { bodyParser: false } };

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) return Response.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return Response.json({ error: `Webhook signature failed: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? "");

    if (meta.type === "trek_booking" && meta.bookingId) {
      await prisma.trekBookingPayment.update({
        where: { bookingId: meta.bookingId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          providerTransactionId: session.id,
          providerMetadata: { paymentIntentId },
        },
      });
    }

    if (meta.type === "guide_hire" && meta.hireId) {
      await prisma.payment.update({
        where: { guideHireId: meta.hireId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          providerTransactionId: session.id,
          providerMetadata: { paymentIntentId },
        },
      });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    if (meta.type === "trek_booking" && meta.bookingId) {
      await prisma.trekBookingPayment.updateMany({
        where: { bookingId: meta.bookingId, status: "PENDING" },
        data: { status: "FAILED", failureReason: "Checkout session expired" },
      });
    }

    if (meta.type === "guide_hire" && meta.hireId) {
      await prisma.payment.updateMany({
        where: { guideHireId: meta.hireId, status: "PENDING" },
        data: { status: "FAILED", failureReason: "Checkout session expired" },
      });
    }
  }

  return Response.json({ received: true });
}
