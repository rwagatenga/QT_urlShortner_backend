# Auth Service

The `auth-service` is a Node.js application for managing user authentication and authorization. It includes user registration, login, email verification, token-based authentication, and OAuth integrations with Google and LinkedIn.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
- [Scripts](#scripts)
- [API Documentation](#api-documentation)
- [Dependencies](#dependencies)
- [License](#license)

---

## Features

- User Registration with role-based access (`candidate` or `company`).
- Email verification using JWT tokens.
- Login with email and password.
- Token refresh endpoint.
- OAuth integration with Google and LinkedIn.
- API documentation with Swagger.
- Sequelize ORM for database interaction.
- TypeScript for static typing.
- Prettier and ESLint for code quality.

---

## Getting Started

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd auth-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the project root and configure the following variables:

```.env
cp .env.example .env

```

### Database Setup

1. Run migrations:

   ```bash
   npm run db:migrate
   ```

2. (Optional) Seed the database:
   ```bash
   npm run db:seed
   ```

---

## Scripts

The following scripts are available:

| Script                    | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `npm run build`           | Lints, formats, and compiles the TypeScript code. |
| `npm run dev`             | Starts the development server.                    |
| `npm run test`            | Runs tests (currently not implemented).           |
| `npm run lint`            | Lints the code using ESLint.                      |
| `npm run format:fix`      | Fixes formatting issues using Prettier.           |
| `npm run db:migrate`      | Runs database migrations.                         |
| `npm run db:seed`         | Seeds the database.                               |
| `npm run db:migrate:undo` | Reverts the last migration.                       |
| `npm run db:seed:undo`    | Reverts the last seed.                            |

---

## API Documentation

API documentation is available at:

```
http://localhost:<PORT>/api-docs
```

## Dependencies

Key dependencies:

- **Backend**: Express, Sequelize, Passport, JWT.
- **Authentication**: Passport strategies for Google and LinkedIn.
- **Database**: PostgreSQL, Sequelize ORM.
- **Code Quality**: TypeScript, ESLint, Prettier.

Refer to `package.json` for the complete list.

---
