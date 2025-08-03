# DescoWise Development Guide

## Getting Started

This guide will help you set up your development environment and understand the codebase structure for contributing to DescoWise.

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **Modern Browser** (Chrome, Firefox, Safari, Edge)

### Recommended Tools
- **Visual Studio Code** - [Download](https://code.visualstudio.com/)
- **React Developer Tools** - Browser extension
- **TypeScript** - Language support
- **Tailwind CSS IntelliSense** - VS Code extension

## Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/descowise.git
cd descowise

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Optional: Customize AI model settings
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.3

# Development flags (optional)
VITE_DEBUG_MODE=true
```

### 3. Development Server

```bash
# Start development server with hot reload
npm run dev

# The app will be available at http://localhost:5173
```

## Project Structure Deep Dive

### Core Directories

```
descowise/
├── 📁 components/           # React components
│   ├── 📁 account/         # Account management components
│   │   ├── AccountInfoRow.tsx
│   │   └── BalanceDisplay.tsx
│   ├── 📁 common/          # Reusable UI components
│   │   ├── Icons.tsx       # Icon components
│   │   ├── Modal.tsx       # Modal system
│   │   └── Notification.tsx
│   ├── 📁 dashboard/       # Dashboard-specific components
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardSections.tsx
│   │   └── AiInsights/     # AI-related components
│   └── 📁 settings/        # Settings components
├── 📁 services/            # Business logic and API services
│   ├── descoService.ts     # DESCO API integration
│   ├── notificationService.ts # Push notifications
│   └── balanceWarningService.ts
├── 📁 hooks/               # Custom React hooks
│   ├── useAccounts.ts      # Account management
│   ├── useBalanceWarning.ts
│   └── usePerformanceOptimization.ts
├── 📁 utils/               # Utility functions
│   ├── 📁 locales/        # Translation files
│   ├── api.ts             # API utilities
│   ├── balanceCalculations.ts
│   └── dataSanitization.ts
├── 📁 ai/                  # AI-related functionality
│   └── promptGenerators.ts
└── types.ts                # TypeScript definitions
```

### Key Files

- **`App.tsx`** - Main application component with routing
- **`types.ts`** - Central TypeScript type definitions
- **`index.tsx`** - Application entry point
- **`vite.config.ts`** - Build configuration

## Development Workflow

### 1. Feature Development

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code changes ...

# Test your changes
npm run build
npm run preview

# Commit and push
git add .
git commit -m "Add: your feature description"
git push origin feature/your-feature-name
```

### 2. Component Development

#### Creating a New Component

```typescript
// components/example/ExampleComponent.tsx
import React from 'react';

interface ExampleComponentProps {
  title: string;
  onAction: () => void;
  isLoading?: boolean;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  onAction,
  isLoading = false
}) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h2 className="text-xl font-bold text-slate-100">{title}</h2>
      <button
        onClick={onAction}
        disabled={isLoading}
        className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
      >
        {isLoading ? 'Loading...' : 'Action'}
      </button>
    </div>
  );
};

export default ExampleComponent;
```

#### Component Guidelines

1. **Use TypeScript interfaces** for all props
2. **Follow naming conventions** (PascalCase for components)
3. **Use Tailwind CSS** for styling
4. **Include proper accessibility** attributes
5. **Handle loading and error states**

### 3. Service Development

#### Creating a New Service

```typescript
// services/exampleService.ts
import { fetchJsonWithHandling } from '../utils/api';

export interface ExampleData {
  id: string;
  name: string;
  value: number;
}

export interface ExampleResponse {
  success: boolean;
  data?: ExampleData;
  message?: string;
}

export const getExampleData = async (id: string): Promise<ExampleResponse> => {
  try {
    const url = `https://api.example.com/data/${id}`;
    const result = await fetchJsonWithHandling(url);
    
    if (result.code === 200 && result.data) {
      return { success: true, data: result.data };
    } else {
      return { success: false, message: result.message || 'Data not found' };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error occurred' };
  }
};
```

#### Service Guidelines

1. **Use consistent error handling** patterns
2. **Return typed responses** with success/error states
3. **Include proper TypeScript types**
4. **Handle network errors gracefully**
5. **Use the existing API utilities**

### 4. Hook Development

#### Creating a Custom Hook

```typescript
// hooks/useExample.ts
import { useState, useEffect, useCallback } from 'react';
import { getExampleData, ExampleData } from '../services/exampleService';

