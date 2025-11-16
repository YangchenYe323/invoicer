# Invoicer - Tech Stack & Development Guide

## Project Overview
Invoicer is a modern web application for automatically extracting and organizing invoices from email. Users can connect their Gmail accounts via OAuth and view all their invoices in a centralized dashboard.

## Tech Stack

### Frontend
- **Framework**: [TanStack Start](https://tanstack.com/start) - Full-stack React framework with SSR
- **Router**: [TanStack Router](https://tanstack.com/router) - Type-safe routing
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/) - Re-usable component library built on Radix UI
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- **Icons**: [lucide-react](https://lucide.dev/) - Icon library
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js with Nitro server
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **OAuth Provider**: Google OAuth2 for Gmail integration

### Development Tools
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Linter**: Biome
- **Type Checking**: TypeScript 5.7+

## Project Structure

```
invoicer/
├── src/
│   ├── components/        # Reusable UI components (shadcn/ui components)
│   ├── db/               # Database schema and configuration
│   │   ├── schema.ts     # Drizzle schema definitions
│   │   ├── relations.ts  # Database relations
│   │   └── db.ts         # Database client
│   ├── lib/              # Utility functions and configurations
│   │   └── auth.ts       # Better Auth configuration
│   ├── routes/           # File-based routing (TanStack Router)
│   │   ├── __root.tsx    # Root layout
│   │   ├── index.tsx     # Landing page
│   │   ├── login.tsx     # Authentication pages
│   │   └── dashboard/    # Protected dashboard routes
│   └── styles.css        # Global styles and Tailwind imports
├── drizzle/              # Database migrations
├── public/               # Static assets
└── scripts/              # Utility scripts
```

## Database Schema

### Core Tables

#### User (Better Auth)
- `id` - Primary key
- `name` - User name
- `email` - User email (unique)
- `emailVerified` - Email verification status
- Authentication managed by Better Auth

#### Source
- `id` - Auto-incrementing primary key
- `userId` - Foreign key to user
- `emailAddress` - Source email address
- `sourceType` - Type (e.g., "gmail")
- `oauth2AccessToken` - OAuth2 access token
- `oauth2RefreshToken` - OAuth2 refresh token
- `oauth2AccessTokenExpiresAt` - Token expiration
- Stores Gmail OAuth credentials for email ingestion

#### Invoice
- `id` - Auto-incrementing primary key
- `userId` - Foreign key to user
- `sourceId` - Foreign key to source (nullable)
- `messageId` - IMAP message ID
- `invoiceNumber` - Invoice/receipt number
- `vendorName` - Vendor name
- `dueDate` - Payment due date
- `totalAmount` - Total amount (numeric)
- `currency` - Currency code
- `paymentStatus` - Payment status
- `lineItems` - JSONB array of line items

## Authentication Flow

### Email/Password (Better Auth)
1. Users can sign up with email and password
2. Better Auth handles session management
3. Sessions stored in database with user agent and IP tracking

### Gmail OAuth2 Flow
1. User clicks "Add Gmail Source" in dashboard
2. Redirect to Google OAuth consent screen
3. User grants permissions (Gmail readonly scope)
4. Callback receives authorization code
5. Exchange code for access/refresh tokens
6. Store tokens in `source` table
7. Use tokens to access Gmail API via IMAP

Reference implementation: `oauth2.py` (Python script showing OAuth flow)

## Development Guidelines

### Routing (TanStack Router)
- Use file-based routing in `src/routes/`
- Route files export a `Route` constant created with `createFileRoute()`
- Layouts use `createRootRoute()` or route groups
- Protected routes should check authentication status

Example:
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  return <div>Dashboard</div>
}
```

### UI Components (shadcn/ui)
- Install shadcn/ui components as needed using CLI
- Components are copied into `src/components/ui/`
- Customize components by editing the files directly
- Follow shadcn/ui conventions for composition

Installing components:
```bash
npx shadcn@latest add button card input
```

### Styling (Tailwind CSS)
- Use Tailwind utility classes for styling
- Follow mobile-first responsive design
- Use Tailwind's color palette (slate, blue, etc.)
- Custom styles in `src/styles.css` if needed

### State Management
- Use React hooks for local state
- TanStack Router loaders for data fetching
- Server functions for backend logic

### API Routes
- Use TanStack Start server functions
- Create API routes in `src/routes/` with `.ts` extension
- Export functions that run on the server

### Database Operations
- Use Drizzle ORM for all database operations
- Schema defined in `src/db/schema.ts`
- Run migrations with `pnpm db:migrate`
- Generate migrations with `pnpm db:generate`

### Environment Variables
Required in `.env`:
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_OAUTH2_CLIENT_ID=...
GOOGLE_OAUTH2_CLIENT_SECRET=...
```

## Design System

### Color Palette
- **Primary**: Blue (blue-500, blue-600, blue-700)
- **Background**: Slate (slate-800, slate-900)
- **Text**: White/Gray (white, gray-300, gray-400)
- **Accents**: Purple, Pink for gradients

### Typography
- **Headings**: Bold, large sizes (text-4xl, text-6xl)
- **Body**: Regular weight, readable sizes (text-base, text-lg)
- **Code**: Monospace font family

### Spacing
- Use Tailwind's spacing scale (4, 6, 8, 12, 16, etc.)
- Consistent padding and margins across components

### Components
- Cards: `bg-slate-800/50 border border-slate-700 rounded-xl`
- Buttons: `bg-blue-600 hover:bg-blue-700 rounded-lg`
- Inputs: Use shadcn/ui form components
- Hover states: Subtle transitions with `transition-colors`

## OAuth2 Implementation Notes

Based on `oauth2.py`, the Gmail OAuth flow requires:

1. **Authorization URL**:
   - Endpoint: `https://accounts.google.com/o/oauth2/auth`
   - Params: client_id, redirect_uri, scope, response_type=code, access_type=offline, prompt=consent

2. **Token Exchange**:
   - Endpoint: `https://accounts.google.com/o/oauth2/token`
   - Params: client_id, client_secret, code, redirect_uri, grant_type=authorization_code

3. **Token Refresh**:
   - Endpoint: `https://accounts.google.com/o/oauth2/token`
   - Params: client_id, client_secret, refresh_token, grant_type=refresh_token

4. **Required Scope**:
   - `https://mail.google.com/` - Full Gmail access for IMAP

5. **Redirect URI**:
   - Must match registered OAuth app redirect URI
   - For development: `http://localhost:3000/api/oauth/google/callback`

## Commands

- `pnpm dev` - Start development server on port 3000
- `pnpm build` - Build for production
- `pnpm serve` - Preview production build
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm lint` - Run Biome linter

## Best Practices

1. **Type Safety**: Leverage TypeScript fully, avoid `any` types
2. **SSR Considerations**: Be mindful of server vs client code
3. **Security**: Never expose OAuth tokens or secrets to client
4. **Error Handling**: Graceful error states for all operations
5. **Loading States**: Show loading indicators for async operations
6. **Responsive Design**: Mobile-first, test on various screen sizes
7. **Accessibility**: Use semantic HTML and ARIA labels
8. **Performance**: Lazy load components, optimize images

## Notes

- Better Auth tables are auto-managed, do not edit directly
- OAuth tokens should be encrypted at rest (consider encryption layer)
- IMAP connections should be pooled for efficiency
- Invoice extraction will eventually use AI/ML (future enhancement)
