# Nexus POS - Full-Stack Point of Sale System

A modern, full-stack Point of Sale (POS) system built with **React**, **Vite**, **Express**, and **Firebase**.

## 🚀 Features

- **Real-time Inventory Management:** Track products, categories, and stock levels.
- **POS Interface:** Fast, responsive checkout experience.
- **Secure Payments:** Integrated with **Paystack** for mobile money and card payments.
- **Receipt Generation:** Automatic receipt generation with QR codes for digital invoices.
- **Analytics Dashboard:** Visualize sales trends and performance.
- **User Authentication:** Secure login via Google Authentication.
- **Dark/Light Mode:** Seamless theme switching.

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS, Lucide Icons, Recharts, Framer Motion.
- **Backend:** Node.js, Express.
- **Database & Auth:** Firebase Firestore, Firebase Auth.
- **Deployment:** Optimized for Vercel.

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/nexus-pos.git
   cd nexus-pos
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🚀 Deployment

This project is pre-configured for **Vercel**. 

1. Push your code to GitHub.
2. Connect your repository to Vercel.
3. Add your environment variables in the Vercel dashboard.
4. Add your Vercel URL to the **Authorized Domains** in the Firebase Console.

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by Salah Napari
