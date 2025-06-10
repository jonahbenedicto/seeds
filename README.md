# seeds
Generates a Seeds cellular automata simulation from a GitHub user's contributions and outputs a screen capture as an animated SVG.

![Seeds Animation](./demos/demo-two-cluster.svg)

## Quick Start with GitHub Actions

### 1. Fork This Repository
Fork this repository to your GitHub account to get your own copy.

### 2. Enable Repository Permissions
1. Go to your forked repository's **Settings** → **Actions** → **General**
2. Under "Workflow permissions", select **"Read and write permissions"**
3. Check **"Allow GitHub Actions to create and approve pull requests"**
4. Click **Save**

### 3. Enable Actions
1. Go to the **Actions** tab in your forked repository
2. Click **"I understand my workflows, go ahead and enable them"**

### 4. Generate Animations
The workflow will automatically run daily, or you can trigger it manually:

1. Go to **Actions** → **Generate Seeds Animations**
2. Click **"Run workflow"**
3. Choose your pattern type:
   - `contribution-based` - Uses your GitHub contribution data
   - `random` - Random starting pattern
   - `two-cluster` - Two-cell cluster pattern for Seeds
   - `seeds-explosion` - Seeds explosion pattern for dramatic effect
   - `all-patterns` - Generates all pattern types
4. Click **"Run workflow"**

Generated animations will appear in the `assets/` folder and can be used in your README:

```markdown
![Seeds](https://github.com/YOUR_USERNAME/seeds/raw/main/assets/FILE-NAME.svg)
```

## CLI Usage

For local development or custom usage:

```bash
# Install and build
npm install && npm run build

# Generate animation
node dist/cli/command-line.js -u YOUR_USERNAME -o seeds.svg

# With GitHub token for contribution data
node dist/cli/command-line.js -u YOUR_USERNAME -o seeds.svg --github-token YOUR_TOKEN --pattern contribution-based
```

## Usage Options

**Required:**
- `-u, --username` - GitHub username
- `-o, --output` - Output file (.svg or .gif)

**Optional:**
- `--pattern` - Pattern type: `contribution-based`, `random`, `two-cluster`, `seeds-explosion`
- `--generations` - Number of generations (default: 50)
- `--frame-duration` - Animation speed in ms (default: 100)
- `--github-token` - GitHub token for contribution data
- `--initial-display-duration` - Time to show initial pattern (ms)
- `--show-progress-bar` - Add progress bar below animation
