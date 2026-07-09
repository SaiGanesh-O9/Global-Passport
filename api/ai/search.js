/**
 * Live Search Module (Open-Meteo Weather API & DuckDuckGo Search)
 * Resolves real-time weather and general info query results on the server side.
 */

export async function performLiveSearch(query) {
  const queryLower = query.toLowerCase();
  
  // 1. Weather search
  if (queryLower.includes('weather') || queryLower.includes('temperature') || queryLower.includes('rain')) {
    try {
      let lat = 38.8951;
      let lon = -77.0364;
      let cityName = "Washington, D.C.";
      
      if (queryLower.includes('london')) {
        lat = 51.5074; lon = -0.1278; cityName = "London";
      } else if (queryLower.includes('tokyo')) {
        lat = 35.6762; lon = 139.6503; cityName = "Tokyo";
      } else if (queryLower.includes('paris')) {
        lat = 48.8566; lon = 2.3522; cityName = "Paris";
      } else if (queryLower.includes('new york')) {
        lat = 40.7128; lon = -74.0060; cityName = "New York";
      } else if (queryLower.includes('singapore')) {
        lat = 1.3521; lon = 103.8198; cityName = "Singapore";
      } else if (queryLower.includes('hyderabad')) {
        lat = 17.3850; lon = 78.4867; cityName = "Hyderabad";
      }

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await res.json();
      if (data && data.current_weather) {
        const temp = data.current_weather.temperature;
        const wind = data.current_weather.windspeed;
        return {
          success: true,
          summary: `Current weather in ${cityName}: ${temp}°C, Wind Speed: ${wind} km/h.`,
          source: "Open-Meteo Weather API",
          url: "https://open-meteo.com"
        };
      }
    } catch (e) {
      console.warn("Weather API search failed:", e.message);
    }
  }

  // 2. DuckDuckGo Instant Answer API
  try {
    const encodedQuery = encodeURIComponent(query);
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`);
    const data = await res.json();
    
    if (data && (data.AbstractText || data.RelatedTopics?.length > 0)) {
      let summary = data.AbstractText || "";
      if (!summary && data.RelatedTopics?.[0]?.Text) {
        summary = data.RelatedTopics[0].Text;
      }
      const source = data.AbstractSource || "DuckDuckGo Search";
      const url = data.AbstractURL || "https://duckduckgo.com";
      
      if (summary) {
        return {
          success: true,
          summary: summary,
          source: source,
          url: url
        };
      }
    }
  } catch (e) {
    console.warn("DuckDuckGo Search API call failed:", e.message);
  }

  return {
    success: false,
    summary: "",
    source: "",
    url: ""
  };
}
