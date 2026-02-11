# NextBlock Hackathon -- Technical Specification

**Date**: February 5, 2026
**Source document**: `docs/product/hackathon-prototype-design.md` (V6)
**Status**: Build-ready -- all decisions confirmed

---

## Table of Contents

1. [Decisions -- All Confirmed](#1-decisions----all-confirmed)
2. [Open Questions](#2-open-questions)
3. [Tech Stack](#3-tech-stack)
4. [Smart Contract Architecture](#4-smart-contract-architecture)
5. [Entity Interaction Flows](#5-entity-interaction-flows)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Implementation Plan & Task Separation](#7-implementation-plan--task-separation)
8. [Test Plan](#8-test-plan)
9. [Security Concerns](#9-security-concerns)
10. [Recommended Agent Skills](#10-recommended-agent-skills)
11. [Implementation Risks](#11-implementation-risks)
12. [Day 4 Changes -- Buffer Visualization & Withdraw Cap](#12-day-4-changes----buffer-visualization--withdraw-cap-feb-7-2026)

---

## 1. Decisions -- All Confirmed

All architectural decisions have been confirmed by Alessandro before build start.

### D1: Claim Triggers Live on InsuranceVault -- CONFIRMED

All three claim trigger paths (`checkClaim`, `reportEvent`, `submitClaim`) are methods on `InsuranceVault`, all protected by `nonReentrant` (auto-exercise performs `safeTransfer` inside triggers). The vault reads policy data from PolicyRegistry and oracle data from MockOracle, then processes claims internally. PolicyRegistry is a pure data store.

### D2: Shared Policy Full Independence -- CONFIRMED

When P1 is in both vaults, each vault independently deposits its own premium ($2,500 each), backs its own coverage ($50,000 each), and processes its own claim (mints separate ClaimReceipts). Pull model -- no cross-vault coordination.

### D3: ClaimReceipt as Soulbound ERC-721 -- CONFIRMED

ClaimReceipt is a standalone **soulbound (non-transferable)** ERC-721 contract. Each receipt is a unique NFT with metadata: `policyId`, `claimAmount`, `vaultAddress`, `timestamp`, `exercised`. Transfers are blocked (override `_update` to revert on transfer). Only the original insurer can exercise. Transferability is a production feature (mentioned in pitch only).

```solidity
// Soulbound: block transfers, allow mint + burn
function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
    address from = _ownerOf(tokenId);
    if (from != address(0) && to != address(0)) {
        revert ClaimReceipt__NonTransferable();
    }
    return super._update(to, tokenId, auth);
}
```

**Exercise access control**: `exerciseClaim` validates `receipt.insurer == msg.sender` (not `ownerOf`, since non-transferable).

### D4: Two Wallets for Demo -- CONFIRMED

Two wallets: Wallet 1 = admin + vault managers + oracle reporter + insurer (all platform roles). Wallet 2 = investor only. One wallet switch during the demo to show the platform-vs-user separation. Both wallets must be funded with test ETH + MockUSDC in the deploy script.

---

## 2. Open Questions

### Critical (Must Resolve Before Build)

| #    | Question                                                                                                                          | Recommendation                                                                                                                                                                                                                                                                                                 | Owner |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| OQ-1 | Where does `timeOffset` live? Design doc 11.5.5 puts it on each vault. Marco recommends PolicyRegistry as single source of truth. | **PolicyRegistry** -- avoids time drift between vaults. One `advanceTime()` call advances all vaults simultaneously.                                                                                                                                                                                           | Marco |
| OQ-2 | Does `addPolicy` bundle the premium USDC transfer? Or are they two separate calls?                                                | **Separate calls**: `addPolicy(policyId, weight)` by vault manager, then `depositPremium(policyId, amount)` by owner or authorized premium depositor. Different roles, different calls. Cleaner separation of concerns. Deploy script batches them sequentially.                                                                               | Marco |
| OQ-3 | Where does `exerciseClaim` live? On ClaimReceipt or InsuranceVault?                                                               | **InsuranceVault**: `vault.exerciseClaim(receiptId)`. The vault holds the USDC and needs to update its internal accounting (`totalPendingClaims`, `totalDeployedCapital`). ClaimReceipt is a passive token.                                                                                                    | Marco |
| OQ-4 | How does `_accruedFees()` avoid circularity with `totalAssets()`?                                                                 | **Pre-fee basis**: Compute `preFeeAssets = balance - unearned - pending` first, then derive fees from that value. `fee = preFeeAssets * feeBps * elapsed / (10000 * 365 days)`. Slightly overcharges but negligible at 0.5-1% annual. Track `accumulatedFees` + `lastFeeTimestamp`, snapshot on state changes. | Marco |

### Important (Resolve During Build)

| #     | Question                                                                                                  | Recommendation                                                                                                                                                                                                                                   | Owner |
| ----- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| OQ-5  | Policy status per-vault or global?                                                                        | **Per-vault** via `VaultPolicy` struct. A policy can be ACTIVE in Vault A and CLAIMED in Vault B simultaneously. PolicyRegistry tracks global metadata only.                                                                                     | Marco |
| OQ-6  | What is `_decimalsOffset()` for virtual shares inflation protection?                                      | **12** (bridges the gap between USDC 6 decimals and share token 18 decimals). First deposit of $10K produces ~10,000 shares at ~$1.00/share. OZ 5.x ERC4626 handles this.                                                                        | Marco |
| OQ-7  | Should `advanceTime` on PolicyRegistry trigger lazy expiry checks?                                        | **No** -- keep PolicyRegistry as pure data. Vaults check expiry lazily on their next interaction (`_checkExpiredPolicies()` modifier).                                                                                                           | Marco |
| OQ-8  | How does the frontend get vault policy data? Individual reads or multicall?                               | **Multicall via wagmi's useReadContracts** for batch reads. Avoids N+1 query problem. TanStack Query handles caching.                                                                                                                            | Luca  |
| OQ-9  | NAV ticker -- real-time polling or client-side interpolation?                                             | **Hybrid**: Poll every 10s for base values. Client-side linear interpolation between polls for smooth NAV ticker. Premium accrual is deterministic (linear), so interpolation is accurate.                                                       | Luca  |
| OQ-10 | What happens to `totalDeployedCapital` when a claim reduces it below the vault's target deployment ratio? | **No automatic rebalancing**. Deployed capital decreases. Buffer ratio improves temporarily. Vault manager can manually adjust. For hackathon, this is cosmetic only.                                                                            | Marco |
| OQ-11 | Should `resetDemo()` be a contract function?                                                              | **No** -- use full re-deployment via `DemoSetup.s.sol` instead. In-contract reset has edge cases (orphaned ClaimReceipts, outstanding shares). Fresh deploy on Anvil takes <30s and guarantees clean state. Remove `resetDemo()` from contracts. | Marco |

### Nice-to-Have (Can Defer)

| #     | Question                                                | Notes                                                                                                    |
| ----- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| OQ-12 | Should the frontend show a transaction history log?     | Useful for demo but not critical. Could use event logs via `useWatchContractEvent`.                      |
| OQ-13 | Should share token have a custom name/symbol per vault? | Yes: "NextBlock Balanced Core" / "nxbBAL" and "NextBlock DeFi Alpha" / "nxbALPHA". Set via VaultFactory. |
| OQ-14 | Should `Create Vault` UI be functional or display-only? | If time permits, make it functional (calls VaultFactory). Otherwise, display existing vaults only.       |

---

## 3. Tech Stack

### Smart Contracts

| Component        | Version | Notes                                                            |
| ---------------- | ------- | ---------------------------------------------------------------- |
| **Solidity**     | 0.8.24+ | Stable, well-audited compiler version                            |
| **Foundry**      | Latest  | forge (build/test), anvil (local chain), cast (CLI interactions) |
| **OpenZeppelin** | v5.5.0  | ERC4626, ERC721, ERC20, Ownable, ReentrancyGuard                 |
| **forge-std**    | Latest  | Test utilities, console.log, vm cheatcodes                       |

**Project structure**:

```
contracts/
  src/
    MockUSDC.sol
    MockOracle.sol
    PolicyRegistry.sol
    InsuranceVault.sol
    VaultFactory.sol
    ClaimReceipt.sol
  test/
    MockUSDC.t.sol
    MockOracle.t.sol
    PolicyRegistry.t.sol
    ClaimReceipt.t.sol
    InsuranceVault.t.sol
    VaultFactory.t.sol
    integration/
      FullFlow.t.sol
  script/
    DemoSetup.s.sol
  foundry.toml
```

### Frontend

| Component          | Version             | Notes                                                                   |
| ------------------ | ------------------- | ----------------------------------------------------------------------- |
| **Next.js**        | 16.1.6 (App Router) | Server components for static content, client for wallet interaction     |
| **React**          | 19.2.3              | Latest stable                                                           |
| **wagmi**          | v2                  | React hooks for Ethereum: useReadContract, useWriteContract, useAccount |
| **viem**           | v2                  | Low-level Ethereum client, used by wagmi internally                     |
| **RainbowKit**     | v2                  | Wallet connection modal (MetaMask, WalletConnect)                       |
| **Tailwind CSS**   | v4                  | Utility-first styling                                                   |
| **TanStack Query** | v5                  | Cache layer for contract reads (managed by wagmi)                       |
| **TypeScript**     | 5.x                 | Strict mode                                                             |

**Project structure**:

```
frontend/
  src/
    app/
      layout.tsx          # Root layout, imports Providers
      page.tsx            # Vault Discovery (home)
      vault/
        [address]/
          page.tsx        # Vault Detail
      admin/
        page.tsx          # Admin / Curator
    components/
      vault/
        VaultCard.tsx
        PolicyRow.tsx
        AllocationBar.tsx
        YieldTicker.tsx
        BufferVisualization.tsx
      deposit/
        DepositSidebar.tsx
        AmountInput.tsx
        ShareCalculation.tsx
      admin/
        TimeControls.tsx
        OracleControls.tsx
        ClaimTriggers.tsx
        ClaimReceipts.tsx
        DemoControls.tsx
        PolicyPool.tsx
      shared/
        VerificationBadge.tsx
        StatusBadge.tsx
        WalletRoleIndicator.tsx
        Header.tsx
        WalletButton.tsx
        Providers.tsx
    hooks/
      useVaultData.ts       # Aggregates vault reads via multicall + USDC helpers
      useVaultPolicies.ts   # Reads policy data for a vault
      usePolicyRegistry.ts  # Reads global policy data + time
      useDepositFlow.ts     # Approve + deposit state machine
      useWithdrawFlow.ts    # Withdraw state machine (maxWithdraw pre-check)
      useClaimTrigger.ts    # Write hooks for 3 claim paths
      useClaimReceipts.ts   # Read receipts by iterating 0..nextReceiptId
      useTimeControls.ts    # Admin: time, oracle, and USDC mint controls
    config/
      contracts.ts          # ABIs + deployed addresses
      chains.ts             # Chain config (Anvil / Base Sepolia)
      constants.ts          # Formatting, decimals, verification config
      wagmi.ts              # wagmi + RainbowKit configuration
    lib/
      formatting.ts         # formatUSDC, formatSharePrice, formatAPY, + helpers
  public/
  postcss.config.mjs
  next.config.ts
  tsconfig.json
  package.json
```

### Design Tokens

| Token               | Value               | Usage                                                              |
| ------------------- | ------------------- | ------------------------------------------------------------------ |
| **On-chain** color  | Emerald (`#10B981`) | P1 BTC Protection badge, verification labels                       |
| **Oracle** color    | Amber (`#F59E0B`)   | P2 Flight Delay badge                                              |
| **Off-chain** color | Slate (`#64748B`)   | P3 Commercial Fire badge                                           |
| **Active** status   | Green               | Policy active                                                      |
| **Claimed** status  | Red                 | Policy claimed                                                     |
| **Expired** status  | Gray                | Policy expired                                                     |
| **Font**            | System font stack   | Monospace for numbers (Inter not imported due to DNS restrictions) |

---

## 4. Smart Contract Architecture

### 4.1 Contract Dependency Graph

```
MockUSDC (standalone)          MockOracle (standalone)
    |                               |
    |                               |  (read by InsuranceVault for claim triggers)
    v                               v
PolicyRegistry (standalone -- time management + policy data store)
    |
    v  (read by InsuranceVault for policy data + currentTime())
InsuranceVault (reads PolicyRegistry + MockOracle, holds MockUSDC, mints ClaimReceipt)
    ^
    |
VaultFactory (deploys InsuranceVault instances, auto-registers minters via registrar role)
    |
ClaimReceipt (ERC-721, minted by InsuranceVault, burned on exercise)
```

### 4.2 Contract Interfaces

#### MockUSDC

```solidity
// ERC20 with mint function for demo
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external;  // No access control for demo
}
```

#### MockOracle

```solidity
contract MockOracle is Ownable {
    int256 public btcPrice;             // 8 decimals, int256 (Chainlink convention)
    bool public flightDelayed;          // Simple boolean for flight delay
    uint256 public lastBtcUpdate;       // timestamp of last BTC update
    uint256 public lastFlightUpdate;    // timestamp of last flight update
    // Constructor initializes: btcPrice = 85000e8, flightDelayed = false
    // checkClaim should verify updatedAt > 0 to prevent false triggers on uninitialized oracle

    function setBtcPrice(int256 price) external onlyOwner;
    function setFlightStatus(bool delayed) external onlyOwner;
    function getBtcPrice() external view returns (int256 price, uint256 updatedAt);
    function getFlightStatus() external view returns (bool delayed, uint256 updatedAt);
}
```

**Custom errors**: `MockOracle__InvalidPrice()`
**Events**: `BtcPriceUpdated(int256 price)`, `FlightStatusUpdated(bool delayed)`

#### PolicyRegistry

```solidity
contract PolicyRegistry is Ownable {
    enum VerificationType { ON_CHAIN, ORACLE_DEPENDENT, OFF_CHAIN }
    enum PolicyStatus { REGISTERED, ACTIVE, CLAIMED, EXPIRED }

    struct Policy {
        uint256 id;
        string name;
        VerificationType verificationType;
        uint256 coverageAmount;     // USDC 6 decimals
        uint256 premiumAmount;      // USDC 6 decimals
        uint256 duration;           // seconds
        uint256 startTime;          // set on activatePolicy()
        address insurer;            // receives ClaimReceipt on claim
        int256 triggerThreshold;    // ON_CHAIN: BTC price (8 dec). Others: unused.
        PolicyStatus status;
    }

    // Time management (single source of truth for all contracts)
    uint256 public timeOffset;
    function currentTime() public view returns (uint256);
    function advanceTime(uint256 secondsToAdd) external onlyOwner;

    // Policy lifecycle (two-step: register then activate)
    function registerPolicy(...) external onlyOwner returns (uint256 policyId);
    function activatePolicy(uint256 policyId) external onlyOwner;  // sets startTime
    function getPolicy(uint256 policyId) external view returns (Policy memory);
    function getPolicyCount() external view returns (uint256);
    function isPolicyExpired(uint256 policyId) public view returns (bool);
    function getRemainingDuration(uint256 policyId) public view returns (uint256);

    // Demo reset: use full re-deployment via DemoSetup.s.sol (no in-contract reset)
}
```

**Custom errors**: `PolicyRegistry__PolicyNotFound(uint256 policyId)`, `PolicyRegistry__InvalidStatus(uint256 policyId)`, `PolicyRegistry__InvalidParams()`
**Events**: `PolicyRegistered(uint256 indexed policyId, string name)`, `PolicyActivated(uint256 indexed policyId, uint256 startTime)`, `TimeAdvanced(uint256 newTimestamp, uint256 secondsAdded)`

Note: Policy IDs start from 0 (first registered policy has ID 0). `getPolicyCount()` returns `nextPolicyId`.

#### InsuranceVault (the critical contract)

```solidity
contract InsuranceVault is ERC4626, Ownable, ReentrancyGuard {
    struct VaultPolicy {
        uint256 policyId;           // Reference to PolicyRegistry
        uint256 allocationWeight;   // Basis points (sum must = 10000)
        uint256 premiumDeposited;   // Actual USDC deposited for this policy
        uint256 coverageAmount;     // This vault's coverage for this policy
        bool claimed;               // Per-vault claim status
        uint256 claimAmount;        // Amount claimed (0 if not claimed)
    }

    // State
    uint256[] public policyIds;
    mapping(uint256 => VaultPolicy) public vaultPolicies;
    mapping(uint256 => bool) public policyAdded;  // tracks which policies are in this vault
    uint256 public totalAllocationWeight; // Must equal 10000 when finalized
    uint256 public totalPendingClaims;
    uint256 public totalDeployedCapital;  // Accounting-only
    uint256 public bufferRatioBps;        // 2000 = 20%, 1500 = 15%
    uint256 public managementFeeBps;      // 50 = 0.5%, 100 = 1%
    uint256 public accumulatedFees;       // Fees accrued but not yet withdrawn
    uint256 public lastFeeTimestamp;
    string public vaultName;
    address public vaultManager;
    address public oracleReporter;        // oracle reporter role
    address public insurerAdmin;          // insurer admin role

    // References
    PolicyRegistry public registry;
    ClaimReceipt public claimReceipt;
    MockOracle public oracle;             // oracle reference

    // Core ERC4626 overrides (5 functions)
    function totalAssets() public view override returns (uint256);     // Custom NAV formula
    function maxWithdraw(address owner) public view override returns (uint256);  // Buffer cap
    function maxRedeem(address owner) public view override returns (uint256);    // Buffer cap (shares)
    function _deposit(...) internal override;   // Update totalDeployedCapital accounting
    function _withdraw(...) internal override;  // Validate buffer, update accounting
    function _decimalsOffset() internal pure override returns (uint8) { return 12; }
    // Note: deposit(), mint(), withdraw(), redeem() use OZ defaults (they call our overrides)
    // Note: convertToShares(), convertToAssets(), preview*() use OZ defaults (they use our totalAssets)

    // Policy management
    function addPolicy(uint256 policyId, uint256 weightBps) external;   // onlyVaultManager
    function depositPremium(uint256 policyId, uint256 amount) external; // owner or authorizedPremiumDepositor, calls transferFrom

    // Premium depositor delegation
    mapping(address => bool) public authorizedPremiumDepositors;
    function setAuthorizedPremiumDepositor(address depositor, bool authorized) external; // onlyOwner

    // Claim triggers (3 distinct paths) -- all nonReentrant (auto-exercise does safeTransfer)
    function checkClaim(uint256 policyId) external nonReentrant;        // Permissionless (P1)
    function reportEvent(uint256 policyId) external nonReentrant;       // onlyOracleReporter (P2)
    function submitClaim(uint256 policyId, uint256 amount) external nonReentrant; // onlyInsurerAdmin (P3)

    // Claim settlement (fallback for shortfall cases only)
    function exerciseClaim(uint256 receiptId) external nonReentrant;
    // Caller must be receipt.insurer (soulbound NFT -- non-transferable)

    // Role management
    function setOracleReporter(address reporter) external;  // onlyOwner
    function setInsurerAdmin(address admin) external;       // onlyOwner

    // Fee management
    function claimFees(address recipient) external;         // onlyOwner

    // Internal helpers
    function _totalUnearnedPremiums() internal view returns (uint256);
    function _accruedFees(uint256 preFeeAssets) internal view returns (uint256);
    function _availableBuffer() internal view returns (uint256);
    function _accrueFeesInternal() internal;
    function _checkExpiredPolicies() internal;  // Modifier on state-changing functions ONLY (not view functions)
    function _earnedPremiumFor(uint256 policyId, VaultPolicy memory vp) internal view returns (uint256);
    function _validateClaimPreconditions(uint256 policyId) internal view returns (VaultPolicy storage);

    // Frontend view helpers (aggregated getters to reduce RPC calls)
    function getVaultInfo() external view returns (
        string memory name, address manager, uint256 assets, uint256 shares,
        uint256 sharePrice, uint256 bufferBps, uint256 feeBps,
        uint256 availableBuffer, uint256 deployedCapital, uint256 policyCount
    );
    function getVaultPolicy(uint256 policyId) external view returns (
        uint256 allocationWeight, uint256 premium, uint256 earnedPremium,
        uint256 coverage, uint256 duration, uint256 startTime,
        uint256 timeRemaining, bool claimed, bool expired
    );
    function getPolicyIds() external view returns (uint256[] memory);

    // Demo reset: use full re-deployment via DemoSetup.s.sol (no in-contract reset)
}
```

**Custom errors** (gas-efficient, replaces require strings):

```solidity
error InsuranceVault__PolicyNotActive(uint256 policyId);
error InsuranceVault__PolicyAlreadyAdded(uint256 policyId);
error InsuranceVault__PolicyNotInVault(uint256 policyId);
error InsuranceVault__PolicyAlreadyClaimed(uint256 policyId);
error InsuranceVault__InsufficientBuffer(uint256 requested, uint256 available);
error InsuranceVault__UnauthorizedCaller(address caller);
error InsuranceVault__InvalidClaimAmount(uint256 amount, uint256 maxAllowed);
error InsuranceVault__WrongVerificationType(uint256 policyId);
error InsuranceVault__OracleConditionNotMet(uint256 policyId);
error InsuranceVault__InvalidReceipt(uint256 receiptId);
error InsuranceVault__InvalidParams();
error InsuranceVault__NoFeesToClaim();
error InsuranceVault__ClaimShortfall(uint256 receiptId, uint256 claimAmount, uint256 vaultBalance);
```

#### VaultFactory

```solidity
contract VaultFactory {
    // Infrastructure addresses (set once at deployment, shared by all vaults)
    address public immutable asset;           // MockUSDC
    address public immutable policyRegistry;
    address public immutable oracle;
    address public immutable claimReceiptAddr;

    address[] public deployedVaults;
    mapping(address => bool) public isVault;

    constructor(address asset_, address policyRegistry_, address oracle_, address claimReceipt_);

    // Vault-specific params only -- infrastructure is hardcoded
    // PERMISSIONLESS: anyone can create a vault. msg.sender becomes vault owner.
    function createVault(
        string memory name,         // share token name, e.g. "NextBlock Balanced Core"
        string memory symbol,       // share token symbol, e.g. "nxbBAL"
        string memory vaultName,    // display name
        address vaultManager,
        uint256 bufferRatioBps,
        uint256 managementFeeBps
    ) external returns (address vault);
    // NOTE: Factory auto-registers the new vault as an authorized minter in ClaimReceipt
    // (factory must be set as registrar on ClaimReceipt via setRegistrar).
    // msg.sender becomes the vault owner (not factory owner).

    function getVaults() external view returns (address[] memory);
    function getVaultCount() external view returns (uint256);
}
```

#### ClaimReceipt

```solidity
contract ClaimReceipt is ERC721, Ownable {
    struct Receipt {
        uint256 policyId;
        uint256 claimAmount;
        address vault;
        address insurer;
        uint256 timestamp;
        bool exercised;
    }

    uint256 public nextReceiptId;
    mapping(uint256 => Receipt) public receipts;

    // Only callable by registered vaults
    function mint(
        address insurer,
        uint256 policyId,
        uint256 claimAmount,
        address vault
    ) external returns (uint256 receiptId);

    // Only callable by the vault that issued it (receipt.vault == msg.sender)
    // Sets exercised=true in Receipt struct, then burns the NFT
    // getReceipt() still works after burn (mapping persists in storage)
    function markExercised(uint256 receiptId) external;

    function getReceipt(uint256 receiptId) external view returns (Receipt memory);
}
```

**Token name/symbol**: `"NextBlock Claim Receipt"` / `"NXBCR"`

**Authorization**: `mapping(address => bool) public authorizedMinters` -- maintained by owner via `setAuthorizedMinter(address, bool)`.

**Registrar role**: `address public registrar` -- a single address (typically VaultFactory) that can ADD authorized minters but cannot revoke them. Owner retains full add/revoke control. Set via `setRegistrar(address)` (onlyOwner).

**Custom errors**: `ClaimReceipt__UnauthorizedMinter(address caller)`, `ClaimReceipt__NonTransferable()`, `ClaimReceipt__AlreadyExercised(uint256 receiptId)`, `ClaimReceipt__ReceiptNotFound(uint256 receiptId)`, `ClaimReceipt__OnlyIssuingVault(uint256 receiptId, address caller, address vault)`, `ClaimReceipt__UnauthorizedRegistrar(address caller)`

**Events**: `MinterUpdated(address indexed minter, bool authorized)`, `ReceiptMinted(uint256 indexed receiptId, address indexed insurer, uint256 policyId, uint256 claimAmount, address vault)`, `ReceiptExercised(uint256 indexed receiptId)`, `RegistrarUpdated(address indexed registrar)`

### 4.3 Key Implementation Details

#### totalAssets() Implementation

```solidity
function totalAssets() public view override returns (uint256) {
    uint256 balance = IERC20(asset()).balanceOf(address(this));
    uint256 unearned = _totalUnearnedPremiums();
    uint256 pending = totalPendingClaims;

    // Compute pre-fee assets first to break circularity
    uint256 preFeeAssets;
    if (balance > unearned + pending) {
        preFeeAssets = balance - unearned - pending;
    } else {
        return 0;  // Floor at zero, never revert
    }

    uint256 fees = _accruedFees(preFeeAssets);
    if (preFeeAssets > fees) {
        return preFeeAssets - fees;
    }
    return 0;
}
```

**Walkthrough with numbers** (Vault A, day 30):

```
USDC.balanceOf(vault) = $90,000 (investors) + $6,100 (premiums) = $96,100
_totalUnearnedPremiums():
  P1: $2,500 * (90-30)/90 = $1,667
  P2: $1,200 * (60-30)/60 = $600
  P3: $2,400 * (180-30)/180 = $2,000
  Total: $4,267
totalPendingClaims = $0 (no claims yet)
_accruedFees() = 0.005 * $91,833 * 30/365 = $37.67

totalAssets = $96,100 - $4,267 - $0 - $37.67 = $91,795
Share price = $91,795 / 90,000 shares = $1.0199
```

#### Fee Circularity Fix

The problem: `totalAssets()` depends on `_accruedFees()`, but fees depend on `totalAssets()`.

Solution: Pre-fee basis computation. In `totalAssets()`, compute `preFeeAssets = balance - unearned - pending` first, then derive fees from that value. The `_accruedFees(preFeeAssets)` function receives the pre-fee basis as a parameter.

```solidity
uint256 public accumulatedFees;   // Fees accrued but not yet withdrawn
uint256 public lastFeeTimestamp;

function _accruedFees(uint256 preFeeAssets) internal view returns (uint256) {
    uint256 elapsed = policyRegistry.currentTime() - lastFeeTimestamp;
    uint256 newFees = preFeeAssets * managementFeeBps * elapsed / (BASIS_POINTS * SECONDS_PER_YEAR);
    return accumulatedFees + newFees;
}

function _accrueFeesInternal() internal {
    // Called on every state-changing operation (deposit, withdraw, claim, depositPremium)
    // NOTE: lastFeeTimestamp MUST be initialized to policyRegistry.currentTime() in the constructor
    uint256 balance = IERC20(asset()).balanceOf(address(this));
    uint256 unearned = _totalUnearnedPremiums();
    uint256 pending = totalPendingClaims;
    uint256 preFeeAssets = balance > unearned + pending ? balance - unearned - pending : 0;

    uint256 elapsed = policyRegistry.currentTime() - lastFeeTimestamp;
    accumulatedFees += preFeeAssets * managementFeeBps * elapsed / (BASIS_POINTS * SECONDS_PER_YEAR);
    lastFeeTimestamp = policyRegistry.currentTime();
}
```

#### Claimed Policy Premium Handling

When a claim triggers, premium accrual STOPS. The unearned premium for a claimed policy is set to 0 (the premium is considered consumed by the claim event). In `_totalUnearnedPremiums()`, if `vaultPolicies[policyId].claimed == true`, that policy contributes 0 to unearned premiums. This is consistent with the design doc ("premium accrual stops on claim").

#### P3 Partial Claim: Single Claim Consumes Policy

For P3 (off-chain), the insurer can submit a partial amount (e.g., $35K of $40K coverage). However, the policy is **fully consumed** by a single claim event: `claimed = true`, remaining $5K coverage is forfeited. No multi-claim support for the hackathon. This keeps the `claimed` boolean simple -- no need for `totalClaimedAmount` tracking.

#### Shared Policy Pull Model

When P1 is added to both vaults:

```
// Step 1: Vault manager adds policy
Vault A: addPolicy(P1, 4000)  // 40% weight
Vault B: addPolicy(P1, 6000)  // 60% weight

// Step 2: Admin deposits premium (separate call per vault)
Vault A: depositPremium(P1, 2_500_000)  // $2,500 premium
Vault B: depositPremium(P1, 2_500_000)  // $2,500 premium

// Each vault stores its own VaultPolicy with independent state
// Each vault backs $50,000 coverage independently
// When BTC crashes: each vault triggers independently, mints separate ClaimReceipts
// Demo admin panel fires checkClaim on BOTH vaults with one button for the "same claim, different impact" visual
```

### 4.4 Deployment Order

```
Phase 1: Deploy standalone contracts
  1. Deploy MockUSDC
  2. Deploy MockOracle
  3. Deploy ClaimReceipt
  4. Deploy PolicyRegistry

Phase 2: Deploy factory + vaults
  5. Deploy VaultFactory(MockUSDC, PolicyRegistry, MockOracle, ClaimReceipt)
  6. ClaimReceipt.setRegistrar(address(factory))  // factory can auto-register minters
  7. Create Vault A via factory (bufferRatio=2000, fee=50)  // factory auto-registers vault as minter
  8. Create Vault B via factory (bufferRatio=1500, fee=100) // factory auto-registers vault as minter

Phase 3: Register policies (two-step: register then activate)
  10. PolicyRegistry.registerPolicy(P1: BTC, ON_CHAIN, $50K, $2.5K, 90d, threshold=80000e8)
  11. PolicyRegistry.registerPolicy(P2: Flight, ORACLE_DEPENDENT, $15K, $1.2K, 60d)
  12. PolicyRegistry.registerPolicy(P3: Fire, OFF_CHAIN, $40K, $2.4K, 180d)
  13. PolicyRegistry.activatePolicy(P1), activatePolicy(P2), activatePolicy(P3)

Phase 4: Add policies to vaults + deposit premiums
  14. Vault A: addPolicy(P1, 4000), addPolicy(P2, 2000), addPolicy(P3, 4000)
  15. Vault B: addPolicy(P1, 6000), addPolicy(P2, 4000)
  16. Admin approves USDC to vaults
  17. Vault A: depositPremium(P1, $2.5K), depositPremium(P2, $1.2K), depositPremium(P3, $2.4K)
  18. Vault B: depositPremium(P1, $2.5K), depositPremium(P2, $1.2K)

Phase 5: Setup demo state
  19. Set initial BTC price in MockOracle (85000e8 = $85,000)
  20. Set flightDelayed = false
  21. Mint MockUSDC to demo investor address
  22. Set roles: setOracleReporter, setInsurerAdmin on each vault
  23. Investor deposits into Vault A and Vault B
```

### 4.5 Key Solidity Events

```
// InsuranceVault events:
event PolicyAdded(uint256 indexed policyId, uint256 allocationWeight);
event PremiumDeposited(uint256 indexed policyId, uint256 amount);
event ClaimTriggered(uint256 indexed policyId, uint256 amount, address insurer, uint256 receiptId);
event ClaimExercised(uint256 indexed receiptId, uint256 amount, address insurer);
event ClaimAutoExercised(uint256 indexed receiptId, uint256 payout, address insurer);
event ClaimShortfall(uint256 indexed receiptId, uint256 claimAmount, uint256 vaultBalance);
event PolicyExpired(uint256 indexed policyId);
event FeesCollected(address indexed recipient, uint256 amount);
event OracleReporterUpdated(address indexed reporter);
event InsurerAdminUpdated(address indexed admin);
event PremiumDepositorUpdated(address indexed depositor, bool authorized);

// PolicyRegistry events:
event PolicyRegistered(uint256 indexed policyId, string name);
event PolicyActivated(uint256 indexed policyId, uint256 startTime);
event TimeAdvanced(uint256 newTimestamp, uint256 secondsAdded);

// ClaimReceipt events:
event MinterUpdated(address indexed minter, bool authorized);
event RegistrarUpdated(address indexed registrar);
event ReceiptMinted(uint256 indexed receiptId, address indexed insurer, uint256 policyId, uint256 claimAmount, address vault);
event ReceiptExercised(uint256 indexed receiptId);

// Note: ERC-4626 standard Deposit/Withdraw events are emitted by OpenZeppelin, not custom events.
```

---

## 5. Entity Interaction Flows

This section maps every entity to their actions, the exact contract calls behind each action, and which frontend page triggers them. One wallet holds all roles for the hackathon (D4), but flows are documented per-entity for correct UX separation.

### 5.1 Entity Summary

| Entity              | Goal                                 | Contract Role                      | Frontend Context                  |
| ------------------- | ------------------------------------ | ---------------------------------- | --------------------------------- |
| **Investor**        | Deposit, earn yield, withdraw        | Public (no special role)           | Discovery, Detail, Modal          |
| **Vault Manager**   | Curate policies, set allocations     | `vaultManager` on InsuranceVault   | Admin (vault mgmt section)        |
| **Insurer**         | Receive claim payouts via receipts   | `insurerAdmin` on InsuranceVault   | Admin (claim triggers + receipts) |
| **Protocol Admin**  | Deploy, register, fund, control time | `owner` on all contracts           | Admin (all sections)              |
| **Oracle Reporter** | Report oracle-dependent events (P2)  | `oracleReporter` on InsuranceVault | Admin (claim triggers)            |

### 5.2 Entity-Action Matrix (Access Control Reference)

```
                        | Admin | Vault Mgr | Oracle Rpt | Insurer | Investor | Anyone
========================|=======|===========|============|=========|==========|========
PolicyRegistry          |       |           |            |         |          |
  registerPolicy        |   X   |           |            |         |          |
  activatePolicy        |   X   |           |            |         |          |
  advanceTime           |   X   |           |            |         |          |
  currentTime (read)    |   X   |     X     |     X      |    X    |    X     |   X
------------------------+-------+-----------+------------+---------+----------+--------
MockOracle              |       |           |            |         |          |
  setBtcPrice           |   X   |           |            |         |          |
  setFlightStatus       |   X   |           |            |         |          |
  get* (reads)          |   X   |     X     |     X      |    X    |    X     |   X
------------------------+-------+-----------+------------+---------+----------+--------
InsuranceVault          |       |           |            |         |          |
  addPolicy             |       |     X     |            |         |          |
  depositPremium        |   X   |           |            |         |          |  (+ authorizedPremiumDepositors)
  setOracleReporter     |   X   |           |            |         |          |
  setInsurerAdmin       |   X   |           |            |         |          |
  checkClaim (P1)       |   X   |     X     |     X      |    X    |    X     |   X
  reportEvent (P2)      |       |           |     X      |         |          |
  submitClaim (P3)      |       |           |            |    X    |          |
  exerciseClaim         |       |           |            |    X    |          |
  deposit / withdraw    |   X   |     X     |     X      |    X    |    X     |   X
------------------------+-------+-----------+------------+---------+----------+--------
ClaimReceipt            |       |           |            |         |          |
  setRegistrar          |   X   |           |            |         |          |
  setAuthorizedMinter   |   X   | (registrar can ADD only) |         |          |
  mint / markExercised  | (only callable by authorized InsuranceVault contracts)  |
  getReceipt (read)     |   X   |     X     |     X      |    X    |    X     |   X

exerciseClaim = callable only by receipt.insurer (soulbound NFT, non-transferable)
```

### 5.3 Investor Flow: Deposit -> Earn -> Withdraw

The investor never triggers claims -- claims are triggered by the insurer, oracle reporter, or anyone (P1). The investor only deposits, observes yield, and withdraws. If a claim happens, the investor sees the impact via NAV drop on the Detail page (passive observation, not an action).

```
ACTION          PAGE / COMPONENT                 CONTRACT CALLS                        STATE CHANGES
------          ----------------                 --------------                        -------------
DISCOVER        Vault Discovery (/)              factory.getVaults()                   (read only)
                VaultCard                        vault.getVaultInfo() per vault

EVALUATE        Vault Detail (/vault/[addr])     vault.getVaultInfo()                  (read only)
                PolicyTable, AllocationBar       vault.getPolicyIds()
                                                 vault.getVaultPolicy(id) per policy
                                                 registry.getPolicy(id) per policy

DEPOSIT         DepositSidebar                     Step 1: USDC.approve(vault, amount)   allowance set
                State: IDLE->APPROVING->         Step 2: vault.deposit(amount, user)   shares minted
                APPROVED->DEPOSITING->SUCCESS                                          totalDeployedCapital ↑
                ShareCalculation component       Read: vault.previewDeposit(amount)

EARN            Vault Detail (auto-refresh)      vault.totalAssets() polled 10s        (observe NAV ↑)
(observe)       YieldTicker                      Client-side interpolation 1s          premiums earn linearly

WITHDRAW        DepositSidebar (Withdraw tab)      vault.maxWithdraw(user)               shares burned
                AmountInput capped at buffer     vault.withdraw(amt, user, user)       USDC transferred
```

Note: If a claim triggers while the investor holds shares, they observe the impact passively on the Detail page -- PolicyRow shows CLAIMED badge, NAV drops, share price decreases. The investor's only action is deciding whether to withdraw at the reduced NAV or hold for recovery from remaining policy premiums. See Section 5.6 (Insurer Flow) for who actually triggers and exercises claims.

### 5.4 Protocol Admin Flow: Deploy -> Configure -> Operate -> Reset

```
ACTION          PAGE / COMPONENT                 CONTRACT CALLS                        STATE CHANGES
------          ----------------                 --------------                        -------------
DEPLOY          (deploy script)                  Deploy 6 contracts (Section 4.4)      Contracts live
                                                 claimReceipt.setRegistrar(factory)    Factory can register minters
                                                 factory.createVault() x2              2 vaults (auto-registered as minters)

REGISTER        Admin (/admin)                   registry.registerPolicy(              3 policies created
POLICIES        PolicyPool section                 P1: BTC, ON_CHAIN, $50K, $2.5K,     Status: REGISTERED
                                                   90d, threshold=80000e8)
                                                 registry.registerPolicy(
                                                   P2: Flight, ORACLE, $15K, $1.2K, 60d)
                                                 registry.registerPolicy(
                                                   P3: Fire, OFF_CHAIN, $40K, $2.4K, 180d)

ACTIVATE        Admin (/admin)                   registry.activatePolicy(1)            Status -> ACTIVE
                PolicyPool section               registry.activatePolicy(2)            startTime set
                                                 registry.activatePolicy(3)

FUND            Admin (/admin)                   USDC.approve(vaultA, total)           Allowance set
PREMIUMS                                         vaultA.depositPremium(1, $2.5K)       USDC -> vault
                                                 vaultA.depositPremium(2, $1.2K)       premiumDeposited updated
                                                 vaultA.depositPremium(3, $2.4K)
                                                 USDC.approve(vaultB, total)
                                                 vaultB.depositPremium(1, $2.5K)
                                                 vaultB.depositPremium(2, $1.2K)

SET ROLES       Admin (/admin)                   vaultA.setOracleReporter(addr)        Roles assigned
                                                 vaultA.setInsurerAdmin(addr)
                                                 vaultB.setOracleReporter(addr)
                                                 vaultB.setInsurerAdmin(addr)

SET ORACLE      Admin (/admin)                   oracle.setBtcPrice(85000e8)           Oracle initialized
                OracleControls                   oracle.setFlightStatus(false)

MINT USDC       Admin (/admin)                   MockUSDC.mint(investor, $50K)         Investor funded
                DemoControls

ADVANCE         Admin (/admin)                   registry.advanceTime(seconds)         timeOffset ↑
TIME            TimeControls                                                           Premiums earn
                                                                                      Fees accrue

RESET           Admin (/admin)                   Re-deploy via DemoSetup.s.sol          All state cleared
                DemoControls                     (<30s on Anvil, fresh contracts)       Clean slate
```

### 5.5 Vault Manager Flow: Curate -> Allocate -> Monitor

```
ACTION          PAGE / COMPONENT                 CONTRACT CALLS                        STATE CHANGES
------          ----------------                 --------------                        -------------
ADD             Admin (/admin)                   vault.addPolicy(policyId, weightBps)  VaultPolicy created
POLICIES        VaultManagement section                                                totalAllocationWeight ↑
                                                 Vault A: addPolicy(1, 4000)           P1 40%
                                                          addPolicy(2, 2000)           P2 20%
                                                          addPolicy(3, 4000)           P3 40%
                                                 Vault B: addPolicy(1, 6000)           P1 60%
                                                          addPolicy(2, 4000)           P2 40%

REVIEW          Vault Detail (/vault/[addr])     vault.getVaultInfo()                  (read only)
ALLOCATION      AllocationBar                    vault.getPolicyIds()
                                                 vault.getVaultPolicy(id) per policy

MONITOR         Vault Detail (/vault/[addr])     vault.totalAssets() polled 10s        (observe NAV)
PERFORMANCE     YieldTicker, BufferViz           vault.getVaultInfo()
```

Note: For the hackathon, vault creation and policy curation happen in the deploy script. The vault manager role is demonstrated by the `onlyVaultManager` access control on `addPolicy`. The admin page displays vault composition as read-only.

### 5.6 Insurer Flow: Receive Receipt -> Exercise -> Collect USDC

```
ACTION          PAGE / COMPONENT                 CONTRACT CALLS                        STATE CHANGES
------          ----------------                 --------------                        -------------
SUBMIT          Admin (/admin)                   vault.submitClaim(policyId, amount)   policy CLAIMED
CLAIM (P3)      ClaimTriggers section                                                  pendingClaims ↑
                                                                                      ClaimReceipt minted
                                                                                      NAV drops

RECEIVE         (passive -- triggered by         claimReceipt.mint(insurer, ...)       Receipt minted
RECEIPT         checkClaim or reportEvent)                                             to insurer address

VIEW            Admin (/admin)                   claimReceipt.getReceipt(id)           (read only)
RECEIPTS        ClaimReceipts section             per outstanding receipt

EXERCISE        (auto at trigger time, or        vault.exerciseClaim(receiptId)        pendingClaims ↓
CLAIM           Admin if shortfall)               -> validates receipt.insurer ==      receipt burned
                ClaimReceipts [Exercise] btn        msg.sender (soulbound)             USDC -> insurer
                (only needed for shortfall)                                            NAV: net zero

CHECK           Discovery or Detail              vault.totalAssets()                   (read only)
BALANCE         USDC balance display             USDC.balanceOf(insurer)
```

Note: Claims now auto-exercise when the vault has sufficient USDC. The insurer receives USDC directly at trigger time without a separate `exerciseClaim` call. If the vault has insufficient USDC (shortfall), the ClaimReceipt stays live and the insurer must manually call `exerciseClaim` later. The insurer's unique write actions are: `submitClaim` (P3 only) and `exerciseClaim` (shortfall fallback only). Since ClaimReceipts are soulbound, only the original insurer address can exercise.

### 5.7 Oracle Reporter Flow: Report Event -> Verify Impact

```
ACTION          PAGE / COMPONENT                 CONTRACT CALLS                        STATE CHANGES
------          ----------------                 --------------                        -------------
REPORT          Admin (/admin)                   vault.reportEvent(policyId)           policy CLAIMED
EVENT           ClaimTriggers P2 row              -> reads oracle.getFlightStatus()    pendingClaims ↑
                                                  -> requires delayed == true          ClaimReceipt minted
                                                                                      NAV drops

VERIFY          Vault Detail (/vault/[addr])     vault.getVaultPolicy(policyId)        (read only)
IMPACT          PolicyRow -> CLAIMED badge       vault.totalAssets()
```

Note: The oracle reporter can ONLY call `reportEvent` -- they cannot exercise claims, modify oracle data, or trigger other claim types. For the hackathon, admin sets oracle data (`setFlightStatus(true)`) before the reporter calls `reportEvent`. In production, this would be an automated oracle relay.

### 5.8 Demo Happy Path Flows

These are concrete test scenarios with expected numeric results. Use them to verify correctness during integration and to rehearse the demo.

**Assumptions for all flows:**

- Vault A (Balanced Core): 80/20 buffer, 0.5% annual fee, P1(40%) + P2(20%) + P3(40%)
- Vault B (DeFi Alpha): 85/15 buffer, 1.0% annual fee, P1(60%) + P2(40%)
- Investor deposits $10,000 USDC into Vault A
- Premiums pre-funded: Vault A $6,100 total, Vault B $3,700 total

---

**HP1: Yield Accrual -- Deposit, Time Passes, Profit**

```
STEP    ACTION                              EXPECTED RESULT
----    ------                              ---------------
1       Investor deposits $10,000           Vault A balance: $16,100 ($10K + $6.1K premiums)
        into Vault A                        Unearned premiums: $6,100 (all unearned at day 0)
                                            totalAssets: $10,000
                                            Shares received: ~10,000
                                            Share price: $1.00

2       Admin advances time +30 days        Premiums earned:
                                              P1: $2,500 × 30/90  = $833
                                              P2: $1,200 × 30/60  = $600
                                              P3: $2,400 × 30/180 = $400
                                              Total earned: $1,833
                                            Unearned remaining: $4,267
                                            Fees accrued: ~$5 (negligible)
                                            totalAssets: ~$11,828
                                            Share price: ~$1.183 (+18.3%)

3       Investor withdraws max              maxWithdraw: limited by available buffer
                                            Available buffer: balance - deployed - pending
                                            = $16,100 - $8,000 - $0 = ~$8,100
                                            Investor receives: up to ~$8,100 USDC
                                            Remaining shares reflect proportional exit

VERIFY: Share price > $1.00 after time advance (premiums earning)
VERIFY: maxWithdraw < totalAssets (buffer enforced)
VERIFY: NAV ticker increases smoothly between polls
```

---

**HP2: BTC Crash -- On-Chain Claim (P1), Shared Policy Comparison**

```
STEP    ACTION                              EXPECTED RESULT
----    ------                              ---------------
1       (After HP1 step 2 -- day 30)        Vault A totalAssets: ~$11,828
        Vault A share price: $1.183         Vault B totalAssets: (Vault B investors' capital)

2       Admin sets BTC price to             oracle.getBtcPrice() returns 75000e8
        $75,000 (below $80K threshold)      No state change yet -- just oracle data

3       Anyone calls                        P1 triggers (75000 < 80000):
        vaultA.checkClaim(1)                  vaultA.vaultPolicies[1].claimed = true
                                              pendingClaims += $50,000
                                              ClaimReceipt #1 minted to insurer
                                            totalAssets: floors at $0 ($16.1K - $4.3K - $50K < 0)
                                            Share price: $0.00 (total wipeout)

4       Anyone calls                        P1 triggers independently in Vault B:
        vaultB.checkClaim(1)                  pendingClaims += $50,000
                                              ClaimReceipt #2 minted to insurer
                                            Vault B also heavily impacted
                                            → "Same event. Different vaults. Different impact."

5       Auto-exercise occurs in step 3/4     If vault has sufficient USDC, _processClaim
        (or insurer manually exercises)       auto-exercises: USDC transferred, receipt burned.
                                              If shortfall, insurer calls vault.exerciseClaim(1):
                                                pendingClaims -= $50,000
                                                USDC transferred (capped at vault balance)
                                                Receipt burned
                                              NAV: net zero change from exercise

VERIFY: checkClaim is permissionless (any address can call)
VERIFY: Both vaults trigger independently from same oracle data
VERIFY: Vault A and Vault B show different % impact (different allocation weights)
VERIFY: ClaimReceipt minted to insurer address, not caller
VERIFY: exerciseClaim only works for receipt.insurer (soulbound)
```

---

**HP3: Flight Delay -- Oracle-Dependent Claim (P2)**

```
STEP    ACTION                              EXPECTED RESULT
----    ------                              ---------------
1       Admin sets flight status             oracle.getFlightStatus() returns (true, timestamp)
        to delayed

2       Oracle reporter calls               P2 triggers in Vault A:
        vaultA.reportEvent(2)                 vaultPolicies[2].claimed = true
                                              pendingClaims += $15,000
                                              ClaimReceipt minted to insurer
                                            totalAssets drops by $15,000
                                            Share price drops proportionally

3       Non-reporter tries                  Transaction REVERTS with
        vaultA.reportEvent(2)               InsuranceVault__UnauthorizedCaller

4       Auto-exercise occurs in step 2      If vault has sufficient USDC, auto-exercised
        (or insurer exercises manually)       in same tx as reportEvent. Receipt burned.
                                              If shortfall: insurer calls exerciseClaim()
                                              pendingClaims -= $15,000

VERIFY: Only oracleReporter can call reportEvent (access control)
VERIFY: reportEvent reads oracle and validates condition (delayed == true)
VERIFY: If flight not delayed, reportEvent reverts
VERIFY: P2 only in vaults that have it (both A and B)
```

---

**HP4: Commercial Fire -- Off-Chain Partial Claim (P3)**

```
STEP    ACTION                              EXPECTED RESULT
----    ------                              ---------------
1       Insurer assesses fire damage         (Off-chain assessment: $35,000 of $40,000 coverage)
        at $35,000 (partial)

2       Insurer calls                       P3 triggers in Vault A:
        vaultA.submitClaim(3, 35_000e6)       vaultPolicies[3].claimed = true
                                              vaultPolicies[3].claimAmount = $35,000
                                              pendingClaims += $35,000
                                              ClaimReceipt minted to insurer
                                            totalAssets drops by $35,000

3       Non-insurer tries                   Transaction REVERTS with
        vaultA.submitClaim(3, 35_000e6)     InsuranceVault__UnauthorizedCaller

4       Anyone tries                        Transaction REVERTS with
        vaultB.submitClaim(3, ...)          InsuranceVault__PolicyNotActive
                                            (P3 is NOT in Vault B)

5       Auto-exercise occurs in step 2      If vault has sufficient USDC, auto-exercised
        (or insurer exercises manually)       in same tx as submitClaim. USDC: $35,000.
                                              If shortfall: insurer calls exerciseClaim()

VERIFY: Only insurerAdmin can call submitClaim
VERIFY: Partial amount ($35K < $40K coverage) accepted
VERIFY: Amount > coverage ($41K) reverts with InvalidClaimAmount
VERIFY: P3 only in Vault A (Vault B rejects -- policy not added)
VERIFY: Premium accrual for P3 stops after claim
```

---

**HP5: Full 5-Minute Demo Sequence (All Flows Combined)**

```
TIME    WHO         ACTION                          KEY METRIC TO SHOW
----    ---         ------                          ------------------
0:00    [Wallet 1]  (Deploy script already ran)     Show 2 vault cards on Discovery page
                                                    Vault A: $0 TVL, 3 policies
                                                    Vault B: $0 TVL, 2 policies

        [Switch to Wallet 2 = Investor]

0:30    Investor    Approve + deposit $10K          Share price: $1.00
                    into Vault A                    Shares: ~10,000
                                                    "Your $10K is backing 3 policies"

1:00    Investor    Deposit $5K into Vault B        Vault B share price: $1.00
                                                    Shares: ~5,000

        [Switch to Wallet 1 = Admin]

1:30    Admin       Advance time +30 days           Both vault NAVs tick UP
                                                    Vault A share price: ~$1.18
                                                    Vault B share price: ~$1.29
                                                    "Premiums earning over time"

2:00    Admin       Set BTC to $75,000              Oracle updated (no vault impact yet)

2:10    Admin       Trigger P1 on Vault A           Vault A NAV crashes
                    checkClaim(1)                   Share price: ~$0 (P1 = $50K > vault)

2:20    Admin       Trigger P1 on Vault B           Vault B also crashes
                    checkClaim(1)                   "Same event. Both vaults hit.
                                                    Different allocation = different story."

2:40    (auto)      Auto-exercised in step 2:10     USDC flowed to insurer at trigger time
                    (if shortfall: exerciseClaim)     Receipt already burned

3:00    Admin       Reset demo via fresh deploy      Clean slate, all state restored
                    Run DemoSetup.s.sol script       (<30s on Anvil)

3:10    Admin       Fresh deploy complete            Vault A and B back to initial state

3:20    Investor    Deposit $10K into Vault A       Share price: $1.00 (fresh)

3:30    Admin       Advance time +15 days           Share price: ~$1.09

3:40    Admin       Set flight delayed = true       Oracle updated

3:50    Reporter    Report P2 on Vault A            NAV drops by $15K
                    reportEvent(2)                  Share price drops

4:00    Insurer     Submit P3 partial ($35K)        NAV drops by another $35K
                    submitClaim(3, 35000e6)         "Two claims, cumulative impact"

4:15    (auto)      Auto-exercised at trigger time  USDC already flowed out at 3:50 and 4:00
                    (if shortfall: exerciseClaim)     Receipts already burned (if auto-exercised)

        [Switch to Wallet 2 = Investor]

4:30    Investor    Check maxWithdraw               Buffer-limited amount shown
                    Withdraw remaining capital      "Even after claims, buffer protects
                                                    partial exit"

4:50    [End]       Show Discovery page             Both vaults with final state
                                                    "Three claim types. One platform."
```

### 5.9 Claim Trigger Comparison

|                       | P1: BTC Protection           | P2: Flight Delay              | P3: Commercial Fire                   |
| --------------------- | ---------------------------- | ----------------------------- | ------------------------------------- |
| **Verification**      | On-chain                     | Oracle-dependent              | Off-chain                             |
| **Who triggers**      | ANYONE                       | `oracleReporter`              | `insurerAdmin`                        |
| **Contract call**     | `vault.checkClaim(policyId)` | `vault.reportEvent(policyId)` | `vault.submitClaim(policyId, amount)` |
| **Oracle read**       | `oracle.getBtcPrice()`       | `oracle.getFlightStatus()`    | None                                  |
| **Trigger condition** | `price <= threshold`         | `delayed == true`             | Insurer's assessment                  |
| **Claim amount**      | Full coverage ($50K)         | Full coverage ($15K)          | Partial (assessed amt)                |
| **Admin setup**       | `setBtcPrice(75000e8)`       | `setFlightStatus(true)`       | No setup needed                       |

### 5.10 Claim Lifecycle -- Transaction Chain

**Step 1: TRIGGER** (any of the 3 paths above)

```
vault.checkClaim(1) / reportEvent(2) / submitClaim(3, amount)   [all nonReentrant]
  -> validate: not claimed, correct type, not expired
  -> (P1/P2 only) read oracle, check condition
  -> _processClaim(policyId, claimAmount):
       vaultPolicies[id].claimed = true
       totalPendingClaims += claimAmount
       claimReceipt.mint(insurer, policyId, claimAmount, vault)  -> ERC-721 minted
       emit ClaimTriggered(policyId, claimAmount, insurer, receiptId)
       // AUTO-EXERCISE: attempt immediate settlement
       if USDC.balanceOf(vault) >= claimAmount:
         -> auto-exercise in same tx (transfer USDC, burn receipt, update accounting)
         -> emit ClaimAutoExercised(receiptId, claimAmount, insurer)
       else (shortfall):
         -> defer to manual exerciseClaim() -- receipt stays live
         -> emit ClaimShortfall(receiptId, claimAmount, USDC.balanceOf(vault))
```

**State after trigger (if auto-exercise succeeds -- sufficient USDC):**

| Contract        | Change                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------- |
| InsuranceVault  | `totalPendingClaims += claimAmt` then `-= claimAmt` (net zero), `vaultPolicies[id].claimed = true` |
| ClaimReceipt    | NFT minted then immediately burned (exercised in same tx)                                    |
| MockUSDC        | USDC transferred from vault to insurer                                                       |
| `totalAssets()` | Drops by `claimAmount` (balance deduction, pending claims net zero)                          |
| Share price     | Drops proportionally                                                                         |

**State after trigger (if shortfall -- insufficient USDC):**

| Contract        | Change                                                               |
| --------------- | -------------------------------------------------------------------- |
| InsuranceVault  | `totalPendingClaims += claimAmt`, `vaultPolicies[id].claimed = true` |
| ClaimReceipt    | New NFT minted to insurer, receipt stays live for manual exercise     |
| `totalAssets()` | Drops by `claimAmount` (pendingClaims deduction)                     |
| Share price     | Drops proportionally                                                 |

**Step 2: EXERCISE** (fallback -- insurer calls manually, only needed for shortfall cases)

```
vault.exerciseClaim(receiptId)                  [nonReentrant, fallback for shortfall cases]
  -> claimReceipt.getReceipt(receiptId)         [read receipt data]
  -> require receipt.vault == this vault
  -> require receipt.insurer == msg.sender     [soulbound: insurer check, not ownerOf]
  -> require !receipt.exercised
  -> uint256 payout = Math.min(claimAmount, USDC.balanceOf(vault))
  -> totalPendingClaims -= claimAmount          [full amount, not payout]
  -> totalDeployedCapital = min(totalDeployedCapital, totalDeployedCapital - claimAmount)  [floor at 0]
  -> claimReceipt.markExercised(receiptId)      [sets exercised=true AND burns NFT]
  -> USDC.transfer(msg.sender, payout)          [USDC moves to insurer, capped at balance]
  -> if (payout < claimAmount) emit ClaimShortfall(receiptId, claimAmount, USDC.balanceOf(vault))
  -> emit ClaimExercised(receiptId, payout, msg.sender)
```

**NAV impact of exercise: NET ZERO** (balance drops, pendingClaims drops by same amount).

**Shared policy (P1 in both vaults):**

```
BTC crashes -> admin fires:
  vaultA.checkClaim(1) -> Receipt #1 minted, Vault A NAV drops
  vaultB.checkClaim(1) -> Receipt #2 minted, Vault B NAV drops
  -> "Same claim. Different impact." (P1 = 40% of A, 60% of B)
  -> Admin page: single [Trigger P1 All Vaults] button fires both sequentially
```

### 5.11 Complete State Machine

```
                POLICY STATE                    VAULT IMPACT
                ============                    ============

REGISTERED ──[activatePolicy]──> ACTIVE         (no vault impact)
                                   |
                     +─────────────+──────────────+
                     |                            |
               [time passes]                [claim triggers]
                     |                            |
                     v                            v
                 EXPIRED                      CLAIMED
                     |                            |
          unearnedPremiums → 0             pendingClaims += amount
          deployed returns to buffer       receipt NFT minted
          premiums fully earned            NAV drops, accrual STOPS
                                                  |
                                     +------------+------------+
                                     |                         |
                              [auto-exercise]          [shortfall: defer]
                              (sufficient USDC)        (insufficient USDC)
                                     |                         |
                                     v                  [manual exerciseClaim]
                                EXERCISED                      |
                                     |                         v
                              pendingClaims -= amount     EXERCISED
                              USDC sent to insurer             |
                              receipt burned             pendingClaims -= amount
                              in same trigger tx         USDC sent (capped at balance)
                                                         receipt burned
```

### 5.12 Cross-Contract Read Dependencies

```
InsuranceVault ──reads──> PolicyRegistry
    |                       - getPolicy(id), currentTime(), isPolicyExpired(id)
    |
    +──reads──> MockOracle
    |             - getBtcPrice() [only in checkClaim]
    |             - getFlightStatus() [only in reportEvent]
    |
    +──reads/writes──> ClaimReceipt
    |                    - mint() [on trigger], markExercised() [on exercise]
    |                    - getReceipt() [on exercise, validate receipt.insurer]
    |
    +──reads/writes──> MockUSDC
                         - balanceOf(vault) [in every totalAssets() call]
                         - transferFrom() [deposit, depositPremium]
                         - transfer() [withdraw, exerciseClaim, auto-exercise in _processClaim]
```

### 5.13 Frontend Event & Polling Strategy

| Data                   | Method                           | Frequency | Hook                                    |
| ---------------------- | -------------------------------- | --------- | --------------------------------------- |
| Vault TVL, share price | Poll `getVaultInfo()`            | 10s       | `useReadContract` refetchInterval       |
| NAV ticker (smooth)    | Client-side linear interpolation | 1s        | Local state between polls               |
| Policy status/expiry   | Poll `getVaultPolicy(id)`        | 10s       | `useReadContracts` batch                |
| User balance           | Watch blocks + after tx          | On block  | `useReadContract` watch: true           |
| Claim events           | Event subscription               | Real-time | `useWatchContractEvent(ClaimTriggered)` |
| Time changes           | Event subscription               | Real-time | `useWatchContractEvent(TimeAdvanced)`   |

**Cache invalidation on events:**

- `ClaimTriggered` -> invalidate vault info, policy status, totalAssets, maxWithdraw
- `TimeAdvanced` -> invalidate ALL vault reads (NAV, policies, fees all change)
- `Deposit`/`Withdraw` -> invalidate vault info, user balances

### 5.14 Transaction Summary by Page

| Page          | Action       | Write Call(s)                                                                                | Read Call(s) After                                           |
| ------------- | ------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Discovery** | (view)       | --                                                                                           | `factory.getVaults()`, `vault.getVaultInfo()` x2             |
| **Detail**    | (view)       | --                                                                                           | `getVaultInfo()`, `getPolicyIds()`, `getVaultPolicy(id)` x N |
| **Sidebar**   | Deposit      | `USDC.approve` + `vault.deposit`                                                             | `balanceOf`, `getVaultInfo()`                                |
| **Sidebar**   | Withdraw     | `vault.withdraw`                                                                             | `balanceOf`, `USDC.balanceOf`, `getVaultInfo()`              |
| **Admin**     | Advance Time | `registry.advanceTime(sec)`                                                                  | `currentTime()`, all vault info                              |
| **Admin**     | Set Oracle   | `oracle.setBtcPrice` / `setFlightStatus`                                                     | oracle reads                                                 |
| **Admin**     | Check Claim  | `vault.checkClaim(id)`                                                                       | `getVaultInfo()`, `getVaultPolicy(id)`                       |
| **Admin**     | Report Event | `vault.reportEvent(id)`                                                                      | same                                                         |
| **Admin**     | Submit Claim | `vault.submitClaim(id, amt)`                                                                 | same                                                         |
| **Admin**     | Exercise     | `vault.exerciseClaim(receiptId)`                                                             | `getVaultInfo()`, `USDC.balanceOf`                           |
| **Admin**     | Reset        | Re-deploy via `DemoSetup.s.sol` (no `resetDemo` contract function -- full redeployment only) | full refresh (new contract addresses)                        |

### 5.15 Demo Transaction Log (5-minute run)

```
PRE-DEMO (deploy script):
  Deploy 6 contracts -> register 3 policies -> create 2 vaults
  -> add policies + fund premiums -> mint USDC to investor -> set oracle defaults

LIVE DEMO:
  0:30  USDC.approve(vaultA, 10_000e6)          [Investor approves]
  0:40  vaultA.deposit(10_000e6, investor)       [Investor deposits, gets ~10,000 shares]
  1:30  registry.advanceTime(30 days)            [Admin fast-forwards, NAV ticks up]
  2:00  oracle.setBtcPrice(75_000e8)             [Admin crashes BTC]
  2:10  vaultA.checkClaim(1)                     [Anyone triggers P1 in Vault A]
  2:20  vaultB.checkClaim(1)                     [Anyone triggers P1 in Vault B]
        -> "Same claim. Vault A: -X%. Vault B: -Y%. Different strategy."
  3:00  (auto-exercised at 2:10 if sufficient)   [Insurer gets USDC at trigger time; manual fallback if shortfall]
  3:30  oracle.setFlightStatus(true)             [Admin sets flight delay]
  3:40  vaultA.reportEvent(2)                    [Reporter triggers P2]
  4:00  vaultA.submitClaim(3, 35_000e6)          [Insurer submits P3 partial]
  4:15  vaultA.withdraw(maxWithdraw, inv, inv)   [Investor exits at current NAV]
```

---

## 6. Frontend Architecture

### 6.1 Page Components

#### Page 1: Vault Discovery (`/`)

```
VaultDiscoveryPage
  +-- Header (logo, wallet connect)
  +-- VaultGrid
  |     +-- VaultCard (Vault A)
  |     |     +-- VaultName + ManagerBadge
  |     |     +-- APYDisplay (projected yield)
  |     |     +-- TVLDisplay
  |     |     +-- PolicyCount + VerificationBadges (emerald/amber/slate dots)
  |     |     +-- RiskLevel indicator
  |     +-- VaultCard (Vault B)
  |           +-- (same structure)
  +-- HowItWorks section (3-step explainer)
```

Note: `UserPositions` component was removed. The page shows vault cards and a "How It Works" section.

**Contract reads**: `VaultFactory.getVaults()` (returns full address array), per vault: `vault.getVaultInfo()`, `balanceOf(user)`.

#### Page 2: Vault Detail (`/vault/[address]`)

```
VaultDetailPage
  +-- VaultHeader (name, manager, APY, TVL, fee)
  +-- PolicyTable
  |     +-- PolicyRow (P1)
  |     |     +-- VerificationBadge (emerald "On-chain")
  |     |     +-- PolicyName, Coverage, Premium, Duration
  |     |     +-- ExpiryBar (visual countdown)
  |     |     +-- StatusBadge (Active/Claimed/Expired)
  |     +-- PolicyRow (P2) ...
  |     +-- PolicyRow (P3) ...
  +-- AllocationBar (visual: P1 40% | P2 20% | P3 40%)
  +-- BufferVisualization (TVL-based: Policy Exposure | Pending Claims | Free Capital)
  +-- YieldSection
  |     +-- YieldTicker (real-time NAV per share)
  |     +-- ProjectedAPY
  |     +-- EarnedPremiums (cumulative)
  +-- UserPosition (shares owned, current value, P&L)
  +-- DepositSidebar (inline, right side, Morpho-style)
  |     +-- TabSelector (Deposit / Withdraw)
  |     +-- AmountInput
  |     |     +-- BalanceDisplay (USDC balance or vault shares)
  |     |     +-- MaxButton
  |     +-- ShareCalculation
  |     |     +-- "You will receive: X shares" (deposit)
  |     |     +-- "You will receive: X USDC" (withdraw)
  |     |     +-- "Exchange rate: 1 share = X USDC"
  |     +-- ActionButton
  |     |     +-- State machine: IDLE -> APPROVING -> APPROVED -> DEPOSITING -> SUCCESS/ERROR
  |     +-- ConfirmationView (post-success)
  |           +-- "Your $X is backing N policies"
```

**Contract reads**: `getVaultInfo()` (aggregated), `getPolicyIds()`, per policy: `getVaultPolicy(id)` + `registry.getPolicy(id)`, `balanceOf(user)`, `maxWithdraw(user)`, `totalPendingClaims`, `registry.currentTime()`.

#### Inline Sidebar: Deposit/Withdraw (Morpho-style)

The deposit/withdraw UI is an **inline sidebar** on the Vault Detail page (right side), not a modal. This follows the Morpho Finance pattern: vault details on the left, action panel fixed on the right. The sidebar is always visible when viewing a vault. Light theme.

**Deposit state machine**:

```
IDLE          -> user enters amount, clicks "Deposit"
APPROVING     -> tx: USDC.approve(vault, amount) -- waiting for confirmation
APPROVED      -> approval confirmed, auto-proceed to deposit
DEPOSITING    -> tx: vault.deposit(amount, receiver) -- waiting for confirmation
SUCCESS       -> show confirmation with shares received
ERROR         -> show error, allow retry
```

#### Page 3: Admin / Curator (`/admin`)

```
AdminPage
  +-- Section: Time Controls
  |     +-- CurrentTimeDisplay (virtual time from PolicyRegistry)
  |     +-- AdvanceTimeButtons (1 day, 7 days, 30 days, custom)
  |
  +-- Section: Oracle Controls
  |     +-- BtcPriceInput + SetButton
  |     +-- FlightDelayToggle + SetButton
  |
  +-- Section: Claim Triggers
  |     +-- VaultSelector (Vault A / Vault B)
  |     +-- P1 Row: "BTC Protection" [Check Claim] (permissionless)
  |     +-- P2 Row: "Flight Delay" [Report Event] (oracle reporter)
  |     +-- P3 Row: "Commercial Fire" [Submit Claim: $___] (insurer admin)
  |
  +-- Section: Claim Receipts
  |     +-- List of outstanding receipts with [Exercise] buttons
  |
  +-- Section: Policy Pool (read-only display of all registered policies)
  |
  +-- Section: Vault Overview (compact read-only display -- VaultCreator.tsx deferred)
  |
  +-- Section: Demo Controls
        +-- [Reset Demo] button
        +-- [Mint USDC] button (to investor address)
```

Note: `WithdrawTab.tsx` does not exist as a separate component -- withdraw is integrated into `DepositSidebar.tsx` via tab switching.

### 6.2 wagmi Hooks Strategy

| Hook                    | Type           | Usage                                               |
| ----------------------- | -------------- | --------------------------------------------------- |
| `useReadContract`       | Read           | Single contract value (totalAssets, balanceOf)      |
| `useReadContracts`      | Read (batch)   | Multiple values in one RPC call (vault detail page) |
| `useWriteContract`      | Write          | Deposit, withdraw, approve, trigger claims          |
| `useWatchContractEvent` | Event listener | ClaimTriggered, TimeAdvanced, Deposited events      |
| `useAccount`            | Wallet         | Connected address, chain, connection status         |
| `useChainId`            | Chain          | Current chain ID for contract address lookup        |

### 6.3 Data Formatting Helpers

```typescript
// lib/formatting.ts
formatUSDC(amount: bigint): string               // 1000000n -> "$1.00"
formatUSDCCompact(amount: bigint): string         // 50000000000n -> "$50K"
formatUSDCRaw(amount: bigint): string             // 1000000n -> "1.00" (no $)
formatSharePrice(assets: bigint, shares: bigint): string  // -> "$1.0199"
getSharePriceNumber(totalAssets: bigint, totalSupply: bigint): number // -> 1.0199
formatAPY(rate: number): string                   // 0.0812 -> "8.12%"
formatFeeBps(feeBps: bigint): string              // 50n -> "0.50%"
formatDaysRemaining(expiry: bigint, now: bigint): string  // -> "45 days"
formatDuration(seconds: bigint): string           // -> "90 days"
formatBufferRatio(bufferBps: bigint): string      // -> "20%"
formatAllocationWeight(weightBps: bigint): string // -> "40%"
formatBtcPrice(price: bigint): string             // -> "$85,000"
shortenAddress(address: string): string           // -> "0x1234...5678"
parseUSDC(amount: string): bigint                 // "1000" -> 1000000000n
calculatePolicyProgress(startTime: bigint, duration: bigint, currentTime: bigint): number

// config/constants.ts
VERIFICATION_CONFIG                               // Maps verification type enum to label, color, description
```

---

## 7. Implementation Plan & Task Separation

### Overview

| Phase                 | Agent                   | Duration     | Focus                         |
| --------------------- | ----------------------- | ------------ | ----------------------------- |
| Day 1                 | Marco (Smart Contracts) | ~10-11 hours | All 6 contracts + unit tests  |
| Day 2                 | Luca (Frontend)         | ~11-12 hours | 3 pages + 1 modal + hooks     |
| Day 2 evening + Day 3 | Both                    | ~8-10 hours  | Integration + polish + deploy |

### Day 1: Marco -- Smart Contract Build

| Task    | Description                                                                  | Duration  | Dependencies |
| ------- | ---------------------------------------------------------------------------- | --------- | ------------ |
| **M1**  | Project setup: `forge init`, install OZ, configure `foundry.toml`            | 30 min    | None         |
| **M2**  | `MockUSDC.sol` + `MockOracle.sol` (standalone, simple)                       | 1 hour    | M1           |
| **M3**  | `ClaimReceipt.sol` (ERC-721 with mint/exercise/burn)                         | 1 hour    | M1           |
| **M4**  | `PolicyRegistry.sol` (policy storage, timeOffset, currentTime, oracle reads) | 1.5 hours | M2           |
| **M5**  | `InsuranceVault.sol` -- Core ERC4626 (deposit/withdraw/totalAssets)          | 2 hours   | M2, M4       |
| **M6**  | `InsuranceVault.sol` -- Policy management + premium handling                 | 1 hour    | M5           |
| **M7**  | `InsuranceVault.sol` -- Three claim paths + ClaimReceipt integration         | 1.5 hours | M5, M3, M6   |
| **M8**  | `InsuranceVault.sol` -- Fee accrual, maxWithdraw override, edge cases        | 1 hour    | M5, M7       |
| **M9**  | `VaultFactory.sol` (deploys configured vault instances)                      | 1 hour    | M5           |
| **M10** | Unit tests for all contracts                                                 | 1.5 hours | M2-M9        |
| **M11** | `Deploy.s.sol` + `DemoSetup.s.sol` (deployment + demo state scripts)         | 1 hour    | M9, M10      |

**Critical path**: M1 -> M2 -> M4 -> M5 -> M6 -> M7 -> M8 (InsuranceVault is the bottleneck)

**M5 is the hardest task**: totalAssets() correctness with all edge cases. Write fuzz tests early.

### Day 2: Luca -- Frontend Build

| Task   | Description                                                                    | Duration  | Dependencies           |
| ------ | ------------------------------------------------------------------------------ | --------- | ---------------------- |
| **L0** | Project setup: Next.js 15, wagmi v2, RainbowKit, Tailwind, TypeScript config   | 1 hour    | None                   |
| **L1** | Wallet connection + chain config (Anvil / Base Sepolia)                        | 30 min    | L0                     |
| **L2** | Vault Discovery page (2 vault cards, TVL, APY, verification badges)            | 2 hours   | L1, contracts deployed |
| **L3** | Vault Detail page (policy table, allocation bar, buffer viz, yield ticker)     | 2.5 hours | L2                     |
| **L4** | Deposit/Withdraw modal (approve+deposit state machine, share calculation)      | 2 hours   | L3                     |
| **L5** | Admin page (time controls, oracle controls, 3 claim triggers, exercise, reset) | 2.5 hours | L4                     |
| **L6** | Polish: loading states, error handling, responsive tweaks, smooth animations   | 1.5 hours | L5                     |

**Blocker**: L2 depends on deployed contracts + ABIs. Marco should export ABIs by end of Day 1.

### Day 2 Evening + Day 3: Integration & Polish

| Task    | Description                                                      | Duration | Owner |
| ------- | ---------------------------------------------------------------- | -------- | ----- |
| **I1**  | Copy ABIs from Foundry to frontend config                        | 15 min   | Luca  |
| **I2**  | Deploy contracts to Anvil, wire frontend to local chain          | 30 min   | Marco |
| **I3**  | End-to-end: deposit flow (approve + deposit + verify shares)     | 30 min   | Both  |
| **I4**  | End-to-end: yield accrual (advance time, verify NAV increase)    | 30 min   | Both  |
| **I5**  | End-to-end: all 3 claim triggers (verify receipt mint, NAV drop) | 1 hour   | Both  |
| **I6**  | End-to-end: claim exercise (verify USDC transfer, receipt burn)  | 30 min   | Both  |
| **I7**  | End-to-end: withdrawal flow (verify buffer enforcement)          | 30 min   | Both  |
| **I8**  | Demo script rehearsal: run through full 5-min demo narrative     | 1 hour   | Both  |
| **I9**  | Deploy to Base Sepolia (if target chain)                         | 1 hour   | Marco |
| **I10** | Frontend build + deploy (Vercel or static)                       | 30 min   | Luca  |
| **I11** | Final polish: fix any UX issues found during rehearsal           | 2 hours  | Both  |

---

## 8. Test Plan

### Test Constants (use consistently across all test files)

```solidity
uint256 constant USDC_DECIMALS = 6;
uint256 constant ONE_USDC = 1e6;
uint256 constant THOUSAND_USDC = 1_000e6;
uint256 constant COVERAGE_50K = 50_000e6;
uint256 constant COVERAGE_15K = 15_000e6;
uint256 constant COVERAGE_40K = 40_000e6;
uint256 constant PREMIUM_2500 = 2_500e6;
uint256 constant PREMIUM_1200 = 1_200e6;
uint256 constant PREMIUM_2400 = 2_400e6;
uint256 constant BTC_PRICE_85K = 85_000e8;  // 8 decimals (Chainlink convention)
uint256 constant BTC_THRESHOLD_80K = 80_000e8;
uint256 constant ONE_DAY = 1 days;
uint256 constant THIRTY_DAYS = 30 days;
uint256 constant NINETY_DAYS = 90 days;
```

### Unit Tests (Marco, Day 1)

#### MockUSDC Tests

- `test_mint`: Mint tokens, verify balance
- `test_decimals`: Returns 6
- `test_transfer`: Standard ERC20 transfer

#### MockOracle Tests

- `test_setBtcPrice`: Admin sets price, verify read
- `test_setFlightDelayed`: Toggle boolean
- `test_onlyAdmin`: Non-admin reverts

#### PolicyRegistry Tests

- `test_registerPolicy`: Register, verify stored data
- `test_currentTime`: Returns `block.timestamp + timeOffset`
- `test_advanceTime`: Offset increases, currentTime updates
- `test_checkBtcTrigger_above`: BTC above threshold, returns false
- `test_checkBtcTrigger_below`: BTC below threshold, returns true
- `test_checkFlightTrigger`: Flight delayed, returns true
- `test_onlyAdmin_reverts`: Non-admin calls revert

#### InsuranceVault Tests (THE critical test suite)

**Deposit/Withdraw:**

- `test_deposit`: Deposit USDC, receive shares at correct rate
- `test_withdraw`: Withdraw at NAV, receive correct USDC
- `test_maxWithdraw_bufferEnforcement`: Cannot withdraw more than available buffer
- `test_firstDeposit_inflationAttack`: Virtual shares protect first depositor
- `test_depositZero_reverts`: Zero deposit reverts

**Premium Mechanics:**

- `test_addPolicy_transfersPremium`: Premium USDC moves to vault
- `test_unearnedPremium_day0`: Full premium is unearned at start
- `test_unearnedPremium_halfDuration`: Half premium earned at midpoint
- `test_unearnedPremium_expired`: Zero unearned after expiry
- `test_totalAssets_increasesWithTime`: NAV rises as premiums earn

**Claim Paths:**

- `test_triggerOnChain_btcBelow`: BTC below threshold triggers claim
- `test_triggerOnChain_btcAbove_reverts`: BTC above threshold reverts
- `test_triggerOnChain_permissionless`: Any address can trigger
- `test_triggerOracle_flightDelayed`: Oracle reports delay, claim triggers
- `test_triggerOracle_onlyReporter`: Non-reporter reverts
- `test_triggerOffChain_partialClaim`: Insurer submits partial amount
- `test_triggerOffChain_fullClaim`: Insurer submits full coverage
- `test_triggerOffChain_exceedsCoverage_reverts`: Amount > coverage reverts
- `test_triggerOffChain_onlyInsurer`: Non-insurer reverts
- `test_doubleClaim_reverts`: Already-claimed policy reverts

**ClaimReceipt:**

- `test_claimMintsReceipt`: Receipt minted to insurer on trigger
- `test_receiptStoresInsurer`: Receipt.insurer field set correctly on mint
- `test_autoExercise_sufficientBalance`: Claim trigger auto-exercises when vault has enough USDC
- `test_autoExercise_emitsClaimAutoExercised`: ClaimAutoExercised event emitted on auto-exercise
- `test_autoExercise_burnsReceipt`: Receipt burned in same tx as trigger
- `test_shortfall_defersToManualExercise`: ClaimShortfall emitted when vault underfunded, receipt stays live
- `test_exerciseClaim_transfersUSDC`: Manual exercise sends USDC to insurer (shortfall fallback)
- `test_exerciseClaim_burnsReceipt`: Receipt burned after manual exercise
- `test_exerciseClaim_capsAtBalance`: Payout capped if vault underfunded, shortfall event emitted
- `test_exerciseClaim_fromWrongVault_reverts`: receipt.vault != address(this) reverts
- `test_doubleExercise_reverts`: Second exercise reverts (receipt burned)
- `test_soulbound_transferBlocked`: transferFrom reverts for non-zero from and to
- `test_soulbound_mintAllowed`: Mint to insurer succeeds
- `test_soulbound_burnAllowed`: Burn on exercise succeeds
- `test_pendingClaims_reducesNAV`: totalAssets drops by claim amount
- `test_exerciseClaim_restoresNAV`: Exercise is net-zero on totalAssets

**Premium Deposits:**

- `test_depositPremium_separate`: depositPremium is separate call from addPolicy
- `test_depositPremium_onlyOwner`: Owner can deposit premiums
- `test_depositPremium_authorizedDepositor`: Authorized premium depositor can deposit
- `test_depositPremium_unauthorizedReverts`: Non-owner non-authorized reverts
- `test_setAuthorizedPremiumDepositor_onlyOwner`: Only owner can set depositor authorization
- `test_depositPremium_policyNotInVault_reverts`: Policy not added to vault reverts

**Fee Mechanics:**

- `test_accruedFees_reducesNAV`: Fees deduct from totalAssets
- `test_feeSnapshot_updates`: Snapshot refreshes on state changes
- `test_feeRate_vaultA_vs_vaultB`: Different rates produce different fees
- `test_claimFees_transfersUSDC`: Owner can withdraw accumulated fees
- `test_lastFeeTimestamp_initialized`: Set to currentTime() at deployment

**Shared Policy:**

- `test_sharedPolicy_independentClaims`: P1 in both vaults, trigger in A doesn't affect B
- `test_sharedPolicy_independentPremiums`: Each vault has own premium deposit

**Edge Cases:**

- `test_totalAssets_floorAtZero`: Deductions > balance returns 0
- `test_allPoliciesExpired_withdrawAll`: Full withdrawal when no active policies
- `test_claimExceedsBalance_capsAtBalance`: Payout capped if vault underfunded
- `test_oracleUninitialized_safeDefault`: checkClaim with uninitialized oracle does not false-trigger
- `test_decimalsOffset_firstDeposit`: $10K deposit produces ~10,000 shares at ~$1.00
- `test_addPolicy_nonexistentPolicy_reverts`: Adding policy not in registry reverts

**Fuzz Tests:**

- `testFuzz_depositWithdraw_roundTrip(uint256 amount)`: Deposit then withdraw returns ~same (minus fees)
- `testFuzz_totalAssets_neverReverts(uint256 timeElapsed)`: totalAssets() never reverts regardless of state

#### VaultFactory Tests

- `test_createVault`: Factory deploys vault with correct config
- `test_createVault_permissionless`: Any address can create a vault (not just factory owner)
- `test_createVault_callerBecomesOwner`: msg.sender becomes vault owner, not factory owner
- `test_createVault_autoRegistersMinter`: Factory auto-registers vault as authorized minter in ClaimReceipt
- `test_getVault`: Retrieves deployed vault address
- `test_vaultCount`: Tracks number of vaults
- `test_registrar_canAddMinter`: Factory (as registrar) can add minters to ClaimReceipt
- `test_registrar_cannotRevokeMinter`: Registrar cannot revoke minters (owner-only)
- `test_setRegistrar_onlyOwner`: Only ClaimReceipt owner can set registrar

### Integration Tests (Day 3)

- `test_fullDemoFlow`: Complete demo scenario: deploy, deposit, advance time, trigger claim, exercise, withdraw
- `test_sharedPolicyClaimFlow`: P1 triggers in both vaults independently
- `test_multipleClaimsSequential`: P1 then P3 claim, verify cumulative impact

---

## 9. Security Concerns

| #   | Concern                                          | Mitigation                                                                                                       |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| S1  | **Reentrancy on claim triggers and exerciseClaim** | Use `nonReentrant` modifier on `checkClaim`, `reportEvent`, `submitClaim`, and `exerciseClaim`. Auto-exercise performs `safeTransfer` inside trigger functions, requiring reentrancy protection on all four entry points. |
| S2  | **First-depositor inflation attack**             | Use OZ 5.x `_decimalsOffset()` override (returns 12). Virtual shares prevent manipulation.                       |
| S3  | **totalAssets() underflow**                      | Floor at zero (`if (deductions >= balance) return 0`). Never revert.                                             |
| S4  | **Unauthorized claim triggers**                  | Access control per path: P1 permissionless, P2 requires ORACLE_REPORTER, P3 requires INSURER_ADMIN.              |
| S5  | **Double claim / double exercise**               | `VaultPolicy.claimed` flag prevents re-trigger. ClaimReceipt.exercised flag + burn prevents re-exercise.         |
| S6  | **USDC approve race condition**                  | Frontend uses `approve(0)` then `approve(amount)` pattern, or set exact allowance. Not a smart contract concern. |
| S7  | **ClaimReceipt minted by unauthorized contract** | ClaimReceipt maintains a mapping of authorized vault addresses. Only registered vaults can mint. Registrar (VaultFactory) can add minters but cannot revoke -- owner retains revocation control. |

### Gas Optimization Opportunities

| #   | Optimization                                                                                    | Impact                               |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------ |
| G1  | Pack `VaultPolicy` struct fields to minimize storage slots                                      | Moderate -- saves ~20K gas on writes |
| G2  | Use `uint96` for amounts (sufficient for USDC with 6 decimals up to ~$79T)                      | Moderate -- tighter packing          |
| G3  | Cache `registry.currentTime()` in a local variable within functions that call it multiple times | Minor -- saves a few hundred gas     |
| G4  | Skip these for hackathon -- correctness > gas efficiency                                        | **Recommended**                      |

---

## 10. Recommended Agent Skills

### For Marco (Smart Contract Build)

| Skill                  | Purpose                | Configuration                                                  |
| ---------------------- | ---------------------- | -------------------------------------------------------------- |
| **foundry-build**      | Compile contracts      | `forge build` with correct profile                             |
| **foundry-test**       | Run full test suite    | `forge test -vvv` with gas reporting                           |
| **foundry-test-match** | Run specific test      | `forge test --match-test testName -vvvv` for debugging         |
| **anvil-start**        | Start local chain      | `anvil --chain-id 31337` with deterministic accounts           |
| **forge-script**       | Run deployment scripts | `forge script script/Deploy.s.sol --rpc-url ... --broadcast`   |
| **contract-size**      | Check contract sizes   | `forge build --sizes` (InsuranceVault may approach 24KB limit) |

### For Luca (Frontend Build)

| Skill             | Purpose                            | Configuration                                                              |
| ----------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| **next-dev**      | Start dev server                   | `npm run dev`                                                              |
| **next-build**    | Production build                   | `npm run build` (catches TypeScript errors)                                |
| **copy-abis**     | Copy ABIs from Foundry to frontend | Script: copy `out/*.json` ABI arrays to `frontend/src/config/contracts.ts` |
| **wagmi-codegen** | Generate typed hooks from ABIs     | Optional: `@wagmi/cli` for type-safe contract interaction                  |

### For Integration

| Skill          | Purpose                           | Configuration                                 |
| -------------- | --------------------------------- | --------------------------------------------- |
| **demo-setup** | Deploy contracts + seed demo data | `forge script script/DemoSetup.s.sol`         |
| **demo-reset** | Reset demo state                  | Re-run `DemoSetup.s.sol` for fresh deployment |

### MCP Servers (Optional)

| Server          | Purpose                                                    |
| --------------- | ---------------------------------------------------------- |
| **Foundry MCP** | If available -- direct forge/anvil interaction from Claude |
| **GitHub MCP**  | PR creation, code review, branch management                |

---

## 11. Implementation Risks

| #   | Risk                                                                                        | Severity | Mitigation                                                                                   |
| --- | ------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| R1  | **totalAssets() correctness** -- single bug breaks all share pricing, deposits, withdrawals | Critical | Write fuzz tests first. Test with concrete numbers matching design doc walkthrough.          |
| R2  | **Three claim paths complexity** -- most code and most test surface area in InsuranceVault  | High     | Implement one path at a time. Test each before moving to the next. Start with P1 (simplest). |
| R3  | **USDC approve-then-deposit UX** -- two transactions confuse users                          | Medium   | Frontend state machine handles this. Consider using `permit2` if time allows.                |
| R4  | **Contract size limit (24KB)** -- InsuranceVault may be too large                           | Medium   | Monitor with `forge build --sizes`. If close, extract helpers into a library contract.       |
| R5  | **ABI sync between contracts and frontend** -- stale ABIs cause silent failures             | Medium   | Copy ABIs immediately after any contract change. Consider a script.                          |
| R6  | **Fee accrual precision** -- rounding errors accumulate over many time advances             | Low      | Use high-precision intermediate calculations. Test with many small time advances.            |
| R7  | **wagmi v2 + Next.js 15 SSR hydration** -- server/client mismatch on wallet state           | Medium   | Use `"use client"` directive on all wallet-dependent components. Wrap in `<Suspense>`.       |
| R8  | **Demo timing** -- live demo on Base Sepolia depends on network reliability                 | Medium   | Have Anvil local fallback ready. Frontend supports both chains via config.                   |
| R9  | **ClaimReceipt authorization** -- vault must be registered in ClaimReceipt before minting   | Low      | Factory auto-registers via registrar role. DemoSetup sets factory as registrar before vault creation. |
| R10 | **Time offset edge case** -- advancing time past multiple policy expiries in one call       | Medium   | Lazy expiry check handles this. But test explicitly with `advanceTime(1 year)`.              |

### Top 3 Hardest Tasks

1. **InsuranceVault.totalAssets()** -- The formula must correctly handle every combination of premiums, claims, fees, and time. One bug here breaks everything.
2. **Three claim trigger paths** -- Each path has different access control, different amount logic (binary vs partial), different post-claim state. High test surface area.
3. **Frontend deposit state machine** -- Two-transaction flow (approve + deposit) with proper loading states, error handling, and wallet confirmation UX. Must feel smooth during a live demo.

---

## 12. Day 4 Changes -- Buffer Visualization & Withdraw Cap (Feb 7, 2026)

### 12.1 Problem: Contract Buffer vs TVL-Based Buffer

The contract's `_availableBuffer()` computes:

```
buffer = USDC.balanceOf(vault) - totalDeployedCapital - totalPendingClaims
```

This uses the **gross USDC balance**, which includes unearned premiums and accrued fees. The buffer was showing more withdrawable capital than the vault's NAV warranted.

The correct investor-facing buffer should be based on **TVL (totalAssets)**, not gross USDC balance:

```
freeCapital = totalAssets - deployedCapital - pendingClaims
```

This excludes unearned premiums and accrued fees from the withdrawable amount.

### 12.2 BufferVisualization Redesign

**File**: `frontend/src/components/vault/BufferVisualization.tsx`

**Before**: Bar was based on gross USDC balance with segments "Deployed" (blue) and "Available Liquidity" (green), labeled "Capital Deployment".

**After**: Bar is based on `totalAssets` (TVL) with three segments:

| Segment | Color | Calculation | Meaning |
|---------|-------|-------------|---------|
| Policy Exposure | Blue (`bg-blue-400`) | `min(deployedCapital, totalAssets)` | Capital committed to backing policies |
| Pending Claims | Red (`bg-red-400`) | `min(pendingClaims, totalAssets - exposure)` | Claims awaiting exercise |
| Free Capital | Green (`bg-emerald-400`) | `max(totalAssets - exposure - pending, 0)` | Capital available for withdrawal |

**Label changes**: "Deployed" -> "Policy Exposure", "Available Liquidity" -> "Free Capital", "Capital Deployment" -> "Capital Allocation".

**Edge cases handled**:
- `deployedCapital > totalAssets`: Exposure capped at TVL (no bar overflow)
- `pendingClaims` overflow: Capped at remaining space after exposure
- `totalAssets = 0`: All percentages are 0, no division by zero
- All segments sum to exactly `totalAssets` by construction

**Note**: The `availableBuffer` prop is still accepted in the interface but is no longer used. The component derives all segments from `totalAssets`, `deployedCapital`, and `pendingClaims`.

### 12.3 Withdraw Cap (effectiveMaxWithdraw)

**File**: `frontend/src/app/vault/[address]/page.tsx`

The vault detail page now computes a tighter withdrawal cap:

```typescript
// TVL-based free capital (conservative, excludes unearned premiums)
const freeCapital = assets > deployedCapital + pendingClaims
  ? assets - deployedCapital - pendingClaims
  : 0n;

// Cap at the more restrictive of: TVL-based free capital vs contract's maxWithdraw
const effectiveMaxWithdraw = maxWithdraw !== undefined
  ? (freeCapital < maxWithdraw ? freeCapital : maxWithdraw)
  : undefined;
```

**How it works**:
1. `freeCapital` = `totalAssets - deployedCapital - pendingClaims` (TVL-based, conservative)
2. `effectiveMaxWithdraw` = `min(freeCapital, contract.maxWithdraw(user))` (tighter of the two caps)
3. The contract's `maxWithdraw` already caps at `min(userAssets, _availableBuffer())`, so the frontend adds an additional TVL-based constraint

**Data flow**:
```
Vault Detail Page
  -> computes effectiveMaxWithdraw = min(freeCapital, contractMaxWithdraw)
  -> passes maxWithdrawOverride={effectiveMaxWithdraw} to DepositSidebar
  -> DepositSidebar uses: maxWithdrawOverride ?? maxWithdraw ?? 0n
  -> WithdrawTab uses the final value for:
     - AmountInput max amount (Max button)
     - Button disabled check (amount > max)
     - Button text ("Exceeds available buffer")
     - Zero-balance warning display
```

**DepositSidebar changes** (`frontend/src/components/deposit/DepositSidebar.tsx`):
- Added optional `maxWithdrawOverride?: bigint` prop
- When provided, overrides the contract's raw `maxWithdraw` for the withdraw cap
- Nullish coalescing chain: `maxWithdrawOverride ?? maxWithdraw ?? 0n`

**Your Position card**: Shows the capped `effectiveMaxWithdraw` instead of the raw contract `maxWithdraw`.

### 12.4 Contract vs Frontend Enforcement

**IMPORTANT**: The withdraw cap is **frontend-only**. The contract's `maxWithdraw()` and `_withdraw()` still use `_availableBuffer()` (gross USDC balance based). A user calling the contract directly (via Etherscan, cast, or another frontend) can withdraw up to the full `_availableBuffer()` amount.

For the hackathon demo, this is acceptable because:
1. The demo environment is controlled
2. The frontend is the only UI
3. The `min()` operation means the UI never shows more than the contract allows

**Production consideration**: To enforce the TVL-based cap on-chain, `_availableBuffer()` should be changed to:

```solidity
function _availableBuffer() internal view returns (uint256) {
    uint256 ta = totalAssets();
    uint256 reserved = totalDeployedCapital + totalPendingClaims;
    if (ta <= reserved) return 0;
    return ta - reserved;
}
```

This would use NAV instead of gross balance. However, this changes the contract's withdrawal semantics and ERC-4626 behavior, so it should be evaluated as a separate design decision with full testing.

### 12.5 Numeric Example

Vault A (Balanced Core) at day 0, after seed deposits and premium funding:

```
USDC.balanceOf(vault)    = $26,500 ($20,400 seed + $6,100 premiums)
totalDeployedCapital     = $16,320 (80% of $20,400 seed deposit)
totalPendingClaims       = $0
unearnedPremiums         = $6,100 (all premiums unearned at day 0)
accruedFees              = $0
totalAssets (NAV)        = $26,500 - $6,100 - $0 - $0 = $20,400

Contract _availableBuffer() = $26,500 - $16,320 - $0 = $10,180
Frontend freeCapital        = $20,400 - $16,320 - $0 = $4,080

effectiveMaxWithdraw = min($4,080, contract.maxWithdraw)
                     = min($4,080, min(userAssets, $10,180))
```

The frontend shows ~$4,080 available for withdrawal instead of ~$10,180. This prevents investors from withdrawing unearned premiums that belong to the insurance pool.

---

## Appendix: Disagreements Resolved Between Reviewers

| Topic                  | Tim's Position                        | Marco's Position                         | Resolution                                                                                                                                   |
| ---------------------- | ------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `timeOffset` location  | Per-vault on InsuranceVault           | Single on PolicyRegistry                 | **PolicyRegistry** -- avoids time drift between vaults                                                                                       |
| `_decimalsOffset()`    | Returns 12                            | Returns 6                                | **12** -- bridges USDC 6 decimals to share 18 decimals. Produces intuitive 1:1 share/USDC display (deposit $10K = ~10,000 shares at ~$1.00). |
| `addPolicy` + premium  | Bundle into one call                  | Separate `addPolicy` + `depositPremium`  | **Separate** -- different roles (vault manager vs owner/delegatee), cleaner separation. Premium depositor delegation enables third-party funding. |
| `exerciseClaim` caller | Original insurer address              | `ownerOf(receiptId)` (NFT holder)        | **receipt.insurer == msg.sender** -- soulbound NFT (D3), transferability deferred to production                                              |
| Fee circularity        | Snapshot-based (`lastSnapshotAssets`) | Pre-fee basis (`preFeeAssets` parameter) | **Pre-fee basis** -- simpler, no separate snapshot state needed                                                                              |
| Next.js version        | 14                                    | (no opinion)                             | **15** -- Luca recommends latest with App Router                                                                                             |

---

_This document synthesizes reviews from Tim (CTO), Marco (Smart Contract Engineer), and Luca (Fullstack Engineer). Source: `docs/product/hackathon-prototype-design.md` V6._
