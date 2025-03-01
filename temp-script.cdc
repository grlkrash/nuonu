transaction {
  prepare(signer: AuthAccount) {
    log("Hello, Flow!")
  }
  
  execute {
    log("Transaction executed")
  }
} 