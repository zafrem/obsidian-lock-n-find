# System Design Document - Obsidian Lock n Find Plugin

## Introduction

### Purpose
This document describes the system design for the Obsidian Lock n Find plugin, which enables users to search, mask, and protect personal data within their Obsidian notes.

### Scope
All features will be implemented using the Obsidian API. The plugin will provide functionality for searching, masking, unmasking, and managing personal data within Obsidian notes.

### Glossary
- **Obsidian**: A flexible, secure note-taking app that lets you work the way you think.
- **Regex**: Regular expressions used for pattern matching in text.
- **Masking**: The process of hiding sensitive information while preserving its structure.
- **Unmasking**: The process of revealing previously masked information.

## Requirements Summary

### Functional Requirements

| Feature | Description |
| --- | --- |
| Personal Data Search | Searches notes with user-defined regular expressions to locate personal data. |
| Personal Data Mask/Unmask/Delete | Masks, unmasks, or deletes data selected by the user. |
| Personalized Unmasking | Unmasks data using the user's password. |

### Non-Functional Requirements

| Non-Functional | Description |
| --- | --- |
| Search Optimization | Re-indexes when search rules change or notes are added, deleted, or modified. |
| Masking Safety | Secures data through encryption or a protected database. |
| Usability | Provides automation (search, masking) and intuitive user controls. |

## System Architecture

### Block Diagram

```
+---------------------+     +---------------------+
|                     |     |                     |
|  Obsidian API       |<--->|  Lock n Find Plugin |
|                     |     |                     |
+---------------------+     +---------+-----------+
                                     |
                                     v
                            +---------+-----------+
                            |                     |
                            |  User Interface     |
                            |  - Settings         |
                            |  - Side Panel       |
                            |  - Status Bar       |
                            |                     |
                            +---------------------+
```

### Layer Stack

1. **Presentation Layer**
   - Settings Window
   - Side Panel
   - Status Bar Indicator

2. **Business Logic Layer**
   - Search Engine
   - Masking/Unmasking Logic
   - Verification System

3. **Data Layer**
   - Configuration Storage
   - Masked Data Storage
   - Search Index

## Module Design

### Search Module
- **Role**: Locate personal data based on regex patterns
- **Inputs**: Regex patterns, note content
- **Outputs**: Search results with locations
- **Dependencies**: Obsidian API, Configuration Module

### Masking Module
- **Role**: Hide sensitive information
- **Inputs**: Selected text, masking options
- **Outputs**: Masked text
- **Dependencies**: Encryption Service, Configuration Module

### Verification Module
- **Role**: Verify patterns and validate data
- **Inputs**: Regex patterns, sample data
- **Outputs**: Validation results
- **Dependencies**: Configuration Module, LLM Service (if applicable)

### UI Module
- **Role**: Provide user interface components
- **Inputs**: User interactions, system state
- **Outputs**: Visual representation
- **Dependencies**: Obsidian API, All other modules

## Data Design

### Core Entities

1. **Configuration**
   - Search rules (default and custom regex)
   - User preferences
   - Verification settings

2. **SearchResult**
   - File path
   - Match position
   - Match content
   - Status (masked/unmasked)

3. **MaskedData**
   - Original content (encrypted)
   - Masked representation
   - Timestamp
   - Access control information

## Interface Design

### API Specifications

#### Search API
```typescript
interface SearchAPI {
  startSearch(patterns: RegExp[]): Promise<SearchResult[]>;
  stopSearch(): void;
  getSearchStatus(): SearchStatus;
}
```

#### Masking API
```typescript
interface MaskingAPI {
  maskData(text: string, type: MaskingType): string;
  unmaskData(maskedText: string, password: string): string | null;
  deleteData(text: string): boolean;
}
```

### Sequence Diagrams

#### Search Sequence
```
User -> UI: Initiate search
UI -> SearchModule: startSearch(patterns)
SearchModule -> ObsidianAPI: getFiles()
ObsidianAPI -> SearchModule: files[]
SearchModule -> SearchModule: processFiles(files)
SearchModule -> UI: searchResults[]
UI -> User: Display results
```

#### Masking Sequence
```
User -> UI: Select text to mask
UI -> MaskingModule: maskData(text, type)
MaskingModule -> EncryptionService: encrypt(text)
EncryptionService -> MaskingModule: encryptedText
MaskingModule -> UI: maskedRepresentation
UI -> User: Display masked text
```

## UI/UX Sketches

### Settings Window
- Search Role Configuration
  - Default regex patterns
  - Custom regex patterns
- Verification Section
  - Pattern testing
  - LLM role configuration

### Side Window
- Button to open Settings Window
- Text showing last verified/scan time
- Start/Stop scanning buttons
- Find/Lock window controls

### Status Bar
- Indicator showing scanning status or completion

## Exception & Error Handling

### Code-Level Exceptions
- Invalid regex pattern handling
- File access errors
- Encryption/decryption failures

### User-Level Errors
- Incorrect password for unmasking
- No search results found
- Performance issues with complex patterns

## Performance & Security

### Performance Targets
- Search completion < 5 seconds for 1000 notes
- UI responsiveness during background operations

### Security Considerations
- Encrypted storage of original sensitive data
- Password-protected unmasking
- No external data transmission

## Test Plan

### Unit Tests
- Regex pattern validation
- Masking/unmasking functionality
- Configuration persistence

### Integration Tests
- Search module with Obsidian API
- UI interaction with business logic

### System Tests
- End-to-end workflow testing
- Performance under load
- Security vulnerability testing

## Deployment & Operations

### Infrastructure
- Plugin packaged as standard Obsidian plugin
- Local storage for configuration and masked data

### Versioning
- Semantic versioning (MAJOR.MINOR.PATCH)
- Changelog maintenance

### Rollback Procedures
- Version-specific configuration backup
- Data recovery options

## Traceability Matrix

| Requirement | Design Component | Test Case |
| --- | --- | --- |
| Personal Data Search | Search Module | TC-001: Basic Search |
| Masking/Unmasking | Masking Module | TC-002: Mask/Unmask Cycle |
| Search Optimization | Search Module, Indexing | TC-003: Performance Test |
| Masking Safety | Encryption Service | TC-004: Security Test |

## Appendices

### References
- Obsidian API Documentation
- Regular Expression Standards
- Encryption Best Practices

### Revision History

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1 | 2025-07-24 | | Draft document structure |
