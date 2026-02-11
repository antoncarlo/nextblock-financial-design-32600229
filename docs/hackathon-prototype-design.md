# NextBlock Hackathon Prototype -- Product Design Document

**Author**: Alessandro
**Date**: February 5, 2026
**Status**: V6 -- Build-Ready (implementation spec added: totalAssets formula, pre-funded premiums, claim receipt tokens, time offset, state transitions)
**Purpose**: Map actors, money flows, yield mechanics, and all build decisions for the hackathon prototype.

**Demo objective**: Test three concepts:

1. Three types of insurance with different verification models -- the honest story of where blockchain adds value and where it doesn't
2. Vault-based aggregation -- vault managers curate portfolios across all three types
3. Open platform (Morpho-style) where NextBlock is infrastructure and vault managers deploy strategies on top

---

## 1. The Core Question This Document Answers

How does tokenization enable access to insurance yield?

Insurance premiums are paid upfront by policyholders. The "yield" for capital providers comes from premiums collected minus claims paid over time. But who provides the capital that backs the policies? How do outside investors participate? When and how do they earn returns?

This document maps the complete money flow from policyholder premium to investor yield, identifies every actor and their incentive, and defines exactly what the hackathon prototype will build.

---

## 2. Insurance Economics from First Principles

### 2.1 The Traditional Insurance Money Cycle

```
Timeline of a single insurance policy:

T=0  Policyholder pays premium ($1,000) to Insurer
     Insurer adds premium to Capital Pool
     Insurer has obligation: if Event X happens, pay $10,000

T=0 to T=expiry
     Capital sits in pool ("float")
     Insurer invests float for additional return
     Insurer monitors for qualifying events

T=expiry (no claim)
     Policy expires
     Premium is now profit for the insurer
     Capital is freed

T=claim (event occurs before expiry)
     Insurer pays out $10,000 from Capital Pool
     Insurer has net loss of $9,000 ($10K payout - $1K premium)
     Capital pool shrinks
```

**Key insight**: The insurer needs a large Capital Pool to back policies. The premium alone ($1,000) does not cover the potential payout ($10,000). The insurer must have $10,000 AVAILABLE in case of a claim. This is the "underwriting capacity" problem.

### 2.2 Where Does "Yield" Come From?

Yield for capital providers in insurance comes from ONE source:

**Underwriting profit = Premiums collected - Claims paid - Expenses**

Over a portfolio of many policies:

- If you collect $1M in premiums and pay $600K in claims and $100K in expenses, the yield is $300K on whatever capital was required to back those policies.
- If $5M of capital was required to back that portfolio, the yield is $300K / $5M = 6% return on capital.

The "loss ratio" (claims / premiums) determines profitability:

- Loss ratio 60% with 10% expense ratio = 30% underwriting margin
- Loss ratio 90% = barely profitable
- Loss ratio >100% = capital providers lose money

**This is the yield NextBlock investors would earn.** They are NOT lending money. They are NOT earning interest. They are providing underwriting capital and being compensated with a share of premiums for taking on insurance risk.

### 2.3 The Reinsurance Analogy (What NextBlock Actually Does)

NextBlock's model is functionally analogous to a quota share cession facilitated through a marketplace (similar to how Lloyd's of London operates). There are two valid models, used in sequence:

### Model A: In-Force Book Cession (Launch / Hackathon)

The insurer or reinsurer ALREADY has an active portfolio with capital locked against it. They tokenize that existing book, ceding a share of risk and remaining unearned premium to vault investors. The insurer frees up capital to write new business.

```
Insurer has existing in-force book ($50M coverage, policies active)
  -> Cedes 50% via whole-portfolio obligatory quota share
  -> NextBlock tokenizes the cession (each policy = on-chain asset)
  -> Vault investors deposit capital, replacing insurer's locked capital
  -> Insurer frees capital to grow
  -> Vault receives 50% of remaining premium, pays 50% of claims
```

This is called a **"quota share cession of an in-force book"** and is standard practice. Lloyd's syndicates use sidecar vehicles for exactly this. This maps directly to the Klapton RE relationship ($40-50M existing portfolio).

### Model B: Prospective Treaty (Production / Growth Phase)

Once the relationship is proven, the vault pre-commits capacity to risk categories BEFORE new policies are written. The insurer underwrites new policies knowing that 50% will automatically cede to the vault.

```
Vault defines risk appetite ("accept up to $80K parametric weather risk at 6%+")
  -> Insurer writes new policies against pre-committed capacity
  -> Premium and risk flow to vault from day one of each new policy
```

This is a **"prospective quota share treaty"** -- how most ongoing reinsurance relationships work.

### Both Models Coexist at Platform Scale

Different insurers use NextBlock for different purposes. Some cede in-force books (Model A). Others access pre-committed capacity for new business (Model B). Vault managers select from all available tokenized policies regardless of origin. This is how Lloyd's has operated for over three centuries.

### Adverse Selection Protection

To prevent insurers from cherry-picking which policies to cede (keeping profitable ones, dumping bad ones):

- **Whole-portfolio obligatory cession**: The insurer cedes ALL policies in the defined category, not individual selections
- **Insurer retains 50%**: At 50% retention, the cedant still loses money on every bad policy -- incentives stay aligned
- **Vault manager due diligence**: Portfolio-level underwriting audit before accepting cessions
- **On-chain transparency**: Policy-level data visible to all participants, reducing information asymmetry

The investors ARE the reinsurer's balance sheet. Their deposits are the capital that backs insurance policies. Their yield comes from the premiums those policies generate, minus any claims.

### Capital Deployment Model (How Money Flows to the Reinsurer)

The vault does NOT simply hold investor capital in a pool waiting for claims. It actively **deploys** capital to reinsurers via ring-fenced smart contracts. This is what makes the relationship real -- the reinsurer gets usable capital, not a promise.

```
Investor deposits $100K into vault
  |-- $80K (80%) -> Ring-fenced contract with reinsurer
  |     - Reinsurer can draw ONLY for covered claims
  |     - Capital returns to vault at policy expiry (if not consumed by claims)
  |     - Reinsurer gets real deployable capital (their motivation)
  |
  +-- $20K (20%) -> Liquidity buffer (stays in vault)
        - Available for instant investor withdrawals
        - Replenished by: premium income + returning capital from expired policies
        - Buffer ratio managed by vault manager (target 15-20%)
```

**Why reinsurers participate**: The reinsurer's core problem is capital. They have demand for policies but need balance sheet capacity to write them. By deploying investor capital into a ring-fenced contract, the reinsurer can underwrite new policies against that capital. This is their motivation to share premiums.

**Ring-fenced means ring-fenced**: The deployed capital sits in a smart contract with strict draw-down rights. The reinsurer can only withdraw funds to pay covered claims that meet the treaty's terms. They cannot use deployed capital for general operations, investments, or other business lines. At policy expiry, remaining capital automatically returns to the vault.

**How this works for different verification types** (see Section 5 for full taxonomy):

- **Fully on-chain** (e.g., BTC price protection): Claims are verified directly on-chain. The smart contract reads the oracle price and auto-triggers. No human involvement.
- **Oracle-dependent** (e.g., flight delay): A third-party oracle reports the real-world event. The smart contract auto-triggers based on the oracle report.
- **Fully off-chain** (e.g., commercial fire via Klapton RE): Dedicated ring-fenced smart contract. Capital is locked and only released when the insurer submits a verified claim.

**Claims flow**: Claims are paid from the **deployed capital**, NOT from the liquidity buffer. When a claim triggers, the ring-fenced contract releases funds to cover it. The buffer remains intact for investor withdrawals.

**Precedent**: This is how collateralized reinsurance works ($38B market). ILS sidecars, Lloyd's Special Purpose Arrangements (SPAs), and catastrophe bonds all use ring-fenced capital structures where investors' funds are deployed but protected from misuse.

---

## 3. Actors in the System (Three-Layer Architecture)

NextBlock operates as open infrastructure with three distinct layers. No single entity spans all layers. NextBlock itself lives ONLY in Layer 1.

### LAYER 1: Tokenization Infrastructure (NextBlock Protocol)

| Actor                  | Role                        | Provides                                                                                                                                      | Receives                                                      |
| ---------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **NextBlock Protocol** | Tokenization infrastructure | Smart contracts that represent insurance policies as on-chain assets; vault factory for vault managers; settlement and claim processing rails | Protocol fees (small % of TVL or per-policy tokenization fee) |

NextBlock does NOT:

- Originate or underwrite insurance policies
- Decide which policies go into which vault
- Manage investor capital allocation
- Take insurance risk

NextBlock DOES:

- Provide the standard for tokenizing insurance policies on-chain
- Provide a vault factory where vault managers deploy strategies
- Process claim events and settle payouts through smart contracts
- Ensure transparency (all policies, premiums, claims visible on-chain)

### LAYER 2: Supply Side (Insurance Originators) and Curation (Vault Managers)

| Actor                         | Role                       | Provides                                                                                                      | Receives                                                                                 |
| ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Insurer / Risk Originator** | Creates insurance policies | Policies with defined terms (coverage, premium, duration, trigger); underwriting expertise; claims assessment | Fresh capital from vault investors (unlocks growth capacity); retains portion of premium |
| **Vault Manager (Curator)**   | Curates vault strategy     | Selection of which tokenized policies to include; allocation percentages; risk management; rebalancing        | Management fee and/or performance fee from the vault                                     |

Insurers are the SUPPLY SIDE. They have policies that need capital backing. They come to NextBlock to tokenize those policies and make them available to vault managers.

Vault managers are the CURATION LAYER. They are insurance strategy experts (actuaries, reinsurance specialists, DeFi insurance analysts) who build diversified portfolios from the available tokenized policies. Think of them as fund managers whose "securities" are tokenized insurance policies.

At hackathon launch: NextBlock is the only vault manager. But the architecture clearly separates the roles so that third-party vault managers can deploy later.

### LAYER 3: Demand Side (Capital Providers)

| Actor            | Role                      | Provides                                                         | Receives                                                                                                 |
| ---------------- | ------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Investor**     | Capital provider          | Deposits (stablecoins) that back insurance policies in the vault | Vault share token ($ONyc); yield from premiums minus claims minus fees; transparent portfolio visibility |
| **Policyholder** | Buys insurance protection | Premium payment                                                  | Claim payout if trigger event occurs                                                                     |

Note: the Policyholder may not interact with NextBlock at all. They buy insurance from the Insurer. The Insurer then tokenizes the policy through NextBlock. The policyholder may not know or care that their policy is backed by vault investors rather than the insurer's own balance sheet.

