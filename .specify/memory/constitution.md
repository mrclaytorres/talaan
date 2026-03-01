<!--
  Sync Impact Report
  ==================
  Version change: N/A (template) → 1.0.0 (initial ratification)
  Modified principles: N/A (first version)
  Added sections:
    - Core Principles (4 principles: Code Quality, Testing Standards,
      UX Consistency, Performance Requirements)
    - Quality Gates
    - Development Workflow
    - Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md — ✅ No update needed
      (Constitution Check section already references constitution gates
      dynamically)
    - .specify/templates/spec-template.md — ✅ No update needed
      (spec sections align with UX and functional requirements principles)
    - .specify/templates/tasks-template.md — ✅ No update needed
      (task phases already support testing and polish phases aligned
      with principles)
  Follow-up TODOs: None
-->

# Clay Trading Journal Constitution

## Core Principles

### I. Code Quality

All code committed to this project MUST meet the following standards:

- **Readability over cleverness**: Code MUST be written for humans first.
  Favor explicit, self-documenting code over terse or overly abstract
  patterns.
- **Consistent style enforcement**: All code MUST pass configured linter
  and formatter checks before merge. No exceptions.
- **Single responsibility**: Each module, component, and function MUST
  have one clear purpose. Files exceeding 300 lines SHOULD be evaluated
  for decomposition.
- **Type safety**: TypeScript strict mode MUST be enabled. All function
  signatures MUST have explicit parameter and return types. `any` type
  usage MUST be justified in a code comment.
- **No dead code**: Unused imports, variables, functions, and commented-out
  code MUST be removed before merge.
- **Dependency discipline**: New dependencies MUST be justified. Prefer
  standard library and existing dependencies over adding new packages.
  Every added dependency MUST be evaluated for bundle size impact,
  maintenance status, and security posture.

**Rationale**: A trading journal handles financial data where correctness
is critical. Strict code quality reduces defects and ensures the codebase
remains maintainable as features grow.

### II. Testing Standards

All features MUST be verified through automated tests:

- **Test coverage requirement**: New code MUST include tests. PRs that
  reduce overall test coverage below 80% MUST NOT be merged.
- **Test categories**: The project recognizes three test tiers:
  - **Unit tests**: Isolated logic tests with no external dependencies.
    MUST run in under 5 seconds total.
  - **Integration tests**: Tests that verify interactions between modules
    or with external services (database, APIs). MUST use test fixtures
    or mocks for external services.
  - **End-to-end tests**: Tests that verify complete user flows through
    the application. MUST cover every P1 user story acceptance scenario.
- **Test-first for bug fixes**: Every bug fix MUST include a failing test
  that reproduces the bug before the fix is applied.
- **Test naming convention**: Test names MUST describe the behavior being
  verified using the pattern: `[unit under test] [scenario] [expected
  result]`.
- **No flaky tests**: Tests that intermittently fail MUST be fixed or
  quarantined within 48 hours. Quarantined tests MUST be tracked as
  issues.

**Rationale**: A trading journal records irreplaceable financial decisions.
Comprehensive testing ensures data integrity and prevents regressions
that could corrupt or lose user data.

### III. User Experience Consistency

All user-facing interfaces MUST adhere to a unified experience:

- **Design system compliance**: All UI components MUST use the project's
  shared component library. One-off styled elements MUST NOT be
  introduced without design system approval.
- **Responsive design**: All views MUST function correctly on viewport
  widths from 320px to 2560px. Mobile-first implementation is REQUIRED.
- **Loading states**: Every asynchronous operation MUST display a loading
  indicator. Users MUST never see a blank or frozen screen during data
  fetches.
- **Error feedback**: All user-facing errors MUST display actionable
  messages. Raw error codes, stack traces, or empty states without
  guidance MUST NOT be shown to users.
- **Accessibility baseline**: All interactive elements MUST be keyboard
  navigable. All images MUST have alt text. Color MUST NOT be the sole
  means of conveying information. WCAG 2.1 AA compliance is the minimum
  target.
