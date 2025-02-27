# Dependency Audit Report

Generated: 2025-02-27T02:17:34.731Z

## Security Vulnerabilities

Total vulnerabilities found: 24

| Package | Severity | Via | Fix Available |
|---------|----------|-----|---------------|
| @ethersproject/providers | high | ws | Yes |
| @ethersproject/signing-key | critical | elliptic | Yes |
| @matterlabs/hardhat-zksync-deploy | low | @matterlabs/hardhat-zksync-solc, hardhat | No |
| @matterlabs/hardhat-zksync-solc | low | hardhat | No |
| @matterlabs/hardhat-zksync-verify | low | @matterlabs/hardhat-zksync-solc, @nomicfoundation/hardhat-verify, hardhat | Yes |
| @nomicfoundation/hardhat-chai-matchers | low | @nomicfoundation/hardhat-ethers, hardhat | No |
| @nomicfoundation/hardhat-ethers | low | hardhat | No |
| @nomicfoundation/hardhat-ignition | low | @nomicfoundation/hardhat-verify, hardhat | Yes |
| @nomicfoundation/hardhat-ignition-ethers | low | @nomicfoundation/hardhat-ethers, @nomicfoundation/hardhat-ignition, hardhat | No |
| @nomicfoundation/hardhat-network-helpers | low | hardhat | No |
| @nomicfoundation/hardhat-toolbox | low | @nomicfoundation/hardhat-chai-matchers, @nomicfoundation/hardhat-ethers, @nomicfoundation/hardhat-ignition-ethers, @nomicfoundation/hardhat-network-helpers, @nomicfoundation/hardhat-verify, @typechain/hardhat, hardhat, hardhat-gas-reporter, solidity-coverage | No |
| @nomicfoundation/hardhat-verify | low | hardhat | Yes |
| @sentry/node | low | cookie | No |
| @typechain/hardhat | low | hardhat | Yes |
| cookie | low | cookie | No |
| elliptic | critical | elliptic, elliptic, elliptic, elliptic, elliptic, elliptic | Yes |
| eth-gas-reporter | high | ethers | Yes |
| ethers | critical | @ethersproject/providers, @ethersproject/signing-key | Yes |
| hardhat | low | @sentry/node | No |
| hardhat-gas-reporter | low | hardhat | Yes |
| next | high | next, next, next, next, next | Yes |
| solidity-coverage | low | hardhat | No |
| ws | high | ws | Yes |
| zksync-web3 | high | ethers | Yes |

## Outdated Packages

Total outdated packages: 12

| Package | Current | Wanted | Latest | Update Type |
|---------|---------|--------|--------|--------------|
| @openzeppelin/contracts | 4.9.6 | 4.9.6 | 5.2.0 | major |
| @types/chai | 4.3.20 | 4.3.20 | 5.0.1 | major |
| @types/node | 20.17.19 | 20.17.19 | 22.13.5 | major |
| @types/react | 18.3.18 | 18.3.18 | 19.0.10 | major |
| @types/react-dom | 18.3.5 | 18.3.5 | 19.0.4 | major |
| chai | 4.5.0 | 4.5.0 | 5.2.0 | major |
| eslint | 8.57.1 | 8.57.1 | 9.21.0 | major |
| eslint-config-next | 14.1.0 | 14.1.0 | 15.2.0 | major |
| next | 14.1.0 | 14.1.0 | 15.2.0 | major |
| react | 18.3.1 | 18.3.1 | 19.0.0 | major |
| react-dom | 18.3.1 | 18.3.1 | 19.0.0 | major |
| tailwindcss | 3.4.17 | 3.4.17 | 4.0.9 | major |
