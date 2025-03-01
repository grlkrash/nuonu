import FlowArtistManager from 0x28736dfc4d9e84c6

access(all) fun main(): [String] {
    // Return all artist IDs in the registry
    let keys = FlowArtistManager.artists.keys
    let result: [String] = []
    
    for key in keys {
        result.append(key)
    }
    
    return result
} 