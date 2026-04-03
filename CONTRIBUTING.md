# Contributing to Priv8sus

Thank you for your interest in contributing to Priv8sus!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/priv8sus.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Set up environment
cp .env.example .env

# Start backend (port 3000)
cd api && npm run dev

# Start frontend (port 5173) in another terminal
cd frontend && npm run dev
```

## Code Standards

- Use TypeScript for all new code
- Run `npm test` before committing
- Follow existing code style and conventions
- Add tests for new features

## Pull Request Process

1. Update documentation for any changed functionality
2. Ensure tests pass: `npm test`
3. Update the CHANGELOG if applicable
4. Request review from a team member

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Questions?

Reach out to the development team via the project issue tracker.