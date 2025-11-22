# Proactive Outreach Brain CRM - File Structure

This document provides a complete overview of all the key files that make up the application.

## 📁 Project Structure

```
proactive-outreach-crm/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   ├── components/              # Reusable UI components
│   │   ├── lib/                     # Client utilities
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── contexts/                # React contexts
│   │   └── App.tsx                  # Main app component
│   ├── public/                      # Static assets
│   └── index.html                   # HTML entry point
├── server/                          # Backend Express + tRPC
│   ├── _core/                       # Core server infrastructure
│   ├── db.ts                        # Database query helpers
│   ├── routers.ts                   # tRPC API routes
│   ├── iphone-extractor.ts          # iPhone backup parsing
│   ├── iphone-router.ts             # iPhone upload endpoint
│   ├── google-integration.ts        # Google API integration
│   └── google-router.ts             # Google OAuth endpoints
├── drizzle/                         # Database schema & migrations
│   └── schema.ts                    # Database table definitions
├── shared/                          # Shared types & constants
└── storage/                         # S3 storage helpers
```

---

## 🗄️ Database Schema (`drizzle/schema.ts`)

**Purpose**: Defines all database tables and their relationships

**Tables**:
- `users` - User accounts with OAuth integration
- `customers` - Customer information (name, email, phone, address, notes)
- `interactions` - All customer interactions (calls, SMS, emails, calendar events)
- `services` - Services provided to customers
- `outreachLogs` - Outreach attempts and responses
- `dataSources` - Import history tracking
- `googleCredentials` - Google OAuth tokens

**Key Exports**:
- Type definitions for all tables
- Insert types for creating records

---

## 🔧 Backend Files

### `server/db.ts`
**Purpose**: Database query helpers and business logic

**Key Functions**:

**User Management**:
- `upsertUser()` - Create or update user
- `getUserByOpenId()` - Get user by OAuth ID

**Customer Management**:
- `getCustomersByUserId()` - Get all customers for a user
- `getCustomerById()` - Get single customer
- `createCustomer()` - Create new customer
- `updateCustomer()` - Update customer info
- `deleteCustomer()` - Delete customer

**Interaction Management**:
- `createInteraction()` - Log interaction
- `getInteractionsByCustomerId()` - Get customer interactions
- `getInteractionsByUserId()` - Get all user interactions

**Service Management**:
- `createService()` - Log service
- `getServicesByCustomerId()` - Get customer services
- `getServicesByUserId()` - Get all user services

**Outreach Management**:
- `createOutreachLog()` - Log outreach attempt
- `getAllOutreachLogs()` - Get all outreach logs
- `getOutreachLogsByCustomerId()` - Get customer outreach
- `getLastOutreachLog()` - Get most recent outreach
- `updateOutreachLog()` - Update outreach record

**Data Source Management**:
- `createDataSource()` - Track import
- `getDataSourcesByUserId()` - Get import history

**Google Credentials**:
- `saveGoogleCredentials()` - Store OAuth tokens
- `getGoogleCredentials()` - Retrieve tokens

**Utilities**:
- `normalizePhoneNumber()` - Convert to E.164 format
- `normalizeEmail()` - Lowercase email
- `findCustomerByPhone()` - Match customer by phone
- `findCustomerByEmail()` - Match customer by email

**Recommendations**:
- `getRecommendations()` - Smart recommendation engine with scoring

---

### `server/routers.ts`
**Purpose**: tRPC API endpoints (type-safe API)

**Routers**:

**`auth`**:
- `me` - Get current user
- `logout` - Clear session

**`customers`**:
- `list` - Get all customers
- `getById` - Get customer by ID
- `create` - Create customer
- `update` - Update customer
- `delete` - Delete customer

**`interactions`**:
- `getByCustomerId` - Get customer interactions

**`services`**:
- `list` - Get all services
- `getByCustomerId` - Get customer services
- `create` - Create service

**`outreach`**:
- `listAll` - Get all outreach logs
- `getByCustomerId` - Get customer outreach
- `getLast` - Get last outreach
- `create` - Log outreach

**`recommendations`**:
- `get` - Get smart recommendations

**`dataSources`**:
- `list` - Get import history

**`google`**:
- `getCredentials` - Check Google connection

---

### `server/iphone-extractor.ts`
**Purpose**: Parse iPhone backup SQLite databases

