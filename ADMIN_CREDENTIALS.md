# Admin Login Credentials

## Default Admin Account

**Email:** `admin@dtrspro.com`  
**Password:** `admin123`

## How to Create Admin User

### Option 1: Using the Python Script (Recommended)

1. Make sure your backend server is running:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. In a new terminal, run the creation script:
   ```bash
   cd backend
   python create_admin_simple.py
   ```

### Option 2: Using API Call Directly

If the backend is running, you can create the admin user via API:

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "admin@dtrspro.com",
      "role": "admin",
      "firstName": "Admin",
      "lastName": "User"
    },
    "password": "admin123"
  }'
```

Or using PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/auth/register" -Method Post -ContentType "application/json" -Body '{"user":{"email":"admin@dtrspro.com","role":"admin","firstName":"Admin","lastName":"User"},"password":"admin123"}'
```

### Option 3: Using Postman or Similar Tool

1. POST to `http://localhost:8000/auth/register`
2. Body (JSON):
```json
{
  "user": {
    "email": "admin@dtrspro.com",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  },
  "password": "admin123"
}
```

## Login

After creating the admin user, you can login at:
- Frontend: `http://localhost:3000/login`
- Use the credentials above

## Security Note

⚠️ **IMPORTANT:** Change the default password after first login in production!

## Creating Other User Types

### Homeowner User
```json
{
  "user": {
    "email": "homeowner@example.com",
    "role": "homeowner",
    "customerId": "customer_id_here",
    "firstName": "John",
    "lastName": "Doe"
  },
  "password": "password123"
}
```

### Roofer/Partner User
```json
{
  "user": {
    "email": "roofer@example.com",
    "role": "partner",
    "partnerId": "partner_id_here",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "password": "password123"
}
```


