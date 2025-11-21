# Proactive Outreach Brain CRM

A smart CRM system that consolidates customer communication history from multiple sources and provides intelligent recommendations on which customers to contact based on service history and interaction patterns.

## Features

### 📊 Comprehensive Customer Management
- **Customer Database**: Store and manage customer information including contact details, addresses, and notes
- **Interaction Timeline**: View complete history of all interactions (calls, SMS, emails, calendar events)
- **Service Tracking**: Record and track services provided to each customer
- **Outreach Logging**: Log outreach attempts with response tracking

### 🔄 Multi-Source Data Integration

#### iPhone Backup Integration
- Import SMS messages from `sms.db`
- Import call history from `CallHistory.storedata`
- Automatic phone number normalization and customer matching
- Supports both matched and unmatched interactions

#### Google Services Integration
- **Gmail**: Import email threads with automatic direction detection (incoming/outgoing)
- **Google Calendar**: Import calendar events with customer attendees
- OAuth 2.0 authentication flow
- Automatic customer matching by email address

### 🎯 Smart Recommendation Engine

The recommendation system uses sophisticated scoring to suggest which customers to contact:

**Scoring Factors:**
- **Seasonality Bonus (+50 points)**: Customers who received service in the same month last year
- **Recent Service (+30 points)**: Services within the last year
- **Priority Keywords (+20 points)**: Customers with priority notes ("important", "vip", "urgent")
- **Interaction Recency**: More recent interactions score higher
- **Service Frequency**: Customers with more services score higher

**Filtering Rules:**
- **60-Day Cooldown**: Excludes customers contacted without response in the last 60 days
- **Service Keyword Filter**: Optional filtering by specific service types
- **Configurable Limit**: Control how many recommendations to display

### 📱 User Interface

- **Dashboard**: Overview of system statistics and quick actions
- **Customers Page**: Browse, search, and add customers
- **Customer Detail**: Complete customer profile with tabs for interactions, services, and outreach history
- **Recommendations Page**: View smart recommendations with filtering options
- **Data Import Page**: Upload iPhone backups and connect Google services
- **Services Page**: Track all services grouped by customer

## Getting Started

### Prerequisites

- Node.js 22+ and pnpm
- MySQL/TiDB database (automatically configured)
- For iPhone data: Access to iPhone backup folder on Mac (`~/Library/Application Support/MobileSync/Backup/`)
- For Google data: Google account with Gmail and Calendar access

### Installation

The project is already set up and running. Access it via the preview URL provided by the platform.

### Data Import

#### iPhone Backup Data

1. On your Mac, locate your iPhone backup folder:
   ```
   ~/Library/Application Support/MobileSync/Backup/
   ```

2. Find these database files:
   - `sms.db` - Contains SMS messages
   - `CallHistory.storedata` - Contains call history

3. Navigate to **Import Data** page in the app

4. Upload the database files

5. The system will automatically:
   - Extract messages and calls
   - Normalize phone numbers to E.164 format
   - Match interactions to existing customers
   - Store unmatched interactions for manual review

#### Google Services Data

1. Navigate to **Import Data** page

2. Click **Connect Google Account**

3. Authorize the application to access Gmail and Calendar

4. Click **Sync Google Data**

5. The system will:
   - Fetch emails from the last 365 days
   - Fetch calendar events from the last 365 days
   - Match interactions to customers by email
   - Store all interactions in the database

### Using Recommendations

1. Navigate to **Recommendations** page

2. (Optional) Enter a service keyword to filter recommendations (e.g., "lawn care", "plumbing")

3. View the ranked list of customers to contact

4. Click **View Details** to see full customer profile

5. Log outreach attempts from the customer detail page

## Technical Architecture

### Backend

- **Framework**: Express 4 + tRPC 11
- **Database**: MySQL with Drizzle ORM
- **Authentication**: Manus OAuth
- **File Upload**: Multer for iPhone backup files
- **External APIs**: Google APIs (Gmail, Calendar)

### Frontend

- **Framework**: React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Routing**: Wouter
- **State Management**: TanStack Query (via tRPC)
- **Date Handling**: date-fns

### Database Schema

**Tables:**
- `users` - User accounts with OAuth integration
- `customers` - Customer information
- `interactions` - All customer interactions (calls, SMS, emails, events)
- `services` - Services provided to customers
- `outreach_logs` - Outreach attempts and responses
- `data_sources` - Import history tracking
- `google_credentials` - Google OAuth tokens

### Key Files

