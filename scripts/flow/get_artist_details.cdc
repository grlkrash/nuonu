import FlowArtistManager from 0x28736dfc4d9e84c6

access(all) fun main(artistId: String): {String: String} {
    let artist = FlowArtistManager.getArtist(id: artistId)
    
    if artist == nil {
        return {"error": "Artist not found"}
    }
    
    let result: {String: String} = {}
    result["id"] = artist!.id
    result["address"] = artist!.address.toString()
    result["verified"] = artist!.verified ? "true" : "false"
    
    if artist!.optimismAddress != nil {
        result["optimismAddress"] = artist!.optimismAddress!
    } else {
        result["optimismAddress"] = "none"
    }
    
    return result
} 