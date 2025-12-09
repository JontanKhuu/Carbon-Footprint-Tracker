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
- [ ] Create EmissionsList page component
- [ ] Display emissions in a table or card layout
- [ ] Add filtering options:
  - By category
  - By date range
- [ ] Add sorting (by date, by amount, by CO2 equivalent)
- [ ] Add edit functionality (link to edit form)
- [ ] Add delete functionality with confirmation
- [ ] Show loading state while fetching

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

