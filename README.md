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

### 1. Authentication

#### **Register User**
*   **URL:** `/api/v1/procurement/auth/register`
*   **Method:** `POST`
*   **Auth Required:** No
*   **Body Parameters (JSON):**
    *   `role` (String, Required): Must be `'admin'`, `'procurement_manager'`, `'inspection_manager'`, or `'client'`.
    *   `email` (String, Optional/Required if no mobile): User email.
    *   `mobile` (String, Optional/Required if no email): 10-digit number.
    *   `password` (String, Required): Minimum 6 characters.
    *   `managerId` (String, Optional): 24-character hex MongoDB ObjectId of the manager.
*   *Note:* The body must contain either `email` or `mobile`.

#### **Login User**
*   **URL:** `/api/v1/procurement/auth/login`
*   **Method:** `POST`
*   **Auth Required:** No
*   **Body Parameters (JSON):**
    *   `email` (String, Optional)
    *   `mobile` (String, Optional)
    *   `password` (String, Required)
*   *Note:* You must provide either `email` or `mobile` with `password` to login. Returns a JWT Bearer token.

---

### 2. Orders

#### **Create Order**
*   **URL:** `/api/v1/procurement/orders`
*   **Method:** `POST`
*   **Auth Required:** Yes (Role: `procurement_manager`)
*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Body Parameters (JSON):**
    *   `clientId` (String, Required): MongoDB ObjectId of the Client.
    *   `details` (String, Required): Description/details of the order.

#### **Update Order Status**
*   **URL:** `/api/v1/procurement/orders/:orderId/status`
*   **Method:** `PATCH`
*   **Auth Required:** Yes (Roles: `admin`, `procurement_manager`, `inspection_manager`)
*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Body Parameters (JSON):**
    *   `status` (String, Required): The new status of the order (e.g. `pending`, `inspected`, `approved`, etc.)

#### **Link Checklist to Order**
*   **URL:** `/api/v1/procurement/orders/link-checklist`
*   **Method:** `POST`
*   **Auth Required:** Yes (Role: `procurement_manager`)
*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Body Parameters (JSON):**
    *   `orderId` (String, Required): MongoDB ObjectId of the Order.
    *   `checklistTemplateId` (String, Required): MongoDB ObjectId of the Checklist Template.

---

### 3. Checklists

#### **Create Checklist Template**
*   **URL:** `/api/v1/procurement/checklists/template`
*   **Method:** `POST`
*   **Auth Required:** Yes (Role: `procurement_manager`)
*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Body Parameters (JSON):**
    *   `title` (String, Required): Title of the checklist.
    *   `fields` (Array of Objects, Required):
        *   `label` (String, Required): The name of the question/field (e.g., `"Cooler present"`).
        *   `type` (String, Required): Must be `'boolean'`, `'dropdown'`, `'checkbox'`, `'file'`, or `'text'`.
        *   `options` (Array of Strings): Required ONLY if type is `'dropdown'` or `'checkbox'`.
        *   `isRequired` (Boolean, Default: `true`)

#### **Submit Checklist Inspection**
*   **URL:** `/api/v1/procurement/checklists/submit`
*   **Method:** `POST`
*   **Auth Required:** Yes (Role: `inspection_manager`)
*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Format:** `multipart/form-data`
*   **Form Fields:**
    *   `orderId` (String, Required): The MongoDB ObjectId of the Order.
    *   `answers` (Valid JSON String representing Array of Objects, Required):
        *   Example format for the string value:
            ```json
            [
              { "questionLabel": "Are server racks securely strapped?", "type": "boolean", "value": true },
              { "questionLabel": "Transport Vehicle Category", "type": "dropdown", "value": "Climate-Controlled Van" },
              { "questionLabel": "Driver Contact Verified", "type": "boolean", "value": true },
              { "questionLabel": "Summary Notes", "type": "text", "value": "All hardware accounted for and padded correctly." }
            ]
            ```
    *   `halfLoadingImage` (File Binary, Optional/Required if field `isRequired` is true in template): The image upload field processed by Multer.
