# Subscription Plan Builder

A comprehensive Angular application for managing subscription-based pricing for SaaS products. This system handles complex billing scenarios including multiple charge types, bundled services, volume discounts, and company-specific pricing agreements.

## Business Concepts & Definitions

### Billable Service

A **Billable Service** is any product, feature, or capability that customers can subscribe to and be charged for. Services represent the fundamental building blocks of your product offerings.

**Key Characteristics:**
- Has a unique identifier and name
- Can be categorized as Core Service, Bundle, or Add-on
- Contains one or more charges that define how it's priced
- Can be included in subscription plans
- Can have different pricing in different plans (overridden values)

**Examples:**
- TPM App Access: Thrift Production Manager for thrift store
- POS App Access: Point of Sale system
- Lister App Access: E-commerce platform
- Payment Processing: Payment gateway and transaction processing
- Premium Support: Enhanced customer support service
- Advanced Analytics & Insights: Business intelligence add-on

### Charge

A **Charge** is a specific pricing component that defines how a billable service is monetized. Services can have multiple charges applied simultaneously.

**Charge Types:**

1. **Flat Amount**
   - Fixed monthly fee regardless of usage
   - Example: $49/month base subscription fee
   - Use case: Base access to platform

2. **Per Seat**
   - Price per user, location, device, or similar unit
   - Example: $12 per user per month
   - Use case: Team-based pricing

3. **Per Transaction**
   - Price per individual transaction or event
   - Example: $0.25 per payment transaction
   - Use case: Usage-based billing

4. **Percentage Of Revenue**
   - Commission or percentage of customer's transaction value
   - Example: 2.9% of payment processing volume
   - Use case: Revenue-sharing models

**Charge Properties:**
- `originalValue`: The standard price for this charge
- `overriddenValue`: Custom price when included in a plan (volume discount)
- `includedSeats`: Number of free units included before charges apply

### Subscription Plan

A **Subscription Plan** is a pre-configured package of billable services offered to customers at a specific price point. Plans typically bundle multiple services together and may include volume discounts or included quantities.

**Key Characteristics:**
- Contains multiple billable services
- Can override standard pricing with plan-specific rates
- Can include free quantities (e.g., "includes 10 users")
- Tracks number of active subscribers
- Represents different tiers (Starter, Professional, Enterprise)

**Plan Components:**
- **Base Services**: Core functionality included in the plan
- **Add-ons**: Optional services that can be added
- **Bundles**: Multiple services packaged as one
- **Volume Discounts**: Reduced per-unit pricing for bulk purchases
- **Included Quantities**: Free seats/transactions/units included

**Example Plans:**
- **TPM Starter**: Basic thrift store production management with 3 stations included
- **POS Complete**: Full point-of-sale with volume discounts on terminals
- **All-in-One Enterprise**: All services with significant volume pricing

### Bundle

A **Bundle** is a special type of billable service that packages multiple individual services together as a single offering. Bundles typically provide cost savings compared to purchasing services separately.

**Characteristics:**
- Category type: "Bundle"
- Contains multiple underlying services
- Often includes services that complement each other
- May have simplified pricing structure

**Example:**
Payment Processing Bundle might include:
- Payment gateway access
- Transaction processing
- PCI compliance tools
- Fraud detection

### Add-on

An **Add-on** is an optional billable service that enhances core functionality. Add-ons are not required but provide additional value to customers.

**Characteristics:**
- Category type: "Add-on"
- Can be added to any plan
- Typically focused on specific use cases
- Priced independently

**Examples:**
- Advanced Analytics & Insights: $89/month
- Custom Reporting & Exports: $49/month
- Inventory Management Pro: $69/month
- Customer Loyalty Program: $79/month

### Company Discount

A **Company Discount** is a special pricing agreement for a specific customer or company. These override standard pricing and plan rates.

**Discount Types:**

1. **Percentage Discount**
   - Reduces total bill by a percentage
   - Example: 20% off for enterprise contracts
   - Common for: Volume commitments, annual contracts

2. **Flat Amount Discount**
   - Fixed dollar credit applied to subscription
   - Example: $500 off per month
   - Common for: Promotions, referral bonuses, migrations

**Discount Scenarios:**
- **Enterprise Volume**: 20-25% for large commitments
- **Non-Profit**: 30% for registered charitable organizations
- **Educational**: 40% for schools and universities
- **Early Adopter**: 25% for startup programs
- **Multi-Year Prepaid**: 18% for 24-month prepayment
- **Referral Bonus**: $1,200 one-time credit
- **Competitive Migration**: $500 to offset switching costs
- **Partner/Reseller**: 12% for authorized partners

**Discount Properties:**
- Time-bound (start and end dates) or ongoing
- Can be active or inactive
- Include reason and approval notes
- Track creation and modification audit trail

### Service Categories

Services are organized into three categories:

1. **Core Service**
   - Essential platform functionality
   - Primary product offerings
   - Examples: TPM (Thrift Production Manager), POS, Lister applications

2. **Bundle**
   - Multiple services packaged together
   - Simplified pricing for common combinations
   - Examples: Payment Processing Bundle

