# Frontend - Online Voting System

React + Vite frontend for the Online Voting System.

## 📁 Structure

```
frontend/
├── public/           # Static assets
│   └── vote-icon.svg
├── src/
│   ├── components/   # Reusable components
│   │   └── Navbar.jsx
│   ├── contexts/     # React contexts
│   │   └── AuthContext.jsx
│   ├── pages/        # Page components
│   │   ├── admin/    # Admin pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminVoters.jsx
│   │   │   ├── AdminElections.jsx
│   │   │   ├── AdminCreateElection.jsx
│   │   │   └── AdminAuditLogs.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Elections.jsx
│   │   ├── ElectionDetail.jsx
│   │   ├── Vote.jsx
│   │   ├── Results.jsx
│   │   ├── Profile.jsx
│   │   └── NotFound.jsx
│   ├── services/     # API services
│   │   └── api.js
│   ├── config/       # Configuration
│   │   └── firebase.js
│   ├── App.jsx       # Main app component
│   ├── main.jsx      # Entry point
│   └── index.css     # Global styles
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Firebase config
```

### 3. Start Development Server
```bash
npm run dev
```

Access at: http://localhost:3000

## 🎨 Pages

### Public Pages
- **Home** (`/`) - Landing page
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - New user registration

### User Pages
- **Dashboard** (`/dashboard`) - User dashboard
- **Elections** (`/elections`) - Browse elections
- **Election Detail** (`/elections/:id`) - View election details
- **Vote** (`/vote/:electionId`) - Cast vote
- **Results** (`/results/:electionId`) - View results
- **Profile** (`/profile`) - User profile

### Admin Pages
- **Admin Dashboard** (`/admin`) - Admin overview
- **Voters** (`/admin/voters`) - Manage voters
- **Elections** (`/admin/elections`) - Manage elections
- **Create Election** (`/admin/elections/create`) - Create election
- **Audit Logs** (`/admin/audit-logs`) - View logs

## 🔐 Environment Variables

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:5000/api
```

## 🛠️ Dependencies

### Core
- **react** ^18.2.0 - UI library
- **react-dom** ^18.2.0 - React DOM renderer
- **react-router-dom** ^6.21.0 - Routing

### Firebase
- **firebase** ^10.7.1 - Firebase SDK

### HTTP & Utils
- **axios** ^1.6.2 - HTTP client
- **lucide-react** ^0.294.0 - Icons
- **date-fns** ^3.0.0 - Date utilities

### Dev Dependencies
- **vite** ^5.0.8 - Build tool
- **@vitejs/plugin-react** ^4.2.1 - React plugin
- **eslint** - Code linting

## 🎨 Styling

- Custom CSS with CSS variables
- Responsive design
- Modern UI components
- Beautiful color scheme

### Color Palette
- Primary: `#2563eb` (Blue)
- Secondary: `#10b981` (Green)
- Danger: `#ef4444` (Red)
- Warning: `#f59e0b` (Orange)

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
```

Output: `dist/` folder

### Preview Production Build
```bash
npm run preview
```

### Deploy to Firebase Hosting
```bash
# From project root
firebase deploy --only hosting
```

## 🧪 Development

### Proxy Configuration
The Vite config proxies `/api` requests to `http://localhost:5000` during development.

### Hot Module Replacement
Vite provides fast HMR for rapid development.

### ESLint
```bash
npm run lint
```

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Routes

All routes are defined in `src/App.jsx`:
- Public routes (accessible to all)
- Protected routes (require authentication)
- Admin routes (require admin role)

## 🔐 Authentication

Authentication is managed by `AuthContext`:
- Sign up, login, logout
- Token management
- User state persistence
- Admin role checking

## 📡 API Integration

API calls are centralized in `src/services/api.js`:
- Automatic token attachment
- Error handling
- Request/response interceptors

## 🎯 Features

- Single Page Application (SPA)
- Client-side routing
- Protected routes
- Role-based access
- Responsive design
- Real-time updates
- Form validation
- Error handling
- Loading states

## 🆘 Troubleshooting

**Vite not starting:**
- Check if port 3000 is available
- Try: `npm run dev -- --port 3001`

**Firebase error:**
- Verify .env file has all Firebase config
- Check Firebase Authentication is enabled

**API connection error:**
- Ensure backend is running on port 5000
- Check VITE_API_URL in .env

**Build errors:**
- Clear cache: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`

## 📞 Support

See main README.md in root directory for complete documentation.

## 🚀 Production Deployment

### Update API URL
In production .env:
```env
VITE_API_URL=https://your-api-domain.com/api
```

### Build
```bash
npm run build
```

### Deploy
```bash
firebase deploy --only hosting
```

Your app will be live at: `https://your-project.web.app`