### 3.1 Actor Relationship Diagram

```
  Policyholder                                    Investor
  (buys insurance                              (provides capital,
   from insurer)                                earns yield)
       |                                             |
       | pays premium                     deposits $ |
       v                                             v
  +----------+    tokenizes policy    +---------------------+
  | INSURER  | --------------------->|  NEXTBLOCK PROTOCOL  |
  | (risk    |    via NextBlock      |  (Layer 1:           |
  | originator)|   infrastructure    |   tokenization       |
  +----------+                       |   infrastructure)    |
       ^                             +----------+----------+
       |                                        |
       | shares premium                tokenized policies
       | retains partial risk          available as on-chain
       |                               assets
       |                                        |
       |                                        v
       |                             +---------------------+
       |                             |  VAULT MANAGER       |
       |                             |  (Layer 2: curation) |
       |                             |  Selects policies,   |
       |                             |  builds portfolio    |
       |                             +----------+----------+
       |                                        |
       |                               creates vault with
       |                               selected policies
       |                                        |
       |                                        v
       |                             +---------------------+
       +-- claim payout (if event) --| VAULT               |
                                     | Deploys capital to  |
                                     | ring-fenced contracts|
                                     | Retains liquidity   |
                                     | buffer              |
                                     +---------------------+
```

### 3.2 Hackathon Simplification

For the hackathon prototype, the actors map to:

- **NextBlock Protocol**: The smart contracts (tokenization + vault factory + claim processing with three distinct trigger paths)
- **Insurer**: A mock entity or admin wallet that tokenizes existing policies. Pre-loaded policies in the demo represent Model A (in-force book cession). For the on-chain policy (BTC), the claim is permissionless. For the oracle-dependent policy (flight delay), an oracle reporter triggers claims. For the off-chain policy (commercial fire), the insurer admin submits claims manually.
- **Vault Manager**: NextBlock team acts as vault manager A. A second fictional vault manager ("AlphaRe Capital") manages vault B. The demo shows that this role is SEPARATE -- a different address, different permissions, different strategy.
- **Investor**: The primary demo user. Connects wallet, deposits, earns.
- **Policyholder**: Not directly present in the demo. Premiums are pre-funded by admin (MockUSDC deposited into vault at policy registration, simulating UPR transfer from insurer).

---

## 4. Money Flow -- The Complete Picture

### 4.1 Money Flow: What Happens to the Investor's $10,000

The vault is a portfolio of various policies, not a single policy. When the investor deposits, they receive a token ($ONyc) representing their proportional claim on the vault's net asset value (NAV). The NAV = USDC balance - unearned premiums - pending claims - accrued fees. See Section 11.5 for the exact implementation formula.

The token's value can change if a claim is triggered. The 100% realization of the projected yield is only guaranteed at policy expiry (if no claims). Before that, the investor has immediate access to capital in the liquidity buffer but accepts the risk that NAV can decrease due to claims against deployed capital.

#### The Vault at the Moment of Deposit (Vault A: "Balanced Core")

The vault manager has curated a portfolio of 3 tokenized policies, one from each verification category:

| Policy    | What It Insures        | Verification              | Coverage     | Premium     | Duration | Status         |
| --------- | ---------------------- | ------------------------- | ------------ | ----------- | -------- | -------------- |
| P1        | BTC price < $80K       | On-chain (permissionless) | $50,000      | $2,500 (5%) | 90 days  | Active, day 15 |
| P2        | Flight delay > 2hrs    | Oracle-dependent          | $15,000      | $1,200 (8%) | 60 days  | Active, day 10 |
| P3        | Commercial fire damage | Off-chain (insurer)       | $40,000      | $2,400 (6%) | 180 days | Active, day 30 |
| **Total** |                        |                           | **$105,000** | **$6,100**  |          |                |

The vault holds $80,000 total: $64,000 deployed to ring-fenced contracts backing these policies, and $16,000 retained as a liquidity buffer for investor withdrawals. The coverage-to-capital ratio is 131% ($105K coverage / $80K capital).

#### What Happens at Deposit

```
Vault state BEFORE investor deposits:
  Deployed capital (ring-fenced): $64,000  (80% of investor capital, backing policies)
  Liquidity buffer:               $16,000  (20% of investor capital, in vault)
  Premiums accrued:               $1,200   (pro-rata earned over time)
  Claims paid so far:             $0
  Fees accrued:                   -$200
  -----------------------------------------------
  Vault NAV:                      $81,000  (buffer + deployed + premiums - claims - fees)
  Vault shares outstanding:       80,000 $ONyc (issued at $1.00 each)
  Current share price:            $81,000 / 80,000 = $1.0125

Investor deposits $10,000:
  Shares received:                $10,000 / $1.0125 = 9,877 $ONyc
  Of the $10,000: ~$8,000 deployed to ring-fenced contracts, ~$2,000 to buffer

Vault state AFTER deposit:
  Deployed capital (ring-fenced): $72,000
  Liquidity buffer:               $18,000
  Vault NAV:                      $91,000
  Shares outstanding:             89,877 $ONyc
  Share price:                    $91,000 / 89,877 = $1.0125 (unchanged)
```

#### What the Investor's $10,000 is Worth Over Time

**Scenario A: No claims for 90 days**

```
Day 0:   $10,000.00  (deposit)
Day 30:  $10,075.00  (share of premiums earned, net of fees)
Day 60:  $10,152.00  (P2 expired, premium fully earned)
Day 90:  $10,230.00  (P1 expired, premiums fully earned; P3 still active)

Annualized yield: ~9.2%
```

The investor does not receive premiums as a separate payment. The premiums increase the vault's NAV, which increases the share price of $ONyc. The investor realizes this gain when they withdraw (redeem shares for the underlying value).

**Scenario B: One major claim at day 45**

BTC drops below $80K. Policy P1 triggers. Anyone can call `checkClaim()` -- it's permissionless because the price data is on-chain. Claim payout: $50,000.

```
Day 0:   $10,000.00
Day 30:  $10,075.00  (premiums accruing normally)
Day 45:  CLAIM EVENT -- P1 triggers (permissionless verification)
         Vault pays $50,000 claim from deployed capital
         Vault NAV drops by $50,000
         Investor share value drops proportionally
Day 45:  $9,495.00   (-5.05% from peak)
Day 60:  $9,535.00   (P2 + P3 still earning premiums)
Day 90:  $9,605.00   (partial recovery from remaining policy premiums)

Net result: -3.95% over 90 days
Without diversification (only holding P1): -100%
```

**Scenario C: Two claims**

Both BTC crashes (P1: $50K claim) and a fire occurs (P3: $40K claim submitted by insurer).

```
Day 45:  $10,075.00  (before events)
Day 46:  BTC claim: -$50,000 from vault (permissionless trigger)
Day 50:  Fire claim: -$40,000 from vault (insurer submits assessed claim)
         Total claims: $90,000
Day 50:  $8,125.00   (-18.75% from deposit)
```

This is the tail risk. The investor's capital can decrease significantly in a catastrophic scenario. This is the COST of earning insurance yield -- you are being paid to absorb this risk.

#### Investor Expectations Summary

| Question                          | Answer                                                                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How much can I expect from $10K?  | $600-$1,200/year (6-12% APY) depending on vault strategy and loss ratio                                                                                          |
| By when?                          | Yield accrues continuously but only becomes certain as policies expire without claims                                                                            |
| Is my capital locked?             | No hard lock. Soft lock via liquidity buffer (see Section 4.3). Can exit anytime at current NAV from buffer, or sell shares on secondary market.                 |
| Do I get the premium immediately? | Premium increases vault NAV over time (linear accrual), but it is "at risk" until policy expires. You capture it via rising share price, not a separate payment. |

### 4.2 Timeline of Money Movements

```
T=0 (Vault Launch)
|-- Vault manager deploys vault via NextBlock factory
|-- Vault manager selects tokenized policies from marketplace
|-- Investors deposit capital into vault
|-- ~80% of capital deployed to reinsurer ring-fenced contracts
+-- ~20% retained in vault as liquidity buffer

T=1 (Policies Active)
|-- Capital is deployed -- reinsurer uses it to back policies
|-- Premiums are in the vault (pre-funded at policy registration as UPR transfer)
|-- IMPORTANT: Premium is received but NOT yet "earned"
|   (it is earned pro-rata over the policy duration as a function of TIME,
|    regardless of whether claims occur. Claims are a separate expense line.)
|-- Claims paid from deployed capital in ring-fenced contracts (NOT from buffer)
+-- Investor can see "projected yield" but actual yield depends on claims

T=1 to T=expiry (Active Period -- staggered across policies)
|-- Premium is "earned" pro-rata over time
|-- Different policies expire at different times (rolling yield)
|-- As each policy expires, its premium is fully earned (regardless of claims)
|-- Deployed capital returns from ring-fenced contracts as policies expire
|-- Vault manager redeploys returned capital to new policies or holds in buffer
|-- If claim event occurs: payout from deployed capital, NAV drops
+-- Investor sees yield accruing (or losses from claims)

T=expiry (Individual Policy Expires)
|-- Full premium is now earned (regardless of whether claims occurred)
|-- Risk obligation is extinguished -- deployed capital returns to vault
|-- Vault manager redeploys returned capital to new policies (rolling)
+-- Or capital flows to liquidity buffer for withdrawals
```

### 4.3 Early Exit: What Happens When an Investor Wants Out

#### The Core Tension

Investor capital is not sitting idle in the vault -- it is **deployed** to reinsurers via ring-fenced contracts. Of a $91K vault, ~$72K is deployed and only ~$18K sits in the liquidity buffer. This means the vault cannot return all investor capital on demand.

This is fundamentally different from a lending protocol where capital can be recalled. Deployed capital is locked in ring-fenced contracts until policies expire or claims consume it. The vault manager must balance capital deployment (which generates yield) against liquidity needs (which enables withdrawals).

**This is an honest trade-off, not a bug.** Investors earn 8-16% APY precisely because their capital is deployed and at risk. Higher liquidity = lower yield. Cat bonds lock capital for 3-7 years. NextBlock offers significantly better liquidity than that, but it is not instant-access like a savings account.

#### Solution: Three Liquidity Mechanisms

**Mechanism 1: Vault Liquidity Buffer (instant, limited)**

The vault retains a portion of capital as a liquidity reserve -- not deployed to any reinsurer. This reserve allows instant withdrawals up to the buffer size.

