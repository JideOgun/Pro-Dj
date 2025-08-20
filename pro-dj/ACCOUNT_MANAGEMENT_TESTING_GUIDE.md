# Account Management Testing Guide

This guide will help you test the new account management features including terms agreement flow and account pausing/deletion functionality.

## 🚀 **Quick Start Testing**

### 1. **Start Your Development Server**

```bash
npm run dev
# or
yarn dev
```

### 2. **Test the New Signup Flow**

1. Sign out if currently signed in
2. Create a new account (either client or DJ)
3. You should be redirected to `/auth/terms-agreement`
4. Complete the terms agreement process
5. You should be redirected to the appropriate page (profile for clients, DJ registration for DJs)

## 📋 **Testing Scenarios**

### ✅ **Scenario 1: New User Signup Flow**

**Steps:**

1. Go to `/auth` and create a new account
2. Fill in registration details
3. Submit the form

**Expected Behavior:**

- User is redirected to `/auth/terms-agreement`
- Terms agreement modal appears automatically
- User must read and agree to both Terms of Service and Privacy Policy
- After agreement, user is redirected to appropriate page:
  - Clients → `/dashboard/profile`
  - DJs → `/dj/register`

### ✅ **Scenario 2: Google OAuth Signup Flow**

**Steps:**

1. Go to `/auth` and click "Continue with Google"
2. Complete Google OAuth
3. Select role (Client or DJ)

**Expected Behavior:**

- User is redirected to `/auth/terms-agreement`
- Same terms agreement process as regular signup
- Proper redirection after agreement

### ✅ **Scenario 3: Account Pausing**

**Steps:**

1. Sign in with an existing account
2. Go to `/dashboard/profile`
3. Scroll down to "Account Management" section
4. Click "Pause Account"

**Expected Behavior:**

- Pause account modal appears
- User must type "PAUSE" to confirm
- Account status changes to "SUSPENDED"
- User profile is hidden from searches
- User cannot receive new bookings

### ✅ **Scenario 4: Account Reactivation**

**Steps:**

1. With a paused account, go to `/dashboard/profile`
2. Click "Reactivate Account"

**Expected Behavior:**

- Account status changes back to "ACTIVE"
- User profile becomes visible again
- User can receive new bookings

### ✅ **Scenario 5: Account Deletion (No Active Bookings)**

**Steps:**

1. Ensure user has no active bookings
2. Go to `/dashboard/profile`
3. Click "Delete Account"

**Expected Behavior:**

- Delete account modal appears
- User must type "DELETE MY ACCOUNT" to confirm
- User must check final confirmation checkbox
- Account and all data are permanently deleted
- User is redirected to home page

### ✅ **Scenario 6: Account Deletion (With Active Bookings)**

**Steps:**

1. Create a booking for the user
2. Try to delete the account

**Expected Behavior:**

- Delete button is disabled
- Warning message shows about active bookings
- User cannot delete account until bookings are completed/cancelled

## 🔧 **Technical Testing**

### **Database Verification**

Check that account status is stored correctly:

```sql
-- Check user account status
SELECT
  email,
  status,
  suspendedAt,
  suspendedBy,
  suspensionReason
FROM "User"
WHERE email = 'your-test-email@example.com';

-- Check agreement status
SELECT
  email,
  agreedToTerms,
  agreedToPrivacy,
  termsAgreedAt,
  privacyAgreedAt
FROM "User"
WHERE email = 'your-test-email@example.com';
```

### **API Endpoint Testing**

Test the account management API endpoints:

```bash
# Get account status
curl -X GET http://localhost:3000/api/user/account \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"

# Pause account
curl -X POST http://localhost:3000/api/user/account \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"action": "pause"}'

# Reactivate account
curl -X POST http://localhost:3000/api/user/account \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"action": "reactivate"}'

# Delete account
curl -X DELETE http://localhost:3000/api/user/account \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

### **Terms Agreement API Testing**

```bash
# Get agreement status
curl -X GET http://localhost:3000/api/auth/agree-terms \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"

