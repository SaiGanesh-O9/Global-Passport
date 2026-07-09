# Tools Router Integration Guide

This guide details how modular platform tools are registered, matched, and executed.

## List of Tools
1. **weather**: Fetches current temperature from Open-Meteo API.
2. **news**: Fetches latest developments from public sources.
3. **search**: Queries DuckDuckGo Instant Answer API.
4. **calculator**: Computes basic mathematical expressions (e.g. `10 + 20`).
5. **vault**: Lists credential vault items.
6. **organizations**: Lists active Universities and organizations profiles.
7. **notifications**: Lists recent notifications in user feed.
8. **audit**: Lists overrides history audit logs (Superadmin only).
9. **documents**: Lists active files referenced under vault.
10. **verification**: Lists verification requests.
11. **navigation**: Map navigation commands to switch UI screens.

## Registering a New Tool
1. Define the tool execution function inside `api/ai/tools.js` (e.g., `toolCalculator(message)`).
2. Wire the keyword triggers inside the main `executePlatformTool(message, context)` router.
