# Testing the Mobile API Postman Collection

## Collection & variables

- **Collection:** `MOBILE_APP_API_Postman_Collection.json`
- **Variables (set in collection or environment):**
  - `base_url` — default: `https://api.schooliat.com` (use `http://localhost:3000` for local backend)
  - `auth_token` — set automatically after login (see below)

## Login (get token)

1. Open **Authentication → POST auth/authenticate**.
2. Set the body to your credentials, for example:

```json
{
  "request": {
    "email": "admin@schooliat.com",
    "password": "Admin@123"
  }
}
```

3. Send the request. From the response, copy the `token` (or the value inside `data.token` / `response.token`, depending on API shape).
4. In Postman: **Collection** (or **Environment**) → **Variables** → set `auth_token` to that token value.  
   All other requests use **Authorization: Bearer {{auth_token}}**.

---

## Seed credentials (for seeded DB only)

These accounts exist only if the backend database has been seeded (e.g. `npm run seed` in `Backend/`). Use them for local or staging testing.

| Role         | Email                    | Password    |
|-------------|---------------------------|-------------|
| Super Admin | `admin@schooliat.com`     | `Admin@123` |
| Employee    | `john.doe@schooliat.com`  | `Employee@123` |
| Employee    | `jane.smith@schooliat.com`| `Employee@123` |
| Employee    | `mike.johnson@schooliat.com` | `Employee@123` |
| School Admin| `admin@gis001.edu`        | `Admin@123` |
| School Admin| `admin@sps002.edu`        | `Admin@123` |
| School Admin| `admin@bfa003.edu`        | `Admin@123` |
| Teacher     | `teacher1@gis001.edu` … `teacherN@gis001.edu` (and same for sps002, bfa003) | `Teacher@123` |
| Student     | `student1@gis001.edu` … `studentN@gis001.edu` (and same for sps002, bfa003) | `Student@123` |

- **Production:** Do not use these; use real accounts from your team or created in the app.
- **Local:** Ensure `base_url` points to your backend (e.g. `http://localhost:3000`) and the DB is seeded.

---

## Optional: save token from login response

To avoid copying the token manually, you can add a **Test** script on **POST auth/authenticate** that parses the response and sets `auth_token`. Example (adjust path if your API returns the token elsewhere):

```javascript
var json = pm.response.json();
var token = json?.data?.token || json?.token;
if (token) {
  pm.collectionVariables.set("auth_token", token);
}
```

Then run **POST auth/authenticate** once; later requests will use the saved token.
