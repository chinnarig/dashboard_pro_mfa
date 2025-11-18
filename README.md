# Dashboard Pro - MFA Enabled

A production-grade Next.js dashboard application with Multi-Factor Authentication (MFA) support, built with TypeScript, Tailwind CSS, and modern React patterns.

## 🚀 Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **State Management:** React Hooks
- **Authentication:** Multi-Factor Authentication (MFA)
- **API Integration:** RESTful API (separate FastAPI/Python backend)

## 📁 Project Structure

```
dashboard_pro_mfa/
├── src/                    # Source code
│   ├── app/               # Next.js App Router pages
│   ├── components/        # Reusable React components
│   ├── lib/              # Utility functions and libraries
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── actions/          # Server actions
├── public/               # Static assets
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── database/             # SQL files for backend reference
└── [config files]        # Configuration files
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dashboard_pro_mfa
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration.

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

### Start Production Server

```bash
npm start
# or
yarn start
# or
pnpm start
```

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- [MFA Quick Start](./docs/MFA_QUICK_START.md)
- [API Documentation](./docs/API_LOCALHOST_UPDATE.md)
- [Configuration Guide](./docs/CONFIGURATION_SUMMARY.md)
- [Full Documentation Index](./docs/README.md)

## 🔒 Features

- ✅ Multi-Factor Authentication (TOTP)
- ✅ Role-based Access Control
- ✅ Responsive Dashboard UI
- ✅ Real-time Data Updates
- ✅ Call Logs Management
- ✅ Agent Management
- ✅ User Management
- ✅ Organization Management

## 🗄️ Backend API

This frontend connects to a separate FastAPI/Python backend. The backend project is maintained separately.

**API Endpoint:** Configure in `.env.local`

## 🔧 Utilities

### Scripts

Utility scripts are located in `/scripts` folder:
- Deployment scripts
- Testing scripts
- Database utilities

See [scripts/README.md](./scripts/README.md) for more information.

## 📝 Environment Variables

Key environment variables (see `.env.example`):

```env
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_APP_NAME=Dashboard Pro
# Add other variables as needed
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 📧 Support

For support and questions, please contact the development team.

---

**Built with ❤️ using Next.js**
