UPDATE users
   SET role = 'user', updated_at = now()
 WHERE role = 'admin'
   AND lower(email) <> 'huakaifugui2.0@gmail.com';

UPDATE users
   SET role = 'admin', updated_at = now()
 WHERE lower(email) = 'huakaifugui2.0@gmail.com';
