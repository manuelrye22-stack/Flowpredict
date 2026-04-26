import axios from 'axios'

interface VerificationResult {
  success: boolean
  outcome?: 'YES' | 'NO' | 'UNDETERMINED'
  actualValue?: string
  source: string
  verifiedAt: Date
  details?: string
}

// Crypto price verification (CoinGecko free API)
export async function verifyCryptoPrediction(topic: string, direction: string): Promise<VerificationResult> {
  try {
    // Parse topic like "Bitcoin > $50000" or "BTC will rise"
    const topicLower = topic.toLowerCase()
    
    // Map common crypto names
    const cryptoMap: Record<string, string> = {
      'bitcoin': 'bitcoin',
      'btc': 'bitcoin',
      'ethereum': 'ethereum',
      'eth': 'ethereum',
      'solana': 'solana',
      'sol': 'solana',
      'dogecoin': 'dogecoin',
      'doge': 'dogecoin',
      'cardano': 'cardano',
      'ada': 'cardano',
      'polkadot': 'polkadot',
      'dot': 'polkadot',
    }
    
    // Find which crypto
    let coinId = null
    for (const [key, value] of Object.entries(cryptoMap)) {
      if (topicLower.includes(key)) {
        coinId = value
        break
      }
    }
    
    if (!coinId) {
      return { success: false, source: 'coingecko', verifiedAt: new Date(), outcome: 'UNDETERMINED', details: 'Could not identify crypto' }
    }
    
    // Extract target price from topic
    const priceMatch = topic.match(/\$?([\d,]+)/)
    const targetPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null
    
    // Fetch current price
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { timeout: 10000 }
    )
    
    const currentPrice = response.data[coinId]?.usd
    
    if (!currentPrice) {
      return { success: false, source: 'coingecko', verifiedAt: new Date(), outcome: 'UNDETERMINED', details: 'Could not fetch price' }
    }
    
    // Determine outcome
    let outcome: 'YES' | 'NO' = 'NO'
    let won = false
    
    if (targetPrice) {
      if (topicLower.includes('above') || topicLower.includes('over') || topicLower.includes('>')) {
        won = currentPrice > targetPrice
      } else if (topicLower.includes('below') || topicLower.includes('under') || topicLower.includes('<')) {
        won = currentPrice < targetPrice
      } else {
        // Default: check if price went up (YES direction = price increase)
        won = direction === 'YES'
      }
    } else {
      // No specific price - just check if "will rise" or "will fall"
      if (topicLower.includes('rise') || topicLower.includes('go up') || topicLower.includes('bull')) {
        won = direction === 'YES'
      } else if (topicLower.includes('fall') || topicLower.includes('go down') || topicLower.includes('bear')) {
        won = direction === 'NO'
      } else {
        return { success: false, source: 'coingecko', verifiedAt: new Date(), outcome: 'UNDETERMINED', details: 'Could not parse prediction' }
      }
    }
    
    outcome = won ? 'YES' : 'NO'
    
    return {
      success: true,
      outcome,
      actualValue: `$${currentPrice.toLocaleString()}`,
      source: `CoinGecko API - ${coinId}`,
      verifiedAt: new Date(),
      details: `${coinId.toUpperCase()} current price: $${currentPrice.toLocaleString()}`
    }
  } catch (error: any) {
    return { 
      success: false, 
      source: 'coingecko', 
      verifiedAt: new Date(), 
      outcome: 'UNDETERMINED', 
      details: error.message 
    }
  }
}