```
Vault NAV:                      $91,000
Deployed to reinsurers:         $72,000  (80%, in ring-fenced contracts)
Liquidity buffer:               $18,000  (20%, available for instant withdrawal)
Buffer ratio:                   20%

Investor with $10,000 wants to withdraw:
  If buffer >= withdrawal amount:
    Instant redemption at current NAV per share
    Buffer decreases, vault manager may adjust deployment ratio

  If buffer < withdrawal amount:
    Partial instant redemption (up to buffer)
    Remainder enters redemption queue (Mechanism 3)
```

The vault manager sets the target buffer ratio. Higher buffer = more liquidity but lower yield (buffer capital earns nothing). A 15-20% buffer is the target range. The buffer is continuously replenished by premium income and capital returning from expired policies.

In production, vaults would also implement **redemption gates** -- hard limits on the percentage of NAV that can be withdrawn in any single period (typically 10-25% per quarter in ILS funds). This prevents a run on the vault if multiple investors panic simultaneously after a major loss event.

**Mechanism 2: Secondary Market for Vault Shares (instant, market-priced)**

The vault share token ($ONyc) is a standard ERC-20 token. It can be sold to another party at any time. This is the 24/7 liquidity mechanism and the **primary exit route** when the buffer is depleted.

```
Scenario: Investor wants to exit during an active claim event

  Current NAV per share:        $1.0125
  Market is nervous about a pending BTC crash

  Buyer offers:                 $0.98 per share (3.2% discount)
  Seller accepts, sells 9,877 $ONyc for $9,679

  Seller gets: $9,679 (took a small loss for instant exit)
  Buyer gets: 9,877 shares at a discount (potential upside if no claim)
  Vault: unaffected. Deployed capital stays in ring-fenced contracts. Only ownership changed.
```

This creates an interesting dynamic:

- During calm periods: shares trade near NAV (small discount)
- During claim events: shares trade at a larger discount (fear pricing)
- After claim events resolve: shares recover toward NAV
- Sophisticated investors buy discounted shares during fear

**Mechanism 3: Redemption Queue (delayed, guaranteed)**

If the buffer is empty and the investor cannot or does not want to sell on the secondary market, redemptions enter a FIFO queue. The queue fills as policies expire and deployed capital returns to the vault.

```
Scenario: Buffer depleted, investor requests $50K withdrawal

  Buffer available:             $0
  Next policy expiry:           20 days (P2: Flight Delay, $15K coverage)
  Following expiry:             45 days (P1: BTC Protection, $50K coverage)

  Redemption queue position:    #1
  Estimated fill timeline:      partial fill in 20 days, remainder in 45 days
  Status:                       QUEUED -- fills as policies expire (FIFO)
```

The redemption queue is the safety net. It guarantees that investors can eventually exit, but with a delay tied to the vault's policy maturity schedule.

**Honest framing**: In a severe scenario (multiple claims depleting capital + fear driving secondary market discounts + buffer empty), an investor may face: (a) waiting weeks for the queue to fill, (b) selling at a 10-20% discount on the secondary market, or (c) accepting partial redemption. This is the cost of earning insurance yield. Historical context: even in the worst ILS years (2017-2018 hurricane seasons), secondary market discounts peaked at 15-20% and recovered within 6-12 months.

**For the hackathon prototype**: Implement Mechanism 1 (liquidity buffer) -- simple withdrawal at NAV from the buffer. Mention Mechanisms 2 and 3 in the presentation as the production liquidity model.

### 4.4 Staggered Expiry and Rolling Yield

A well-designed vault does NOT hold policies that all expire on the same date. Instead, the vault manager curates a portfolio with staggered expiry dates, creating a continuous flow of earned premiums.

```
Vault A Policy Timeline (3 policies, staggered):

Month:  1    2    3    4    5    6
P2:     |====|====|  (expires month 2 -- Flight Delay, 60 days)
P1:     |====|====|====|  (expires month 3 -- BTC Protection, 90 days)
P3:     |====|====|====|====|====|====|  (expires month 6 -- Commercial Fire, 180 days)

Result: capital returns at month 2 (P2), month 3 (P1), and month 6 (P3).
Premiums accrue continuously across all three.
```

#### Why This Matters for Investors

1. **Predictable, steady yield**: Instead of waiting 6 months for a payout, the investor sees vault NAV increasing continuously as premiums accrue and policies expire.

2. **Natural liquidity creation**: When P2 expires in month 2, the capital that was backing P2 is freed. The vault manager can either:
   - Allocate it to a new policy (rolling the portfolio forward)
   - Keep it in the liquidity buffer (enabling withdrawals)

3. **Risk smoothing**: Not all policies are exposed to the same time-window of risk. A BTC crash in month 1 affects P1 but P2 (flight delay) and P3 (fire) are independent risks.

4. **Portfolio maturity profile**: The vault manager can describe the portfolio as having an "average duration" -- similar to how bond funds describe their duration. Shorter average duration = more liquid, lower yield. Longer = less liquid, higher yield.

5. **Risk concentration caveat**: As short-term policies expire, the vault may become more concentrated in remaining longer-term policies. Good vault managers actively source new short-term policies to maintain diversification. Without rebalancing, the portfolio's risk profile drifts over time.

#### For the Hackathon

Suggested visualization:

```
  +---------------------------------------------+
  |  Vault Policy Timeline                       |
  |                                              |
  |  Flight Delay    ||||____  exp: 20 days      |
  |    oracle-dependent                          |
  |  BTC Protection  ||||||||__  exp: 45 days    |
  |    on-chain                                  |
  |  Commercial Fire ||||||||||||||||__  exp: 120d|
  |    off-chain                                 |
  |                                              |
  |  ^ Today                                     |
  |  Next expiry: Flight Delay (20 days)         |
  |  Premium releasing: $1,200                   |
  +---------------------------------------------+
```

### 4.5 Money Flow Diagram -- All Parties (with Ring-Fenced Deployment)

```
Investor deposits -----------------------> Vault
                                              |
                                  +-----------+-----------+
                                  |                       |
                                  v                       v
                        80% Deployed capital        20% Liquidity buffer
                        (ring-fenced contracts)     (stays in vault)
                                  |                       |
                                  |                  Available for
                                  |                  instant withdrawals
                                  |
                       +----------+----------+
                       |                     |
                       v                     v
                 Reinsurer uses         Claims paid from
                 capital to back        deployed capital
                 new policies           (if event triggers)
                       |
                       v
                 Premiums flow back ----------------> Vault
                 from reinsurer                         |
                                         +--------------+-----------+
                                         |              |           |
                                         v              v           v
                                   NextBlock fee  Vault Mgr    Net yield
                                   (protocol,    fee (mgmt +   accrues to
                                   0.1-0.3%      performance)  NAV -> investors
                                   of TVL)

At policy expiry (no claims):
  Deployed capital returns from ring-fenced contract -> vault
  Vault manager redeploys to new policies or holds in buffer

At policy expiry (claims occurred):
  Remaining deployed capital (after claims) returns -> vault
  Claim amounts already paid out from deployed capital
```

### 4.6 Liquidity Risk and Mitigation

Liquidity is the most common investor concern. The five-layer liquidity stack below is designed to handle scenarios from normal operations to severe stress:

**Layer 1: Liquidity Buffer (15-20% of vault)**

- Instant withdrawals up to buffer size
- Replenished continuously by premium income and returning deployed capital
- First line of defense; handles >90% of withdrawal requests in normal conditions

**Layer 2: Staggered Policy Expiry**

- Vault manager curates policies with different maturity dates (see Section 4.4)
- Capital returns to vault regularly as policies expire
- A well-managed vault has capital returning every 2-4 weeks

**Layer 3: Secondary Market ($ONyc Trading)**

- Investors can sell vault shares to other investors at any time
- No impact on vault capital -- only ownership changes
- Market pricing provides instant exit at fair (or discounted) value

**Layer 4: Protocol-Owned Liquidity (Production)**

- NextBlock maintains a protocol-owned liquidity pool for $ONyc pairs
- Acts as buyer of last resort at a defined discount (e.g., 5% below NAV)
- Funded by protocol treasury / NXB staking revenue

**Layer 5: Redemption Queue (Last Resort)**

- FIFO queue for redemptions when buffer is empty
- Fills as policies expire and capital returns
- Guaranteed exit, but with delay tied to policy maturity schedule

**The "Nobody Wants to Buy" Scenario**

In a severe catastrophe year (multiple correlated claims + market panic), it is possible that:

- Buffer is depleted by early withdrawals
- Secondary market has no buyers (or only at steep discounts)
- Redemption queue grows as investors try to exit simultaneously

This is a real risk, not a theoretical one. In 2017-2018, ILS funds experienced exactly this after Hurricanes Harvey, Irma, and Maria. Secondary market discounts reached 15-20%, and some funds gated redemptions for 6-12 months.

**How NextBlock mitigates this**: Parametric and DeFi policies (our launch focus) have short durations (30-180 days) and binary outcomes. Capital returns quickly. A vault with 90-day average policy duration would see most deployed capital return within one quarter, naturally filling the redemption queue. This is structurally better than cat bonds (3-7 year lock) or traditional ILS funds (annual liquidity windows).

**Honest investor communication**: "Your capital earns 8-16% because it is deployed and at risk. In normal conditions, you can exit in seconds via the buffer or secondary market. In stressed conditions, exits may take weeks and may involve a discount. This is the trade-off for earning insurance yield."

---

## 5. The Morpho-Style Architecture and Verification Taxonomy

### 5.1 Three-Layer Architecture

NextBlock is NOT a vault. NextBlock is infrastructure that enables anyone to create insurance yield vaults.

### 5.2 Policy Verification Taxonomy (Core Demo Concept)

The hackathon organizes policies by **verification mechanism**, not by insurance category. This is the honest story of where blockchain adds value and where it doesn't.

| Category                         | Verification                                                                        | Example Sources                                 | Strength                             | Limitation                                  |
| -------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------ | ------------------------------------------- |
| **1. Fully on-chain**            | Trigger condition verifiable directly on-chain (price feeds, smart contract state)  | Nexus Mutual-style, DeFi covers                 | Trustless, instant, no oracle needed | Limited to crypto-native events             |
| **2. Oracle-dependent (hybrid)** | Real-world event verified via 3rd party oracle (Chainlink, weather API, flight API) | Parametric weather, flight delay, earthquake    | Automatable, binary payout           | Oracle trust assumption, data availability  |
| **3. Fully off-chain**           | Claims assessed manually by insurer, tokenized representation only                  | Klapton RE-style (surety, D&O, liability, fire) | Covers any real-world risk           | Not trustless, manual verification, slowest |

**The educational story**: "For crypto policies, anyone can verify. For weather and flights, we trust the oracle. For traditional insurance, we trust the insurer. NextBlock aggregates all three."

