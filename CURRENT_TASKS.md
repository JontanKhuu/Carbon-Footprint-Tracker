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
- [✅] Open http://localhost:5000/api/health in browser (should return JSON)
- [✅] Test creating a user via API (use Postman, curl, or browser)
- [✅] Test creating an emission record
- [✅] Verify data is saved in database
- [✅] Test API via Swagger UI at http://localhost:5000/apidocs/

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
- [✅] Install Swagger/OpenAPI (Flask-RESTX or Flask-Swagger-UI)
- [✅] Document all API endpoints
- [✅] Add request/response schemas
- [✅] Include example requests/responses
- [✅] Make documentation accessible at `/apidocs/` (Swagger UI)

**Goal:** Provide clear API documentation for developers and future reference.

**Status:** ✅ COMPLETE - Swagger/OpenAPI documentation is fully implemented using Flasgger. All endpoints are documented with request/response schemas and examples. Documentation is accessible at `http://localhost:5000/apidocs/` with interactive "Try it out" functionality. JWT authentication is supported in the Swagger UI.

---

### Phase 3: Statistics & Analytics Enhancements

#### 12. Add Data Visualization Charts
- [✅] Install charting library (Chart.js, Recharts, or similar)
- [✅] Create emissions over time line chart
  - Show daily/weekly/monthly trends
  - Allow date range selection
- [✅] Create emissions by category pie/bar chart
- [✅] Add chart filtering options (by date range, category)
- [✅] Make charts interactive (hover details, click to filter)

**Goal:** Visualize emission trends and patterns over time.

**Status:** ✅ COMPLETE - Fully implemented data visualization charts using Recharts library. Features include:
- Line chart showing emissions over time with daily/weekly/monthly views
- Period-based navigation (current week/month/year with Previous/Next buttons)
- Direct date/week/month selection via date pickers and dropdowns
- Bar chart and pie chart for emissions by category
- Separate time period controls for bar and pie charts
- Interactive tooltips with detailed information
- Visual feedback for data availability
- Filtering by category and date range
- Responsive design with proper styling
- All categories displayed in bar chart (even empty ones) in predefined order
- Pie chart hides minuscule categories (<0.5%) to prevent label overlap
- Charts integrated into Dashboard page

---

#### 13. Add Comparison Features
- [✅] Implement month-over-month comparison
  - Calculate previous month's total
  - Show percentage change
  - Display trend indicator (↑/↓)
- [✅] Implement year-over-year comparison
  - Calculate same month previous year
  - Show percentage change
  - Display trend indicator
- [✅] Add comparison cards/widgets to Dashboard
- [ ] Create comparison view page (optional)

**Goal:** Help users track their progress and see improvements over time.

**Status:** ✅ COMPLETE - Month-over-month and year-over-year comparison features have been implemented. Comparison cards are displayed on the Dashboard showing percentage changes with trend indicators (↑/↓/→) and color-coded backgrounds. The feature handles edge cases gracefully and provides clear visual feedback to users about their emission trends.

---

### Phase 4: Backend Services

#### 14. Add Rate Limiting
- [✅] Install Flask-Limiter or similar
- [✅] Configure rate limits for API endpoints
  - Login/Registration: stricter limits (e.g., 5 per minute)
  - General API: moderate limits (e.g., 100 per hour)
- [✅] Add rate limit headers to responses
- [✅] Handle rate limit exceeded errors gracefully
- [✅] Test rate limiting behavior

**Goal:** Protect API from abuse and ensure fair usage.

**Status:** ✅ COMPLETE - Rate limiting has been implemented using Flask-Limiter. Login and registration endpoints are limited to 5 requests per minute, while general API endpoints have a default limit of 100 requests per hour. Rate limit headers are included in responses, and a custom error handler provides clear error messages when rate limits are exceeded.

---

#### 15. Add Export Functionality
- [✅] Create export endpoint: `GET /api/emissions/export`
- [✅] Support CSV export format
  - Include all emission fields
  - Format dates properly
  - Handle special characters
- [✅] Support JSON export format
  - Pretty-print JSON
  - Include metadata (export date, user info)
