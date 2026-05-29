# Google Maps Integration Guide

This application uses Google Maps JavaScript API for displaying space locations.

## Setup Instructions

### 1. Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → API Key**
5. Copy your new API key

### 2. Enable Required APIs

In Google Cloud Console, enable these APIs:
- Maps JavaScript API
- Places API
- Geocoding API

### 3. Configure API Key Restrictions

**Important:** Secure your API key with HTTP referrer restrictions:

1. Click on your API key in the Credentials page
2. Under **Application restrictions**, select **HTTP referrers**
3. Add these referrer patterns:

```
# For production
yourdomain.com/*
*.yourdomain.com/*

# For development
localhost:*/*
127.0.0.1:*/*

# For v0 previews
*.vusercontent.net/*
```

4. Under **API restrictions**, select **Restrict key**
5. Choose only the APIs you need:
   - Maps JavaScript API
   - Places API
   - Geocoding API

6. Click **Save**

### 4. Add to Environment Variables

Add your API key to your project's environment variables with the name shown in your Vercel dashboard under the "Vars" section.

### 5. Deploy

The API key will be automatically included in your deployment and secured by the domain restrictions you configured.

## Security Model

Google Maps API keys are designed to be publicly visible in browser code. Security is maintained through:

1. **Domain Restrictions** - Only your specified domains can use the key
2. **API Restrictions** - Only enabled APIs can be accessed
3. **Usage Quotas** - Set daily limits to prevent abuse
4. **Billing Alerts** - Get notified of unexpected usage

## Troubleshooting

### RefererNotAllowedMapError

**Cause:** Your domain is not in the allowed referrers list

**Solution:** Add your domain to the HTTP referrers in Google Cloud Console

### API Key Not Loading

**Cause:** Environment variable not set correctly

**Solution:** Check that your environment variable is properly configured in Vercel

### Map Not Displaying

**Cause:** Required APIs not enabled

**Solution:** Enable Maps JavaScript API, Places API, and Geocoding API in Google Cloud Console

## Cost Management

- Google provides $200 free credit per month
- Set daily quotas to prevent unexpected charges
- Enable billing alerts in Google Cloud Console
- Monitor usage in the APIs & Services dashboard

## Best Practices

1. Never commit API keys to version control
2. Use separate keys for development and production
3. Regularly rotate API keys
4. Monitor usage and set appropriate quotas
5. Keep domain restrictions up to date
