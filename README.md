# 🎯 RG Salon Admin Dashboard

<div align="center">

![Admin Dashboard](https://img.shields.io/badge/Admin-Dashboard-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF?style=for-the-badge&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

**A modern, feature-rich admin dashboard for salon management system**

[🚀 Live Demo](https://salon-admin-dashboard-phcoder05.vercel.app) • [📖 Documentation](#documentation) • [🐛 Report Bug](https://github.com/PHCoder05/salon-admin-dashboard/issues) • [✨ Request Feature](https://github.com/PHCoder05/salon-admin-dashboard/issues)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [🔧 Configuration](#-configuration)
- [📱 Screenshots](#-screenshots)
- [🏗️ Project Structure](#️-project-structure)
- [🔥 Key Components](#-key-components)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)

---

## ✨ Features

### 🎛️ **Core Dashboard**
- **Real-time Analytics** - Live business metrics and KPIs
- **Revenue Tracking** - Comprehensive financial analytics
- **Appointment Management** - Complete booking system
- **Client Management** - Customer data and relationship tracking
- **Staff Performance** - Employee metrics and productivity analysis

### 🏢 **SaaS Management Platform**
- **Multi-tenant Architecture** - Manage multiple salon locations
- **API Usage Monitoring** - Track and analyze API consumption
- **Data Management** - Centralized data operations
- **Security Center** - Advanced security controls
- **Communication Hub** - Integrated messaging system

### 👥 **User & Client Management**
- **User Roles & Permissions** - Granular access control
- **Client Data Management** - Complete customer profiles
- **Advanced Filtering** - Smart search and filter capabilities
- **Bulk Operations** - Efficient data management tools

### 📊 **Analytics & Reporting**
- **Interactive Charts** - Dynamic data visualization
- **Custom Reports** - Flexible reporting system
- **Export Capabilities** - Multiple format exports (CSV, Excel, PDF)
- **Performance Metrics** - Detailed business insights

### 📱 **Communication Center**
- **WhatsApp Integration** - Automated messaging
- **Email Campaigns** - Marketing automation
- **Notification System** - Real-time alerts
- **Meeting Management** - Video conference integration

### 🔧 **System Management**
- **Backup & Recovery** - Data protection systems
- **Health Monitoring** - System performance tracking
- **Issue Resolution** - Automated problem detection
- **Version Control** - Release management

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18.2.0** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework

### **UI Components**
- **Lucide React** - Beautiful icons
- **Framer Motion** - Smooth animations
- **React Query** - Efficient data fetching
- **React Router** - Client-side routing

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **TypeScript** - Static type checking

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/PHCoder05/salon-admin-dashboard.git

# Navigate to project directory
cd salon-admin-dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser and navigate to
http://localhost:5173
```

---

## 📦 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 or **yarn** >= 1.22.0
- **Git** for version control

### Step-by-step Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PHCoder05/salon-admin-dashboard.git
   cd salon-admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # Using yarn
   yarn install
   
   # Using pnpm
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit environment variables
   nano .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=https://your-api-endpoint.com
VITE_API_KEY=your_api_key_here

# Authentication
VITE_AUTH_DOMAIN=your-auth-domain.com
VITE_CLIENT_ID=your_client_id

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_WHATSAPP=true
VITE_ENABLE_MEETINGS=true

# Third-party Services
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Build Configuration

The project uses Vite for building. Configuration can be found in `vite.config.ts`:

```typescript
// Custom build optimizations
export default defineConfig({
  build: {
    target: 'es2020',
    cssTarget: 'chrome80',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mui': ['@mui/material'],
          'vendor-charts': ['chart.js', 'recharts']
        }
      }
    }
  }
})
```

---

## 📱 Screenshots

<div align="center">

### 🏠 Dashboard Overview
![Dashboard](https://via.placeholder.com/800x400/667eea/ffffff?text=Dashboard+Overview)

### 📊 Analytics Panel
![Analytics](https://via.placeholder.com/800x400/48bb78/ffffff?text=Analytics+Panel)

### 👥 User Management
![Users](https://via.placeholder.com/800x400/ed8936/ffffff?text=User+Management)

### 🏢 SaaS Platform
![SaaS](https://via.placeholder.com/800x400/9f7aea/ffffff?text=SaaS+Platform)

</div>

---

## 🏗️ Project Structure

```
salon-admin-dashboard/
├── 📁 public/                 # Static assets
├── 📁 src/
│   ├── 📁 components/         # Reusable UI components
│   │   ├── 📁 Dashboard/      # Dashboard widgets
│   │   ├── 📁 SaaS/          # SaaS management components
│   │   ├── 📁 Users/         # User management
│   │   ├── 📁 Layout/        # Layout components
│   │   └── 📁 ui/            # Base UI components
│   ├── 📁 pages/             # Page components
│   ├── 📁 hooks/             # Custom React hooks
│   ├── 📁 contexts/          # React contexts
│   ├── 📁 services/          # API services
│   ├── 📁 styles/            # Global styles
│   └── 📁 types/             # TypeScript definitions
├── 📄 package.json           # Dependencies
├── 📄 vite.config.ts         # Vite configuration
├── 📄 tailwind.config.js     # Tailwind configuration
└── 📄 tsconfig.json          # TypeScript configuration
```

---

## 🔥 Key Components

### 📊 Dashboard Components
- **RevenueChart** - Interactive revenue visualization
- **StatsCard** - KPI display cards
- **RecentActivity** - Live activity feed
- **UserActivityChart** - User engagement metrics

### 🏢 SaaS Management
- **EnhancedSaaSOverview** - Platform overview
- **APIUsageTab** - API monitoring
- **DataManagementTab** - Data operations
- **SecurityCenterTab** - Security controls

### 👥 User Management
- **UserTable** - Advanced user listing
- **CreateUserModal** - User creation form
- **UserFilters** - Search and filter controls
- **UserStats** - User analytics

### 📱 Communication
- **MeetingIntegration** - Video conference system
- **WhatsAppManager** - Messaging automation
- **CommunicationReports** - Communication analytics

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   Add your environment variables in the Vercel dashboard.

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting provider**
   ```bash
   # Upload the 'dist' folder to your web server
   rsync -avz dist/ user@server:/path/to/web/root/
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository
```bash
git clone https://github.com/PHCoder05/salon-admin-dashboard.git
cd salon-admin-dashboard
```

### 2. Create Feature Branch
```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 4. Commit Changes
```bash
git commit -m "✨ Add amazing feature"
```

### 5. Push to Branch
```bash
git push origin feature/amazing-feature
```

### 6. Open Pull Request
Create a detailed pull request with:
- Clear description of changes
- Screenshots (if UI changes)
- Test results

### Code Style Guidelines
- Use TypeScript for all new components
- Follow React best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 PHCoder05

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👨‍💻 Author

<div align="center">

**PHCoder05**

[![GitHub](https://img.shields.io/badge/GitHub-PHCoder05-181717?style=for-the-badge&logo=github)](https://github.com/PHCoder05)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/phcoder05)
[![Twitter](https://img.shields.io/badge/Twitter-Follow-1DA1F2?style=for-the-badge&logo=twitter)](https://twitter.com/phcoder05)

</div>

---

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide** for the beautiful icons
- **Vite** for the lightning-fast build tool
- **Community** for feedback and contributions

---

## 📈 Project Stats

![GitHub stars](https://img.shields.io/github/stars/PHCoder05/salon-admin-dashboard?style=social)
![GitHub forks](https://img.shields.io/github/forks/PHCoder05/salon-admin-dashboard?style=social)
![GitHub issues](https://img.shields.io/github/issues/PHCoder05/salon-admin-dashboard)
![GitHub pull requests](https://img.shields.io/github/issues-pr/PHCoder05/salon-admin-dashboard)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [PHCoder05](https://github.com/PHCoder05)

</div> 