- [✅] Add export button to EmissionsList page
- [✅] Allow filtering before export (use same filters as list view)
- [✅] Add download functionality in frontend

**Goal:** Allow users to download their emission data for backup or analysis.

**Status:** ✅ COMPLETE - Export functionality has been fully implemented. Users can export their emissions data in both CSV and JSON formats. The export respects all current filters (category, date range) and includes proper formatting, metadata, and automatic file downloads.

---

### Phase 5: Comprehensive Testing

#### 16. Expand Emissions Endpoint Tests
- [✅] Test `GET /emissions/<id>` - Get single emission
  - Test successful retrieval
  - Test 404 for non-existent emission
  - Test authorization (user can't access other users' emissions)
- [✅] Test `PUT /emissions/<id>` - Update emission
  - Test successful update
  - Test partial updates
  - Test 404 for non-existent emission
  - Test authorization (user can't update other users' emissions)
  - Test validation errors
- [✅] Test `DELETE /emissions/<id>` - Delete emission
  - Test successful deletion
  - Test 404 for non-existent emission
  - Test authorization (user can't delete other users' emissions)
- [✅] Test `GET /emissions/activities` - Get supported activities
  - Test without category filter
  - Test with category filter
  - Test response structure
- [✅] Test `GET /emissions/<id>/history` - Get emission history
  - Test successful retrieval
  - Test 404 for non-existent emission
  - Test authorization
- [✅] Test `GET /emissions/export` - Export functionality
  - Test CSV export
  - Test JSON export
  - Test with filters (category, date range)
  - Test authorization
- [✅] Test emission filtering
  - Test category filter
  - Test date range filters (start_date, end_date)
  - Test combined filters
  - Test edge cases (empty results, invalid dates)

**Goal:** Ensure all emissions endpoints work correctly and securely with proper authorization checks.

**Status:** ✅ COMPLETE - All emissions endpoint tests have been implemented. The test suite now includes 29 tests covering:
- Single emission retrieval (GET) with success, 404, and authorization checks
- Emission updates (PUT) with full updates, partial updates, validation, and authorization
- Emission deletion (DELETE) with success, 404, and authorization checks
- Activities endpoint (GET) with and without category filters
- Emission history (GET) with success, 404, and authorization checks
- Export functionality (GET) for both CSV and JSON formats with filters and authorization
- Comprehensive filtering tests for category, date ranges, combined filters, and edge cases
All tests are passing and verify proper security boundaries between users.

---

#### 17. Expand Authentication & Authorization Tests
- [✅] Test `POST /users/login` - User login
  - Test login with username
  - Test login with email
  - Test invalid credentials
  - Test missing fields
  - Test rate limiting behavior
- [✅] Test `POST /users/refresh` - Token refresh
  - Test successful token refresh
  - Test expired refresh token
  - Test invalid refresh token
  - Test rate limiting behavior
- [✅] Test `GET /users/me` - Get current user
  - Test successful retrieval
  - Test with valid token
  - Test with invalid token
  - Test with expired token
- [✅] Test JWT token handling
  - Test token generation
  - Test token verification
  - Test expired token rejection
  - Test invalid token rejection
  - Test token refresh flow

**Goal:** Ensure authentication and authorization work correctly and securely.

**Status:** ✅ COMPLETE - All authentication and authorization tests have been implemented. The test suite now includes 21 new tests covering:
- Login endpoint (POST /users/login) with username, email, invalid credentials, missing fields, and rate limiting
- Token refresh endpoint (POST /users/refresh) with success, expired tokens, invalid tokens, wrong token types, and rate limiting
- Current user endpoint (GET /users/me) with valid tokens, invalid tokens, expired tokens, and missing tokens
- JWT token handling including generation, verification, expired token rejection, invalid token rejection, and complete refresh flow
All tests are passing and verify proper security boundaries and token management.

---

#### 18. Expand User Management Tests
- [✅] Test `GET /users/<id>` - Get single user
  - Test successful retrieval
  - Test 404 for non-existent user
- [✅] Test `PUT /users/<id>` - Update user
  - Test successful update
  - Test partial updates
  - Test 404 for non-existent user
  - Test validation errors (invalid email, weak password)
  - Test duplicate username/email handling