3. **Add-on**
   - Optional enhancements
   - Specialized features
   - Examples: Analytics, Reporting, Inventory Management

## Pricing Architecture

### Standard Pricing Flow

1. **Base Service Pricing**
   - Each service has standard charges with `originalValue`
   - Charges define default pricing for the service

2. **Plan-Based Pricing**
   - Plans can override charges with `overriddenValue`
   - Volume discounts applied for bulk purchases
   - Example: $12/user standard → $8/user in Enterprise plan

3. **Included Quantities**
   - Plans can include free units via `includedSeats`
   - Charges only apply after included quantity is exceeded
   - Example: 10 users included, then $12/user for additional

4. **Company Discounts**
   - Applied after plan pricing
   - Can be percentage or flat amount
   - Takes precedence over standard pricing

### Pricing Calculation Example

**Scenario**: Acme Corporation on "All-in-One Enterprise" plan

**Plan Includes:**
- TPM App Access: $49 base + $8/station (discounted from $12) with 20 stations included
- POS App Access: $79 base + $18/terminal (discounted from $25) with 10 terminals included
- Lister App Access: $99 base + 1.5% commission (discounted from 2.5%)
- Premium Support: $199/month + $0 onboarding (waived from $499)

**Company Discount:**
- 20% enterprise annual contract discount

**Usage:**
- 35 stations (15 over included quantity)
- 15 terminals (5 over included quantity)
- $50,000 monthly e-commerce revenue

**Calculation:**
```
TPM: $49 + (15 × $8) = $169
POS: $79 + (5 × $18) = $169
Lister: $99 + ($50,000 × 1.5%) = $849
Premium Support: $199
-------------------
Subtotal: $1,386
Company Discount (20%): -$277.20
-------------------
Total: $1,108.80/month
```

## Data Structure

### Billable Service JSON Structure
```json
{
  "id": 1,
  "name": "TPM App Access",
  "icon": "📋",
  "category": "Core Service",
  "description": "Thrift Production Manager for thrift store",
  "charges": [
    {
      "id": 1,
      "name": "Monthly Base Fee",
      "type": "Flat",
      "value": 49
    },
    {
      "id": 2,
      "name": "Per User",
      "type": "PerSeat",
      "value": 12
    }
  ]
}
```

### Subscription Plan JSON Structure
```json
{
  "id": 1,
  "name": "TPM Professional",
  "description": "Complete project management solution",
  "subscriberCount": 47,
  "services": [
    {
      "id": 1,
      "name": "TPM App Access",
      "category": "Core Service",
      "isBundle": false,
      "charges": [
        {
          "id": 1,
          "name": "Monthly Base Fee",
          "type": "Flat",
          "originalValue": 49,
          "overriddenValue": null,
          "includedSeats": 0
        },
        {
          "id": 2,
          "name": "Per User",
          "type": "PerSeat",
          "originalValue": 12,
          "overriddenValue": 10,
          "includedSeats": 10
        }
      ]
    }
  ]
}
```

### Company Discount JSON Structure
```json
{
  "id": 1,
  "companyId": 1,
  "company": {
    "id": 1,
    "code": "COMP001",
    "name": "Acme Corporation"
  },
  "discountType": "Percentage",
  "discountValue": 20,
  "effectiveStartDate": "2026-01-01",
  "effectiveEndDate": "2026-12-31",
  "reason": "Enterprise annual contract - 20% volume discount",
  "notes": "Approved by VP of Sales. Multi-year customer with 50+ licenses.",
  "isActive": true,
  "createdBy": "John Smith",
  "createdAt": "2025-12-15T10:00:00Z",
  "modifiedBy": null,
  "modifiedAt": null
}
```

## Application Features

### Billable Services Management
- Create and edit services with multiple charge types
- Configure pricing for each charge component
- Categorize services (Core Service, Bundle, Add-on)
- Define service descriptions and metadata

### Subscription Plan Builder
- Create custom subscription plans
- Add multiple services to a plan
- Override standard pricing with volume discounts
- Include free quantities (seats, transactions, etc.)
- Track subscriber counts for each plan

### Company Discounts Management
- Create percentage or flat amount discounts
- Set effective date ranges (time-bound or ongoing)
- Track discount reasons and approval workflow
- Manage active/inactive discount status
- Maintain audit trail (created by, modified by, timestamps)

### Service Categories
- **Core Services**: Primary application offerings (TPM - Thrift Production Manager, POS, Lister)
- **Bundles**: Packaged service combinations (Payment Processing Bundle)
- **Add-ons**: Optional enhancements (Analytics, Reporting, Inventory, Loyalty, Themes, SEO)

## Real-World Pricing Examples

### Current Market Rates (2026)

**Base Application Subscriptions:**
- Thrift Production Manager: $49/month base + $12/station
- Point of Sale: $79/month base + $25/terminal
- E-commerce Platform: $99/month base + 2.5% commission

**Payment Processing:**
- Gateway Fee: $25/month
- Transaction Fee: $0.25 per transaction
- Processing Rate: 2.9% of transaction value

