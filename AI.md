# UniCrypt AI Module

UniCrypt AI integrates a production-ready conversational intelligence layer supporting general knowledge, live search, and platform action execution.

## Intent Modes
1. **GENERAL**: Unrelated questions route to OpenAI directly without injecting platform metadata.
2. **LIVE**: Weather, news, or current events queries trigger weather API or DuckDuckGo searches.
3. **PLATFORM**: Local database status, vault files, and audit log inquiries query Firestore.
4. **HYBRID**: Integrates external guidelines (e.g. visa guidelines) with internal student status recommendations.