- [✅] Test `DELETE /users/<id>` - Delete user
  - Test successful deletion
  - Test 404 for non-existent user
  - Test cascade deletion (associated emissions)
- [✅] Test user validation
  - Test email format validation
  - Test password strength requirements
  - Test duplicate username handling
  - Test duplicate email handling
  - Test required field validation

**Goal:** Ensure user management endpoints work correctly with proper validation.

**Status:** ✅ COMPLETE - All user management tests have been implemented. The test suite now includes 16 new tests covering:
- Single user retrieval (GET /users/<id>) with success and 404 cases
- User updates (PUT /users/<id>) with full updates, partial updates, validation errors, and duplicate handling
- User deletion (DELETE /users/<id>) with success, 404, and cascade deletion verification
- Comprehensive validation tests for email format, password strength, duplicate username/email, and required fields
All tests are passing and verify proper data integrity and validation rules.

---

#### 19. Add Emission Calculator Service Tests
- [✅] Test `calculate_co2_equivalent()` function
  - Test transport category calculations
  - Test energy category calculations
  - Test food category calculations
  - Test waste category calculations
  - Test unsupported activity error
  - Test negative amount error
  - Test unit validation warnings
- [✅] Test `get_emission_factor()` function
  - Test valid category/activity combinations
  - Test invalid combinations (returns None)
  - Test all supported activities
- [✅] Test `is_activity_supported()` function
  - Test supported activities return True
  - Test unsupported activities return False
- [✅] Test `get_expected_unit()` function
  - Test correct unit for each activity
  - Test invalid activity returns None
- [✅] Test `get_supported_activities()` function
  - Test without category filter
  - Test with category filter
  - Test response structure
- [✅] Test `get_all_emission_factors()` function
  - Test complete factor dictionary
  - Test data structure

**Goal:** Ensure emission calculation logic is correct and handles all edge cases.

**Status:** ✅ COMPLETE - All emission calculator service tests have been implemented. The test suite now includes 37 tests covering:
- CO2 calculation for all categories (transport, energy, food, waste, other) with all supported activities
- Error handling for unsupported activities, unsupported categories, and negative amounts
- Edge cases including zero amounts and unit mismatches
- Emission factor retrieval for valid and invalid combinations
- Activity support checking for all scenarios
- Expected unit retrieval for all activities
- Supported activities listing with and without category filters
- Complete emission factors dictionary structure and data integrity
All tests are passing and verify the core business logic for emission calculations.

---

#### 20. Add Error Handling & Edge Case Tests
- [✅] Test invalid request data
  - Test missing required fields
  - Test wrong data types
  - Test empty strings
  - Test null values
- [✅] Test HTTP status codes
  - Test 400 for bad requests
  - Test 401 for unauthorized
  - Test 403 for forbidden
  - Test 404 for not found
  - Test 500 for server errors
- [✅] Test database constraint violations
  - Test unique constraint violations
  - Test foreign key constraint violations
  - Test not null constraint violations
- [✅] Test boundary conditions
  - Test empty lists
  - Test zero values
  - Test very large numbers
  - Test negative numbers (where applicable)
  - Test date edge cases (past, future, invalid formats)

**Goal:** Ensure the API handles errors gracefully and provides meaningful error messages.

**Status:** ✅ COMPLETE - All error handling and edge case tests have been implemented. The test suite now includes 25 tests covering:
- Invalid request data including missing fields, wrong data types, empty strings, and null values
- HTTP status codes (400, 401, 403, 404, 500) for various error scenarios
- Database constraint violations including unique constraints, foreign keys, and not null constraints
- Boundary conditions including empty lists, zero values, very large numbers, negative numbers, date edge cases (past, future, invalid formats), very long strings, and special characters
All tests are passing and verify that the API handles errors appropriately, though some tests reveal areas where error handling could be improved (e.g., type validation).

---

#### 21. Add Integration Tests
- [✅] Test full user workflow
  - Register user → Login → Create emission → Update emission → Delete emission → Logout
  - Verify data persistence throughout workflow
- [✅] Test multi-user scenarios
  - Create multiple users
  - Verify user data isolation
  - Test that users can't access each other's data
