-- Seed SuperAdmin for local testing (upsert by email)
INSERT INTO "super_admin" ("id", "email", "password", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'aneesshaikh@gmail.com',
  '$2b$12$D89gVWosomTMsuXIRykzXOZQvsfZEPpImCL6HogxMKHadYT9SIHX2',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "password" = EXCLUDED."password",
  "updatedAt" = NOW();
