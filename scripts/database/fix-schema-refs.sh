#!/bin/bash

# Fix 'name' field to 'fullName' in select statements
find src -type f -name "*.tsx" -o -name "*.ts" | while read file; do
    # Replace 'name: true,' with 'fullName: true,' in select blocks
    sed -i '' 's/name: true,/fullName: true,/g' "$file"

    # Replace 'user.name' with 'user.fullName'
    sed -i '' 's/user\.name/user.fullName/g' "$file"

    # Replace 'created_at' with 'createdAt'
    sed -i '' 's/created_at/createdAt/g' "$file"

    # Replace 'emailVerified' with 'isEmailVerified'
    sed -i '' 's/emailVerified: true/isEmailVerified: true/g' "$file"

    # Replace 'lastLogin' with 'lastLoginAt'
    sed -i '' 's/lastLogin: true/lastLoginAt: true/g' "$file"
done

echo "✅ Fixed schema field references"