- [✅] Test rate limiting behavior
  - Test login rate limiting (5 per minute)
  - Test registration rate limiting (5 per minute)
  - Test token refresh rate limiting (5 per minute)
  - Test general API rate limiting (100 per hour)
- [✅] Test database transactions
  - Test rollback on errors
  - Test commit on success
  - Test concurrent requests

**Goal:** Ensure the system works correctly end-to-end with multiple users and under various conditions.

**Status:** ✅ COMPLETE - All integration tests have been implemented. The test suite now includes 10 comprehensive integration tests covering:
- Full user workflow from registration through logout, including emission CRUD operations and data persistence verification
- Multi-user scenarios with complete data isolation verification and authorization checks
- Rate limiting behavior for login, registration, token refresh, and general API endpoints
- Database transaction handling including rollback on errors, commit on success, and concurrent request handling
All tests are passing and verify that the system works correctly end-to-end with proper isolation, security, and data integrity.

---

## 🔧 Code Refactoring Tasks

### Phase 6: Code Quality & Refactoring

#### 22. Extract Test Helper Functions
- [ ] Create `backend/app/tests/test_helpers.py` or add to `conftest.py`
- [ ] Create `cleanup_emission_history(emission_ids)` helper function
  - Accepts single emission_id or list of emission_ids
  - Handles None values gracefully
  - Deletes all history records and commits
- [ ] Create `cleanup_user_emissions(user_id)` helper function
  - Deletes all emission history for user's emissions
  - Deletes all emissions for user
  - Returns count of cleaned records
- [ ] Replace all 12+ instances of manual EmissionHistory cleanup in tests
- [ ] Update test fixtures to use helpers where appropriate

**Goal:** Reduce code duplication in tests and make test cleanup more maintainable.

**Status:** 🔄 PENDING - High priority for test maintainability.

---

#### 23. Create Validation Service
- [ ] Create `backend/app/services/validation.py`
- [ ] Extract email validation logic
  - Define `EMAIL_PATTERN` constant
  - Define `MAX_EMAIL_LENGTH` constant
  - Create `validate_email(email: str) -> tuple[bool, str]` function
  - Returns (is_valid, error_message)
- [ ] Extract password validation logic
  - Create `validate_password(password: str) -> list[str]` function
  - Returns list of error messages (empty if valid)
- [ ] Update `backend/app/routes/users.py`
  - Replace email validation in `create_user()` with service call
  - Replace email validation in `update_user()` with service call
  - Replace password validation in `create_user()` with service call
- [ ] Consider creating shared validation utilities for frontend
  - Option 1: Create TypeScript validation functions in `frontend/src/utils/validation.ts`
  - Option 2: Keep frontend validation separate but use same rules
- [ ] Add unit tests for validation service

**Goal:** Eliminate code duplication between backend routes and improve maintainability of validation logic.

**Status:** 🔄 PENDING - Medium priority for code quality.

---

#### 24. Extract Rate Limit Constants
- [ ] Create `backend/app/constants.py` or add to `config.py`
- [ ] Define rate limit constants:
  - `RATE_LIMIT_AUTH = "5 per minute"` (for login, registration, refresh)
  - `RATE_LIMIT_GENERAL = "100 per hour"` (for general API endpoints)
- [ ] Update `backend/app/routes/users.py`
  - Replace `"5 per minute"` strings with `RATE_LIMIT_AUTH` constant
- [ ] Update test files that reference rate limits
  - Update comments and assertions to use constants
- [ ] Document rate limits in configuration

**Goal:** Centralize rate limit configuration and make it easier to adjust limits.

**Status:** 🔄 PENDING - Low priority but improves maintainability.

---

#### 25. Refactor Long Functions
- [ ] Refactor `create_user()` in `backend/app/routes/users.py`
  - Extract `_validate_user_data(data: dict) -> dict` function
    - Returns errors dictionary (empty if valid)
  - Extract `_check_user_exists(username: str, email: str) -> dict` function
    - Returns errors for duplicate username/email
  - Extract `_create_user_in_db(data: dict) -> User` function
    - Handles database operations and logging
    - Returns created user object
  - Simplify main `create_user()` function to orchestrate these
