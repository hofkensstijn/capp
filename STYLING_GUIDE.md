# Styling Guide: Tailwind CSS & shadcn/ui

## Table of Contents
1. [Tailwind CSS Basics](#tailwind-css-basics)
2. [shadcn/ui Components](#shadcnui-components)
3. [Creating Custom Components](#creating-custom-components)
4. [Customizing Colors & Theme](#customizing-colors--theme)
5. [Common Patterns](#common-patterns)

---

## Tailwind CSS Basics

### How it Works
Tailwind provides utility classes that map directly to CSS properties:

```tsx
<div className="p-4 bg-blue-500 text-white rounded-lg">
  {/* Same as: padding: 1rem; background: blue; color: white; border-radius: 0.5rem; */}
</div>
```

### Most Useful Classes

#### Spacing (p=padding, m=margin)
```tsx
p-4      // padding: 1rem (all sides)
px-6     // padding-left & padding-right: 1.5rem
py-2     // padding-top & padding-bottom: 0.5rem
mt-8     // margin-top: 2rem
gap-4    // gap between flex/grid items
space-y-4  // vertical space between children
```

#### Layout
```tsx
flex               // display: flex
flex-col           // flex-direction: column
items-center       // align-items: center
justify-between    // justify-content: space-between
grid               // display: grid
grid-cols-3        // 3 equal columns
```

#### Colors
```tsx
bg-blue-500        // background
text-gray-700      // text color
border-red-200     // border color
hover:bg-blue-600  // hover state
```

#### Sizing
```tsx
w-full      // width: 100%
w-64        // width: 16rem
h-screen    // height: 100vh
max-w-xl    // max-width: 36rem
```

#### Responsive Design
```tsx
<div className="text-sm md:text-base lg:text-lg">
  {/* Small text on mobile, larger on tablets/desktop */}
</div>

// Breakpoints:
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

#### Typography
```tsx
text-sm          // font-size: 0.875rem
text-lg          // font-size: 1.125rem
font-bold        // font-weight: 700
font-semibold    // font-weight: 600
tracking-tight   // letter-spacing
leading-relaxed  // line-height
```

---

## shadcn/ui Components

### Adding Components

```bash
# See all available components
npx shadcn@latest add

# Add specific components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
```

### Using Components

#### Button
```tsx
import { Button } from "@/components/ui/button";

<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

#### Card
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Dialog (Modal)
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    <p>Modal content</p>
  </DialogContent>
</Dialog>
```

#### Form
```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

const form = useForm();

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="email@example.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

---

## Creating Custom Components

### Pattern 1: Simple Wrapper Component

```tsx
// components/MyButton.tsx
import { Button } from "@/components/ui/button";

interface MyButtonProps {
  children: React.ReactNode;
  isPrimary?: boolean;
  onClick?: () => void;
}

export function MyButton({ children, isPrimary, onClick }: MyButtonProps) {
  return (
    <Button
      variant={isPrimary ? "default" : "outline"}
      className="min-w-[120px]" // custom width
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
```

### Pattern 2: Composite Component

```tsx
// components/FeatureCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FeatureCardProps {
  title: string;
  description: string;
  tags?: string[];
  icon?: React.ReactNode;
}

export function FeatureCard({ title, description, tags, icon }: FeatureCardProps) {
  return (
    <Card className="hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
              {icon}
            </div>
          )}
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        {tags && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Pattern 3: Custom Component from Scratch

```tsx
// components/ProgressBar.tsx
interface ProgressBarProps {
  value: number; // 0-100
  color?: "blue" | "green" | "red";
  showLabel?: boolean;
}

export function ProgressBar({ value, color = "blue", showLabel }: ProgressBarProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
```

---

## Customizing Colors & Theme

### Update Tailwind Config

The theme colors are defined in `app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    /* ... */
  }
}
```

### Using Theme Colors

```tsx
// These automatically adapt to your theme:
<div className="bg-background text-foreground">
<Button variant="default">Uses --primary color</Button>
<p className="text-muted-foreground">Muted text</p>
```

---

## Common Patterns

### Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards will be 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

### Center Content
```tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="text-center">
    <h1>Centered Content</h1>
  </div>
</div>
```

### Loading State
```tsx
import { Loader2 } from "lucide-react";

<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

### Hover Effects
```tsx
<div className="
  bg-white
  hover:bg-gray-50
  hover:shadow-lg
  transition-all
  duration-300
">
  Hover me
</div>
```

### Conditional Styling
```tsx
<div className={`
  p-4 rounded-lg
  ${isActive ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}
  ${isLarge ? "text-lg" : "text-sm"}
`}>
  Content
</div>
```

---

## Tips & Best Practices

1. **Use cn() helper for conditional classes:**
   ```tsx
   import { cn } from "@/lib/utils";

   <div className={cn(
     "base-classes",
     isActive && "active-classes",
     isLarge ? "large-classes" : "small-classes"
   )}>
   ```

2. **Extract repeated patterns into components**

3. **Use Tailwind's `@apply` sparingly** (prefer utility classes)

4. **Leverage VS Code Tailwind IntelliSense extension**

5. **Check shadcn/ui docs for more components:**
   https://ui.shadcn.com

---

## Quick Reference

- **Tailwind Docs**: https://tailwindcss.com/docs
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Lucide Icons** (used in project): https://lucide.dev
- **Your components**: `components/ui/` (shadcn), `components/` (custom)
