# create-velocity-astro

Scaffold production-ready [Velocity](https://github.com/southwellmedia-dev/velocity) projects in seconds.

Velocity is an opinionated Astro 6 + Tailwind CSS v4 starter kit used by Southwell Media to deliver production client sites.

## Usage

```bash
# npm
npm create velocity-astro@latest my-site

# pnpm
pnpm create velocity-astro my-site

# yarn
yarn create velocity-astro my-site

# bun
bun create velocity-astro my-site
```

## Options

| Flag | Description |
|------|-------------|
| `--demo` | Include demo landing page and sample content |
| `--components` | Include UI component library (buttons, forms, cards, etc.) |
| `--i18n` | Add internationalization support with locale routing |
| `--yes`, `-y` | Skip prompts and use default options |
| `--help`, `-h` | Show help message |
| `--version`, `-v` | Show version number |

## Examples

### Create a minimal project

```bash
npm create velocity-astro@latest my-site
```

This gives you a clean starter with:
- Basic index, blog, and 404 pages
- Layouts and configuration
- SEO components
- Tailwind CSS v4 setup

### Create a project with demo content

```bash
npm create velocity-astro@latest my-site --demo
```

Includes the full demo landing page with:
- Hero, features, CTA sections
- Sample blog posts
- About and contact pages

### Include the UI component library

```bash
npm create velocity-astro@latest my-site --components
```

Adds 27+ production-ready components:
- Button, Input, Textarea, Select, Checkbox, Radio
- Card, Alert, Badge, Avatar, Skeleton
- Dialog, Dropdown, Tabs, Tooltip
- And more...

### Full-featured project

```bash
npm create velocity-astro@latest my-site --demo --components --i18n
```

### Skip prompts with defaults

```bash
npm create velocity-astro@latest my-site -y
```

## What's Included

Every Velocity project comes with:

- **Astro 6** - The web framework for content-driven websites
- **Tailwind CSS v4** - Utility-first CSS framework
- **TypeScript** - Type safety out of the box
- **React** - For interactive islands
- **MDX** - Write content with JSX components
- **SEO** - Meta tags, Open Graph, JSON-LD schemas
- **Sitemap** - Auto-generated sitemap.xml
- **ESLint + Prettier** - Code quality and formatting
- **Deployment configs** - Vercel, Netlify, Cloudflare ready

## Requirements

- Node.js 18.0.0 or higher
- pnpm, npm, yarn, or bun

## License

MIT - Southwell Media
