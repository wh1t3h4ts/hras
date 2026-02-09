# HRAS Frontend - Nurse Role Manual Test Checklist

## Test Environment Setup
- **Backend**: Django server running on `http://localhost:8000`
- **Frontend**: React app running on `http://localhost:3000`
- **Test User**: Nurse account (create via admin or registration)

---

## Pre-Test Setup

### 1. Create Test Nurse Account
```bash
# Via Django admin or management command
python manage.py createsuperuser
# Then create nurse user in admin panel
```

### 2. Assign Patients to Nurse
- Create 2-3 test patients
- Assign at least 1 patient to the nurse via Assignment model
- Leave 1 patient unassigned

---

## Test Cases

### ✅ Test 1: Login as Nurse
**Steps:**
1. Navigate to `http://localhost:3000/login`
2. Enter nurse credentials
3. Click "Login"

**Expected Result:**
- ✅ Successful login
- ✅ Redirected to dashboard or nurse-dashboard
- ✅ No errors in console

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 2: Verify Nurse Sidebar Menu
**Steps:**
1. After login, check sidebar menu items

**Expected Result:**
- ✅ Shows: "Dashboard", "My Patients", "Patients", "Shifts", "Profile"
- ❌ Hides: "User Management", "Doctors & Staff", "Hospital Details", "Analytics", "AI Assistant"

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 3: View Assigned Patients Only
**Steps:**
1. Click "My Patients" in sidebar
2. Verify patient list

**Expected Result:**
- ✅ Shows ONLY assigned patients
- ✅ Patient cards display: name, age, priority, symptoms
- ✅ "Add Vitals" and "Details" buttons visible
- ❌ Unassigned patients NOT visible

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 4: Add Vitals/Observations
**Steps:**
1. Click "Add Vitals" on a patient card
2. Fill in vitals form:
   - Blood Pressure: 120/80
   - Temperature: 37.2
   - Pulse: 72
   - Respiratory Rate: 16
   - SpO2: 98%
   - Notes: "Patient resting comfortably"
3. Click "Record Vitals"

**Expected Result:**
- ✅ Modal opens with vitals form
- ✅ All fields optional (can submit partial data)
- ✅ Success toast: "Vitals recorded successfully"
- ✅ Modal closes
- ✅ Patient list refreshes

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 5: View Patient Details & Vitals History
**Steps:**
1. Click "Details" on a patient card
2. Review patient information
3. Scroll to "Vitals History" section

**Expected Result:**
- ✅ Shows patient demographics (name, age, admission date)
- ✅ Shows contact information (telephone, emergency contact)
- ✅ Shows symptoms
- ✅ Shows priority badge (read-only)
- ✅ Displays vitals history with timestamps
- ✅ Shows recording nurse name
- ❌ Does NOT show: diagnosis, lab reports, prescriptions

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 6: Cannot Access Hospital Management
**Steps:**
1. Manually navigate to `http://localhost:3000/hospital-management`

**Expected Result:**
- ✅ Shows "Access Denied" page OR redirects to dashboard
- ✅ Error message: "You don't have permission to access this page"

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 7: Cannot Access User Management
**Steps:**
1. Manually navigate to `http://localhost:3000/user-management`

**Expected Result:**
- ✅ Shows "Access Denied" page OR redirects
- ✅ Menu item not visible in sidebar

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 8: Cannot Access Analytics
**Steps:**
1. Manually navigate to `http://localhost:3000/analytics`

**Expected Result:**
- ✅ Shows "Access Denied" page OR redirects
- ✅ Menu item not visible in sidebar

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 9: Cannot Access AI Chat
**Steps:**
1. Manually navigate to `http://localhost:3000/ai-chat`

**Expected Result:**
- ✅ Shows "Access Denied" page OR redirects
- ✅ Menu item not visible in sidebar

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 10: View Own Shifts (Read-Only)
**Steps:**
1. Click "Shifts" in sidebar
2. View shift schedule

**Expected Result:**
- ✅ Shows nurse's own shifts only
- ❌ Cannot create new shifts (no "Add Shift" button or 403 error)
- ✅ Can view shift details (time, location)

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 11: Patients Page (Assigned Only)
**Steps:**
1. Click "Patients" in sidebar
2. View patient list

**Expected Result:**
- ✅ Shows ONLY assigned patients
- ✅ Search/filter works on assigned patients only
- ❌ Cannot see "Add Patient" button (or 403 if clicked)

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 12: Cannot Modify Priority
**Steps:**
1. Open patient details
2. Try to change priority (if edit option exists)

**Expected Result:**
- ✅ Priority field is read-only OR
- ✅ Attempting to change priority shows error
- ✅ Priority remains unchanged after save attempt

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 13: Profile Access
**Steps:**
1. Click "Profile" in sidebar
2. View/edit profile

**Expected Result:**
- ✅ Can view own profile
- ✅ Can update own information (name, password)
- ❌ Cannot change role

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 14: Logout
**Steps:**
1. Click logout button
2. Verify redirect

**Expected Result:**
- ✅ Successfully logs out
- ✅ Redirected to login page
- ✅ Cannot access protected pages without re-login

**Status:** [ ] Pass [ ] Fail

---

## Browser Console Checks

### During All Tests:
- ❌ No 500 errors in console
- ❌ No uncaught exceptions
- ✅ 403 errors expected for forbidden endpoints (this is correct behavior)
- ✅ API calls use proper authentication headers

---

## Network Tab Verification

### Check API Calls:
1. **GET /api/patients/** → Returns only assigned patients
2. **POST /api/patients/{id}/observations/** → 201 Created
3. **POST /api/patients/** → 403 Forbidden
4. **GET /api/hospitals/** → 403 Forbidden
5. **GET /api/lab-reports/** → 403 Forbidden
6. **GET /api/analytics/** → 403 Forbidden

---

## Edge Cases

### ✅ Test 15: Empty State - No Assigned Patients
**Steps:**
1. Login as nurse with no assigned patients

**Expected Result:**
- ✅ Shows empty state message
- ✅ "No Patients Assigned" message displayed
- ✅ No errors

**Status:** [ ] Pass [ ] Fail

---

### ✅ Test 16: Add Vitals with Partial Data
**Steps:**
1. Open "Add Vitals" modal
2. Fill only pulse and notes
3. Submit

**Expected Result:**
- ✅ Accepts partial data
- ✅ Successfully saves
- ✅ Shows in vitals history with only filled fields

**Status:** [ ] Pass [ ] Fail

---

## Test Summary

**Total Tests:** 16  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___  

**Tester Name:** _______________  
**Date:** _______________  
**Browser:** _______________  
**Notes:** _______________

---

## Critical Issues Found
(List any security vulnerabilities or access control bypasses)

1. 
2. 
3. 

---

## Non-Critical Issues Found
(List UI/UX issues or minor bugs)

1. 
2. 
3. 