# Submit agreement
curl -X POST http://localhost:3000/api/auth/agree-terms \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"agreedToTerms": true, "agreedToPrivacy": true}'
```

## 📱 **Cross-Device Testing**

### **Desktop Testing**

- [ ] Terms agreement modal appears correctly
- [ ] Account management section is visible
- [ ] All buttons are clickable
- [ ] Modals open and close properly
- [ ] Form validation works

### **Mobile Testing**

- [ ] Terms agreement modal is responsive
- [ ] Account management section adapts to screen size
- [ ] Touch interactions work properly
- [ ] Text is readable without zooming
- [ ] Buttons are large enough for touch

### **Tablet Testing**

- [ ] Layout adapts to tablet screen size
- [ ] Touch interactions work
- [ ] Modals display correctly

## 🌐 **Browser Testing**

Test on different browsers:

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Check for:**

- Modal appearance and functionality
- Form submissions
- API calls
- Error handling
- Redirects

## 🔍 **Accessibility Testing**

### **Screen Reader Compatibility**

- [ ] Modals are announced to screen readers
- [ ] Form fields have proper labels
- [ ] Buttons have descriptive text
- [ ] Status indicators are accessible

### **Keyboard Navigation**

- [ ] All elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Modals can be closed with Escape key

### **Color Contrast**

- [ ] Text meets WCAG contrast requirements
- [ ] Status indicators are distinguishable
- [ ] Error states are clear

## 🐛 **Error Handling Testing**

### **Network Errors**

- [ ] API failures are handled gracefully
- [ ] User sees appropriate error messages
- [ ] Retry functionality works

### **Validation Errors**

- [ ] Form validation prevents invalid submissions
- [ ] Clear error messages for invalid states
- [ ] User cannot bypass required confirmations

### **Session Errors**

- [ ] Handles expired sessions
- [ ] Redirects to login if not authenticated
- [ ] Preserves state after re-authentication

## 📊 **Performance Testing**

### **Load Times**

- [ ] Terms agreement modal appears within 2 seconds
- [ ] Account management section loads quickly
- [ ] No blocking of page content

### **Memory Usage**

- [ ] No memory leaks from modals
- [ ] Cleanup on unmount
- [ ] Efficient re-renders

## 🔒 **Security Testing**

### **Authentication**

- [ ] Only authenticated users can access account management
- [ ] Unauthenticated users are redirected
- [ ] Session validation works

### **Data Integrity**

- [ ] Account status is stored securely
- [ ] Deletion removes all associated data
- [ ] Pausing preserves data correctly

## 📈 **User Experience Testing**

### **Flow Testing**

- [ ] New user signup flow is smooth
- [ ] Terms agreement is clear and understandable
- [ ] Account management is intuitive
- [ ] Confirmation dialogs prevent accidents

### **Edge Cases**

- [ ] User with no bookings can delete account
- [ ] User with active bookings cannot delete account
- [ ] Paused account cannot receive new bookings
- [ ] Reactivated account works normally

## 🎯 **Success Criteria**

The account management features are ready for production when:

- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Performance meets standards
- [ ] Accessibility requirements are met
- [ ] Security is verified
- [ ] Error handling is robust
- [ ] User experience is smooth
- [ ] Database integration works
- [ ] API endpoints are secure
- [ ] Cross-browser compatibility is confirmed

## 🆘 **Troubleshooting**

### **Common Issues**

**Terms agreement not appearing:**

- Check if user is authenticated
- Verify agreement status in database
- Check browser console for errors

**Account management not working:**

- Check API endpoint responses
- Verify database connection
- Check for validation errors

**Modals not opening:**

- Check component imports
- Verify state management
- Check for JavaScript errors

**Database issues:**

- Check Prisma migrations
- Verify database schema
- Check for foreign key constraints

---

**Need Help?**

- Check browser console for errors
- Review API endpoint responses
- Verify database records
- Test with different user accounts
- Contact support if issues persist
