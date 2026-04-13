# Manual API Testing Guide

> Test all endpoints using **Postman**, **Thunder Client** (VS Code), or **Bruno**.

**Base URL:** `http://localhost:3000/api`

---

## 1. Auth Endpoints

### Register
```
POST {{baseURL}}/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "referralCode": "REF123"
}
```
**Expected:** `201 Created` with user data

---

### Login
```
POST {{baseURL}}/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```
**Expected:** `200 OK` with `{ accessToken, refreshToken }`

**Save:** Copy `accessToken` and `refreshToken` from response.

---

### Refresh Token
```
POST {{baseURL}}/users/refresh-token
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}"
}
```
**Expected:** `200 OK` with new `{ accessToken, refreshToken }`

---

### Logout (Protected)
```
POST {{baseURL}}/users/logout
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}"
}
```
**Expected:** `200 OK`

---

### Forgot Password
```
POST {{baseURL}}/users/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```
**Expected:** `200 OK` (check server logs for the reset link)

---

### Reset Password
```
POST {{baseURL}}/users/reset-password
Content-Type: application/json

{
  "token": "<reset-token-from-email>",
  "newPassword": "newpassword123"
}
```
**Expected:** `200 OK`

---

## 2. User Profile Endpoints (Protected)

> All require: `Authorization: Bearer {{accessToken}}`

### Get Profile
```
GET {{baseURL}}/users/profile
Authorization: Bearer {{accessToken}}
```
**Expected:** `200 OK` with user profile data

---

### Update Profile
```
PUT {{baseURL}}/users/profile
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "9876543211"
}
```
**Expected:** `200 OK` with updated user data

---

## 3. Address Endpoints (Protected)

> All require: `Authorization: Bearer {{accessToken}}`

### List Addresses
```
GET {{baseURL}}/users/addresses
Authorization: Bearer {{accessToken}}
```
**Expected:** `200 OK` with array of addresses

---

### Create Address
```
POST {{baseURL}}/users/addresses
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "country": "India",
  "addressType": "home",
  "isDefault": true
}
```
**Expected:** `201 Created`

**Save:** Copy `id` from response for update/delete tests.

---

### Update Address
```
PUT {{baseURL}}/users/addresses/:id
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "name": "John Doe Updated",
  "city": "Delhi"
}
```
**Expected:** `200 OK`

---

### Delete Address
```
DELETE {{baseURL}}/users/addresses/:id
Authorization: Bearer {{accessToken}}
```
**Expected:** `200 OK`

---

## 4. Store Endpoints (Public)

### List Products
```
GET {{baseURL}}/store/products
```
**Expected:** `200 OK` with paginated products

**Query Params:** `?page=1&limit=10&category=skincare`

---

### Get Product
```
GET {{baseURL}}/store/products/:id
```
**Expected:** `200 OK` with single product

---

### List Services
```
GET {{baseURL}}/store/services
```
**Expected:** `200 OK` with paginated services

---

### Get Service
```
GET {{baseURL}}/store/services/:id
```
**Expected:** `200 OK` with single service

---

## 5. Plans Endpoints (Public)

### List Plans
```
GET {{baseURL}}/plans
```
**Expected:** `200 OK` with subscription plans

---

### List Plan Addons
```
GET {{baseURL}}/plans/:planId/addons
```
**Expected:** `200 OK` with addons for that plan

---

## 6. Swagger Documentation

Access interactive API docs at:
```
GET http://localhost:3000/api/docs
```

---

## Quick Test Checklist

| # | Test | Method | Endpoint | Expected |
|---|------|--------|----------|----------|
| 1 | Register | POST | `/users/register` | 201 |
| 2 | Login | POST | `/users/login` | 200 + tokens |
| 3 | Refresh Token | POST | `/users/refresh-token` | 200 + new tokens |
| 4 | Get Profile | GET | `/users/profile` | 200 |
| 5 | Update Profile | PUT | `/users/profile` | 200 |
| 6 | Create Address | POST | `/users/addresses` | 201 |
| 7 | List Addresses | GET | `/users/addresses` | 200 |
| 8 | Update Address | PUT | `/users/addresses/:id` | 200 |
| 9 | Delete Address | DELETE | `/users/addresses/:id` | 200 |
| 10 | Logout | POST | `/users/logout` | 200 |
| 11 | List Products | GET | `/store/products` | 200 |
| 12 | Get Product | GET | `/store/products/:id` | 200 |
| 13 | List Services | GET | `/store/services` | 200 |
| 14 | Get Service | GET | `/store/services/:id` | 200 |
| 15 | List Plans | GET | `/plans` | 200 |
| 16 | Plan Addons | GET | `/plans/:id/addons` | 200 |

---

## Error Cases to Test

| Test | Request | Expected |
|------|---------|----------|
| Login with wrong password | POST `/users/login` wrong creds | `401 Unauthorized` |
| Access protected without token | GET `/users/profile` no header | `401 Unauthorized` |
| Register with duplicate email | POST `/users/register` existing email | `409 Conflict` |
| Invalid email format | POST `/users/register` bad email | `400 Bad Request` |
| Short password | POST `/users/register` < 8 chars | `400 Bad Request` |
| Non-existent product | GET `/store/products/invalid-id` | `404 Not Found` |
