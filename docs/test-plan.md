# User Flow Test Plan

## Authentication Flow
1. **Sign Up Test**
   - Navigate to `/signup`
   - Enter email and password
   - Verify email verification is sent
   - Verify redirect to dashboard after verification

2. **Sign In Test**
   - Navigate to `/signin`
   - Enter email and password
   - Verify successful login
   - Verify redirect to dashboard

## Onboarding Flow
1. **Questionnaire Test**
   - Navigate to `/onboarding`
   - Complete all questions in the questionnaire
   - Verify progress bar updates correctly
   - Verify form validation works
   - Verify redirect to dashboard after completion

## Dashboard Flow
1. **Dashboard Loading Test**
   - Navigate to `/dashboard`
   - Verify profile information is displayed
   - Verify recommended opportunities are displayed
   - Verify profile completion percentage is accurate

2. **Profile Completion Test**
   - Click "Complete Profile" button
   - Update profile information
   - Verify profile completion percentage increases

## Opportunities Flow
1. **Browse Opportunities Test**
   - Navigate to `/opportunities`
   - Verify opportunities are displayed
   - Test filtering and sorting
   - Click on an opportunity to view details

2. **Apply to Opportunity Test**
   - Navigate to an opportunity detail page
   - Click "Apply" button
   - Complete application form
   - Verify application is submitted
   - Verify application appears in dashboard

## Wallet Integration Flow
1. **Connect Wallet Test**
   - Navigate to wallet section
   - Test connecting Base wallet
   - Test connecting zkSync wallet
   - Test connecting Flow wallet
   - Verify session key creation for zkSync
   - Verify wallet addresses are displayed

2. **Transaction Test**
   - Test sending a transaction
   - Verify transaction is processed
   - Verify transaction appears in history

## AI Agent Flow
1. **AI Matching Test**
   - Verify AI agent matches opportunities to profile
   - Test match quality scoring
   - Verify recommendations are relevant

2. **AI Application Generation Test**
   - Test AI-generated application content
   - Verify content is relevant to opportunity and profile

## Error Handling
1. **Authentication Error Test**
   - Test invalid credentials
   - Verify error messages are displayed

2. **Form Validation Test**
   - Test submitting forms with invalid data
   - Verify validation errors are displayed

3. **API Error Test**
   - Test API error handling
   - Verify user-friendly error messages are displayed

## Performance
1. **Page Load Test**
   - Measure page load times
   - Verify responsive design on different screen sizes

2. **API Response Time Test**
   - Measure API response times
   - Verify loading states are displayed during API calls 