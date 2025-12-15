# Current Tasks - What to Work On Now

## 🎯 Immediate Next Steps (Do These First!)

### 1. Database Setup ⚠️ CRITICAL
```powershell
# Make sure Docker containers are running
docker-compose up -d

# Initialize database
docker-compose exec backend flask db init

# Create migration
docker-compose exec backend flask db migrate -m "Initial migration"

# Apply migration (creates tables)
docker-compose exec backend flask db upgrade
```

**Goal:** Get your database tables created so the API can work.

---

### 2. Test Backend API
- [✅] Open http://localhost:5000/health in browser (should return JSON)
- [✅] Test creating a user via API (use Postman, curl, or browser)
- [✅] Test creating an emission record
- [✅] Verify data is saved in database

**Goal:** Make sure your backend is working before building frontend.

---

### 3. Frontend API Setup
- [✅] Create `frontend/src/services/api.ts` or `api.js`
- [✅] Configure axios with base URL
- [✅] Create API functions for:
  - User registration/login
  - Get/create emissions
  - Get statistics

**Goal:** Set up connection between frontend and backend.

---

### 4. Basic Frontend Layout
- [✅] Replace default Vite template in `App.tsx`
- [✅] Create basic layout with header/navigation
- [✅] Set up React Router
- [✅] Create placeholder pages (Home, Login, Dashboard)

**Goal:** Get basic structure in place.

---

### 5. Authentication (Start Simple)
- [✅] Create Login page component
- [✅] Create Registration page component
- [✅] Implement login API call
- [✅] Store auth token (localStorage for now)
- [✅] Add basic protected routes

**Goal:** Users can sign up and log in.

---

## 📋 This Week's Focus

**Priority Order:**
1. ✅ Database setup (30 min)
2. ✅ Test backend API (30 min)
3. ✅ Frontend API client setup (1 hour)
4. ✅ Basic layout and routing (2 hours)
5. ✅ Login/Registration pages (2-3 hours)

**Total Estimated Time:** ~6-7 hours

---

## 💡 Tips

- **Start small:** Get one feature working end-to-end before moving to the next
- **Test as you go:** Don't build everything then test - test each piece
- **Use the browser console:** Check for errors in Network tab and Console
- **Ask for help:** If stuck on something for >30 min, ask for guidance

---

## 🐛 Common Issues to Watch For

- CORS errors (backend needs to allow frontend origin)
- Database connection issues (check Docker containers are running)
- API URL mismatches (frontend calling wrong endpoint)
- Authentication token not being sent with requests

---

## ✅ Definition of "Done" for Current Phase

You'll know you're ready to move on when:
- [✅] Database tables exist and you can query them
- [✅] You can create a user via API
- [✅] You can create an emission via API
- [✅] Frontend can make API calls successfully
- [✅] Users can register and log in through the UI

---

---

## 🎯 Next Phase: Core Emission Tracking Features

### 6. Create "Add Emission" Form
- [✅] Create AddEmission page component
- [✅] Add form fields:
  - Category selection dropdown (transport, energy, food, etc.)
  - Activity type dropdown
  - Amount input field
  - Unit selection (km, kWh, kg, etc.)
  - Date picker
  - Description textarea
- [✅] Add form validation
- [✅] Connect form submission to backend API
- [✅] Show success/error messages
- [✅] Redirect to dashboard after successful submission

**Goal:** Users can add new emission records through the UI.

---

### 7. Improve Dashboard
- [✅] Display user's total carbon footprint (sum of all emissions)
- [✅] Show total CO2 equivalent in a prominent way
- [✅] Display recent emissions in a better format (table or cards)
- [✅] Add basic statistics:
  - Total emissions count
  - Emissions by category
  - This month's total
