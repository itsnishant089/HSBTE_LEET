# HSBTE LEET Counseling System

This document outlines the architecture, setup, and usage of the Counseling Admission System implemented for the HSBTE LEET platform.

## 📁 File Structure

The counseling system consists of the following key files:

### Frontend Pages
1. **`html/counseling.html`**
   * **Purpose**: The main user-facing portal.
   * **Features**:
     * Marketing landing page with ₹49 offer details.
     * **Step Progress Bar**: Visual indicator (Register -> Payment -> Form) to reduce drop-offs.
     * User registration with comprehensive personal details (Category, Domicile, Diploma, DOB, etc.).
     * **Inline Guidance**: Helpful tips for branch selection based on rank.
     * Login mechanism for returning users.
     * Razorpay payment integration with coupon code support (`HSBTE50`, `LEET2026`).
     * Dynamic counseling request form (5 fixed branch choices, dynamic college preferences, and a checkbox to bypass college selection).
     * **Tracking CTA**: Persistent link for existing users to track their requests.

2. **`html/user-counseling.html`**
   * **Purpose**: The student dashboard.
   * **Features**:
     * Users can log in to view their submitted counseling requests.
     * Displays all choices and preferred colleges submitted.
     * **PDF Allotment Report**: Students can download a professional PDF of their recommended colleges to show parents or keep for reference (uses `jsPDF`).
     * **Revision History**: Tracks and displays previous admin recommendations if a request is updated, ensuring transparency.
     * Displays the **Admin Response** (Recommended Allotment: Sr No, College, Branch, and Remarks) once reviewed.
     * **Chat with Admin**: Direct messaging system to ask queries and receive guidance from experts. Includes a reminder to check frequently for responses.

3. **`html/counseling-admin.html`**
   * **Purpose**: The administrative dashboard.
   * **Features**:
     * Secure admin panel to view all incoming student requests.
     * Dashboard tab tracking **Total Counseling Revenue**, Pending Requests, and Recent Activity.
     * **Advanced Filters**: Filter requests by Rank range, Category, or Status.
     * **Smart Search**: Search students by Name, Mobile, or Email instantly.
     * **Bulk Actions**: Mark multiple requests as "Sent" in one click.
     * **Revision Tracking**: Automatically saves history of previous responses when an admin updates a recommendation.
     * Separated workflow categories: Pending, Reviewed, and Sent.
     * **Dynamic Choice Builder**: Admins can add multiple allotment choices dynamically, drag-to-reorder them, or import them directly using JSON.
     * **Student Chat Management**: Dedicated section to view student conversations, reply to messages, and track unread chats via badges.
     * **Add User Manually**: Allows admins to create accounts and mark payments manually for students who paid via direct UPI/Cash.
     * **Password Visibility**: Admins can view student passwords in the "Registered Students" list to assist with account recovery.
     * **Email Notifications**: Integrated with EmailJS to notify students when their response is ready.

### Backend/Database Setup
* **`sql/counseling-setup.sql`**
   * **Purpose**: Supabase PostgreSQL table definitions and Row Level Security (RLS) policies.
   * **Tables**:
     1. `counseling_users`: Stores user credentials and personal demographic data.
     2. `counseling_requests`: Stores the actual counseling application (rank, branch choices, college preferences as JSON, and notes).
     3. `counseling_responses`: Stores the admin's suggestions, including dynamic `allotment_choices` as a JSONB array.
     4. `counseling_payments`: Logs Razorpay payment IDs, amounts, and coupon usages.
     5. `counseling_chats`: Stores student-admin messages, sender identification, and read/unread status.

### 📧 Email Automation (EmailJS)
Integrated via **service_zlxv3q4** and **template_w2fdh1s**:
* **Welcome Email**: Sent to students upon purchase.
* **Admin Alert**: Sent to nishant@hsbteleet.com for new orders.
* **Response Notification**: Sent to students when admin updates their counseling allotment.
* **Credentials**: Centralized in both `counseling.html` and `counseling-admin.html`.

## 🛠 Setup & Migration Instructions

If you are setting this up for the first time, run the entire `counseling-setup.sql` in your Supabase SQL Editor.

**Updating an Existing Database:**
If you previously ran an older version of the SQL script, you MUST run the migration block found at the bottom of the `counseling-setup.sql` file. This adds the new dynamic fields (like `college_preferences` JSON array, `category`, `dob`, `diploma_haryana`, `resident_haryana`, etc.) and the `counseling_chats` table without dropping your existing user data.

### 🌐 Local vs Production Routing
The project is optimized for deployment on **Cloudflare Pages**, where `functions/_middleware.js` handles "Clean URLs" (e.g., `/counseling` internally serves `/html/counseling.html`).

**For Local Development (VS Code Live Server, etc.):**
*   Links in `header.html` and main pages have been updated to use the explicit path format: `/html/FILENAME.html`.
*   This ensures navigation works without "Cannot GET" errors on simple local servers that do not support URL rewrites.
*   **Navbar Breakpoints**: Breakpoints have been unified to `1100px` to match the custom CSS in `main.css`, preventing the "disappearing navbar" issue on certain tablet resolutions.

## 🚀 Workflow Summary

1. **User Registers/Logs In**: User provides personal details on `counseling.html`.
2. **Payment**: User pays ₹49 via Razorpay or uses a 100% discount coupon.
3. **Email Notification**: User receives a welcome email; admin receives a new order alert.
4. **Form Submission**: User submits their Rank, Branch Preferences, and College Preferences.
5. **Admin Review**: Admin opens `counseling-admin.html`, views the request, and fills out the "Recommended Allotment". Admin sets status to `sent`.
6. **Student Notified**: Student receives an email notification that their response is ready.
7. **Student View**: Student opens `user-counseling.html`, sees their recommended allotment table.

## 🔒 Security Notes
* **RLS Policies**: Row Level Security is enabled on all tables.
* **Passwords**: Passwords are currently stored as plain hashes.
* **DevTools Hardening**: Scripts block Right-Click and Developer Tool shortcuts.
* **Admin Access**: `counseling-admin.html` is protected by a prompt-based password check (`Nishant@089`).