**Key Functions**:
- `extractSMSData()` - Parse sms.db for messages
- `extractCallHistory()` - Parse CallHistory.storedata for calls
- `processIPhoneBackup()` - Main extraction orchestrator

**Features**:
- Converts Apple Core Data timestamps to Unix timestamps
- Normalizes phone numbers to E.164 format
- Matches interactions to existing customers
- Returns matched and unmatched counts

---

### `server/iphone-router.ts`
**Purpose**: Express endpoint for iPhone backup uploads

**Endpoint**: `POST /api/iphone/upload`

**Features**:
- Multer file upload handling
- Accepts `sms.db` and `CallHistory.storedata`
- Processes databases and stores interactions
- Returns import statistics

---

### `server/google-integration.ts`
**Purpose**: Google API integration (Gmail & Calendar)

**Key Functions**:
- `getOAuthClient()` - Create Google OAuth client
- `getAuthUrl()` - Generate OAuth URL
- `exchangeCodeForTokens()` - Exchange auth code for tokens
- `fetchGmailMessages()` - Retrieve emails
- `fetchCalendarEvents()` - Retrieve calendar events
- `syncGoogleData()` - Main sync orchestrator

**Features**:
- OAuth 2.0 flow
- Email direction detection (incoming/outgoing)
- Calendar attendee extraction
- Customer matching by email
- Token refresh handling

---

### `server/google-router.ts`
**Purpose**: Express endpoints for Google OAuth

**Endpoints**:
- `GET /api/google/auth` - Initiate OAuth flow
- `GET /api/google/callback` - OAuth callback handler
- `POST /api/google/sync` - Trigger data sync

---

## 🎨 Frontend Files

### `client/src/App.tsx`
**Purpose**: Main application component with routing

**Routes**:
- `/` - Dashboard (Home)
- `/customers` - Customer list
- `/customers/:id` - Customer detail
- `/recommendations` - Smart recommendations
- `/outreach` - Outreach log
- `/services` - Service tracking
- `/import` - Data import

---

### `client/src/pages/Home.tsx`
**Purpose**: Dashboard landing page

**Features**:
- System statistics (customers, services, data sources)
- Quick action cards
- Navigation to main features

---

### `client/src/pages/Customers.tsx`
**Purpose**: Customer list and management

**Features**:
- Customer list with search
- Add new customer dialog
- Links to customer details

---

### `client/src/pages/CustomerDetail.tsx`
**Purpose**: Individual customer profile

**Features**:
- Customer information display
- Edit customer dialog
- Tabbed interface:
  - **Interactions**: Timeline of all interactions
  - **Services**: Service history
  - **Outreach**: Outreach log
- Log new outreach
- Add new service

---

### `client/src/pages/Recommendations.tsx`
**Purpose**: Smart recommendation engine UI

**Features**:
- Service keyword filter
- Recommendation limit control
- Scored customer list with reasoning
- Links to customer details

---

### `client/src/pages/OutreachLog.tsx`
**Purpose**: Centralized outreach tracking

**Features**:
- All outreach logs across customers
- Filter by customer name
- Filter by response type
- Sort by date or customer
- Quick log outreach dialog
- Links to customer details

---

### `client/src/pages/Services.tsx`
**Purpose**: Service tracking and management

**Features**:
- Services grouped by customer
- Service count statistics
- Links to customer details

---

### `client/src/pages/DataImport.tsx`
**Purpose**: Data import interface

**Features**:
- iPhone backup file upload (sms.db, CallHistory.storedata)
- Google account connection
- Google data sync trigger
- Import history display

---

### `client/src/components/DashboardLayout.tsx`
**Purpose**: Main layout wrapper with sidebar navigation

**Features**:
- Sidebar navigation
- User profile dropdown
- Authentication check
- Responsive design
- Resizable sidebar

---

## 🔑 Key Configuration Files

### `package.json`
**Purpose**: Project dependencies and scripts

**Key Dependencies**:
- React 19
- Express 4
- tRPC 11
- Drizzle ORM
- Tailwind CSS 4
- shadcn/ui components
- sql.js (iPhone parsing)
- googleapis (Google integration)
- multer (file uploads)
- date-fns (date formatting)

**Scripts**:
- `dev` - Start development server
- `build` - Build for production
- `db:push` - Push schema changes to database

---

### `drizzle.config.ts`
**Purpose**: Drizzle ORM configuration

