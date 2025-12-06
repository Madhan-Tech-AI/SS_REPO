import { cn } from '@/lib/utils';

interface AdPlaceholderProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const AdPlaceholder = ({ size = 'small', className }: AdPlaceholderProps) => {
  const sizeClasses = {
    small: 'w-[250px] h-[250px]',
    medium: 'w-[300px] h-[250px]',
    large: 'w-[336px] h-[280px]',
  };

  return (
    <div className={cn('flex items-center justify-center bg-muted/50 border-2 border-dashed border-border rounded-lg', sizeClasses[size], className)}>
      <div className="text-center p-4">
        <div className="text-2xl mb-2">📢</div>
        <p className="text-xs text-muted-foreground font-medium">Advertisement</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">Google Ads</p>
      </div>
    </div>
  );
};
