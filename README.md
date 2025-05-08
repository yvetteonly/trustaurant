# Trustaurant - Blockchain-Based Restaurant Management System

**Trustaurant** is a decentralized application (dApp) that leverages blockchain technology to create a transparent, secure, and efficient restaurant management system. The platform bridges the gap between restaurant owners and customers using smart contracts, ensuring seamless meal ordering, secure payments, and streamlined request management.

---

## Project Overview

This project demonstrates how blockchain can be applied beyond finance by offering a practical solution for restaurant operations. Trustaurant allows:

* **Restaurant Owners** to manage meals, process customer requests, and handle funds.
* **Customers** to browse meals, deposit funds, make requests, and track order statuses.

---

## Technology Stack

| Layer              | Tech Used          |
| ------------------ | ------------------ |
| Frontend           | React.js + Vite    |
| Smart Contracts    | Solidity (v0.8.0+) |
| Development Tools  | Hardhat            |
| Blockchain API     | ethers.js          |
| Wallet Integration | MetaMask           |

---

## Features

### For Restaurant Owners (Admin)

* Add, delete, and toggle meal availability
* Review and approve/deny customer requests
* Monitor restaurant balance
* Withdraw accumulated funds securely

### For Customers

* Browse current meal offerings
* Deposit ETH into the system
* Request meals directly from the dApp
* View real-time status of their requests

---

## Smart Contract Architecture

The core logic is defined in `Trustaurant.sol`:

* Meal management (add, remove, availability toggle)
* Request lifecycle (submit, approve, track)
* Role-based access (Owner vs. Customer)
* Balance tracking and fund withdrawal logic

---

## Project Structure

```
trustaurant/
├── contracts/             # Smart contract files
│   └── Trustaurant.sol    # Main contract
├── frontend/              # React frontend
│   ├── src/               # React components & pages
│   └── public/            # Static assets
├── scripts/               # Contract deployment scripts
├── test/                  # Smart contract tests
├── hardhat.config.js      # Hardhat config
└── README.md              # Project documentation
```

---

## Getting Started

### Prerequisites

* Node.js & npm
* MetaMask browser extension

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd trustaurant
```

Install backend dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

---

## Running the Application

Start local Hardhat blockchain:

```bash
npx hardhat node
```

Deploy the smart contract:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Connect MetaMask to `http://localhost:8545` and import a test account using its private key from the Hardhat node.

---

## Testing

Run smart contract tests with gas reporting:

```bash
REPORT_GAS=true npx hardhat test
```

---

## Useful Hardhat Tasks

```bash
npx hardhat help
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

---

## Security Considerations

* Role-based access control restricts admin actions
* Balance logic prevents unauthorized withdrawals
* All transactions are validated on-chain

---

## License

This project is licensed under the **MIT License** – see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

Built with love using Solidity, React, and Hardhat. Special thanks to the Ethereum and open-source community!
