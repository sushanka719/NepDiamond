-- CreateEnum
CREATE TYPE "DepartureStatus" AS ENUM ('SCHEDULED', 'FULL', 'DEPARTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "trek_departures" (
    "id" UUID NOT NULL,
    "trekId" UUID NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "maxParticipants" INTEGER NOT NULL,
    "status" "DepartureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trek_departures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trek_bookings" (
    "id" UUID NOT NULL,
    "departureId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trek_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trek_booking_payments" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "PaymentProvider" NOT NULL,
    "providerTransactionId" TEXT,
    "providerMetadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trek_booking_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_guides" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "languages" TEXT[],
    "specializations" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trek_departure_guides" (
    "id" UUID NOT NULL,
    "departureId" UUID NOT NULL,
    "guideId" UUID NOT NULL,
    "role" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trek_departure_guides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trek_departures_trekId_idx" ON "trek_departures"("trekId");

-- CreateIndex
CREATE INDEX "trek_departures_departureDate_idx" ON "trek_departures"("departureDate");

-- CreateIndex
CREATE INDEX "trek_departures_status_idx" ON "trek_departures"("status");

-- CreateIndex
CREATE INDEX "trek_bookings_departureId_idx" ON "trek_bookings"("departureId");

-- CreateIndex
CREATE INDEX "trek_bookings_userId_idx" ON "trek_bookings"("userId");

-- CreateIndex
CREATE INDEX "trek_bookings_status_idx" ON "trek_bookings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trek_bookings_departureId_userId_key" ON "trek_bookings"("departureId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "trek_booking_payments_bookingId_key" ON "trek_booking_payments"("bookingId");

-- CreateIndex
CREATE INDEX "trek_booking_payments_userId_idx" ON "trek_booking_payments"("userId");

-- CreateIndex
CREATE INDEX "trek_booking_payments_status_idx" ON "trek_booking_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "company_guides_email_key" ON "company_guides"("email");

-- CreateIndex
CREATE INDEX "trek_departure_guides_departureId_idx" ON "trek_departure_guides"("departureId");

-- CreateIndex
CREATE UNIQUE INDEX "trek_departure_guides_departureId_guideId_key" ON "trek_departure_guides"("departureId", "guideId");

-- AddForeignKey
ALTER TABLE "trek_departures" ADD CONSTRAINT "trek_departures_trekId_fkey" FOREIGN KEY ("trekId") REFERENCES "treks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trek_bookings" ADD CONSTRAINT "trek_bookings_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "trek_departures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trek_bookings" ADD CONSTRAINT "trek_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trek_booking_payments" ADD CONSTRAINT "trek_booking_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "trek_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trek_booking_payments" ADD CONSTRAINT "trek_booking_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trek_departure_guides" ADD CONSTRAINT "trek_departure_guides_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "trek_departures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trek_departure_guides" ADD CONSTRAINT "trek_departure_guides_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "company_guides"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
