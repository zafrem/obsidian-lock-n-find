# Pattern Library

## Common Patterns

- Email Address: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` - Matches email addresses
- URL: `https?://[^\s]+` - Matches web URLs
- Date: `\d{4}-\d{2}-\d{2}` - ISO date format

## Phone Numbers

- US Phone: `\d{3}[-.]?\d{3}[-.]?\d{4}` - US phone format
- Korean Mobile: `010[-\s]?\d{4}[-\s]?\d{4}` - Korean phone

## Financial

- Credit Card: `\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}` - Credit card number
- Bitcoin: `[13][a-km-zA-HJ-NP-Z1-9]{25,34}` - Bitcoin address
- Ethereum: `0x[a-fA-F0-9]{40}` - Ethereum address

## Government IDs

- US SSN: `\d{3}-\d{2}-\d{4}` - Social Security Number
- Korean ID: `\d{6}-\d{7}` - Resident registration number

## Technical

- IPv4: `\b(?:\d{1,3}\.){3}\d{1,3}\b` - IP address
- MAC Address: `([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})` - MAC address
- UUID: `[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}` - UUID
- API Key: `[a-zA-Z0-9]{32,64}` - Long alphanumeric keys

## Security

- Password Field: `(password|pwd|pass)\s*[:=]\s*\S+` - Password assignments
- Secret Key: `(secret|key|token)\s*[:=]\s*\S+` - Secret assignments
