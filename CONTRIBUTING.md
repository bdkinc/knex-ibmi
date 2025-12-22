# Contributing to @bdkinc/knex-ibmi

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/knex-ibmi.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Setup

This project requires Node.js >= 16.

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Build the project
npm run build
```

## Code Style

- We use TypeScript with strict null checks
- ESLint and Prettier are used for code formatting
- Run `npm run lint` and `npm run format` before committing

## Testing

- Write tests for new features and bug fixes
- Tests are located in the `test/` directory
- Unit tests go in `test/unit/`
- Integration tests (requiring a live IBM i DB2 connection) go in `test/integration/`
- Run tests with `npm test`

## Pull Request Process

1. Ensure your code passes all tests and linting
2. Update documentation if needed
3. Add a description of your changes
4. Reference any related issues

## IBM i-Specific Considerations

When contributing, keep in mind these IBM i DB2 quirks:

- **Case Sensitivity**: IBM i normalizes identifiers to uppercase by default
- **Auto-Commit DDL**: DDL operations auto-commit immediately
- **RETURNING Limitations**: Not natively supported over ODBC; the dialect emulates this behavior
- **ODBC Driver**: Uses the IBM i Access ODBC Driver

## Reporting Issues

- Use the GitHub issue templates
- Include relevant error messages and logs
- Specify your Node.js version, IBM i version, and ODBC driver version

## Questions?

Feel free to open an issue for questions or discussions.