- [✅] Filter emissions by logged-in user (currently shows all users' emissions)

**Goal:** Dashboard provides useful overview of user's carbon footprint.

---

### 8. Create Emission Calculation Service (Backend)
- [✅] Create `backend/app/services/emission_calculator.py`
- [✅] Define emission factors for common activities:
  - Transport: car (per km), plane (per km), train (per km)
  - Energy: electricity (per kWh), gas (per m³)
  - Food: various food types
- [✅] Create calculation function that takes activity, amount, unit and returns CO2 equivalent
- [✅] Update emission creation endpoint to use calculator (make co2_equivalent optional in request)
- [✅] Add validation for supported activities

**Goal:** Automatically calculate CO2 equivalent instead of requiring manual input.

---

### 9. Create Emissions List Page
- [✅] Create EmissionsList page component
- [✅] Display emissions in a table or card layout
- [✅] Add filtering options:
  - By category
  - By date range
- [✅] Add sorting (by date, by amount, by CO2 equivalent)
- [✅] Add edit functionality (link to edit form)
- [✅] Add delete functionality with confirmation
- [✅] Show loading state while fetching

**Goal:** Users can view, filter, and manage their emissions.

---

## 📋 This Week's Focus (Next Steps)

**Priority Order:**
1. Create "Add Emission" form (3-4 hours)
2. Improve Dashboard with statistics (2-3 hours)
3. Create emission calculation service (2-3 hours)
4. Create Emissions list page (2-3 hours)

**Total Estimated Time:** ~9-13 hours

---

## 💡 Tips for Next Phase

- **Start with the form:** The "Add Emission" form is the core feature - get it working first
- **Use the calculator:** Once the emission calculation service is ready, update the form to use it
- **Test with real data:** Create a few test emissions to see how the dashboard looks
- **Keep it simple:** Don't overcomplicate the UI - focus on functionality first

---

**Last Updated:** Today
**Current Phase:** Core Emission Tracking Features

---

## 🔧 Remaining Items from Phases 1-4 (Before Phase 5)

### Phase 1: Backend Enhancements

#### 10. Implement JWT Authentication & Protected Routes
- [✅] Add JWT token generation on login
- [✅] Create authentication middleware for backend routes
- [✅] Protect API endpoints (require authentication for emissions CRUD)
- [✅] Update frontend to send JWT tokens with requests
- [✅] Add token refresh mechanism
- [✅] Handle token expiration gracefully

**Goal:** Secure API endpoints and implement proper authentication flow.

**Status:** ✅ COMPLETE - All emissions endpoints are now protected with JWT authentication. Tokens are automatically managed in the frontend with refresh capability.

---

#### 11. Add API Documentation
- [ ] Install Swagger/OpenAPI (Flask-RESTX or Flask-Swagger-UI)
- [ ] Document all API endpoints
- [ ] Add request/response schemas
- [ ] Include example requests/responses
- [ ] Make documentation accessible at `/api/docs`

**Goal:** Provide clear API documentation for developers and future reference.

---

### Phase 3: Statistics & Analytics Enhancements

#### 12. Add Data Visualization Charts
- [ ] Install charting library (Chart.js, Recharts, or similar)
- [ ] Create emissions over time line chart
  - Show daily/weekly/monthly trends
  - Allow date range selection
- [ ] Create emissions by category pie/bar chart
- [ ] Add chart filtering options (by date range, category)
- [ ] Make charts interactive (hover details, click to filter)

**Goal:** Visualize emission trends and patterns over time.

---

#### 13. Add Comparison Features
- [ ] Implement month-over-month comparison
  - Calculate previous month's total
  - Show percentage change
  - Display trend indicator (↑/↓)
- [ ] Implement year-over-year comparison
  - Calculate same month previous year
  - Show percentage change
  - Display trend indicator
- [ ] Add comparison cards/widgets to Dashboard
- [ ] Create comparison view page (optional)

**Goal:** Help users track their progress and see improvements over time.

---

### Phase 4: Backend Services

#### 14. Add Rate Limiting
- [ ] Install Flask-Limiter or similar
- [ ] Configure rate limits for API endpoints
  - Login/Registration: stricter limits (e.g., 5 per minute)
  - General API: moderate limits (e.g., 100 per hour)
- [ ] Add rate limit headers to responses
- [ ] Handle rate limit exceeded errors gracefully
- [ ] Test rate limiting behavior

**Goal:** Protect API from abuse and ensure fair usage.

---

#### 15. Add Export Functionality
- [ ] Create export endpoint: `GET /api/emissions/export`
- [ ] Support CSV export format
  - Include all emission fields
  - Format dates properly
  - Handle special characters
- [ ] Support JSON export format
  - Pretty-print JSON
  - Include metadata (export date, user info)
- [ ] Add export button to EmissionsList page
- [ ] Allow filtering before export (use same filters as list view)
- [ ] Add download functionality in frontend

**Goal:** Allow users to download their emission data for backup or analysis.

---

## 📋 Priority Order for Remaining Items

**High Priority:**
1. Implement JWT Authentication & Protected Routes (Security)
2. Add Export Functionality (User data portability)

**Medium Priority:**
3. Add Data Visualization Charts (Better insights)
4. Add Comparison Features (Progress tracking)
5. Add Rate Limiting (API protection)

**Low Priority:**
6. Add API Documentation (Developer experience)

---

**Total Estimated Time:** ~15-20 hours for all items