This framing is more honest and educational than organizing by insurance category. It shows NextBlock as an aggregator across the full spectrum while being transparent about where blockchain adds value and where it doesn't.

### 5.3 How the Three Trigger Mechanisms Differ in the Smart Contract

This is the most interesting technical detail -- each category has a different `triggerClaim` pathway:

```
Category 1 (On-chain):     ANYONE can call checkClaim() -> reads oracle price -> auto-triggers
Category 2 (Oracle-dep):   ORACLE_REPORTER calls reportEvent() -> auto-triggers linked policies
Category 3 (Off-chain):    INSURER_ADMIN calls submitClaim(amount) -> manual, permissioned only
```

**Key insight**: In the smart contracts, the underlying claim processing is similar. The difference is WHO can trigger the claim and HOW the trigger condition is verified. This maps directly to access control in the contracts:

- P1: No access restriction on trigger -- anyone calls `checkClaim()`, contract verifies price. Binary: full coverage payout ($50K).
- P2: `ORACLE_REPORTER` role required -- only the designated oracle reporter can call `reportEvent()`. Binary: full coverage payout ($15K).
- P3: `INSURER_ADMIN` role required -- only the insurer can call `submitClaim(amount)`. Partial claims allowed (insurer specifies assessed amount up to coverage).

**Claim receipt flow**: When a claim triggers (via any path), the vault mints a **ClaimReceipt token** to the insurer. This token represents the insurer's right to withdraw the claim amount from the vault. The insurer calls `exerciseClaim(receiptId)` to pull USDC. This two-step flow (trigger → exercise) mirrors real ring-fenced capital draw-down rights. See Section 11.5 for full mechanics.

**Post-claim policy state**: After a claim triggers, the policy status becomes CLAIMED and premium accrual stops. For P1/P2 (binary), the policy is fully consumed. For P3 (partial claim amount), the policy is also fully consumed (`claimed = true`) -- remaining coverage is forfeited. Single claim per policy for the hackathon.

### 5.4 Architecture Diagram (Updated for 3 Policies)

```
+-----------------------------------------------------------+
|  LAYER 1: TOKENIZATION (NextBlock Protocol)                |
|                                                            |
|  Tokenized Policies (the "marketplace"):                   |
|  +----------------+ +----------------+ +-----------------+ |
|  | P1: BTC Price  | | P2: Flight     | | P3: Commercial  | |
|  | Protection     | | Delay          | | Fire            | |
|  | $50K / 5%      | | $15K / 8%      | | $40K / 6%       | |
|  | ON-CHAIN       | | ORACLE-DEP     | | OFF-CHAIN       | |
|  | 90 days        | | 60 days        | | 180 days        | |
|  +----------------+ +----------------+ +-----------------+ |
|                                                            |
|  Any insurer can tokenize policies through NextBlock.      |
|  Each policy is an on-chain asset with transparent         |
|  terms and its verification type clearly labeled.          |
+------------------------------------------------------------+
|  LAYER 2: CURATION (Vault Managers)                        |
|                                                            |
|  +----------------------+  +---------------------------+   |
|  | VAULT A               |  | VAULT B                   |  |
|  | "Balanced Core"       |  | "DeFi Alpha"              |  |
|  | Manager: NextBlock    |  | Manager: AlphaRe Capital  |  |
|  |                       |  |                            |  |
|  | Holds: ALL 3 types    |  | Holds: P1 + P2 only       |  |
|  |  P1: BTC (on-chain)   |  |  P1: BTC (on-chain)       |  |
|  |  P2: Flight (oracle)  |  |  P2: Flight (oracle)      |  |
|  |  P3: Fire (off-chain) |  |                            |  |
|  |                       |  | Thesis: "Only trust        |  |
|  | Diversified across    |  | on-chain and oracle-       |  |
|  | all verification types|  | verified claims"           |  |
|  |                       |  |                            |  |
|  | Expected APY: 8-12%   |  | Expected APY: 10-14%      |  |
|  | Risk: Moderate        |  | Risk: Higher concentration |  |
|  | Fee: 0.5% mgmt        |  | Fee: 1% mgmt              |  |
|  +----------------------+  +---------------------------+   |
|                                                            |
|  Each vault manager selects and allocates independently.   |
|  Same tokenized policies can appear in multiple vaults.    |
+------------------------------------------------------------+
|  LAYER 3: INVESTORS                                        |
|                                                            |
|  Investors choose which vault to deposit into based on:    |
|  - Vault manager reputation and strategy                   |
|  - Verification type coverage (all 3 vs automated-only)    |
|  - Risk/return profile                                     |
|  - Fees                                                    |
|                                                            |
|  Each vault issues its own share token.                    |
|  Vault A: $ONyc-A    Vault B: $ONyc-B                     |
+------------------------------------------------------------+
```

### 5.5 Why This Matters (The Pitch to Judges)

**Without the vault manager model**: NextBlock is one team managing one vault. It scales linearly with the NextBlock team's capacity. It is a product.

**With the vault manager model**: NextBlock is a platform. Third-party experts deploy strategies. It scales with the number of vault managers. Each new manager brings their own expertise, their own investors, their own distribution channels. NextBlock captures fees on all of it.

This is the difference between being Yearn (one team, one set of strategies) and being Morpho (open infrastructure, unlimited strategies).

**The Lloyd's of London analogy**: This architecture maps almost exactly to Lloyd's -- a 337-year-old marketplace where multiple syndicates (vault managers), each with their own managing agent and risk appetite, compete to underwrite risks presented in a common marketplace. External capital providers ("Names") choose which syndicates to back. Lloyd's provides the infrastructure, rules, and settlement. "We are building the Lloyd's of London for tokenized insurance" is a powerful positioning statement for the pitch.

| NextBlock          | Lloyd's of London                  |
| ------------------ | ---------------------------------- |
| NextBlock Protocol | Lloyd's marketplace + settlement   |
| Policy Marketplace | Lloyd's "slip" market              |
| Vault Manager      | Managing agent running a syndicate |
| Vault              | A Lloyd's syndicate                |
| Investor           | A "Name" providing capital         |

For a hackathon pitch, this transforms the narrative from:
"We built a yield vault" (incremental)
to:
"We built the infrastructure for a new asset class" (platform)

**The verification type contrast adds a second narrative layer**: Vault B (DeFi Alpha) deliberately excludes off-chain policies -- the vault manager's thesis is "only trust on-chain and oracle-verified claims." This shows that different managers have different risk philosophies about verification trust, which IS the platform story.

### 5.6 Hackathon Implementation

**Must have**:

1. Three policies from the marketplace, each with a distinct verification type and trigger mechanism
2. Two vaults with different strategies (Balanced Core: all 3, DeFi Alpha: P1+P2 only)
3. A vault detail page showing: who the vault manager is, strategy, which policies they selected, verification type labels
4. Investor deposit flow works on both vaults
5. Three different claim trigger paths visible in the admin panel

**Nice to have (if time permits)**: 6. A "Create Vault" flow on the admin page where a vault manager selects policies from the pool and sets allocations 7. Different fee structures per vault

**Skip for hackathon**:

- Vault manager reputation/track record system
- Vault manager staking/skin-in-the-game requirements
- Permissionless vault creation

### 5.7 Vault Manager Personas for the Hackathon

**Vault Manager A: "NextBlock Core Team"**

- Strategy: Diversified across all verification types
- Holds: P1 (on-chain) + P2 (oracle) + P3 (off-chain)
- Allocation weights: P1 40%, P2 20%, P3 40% (set by vault manager at addPolicy)
- Buffer ratio: 20% deployed / 80% buffer target
- Fees: 0.5% annual management fee (no performance fee for hackathon)
- Target: Conservative investors who want full spectrum coverage
- Tagline: "Full-spectrum insurance diversification, steady yield"

**Vault Manager B: "AlphaRe Capital" (fictional)**

- Strategy: Automated-only, excludes off-chain verification
- Holds: P1 (on-chain) + P2 (oracle) only
- Allocation weights: P1 60%, P2 40% (set by vault manager at addPolicy)
- Buffer ratio: 15% buffer / 85% deployed (slightly less buffer, higher yield)
- Fees: 1% annual management fee (no performance fee for hackathon)
- Target: Crypto-native investors who only trust automated verification
- Tagline: "Only automated claims. No human in the loop."

The contrast between these two vaults demonstrates the PLATFORM value. Same infrastructure, same tokenized policies, different strategies, different verification trust philosophies. The investor chooses. NextBlock wins either way.

---

## 6. Yield Mechanics -- How Investors Actually Earn

### 6.1 The Yield Formula

```
Investor Yield = (Premiums Earned * Cession Share) - Claims Paid - Fees
                 -------------------------------------------------------
                              Capital Deposited

Where:
  Premiums Earned = total premiums from policies that have expired or
                    pro-rata earned portion of active policies
  Cession Share   = % of premiums that flow to the vault (100% for hackathon)
  Claims Paid     = payouts triggered during the period
  Fees            = NextBlock protocol fee + vault manager fee
  Capital         = total investor deposits backing the policies
```

### 6.2 How Investors Receive Yield

#### For the Hackathon: NAV Accrual

The vault share token ($ONyc) increases in value as premiums are earned pro-rata over time. Premium earning is a function of time passing, NOT of claims not occurring. Claims are a separate deduction from NAV when they happen.

```
Investor deposits $10,000, receives 9,877 $ONyc at $1.0125/share

Month 1: Premiums earned, no claims
  Share price: $1.0125 -> $1.0200
  Investor position: 9,877 * $1.0200 = $10,075

Month 2: P2 expires, flight delay premium fully earned, no claims
  Share price: $1.0200 -> $1.0280
  Investor position: 9,877 * $1.0280 = $10,154

Month 3: P1 expires, BTC premium fully earned, P3 still active
  Share price: $1.0280 -> $1.0360
  Investor position: 9,877 * $1.0360 = $10,233
```

The investor's yield is captured entirely in the share price. To realize the yield, they withdraw (burn shares, receive stablecoins at current NAV). This is the simplest mechanism and the right choice for the hackathon.

#### For Production (Mentioned in Presentation): Dividend Model

In the full product, as staggered policies expire and premiums are fully earned, the vault distributes earned yield periodically:

```
Monthly cycle:
  1. Policies that expired this month: premiums fully earned
  2. Subtract claims paid this month
  3. Subtract fees
  4. Net earned premium = distributable yield
  5. Distribute pro-rata to all $ONyc holders

Example:
  Month 2: Flight Delay expires
  Premiums earned: $1,200
  Claims paid: $0
  Fees: $180
  Distributable: $1,020

  Investor holds 10.99% of vault
  Investor receives: $112.10 USDC as dividend
```