- [ ] Refactor `update_emission()` in `backend/app/routes/emissions.py`
  - Extract `_update_emission_fields(emission, data)` function
    - Handles field-by-field updates
  - Extract `_create_emission_history(emission_id, old_values, new_values)` function
    - Checks for changes and creates history entry if needed
  - Simplify main `update_emission()` function
- [ ] Add unit tests for extracted helper functions
- [ ] Ensure all existing tests still pass

**Goal:** Improve code readability, testability, and maintainability by breaking down large functions.

**Status:** 🔄 PENDING - Medium priority for code quality.

---

#### 26. Create Test Cleanup Helpers
- [ ] Create `backend/app/tests/test_helpers.py` if not exists
- [ ] Create `cleanup_test_user(app, user_id)` helper
  - Deletes user and all associated data (emissions, history)
  - Handles foreign key constraints properly
- [ ] Create `cleanup_test_users(app, user_ids)` helper
  - Batch cleanup for multiple users
- [ ] Create `cleanup_test_emissions(app, emission_ids)` helper
  - Deletes emissions and their history records
- [ ] Update test fixtures to use helpers
- [ ] Replace manual cleanup code in tests with helper calls

**Goal:** Standardize test cleanup patterns and reduce boilerplate code.

**Status:** 🔄 PENDING - Low priority but improves test maintainability.

---

#### 27. Extract Common Database Patterns
- [ ] Create `backend/app/utils/db_helpers.py`
- [ ] Create helper functions for common operations:
  - `safe_delete_emission(emission_id)` - Deletes emission with history cleanup
  - `safe_delete_user(user_id)` - Deletes user with all associated data
  - `get_user_emissions(user_id, filters=None)` - Query helper with common filters
- [ ] Consider creating context managers for database operations
- [ ] Update routes to use helpers where appropriate
- [ ] Maintain backward compatibility

**Goal:** Reduce code duplication in route handlers and improve consistency.

**Status:** 🔄 PENDING - Low priority, nice to have for consistency.

---

## 📋 Priority Order for Remaining Items

**High Priority:**
1. ✅ Implement JWT Authentication & Protected Routes (Security) - COMPLETE
2. ✅ Add Export Functionality (User data portability) - COMPLETE
3. ✅ Expand Emissions Endpoint Tests (Security & Functionality) - COMPLETE
4. ✅ Expand Authentication & Authorization Tests (Security) - COMPLETE

**Medium Priority:**
5. ✅ Add Data Visualization Charts (Better insights) - COMPLETE
6. ✅ Add Comparison Features (Progress tracking) - COMPLETE
7. ✅ Add Rate Limiting (API protection) - COMPLETE
8. ✅ Add Emission Calculator Service Tests (Business Logic) - COMPLETE
9. ✅ Expand User Management Tests (Data Integrity) - COMPLETE
10. ✅ Add Error Handling & Edge Case Tests (Robustness) - COMPLETE

**Low Priority:**
11. ✅ Add API Documentation (Developer experience) - COMPLETE
12. ✅ Add Integration Tests (End-to-End Validation) - COMPLETE

**Refactoring Tasks:**
13. Extract Test Helper Functions (Test maintainability) - PENDING
14. Create Validation Service (Code quality) - PENDING
15. Extract Rate Limit Constants (Maintainability) - PENDING
16. Refactor Long Functions (Code quality) - PENDING
17. Create Test Cleanup Helpers (Test maintainability) - PENDING
18. Extract Common Database Patterns (Code consistency) - PENDING

---

**Total Estimated Time for Completed Items:** ~15-20 hours

**Estimated Time for Remaining Test Items:** ~18-24 hours
- High Priority Tests: ~8-10 hours
- Medium Priority Tests: ~6-8 hours
- Low Priority Tests: ~4-6 hours

**Estimated Time for Refactoring Tasks:** ~12-16 hours
- High Priority Refactoring: ~4-6 hours (Test helpers, Validation service)
- Medium Priority Refactoring: ~4-6 hours (Long functions)
- Low Priority Refactoring: ~4-6 hours (Constants, cleanup helpers, DB patterns)

