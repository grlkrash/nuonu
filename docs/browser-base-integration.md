# Browser Base Integration

Browser Base is a headless browser automation tool integrated into the Artist Grant AI Agent to enable automated interactions with external grant websites. This integration allows the agent to discover opportunities, submit applications, and monitor application status on external platforms without manual intervention.

## Overview

The Browser Base integration provides the following capabilities:

1. **External Application Submission**: Automates the process of submitting applications to external grant websites by filling out forms and uploading required documents.
2. **Application Status Monitoring**: Periodically checks the status of submitted applications on external platforms.
3. **Opportunity Discovery**: Scrapes external websites to discover new grant opportunities for artists.

## Key Components

### 1. Browser Base Service

The core functionality is implemented in `src/lib/services/browser-base.ts`, which provides the following functions:

- `submitExternalApplication`: Submits an application to an external website
- `checkApplicationStatus`: Checks the status of a previously submitted application
- `scrapeExternalOpportunities`: Discovers new opportunities from external websites

### 2. API Routes

The following API routes enable frontend components to interact with the Browser Base service:

- `/api/agent/external-submit`: Submits an application to an external website
- `/api/agent/check-status`: Checks the status of a previously submitted application
- `/api/agent/discover`: Discovers new opportunities from external websites

### 3. UI Components

The following UI components provide user interfaces for the Browser Base functionality:

- `ExternalApplicationStatus`: Displays the status of an external application and allows users to check for updates
- `ApplicationGenerator`: Includes functionality to submit applications to external websites

## How It Works

### External Application Submission

1. The user generates an application using the AI Application Generator
2. If the opportunity has an external URL, the "Submit to External Site" button appears
3. When clicked, the application data is sent to the `/api/agent/external-submit` endpoint
4. The Browser Base service:
   - Navigates to the external website
   - Analyzes the form structure
   - Fills in the application data
   - Submits the form
   - Returns a submission ID for tracking

### Application Status Monitoring

1. After submission, the application status is initially set to "submitted"
2. The user can check the status using the ExternalApplicationStatus component
3. When the "Check Status" button is clicked, the `/api/agent/check-status` endpoint is called
4. The Browser Base service:
   - Navigates to the external website
   - Logs in if necessary
   - Checks the application status
   - Returns the current status (submitted, under review, accepted, rejected)

### Opportunity Discovery

1. The autonomous agent periodically searches for new opportunities
2. The agent calls the `/api/agent/discover` endpoint with a list of target URLs
3. The Browser Base service:
   - Navigates to each website
   - Scrapes opportunity information (title, organization, amount, deadline, etc.)
   - Returns a list of discovered opportunities
4. The agent then matches these opportunities with artist profiles

## Autonomous Agent Integration

The autonomous agent (`scripts/run-autonomous-agent.js`) uses Browser Base for:

1. Discovering opportunities from external websites
2. Submitting applications to high-match opportunities
3. Monitoring application status

The agent logs all activities in the `agent_activities` table, including Browser Base operations.

## Configuration

Browser Base can be configured using the following environment variables:

```
# Enable/disable Browser Base integration
BROWSER_BASE_ENABLED=true

# Run browser in headless mode (no visible UI)
BROWSER_BASE_HEADLESS=true

# Timeout for browser operations (in milliseconds)
BROWSER_BASE_TIMEOUT=30000

# User agent string for browser
BROWSER_BASE_USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36
```

## Security Considerations

When using Browser Base, consider the following security best practices:

1. **Respect Website Terms of Service**: Ensure that automated interactions comply with the terms of service of external websites.
2. **Rate Limiting**: Implement rate limiting to avoid overwhelming external websites with requests.
3. **Secure Credential Storage**: If authentication is required, store credentials securely.
4. **Data Privacy**: Handle sensitive application data with appropriate security measures.
5. **Error Handling**: Implement robust error handling to prevent data leakage in error messages.

## Limitations

The current implementation has the following limitations:

1. **Complex Forms**: May struggle with highly dynamic or complex form structures.
2. **CAPTCHA**: Cannot bypass CAPTCHA or other anti-bot measures.
3. **JavaScript-Heavy Sites**: May have difficulty with sites that rely heavily on client-side JavaScript.
4. **Authentication**: Limited support for complex authentication flows.

## Future Enhancements

Planned enhancements for the Browser Base integration include:

1. **AI-Powered Form Analysis**: Using AI to better understand and interact with complex form structures.
2. **Multi-Step Form Support**: Enhanced support for multi-page application processes.
3. **Document Generation**: Automatically generating and formatting required documents.
4. **Improved Error Recovery**: Better handling of unexpected website changes or errors.
5. **Integration with More Platforms**: Expanding support to more grant platforms and opportunity sources.
6. **Grant Gopher Integration**: Implementing specialized scraping for grantgopher.com:
   - Periodic scraping of new opportunities
   - Intelligent parsing of grant details
   - Automatic categorization and tagging
   - Handling of pagination and search filters
   - Respecting rate limits and terms of service

## Troubleshooting

### Common Issues

1. **Submission Failures**
   - Check if the external website has changed its structure
   - Verify that all required fields are included in the application data
   - Check for CAPTCHA or other anti-bot measures

2. **Status Check Failures**
   - Verify that the submission ID is correct
   - Check if the external website requires authentication
   - Ensure the application was successfully submitted

3. **Discovery Issues**
   - Verify that the target URLs are accessible
   - Check if the website structure has changed
   - Ensure the Browser Base service has sufficient permissions

### Logging

Browser Base operations are logged in the following locations:

1. Console logs with the prefix `[Browser Base]`
2. Agent activities table with `activity_type` set to `browser_automation`
3. Application status updates in the applications table

## API Reference

### submitExternalApplication

```typescript
function submitExternalApplication(
  data: ApplicationData,
  config?: Partial<BrowserBaseConfig>
): Promise<{
  success: boolean;
  message: string;
  submissionId?: string;
}>
```

### checkApplicationStatus

```typescript
function checkApplicationStatus(
  artistId: string,
  opportunityId: string,
  submissionId: string
): Promise<{
  success: boolean;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'unknown';
  message: string;
  lastChecked: string;
}>
```

### scrapeExternalOpportunities

```typescript
function scrapeExternalOpportunities(
  urls: string[]
): Promise<{
  success: boolean;
  opportunities: Array<{
    title: string;
    organization: string;
    amount?: number;
    deadline?: string;
    url: string;
  }>;
}>
``` 