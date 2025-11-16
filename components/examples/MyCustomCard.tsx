import { ReactNode } from "react";

interface MyCustomCardProps {
  title: string;
  children: ReactNode;
  highlight?: boolean;
}

export function MyCustomCard({ title, children, highlight }: MyCustomCardProps) {
  return (
    <div
      className={`
        rounded-lg border p-6 shadow-sm
        ${highlight ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}
        hover:shadow-md transition-shadow
      `}
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="text-gray-600">{children}</div>
    </div>
  );
}

// Usage:
// <MyCustomCard title="Hello" highlight>
//   <p>This is my content</p>
// </MyCustomCard>
