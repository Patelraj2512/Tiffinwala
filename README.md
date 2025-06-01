# Tiffinwala Attendance Manager

A modern web application for managing attendance and operations for a tiffin service business. Built with React, TypeScript, and Express.js.

## Features

- 📊 Attendance tracking and management
- 👥 Employee management
- 📱 Responsive design with modern UI
- 🔐 Secure authentication
- 📈 Analytics and reporting
- 🎨 Beautiful UI using Shadcn UI components
- 🌙 Dark mode support

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- React Router DOM
- React Query
- React Hook Form
- Zod for validation
- Recharts for data visualization

### Backend
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn or bun

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tiffinwala-attendance-manager.git
cd tiffinwala-attendance-manager
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
bun install
```

3. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Development

To start the development server:

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

The application will be available at `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
# or
bun run build
```

## Scripts

- `dev` - Start development server
- `build` - Create production build
- `build:dev` - Create development build
- `lint` - Run ESLint
- `preview` - Preview production build

## Project Structure

```
tiffinwala-attendance-manager/
├── public/             # Static files
├── server/            # Backend server code
├── src/               # Frontend source code
│   ├── components/    # React components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Utility functions
│   └── types/        # TypeScript type definitions
├── scripts/          # Build and utility scripts
└── package.json      # Project dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Maintainers

- Raj Patel(https://github.com/Patelraj2512) - Project Lead & Developer

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 