- **Consistent data formatting**: Dates, currencies, percentages, and
  numerical values MUST use consistent formatting throughout the
  application. Formatting MUST be locale-aware.

**Rationale**: Traders rely on their journal for rapid decision review.
Inconsistent UX creates friction, erodes trust, and increases the risk
of misinterpreting financial data.

### IV. Performance Requirements

The application MUST meet the following performance targets:

- **Initial page load**: Time to First Contentful Paint MUST be under
  1.5 seconds on a 4G connection. Total bundle size for initial load
  MUST NOT exceed 200KB gzipped.
- **Navigation transitions**: Client-side route changes MUST complete
  rendering within 300ms.
- **API response times**: Backend endpoints MUST respond within 200ms
  at p95 under normal load. Database queries MUST NOT exceed 100ms
  individually.
- **Data table rendering**: Trade lists and journal tables MUST render
  up to 1,000 rows without perceptible lag. Virtualized scrolling MUST
  be used for datasets exceeding 100 visible rows.
- **Lighthouse score**: Production builds MUST maintain a Lighthouse
  performance score of 90 or above.
- **No memory leaks**: Long-running sessions (1+ hour) MUST NOT exhibit
  monotonically increasing memory consumption. Event listeners and
  subscriptions MUST be cleaned up on component unmount.

**Rationale**: Traders often review their journal during active market
hours where every second matters. Poor performance directly impacts the
user's ability to make timely decisions.

## Quality Gates

All code changes MUST pass through the following gates before merge:

1. **Static Analysis Gate**: Linter and type-checker MUST report zero
   errors. Warnings exceeding the configured threshold MUST be resolved.
2. **Test Gate**: All unit and integration tests MUST pass. Test coverage
   MUST meet or exceed the 80% threshold.
3. **Build Gate**: The project MUST compile and build without errors in
   both development and production configurations.
4. **Performance Gate**: Bundle size MUST NOT increase by more than 5%
   without explicit justification. No new Lighthouse regressions
   permitted.
5. **Security Gate**: No new high or critical severity vulnerabilities
   permitted from dependency audits. Secrets MUST NOT appear in
   committed code.

## Development Workflow

Standards for how development work is structured and reviewed:

- **Branch strategy**: All work MUST be done on feature branches created
  from `main`. Branch names MUST follow the pattern
  `[issue-number]-[short-description]`.
- **Commit discipline**: Commits MUST be atomic and focused on a single
  logical change. Commit messages MUST follow Conventional Commits
  format (`type: description`).
- **Code review requirement**: All PRs MUST receive at least one
  approving review before merge. Self-merges to `main` are prohibited.
- **Documentation updates**: Changes to public APIs, configuration, or
  user-facing behavior MUST include corresponding documentation updates
  in the same PR.
- **Specification-first development**: Features MUST have an approved
  spec (via the speckit workflow) before implementation begins. Ad-hoc
  features without specifications are prohibited.

## Governance

This constitution is the authoritative source of project standards. In
any conflict between this document and other project documentation, this
constitution takes precedence.

- **Amendment process**: Amendments MUST be proposed via PR, reviewed,
  and approved before taking effect. Each amendment MUST include a
  migration plan for existing code that does not comply.
- **Versioning policy**: The constitution follows semantic versioning.
  MAJOR: principle removals or incompatible redefinitions. MINOR: new
  principles or materially expanded guidance. PATCH: clarifications and
  non-semantic refinements.
- **Compliance review**: Every PR review MUST include a check against
  applicable constitution principles. Non-compliance MUST be flagged
  and resolved before merge.
- **Exception process**: Temporary exceptions to any principle MUST be
  documented as a code comment referencing the specific principle and
  an associated tracking issue for remediation.

**Version**: 1.0.0 | **Ratified**: 2026-02-28 | **Last Amended**: 2026-02-28
