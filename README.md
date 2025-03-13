### NVM

```
nvm use
```

### Environment Variables

Create a `.env` file and configure the following variables:

| Variable               | Description                       | Example Value                                    |
| ---------------------- | --------------------------------- | ------------------------------------------------ |
| `PORT`                 | Application port                  | `5001`                                           |
| `DB_HOST`              | Database host                     | `localhost`                                      |
| `DB_PORT`              | Database port                     | `5432`                                           |
| `DB_USER`              | Database username                 | `auth-service`                                   |
| `DB_PASSWORD`          | Database password                 | `your_db_password`                               |
| `DB_NAME`              | Database name                     | `user_auth_service_db`                           |
| `JWT_SECRET`           | Secret key for JWT authentication | `your_jwt_secret`                                |
| `EMAIL_USER`           | Email username                    | `your_email@example.com`                         |
| `EMAIL_PASSWORD`       | Email password                    | `your_email_password`                            |
| `EMAIL_SERVICE`        | Email service provider            | `gmail`                                          |
| `EMAIL_HOST`           | Email SMTP host                   | `smtp.gmail.com`                                 |
| `EMAIL_PORT`           | Email SMTP port                   | `465`                                            |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID            | `your_google_client_id`                          |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret        | `your_google_client_secret`                      |
| `ACCESS_TOKEN_SECRET`  | Secret for access tokens          | `auth_access_token_secret`                       |
| `REFRESH_TOKEN_SECRET` | Secret for refresh tokens         | `auth_refresh_token_secret`                      |
| `SESSION_SECRET`       | Secret for session encryption     | `auth_secret_session`                            |
| `REDIRECT_URI`         | Google OAuth Redirect URI         | `http://localhost:5001/api/auth/google/callback` |
| `FRONTEND_URL`         | Frontend application URL          | `http://localhost:8080`                          |
| `BASE_URL`             | Backend API base URL              | `http://localhost:5001`                          |
| `REDIS_URL`            | Redis connection URL              | `redis://localhost:6379`                         |
| `REDIS_HOST`           | Redis host                        | `redis`                                          |
| `REDIS_PORT`           | Redis port                        | `6379`                                           |

#### Notes:

- Replace sensitive values with actual credentials in your `.env` file.
- **DO NOT** commit your `.env` file to version control. Add it to `.gitignore`.
- To generate a secure `VITE_ENCRYPTION_KEY`, run:
  ```sh
  openssl rand -hex 32
  ```

---

This ensures better security while keeping the README informative. Let me know if you want any further refinements! 🚀
