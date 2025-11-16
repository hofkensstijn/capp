import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number; // percentage change
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive && (
              <>
                <TrendingUp className="h-4 w-4 text-green-500" />
                <Badge variant="outline" className="text-green-500 border-green-500">
                  +{change}%
                </Badge>
              </>
            )}
            {isNegative && (
              <>
                <TrendingDown className="h-4 w-4 text-red-500" />
                <Badge variant="outline" className="text-red-500 border-red-500">
                  {change}%
                </Badge>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Usage:
// <StatsCard
//   title="Total Items"
//   value={42}
//   change={12.5}
//   icon={<Package className="h-4 w-4" />}
// />