This creates the "insurance dividend" narrative -- like a bond coupon, but backed by insurance premiums.

#### Why NOT PT/YT for the Hackathon

PT/YT adds enormous complexity (two additional token contracts, pricing model, AMM pool, user education). The dividend model achieves 80% of the same investor benefit with 20% of the complexity. PT/YT can be added as V2 for sophisticated investors who want to trade yield exposure separately.

### 6.3 Capital Deployment Ratio

The vault manager's most important lever is the **deployment ratio** -- how much capital is deployed to ring-fenced contracts vs. held in the liquidity buffer.

```
Deployment ratio = Deployed capital / Total vault capital

Higher deployment (90%) = More capital earning yield, less buffer
Lower deployment (75%)  = Less capital earning yield, more buffer
```

**The yield drag trade-off**: Every 1% of capital held in the buffer instead of deployed represents ~0.05-0.10% yield reduction (buffer capital earns nothing while deployed capital earns insurance premiums). A vault manager targeting 80% deployment vs 90% deployment sacrifices ~0.5-1.0% APY for the additional liquidity cushion.

| Deployment Ratio | Buffer | Yield Impact       | Liquidity                               |
| ---------------- | ------ | ------------------ | --------------------------------------- |
| 90%              | 10%    | Maximum yield      | Low buffer, relies on secondary market  |
| 80%              | 20%    | ~0.5-1% yield drag | Standard, handles most withdrawal needs |
| 70%              | 30%    | ~1-2% yield drag   | Conservative, high liquidity            |

The vault manager optimizes this dynamically. During calm periods with low withdrawal demand, they can increase deployment. During hurricane season or market stress, they may reduce deployment to build a larger buffer. This is a core differentiator between vault managers (see Section 5.7).

**For the hackathon**: Vault A targets 80% deployment (20% buffer). Vault B targets 85% deployment (15% buffer).

### 6.4 Yield Scenario Table (For Demo)

Note: Loss ratios vary significantly by line of business and verification type. On-chain DeFi policies tend to have lower loss ratios (5-15%). Oracle-dependent parametric policies run 20-50%. Off-chain traditional lines run 55-75%.

| Scenario                         | Premiums | Claims        | Net           | Yield on $80K Capital |
| -------------------------------- | -------- | ------------- | ------------- | --------------------- |
| Best case (no claims)            | $6,100   | $0            | $6,100        | 7.6% annualized       |
| Expected (20-30% loss ratio)     | $6,100   | $1,200-$1,800 | $4,300-$4,900 | 5.4-6.1% annualized   |
| Moderate claims (50% loss ratio) | $6,100   | $3,050        | $3,050        | 3.8% annualized       |
| Heavy claims (one major)         | $6,100   | $50,000       | -$43,900      | Capital loss          |
| Catastrophic (two major claims)  | $6,100   | $90,000       | -$83,900      | Severe capital loss   |

Note: With only 3 policies, concentration risk is higher than a production vault with 10-20 policies. A single major claim has a larger proportional impact. This is acceptable for the hackathon demo because it makes the claim event MORE dramatic and visible.

---

## 7. User Journeys and Frontend for the Hackathon Prototype

### 7.1 Frontend: 3 Pages + Inline Sidebar (Morpho-style)

**Page 1: Vault Discovery**

- List of all available vaults (2 cards: Balanced Core + DeFi Alpha)
- Each card: vault name, manager, APY, risk level, policy count, TVL, verification types included
- Below or alongside: user's open vault positions (if wallet connected)
- First impression -- must be polished

**Page 2: Vault Detail**

- Policy breakdown with verification type labels (subtle: "on-chain" / "oracle" / "off-chain")
- Allocation weights per policy
- Premium rates, expiry timelines
- Deployment ratio visualization (80% deployed / 20% buffer)
- Fee structure
- Yield accrual / NAV performance
- Deposit/Withdraw inline sidebar on the right side (Morpho-style)
- The "I can see exactly what my money backs" moment

**Inline Sidebar: Deposit / Withdraw (on Vault Detail page)**

- Right-side panel always visible (Morpho-style), not a modal overlay
- Enter amount, see share calculation
- Confirm transaction
- Post-deposit confirmation: "Your $1,000 is backing N insurance policies"
- Withdraw tab (integrated): shows available buffer, processes redemption

**Page 3: Admin / Curator (combined)**

- Section 1 -- Vault Management: Create vault, select policies from available pool, set allocations, set fees, assign manager
- Section 2 -- Simulation Controls: Advance time (fast-forward for premium accrual), trigger claim events per policy type (BTC crash = permissionless, flight delay = oracle report, fire = insurer assessment), reset events for demo replay
- Policies shown here in context of the available pool for curators to select from

**Frontend Stack**: Next.js + wagmi/viem + Tailwind CSS

### 7.2 Journey 1: The Investor (Primary Demo)

```
STEP 1: DISCOVERY
  User lands on NextBlock dashboard
  Sees: "Insurance-Backed Yield Vaults"
  Sees: Two vaults with different strategies:
    - Vault A (Balanced Core): ~8-12% APY, moderate risk, all 3 verification types
    - Vault B (DeFi Alpha): ~10-14% APY, higher risk, automated-only

STEP 2: UNDERSTANDING
  User clicks into Vault A detail
  Sees: Breakdown of what the vault holds, organized by verification type:
    +---------------------------------------------+
    |  Vault A: "Balanced Core"                    |
    |  Managed by: NextBlock Core Team             |
    |                                              |
    |  ON-CHAIN                                    |
    |  -- BTC Price Protection  | $50K | 5% prem   |
    |     Anyone can verify. Trustless.            |
    |                                              |
    |  ORACLE-DEPENDENT                            |
    |  -- Flight Delay Pool     | $15K | 8% prem   |
    |     Verified by FlightAware oracle.          |
    |                                              |
    |  OFF-CHAIN                                   |
    |  -- Commercial Fire       | $40K | 6% prem   |
    |     Insurer assesses and reports claim.       |
    |                                              |
    |  Blended Premium Rate: 5.8%                  |
    |  Net Expected Yield: ~8-12% APY              |
    |  Manager Fee: 0.5% annual                    |
    +---------------------------------------------+

  User understands: "My money backs these policies. I earn the premiums.
  Each one is verified differently."

STEP 3: DEPOSIT
  User connects wallet
  User deposits $1,000 USDC into Vault A
  Receives vault shares ($ONyc-A tokens)
  Sees: "Your capital is backing 3 insurance policies across
  on-chain, oracle, and off-chain verification"

STEP 4: YIELD ACCRUAL (accelerated for demo)
  Dashboard shows yield ticking up as time advances
  Policy timeline shows which policies are expiring next
  Capital deployment visualization:
    +------------------------------------+
    | Your $1,000                         |
    | ████████████████████_____  80% deployed |
    | _____                     20% buffer    |
    +------------------------------------+
  "Premium Earned: $0.12... $0.24... $0.36..."

STEP 5: CLAIM EVENT (the demo climax)
  Three different trigger mechanisms demonstrated:

  Option A -- On-chain claim (BTC crash):
    Admin sets BTC price to $75K in oracle panel.
    ANYONE (even the investor) clicks "Check Claim" -- permissionless.
    Contract reads price, auto-triggers.
    Dashboard: "BTC Price Protection: CLAIM TRIGGERED"
    "Verified: on-chain. No human decided this."

  Option B -- Oracle-dependent claim (flight delay):
    Admin clicks "Report: Flight LH441 delayed 3 hours"
    Oracle reporter role triggers the claim.
    Dashboard: "Flight Delay: CLAIM TRIGGERED"
    "Verified: oracle report. Automated but requires trusted data source."

  Option C -- Off-chain claim (commercial fire):
    Admin clicks "Insurer Report: Fire at warehouse, $35K assessed"
    Only insurer admin can submit this claim.
    Dashboard: "Commercial Fire: CLAIM TRIGGERED"
    "Verified: insurer assessment. Manual, not trustless."

  After any claim:
    - Claim paid from deployed capital (buffer unchanged)
    - Impact on Vault A: NAV drops proportionally
    - Impact on Vault B: depends on whether it holds that policy
    - "Without diversification, this claim would have caused -100% loss"

  Other policies continue earning premiums. Vault recovers over time.

STEP 6: WITHDRAWAL
  User withdraws (original + net yield after claim)
  Burns $ONyc-A tokens, receives USDC from liquidity buffer
```

### 7.3 Journey 2: Claim Event Comparison (The "Aha" Moment)

The shared policy P1 (BTC Protection) is in BOTH vaults. When BTC crashes:

```
Vault A (Balanced Core): Holds P1 + P2 + P3
  P1 claim: $50K
  Vault A total coverage: $105K
  Impact: significant but buffered by P2 + P3 still earning

Vault B (DeFi Alpha): Holds P1 + P2 only
  P1 claim: $50K
  Vault B total coverage: $65K
  Impact: MORE significant (higher concentration in P1)

KEY VISUAL: "Same claim. Different impact. Different strategy."
This IS the platform story -- vault managers have different philosophies.
```

### 7.4 Journey 3: Admin / Curator Demo (30-second interlude)

```
Demo presenter switches to Admin page:
  "Now let me show you the curator's view."

  Section 1: Available policy pool (all 3 policies with verification labels)
  Section 2: Vault management (create vault, select policies, set allocations)
  Section 3: Simulation controls:
    - "Advance time 30 days" button
    - "Set BTC price to $75K" (on-chain trigger)
    - "Report: Flight delayed" (oracle trigger)
    - "Submit: Fire claim $35K" (insurer trigger)
    - "Reset all events" (for demo replay)

  This page shows NextBlock as infrastructure:
  "Any vault manager can build a strategy from these building blocks."
```

### 7.5 Demo Narrative (5 minutes)

