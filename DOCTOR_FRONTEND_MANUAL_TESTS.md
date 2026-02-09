# Doctor Role - Frontend Manual Test Checklist

## Test Environment Setup
- [ ] Backend server running on `http://localhost:8000`
- [ ] Frontend server running on `http://localhost:3000`
- [ ] Database has test data (hospital, patients, assignments)
- [ ] Doctor user account created and approved

**Test Doctor Credentials:**
- Email: `doctor@test.com`
- Password: `doctor123`

---

## 1. Login & Authentication

### Test 1.1: Doctor Login
- [ ] Navigate to `http://localhost:3000/login`
- [ ] Enter doctor credentials
- [ ] Click "Login"
- [ ] **Expected:** Redirect to `/doctor-dashboard`
- [ ] **Expected:** See "My Patients" page with assigned patients

### Test 1.2: Unapproved Doctor
- [ ] Create doctor account but don't approve
- [ ] Try to login
- [ ] **Expected:** Error message "Account is not approved or inactive"

---

## 2. Sidebar Navigation

### Test 2.1: Doctor Sidebar Menu Items
- [ ] Login as doctor
- [ ] Check sidebar menu items
- [ ] **Expected:** See only:
  - My Patients
  - Analytics
  - AI Assistant
  - Profile
- [ ] **Expected:** NOT see:
  - Dashboard (admin view)
  - Patients (full list)
  - Doctors & Staff
  - Hospital Details
  - Shifts
  - User Management

### Test 2.2: Sidebar Navigation
- [ ] Click "My Patients" → **Expected:** Navigate to `/doctor-dashboard`
- [ ] Click "Analytics" → **Expected:** Navigate to `/analytics`
- [ ] Click "AI Assistant" → **Expected:** Navigate to `/ai-chat`
- [ ] Click "Profile" → **Expected:** Navigate to `/profile`

---

## 3. My Patients Dashboard

### Test 3.1: View Assigned Patients
- [ ] Navigate to `/doctor-dashboard`
- [ ] **Expected:** See list of assigned patients only
- [ ] **Expected:** Each patient card shows:
  - Name and age
  - Priority badge (color-coded)
  - Admission date
  - Response time
  - Status
  - Symptoms
  - 4 action buttons

### Test 3.2: Empty State
- [ ] Login as doctor with no assigned patients
- [ ] **Expected:** See "No Patients Assigned" message
- [ ] **Expected:** Activity icon displayed
- [ ] **Expected:** No patient cards shown

### Test 3.3: Patient Count
- [ ] Check header badge
- [ ] **Expected:** Shows correct count "X Patient(s) Assigned"

---

## 4. Clinical Actions - Add Diagnosis

### Test 4.1: Open Diagnosis Modal
- [ ] Click "Add Diagnosis" button on patient card
- [ ] **Expected:** Modal opens with patient info
- [ ] **Expected:** Shows patient name, age, priority, symptoms
- [ ] **Expected:** Large textarea for diagnosis

### Test 4.2: Submit Diagnosis
- [ ] Enter diagnosis text: "Acute bronchitis with mild respiratory distress"
- [ ] Click "Add Diagnosis"
- [ ] **Expected:** Loading state shows "Adding..."
- [ ] **Expected:** Success toast appears
- [ ] **Expected:** Modal closes
- [ ] **Expected:** Patient list refreshes

### Test 4.3: Validation
- [ ] Open diagnosis modal
- [ ] Leave diagnosis text empty
- [ ] Click "Add Diagnosis"
- [ ] **Expected:** Error toast "Please enter a diagnosis"

### Test 4.4: Cancel
- [ ] Open diagnosis modal
- [ ] Click "Cancel"
- [ ] **Expected:** Modal closes without saving

---

## 5. Clinical Actions - Order Tests

### Test 5.1: Open Test Order Modal
- [ ] Click "Order Tests" button on patient card
- [ ] **Expected:** Modal opens with test dropdown
- [ ] **Expected:** Shows 12+ common tests

### Test 5.2: Submit Test Order
- [ ] Select "Chest X-Ray" from dropdown
- [ ] Enter notes: "Check for pneumonia"
- [ ] Click "Order Test"
- [ ] **Expected:** Success toast appears
- [ ] **Expected:** Modal closes
- [ ] **Expected:** Patient list refreshes

### Test 5.3: Validation
- [ ] Open test order modal
- [ ] Leave test type unselected
- [ ] Click "Order Test"
- [ ] **Expected:** Browser validation error

---

## 6. Clinical Actions - Prescribe Medication

### Test 6.1: Open Prescription Modal
- [ ] Click "Prescribe" button on patient card
- [ ] **Expected:** Modal opens with medication form
- [ ] **Expected:** Shows fields for medication, dosage, frequency, duration, instructions

### Test 6.2: Submit Prescription
- [ ] Enter medication: "Amoxicillin"
- [ ] Enter dosage: "500mg"
- [ ] Select frequency: "Three times daily"
- [ ] Enter duration: "7 days"
- [ ] Enter instructions: "Take with food"
- [ ] Click "Prescribe"
- [ ] **Expected:** Success toast appears
- [ ] **Expected:** Modal closes
- [ ] **Expected:** Patient list refreshes

### Test 6.3: Validation
- [ ] Open prescription modal
- [ ] Leave required fields empty
- [ ] Click "Prescribe"
- [ ] **Expected:** Error toast "Please fill in all required fields"

---

## 7. View Patient Details

### Test 7.1: Open Details Modal
- [ ] Click "View Details" button on patient card
- [ ] **Expected:** Modal opens with patient information
- [ ] **Expected:** Shows age, symptoms, priority, AI suggestion

