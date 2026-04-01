# Nexus POS - Modern Point of Sale System

Nexus POS is a full-stack Point of Sale (POS) application designed for modern businesses. It features a robust inventory management system, real-time sales tracking, customer loyalty management, and a sleek, responsive user interface.

## Features

- **Dashboard:** Real-time overview of sales, inventory status, and key performance indicators.
- **Point of Sale (POS):** Intuitive interface for processing sales, applying discounts, and handling multiple payment methods (Cash, Card, Mobile Money).
- **Inventory Management:** Track products, manage stock levels, set low-stock thresholds, and log inventory movements.
- **Supplier Management:** Maintain a database of suppliers and their contact information.
- **Customer Management:** Track customer purchases and manage loyalty points.
- **Reports:** Generate detailed reports on sales performance and inventory status.
- **Role-Based Access Control:** Secure access for Admins, Managers, and Cashiers with specific permissions.
- **Dark Mode:** Sleek dark theme support for reduced eye strain.
- **Printable Receipts:** Generate and print professional receipts for every sale.
- **Public Access & Sharing:** Easily share the application with other devices using a QR code and the Shared App URL available in the Settings page.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React (icons), Motion (animations), Sonner (notifications).
- **Backend:** Node.js, Express.js.
- **Database & Auth:** Firebase Firestore, Firebase Authentication.
- **Deployment:** Vercel (Serverless Functions for API).

## Project Structure

- `/src`: Frontend source code.
  - `/components`: Reusable UI components and page layouts.
  - `/lib`: Utility functions.
  - `App.tsx`: Main application entry point and routing.
  - `firebase.ts`: Firebase configuration and initialization.
- `/api`: Vercel serverless function entry point.
- `server.ts`: Express server configuration for local development and API logic.
- `firestore.rules`: Security rules for protecting Firestore data.
- `firebase-blueprint.json`: Data model definition for the application.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in a `.env` file (see `.env.example`).
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

The application is configured for deployment on Vercel. API routes are handled by serverless functions in the `/api` directory, which proxy requests to the logic defined in `server.ts`.

## Security & Public Access

This application is designed for public access. For ease of use, any authenticated user (logged in via Google) is granted **Manager** and **Cashier** permissions by default. This allows anyone with the URL to process sales, manage inventory, and view reports. 

**Admin** privileges are restricted to the system owner (`salahnapari@gmail.com`) and users explicitly granted the 'admin' role in the database.

Security is enforced through Firebase Security Rules (`firestore.rules`), which validate all incoming data to ensure integrity while maintaining accessibility.

## License

This project is public and open for use. It is designed to be a modern, accessible POS system for businesses of all sizes.