// Weather verification (Open-Meteo free API - no key needed)
export async function verifyWeatherPrediction(topic: string, direction: string): Promise<VerificationResult> {
  try {
    const topicLower = topic.toLowerCase()
    
    // Try to extract location and weather condition
    const locationMatch = topic.match(/in\s+([a-zA-Z\s]+?)(?:\s+on|\s+at|\s+will|$)/i)
    const location = locationMatch ? locationMatch[1].trim() : null
    
    // Default cities for common Nigerian cities
    const cityCoords: Record<string, [number, number]> = {
      'lagos': [6.5244, 3.3792],
      'abuja': [9.0765, 7.3986],
      'ibadan': [7.3775, 3.947],
      'kano': [12.0022, 8.5919],
      'port harcourt': [4.7774, 7.0134],
      'enugu': [6.4405, 7.5118],
      'abu dhabi': [24.4539, 54.3773],
      'london': [51.5074, -0.1278],
      'new york': [40.7128, -74.006],
      'tokyo': [35.6762, 139.6503],
    }
    
    let coords: [number, number] | null = null
    
    if (location) {
      for (const [city, c] of Object.entries(cityCoords)) {
        if (location.toLowerCase().includes(city)) {
          coords = c
          break
        }
      }
    }
    
    // Default to Lagos if no location found
    if (!coords) coords = [6.5244, 3.3792]
    
    // Fetch weather
    const weatherRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current_weather=true&daily=precipitation_sum`,
      { timeout: 10000 }
    )
    
    const currentWeather = weatherRes.data.current_weather
    const todayRain = weatherRes.data.daily?.precipitation_sum?.[0] || 0
    
    const temperature = currentWeather?.temperature
    const weatherCode = currentWeather?.weathercode
    
    // Determine outcome
    let won = false
    
    // Check various weather conditions
    if (topicLower.includes('rain') || topicLower.includes('rainy') || topicLower.includes('wet')) {
      won = (todayRain > 0 || (weatherCode && weatherCode > 50)) && direction === 'YES'
      if (topicLower.includes('no rain') || topicLower.includes('not rain') || topicLower.includes('sunny')) {
        won = (todayRain === 0 || !weatherCode || weatherCode < 50) && direction === 'YES'
      }
    } else if (topicLower.includes('sunny') || topicLower.includes('clear')) {
      won = (weatherCode === 0) && direction === 'YES'
    } else if (topicLower.includes('hot') || topicLower.includes('warm') || topicLower.includes('>')) {
      const tempMatch = topic.match(/>\s*(\d+)/)
      if (tempMatch) {
        const targetTemp = parseInt(tempMatch[1])
        won = (temperature || 0) > targetTemp
      } else {
        won = (temperature || 0) > 30 && direction === 'YES'
      }
    } else if (topicLower.includes('cold') || topicLower.includes('cool') || topicLower.includes('<')) {
      const tempMatch = topic.match(/<\s*(\d+)/)
      if (tempMatch) {
        const targetTemp = parseInt(tempMatch[1])
        won = (temperature || 0) < targetTemp
      } else {
        won = (temperature || 0) < 20 && direction === 'YES'
      }
    } else {
      // Default: check if temperature went above a threshold
      if (topicLower.includes('above') || topicLower.includes('over')) {
        const tempMatch = topic.match(/>\s*(\d+)/)
        if (tempMatch) {
          const targetTemp = parseInt(tempMatch[1])
          won = (temperature || 0) > targetTemp
        }
      }
    }
    
    const outcome = won ? 'YES' : 'NO'
    
    return {
      success: true,
      outcome,
      actualValue: `${temperature}°C, Rain: ${todayRain}mm`,
      source: 'Open-Meteo API',
      verifiedAt: new Date(),
      details: `Temperature: ${temperature}°C, Rain today: ${todayRain}mm`
    }
  } catch (error: any) {
    return { 
      success: false, 
      source: 'open-meteo', 
      verifiedAt: new Date(), 
      outcome: 'UNDETERMINED', 
      details: error.message 
    }
  }
}

// Politics verification (using simplified event tracking)
// For politics, we'll check if specific events occurred
export async function verifyPoliticsPrediction(topic: string, direction: string): Promise<VerificationResult> {
  try {
    const topicLower = topic.toLowerCase()
    
    // Known political events to track (expandable)
    // Format: "candidate wins election", "party takes power", etc.
    
    // For now, use a heuristic: check if there's a clear winner mentioned
    // In production, you'd integrate with news APIs or specific event databases
    
    // Check for election-related predictions
    const electionKeywords = ['election', 'vote', 'wins', 'becomes president', 'takes office']
    const hasElectionKeyword = electionKeywords.some(k => topicLower.includes(k))
    
    if (hasElectionKeyword) {
      return {
        success: false,
        source: 'manual',
        verifiedAt: new Date(),
        outcome: 'UNDETERMINED',
        details: 'Political election predictions require manual verification. Please use consensus or admin verification.'
      }
    }
    
    // For other political predictions - try to find via news
    // Using a simple approach - search for recent news
    // Note: In production, use a proper news API like NewsAPI or GDELT
    
    // For demo, return undetermined
    return {
      success: false,
      source: 'politics',
      verifiedAt: new Date(),
      outcome: 'UNDETERMINED',
      details: 'Politics verification requires manual confirmation or specialized API integration.'
    }
  } catch (error: any) {
    return { 
      success: false, 
      source: 'politics', 
      verifiedAt: new Date(), 
      outcome: 'UNDETERMINED', 
      details: error.message 
    }
  }
}

// Sports verification (using TheSportsDB free API)
export async function verifySportsPrediction(topic: string, direction: string): Promise<VerificationResult> {
  try {
    const topicLower = topic.toLowerCase()
    
    // Map team names to TheSportsDB team IDs
    const teamIdMap: Record<string, string> = {
      'manchester united': '133936',
      'manchester city': '133946',
      'liverpool': '134062',
      'chelsea': '133845',
      'arsenal': '133908',
      'tottenham': '149058',
      'real madrid': '136772',
      'barcelona': '133841',
      'psg': '133819',
      'bayern': '131840',
      'juventus': '109649',
      'ac milan': '109495',
      'inter milan': '108109',
      'ajax': '133738',
      'Barcelona': '133841',
      'Real Madrid': '136772',
    }

    // Common team mappings (expandable)
    const teamAliases: Record<string, string[]> = {
      'manchester united': ['manchester united', 'man utd', 'mu'],
      'manchester city': ['manchester city', 'man city', 'mci'],
      'liverpool': ['liverpool', 'liv'],
      'chelsea': ['chelsea', 'che'],
      'arsenal': ['arsenal', 'ars'],
      'tottenham': ['tottenham', 'spurs', 'tot'],
      'real madrid': ['real madrid', 'rma'],
      'barcelona': ['barcelona', 'fcb'],
      'psg': ['paris saint-germain', 'psg', 'paris'],
      'bayern': ['bayern munich', 'bayern', 'fcb'],
      'juventus': ['juventus', 'juv'],
      'messi': ['messi', 'lionel messi'],
      'ronaldo': ['ronaldo', 'cristiano ronaldo'],
      'nigerian national team': ['nigeria', 'super eagles', 'nigerian'],
    }

    // Parse team names from topic
    const teams: string[] = []
    for (const [team, aliases] of Object.entries(teamAliases)) {
      for (const alias of aliases) {
        if (topicLower.includes(alias)) {
          if (!teams.includes(team)) teams.push(team)
          break
        }
      }
    }

    // Check for score-based predictions
    const scoreMatch = topic.match(/(\d+)\s*-\s*(\d+)/)
    
    // Check for winner predictions
    const winKeywords = ['wins', 'win', 'beat', 'defeat', 'victory', 'champion', 'title']
    const hasWinKeyword = winKeywords.some(k => topicLower.includes(k))

    // Check for over/under predictions
    const overUnderMatch = topic.match(/(over|under)\s*(\d+\.?\d*)\s*(goals|points|runs)/i)

    // If we found teams, try to fetch match data
    if (teams.length >= 1) {
      // Check for match lookup
      const normalizedTeam = teams[0].toLowerCase()
      const teamId = teamIdMap[normalizedTeam] || teamIdMap[teams[0]]
      
      if (teamId) {
        // Fetch live/Recent events for the team
        try {
          const eventsRes = await axios.get(
            `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`,
            { timeout: 10000 }
          )
          
          const events = eventsRes.data?.events
          
          if (events && events.length > 0) {
            // Get the most recent result
            const lastEvent = events[0]
            const homeTeam = lastEvent.strHomeTeam
            const awayTeam = lastEvent.strAwayTeam
            const homeScore = lastEvent.intHomeScore
            const awayScore = lastEvent.intAwayScore
            
            let won = false
            const eventResult = `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`
            
            // Check if predicted team won
            for (const team of teams) {
              const teamLower = team.toLowerCase()
              const isHome = homeTeam?.toLowerCase().includes(teamLower)
              const isAway = awayTeam?.toLowerCase().includes(teamLower)
              
              if (isHome || isAway) {
                // Check direction
                if (topicLower.includes('wins') || topicLower.includes('win')) {
                  // If predicting YES and team won, or NO and team lost
                  const teamWon = (isHome && homeScore > awayScore) || (isAway && awayScore > homeScore)
                  won = (direction === 'YES' && teamWon) || (direction === 'NO' && !teamWon)
                }
              }
            }
            
            return {
              success: true,
              outcome: won ? 'YES' : 'NO',
              actualValue: eventResult,
              source: 'TheSportsDB API',
              verifiedAt: new Date(),
              details: `Last match: ${eventResult}`
            }
          }
        } catch (apiError: any) {
          console.log('TheSportsDB API error:', apiError.message)
        }
      }
      
      // If API didn't work, still try heuristic
      if (hasWinKeyword && teams.length >= 1) {
        return {
          success: false,
          source: 'sports-api',
          verifiedAt: new Date(),
          outcome: 'UNDETERMINED',
          details: `Sports verification for "${topic}" - teams detected: ${teams.join(', ')}. Use manual or consensus verification.`
        }
      }
    }

    // Check for tournament/winner predictions
    const tournamentKeywords = ['championship', 'league', 'tournament', 'cup', 'final']
    if (tournamentKeywords.some(k => topicLower.includes(k))) {
      return {
        success: false,
        source: 'sports-api',
        verifiedAt: new Date(),
        outcome: 'UNDETERMINED',
        details: 'Tournament winner predictions require manual verification or specialized sports API.'
      }
    }

    // If we can't determine how to verify
    return {
      success: false,
      source: 'sports-api',
      verifiedAt: new Date(),
      outcome: 'UNDETERMINED',
      details: 'Could not parse sports prediction. Try: "Team A wins", "Over 2.5 goals", or use manual verification.'
    }
  } catch (error: any) {
    return { 
      success: false, 
      source: 'sports', 
      verifiedAt: new Date(), 
      outcome: 'UNDETERMINED', 
      details: error.message 
    }
  }
}

// Main verification router
export async function verifyPrediction(
  category: string,
  topic: string,
  direction: string
): Promise<VerificationResult> {
  switch (category.toLowerCase()) {
    case 'crypto':
      return verifyCryptoPrediction(topic, direction)
    case 'weather':
      return verifyWeatherPrediction(topic, direction)
    case 'politics':
      return verifyPoliticsPrediction(topic, direction)
    case 'sports':
      return verifySportsPrediction(topic, direction)
    default:
      return {
        success: false,
        source: 'unknown',
        verifiedAt: new Date(),
        outcome: 'UNDETERMINED',
        details: `Category ${category} not supported for auto-verification`
      }
  }
}