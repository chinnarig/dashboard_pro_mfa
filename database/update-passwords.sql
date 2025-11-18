-- Update passwords with bcrypt hashes
-- Generated on 2025-11-18

-- admin@acme.com (Password: Admin@123)
UPDATE users SET password_hash = '$2b$12$aupB54.gvVvyxq4qmamEr..l60KlnbSMB2SBIRse2wwqebtbWrpVa' WHERE email = 'admin@acme.com';

-- writer@acme.com (Password: Writer@123)
UPDATE users SET password_hash = '$2b$12$cIK3/mHbXOMuUh5a.mUsPOmqn1ch.BflraeLWDVDB53f3jXa7dAee' WHERE email = 'writer@acme.com';

-- reader@acme.com (Password: Reader@123)
UPDATE users SET password_hash = '$2b$12$z7vBQLTEkhUqrZDVBw7TAOl39cBDTHTLYQGhUZ.fAQbXXegI6HETe' WHERE email = 'reader@acme.com';

-- admin@techstart.io (Password: TechAdmin@123)
UPDATE users SET password_hash = '$2b$12$P.aKRn.3UzfA71zU1S.qTecSBBAr5w2XLfjsqI8iGhZ/5Uj8VVgNO' WHERE email = 'admin@techstart.io';

-- Verify updates
SELECT email, 
       substring(password_hash, 1, 20) as hash_prefix,
       length(password_hash) as hash_length,
       role,
       mfa_enabled
FROM users 
WHERE email IN ('admin@acme.com', 'writer@acme.com', 'reader@acme.com', 'admin@techstart.io')
ORDER BY email;