```
server/
  ├── db.ts                    # Database query helpers
  ├── routers.ts               # tRPC API endpoints
  ├── iphone-extractor.ts      # iPhone backup parsing logic
  ├── iphone-router.ts         # iPhone upload endpoint
  ├── google-integration.ts    # Google API integration
  └── google-router.ts         # Google OAuth endpoints

client/src/
  ├── pages/
  │   ├── Home.tsx             # Dashboard
  │   ├── Customers.tsx        # Customer list
  │   ├── CustomerDetail.tsx   # Customer profile
  │   ├── Recommendations.tsx  # Recommendation engine UI
  │   ├── DataImport.tsx       # Data import interface
  │   └── Services.tsx         # Service tracking
  └── App.tsx                  # Routing configuration

drizzle/
  └── schema.ts                # Database schema definitions
```

## API Endpoints

### tRPC Procedures

**Customers:**
- `customers.list` - Get all customers
- `customers.getById` - Get customer by ID
- `customers.create` - Create new customer
- `customers.update` - Update customer
- `customers.delete` - Delete customer

**Interactions:**
- `interactions.getByCustomerId` - Get customer interactions

**Services:**
- `services.list` - Get all services
- `services.getByCustomerId` - Get customer services
- `services.create` - Create new service

**Outreach:**
- `outreach.getByCustomerId` - Get customer outreach logs
- `outreach.create` - Log new outreach

**Recommendations:**
- `recommendations.get` - Get ranked customer recommendations

**Data Sources:**
- `dataSources.list` - Get import history

**Google:**
- `google.getCredentials` - Check Google connection status

### REST Endpoints

- `POST /api/iphone/upload` - Upload iPhone backup databases
- `GET /api/google/auth` - Initiate Google OAuth flow
- `GET /api/google/callback` - Google OAuth callback
- `POST /api/google/sync` - Sync Google data

## Data Matching Logic

### Phone Number Matching

1. Extract phone numbers from interactions
2. Normalize to E.164 format (e.g., +14155551234)
3. Match against customer phone numbers
4. Store matched interactions with customer reference
5. Store unmatched interactions for manual review

### Email Matching

1. Extract email addresses from Gmail and Calendar
2. Normalize to lowercase
3. Match against customer email addresses
4. Store matched interactions with customer reference

## Recommendation Algorithm

```javascript
function calculateScore(customer, services, interactions, outreachLogs) {
  let score = 0;
  
  // Seasonality bonus (same month as previous year)
  if (hasServiceInSameMonthLastYear(services)) {
    score += 50;
  }
  
  // Recent service bonus
  if (hasServiceInLastYear(services)) {
    score += 30;
  }
  
  // Priority keywords in notes
  if (hasPriorityKeywords(customer.notes)) {
    score += 20;
  }
  
  // Interaction recency
  score += calculateInteractionRecency(interactions);
  
  // Service frequency
  score += services.length * 5;
  
  // Apply cooldown filter (exclude if contacted without response < 60 days ago)
  if (hasRecentUnsuccessfulOutreach(outreachLogs)) {
    return 0; // Filtered out
  }
  
  return score;
}
```

## Environment Variables

The following environment variables are automatically configured by the platform:

- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_ID` - OAuth application ID
- `OAUTH_SERVER_URL` - OAuth backend URL
- `VITE_OAUTH_PORTAL_URL` - OAuth frontend URL
- `OWNER_OPEN_ID`, `OWNER_NAME` - Owner information

**Google API Integration:**
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (required)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (required)

## Security Considerations

- All authentication is handled via Manus OAuth
- Google OAuth tokens are stored encrypted in the database
- Phone numbers are normalized to prevent duplicate entries
- File uploads are validated for type and size
- SQL injection protection via Drizzle ORM parameterized queries

## Limitations

- iPhone backup files must be uploaded manually (cannot access Mac filesystem remotely)
- Google API has rate limits (10,000 requests/day for Gmail)
- Recommendation algorithm assumes annual service cycles
- Phone number matching requires E.164 format for accuracy

## Future Enhancements

- [ ] Automated email/SMS sending from recommendations
- [ ] Calendar integration for scheduling follow-ups
- [ ] Advanced analytics and reporting
- [ ] Export recommendations to CSV
- [ ] Bulk customer import
- [ ] Custom service categories
- [ ] Automated Google sync on schedule
- [ ] Mobile app for on-the-go access

## Support

For questions or issues, please refer to the project documentation or contact the development team.

## License

Proprietary - All rights reserved
