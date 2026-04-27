# SelfOrder — Modern Digital Menu & Ordering System

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**SelfOrder** is a web-based self-service ordering platform designed to enhance restaurant operational efficiency. This application allows customers to order directly from their tables via QR Codes and provides a comprehensive management panel for admins, kitchen staff, and cashiers in real-time.

##  Key Features

- **Customer Self-Ordering:** A responsive interface for customers to browse menus, customize orders, and checkout directly from their own devices.
- **Real-time Order Tracking:** Integrated **Server-Sent Events (SSE)** for instant order status updates to the kitchen and cashier stations.
- **Admin Dashboard:** Comprehensive sales statistics, revenue reports, and menu inventory management.
- **Kitchen Display System (KDS):** A dedicated panel for kitchen staff to process incoming orders based on queue priority.
- **Cashier Management:** Integrated payment management with real-time table status tracking.
- **Table Management:** Table layout configuration and unique QR Code generation for every table.
- **Dynamic Menu:** Manage categories, pricing, stock availability, and menu images dynamically.

##  System Architecture

The project is built with a focus on performance and scalability:

1.  **Full-stack Next.js:** Utilizing the **App Router** for optimal routing performance and Server Components.
2.  **Type-safe Database:** Powered by **Prisma ORM** with PostgreSQL/Supabase for robust data integrity.
3.  **State Management:** Leveraging **Zustand** for a lightweight and fast customer cart management.
4.  **Real-time Communication:** Implementation of SSE (Server-Sent Events) for data synchronization without excessive server overhead.

##  Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Supabase/Prisma)
- **Styling:** Tailwind CSS & Shadcn UI
- **State Management:** Zustand
- **Real-time:** Server-Sent Events (SSE)
- **Authentication:** NextAuth.js

##  Getting Started

### Prerequisites
- Node.js (Latest Version)
- PostgreSQL Database (Supabase recommended)

### Installation Steps

1.  **Clone the Repository:**
    ```bash
    https://github.com/ilhamramdanii/Self-Service-Ordering-System.git
    cd Self-Service-Ordering-System
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy the `.env.example` file to `.env` and fill in your database credentials:
    ```bash
    DATABASE_URL="postgresql://..."
    NEXTAUTH_SECRET="your-secret"
    ```

4.  **Setup Database:**
    Run Prisma migrations to prepare the table structures:
    ```bash
    npx prisma migrate dev
    ```

5.  **Run the Application:**
    ```bash
    npm run dev
    ```

##  Validation

Run the linter to ensure code quality is maintained:
```bash
npm run lint
```

##  License
This project is licensed under the MIT License - see the [LICENSE] file for details.

---
*Built with ❤️ by ilhamramdanii*