```
0:00-0:30  Context: "Insurance is a $16T market. $300B+ in capital is locked.
            Investors can't access Cat Bond returns without $100K+ and 3-year lock."

0:30-1:00  Screen 1: "NextBlock is infrastructure. Two vault managers,
            two different strategies, same policy marketplace. One trusts all
            verification types. The other only trusts automated claims."

1:00-2:00  Screen 2+Sidebar: "Maria, a family office CIO, picks Vault A. She deposits
            $10K. Her capital backs 3 insurance policies -- on-chain crypto protection,
            oracle-verified flight delay, and traditional fire insurance. 80% deployed,
            20% liquidity buffer."

2:00-3:30  Screen 2: "Fast forward 30 days. Premiums accrue. Yield ticks up.
            Then... BTC crashes to $75K. [TRIGGER CLAIM -- anyone can verify!]
            BTC Protection triggers. Vault A loses X%. Vault B loses Y%.
            Different allocation = different impact. But the other policies keep
            earning. This IS insurance yield -- diversification protects you."

3:30-4:15  Screen 3: "This is the curator's view. Three types of insurance,
            three verification mechanisms. On-chain: trustless. Oracle: automated
            but requires data source. Off-chain: manual but covers any real-world
            risk. NextBlock aggregates all three."

4:15-5:00  Close: "We are building the Lloyd's of London for tokenized insurance.
            Open infrastructure where any vault manager can build a strategy.
            Production: ERC-3643 compliance for bank distribution, PT/YT for
            30-second liquidity, 10-20 pools across DeFi, parametric, and
            reinsurance."
```

---

## 8. The Off-Chain Insurance Tokenization Flow (Commercial Fire / Klapton)

### 8.1 What Off-Chain Tokenization Represents

Policy P3 (Commercial Fire) represents the off-chain verification category. In production, this is how traditional insurance from Klapton RE would work -- the insurer has an existing portfolio, tokenizes it through NextBlock, and claims are assessed manually by the insurer.

The key difference from P1 and P2: there is NO oracle involved. The insurer (admin) directly approves the claim after manual assessment. In the contract, only the `INSURER_ADMIN` address can trigger this claim -- not permissionless, not oracle-driven. This IS the limitation being demonstrated.

### 8.2 Money Flow for Off-Chain Tokenization (Model A: In-Force Cession)

```
BEFORE TOKENIZATION:
  Insurer holds 100% of risk and 100% of premium
  Insurer's capital is LOCKED backing these policies

AFTER TOKENIZATION (quota share cession of in-force book):
  Insurer retains 50% of risk, gets 50% of remaining unearned premium
  Vault investors take 50% of risk, get 50% of remaining unearned premium
  Insurer's capital is FREED -- they can write new business

  Money flow:
  1. Insurer has existing portfolio: $1M coverage, $80K annual premium
  2. NextBlock tokenizes: creates vault representing 50% of portfolio
  3. Vault needs $500K in capital (50% of $1M coverage)
  4. Investors deposit $500K
  5. ~$400K (80%) deployed to ring-fenced contract backing insurer's policies
  6. ~$100K (20%) retained as liquidity buffer in vault
  7. Insurer forwards 50% of premiums to vault: $40K/year
  8. If claims occur: insurer assesses, submits claim, paid from deployed capital
  9. Investor yield: ($40K premiums - claims share - fees) / $500K capital

  Key difference from on-chain model: claims require insurer assessment.
  The insurer has draw-down rights for verified claims only.
  This is NOT trustless -- but it covers any real-world risk.
```

### 8.3 For the Hackathon

- **Premium movement**: Pre-funded. Admin deposits the full premium amount (MockUSDC) when registering the policy in the vault. This simulates the **Unearned Premium Reserve (UPR) transfer** -- standard practice in quota share cessions of in-force books. The premium is real USDC in the vault, accruing linearly over the policy duration via the `totalAssets()` formula. See Section 11.5 for implementation details.
- **Claims**: Insurer admin clicks "Submit Claim" in the admin panel, specifying the assessed amount (partial claims allowed for P3, up to coverage). Only `INSURER_ADMIN` role can trigger. Vault mints a ClaimReceipt token to the insurer. Insurer exercises to withdraw USDC. This is explicitly labeled as "off-chain verification -- insurer assessed."
- **Demo narrative**: "This is where blockchain is infrastructure, not verification. The policy exists on-chain for transparency and liquidity. But the claim decision is made by a human. That's honest. And vault managers can choose whether to include these or not. The insurer receives a claim receipt -- a tokenized draw-down right against the vault's capital."

---

## 9. Decisions -- All Resolved

All blocking decisions have been resolved by Alessandro. This section documents the decisions for reference.

### 9.1 Product Decisions

| #   | Decision              | Choice                                                                                                                                                      | Decided By  |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Policy taxonomy       | By verification mechanism (on-chain / oracle / off-chain), not insurance category                                                                           | Alessandro  |
| 2   | Number of policies    | 3 (one per verification type)                                                                                                                               | Alessandro  |
| 3   | P1 (on-chain)         | BTC Price Protection                                                                                                                                        | Alessandro  |
| 4   | P2 (oracle-dependent) | Flight Delay                                                                                                                                                | Alessandro  |
| 5   | P3 (off-chain)        | Commercial Fire                                                                                                                                             | Alessandro  |
| 6   | Number of vaults      | 2 (platform story requires contrast)                                                                                                                        | Alessandro  |
| 7   | Vault A               | "Balanced Core" -- all 3 policies, NextBlock Core Team                                                                                                      | Alessandro  |
| 8   | Vault B               | "DeFi Alpha" -- P1+P2 only, AlphaRe Capital                                                                                                                 | Alessandro  |
| 9   | Shared policy         | P1 (BTC) in both vaults                                                                                                                                     | Alessandro  |
| 10  | Frontend pages        | 3 pages + inline sidebar (Morpho-style)                                                                                                                     | Alessandro  |
| 11  | Persona               | Dual framing (institutional pitch, retail demo)                                                                                                             | Alessandro  |
| 12  | Verification labels   | Subtle label in UI (not prominent categorization)                                                                                                           | Alessandro  |
| 13  | Claim triggers        | 3 distinct paths: permissionless / oracle reporter / insurer admin                                                                                          | Alessandro  |
| 14  | Policyholder in demo  | Simulated (pre-loaded)                                                                                                                                      | Alessandro  |
| 15  | Yield mechanism       | NAV accrual (hackathon), dividend model (pitch)                                                                                                             | Advisor rec |
| 16  | Premium accrual       | Pre-funded: insurer deposits full premium (MockUSDC) at policy registration. UPR transfer -- standard reinsurance practice. Accrues linearly over duration. | Alessandro  |
| 17  | Capital deployment    | Accounting-only for hackathon. Vault A: 80/20 buffer. Vault B: 85/15 buffer. Per-vault configurable.                                                        | Alessandro  |
| 18  | Early exit            | Buffer-only for hackathon; secondary market + queue in pitch                                                                                                | Advisor rec |
| 19  | Quota share cession   | Skip for hackathon (100% risk + 100% premium to vault)                                                                                                      | Advisor rec |
| 20  | Time simulation       | Internal time offset (`currentTime() = block.timestamp + timeOffset`). Works on any chain. Admin-only `advanceTime(seconds)`.                               | Alessandro  |
| 21  | Claim mechanics       | Claim receipt token: vault mints receipt to insurer on trigger, insurer exercises to withdraw USDC. Two-step flow.                                          | Alessandro  |
| 22  | Claim amounts         | P1/P2: binary, full coverage payout. P3: partial claims allowed (insurer specifies assessed amount).                                                        | Alessandro  |
| 23  | Post-claim state      | Policy becomes CLAIMED, premium accrual stops. P3 partial: single claim consumes policy fully (remaining coverage forfeited).                               | Alessandro  |
| 24  | Allocation weights    | Vault manager sets weights manually via `addPolicy(policyId, weight)`. Must sum to 100%.                                                                    | Alessandro  |
| 25  | Fee model (hackathon) | Management fee only (0.5% Vault A, 1% Vault B, annualized, time-weighted). No performance fee.                                                              | Alessandro  |

### 9.2 Technical Decisions

| #   | Decision       | Choice                                                                                                                         | Decided By             |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| 26  | Token standard | ERC-4626 (see decision 001)                                                                                                    | Advisor rec, confirmed |
| 27  | Chain          | Base Sepolia + Anvil local backup                                                                                              | Advisor rec, confirmed |
| 28  | Toolchain      | Foundry (forge/anvil)                                                                                                          | Advisor rec, confirmed |
| 29  | Admin model    | Simple Ownable (single admin)                                                                                                  | Advisor rec            |
| 30  | Oracle         | Admin-controlled mock                                                                                                          | Advisor rec            |
| 31  | Contracts      | 6 total: MockUSDC, MockOracle, PolicyRegistry, InsuranceVault, VaultFactory, ClaimReceipt                                      | Alessandro             |
| 32  | totalAssets()  | Balance-based: `USDC.balanceOf(vault) - unearnedPremiums - pendingClaims - accruedFees`. No double-counting. See Section 11.5. | Alessandro             |

### 9.3 What We Skip (and Why)

| Feature                            | Skip Reason                                          | Production Plan                |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------ |
| PT/YT tokens                       | 2-3 days build, 30s demo value                       | V2 feature, Pendle-style       |
| NXB governance                     | Tokenomics complexity, zero demo value               | Post-TVL traction              |
| ERC-3643 / KYC                     | 6-8 extra contracts, no testnet need                 | Compliance wrapper on mainnet  |
| Real oracle (Chainlink)            | Unpredictable timing during demo                     | Production requirement         |
| Ring-fenced capital contracts      | Accounting tracking + ClaimReceipt tokens sufficient | Per-reinsurer escrow contracts |
| Secondary market / AMM             | Would need Uniswap integration                       | Mechanism 2 for production     |
| Redemption queue                   | Buffer-only withdrawal is demo-sufficient            | Mechanism 3 for production     |
| Policyholder flows                 | NextBlock is NOT the insurer                         | Never in scope                 |
| Mobile                             | DeFi is 80%+ desktop                                 | Post-launch optimization       |
| Historical analytics               | No track record to show                              | After mainnet data             |
| Upgradeable proxies                | Single deploy, no upgrades                           | Production requirement         |
| Multi-chain                        | Zero demo value                                      | LayerZero/CCIP for production  |
| Account abstraction (4337)         | Extra complexity, judges use MetaMask                | Production retail UX           |
| Standalone policy marketplace page | Policies visible in vault detail + admin page        | Production feature             |

---

## 10. Key Product Decisions Summary

