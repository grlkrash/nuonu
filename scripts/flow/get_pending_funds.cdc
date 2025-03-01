import FlowArtistManager from 0x28736dfc4d9e84c6

access(all) fun main(artistId: String): UFix64 {
    return FlowArtistManager.getPendingFunds(artistId: artistId)
} 