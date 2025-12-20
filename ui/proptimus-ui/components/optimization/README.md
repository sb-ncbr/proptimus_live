# Protein Optimization Components

This directory contains components for displaying protein structure optimization progress and results.

## Components

### OptimizationLoader

Displays a loading animation with progress bar while protein optimization is in progress.

**Features:**

- Custom protein optimization animation with CSS
- ShadCN UI progress bar
- Dynamic status messages based on progress
- Error and completion states

### ProteinOptimizationAnimation

A CSS-based animation representing protein structure optimization.

**Features:**

- Animated protein structure representation
- Rotating rings around the protein
- Particle effects
- Completion and error state indicators

### ProteinComparison

Displays side-by-side comparison of original and optimized protein structures using MolStar viewer.

**Features:**

- Individual structure viewers
- Overlay comparison view
- Fallback display for raw PDB data
- Responsive grid layout

## Usage

```tsx
import { OptimizationLoader, ProteinComparison } from '@/components/optimization';

// During optimization
<OptimizationLoader
  progress={75}
  status="running"
  message="Optimizing geometry..."
/>

// After completion
<ProteinComparison
  originalPdbData={originalPdbString}
  optimizedPdbData={optimizedPdbString}
/>
```

## Dependencies

- React Query for data fetching
- MolStar for 3D visualization
- Tailwind CSS for styling
- ShadCN UI components
