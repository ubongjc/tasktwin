# Documentation Update Workflow

## Reminder: Always Update FEATURES.md After Each Push

### Quick Checklist
Before pushing any changes, complete these steps:

- [ ] Update relevant sections in FEATURES.md
- [ ] Add entry to Change Log with date and branch
- [ ] Update "Last Updated" date at top of file
- [ ] List what was Added/Changed/Fixed/Removed
- [ ] Document Next Steps
- [ ] Commit FEATURES.md with your changes
- [ ] Push to branch

### Change Log Entry Template

Copy this template to FEATURES.md Change Log section:

```markdown
### YYYY-MM-DD - [Brief Description of Changes]
**Branch:** `branch-name-here`

#### Added
- [New features, files, or capabilities]
- [List each significant addition]

#### Changed
- [Modifications to existing features]
- [Updates to documentation or configuration]

#### Fixed
- [Bug fixes]
- [Issue resolutions]

#### Removed
- [Deprecated features]
- [Deleted files or functionality]

#### Next Steps
- [Upcoming tasks]
- [Planned features]
```

### Example Entry

```markdown
### 2025-11-10 - Implement Authentication System
**Branch:** `claude/add-auth-system-xyz`

#### Added
- Passkey authentication with WebAuthn
- Magic link email authentication
- User registration endpoints
- Auth session management
- Clerk integration configuration

#### Changed
- Updated database schema with users table
- Modified API routes to include auth middleware
- Enhanced .env.example with auth variables

#### Fixed
- N/A (initial implementation)

#### Removed
- N/A

#### Next Steps
- Add role-based access control
- Implement password reset flow
- Add OAuth providers (Google, GitHub)
- Create user profile management
```

### What to Document

#### Always Document
- New features or API endpoints
- Database schema changes
- New dependencies or services
- Configuration changes
- Breaking changes
- Security updates
- Bug fixes

#### Update These Sections
- **Current Features**: Move from Planned to Current when complete
- **API Reference**: Add new endpoints or modify existing ones
- **Development Setup**: Update if new tools/services required
- **Environment Variables**: Add new required variables
- **Database Schema**: Update if schema changes
- **Usage Guide**: Add instructions for new features

### Automation Ideas

Consider adding a git pre-push hook:

```bash
#!/bin/bash
# .git/hooks/pre-push

echo "Checking if FEATURES.md has been updated..."

# Get the last commit that modified FEATURES.md
LAST_FEATURES_COMMIT=$(git log -1 --format="%H" -- FEATURES.md)

# Get the current HEAD
CURRENT_HEAD=$(git rev-parse HEAD)

# Check if FEATURES.md was modified in recent commits
RECENT_CHANGES=$(git diff HEAD~3..HEAD --name-only | grep -c "FEATURES.md")

if [ "$RECENT_CHANGES" -eq 0 ]; then
    echo "⚠️  Warning: FEATURES.md hasn't been updated in the last 3 commits"
    echo "📝 Please update FEATURES.md before pushing"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✓ Proceeding with push"
```

### Integration with CI/CD

Consider adding a CI check that verifies:
- FEATURES.md "Last Updated" date is recent
- Change Log has an entry for the current date
- No TODO items are left in FEATURES.md

---

**Remember**: FEATURES.md is the source of truth for what TaskTwin can do and how it works. Keep it updated!
