# UAFiX & UASerials Direct Plugin for Lampa

This is a standalone Lampa plugin that parses videos directly from **uafix.net** and **uaserials.pro** websites without requiring a server API.

## Features

- ✅ Direct parsing from websites (no server needed)
- ✅ Search integration in Lampa
- ✅ Video playback support
- ✅ Season/Episode parsing for series
- ✅ Movie and TV series support

## Installation

1. Place the `uafix-uaserials-direct` folder in your Lampa `plugins/` directory
2. The plugin will auto-load when Lampa starts

## How It Works

### Plugin Structure

```
plugins/uafix-uaserials-direct/
  ├── plugin.js       # Main plugin file
  └── README.md       # This file
```

### Key Components

1. **Search Sources**: Adds UAFiX and UASerials to Lampa's search
2. **Video Component**: Handles video page parsing and playback
3. **Parsing Functions**: Extract video links from HTML

## Customization Guide

### 1. Adjust Search URLs

If the websites use different search URL patterns, modify:

```javascript
// In addUAFiXSearchSource()
var searchUrl = 'https://uafix.net/search?term=' + encodeURIComponent(query);

// In addUASerialsSearchSource()
var searchUrl = 'https://uaserials.pro/search?term=' + encodeURIComponent(query);
```

### 2. Update HTML Parsing Selectors

The parsing functions use jQuery selectors. Adjust based on actual website structure:

**For Search Results:**
```javascript
function parseUAFiX(html, query) {
    var $ = Lampa.Utils.jQuery(html);
    $('.movie-item, .film-item').each(function() {
        // Adjust these selectors to match uafix.net structure
        var title = item.find('.title, h3').first().text();
        var url = item.find('a').first().attr('href');
        // ...
    });
}
```

**Common selectors to check:**
- `.movie-item`, `.film-item`, `.post-item`
- `.title`, `h2`, `h3`, `.post-title`
- `img[src]`, `img[data-src]`
- `.year`, `.date`, `.meta`

### 3. Update Video Page Parsing

For extracting video links from movie/series pages:

```javascript
function parseUAFiXVideoPage(html) {
    var $ = Lampa.Utils.jQuery(html);
    
    // Adjust selectors for episode/video containers
    $('.episode-item, .video-item').each(function() {
        // Extract video URL
        var url = item.find('iframe, a').attr('src') || item.find('iframe, a').attr('href');
        // ...
    });
}
```

### 4. Handle Different Video Player Formats

If videos use different iframe/embed formats:

```javascript
// Check for common video players
var iframe = $('iframe[src*="player"], iframe[src*="video"], iframe[src*="embed"]').first();
var videoUrl = iframe.attr('src');

// Or extract from data attributes
var videoUrl = $('[data-video], [data-src]').attr('data-video') || 
               $('[data-video], [data-src]').attr('data-src');
```

### 5. Add Proxy/CORS Support

If the websites block direct requests, you may need a proxy:

```javascript
function getWithProxy(url) {
    // Use your proxy service
    return 'https://your-proxy.com/?url=' + encodeURIComponent(url);
}

network.native(getWithProxy(searchUrl), function(html) {
    // Parse HTML
}, ...);
```

### 6. Handle Authentication

If the sites require login:

```javascript
network.native(searchUrl, function(html) {
    // Check if redirected to login
    if (html.includes('login') || html.includes('Login')) {
        // Handle login flow
    } else {
        // Parse results
    }
}, ...);
```

## Testing

1. **Test Search**: Use Lampa's search feature and check if UAFiX/UASerials appear
2. **Test Video Page**: Select a result and verify videos are parsed correctly
3. **Test Playback**: Click a video and ensure it plays

## Debugging

Open browser console (F12) and look for:
- Parse errors: `UAFiX parse error:` or `UASerials parse error:`
- Network errors: Check if requests are being blocked
- Selector issues: Elements not found means selectors need updating

## Common Issues

### 1. "Nothing found" always appears
- Check if search URLs are correct
- Verify HTML selectors match the website structure
- Check browser console for parse errors

### 2. Videos don't play
- Verify video URL extraction is correct
- Check if video player format is supported
- Ensure iframe/embed URLs are properly formatted

### 3. CORS errors
- Websites may block direct requests
- Consider using a proxy service
- Or implement server-side scraping

## Example: Adding Another Website

To add a third website:

1. Create parsing function:
```javascript
function parseNewSite(html, query) {
    var results = [];
    var $ = Lampa.Utils.jQuery(html);
    // Your parsing logic
    return results;
}
```

2. Add search source:
```javascript
function addNewSiteSearchSource() {
    var source = {
        title: 'NewSite',
        search: function(params, onComplete) {
            // Search implementation
        },
        // ... rest of source config
    };
    Lampa.Search.addSource(source);
}
```

3. Register in `startPlugin()`:
```javascript
addNewSiteSearchSource();
```

## Notes

- Website structures change frequently - you'll need to update selectors periodically
- Some sites may block scraping - consider using official APIs if available
- For production use, implement proper error handling and retry logic
- Add caching to reduce requests

## License

Use as you wish! Modify freely for your needs.