### Test 7.2: Close Details Modal
- [ ] Click "Close" button
- [ ] **Expected:** Modal closes

---

## 8. Forbidden Routes & Actions

### Test 8.1: Cannot Access Hospital Management
- [ ] Manually navigate to `/hospital-management`
- [ ] **Expected:** Redirect or error page
- [ ] **Expected:** OR see empty/restricted view

### Test 8.2: Cannot Access User Management
- [ ] Manually navigate to `/user-management`
- [ ] **Expected:** Redirect or error page

### Test 8.3: Cannot Access Full Patients List
- [ ] Manually navigate to `/patients`
- [ ] **Expected:** See only assigned patients (same as My Patients)
- [ ] **Expected:** No "Add Patient" button visible

### Test 8.4: Cannot Access Receptionist Dashboard
- [ ] Manually navigate to `/receptionist-dashboard`
- [ ] **Expected:** Redirect or 403 error

### Test 8.5: Cannot Access Nurse Dashboard
- [ ] Manually navigate to `/nurse-dashboard`
- [ ] **Expected:** Redirect or 403 error

---

## 9. API Error Handling

### Test 9.1: Network Error
- [ ] Stop backend server
- [ ] Try to add diagnosis
- [ ] **Expected:** Error toast "Failed to add diagnosis"
- [ ] **Expected:** Modal stays open

### Test 9.2: 403 Forbidden
- [ ] Use browser dev tools to manually POST to `/api/patients/`
- [ ] **Expected:** 403 error response
- [ ] **Expected:** Error message about doctors not being able to create patients

### Test 9.3: 404 Not Found
- [ ] Try to access unassigned patient via API
- [ ] **Expected:** 404 error
- [ ] **Expected:** Patient not visible in UI

---

## 10. Responsive Design

### Test 10.1: Mobile View (375px)
- [ ] Resize browser to 375px width
- [ ] **Expected:** Sidebar collapses to hamburger menu
- [ ] **Expected:** Patient cards stack vertically
- [ ] **Expected:** Action buttons remain touch-friendly (48px min)
- [ ] **Expected:** Modals are scrollable

### Test 10.2: Tablet View (768px)
- [ ] Resize browser to 768px width
- [ ] **Expected:** Sidebar visible
- [ ] **Expected:** Patient cards in 1 column
- [ ] **Expected:** All content readable

### Test 10.3: Desktop View (1024px+)
- [ ] Resize browser to 1024px+ width
- [ ] **Expected:** Sidebar always visible
- [ ] **Expected:** Patient cards in 2 columns
- [ ] **Expected:** Optimal layout

---

## 11. Performance & UX

### Test 11.1: Loading States
- [ ] Refresh page
- [ ] **Expected:** Loading spinner shows while fetching patients
- [ ] **Expected:** Smooth transition to patient list

### Test 11.2: Toast Notifications
- [ ] Perform any action (add diagnosis, order test, prescribe)
- [ ] **Expected:** Toast appears in top-right corner
- [ ] **Expected:** Toast auto-dismisses after 3-5 seconds
- [ ] **Expected:** Toast is readable and informative

### Test 11.3: Modal Animations
- [ ] Open any modal
- [ ] **Expected:** Smooth fade-in animation
- [ ] **Expected:** Background overlay darkens
- [ ] Close modal
- [ ] **Expected:** Smooth fade-out animation

---

## 12. Data Accuracy

### Test 12.1: Patient Information
- [ ] Verify patient name matches backend data
- [ ] Verify age is correct
- [ ] Verify priority badge color matches priority level
- [ ] Verify symptoms display correctly

### Test 12.2: Response Time Calculation
- [ ] Check response time for recently admitted patient
- [ ] **Expected:** Shows hours (e.g., "5h")
- [ ] Check response time for patient admitted days ago
- [ ] **Expected:** Shows days (e.g., "3d")

### Test 12.3: Status Display
- [ ] Verify status field shows correct value
- [ ] **Expected:** Matches backend status

---

## 13. Security

### Test 13.1: Token Expiration
- [ ] Login as doctor
- [ ] Wait for token to expire (or manually delete token)
- [ ] Try to perform action
- [ ] **Expected:** Redirect to login page
- [ ] **Expected:** Error message about authentication

### Test 13.2: Role Verification
- [ ] Login as doctor
- [ ] Check localStorage for user role
- [ ] **Expected:** `role: "doctor"`
- [ ] Verify sidebar shows doctor-specific items

---

## 14. Edge Cases

### Test 14.1: Long Patient Names
- [ ] Create patient with very long name
- [ ] **Expected:** Name truncates or wraps properly
- [ ] **Expected:** No layout breaking

### Test 14.2: Long Symptoms
- [ ] Create patient with very long symptoms text
- [ ] **Expected:** Symptoms truncate with ellipsis
- [ ] **Expected:** Card maintains proper height

### Test 14.3: Special Characters
- [ ] Enter diagnosis with special characters: `<script>alert('test')</script>`
- [ ] **Expected:** Characters are escaped/sanitized
- [ ] **Expected:** No XSS vulnerability

---

## Test Summary

**Total Tests:** 50+

**Pass Criteria:**
- [ ] All authentication tests pass
- [ ] Sidebar shows only doctor-allowed items
- [ ] All clinical actions work correctly
- [ ] All forbidden routes are blocked
- [ ] No console errors
- [ ] Responsive design works on all screen sizes
- [ ] All modals function properly
- [ ] Data displays accurately

**Test Date:** _______________

**Tester:** _______________

**Result:** ☐ PASS  ☐ FAIL

**Notes:**
_______________________________________
_______________________________________
_______________________________________
