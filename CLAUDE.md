# Project Configuration

## Package Manager
This project uses `pnpm` for package management.

- Install dependencies: `pnpm install`
- Run development server: `pnpm dev`
- Build project: `pnpm build`
- Run linting: `pnpm lint`

## Environment Variables
Required environment variables:
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` - Thirdweb client ID for frontend
- `THIRDWEB_SECRET_KEY` - Thirdweb secret key for payment link creation

## Development Guidelines
- **Never hardcode token addresses** - Use Bridge.tokens with only chainId to get all tokens for a chain