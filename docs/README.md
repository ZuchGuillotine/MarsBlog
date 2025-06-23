# Terraforming Mars - Project Documentation

This directory contains comprehensive documentation for the Terraforming Mars Interactive Exploration Website project.

## Documentation Overview

### 📋 [Project Requirements](./project-requirements.md)
Complete Product Requirements Document (PRD) including:
- Project vision and success metrics
- Feature specifications and user stories
- Technical requirements and acceptance criteria
- Timeline and stakeholder information

### 🛠️ [Tech Stack](./tech-stack.md)
Detailed technology choices and rationale:
- Core technologies (Astro, Three.js, Tailwind CSS)
- Development and build tools
- Hosting and infrastructure decisions
- Security and performance considerations

### 🔄 [Site Flow](./site-flow.md)
Complete user experience documentation:
- Primary user journeys (Explorer, Donation, Mobile)
- Page-by-page breakdown and navigation structure
- Interactive elements and accessibility considerations
- Performance optimization and error handling

### 🏗️ [Architecture](./architecture.md)
Technical system architecture:
- Component architecture and data flow patterns
- Build-time vs runtime architecture
- API design and integration patterns
- Scalability and monitoring strategies

### 🚀 [Development Setup](./development-setup.md)
Complete development environment guide:
- Prerequisites and installation instructions
- Project structure and development workflow
- Component development guidelines
- Testing, debugging, and deployment procedures

### 🧩 [Component Specifications](./component-specifications.md)
Detailed component documentation:
- Mars Globe components (3D rendering, interactions)
- UI components (forms, navigation, layout)
- Props interfaces and state management
- Styling guidelines and accessibility requirements

## Quick Start

1. **Review Requirements**: Start with [project-requirements.md](./project-requirements.md) to understand the project scope
2. **Setup Development**: Follow [development-setup.md](./development-setup.md) for environment configuration
3. **Understand Architecture**: Read [architecture.md](./architecture.md) for system design
4. **Build Components**: Reference [component-specifications.md](./component-specifications.md) for implementation details

## Project Structure

```
MARSPOPULATION/
├── docs/                          # This documentation
├── src/
│   ├── components/               # React/Astro components
│   ├── content/                  # Blog posts and location data
│   ├── pages/                    # Route pages
│   └── styles/                   # Global styles
├── public/                       # Static assets
└── netlify/functions/           # Serverless functions
```

## Key Technologies

- **Astro**: Static site generator with island architecture
- **Three.js + React Three Fiber**: 3D Mars globe rendering
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type-safe development
- **Netlify**: Hosting and serverless functions
- **Stripe**: Payment processing

## Development Workflow

1. **Feature Planning**: Create issues and plan development
2. **Local Development**: Use `pnpm dev` for development server
3. **Component Development**: Build reusable components with proper TypeScript interfaces
4. **Testing**: Unit tests (Vitest) and E2E tests (Playwright)
5. **Code Quality**: ESLint, Prettier, and TypeScript checking
6. **Deployment**: Automatic deployment via Netlify on push to main

## Contributing Guidelines

### Code Standards
- Follow TypeScript strict mode
- Use conventional commit messages
- Maintain test coverage above 80%
- Follow component specifications in documentation

### Review Process
1. Create feature branch from main
2. Implement changes with tests
3. Run quality checks (`pnpm lint`, `pnpm type-check`)
4. Submit pull request with clear description
5. Address review feedback before merge

## Performance Targets

- **Lighthouse Score**: ≥ 90 across all categories
- **Largest Contentful Paint**: < 2.5s desktop
- **First Input Delay**: < 100ms
- **Bundle Size**: < 200KB initial JavaScript (gzipped)

## Accessibility Standards

- **WCAG 2.1 AA** compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast support
- Reduced motion preferences

## Contact & Support

- **Project Owner**: Benjamin Cox / StackTracker Labs
- **Repository**: [GitHub Repository URL]
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

---

*Last Updated: June 22, 2025*