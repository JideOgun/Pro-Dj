# Legal Pages Testing Guide

This guide will help you test all the new legal pages and ensure they're working correctly.

## 🚀 Quick Start Testing

### 1. Start Your Development Server
```bash
npm run dev
# or
yarn dev
```

### 2. Run Automated Tests
```bash
node test-legal-pages.js
```

### 3. Manual Testing Checklist

## 📋 Manual Testing Checklist

### ✅ **Legal Index Page** (`/legal`)
- [ ] Page loads without errors
- [ ] All 4 legal document cards are visible
- [ ] Cards have hover effects
- [ ] Clicking each card navigates to correct page
- [ ] Business credentials section shows correctly
- [ ] Contact information is displayed
- [ ] Responsive design works on mobile/tablet

### ✅ **Terms of Service** (`/legal/terms`)
- [ ] Page loads with proper formatting
- [ ] Navigation bar shows current page highlighted
- [ ] All sections are properly formatted
- [ ] Links to Refund Policy work
- [ ] Contact information is correct
- [ ] Date shows current date
- [ ] Responsive design works

### ✅ **Privacy Policy** (`/legal/privacy`)
- [ ] Page loads with proper formatting
- [ ] All sections are present and readable
- [ ] GDPR/CCPA compliance sections are clear
- [ ] Data collection information is comprehensive
- [ ] Contact information for privacy inquiries
- [ ] Responsive design works

### ✅ **Refund Policy** (`/legal/refund`)
- [ ] Page loads with proper formatting
- [ ] Cancellation timeframes are clearly displayed
- [ ] Color-coded refund amounts are visible
- [ ] Process steps are numbered correctly
- [ ] Timeline information is accurate
- [ ] Contact information for refunds
- [ ] Responsive design works

### ✅ **Contact Information** (`/legal/contact`)
- [ ] Page loads with proper formatting
- [ ] Business information is complete
- [ ] License information is displayed
- [ ] All contact methods are listed
- [ ] Emergency contact information is visible
- [ ] Office location and hours are correct
- [ ] Response time expectations are clear
- [ ] Responsive design works

## 🔧 **Technical Testing**

### **Cross-Browser Testing**
Test on different browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### **Device Testing**
Test on different devices:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### **Performance Testing**
- [ ] Pages load within 3 seconds
- [ ] No console errors
- [ ] Images load properly
- [ ] Navigation is smooth

## 🎯 **Content Validation**

### **Legal Compliance Check**
- [ ] Terms of Service covers all required areas
- [ ] Privacy Policy includes GDPR/CCPA requirements
- [ ] Refund Policy is clear and fair
- [ ] Contact information is complete and accurate
- [ ] Business licenses are properly displayed

### **Stripe Compliance**
- [ ] Terms of Service URL is accessible
- [ ] Privacy Policy URL is accessible
- [ ] Refund Policy URL is accessible
- [ ] All URLs return 200 status codes

## 🐛 **Common Issues & Solutions**

### **Page Not Loading**
```bash
# Check if server is running
curl http://localhost:3000/api/health

# Restart server if needed
npm run dev
```

### **Navigation Not Working**
- Check browser console for JavaScript errors
- Verify all links are correct
- Test with different browsers

### **Styling Issues**
- Clear browser cache
- Check if Tailwind CSS is loading
- Verify responsive breakpoints

### **Content Not Displaying**
- Check if data is being passed correctly
- Verify component imports
- Check for TypeScript errors

## 📱 **Mobile Testing**

### **Touch Interactions**
- [ ] Tap targets are large enough (44px minimum)
- [ ] Navigation is easy to use with thumbs
- [ ] Text is readable without zooming
- [ ] Forms are mobile-friendly

### **Responsive Design**
- [ ] Layout adapts to screen size
- [ ] Text doesn't overflow
- [ ] Images scale properly
- [ ] Navigation is accessible

## 🔍 **Accessibility Testing**

### **Screen Reader Compatibility**
- [ ] All images have alt text
- [ ] Headings are properly structured
- [ ] Links have descriptive text
- [ ] Color contrast meets WCAG standards

### **Keyboard Navigation**
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Tab order is logical
- [ ] Skip links work properly

## 🚀 **Production Readiness**

### **Environment Variables**
Add these to your `.env.local` file:
```bash
# Legal Page URLs (for Stripe compliance)
TERMS_OF_SERVICE_URL="https://your-domain.com/legal/terms"
PRIVACY_POLICY_URL="https://your-domain.com/legal/privacy"
REFUND_POLICY_URL="https://your-domain.com/legal/refund"
```

### **Domain Configuration**
- [ ] Update all placeholder URLs with your actual domain
- [ ] Test all links with production URLs
- [ ] Verify SSL certificates are working
- [ ] Check that all pages are indexed properly

### **Legal Review**
- [ ] Have a lawyer review all legal documents
- [ ] Ensure compliance with local laws
- [ ] Update business information with real data
- [ ] Verify license numbers and insurance information

## 📊 **Testing Results Template**

```
Legal Pages Testing Results
Date: [Date]
Tester: [Name]

✅ Passed Tests:
- [List of passed tests]

❌ Failed Tests:
- [List of failed tests with details]

⚠️ Issues Found:
- [List of issues that need attention]

📋 Next Steps:
- [Action items for fixing issues]
- [Production deployment checklist]
```

## 🎉 **Success Criteria**

Your legal pages are ready for production when:
- [ ] All pages load without errors
- [ ] Navigation works correctly on all devices
- [ ] Content is legally compliant
- [ ] Stripe integration is configured
- [ ] Business information is accurate
- [ ] Contact information is working
- [ ] Performance meets standards
- [ ] Accessibility requirements are met

---

**Need Help?**
- Check the browser console for errors
- Review the test script output
- Consult the troubleshooting section
- Contact support if issues persist
