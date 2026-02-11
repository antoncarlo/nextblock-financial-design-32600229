# NextBlock

**Open infrastructure for tokenized insurance yield.**

Built for [HackMoney 2026](https://ethglobal.com/events/hackmoney2026) | Base Sepolia | Solidity 0.8.24 | ERC-4626

---

## What is NextBlock

NextBlock is open infrastructure that enables insurers to tokenize policies on-chain, vault managers to curate diversified portfolios of tokenized insurance risk, and investors to access insurance-backed yield. It is the Lloyd's of London for on-chain capital: a marketplace and settlement layer, not an insurer.

NextBlock operates as a **three-layer protocol** (Morpho-style):

- **Layer 1 -- NextBlock Protocol**: Tokenization infrastructure, vault factory, claim processing rails. This is what NextBlock builds and owns.
- **Layer 2 -- Supply + Curation**: Insurers tokenize policies; independent vault managers curate portfolios from available tokenized policies. Vault managers are the "fund managers" whose securities are insurance risk.
- **Layer 3 -- Demand**: Investors deposit capital into vaults, earn insurance-backed yield from premiums minus claims minus fees.

NextBlock is NOT an insurer and NOT a vault manager. It is infrastructure. Any vault manager can deploy strategies on top, the same way any lender can create a market on Morpho. The distinction between a product (one team, one vault) and a platform (unlimited strategies, unlimited vault managers) is central to the architecture.

| NextBlock | Lloyd's of London |
|---|---|
| NextBlock Protocol | Lloyd's marketplace + settlement |
| Policy Marketplace | Lloyd's "slip" market |
| Vault Manager | Managing agent running a syndicate |
| Vault | A Lloyd's syndicate |
| Investor | A "Name" providing capital |

---

## Architecture

```
                 LAYER 3: DEMAND / INVESTORS
    +--------------------------------------+
    |  Investors deposit USDC into vaults  |
    |  Receive share tokens ($ONyc)        |
    |  Earn yield from insurance premiums  |
    +-------------------+------------------+
                        |
                        v
                 LAYER 2: CURATION
    +--------------------------------------+
    |  Vault Managers select policies,     |
    |  set allocation weights, manage      |
    |  buffer ratios and risk strategy     |
    +-------------------+------------------+
                        |
                        v
                 LAYER 1: PROTOCOL (NextBlock)
    +--------------------------------------+
    |  PolicyRegistry    InsuranceVault    |
    |  VaultFactory      ClaimReceipt     |
    |  MockUSDC          MockOracle       |
    +--------------------------------------+
```

### Smart Contracts

| Contract | Purpose |
|---|---|
| **MockUSDC** | ERC-20 stablecoin (6 decimals). Open mint for demo. |
| **MockOracle** | Stores BTC price (8 decimals, Chainlink convention) and flight delay status. Admin-controlled. |
| **PolicyRegistry** | Registers policies with terms, insurer address, verification type. Single source of truth for policy data and time simulation (`advanceTime`). |
| **InsuranceVault** | ERC-4626 vault. Holds investor deposits + insurer premiums. Issues share tokens. Three claim trigger paths. Insurance-native NAV accounting. |
| **VaultFactory** | Deploys InsuranceVault instances. Permissionless: anyone can create a vault and become its owner. Auto-registers new vaults as ClaimReceipt minters. |
| **ClaimReceipt** | Soulbound (non-transferable) ERC-721. Minted to insurers on claim trigger. Burned on exercise. Provides auditable settlement trail. |

### Verification Taxonomy

Policies are organized by HOW claims are verified, not WHAT they insure:

| Type | Verification | Trust Model | Claim Function |
|---|---|---|---|
| **On-chain** | Oracle price feed read by contract | Permissionless, trustless | `checkClaim(policyId)` -- anyone can call |
| **Oracle-dependent** | Third-party data feed | Automated, requires trusted reporter | `reportEvent(policyId)` -- oracle reporter only |
| **Off-chain** | Insurer-assessed, manual | Permissioned, not trustless | `submitClaim(policyId, amount)` -- insurer admin only |

This taxonomy honestly shows where blockchain adds trustless verification value (on-chain), where it adds automation (oracle-dependent), and where it provides transparency and liquidity without trustless verification (off-chain).

---

## Key Features

- **ERC-4626 vaults with insurance-native NAV**: `totalAssets = USDC.balanceOf(vault) - unearnedPremiums - pendingClaims - accruedFees`
- **Permissionless vault creation** -- anyone can deploy a vault strategy via VaultFactory
- **Three claim verification paths** -- permissionless (on-chain), oracle reporter, insurer admin
- **Auto-exercise claims** -- single-transaction settlement when vault has sufficient funds; ClaimReceipt minted and burned atomically
- **Soulbound ClaimReceipt (ERC-721)** -- non-transferable claim tokens for auditable settlement trail; receipt struct persists after burn for querying
- **Premium delegation** -- vault owners can authorize addresses to deposit premiums on behalf of insurers
- **Per-vault policy independence** -- the same policy in two vaults has independent premium deposits, coverage amounts, and claim state
- **Virtual share inflation protection** -- `_decimalsOffset = 12` bridges USDC 6 decimals to 18-decimal shares, preventing first-deposit attack
- **Time simulation for demo** -- `advanceTime()` on PolicyRegistry advances all vaults simultaneously for live demonstrations

---

## Demo Vaults

### 3 Policies

| ID | Name | Verification | Coverage | Premium (Rate) | Duration | Vaults | Trigger |
|---|---|---|---|---|---|---|---|
| P1 | BTC Price Protection | On-chain | $50,000 | $2,500 (5%) | 90 days | A + B | Permissionless: anyone calls `checkClaim()`, contract reads oracle price |
| P2 | Flight Delay | Oracle-dependent | $15,000 | $1,200 (8%) | 60 days | A + B | Oracle reporter calls `reportEvent()`, auto-triggers |
| P3 | Commercial Fire | Off-chain | $40,000 | $2,400 (6%) | 180 days | A only | Insurer admin calls `submitClaim(amount)`, permissioned |

P1 (BTC Protection) is in BOTH vaults. When BTC crashes, each vault reacts independently. Same event, different strategy, different impact. This IS the platform story.

### 2 Vaults

| Vault | Manager | Policies | Allocation | Buffer | Mgmt Fee | Strategy | Target APY |
|---|---|---|---|---|---|---|---|
| **Vault A: "Balanced Core"** | NextBlock Core Team | P1, P2, P3 | P1: 40%, P2: 20%, P3: 40% | 20% | 0.5% annual | Diversified across all verification types | 8-12% |
| **Vault B: "DeFi Alpha"** | AlphaRe Capital | P1, P2 | P1: 60%, P2: 40% | 15% | 1.0% annual | Automated-only, excludes off-chain | 10-14% |

Vault B deliberately excludes off-chain policies -- the vault manager's thesis is "only trust on-chain and oracle-verified claims." Different managers, different risk philosophies about verification trust.

---

## Deployed Contracts (Base Sepolia)

All contracts are deployed and verified on Base Sepolia.

| Contract | Address | Basescan |
|---|---|---|
| Admin (Deployer) | `0x35cE744bc6b5CE979fA3251b8008b64C35aa8505` | [View](https://sepolia.basescan.org/address/0x35cE744bc6b5CE979fA3251b8008b64C35aa8505) |
| MockUSDC | `0xD011bF408A804679C6733926A20cA6Dae2d4837b` | [View](https://sepolia.basescan.org/address/0xD011bF408A804679C6733926A20cA6Dae2d4837b) |
| MockOracle | `0x0e5f1dC0AAb5Dc3993200723cee24bD4D23a1308` | [View](https://sepolia.basescan.org/address/0x0e5f1dC0AAb5Dc3993200723cee24bD4D23a1308) |
| ClaimReceipt | `0xf9F87d030E7038382aC0fE4a9d9150744B15fD55` | [View](https://sepolia.basescan.org/address/0xf9F87d030E7038382aC0fE4a9d9150744B15fD55) |
| PolicyRegistry | `0x07B088adE0612E2CDE85f60ED8Cbeb552A4dcAED` | [View](https://sepolia.basescan.org/address/0x07B088adE0612E2CDE85f60ED8Cbeb552A4dcAED) |
| VaultFactory | `0xFfC5B0c4977ac151EA7bd4d4E77c8C93cF51B118` | [View](https://sepolia.basescan.org/address/0xFfC5B0c4977ac151EA7bd4d4E77c8C93cF51B118) |
| Vault A (Balanced Core) | `0x6F8BDb44048dC1D5509Ce7b5C8dEB85A99039379` | [View](https://sepolia.basescan.org/address/0x6F8BDb44048dC1D5509Ce7b5C8dEB85A99039379) |
| Vault B (DeFi Alpha) | `0xB1b10C0dfBc41d2d7d0321E3A9807409f4951a85` | [View](https://sepolia.basescan.org/address/0xB1b10C0dfBc41d2d7d0321E3A9807409f4951a85) |

---

## Tech Stack

### Smart Contracts

| Component | Version |
|---|---|
| Solidity | 0.8.24 |
| Foundry | Latest (forge, anvil, cast) |
| OpenZeppelin | v5.x (ERC4626, ERC721, ERC20, Ownable, ReentrancyGuard) |

### Frontend

| Component | Version |
|---|---|
| Next.js | 16 (App Router) |
| React | 19 |
| wagmi | v2 |
| viem | v2 |
| RainbowKit | v2 |
| TanStack Query | v5 |
| Tailwind CSS | v4 |
| TypeScript | 5.x (strict mode) |

### Chain

| Environment | Chain ID | RPC |
|---|---|---|
| Production (testnet) | Base Sepolia (84532) | `https://sepolia.base.org` |
| Local development | Anvil (31337) | `http://127.0.0.1:8545` |

---

## Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, anvil)
- [Node.js](https://nodejs.org/) 18+
- A wallet with Base Sepolia ETH (for testnet interaction)

### Smart Contracts

```bash
cd repo/contracts
forge build
forge test
```

To deploy locally with Anvil:

```bash
# Terminal 1: start local chain
anvil

# Terminal 2: deploy all contracts + demo data
forge script script/DemoSetup.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### Frontend

```bash
cd repo/frontend
npm install
npm run dev
```

The frontend auto-detects the connected chain (Anvil or Base Sepolia) and resolves contract addresses accordingly.

---

## Project Structure

```
repo/
  contracts/
    src/
      MockUSDC.sol            # ERC-20 mock stablecoin (6 decimals)
      MockOracle.sol          # BTC price + flight delay oracle
      PolicyRegistry.sol      # Policy data store + time management
      InsuranceVault.sol      # ERC-4626 vault with insurance NAV
      VaultFactory.sol        # Permissionless vault deployer
      ClaimReceipt.sol        # Soulbound ERC-721 claim tokens
    test/
      MockUSDC.t.sol
      MockOracle.t.sol
      PolicyRegistry.t.sol
      ClaimReceipt.t.sol
      InsuranceVault.t.sol
      VaultFactory.t.sol
      integration/
        FullFlow.t.sol        # End-to-end integration suite
    script/
      DemoSetup.s.sol         # 5-phase deployment script
    foundry.toml
  frontend/
    src/
      app/
        page.tsx              # Vault Discovery (home)
        vault/[address]/
          page.tsx            # Vault Detail
        admin/
          page.tsx            # Admin / Curator controls
      components/
        vault/                # VaultCard, PolicyRow, AllocationBar, YieldTicker
        deposit/              # DepositSidebar, AmountInput, ShareCalculation
        admin/                # TimeControls, OracleControls, ClaimTriggers
        shared/               # Header, VerificationBadge, StatusBadge
      hooks/
        useVaultData.ts       # Aggregated vault reads via multicall
        useVaultPolicies.ts   # Per-vault policy data
        useDepositFlow.ts     # Approve + deposit state machine
        useWithdrawFlow.ts    # Withdraw with buffer pre-check
        useClaimTrigger.ts    # Write hooks for 3 claim paths
        useClaimReceipts.ts   # Read ClaimReceipt NFTs
        useAddresses.ts       # Chain-aware contract address resolution
      config/
        contracts.ts          # ABIs + chain-aware address map
        chains.ts             # Anvil / Base Sepolia config
        wagmi.ts              # wagmi + RainbowKit setup
  docs/
    hackathon-prototype-design.md    # Product design document (V6)
    hackathon-technical-spec.md      # Technical specification
```

---

## Test Coverage

**130 tests across 7 test suites -- all passing.**

| Test Suite | Tests | Coverage |
|---|---|---|
| MockUSDC.t.sol | 6 | Mint, transfer, decimals, balances |
| MockOracle.t.sol | 11 | BTC price updates, flight status, access control, edge cases |
| PolicyRegistry.t.sol | 17 | Registration, activation, expiry, time management, access control |
| ClaimReceipt.t.sol | 16 | Minting, soulbound transfer blocking, exercise, burn, registrar role |
| InsuranceVault.t.sol | 57 | ERC-4626 compliance, NAV accounting, all 3 claim paths, fee accrual, premium delegation, auto-exercise, shortfall handling, buffer mechanics |
| VaultFactory.t.sol | 13 | Vault creation, auto-minter registration, parameter validation |
| FullFlow.t.sol (integration) | 10 | End-to-end flows: deposit, claim, exercise, multi-vault shared policy, time advancement, policy expiry |

Run with:

```bash
cd repo/contracts
forge test -vv
```

---

## Contract Interaction Overview

### Investor Flow

```
1. Approve USDC spend:    MockUSDC.approve(vault, amount)
2. Deposit:               InsuranceVault.deposit(amount, receiver)
3. Receive shares:        ERC-4626 mints share tokens
4. Monitor NAV:           InsuranceVault.totalAssets() reflects live NAV
5. Withdraw:              InsuranceVault.withdraw(amount, receiver, owner)
```

### Claim Flow (3 paths)

```
On-chain (permissionless):
  Anyone calls vault.checkClaim(policyId)
  -> Reads oracle price -> Validates trigger -> Mints ClaimReceipt -> Auto-exercises

Oracle-dependent (restricted):
  Oracle reporter calls vault.reportEvent(policyId)
  -> Reads flight status -> Validates trigger -> Mints ClaimReceipt -> Auto-exercises

Off-chain (restricted):
  Insurer admin calls vault.submitClaim(policyId, amount)
  -> Validates amount <= coverage -> Mints ClaimReceipt -> Auto-exercises
```

### NAV Formula

```
totalAssets() = USDC.balanceOf(vault)
              - totalUnearnedPremiums    (pro-rata linear decay over policy duration)
              - totalPendingClaims       (claims triggered but not yet exercised)
              - accruedFees              (management fee, time-weighted)

Floor: totalAssets() never reverts. Returns 0 if formula would go negative.
```

---

## License

MIT
