# Feature Toggle Platform

A simple and clean Node.js microservice for managing feature flags with multi-tenant support. Perfect for teams who want to control feature rollouts without complexity.

## 🚀 What This Does

- **Feature Flags**: Turn features on/off for different users and companies
- **Multi-tenant Support**: Different companies can have different feature settings
- **Smart Rules**: Enable features for specific users, companies, or a percentage of users
- **Simple API**: Easy-to-use REST API for managing everything
- **Fast Evaluation**: Quick decisions on whether to show features

## 📋 What You Need

- Node.js 16.0.0 or higher
- npm or yarn

## 🛠 Getting Started

1. **Clone and install**:
```bash
git clone <repository-url>
cd feature-toggle-platform
npm install
```

2. **Set up configuration**:
```bash
cp config.example .env
```

3. **Start the server**:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 🏗 How It's Built

The platform is organized in a clean, easy-to-understand way:

```
src/
├── models/           # Core business logic
├── services/         # Feature evaluation engine
├── repositories/     # Data storage
├── controllers/      # API endpoints
├── routes/          # URL routing
├── middleware/      # Request processing
├── validation/      # Input checking
├── utils/           # Helper functions
└── config/          # Settings
```

### Key Parts

- **FeatureFlag**: The main model representing a feature toggle
- **Rule Engine**: Handles different types of rules (user, company, percentage)
- **Evaluation Engine**: Decides if a feature should be enabled
- **Repository**: Stores feature flags in memory
- **API**: Simple REST endpoints for everything

## 🔧 API Reference

### Creating a Feature Flag

```http
POST /api/v1/feature-flags
Content-Type: application/json

{
  "name": "new-feature",
  "description": "Enable new feature",
  "enabled": false,
  "rules": [
    {
      "type": "tenant",
      "tenantIds": ["company1", "company2"]
    }
  ]
}
```

### Listing Feature Flags

```http
GET /api/v1/feature-flags?limit=20&offset=0&search=feature
```

### Getting a Specific Feature Flag

```http
GET /api/v1/feature-flags/{id}
```

### Updating a Feature Flag

```http
PUT /api/v1/feature-flags/{id}
Content-Type: application/json

{
  "enabled": true,
  "rules": [
    {
      "type": "percentage",
      "percentage": 50
    }
  ]
}
```

### Deleting a Feature Flag

```http
DELETE /api/v1/feature-flags/{id}
```

### Checking if a Feature is Enabled

```http
POST /api/v1/feature-flags/{id}/evaluate
Content-Type: application/json

{
  "userId": "user123",
  "tenantId": "company456"
}
```

Response:
```json
{
  "success": true,
  "name": "new-feature",
  "enabled": true,
  "matchedRule": {
    "id": "rule-id",
    "type": "tenant",
    "tenantIds": ["company1"]
  }
}
```

### Health Check

```http
GET /health
```

## 🎯 Rule Types

### Company Rule
Enable a feature for specific companies:
```json
{
  "type": "tenant",
  "tenantIds": ["company1", "company2"],
  "enabled": true
}
```

### User Rule
Enable a feature for specific users:
```json
{
  "type": "user",
  "userIds": ["user1", "user2"],
  "enabled": true
}
```

### Percentage Rule
Enable a feature for a percentage of users:
```json
{
  "type": "percentage",
  "percentage": 30,
  "enabled": true
}
```

## 🔧 Configuration

Environment variables:
```bash
PORT=3000                    # Server port
NODE_ENV=development         # Environment (development/production/test)
LOG_LEVEL=info              # Log level (error/warn/info/debug)
```

## 🚀 Production Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
CMD ["npm", "start"]
```

### Health Checks
- Health endpoint: `GET /health`

## 🔄 Adding New Features

### Adding New Rule Types
1. Create a new rule class extending `Rule`
2. Implement the `evaluate(context)` method
3. Add the rule type to `RULE_TYPES` enum
4. Update `Rule.fromJSON()` to handle the new type

### Adding New Storage
1. Implement the repository interface
2. Replace the in-memory repository with your implementation
3. Add configuration for storage-specific settings

## 📈 Performance

- **Evaluation Time**: < 1ms for typical evaluations
- **Memory Usage**: Efficient in-memory storage
- **Concurrency**: Handles multiple concurrent requests

## 🔒 Security

- Input validation with Joi schemas
- CORS configuration
- Security headers with Helmet
- Error handling without information leakage
