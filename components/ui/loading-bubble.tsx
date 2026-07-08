type LoadingBubbleProps = {
  label?: string;
  className?: string;
};

export function LoadingBubble({ label = "Chargement", className = "" }: LoadingBubbleProps) {
  return (
    <div className={`flex min-h-[260px] items-center justify-center ${className}`}>
      <div
        aria-label={label}
        role="status"
        className="h-16 w-16 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600 shadow-sm"
      >
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
