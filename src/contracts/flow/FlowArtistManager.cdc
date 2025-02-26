
        pub contract FlowArtistManager {
            pub var artists: {String: Address}
            
            init() {
                self.artists = {}
            }
            
            pub fun registerArtist(artistId: String, address: Address) {
                self.artists[artistId] = address
            }
            
            pub fun getArtistAddress(artistId: String): Address? {
                return self.artists[artistId]
            }
        }
      