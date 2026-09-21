# InvoicePro™ Enterprise Edition

**Professional Invoice Management System**

Developed by **Your Company Name** - Professional Software Solutions

---

## 🚀 Overview

InvoicePro™ is a comprehensive invoice management system designed to streamline your billing process and help you get paid faster. Built with modern technology for businesses of all sizes.

## 🧪 Local Development: Clerk Webhooks with ngrok

Clerk's webhooks (`user.created`, `user.updated`, `user.deleted`) hit our route at [`app/api/webhooks/clerk/route.ts`](app/api/webhooks/clerk/route.ts), which creates/updates profiles in Supabase. Clerk is a **cloud service** and cannot reach `localhost`, so for local testing you expose the route through **ngrok**.

### 1. Start the app
```bash
npm run dev
```
(Next.js on `http://localhost:3000`)

### 2. Expose port 3000 with ngrok
```bash
ngrok http 3000
```
ngrok prints a forwarding URL, e.g. `https://abcd-123-456.ngrok.app`. Keep this terminal running — the URL changes whenever ngrok restarts.

### 3. Point Clerk at your endpoint
1. Open the **Clerk Dashboard → Webhooks** for your app.
2. Click **Add Endpoint** and set the URL to your ngrok URL plus the webhook path:
   ```
   https://abcd-123-456.ngrok.app/api/webhooks/clerk
   ```
3. Subscribe to the events the sync depends on:
   - `user.created` (creates the `profiles` row + trial)
   - `user.updated` (syncs name/email to the existing profile)
   - `user.deleted` (removes the DB profile)
4. Copy the generated **Signing Secret** (`whsec_...`) and set it in your local `.env`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_...
   ```
   Restart `npm run dev` so the env var is picked up.

### 4. Verify the handshake
1. In the Clerk Dashboard → Webhooks, click **Send Test** on your endpoint — Clerk POSTs a sample `user.created` to your ngrok URL.
2. Open **http://127.0.0.1:4040** — ngrok's local inspector shows the incoming request, the `svix-signature` header, and the JSON `200` response.
3. Confirm the server log shows the idempotent `ensureProfile` upsert ran (e.g. a `CLERK_WEBHOOK` info line).

> **Heads-up:** every `ngrok http 3000` restart issues a new subdomain, so update the endpoint URL in the Clerk Dashboard afterwardable. If you get `400` "Webhook verification failed", the `CLERK_WEBHOOK_SECRET` doesn't match the dashboard's Signing Secret — re-copy it.


## ✨ Key Features

### 📄 Invoice Management
- **Create & Edit Invoices** - Intuitive form with real-time calculations
- **Multiple Templates** - Customizable invoice templates with branding
- **Status Tracking** - Draft, Sent, Paid, Overdue status management
- **Multi-Currency Support** - USD, EUR, GBP, CAD and more

### 👥 Client Management
- **Client Database** - Comprehensive client information storage
- **Payment Terms** - Customizable payment terms per client
- **Client Analytics** - Track client payment history and outstanding balances

### 💰 Payment & Expense Tracking
- **Payment Recording** - Multiple payment methods support
- **Expense Management** - Categorized expense tracking
- **Tax Management** - Tax deductible expense tracking

### 📊 Reports & Analytics
- **Financial Reports** - Revenue, expenses, and profit analysis
- **Visual Charts** - Interactive charts and graphs
- **Export Functionality** - Export reports in multiple formats

### 🎨 Template Customization
- **Custom Templates** - Create personalized invoice templates
- **Brand Customization** - Colors, fonts, and layout options
- **Field Management** - Show/hide invoice fields as needed

### 🖨️ Print & Export
- **Print Optimization** - Professional print layouts
- **PDF Export** - Generate PDF invoices (ready for integration)
- **Email Integration** - Send invoices directly (ready for email service)

## 🛠️ Technical Stack

- **Frontend**: Next.js 13 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Language**: TypeScript
- **State Management**: Custom React hooks
- **Data Storage**: Local Storage (ready for database integration)

## 📋 System Requirements

- Node.js 18.0 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Minimum 4GB RAM
- 100MB available disk space

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd invoicepro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📖 User Guide

### Getting Started
1. **Company Setup** - Configure your company information in Settings
2. **Add Clients** - Create client profiles with contact information
3. **Create Templates** - Design custom invoice templates
4. **Generate Invoices** - Create and send professional invoices

### Best Practices
- Set up company information before creating invoices
- Use consistent template designs for brand recognition
- Track payments regularly for better cash flow management
- Export regular reports for financial analysis

## 🔧 Configuration

### Company Settings
- Company name, address, and contact information
- Logo upload and branding
- Tax ID and business registration details

### User Preferences
- Default currency and payment terms
- Date and number formats
- Email signatures and notifications

### Template Management
- Create multiple template designs
- Customize colors, fonts, and layouts
- Set default templates for different client types

## 📞 Support & Maintenance

### Technical Support
- **Email**: support@yourcompany.com
- **Phone**: +1 (555) 123-4567
- **Website**: www.yourcompany.com

### Maintenance Schedule
- Regular updates and security patches
- Feature enhancements based on user feedback
- 24/7 monitoring and support

## 📄 License & Legal

### Software License
This software is licensed for use by the client organization under the terms of the Software License Agreement.

### Intellectual Property
- **InvoicePro™** is a trademark of Your Company Name
- All rights reserved © 2024 Your Company Name
- Unauthorized reproduction or distribution is prohibited

### Compliance
- GDPR compliant data handling
- SOC 2 Type II security standards
- Industry-standard encryption

## 🔄 Version History

### Version 1.0.0 - Enterprise Edition
- Initial release with full feature set
- Invoice creation and management
- Client and payment tracking
- Template customization
- Reports and analytics

---

**Developed by Your Company Name**  
*Professional Software Solutions*

For technical support or licensing inquiries, please contact our support team.