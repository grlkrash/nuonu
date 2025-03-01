access(all) fun main(address: Address, name: String): String {
    let account = getAccount(address)
    let contractCode = account.contracts.get(name: name)
    
    if contractCode == nil {
        return "Contract not found"
    }
    
    return "Contract exists"
} 