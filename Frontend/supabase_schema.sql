-- Supabase Database Schema for Truck Dispatch System
-- Paste this script into the SQL Editor on your Supabase dashboard (https://supabase.com)

-- Enable UUID extension for string-based primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums safely
DO $$
BEGIN
  BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'DRIVER', 'CUSTOMER');
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    CREATE TYPE "RequestStatus" AS ENUM (
      'PENDING',
      'QUOTED',
      'ASSIGNED',
      'IN_TRANSIT',
      'DELIVERED',
      'CANCELLED'
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;

-- 2. Create User Profile Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public."User" (
  "id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "fullName" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "role" "Role" DEFAULT 'CUSTOMER'::"Role" NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'User'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."User";
  END IF;
END
$$;

-- 3. Create Driver Profile Table
CREATE TABLE IF NOT EXISTS public."Driver" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" UUID UNIQUE NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
  "licenseNo" TEXT UNIQUE NOT NULL,
  "phone" TEXT NOT NULL,
  "availability" TEXT DEFAULT 'AVAILABLE' NOT NULL,
  "currentCity" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'Driver'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."Driver";
  END IF;
END
$$;

-- 4. Create LoadRequest Table
CREATE TABLE IF NOT EXISTS public."LoadRequest" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "weightKg" DOUBLE PRECISION NOT NULL,
  "distanceKm" DOUBLE PRECISION NOT NULL,
  "priority" TEXT DEFAULT 'STANDARD' NOT NULL,
  "requestedDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "status" "RequestStatus" DEFAULT 'PENDING'::"RequestStatus" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'LoadRequest'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."LoadRequest";
  END IF;
END
$$;

-- 5. Create Quote Table
CREATE TABLE IF NOT EXISTS public."Quote" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "loadRequestId" TEXT UNIQUE NOT NULL REFERENCES public."LoadRequest"("id") ON DELETE CASCADE,
  "baseCost" DOUBLE PRECISION NOT NULL,
  "fuelSurcharge" DOUBLE PRECISION NOT NULL,
  "weightCharge" DOUBLE PRECISION NOT NULL,
  "priorityCharge" DOUBLE PRECISION NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "validUntil" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'Quote'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."Quote";
  END IF;
END
$$;

-- 6. Create Dispatch Table
CREATE TABLE IF NOT EXISTS public."Dispatch" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "loadRequestId" TEXT UNIQUE NOT NULL REFERENCES public."LoadRequest"("id") ON DELETE CASCADE,
  "driverId" TEXT NOT NULL REFERENCES public."Driver"("id") ON DELETE RESTRICT,
  "assignedById" UUID NOT NULL REFERENCES public."User"("id") ON DELETE RESTRICT,
  "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "currentStatus" "RequestStatus" DEFAULT 'ASSIGNED'::"RequestStatus" NOT NULL,
  "etaDate" TIMESTAMP WITH TIME ZONE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'Dispatch'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."Dispatch";
  END IF;
END
$$;

-- 7. Create StatusLog Table
CREATE TABLE IF NOT EXISTS public."StatusLog" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "dispatchId" TEXT NOT NULL REFERENCES public."Dispatch"("id") ON DELETE CASCADE,
  "status" "RequestStatus" NOT NULL,
  "note" TEXT,
  "updatedById" UUID NOT NULL REFERENCES public."User"("id") ON DELETE RESTRICT,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'StatusLog'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."StatusLog";
  END IF;
END
$$;

-- 8. Auth Trigger: Automatically create public."User" when user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, "fullName", email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'fullName', 'New User'),
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::"Role", 'CUSTOMER'::"Role")
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;
