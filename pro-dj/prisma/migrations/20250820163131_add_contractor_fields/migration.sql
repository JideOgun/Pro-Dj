-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "agreedToContractorTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agreedToServiceProviderTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "contractorTermsAgreedAt" TIMESTAMP(3),
ADD COLUMN     "contractorTermsVersion" TEXT,
ADD COLUMN     "isCorporation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "serviceProviderTermsAgreedAt" TIMESTAMP(3),
ADD COLUMN     "serviceProviderTermsVersion" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "w9Submitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "w9SubmittedAt" TIMESTAMP(3);