| Decision              | Choice                                                 | Why                                    |
| --------------------- | ------------------------------------------------------ | -------------------------------------- |
| NextBlock's role      | Infrastructure / protocol. NEVER the insurer.          | Core positioning                       |
| Core demo concept     | Three verification types + where blockchain adds value | Honest, educational, differentiating   |
| Primary demo flow     | Investor                                               | NextBlock's core user                  |
| Number of vaults      | 2 (different managers, different verification trust)   | Platform story needs contrast          |
| Number of policies    | 3 (one per verification type)                          | Clean, educational, buildable          |
| Vault manager concept | Core to the demo                                       | This is the platform story             |
| Vault B thesis        | Automated-only (excludes off-chain)                    | Shows different risk philosophies      |
| Policy taxonomy       | By verification mechanism, not insurance category      | More honest and educational            |
| Policyholder in demo  | Simulated (pre-loaded)                                 | Reduces demo risk                      |
| Yield mechanism       | NAV accrual for hackathon, dividend in presentation    | Simple to build, compelling to show    |
| Policy expiry model   | Staggered expiry dates (60d, 90d, 180d)                | Rolling yield, natural liquidity       |
| Capital deployment    | 80% deployed, 20% buffer (accounting-only)             | Honest trade-off, visible in UI        |
| Early exit            | Buffer-only for hackathon                              | Simple, production mechanisms in pitch |
| Claim triggers        | 3 distinct paths (permissionless / oracle / insurer)   | The most interesting technical detail  |
| Time simulation       | Manual "advance" button                                | Presenter controls pacing              |
| Frontend              | 3 pages + inline sidebar                               | Clean Morpho-style UX                  |
| PT/YT                 | Skip                                                   | Out of scope                           |
| NXB token             | Skip                                                   | Out of scope                           |
| KYC / ERC-3643        | Skip                                                   | Out of scope                           |

---

## 11. Minimum Viable Hackathon Scope

### The 3 Policies

| ID  | Name                 | Verification     | Coverage | Premium (rate) | Duration | Vaults | Claim Type      | Trigger                                                         |
| --- | -------------------- | ---------------- | -------- | -------------- | -------- | ------ | --------------- | --------------------------------------------------------------- |
| P1  | BTC Price Protection | On-chain         | $50,000  | $2,500 (5%)    | 90 days  | A + B  | Binary (full)   | Permissionless: anyone calls `checkClaim()`, reads oracle price |
| P2  | Flight Delay         | Oracle-dependent | $15,000  | $1,200 (8%)    | 60 days  | A + B  | Binary (full)   | Oracle reporter calls `reportEvent()`, auto-triggers            |
| P3  | Commercial Fire      | Off-chain        | $40,000  | $2,400 (6%)    | 180 days | A only | Partial allowed | Insurer admin calls `submitClaim(amount)`, permissioned         |

P1 (BTC Protection) is in BOTH vaults -- this is the shared policy that proves the platform story. Each vault independently backs and processes claims for shared policies.

### The 2 Vaults

| Vault                    | Manager             | Policies   | Allocation Weights        | Buffer Ratio              | Mgmt Fee    | Strategy                            | Target APY |
| ------------------------ | ------------------- | ---------- | ------------------------- | ------------------------- | ----------- | ----------------------------------- | ---------- |
| Vault A: "Balanced Core" | NextBlock Core Team | P1, P2, P3 | P1: 40%, P2: 20%, P3: 40% | 20% buffer / 80% deployed | 0.5% annual | Diversified, all verification types | 8-12%      |
| Vault B: "DeFi Alpha"    | AlphaRe Capital     | P1, P2     | P1: 60%, P2: 40%          | 15% buffer / 85% deployed | 1% annual   | Automated-only, no off-chain        | 10-14%     |

### The 6 Smart Contracts

| Contract       | Purpose                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MockUSDC       | ERC-20 mock stablecoin (6 decimals). Admin can mint for demo.                                                                                                                 |
| MockOracle     | Stores BTC price + flight event status. Admin-controlled.                                                                                                                     |
| PolicyRegistry | Registers policies with terms, insurer address, verification type. Source of truth for policy data.                                                                           |
| InsuranceVault | ERC-4626 vault. Holds investor deposits + insurer premiums. Issues share tokens. Processes claims via receipt tokens.                                                         |
| VaultFactory   | Deploys new InsuranceVault instances. Sets vault manager, buffer ratio, fee rate.                                                                                             |
| ClaimReceipt   | Soulbound ERC-721 token minted to insurers on claim trigger. Non-transferable. Receipt struct includes `insurer` field. Represents right to withdraw claim amount from vault. |

### The 3 Frontend Pages + Inline Sidebar

1. **Vault Discovery** -- Two vault cards side by side. Name, manager, APY, risk level, TVL, policy count, verification types. First impression.
2. **Vault Detail** -- Policy breakdown with verification type labels, allocations, premium rates, expiry bars, deployment ratio (80/20), fee structure, yield accrual. The "I can see exactly what my money backs" moment. **Inline deposit/withdraw sidebar** on the right side (Morpho-style), always visible.
3. **Admin / Curator** -- Combined page. Section 1: vault management (create vault, select policies, set allocations). Section 2: simulation controls (time warp, 3 different claim triggers, reset). Policies shown as available pool.

**Inline Sidebar** (on Vault Detail): Deposit/Withdraw tabs -- enter amount, see share calculation, confirm, post-deposit summary. Always visible on the right side of the page, not a modal overlay. Light theme.

### Must Build (Core Demo)

1. Three policies with distinct verification types and trigger mechanisms
2. Two vaults with different strategies and different vault managers
3. Investor deposit into either vault, receive vault share tokens
4. Yield accrual visualization (accelerated time, NAV increasing)
5. Claim event triggers -- all three types (permissionless, oracle, insurer)
6. Claim impact comparison between vaults (same claim, different impact)
7. Withdrawal from vault (at current NAV, from liquidity buffer)

### Should Build (Strengthens Demo)

8. Vault composition comparison (side-by-side of two vaults with verification labels)
9. "Create Vault" flow on admin page (select policies from pool, set allocations)
10. Diversification impact callout ("Without diversification: -100%. With this vault: -X%")

### Explicitly Skip

- KYC / ERC-3643
- PT/YT tokens
- NXB governance token
- Policyholder flows
- Mobile optimization
- Historical analytics / charts
- Real oracle integration (mock everything)
- Standalone policy marketplace page (policies visible in vault detail + admin)
- Performance fee (management fee only for hackathon)

---

## 11.5 Hackathon Implementation Specification

This section is the **developer's reference**. It specifies the exact mechanics for the smart contract engineer and frontend developer. When this section contradicts earlier narrative sections, this section is authoritative.

### 11.5.1 Premium Flow: Pre-Funded (UPR Transfer)

Premiums are **real USDC**, not virtual. When the admin registers a policy in a vault, they deposit the full premium amount in MockUSDC. This simulates the **Unearned Premium Reserve (UPR) transfer** -- standard practice in quota share cessions of in-force books (validated by insurance domain expert).

```
Policy registration flow:
  1. Admin calls PolicyRegistry.registerPolicy(terms, insurer, premium, coverage, duration)
  2. Admin calls InsuranceVault.addPolicy(policyId, allocationWeight)
  3. Admin transfers premiumAmount of MockUSDC into the vault (separate deposit or bundled)
  4. The premium USDC sits in the vault contract alongside investor deposits
  5. The unearned portion is excluded from totalAssets() via time-based calculation
  6. As time passes, more premium "earns" -> unearnedPremiums decreases -> NAV increases
```

**Why pre-funded (not virtual)**: Every dollar of NAV is backed by real USDC in the contract. No phantom gap between totalAssets() and actual balance. Withdrawals work cleanly end-to-end. This is also how real reinsurance works -- the cedant transfers the UPR at cession.

### 11.5.2 `totalAssets()` Formula (THE Critical Function)

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

Where:

- `USDC.balanceOf(vault)` = investor deposits + insurer premiums - exercised claims (real USDC in contract)
- `_totalUnearnedPremiums()` = `Σ(policy.premium * max(0, duration - elapsed) / duration)` for each active policy
- `totalPendingClaims` = sum of triggered-but-not-yet-exercised claim amounts (ClaimReceipt tokens outstanding)
- `_accruedFees(preFeeAssets)` = `managementFeeRate * preFeeAssets * elapsed / 365 days` (pre-fee basis to break circularity)

**Important**: `totalDeployedCapital` is NOT in this formula. It is tracked separately for:

- Enforcing `maxWithdraw()` (capped at available buffer = balance - deployed - pendingClaims)
- Frontend display ("80% deployed / 20% buffer")

### 11.5.3 State Transition Table

| Action                                     | USDC.balanceOf | totalDeployedCapital       | totalPendingClaims | unearnedPremiums   | Policy status |
| ------------------------------------------ | -------------- | -------------------------- | ------------------ | ------------------ | ------------- |
| **Investor deposits $10K**                 | +$10K          | +$8K (80% of deposit)      | --                 | --                 | --            |
| **Admin registers policy + premium $2.5K** | +$2.5K         | --                         | --                 | +$2.5K             | ACTIVE        |
| **Time passes 30 days** (on 90-day policy) | --             | --                         | --                 | -$833 (1/3 earned) | --            |
| **Claim triggers P1 ($50K)**               | --             | --                         | +$50K              | stops accruing     | CLAIMED       |
| **Insurer exercises claim receipt**        | -$50K          | -$50K                      | -$50K              | --                 | --            |
| **Investor withdraws $5K**                 | -$5K           | --                         | --                 | --                 | --            |
| **Policy expires (no claim)**              | --             | deployed returns to buffer | --                 | →$0 (fully earned) | EXPIRED       |

### 11.5.4 Claim Receipt Token Flow

When a claim triggers, the vault does NOT immediately send USDC to the insurer. Instead:

```
Step 1: TRIGGER (via any of the 3 paths)
  -> Vault mints a ClaimReceipt token (ERC-721) to the insurer address
  -> ClaimReceipt stores: policyId, claimAmount, vaultAddress, timestamp
  -> totalPendingClaims += claimAmount
  -> NAV drops immediately (pendingClaims deduction in totalAssets)
  -> Policy status -> CLAIMED, premium accrual stops
  -> Emit ClaimTriggered(policyId, claimAmount, insurer, receiptId)

Step 2: EXERCISE (insurer calls exerciseClaim)
  -> Insurer calls vault.exerciseClaim(receiptId)
  -> Validates: receipt.vault == this vault, receipt.insurer == msg.sender, !receipt.exercised
  -> uint256 payout = Math.min(claimAmount, USDC.balanceOf(vault))
  -> totalPendingClaims -= claimAmount (full amount, not payout)
  -> totalDeployedCapital -= min(claimAmount, totalDeployedCapital) (floor at 0)
  -> ClaimReceipt.markExercised(receiptId) -- sets exercised=true, then burns NFT
  -> USDC.transfer(insurer, payout) -- capped at vault balance
  -> If payout < claimAmount: emit ClaimShortfall(receiptId, claimAmount, payout)
  -> Emit ClaimExercised(receiptId, payout, insurer)
  -> NAV: net zero change (balance drops, pendingClaims drops by same claimAmount)
```

