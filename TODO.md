# Carbon Footprint Tracker - TODO List

## 🚀 Phase 1: Core Setup & Database (Priority: High)

### Database Setup
- [✅] Run database migrations in Docker container
  - `docker-compose exec backend flask db init`
  - `docker-compose exec backend flask db migrate -m "Initial migration"`
  - `docker-compose exec backend flask db upgrade`
- [✅] Verify database connection and tables are created
- [✅] Test API endpoints with sample data

### Backend Enhancements
- [ ] Add authentication/authorization (JWT tokens)
  - [✅] User login endpoint
  - [✅] User registration endpoint
  - [ ] Protected routes middleware (backend)
- [✅] Add input validation and error handling
- [✅] Create emission calculation service
  - [✅] Calculate CO2 equivalent based on activity type
  - [✅] Store emission factors for different activities
- [ ] Add API documentation (Swagger/OpenAPI)

---

## 🎨 Phase 2: Frontend Core (Priority: High)

### Setup & Configuration
- [✅] Set up API client (axios) configuration
- [✅] Create environment variables for API URL
- [✅] Set up routing (React Router)
- [✅] Create basic layout components (Header, Footer, Navigation)

### Authentication Pages
- [✅] Create Login page
- [✅] Create Registration/Signup page
- [✅] Implement authentication state management
- [✅] Add protected route wrapper

### Main Dashboard
- [✅] Create Dashboard/Home page (basic version)
- [✅] Display user's total carbon footprint
- [✅] Show recent emissions (basic list)
- [✅] Display statistics/charts
  - [✅] Total CO2 equivalent (prominent display)
  - [✅] Total emissions count
  - [✅] This month's total
  - [✅] Emissions by category (cards)
  - [✅] Recent emissions table with pagination

---

## 📊 Phase 3: Emission Tracking Features (Priority: High)

### Add Emission
- [✅] Create "Add Emission" form
  - [✅] Category selection (transport, energy, food, etc.)
  - [✅] Activity type dropdown
  - [✅] Amount input
  - [✅] Date picker
  - [✅] Description field
  - [✅] Unit selection with auto-conversion
  - [✅] Auto-calculation of CO2 equivalent
  - [✅] Manual override capability
- [✅] Implement emission calculation logic
- [✅] Connect form to backend API
- [✅] Add form validation
- [✅] Edit mode functionality

### View Emissions
- [✅] Create Emissions list page
- [✅] Add filtering (by category, date range)
- [✅] Add sorting options
  - [✅] Sort by date (ascending/descending)
  - [✅] Sort by amount (ascending/descending)
  - [✅] Sort by CO2 equivalent (ascending/descending)
- [✅] Implement pagination (on Dashboard)
- [✅] Add edit/delete functionality
  - [✅] Edit via link to edit form
  - [✅] Delete with confirmation modal
  - [✅] View edit history

