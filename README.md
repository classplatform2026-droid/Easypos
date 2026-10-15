# ShopPOS - Cloud POS & Retail Management

A modern, responsive, and full-featured Point of Sale (POS) and retail management application with real-time sync, offline fallback, inventory management, and platform administration.

## Features
- **POS Register**: Instant cart calculations, discounts, tax/VAT computation, barcode scanning, and multi-format receipt printing (58mm, 80mm, A4).
- **Product Catalog**: Stock tracking, low-stock alerts, SKU/barcode lookup, and category organization.
- **Real-Time Updates**: Instant synchronization via Socket.IO for inventory, payments, and staff permissions.
- **Multi-Tenant Architecture**: Supports single and multi-store workflows with role-based access control (SuperAdmin, Admin, Owner, Manager, Cashier).
- **Persistent Storage**: Hybrid persistence supporting MongoDB with automatic in-memory and local document store fallback (`data/mongodb.json`).
- **PWA Ready**: Offline caching, installable on mobile and desktop devices.

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