**Premium Services:**
- Premium Support: $199/month + $499 onboarding fee
- Advanced Analytics: $89/month
- Custom Reporting: $49/month
- Inventory Management: $69/month
- Loyalty Program: $79/month
- Premium Themes: $39/month
- SEO & Marketing Tools: $59/month

### Volume Discount Examples

**TPM Professional Plan:**
- Standard: $12/station
- Plan Discount: $10/station (17% savings)
- Included: 10 stations free

**All-in-One Enterprise Plan:**
- TPM Stations: $8/station (33% off) with 20 included
- POS Terminals: $18/terminal (28% off) with 10 included
- Commission Rate: 1.5% (40% off standard 2.5%)
- Onboarding Fee: Waived ($499 value)

## Technical Stack

- **Framework**: Angular 17
- **Language**: TypeScript
- **Styling**: SCSS
- **Change Detection**: OnPush strategy
- **State Management**: Component-based state
- **Data Storage**: JSON files in assets/api

## Project Structure

```
src/
├── app/
│   ├── features/
│   │   ├── billable-services/
│   │   │   ├── billable-services-list/
│   │   │   ├── service-form/
│   │   │   ├── charge-form/
│   │   │   ├── models/
│   │   │   └── services/
│   │   ├── subscription-plans/
│   │   │   ├── plans-list/
│   │   │   ├── plan-builder/
│   │   │   ├── models/
│   │   │   └── services/
│   │   └── company-discounts/
│   │       ├── discounts-list/
│   │       ├── discount-form/
│   │       ├── models/
│   │       └── services/
│   └── shared/
│       └── components/
└── assets/
    └── api/
        ├── billable-services.json
        ├── subscription-plans.json
        ├── company-discounts.json
        └── companies.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v17 or higher)

### Installation
```bash
npm install
```

### Development Server
```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`

### Build
```bash
npm run build
```

### Code Formatting
```bash
npm run format
```

## Business Use Cases

### Use Case 1: Small Thrift Store
**Customer**: Single thrift store location with 5 workstations

**Plan**: TPM Starter
- $49/month base
- 3 stations included
- $12/month per additional station
- **Total**: $49 + (2 × $12) = $73/month

### Use Case 2: Multi-Location Retail
**Customer**: Restaurant chain with 8 locations

**Plan**: POS Complete
- $79/month base
- 5 terminals included with volume discount ($20/terminal instead of $25)
- **Total**: $79 + (3 × $20) = $139/month
- **Includes**: Inventory Management and Loyalty Program

### Use Case 3: High-Volume E-commerce
**Customer**: Online marketplace processing $200K/month

**Plan**: E-commerce Pro
- $99/month base
- 2% commission (reduced from 2.5%)
- Payment Processing Bundle
- Premium themes and SEO tools
- **Total**: $99 + ($200,000 × 2%) + $25 + ($150K × 2.9%) + $0.25 × 3000 = $5,224/month

### Use Case 4: Enterprise Customer
**Customer**: Large thrift store chain with 50 workstations and 20 locations

**Plan**: All-in-One Enterprise
- **Company Discount**: 20% off entire subscription
- TPM: 20 stations included, then $8/station (30 additional = $240)
- POS: 10 terminals included, then $18/terminal (10 additional = $180)
- Premium Support included
- **Subtotal**: $49 + $240 + $79 + $180 + $99 + $199 = $846
- **After Discount**: $846 × 0.80 = $676.80/month

## Discount Strategy Guide

### When to Offer Discounts

**Enterprise Volume (20-25%)**
- Criteria: 25+ seats or multi-location deployments
- Term: Annual or multi-year contracts
- Goal: Secure large accounts with predictable revenue

**Early Adopter (25-40%)**
- Criteria: Beta testers, startup programs
- Term: 6-12 months
- Goal: Build customer base and gather feedback

**Non-Profit/Educational (30-40%)**
- Criteria: Verified 501(c)(3) or educational institution
- Term: Ongoing with annual verification
- Goal: Social responsibility and brand building

**Multi-Year Prepaid (15-20%)**
- Criteria: 24+ month prepayment
- Term: Duration of contract
- Goal: Improve cash flow and reduce churn

**Referral Bonus ($100-1200)**
- Criteria: Successful referral leading to paid subscription
- Term: One-time or annual credit
- Goal: Customer acquisition through word-of-mouth

**Competitive Migration ($250-1000)**
- Criteria: Switching from competitor platform
- Term: First 3-6 months
- Goal: Market share growth

## Future Enhancements

- [ ] Usage-based billing analytics dashboard
- [ ] Automated discount approval workflows
- [ ] Customer self-service plan management
- [ ] Invoice generation and payment processing
- [ ] Revenue forecasting and reporting
- [ ] API integration for external billing systems
- [ ] Tax calculation and compliance
- [ ] Multi-currency support
- [ ] Contract management and renewal tracking
- [ ] Usage overage alerts and notifications

## License

This project is proprietary software. All rights reserved.

## Contact

For questions about subscription plans, pricing, or discounts, please contact your account manager or sales team.
