# Procurement Management System (Backend API)

This is the backend API for the Procurement Management System, built with Node.js, Express, and MongoDB/Mongoose. It supports dynamic checklist template creation, workflow verification, role-based authorization (RBAC), and image attachments for inspections.

## Tech Stack
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB
*   **ODM:** Mongoose
*   **Authentication:** JSON Web Tokens (JWT) + bcryptjs for password hashing
*   **Input Validation:** Joi
*   **File Uploads:** Multer (for saving inspection photos)

---

## Directory Structure
```text
├── src/
│   ├── config/          # Configurations (Database connection)
│   ├── controllers/     # Controller layer (Business logic)
│   ├── middlewares/     # Middlewares (Auth, Error handling, Multer, Validation)
│   ├── models/          # Mongoose models (User, Order, Checklist, Submission)
│   ├── routes/          # API Route definitions
│   ├── uploads/         # Directory where uploaded files are stored statically
│   └── utils/           # Validation schemas & utilities
├── .env                 # Environment variables
├── server.js            # App entry point
└── package.json
```

---

## Setup & Running Locally

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Variables:** Create a `.env` file in the root directory (based on `.env` settings):
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    BASE_URL=/api/v1/procurement
    ```
3.  **Run in Development Mode (with Nodemon):**
    ```bash
    npm run dev
    ```
4.  **Run in Production Mode:**
    ```bash
    npm start
    ```

---

## Roles & Permissions
This application implements Role-Based Access Control (RBAC). The application roles are:
*   `admin`: Full access to update order statuses.
*   `procurement_manager`: Creates orders, checklist templates, and links checklist templates to orders.
*   `inspection_manager`: Submits checklist inspection answers and uploads half-loading images. Can also update order statuses.
*   `client`: Can view orders/details (implicit).

---

## API Endpoints Documentation

All routes are prefixed with the base URL configured in `.env` (default is `/api/v1/procurement`). Below, paths assume this default.

### 1. Authentication (`/auth`)

#### **Login User**
*   **URL:** `/api/v1/procurement/auth/login`
*   **Method:** `POST`
*   **Auth Required:** No
*   **Body Parameters (JSON):**
    *   `email` (String, Optional)
    *   `mobile` (String, Optional)
    *   `password` (String, Required)
*   *Note:* You must provide either `email` or `mobile` with `password` to login. Returns a JWT Bearer token.

#### **Register User**
*   **URL:** `/api/v1/procurement/auth/register`
*   **Method:** `POST`
*   **Auth Required:** No
*   **Body Parameters (JSON):**
    *   `role` (String, Required): Must be `'admin'`, `'procurement_manager'`, `'inspection_manager'`, or `'client'`.
    *   `email` (String, Optional/Required if no mobile)
    *   `mobile` (String, Optional/Required if no email)
    *   `password` (String, Required): Minimum 6 characters.
    *   `managerId` (String, Optional)
*   *Note:* The body must contain either `email` or `mobile`.

---

### 2. Users CRUD (`/users`)
All user routes require the header `Authorization: Bearer <JWT_TOKEN>`.

#### **List All Users**
*   **URL:** `/api/v1/procurement/users`
*   **Method:** `GET`
*   **Auth Required:** Yes (Role: `admin` only)

#### **Get User Profile by ID**
*   **URL:** `/api/v1/procurement/users/:id`
*   **Method:** `GET`
*   **Auth Required:** Yes (Admin, or the user themselves)

#### **Update User details**
*   **URL:** `/api/v1/procurement/users/:id`
*   **Method:** `PUT`
*   **Auth Required:** Yes (Admin, or the user themselves)
*   **Body Parameters (JSON):** Any fields to update: `role`, `email`, `mobile`, `managerId`, `password`.
*   *Note:* Non-admin users cannot change their own role.

#### **Delete User**
*   **URL:** `/api/v1/procurement/users/:id`
*   **Method:** `DELETE`
*   **Auth Required:** Yes (Role: `admin` only)

---

### 3. Orders CRUD (`/orders`)
All order routes require the header `Authorization: Bearer <JWT_TOKEN>`.

#### **Create Order**
*   **URL:** `/api/v1/procurement/orders`
*   **Method:** `POST`
*   **Auth Required:** Yes (Role: `procurement_manager`)
*   **Body Parameters (JSON):**
    *   `clientId` (String, Required): MongoDB ObjectId of the Client.
    *   `details` (String, Required)
    *   `inspectionManagerId` (String, Optional)
    *   `checklistTemplateId` (String, Optional)

#### **List Orders**
*   **URL:** `/api/v1/procurement/orders`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   *Note:* Filtered dynamically. Admins see all. PMs see orders they created. IMs see orders assigned to them. Clients see their own orders.

#### **Get Order details**
*   **URL:** `/api/v1/procurement/orders/:id`
*   **Method:** `GET`
*   **Auth Required:** Yes (Admin, or the users linked to this order)

#### **Update Order**
*   **URL:** `/api/v1/procurement/orders/:id`
*   **Method:** `PUT`
*   **Auth Required:** Yes (Admin, or the PM who created the order)
*   **Body Parameters (JSON):** Any fields to update: `clientId`, `inspectionManagerId`, `checklistTemplateId`, `details`, `status`.

#### **Update Order Status**
*   **URL:** `/api/v1/procurement/orders/:id/status`
*   **Method:** `PATCH`
*   **Auth Required:** Yes (Admin, PM creator, or assigned IM)
*   **Body Parameters (JSON):**
    *   `status` (String, Required): New status (`created`, `in_transit`, `inspected`, `completed`).

#### **Link Checklist to Order**
*   **URL:** `/api/v1/procurement/orders/link-checklist`
*   **Method:** `POST`
*   **Auth Required:** Yes (Admin, or PM creator)
*   **Body Parameters (JSON):**
    *   `orderId` (String, Required)
    *   `checklistTemplateId` (String, Required)

#### **Delete Order**
*   **URL:** `/api/v1/procurement/orders/:id`
*   **Method:** `DELETE`
*   **Auth Required:** Yes (Admin, or PM creator)

---

### 4. Checklist Templates CRUD (`/checklists/templates`)
All routes require the header `Authorization: Bearer <JWT_TOKEN>`.

#### **Create Template**
*   **URL:** `/api/v1/procurement/checklists/templates`
*   **Method:** `POST`
*   **Auth Required:** Yes (Role: `procurement_manager`)
*   **Body Parameters (JSON):**
    *   `title` (String, Required)
    *   `fields` (Array of Objects, Required):
        *   `label` (String, Required)
        *   `type` (String, Required): `'boolean'`, `'dropdown'`, `'checkbox'`, `'file'`, `'text'`.
        *   `options` (Array of Strings): Required if type is `'dropdown'` or `'checkbox'`.
        *   `isRequired` (Boolean, Default: `true`)

#### **List Templates**
*   **URL:** `/api/v1/procurement/checklists/templates`
*   **Method:** `GET`
*   **Auth Required:** Yes

#### **Get Template by ID**
*   **URL:** `/api/v1/procurement/checklists/templates/:id`
*   **Method:** `GET`
*   **Auth Required:** Yes

#### **Update Template**
*   **URL:** `/api/v1/procurement/checklists/templates/:id`
*   **Method:** `PUT`
*   **Auth Required:** Yes (Admin, or PM creator)
*   **Body Parameters (JSON):** `title`, `fields`

#### **Delete Template**
*   **URL:** `/api/v1/procurement/checklists/templates/:id`
*   **Method:** `DELETE`
*   **Auth Required:** Yes (Admin, or PM creator)

---

### 5. Checklist Submissions CRUD (`/checklists/submissions`)
All routes require the header `Authorization: Bearer <JWT_TOKEN>`.

#### **Submit Checklist (Inspection)**
*   **URL:** `/api/v1/procurement/checklists/submissions`
*   **Method:** `POST`
*   **Auth Required:** Yes (Role: `inspection_manager`)
*   **Format:** `multipart/form-data`
*   **Form Fields:**
    *   `orderId` (String, Required)
    *   `answers` (JSON Array String, Required)
    *   `halfLoadingImage` (File Binary, Optional/Required if file field is required in template)

#### **List Submissions**
*   **URL:** `/api/v1/procurement/checklists/submissions`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   *Note:* Filtered dynamically. Admins/PMs see all. IMs see their own submissions.

#### **Get Submission by ID**
*   **URL:** `/api/v1/procurement/checklists/submissions/:id`
*   **Method:** `GET`
*   **Auth Required:** Yes (Admin, PM, or the IM who created the submission)

#### **Update Submission**
*   **URL:** `/api/v1/procurement/checklists/submissions/:id`
*   **Method:** `PUT`
*   **Auth Required:** Yes (Admin, or the IM who created it)
*   **Format:** `multipart/form-data`
*   **Form Fields:**
    *   `answers` (JSON Array String, Optional)
    *   `halfLoadingImage` (File Binary, Optional)

#### **Delete Submission**
*   **URL:** `/api/v1/procurement/checklists/submissions/:id`
*   **Method:** `DELETE`
*   **Auth Required:** Yes (Role: `admin` only)