export const useExample = (id: string) => {
  const [data, setData] = useState<ExampleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getExampleData(id);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  return { data, loading, error, refetch: fetchData };
};
```

## Code Style Guidelines

### TypeScript Best Practices

1. **Use strict type checking**
2. **Define interfaces for all data structures**
3. **Use union types for state management**
4. **Avoid `any` type - use `unknown` instead**
5. **Use proper generic types**

### React Best Practices

1. **Use functional components with hooks**
2. **Implement proper error boundaries**
3. **Use `useCallback` and `useMemo` for optimization**
4. **Handle loading and error states**
5. **Use proper key props for lists**

### CSS/Styling Guidelines

1. **Use Tailwind CSS utility classes**
2. **Follow mobile-first responsive design**
3. **Use consistent color scheme (slate/cyan)**
4. **Implement proper hover and focus states**
5. **Ensure accessibility compliance**

## Testing Guidelines

### Component Testing

```typescript
// tests/ExampleComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ExampleComponent from '../components/example/ExampleComponent';

describe('ExampleComponent', () => {
  it('renders with title', () => {
    render(
      <ExampleComponent 
        title="Test Title" 
        onAction={() => {}} 
      />
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', () => {
    const mockAction = jest.fn();
    render(
      <ExampleComponent 
        title="Test" 
        onAction={mockAction} 
      />
    );
    
    fireEvent.click(screen.getByText('Action'));
    expect(mockAction).toHaveBeenCalled();
  });
});
```

### Service Testing

```typescript
// tests/exampleService.test.ts
import { getExampleData } from '../services/exampleService';

// Mock the API utility
jest.mock('../utils/api');

describe('exampleService', () => {
  it('returns data on successful API call', async () => {
    const mockData = { id: '1', name: 'Test', value: 100 };
    
    // Mock implementation
    (fetchJsonWithHandling as jest.Mock).mockResolvedValue({
      code: 200,
      data: mockData
    });

    const result = await getExampleData('1');
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
  });
});
```

## Debugging Tips

### 1. Browser Developer Tools

- **React DevTools**: Inspect component state and props
- **Network Tab**: Monitor API calls and responses
- **Console**: Check for JavaScript errors and warnings
- **Application Tab**: Inspect localStorage and service workers

### 2. Common Issues

#### API Integration Issues
```typescript
// Add debugging to API calls
console.log('API Request:', { url, params });
const result = await fetchJsonWithHandling(url);
console.log('API Response:', result);
```

#### State Management Issues
```typescript
// Debug hook state changes
useEffect(() => {
  console.log('State changed:', { data, loading, error });
}, [data, loading, error]);
```

#### Performance Issues
```typescript
// Use React Profiler
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log('Render:', { id, phase, actualDuration });
};

<Profiler id="ComponentName" onRender={onRenderCallback}>
  <YourComponent />
</Profiler>
```

## Build and Deployment

### Local Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Check build size
npm run build -- --analyze
```

### Deployment

```bash
# Deploy to Vercel
npm run deploy

# Or deploy manually
vercel --prod
```

## Contributing Guidelines

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes with tests**
4. **Update documentation if needed**
5. **Submit a pull request**

### Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] Components are properly typed
- [ ] Error handling is implemented
- [ ] Responsive design is maintained
- [ ] Accessibility is considered
- [ ] Performance impact is minimal
- [ ] Documentation is updated

## Resources

### Documentation
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide)

### Tools
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Tailwind CSS Playground](https://play.tailwindcss.com)

### Community
- [React Community](https://reactjs.org/community/support.html)
- [TypeScript Community](https://www.typescriptlang.org/community)
- [Vite Discord](https://chat.vitejs.dev)
