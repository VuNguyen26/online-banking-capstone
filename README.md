# SafeBank - Online Banking System

SafeBank is a blockchain-based term deposit system developed for the Blockchain Programming Capstone Project.

## Current Status

The project is currently in Phase 0 - Project Initialization.

Smart contracts, tests, deployment scripts, frontend applications, bonus features, and AI assistants have not been implemented yet.

## Planned Core Contracts

- MockUSDC.sol: six-decimal ERC20 test token.
- VaultManager.sol: manages the bank interest liquidity vault.
- SavingCore.sol: manages saving plans, deposits, withdrawals, renewals, and ERC721 deposit certificates.

## Architecture Principle

SavingCore holds user principal.

VaultManager holds bank-funded interest liquidity.

Interest must never be paid using another depositor's principal.

## Personal Variant

Student ID: 3122560090

- Grace period: 2 days
- Default APR: 200 bps (2.00% APR)
- Early withdrawal penalty: 750 bps (7.50%)
- Default tenor: 180 days
- MockUSDC decimals: 6

## Local Requirements

- Node.js
- npm
- Hardhat
- MetaMask for frontend and Sepolia demonstrations

## Available Commands

- npm install
- npm run compile
- npm test
- npm run coverage
- npm run clean
- npm run size

## Security Notice

MockUSDC is a test token only and has no real-world monetary value.

Never commit private keys, wallet seed phrases, API secrets, or the local .env file.

## Documentation

Detailed architecture, security decisions, design answers, deployment instructions, and demo instructions will be added in later project phases.