### Statistics & Analytics
- [✅] Create Statistics page (integrated into Dashboard)
- [✅] Display emissions by category (cards with totals)
- [ ] Show emissions over time (line chart) - Not yet implemented
- [✅] Calculate and display total CO2 equivalent
- [✅] Add comparison features (this month's total vs overall)
  - [ ] Month-over-month comparison - Not yet implemented
  - [ ] Year-over-year comparison - Not yet implemented

---

## 🔧 Phase 4: Backend Services (Priority: Medium)

### Emission Calculation Service
- [✅] Create emission factor database/constants
- [✅] Implement calculation logic for different activity types
- [✅] Add validation for emission factors
- [✅] Create helper functions for common calculations
  - [✅] Unit conversion support
  - [✅] Activity validation
  - [✅] Expected unit mapping

### Data Validation
- [✅] Add request validation using Flask validators
- [✅] Implement proper error responses
- [ ] Add rate limiting for API endpoints
- [✅] Add input sanitization (password validation, field validation)

### Additional Endpoints
- [ ] Add user profile endpoints (GET/PUT/DELETE exist but unused)
- [✅] Add emission categories endpoint (via activities endpoint)
- [✅] Add activity types endpoint (GET /api/emissions/activities)
- [ ] Add export functionality (CSV, JSON)

---

## 🎯 Phase 5: Advanced Features (Priority: Medium)

### User Features
- [ ] User profile page
- [ ] Edit user information
- [ ] Change password functionality
- [ ] User preferences/settings

### Data Management
- [ ] Bulk import emissions (CSV upload)
- [ ] Export emissions data
- [ ] Data backup/restore
- [ ] Delete account functionality

### Notifications & Goals
- [ ] Set carbon footprint goals
- [ ] Progress tracking
- [ ] Achievement badges
- [ ] Email notifications (optional)

---

## 📱 Phase 6: UI/UX Improvements (Priority: Medium)

### Design
- [✅] Create consistent color scheme
- [✅] Add loading states
- [✅] Add error messages/toasts
- [ ] Improve responsive design (mobile-friendly) - Basic responsive, could be improved
- [ ] Add animations/transitions

### User Experience
- [ ] Add search functionality
- [ ] Implement keyboard shortcuts
- [ ] Add tooltips/help text
- [ ] Create onboarding flow for new users
- [✅] Add empty states for lists

---

## 🧪 Phase 7: Testing (Priority: Medium)

### Backend Tests
- [✅] Expand unit tests for models (basic tests exist)
- [✅] Add integration tests for API endpoints (test_users, test_emissions, test_health)
- [✅] Test authentication flows (login/registration tested)
- [✅] Test error handling (basic error handling tested)
- [✅] Add test coverage reporting (pytest-cov configured, coverage reports generated)

### Frontend Tests
- [ ] Set up testing framework (Jest/Vitest)
- [ ] Write component tests
- [ ] Add integration tests
- [ ] Test API integration
- [ ] Add E2E tests (optional)

---

## 🚢 Phase 8: Deployment & DevOps (Priority: Low)

### CI/CD
- [ ] Configure GitHub Actions for automated testing
- [ ] Set up automated deployment
- [ ] Add environment-specific configurations
- [ ] Set up staging environment

### Production Readiness
- [ ] Add logging and monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Add backup strategy
- [ ] Performance optimization

### Documentation
- [✅] Update README with setup instructions
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Create user guide
- [ ] Document deployment process

---

## 🎓 Learning & Research (Ongoing)

- [ ] Research carbon emission factors for different activities
- [ ] Study best practices for carbon footprint calculation
- [ ] Learn about data visualization libraries (Chart.js, Recharts, etc.)
- [ ] Research authentication best practices
- [ ] Study Flask and React best practices

---

## 📝 Notes

### Current Status
- ✅ Project structure set up
- ✅ Backend API endpoints created
- ✅ Database models defined
- ✅ Docker configuration complete
- ✅ CI/CD pipeline configured
- ✅ Frontend basic structure built
- ✅ Authentication pages and state management implemented
- ✅ Emission calculation service implemented
- ✅ Add Emission form implemented
- ✅ Dashboard with statistics implemented
- ✅ Emissions list page with filtering/sorting implemented
- ✅ Edit history tracking implemented
- ⏳ JWT tokens not implemented (using localStorage for now)
- ⏳ Charts/visualizations not yet implemented (statistics shown as cards)
- ⏳ Export functionality not yet implemented

### Next Immediate Steps
1. ✅ Run database migrations
2. ✅ Test backend API endpoints
3. ✅ Set up frontend API client
4. ✅ Create basic frontend layout
5. ✅ Build login/registration pages
6. ✅ Create "Add Emission" form
7. ✅ Improve Dashboard with statistics
8. ✅ Add emission calculation service
9. Add data visualization charts (optional enhancement)
10. Implement JWT authentication (optional enhancement)
11. Add export functionality (optional enhancement)

---

## 🎯 Focus Areas for MVP (Minimum Viable Product)

To get a working product quickly, focus on:
1. ✅ Database setup and migrations
2. ✅ User authentication (login/register)
3. ✅ Add emission form
4. ✅ View emissions list
5. ✅ Basic dashboard with total footprint
6. ✅ Simple statistics/charts

**MVP Status: COMPLETE! 🎉**

The core MVP features are all implemented. Additional enhancements can be added incrementally!