**Why two steps**: This mirrors real ring-fenced capital draw-down rights. The claim event is separate from the settlement. In production, the receipt could include a grace period, multi-sig approval, or dispute window. For the hackathon, exercise is immediate (no delay).

**Shared policy (P1 in both vaults)**: When P1 triggers, EACH vault holding P1 independently mints a ClaimReceipt. The insurer receives one receipt per vault. Each vault's NAV drops independently.

**Claim amounts**:

- P1 (on-chain, BTC): Binary. Claim amount = full coverage ($50K). `checkClaim()` checks oracle price, if below threshold, triggers for full amount.
- P2 (oracle-dependent, flight): Binary. Claim amount = full coverage ($15K). `reportEvent()` triggers for full amount.
- P3 (off-chain, fire): Partial allowed. `submitClaim(policyId, assessedAmount)` where assessedAmount <= coverage. Insurer specifies assessed damage. **Single claim consumes policy** (`claimed = true`); remaining coverage forfeited. No multi-claim support for hackathon.

### 11.5.5 Time Simulation: Internal Time Offset

The contract uses an internal virtual clock for all time calculations. This allows the demo to work on any chain (local Anvil or Base Sepolia).

```solidity
uint256 public timeOffset;

function currentTime() public view returns (uint256) {
    return block.timestamp + timeOffset;
}

function advanceTime(uint256 secondsToAdd) external onlyAdmin {
    timeOffset += secondsToAdd;
    emit TimeAdvanced(currentTime(), secondsToAdd);
}
```

**All time-dependent calculations** use `currentTime()` instead of `block.timestamp`:

- Premium accrual: `elapsed = currentTime() - policy.startTime`
- Policy expiry check: `currentTime() >= policy.startTime + policy.duration`
- Fee accrual: `elapsed = currentTime() - lastFeeTimestamp`

**When time advances past a policy's expiry**: The policy auto-expires (status -> EXPIRED). Premium is fully earned (unearnedPremiums -> 0 for that policy). Deployed capital conceptually returns to buffer (`totalDeployedCapital -= policy allocation`). This should be handled lazily (checked on next read/interaction, not eagerly on advanceTime).

### 11.5.6 Fee Model (Management Fee Only)

```
accruedFees = managementFeeRate * totalManagedAssets * elapsed / 365 days

Where:
  managementFeeRate = 0.005 (0.5%) for Vault A, 0.01 (1%) for Vault B
  totalManagedAssets = totalAssets() before fee deduction (approximate via last snapshot)
  elapsed = currentTime() - lastFeeAccrualTimestamp
```

Fees are deducted from totalAssets() (reduce NAV). They are NOT transferred as USDC for the hackathon. In production, a fee recipient address would claim accumulated fees periodically.

Performance fee (15-20% of yield) is deferred to production. Mention in presentation only.

### 11.5.7 `maxWithdraw()` and Buffer Enforcement

```solidity
function maxWithdraw(address owner) public view override returns (uint256) {
    uint256 userAssets = _convertToAssets(balanceOf(owner), Math.Rounding.Floor);
    uint256 availableBuffer = _availableBuffer();
    return Math.min(userAssets, availableBuffer);
}

function _availableBuffer() internal view returns (uint256) {
    uint256 balance = IERC20(asset()).balanceOf(address(this));
    uint256 reserved = totalDeployedCapital + totalPendingClaims;
    if (balance <= reserved) return 0;
    return balance - reserved;
    // bufferRatioBps determines totalDeployedCapital at deposit time only
    // (e.g., 80% of each deposit is "deployed"). It is NOT re-enforced as
    // a dynamic floor on withdrawals.
}
```

The buffer formula is: **`balance - totalDeployedCapital - totalPendingClaims`**. The `bufferRatioBps` (2000/1500) determines how much of each investor deposit is marked as "deployed" at deposit time. It does not gate withdrawals dynamically. Investors cannot withdraw USDC that is "deployed" (accounting) or reserved for pending claims.

### 11.5.8 Key Solidity Events

```
event Deposited(address indexed investor, uint256 assets, uint256 shares);
event Withdrawn(address indexed investor, uint256 assets, uint256 shares);
event PolicyAdded(uint256 indexed policyId, uint256 allocationWeight);
event ClaimTriggered(uint256 indexed policyId, uint256 amount, address insurer, uint256 receiptId);
event ClaimExercised(uint256 indexed receiptId, uint256 amount, address insurer);
event TimeAdvanced(uint256 newTimestamp, uint256 secondsAdded);
event PolicyExpired(uint256 indexed policyId);
```

### 11.5.9 Edge Cases

| Edge Case                               | Behavior                                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Deposit of 0 USDC                       | Revert (ERC-4626 standard)                                                                                                                    |
| Withdraw more than buffer               | Partial withdrawal up to buffer. Revert if 0 available.                                                                                       |
| Claim exceeds vault USDC balance        | Cap payout at `Math.min(claimAmount, USDC.balanceOf(vault))`. Burn receipt regardless. Emit `ClaimShortfall` event. Insurer absorbs the loss. |
| Claim on already-claimed policy (P1/P2) | Revert ("Already claimed")                                                                                                                    |
| Double-exercise of same receipt         | Receipt is burned on exercise. Second call reverts.                                                                                           |
| Time advanced past multiple expiries    | Lazy evaluation: each policy checks its own expiry on next interaction                                                                        |
| All policies expired, no new ones       | Vault becomes withdraw-only. totalAssets = balance - fees.                                                                                    |
| totalAssets() approaches 0              | Returns 0 (floor). Never reverts.                                                                                                             |
| First depositor inflation attack        | Use OZ 5.x virtual shares offset (built into ERC4626 implementation)                                                                          |

---

## 12. Insurance Credibility Notes (from Expert Review)

These points don't need to be built into the hackathon prototype, but should be understood by the team and mentioned in the presentation where relevant.

### 12.1 Adverse Selection Protection

Why would an insurer tokenize a policy through NextBlock? If they can choose which policies to cede, rational behavior is to keep profitable policies and dump risky ones into the vault ("the lemons problem").

**Mitigation (mention in presentation)**: "Policies are ceded on an obligatory whole-portfolio basis -- the insurer must cede ALL policies meeting the treaty definition, not cherry-pick. Vault managers perform underwriting audits on ceded portfolios."

### 12.2 IBNR (Incurred But Not Reported) for Long-Tail Lines

For property and liability lines, claims can emerge months or years after the policy period ends (lawsuits take time to file). A policy that "expired without claims" may still have claims develop later. This is called IBNR and is one of the most fundamental concepts in insurance accounting.

**For the hackathon**: The demo uses a commercial fire policy as the off-chain example. In the demo, claims are simplified (instant assessment by insurer). In production, long-tail lines like fire insurance would require IBNR reserving. The demo acknowledges this honestly: "Off-chain claims require human assessment. This is a limitation, not a feature."

### 12.3 Combined Ratio vs. Loss Ratio

The true measure of underwriting profitability is the **combined ratio = loss ratio + expense ratio**. The expense ratio (underwriting costs, claims handling, admin) typically runs 25-35% in traditional insurance. NextBlock's on-chain model has a genuine structural advantage here -- protocol + vault manager fees (1-3% total) are much leaner than traditional expense ratios. This should be highlighted in the pitch.

### 12.4 Ceding Commission

In real quota share reinsurance, the reinsurer pays the insurer a **ceding commission** (25-35% of ceded premium) to cover the insurer's acquisition costs. This reduces the yield available to investors. For the hackathon, this is ignored, but it is a meaningful production consideration.

### 12.5 Retrocession (Tail Risk Protection)

Vaults should purchase **excess-of-loss (XOL) retrocession** to cap the maximum drawdown investors can experience. This is reinsurance for the reinsurance -- standard practice in the ILS market.

```
Example:
  Vault capital:             $10M
  XOL attachment point:      $3M (30% of capital)
  XOL exhaustion point:      $7M (70% of capital)
  XOL premium:               ~2-4% of covered layer annually

  Result: If claims exceed $3M, the XOL cover pays the excess (up to $7M).
  Maximum investor drawdown capped at ~30% of capital.
```

**Why this matters**: Without retrocession, a severe catastrophe year could wipe out 50-80% of vault capital. With XOL, the worst case is a defined, bounded loss. This transforms the risk profile from "unlimited downside" to "capped downside" -- much more palatable for institutional and retail investors.

**Cost**: XOL retrocession costs 2-4% of the covered layer, which reduces investor yield by ~0.5-1.5% APY. This is a worthwhile trade-off for risk-aware vault managers and should be presented as a feature, not a cost.

**For the hackathon**: Mention retrocession in the presentation as a production risk management feature. No need to implement.

### 12.6 Vault Manager Skin-in-the-Game

In real ILS fund management and at Lloyd's, managing agents typically invest 5-10% of their own capital alongside investors. This aligns incentives. Listed under "skip for hackathon" but worth mentioning as a production feature.

### 12.7 Loss Ratio Reality Check by Line

| Line of Business                       | Realistic Loss Ratio | Notes                                                                    |
| -------------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| DeFi smart contract cover (on-chain)   | 5-15%                | Low but market is immature; partly reflects restrictive claims processes |
| Parametric flight delay (oracle-dep)   | 30-50%               | High frequency, priced for it                                            |
| Commercial property / fire (off-chain) | 55-75%               | Spikes >100% in catastrophe years                                        |

For the hackathon demo, the blend of these three types creates a realistic and defensible range. Do not present uniformly low loss ratios across all three types.

### 12.8 Verification-First Strategy

The hackathon's organization by verification type maps naturally to a production launch sequence:

**Recommended launch sequence**:

- Phase 1 (hackathon + mainnet launch): On-chain DeFi policies + oracle-dependent parametric (where blockchain verification adds real value)
- Phase 2 (6-12 months post-launch): Short-tail off-chain commercial lines (surety, trade credit) with established insurer partnerships
- Phase 3 (12-24 months): Long-tail off-chain lines (liability, D&O) with proper IBNR reserving and actuarial partnerships

This acknowledges that NextBlock's value proposition is strongest where verification is on-chain, and becomes more of a distribution/liquidity play for off-chain lines.

---

## 13. Next Step

This document is build-ready. All decisions are resolved. Hand to the tech team (Marco for smart contracts, Luca for frontend) to begin implementation.

**Build order**:

- Day 1: Smart contracts (Foundry -- MockUSDC, MockOracle, PolicyRegistry, InsuranceVault, VaultFactory, ClaimReceipt)
- Day 2: Frontend (Next.js + wagmi/viem + Tailwind -- 3 pages + inline sidebar)
- Day 3: Polish + deploy to Base Sepolia + demo rehearsal