**Settings**:
- Database connection
- Schema location
- Migration settings

---

### `tsconfig.json`
**Purpose**: TypeScript configuration

**Settings**:
- Compiler options
- Path aliases (@/ for src/)
- Type checking rules

---

### `tailwind.config.js`
**Purpose**: Tailwind CSS configuration

**Settings**:
- Theme customization
- Color palette
- Plugin configuration

---

## 📝 Documentation Files

### `README.md`
**Purpose**: Main project documentation

**Contents**:
- Feature overview
- Getting started guide
- API documentation
- Database schema reference
- Recommendation algorithm explanation
- Security considerations

---

### `IPHONE_BACKUP_GUIDE.md`
**Purpose**: iPhone backup extraction instructions

**Contents**:
- How to locate iPhone backups on Mac
- File extraction steps
- Database file descriptions
- Troubleshooting guide
- Privacy and security notes

---

### `todo.md`
**Purpose**: Project task tracking

**Contents**:
- Completed features checklist
- Development phases
- Feature status

---

## 🔐 Environment Variables

**Automatically configured by platform**:
- `DATABASE_URL` - MySQL connection
- `JWT_SECRET` - Session signing
- `VITE_APP_ID` - OAuth app ID
- `OAUTH_SERVER_URL` - OAuth backend
- `VITE_OAUTH_PORTAL_URL` - OAuth frontend
- `OWNER_OPEN_ID`, `OWNER_NAME` - Owner info

**User-configured** (via secrets card):
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

---

## 📊 Data Flow

### iPhone Import Flow
```
1. User uploads sms.db/CallHistory.storedata
2. server/iphone-router.ts receives files
3. server/iphone-extractor.ts parses SQLite
4. Interactions created via server/db.ts
5. Customer matching by phone number
6. Results returned to client
```

### Google Sync Flow
```
1. User clicks "Connect Google Account"
2. server/google-router.ts initiates OAuth
3. User authorizes in Google
4. Tokens stored via server/db.ts
5. User clicks "Sync Google Data"
6. server/google-integration.ts fetches emails/events
7. Interactions created via server/db.ts
8. Customer matching by email
9. Results returned to client
```

### Recommendation Flow
```
1. User opens Recommendations page
2. Optional: enters service keyword filter
3. client/src/pages/Recommendations.tsx calls tRPC
4. server/routers.ts calls server/db.ts
5. server/db.ts runs scoring algorithm:
   - Seasonality bonus (+50)
   - Recent service (+30)
   - Priority keywords (+20)
   - Interaction recency score
   - Service frequency score
   - 60-day cooldown filter
6. Sorted results returned to client
7. UI displays with reasoning
```

---

## 🛠️ How to Access Files

### Option 1: Management UI (Recommended)
1. Click the **Code** icon in the top right of the interface
2. Browse the file tree
3. Click any file to view its contents
4. Use the **Download** button to get all files as a ZIP

### Option 2: Direct File Paths
All files are located in: `/home/ubuntu/proactive-outreach-crm/`

**Most Important Files**:
- Database: `drizzle/schema.ts`
- Backend Logic: `server/db.ts`
- API Routes: `server/routers.ts`
- iPhone Parser: `server/iphone-extractor.ts`
- Google Integration: `server/google-integration.ts`
- Main UI: `client/src/App.tsx`
- Dashboard: `client/src/pages/Home.tsx`
- Customer Detail: `client/src/pages/CustomerDetail.tsx`
- Recommendations: `client/src/pages/Recommendations.tsx`
- Outreach Log: `client/src/pages/OutreachLog.tsx`

---

## 📦 Total File Count

**Backend**: ~15 core files
**Frontend**: ~20 core files
**Configuration**: ~10 files
**Documentation**: 4 files

**Total Lines of Code**: ~8,000+ lines

---

## 🔍 Code Quality Notes

- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Try-catch blocks in all async operations
- **Validation**: Zod schemas for all API inputs
- **Security**: Protected procedures, SQL injection prevention
- **Performance**: Database indexing, optimistic updates
- **Maintainability**: Clear separation of concerns, modular architecture

---

## 📚 Additional Resources

- **tRPC Documentation**: https://trpc.io/
- **Drizzle ORM**: https://orm.drizzle.team/
- **React 19**: https://react.dev/
- **shadcn/ui**: https://ui.shadcn.com/
- **Google APIs**: https://developers.google.com/apis-explorer
