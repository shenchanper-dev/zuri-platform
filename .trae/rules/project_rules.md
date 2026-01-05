# ZURI Platform - trae.ai Integration Rules

## Project Context
- **Architecture**: Clean Architecture + SOLID Principles  
- **Stack**: Next.js 14, React 18, TypeScript, PostgreSQL
- **Main Ports**: 3000-3003 (RESERVED - DO NOT USE)
- **trae.ai Ports**: 8000-8010 (DEDICATED RANGE)

## AI Assistance Guidelines
- **Primary Role**: Code analysis, refactoring suggestions, documentation
- **Secondary Role**: Prototype new features in `/prototypes` folder only
- **PROHIBITED**: Direct modification of production code
- **REQUIRED**: Human review before ANY code integration

## Memory & Performance Limits
- **Max Memory**: 512MB for all trae.ai processes
- **CPU Limit**: 25% maximum usage
- **Auto-shutdown**: After 30 minutes inactivity

## Integration Rules
- ✅ USE FOR: Code analysis, suggestions, prototyping, documentation
- ❌ NEVER MODIFY: Core architecture files, production database
- ✅ PRESERVE: Existing Clean Architecture patterns
- ❌ NEVER USE: Ports 3000, 3001, 3002, 3003

## Workflow Rules
1. Always work in `/prototypes` directory for new features
2. All AI suggestions must be reviewed by human developer
3. No direct commits to main branch from AI recommendations
4. Maintain ZURI coding standards and conventions