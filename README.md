# 📡 I75 League – Scraper Microservice

This repository powers the live-score and historical-data feeds for **I75 League** recaps. It’s an AWS CDK–driven microservice that scrapes sports websites, generates weekly snapshots, and writes them to S3/DynamoDB for consumption by the front-end.

Built with **Node.js**, **TypeScript**, **AWS CDK v2**, **AWS Lambda**, **DynamoDB**, **S3**, **Jest**, **ESLint (Flat Config)**, **Husky**, **Lint-Staged**, and more.

---

## 🛡️ Badges

🚦 CI status  
[![CI status](https://github.com/Afroid/i75-scraper/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Afroid/i75-scraper/actions/workflows/ci.yml)

🧪 Code coverage  
[![Codecov](https://img.shields.io/codecov/c/github/Afroid/i75-scraper?branch=main&logo=codecov)](https://codecov.io/gh/Afroid/i75-scraper)

---

## 🚀 Features

- **Live scraping** of MLB (and soon NFL/Fantasy) scores  
- **Historical snapshots** generation (week-by-week JSON)  
- **Infrastructure as code** via AWS CDK (Lambda, S3, DynamoDB stacks)  
- **Automated deployments** with GitHub Actions & CDK pipelines  
- **Secure IAM policies** and minimal-privilege roles  

---

## 📦 Local Development Setup

### Requirements
- **Node.js** v20.x  
- **npm** v9.x or **Yarn**  
- **AWS CLI** v2 (configured with your credentials/profile)  
- **AWS CDK** v2 (`npm install -g aws-cdk`)  
- **Git**

### Getting Started
1. **Clone the repo:**
git clone https://github.com/Afroid/i75-scraper.git
cd i75-scraper

2. **Install dependencies:**

```bash
npm install
```

3. **(Once) Bootstrap your AWS account for CDK**

```bash
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

4. **Build & deploy everything**

```bash
npm run deploy
```

5. **Run your Jest tests**

```bash
npm test
```

Environment variables required by the Lambdas should be defined in cdk/stack.ts or via your AWS Parameter Store.

---

🧪 Testing
We use Jest for unit tests and coverage.

Test Scripts
| Script                  | Command                  | Description                                |
| ----------------------- | ------------------------ | ------------------------------------------ |
| `npm test`              | Run all Jest tests once  |                                            |
| `npm run test:watch`    | Run Jest in watch mode   | Re-runs on file changes                    |
| `npm run test:coverage` | Generate coverage report | Outputs HTML & text-summary in `/coverage` |

---

🛠️ Key Scripts

| Script             | Command                 | Description                                          |
| ------------------ | ----------------------- | ---------------------------------------------------- |
| **build**          | `npm run build`         | Compile TypeScript                                   |
| **infra\:deploy**  | `npm run infra:deploy`  | Install infra deps, build, then `cdk deploy`         |
| **deploy**         | `npm run deploy`        | `build` + `infra:deploy` in one step                 |
| **lint**           | `npm run lint`          | Run ESLint on all `.ts` files                        |
| **test**           | `npm test`              | Run Jest tests (silent, run in band, detect handles) |
| **test\:coverage** | `npm run test:coverage` | Run Jest with coverage report                        |
| **test\:debug**    | `npm run test:debug`    | Run Jest in debug mode                               |
| **prepare**        | `npm run prepare`       | Install Husky Git hooks                              |

---

🛠 Code Quality

- **ESLint** (Flat Config)
- **Husky** (Git pre-commit hooks)
- **Lint-Staged** (only lints staged files on commit)

---

## ✍️ Author

**The John**

---

## 📜 License

This project is private to the I75 League.
Contact the repo owner for questions or to collaborate.
