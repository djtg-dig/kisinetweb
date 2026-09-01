"use client";

export type NotificationFilterValue = "all" | "unread" | "read";

type NotificationFiltersProps = {
  activeFilter: NotificationFilterValue;
  onFilterChange: (filter: NotificationFilterValue) => void;
  unreadCount?: number;
  readCount?: number;
};

const filterOptions: { value: NotificationFilterValue; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "read", label: "Lues" },
];

export function NotificationFilters({
  activeFilter,
  onFilterChange,
  unreadCount = 0,
  readCount = 0,
}: NotificationFiltersProps) {
  function getCount(value: NotificationFilterValue): number {
    switch (value) {
      case "unread":
        return unreadCount;
      case "read":
        return readCount;
      default:
        return unreadCount + readCount;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-app-border bg-app-background p-1">
      {filterOptions.map((option) => {
        const count = getCount(option.value);
        const isActive = activeFilter === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onFilterChange(option.value)}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
              isActive
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            {option.label}
            {count > 0 && (
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "bg-app-surface text-app-muted"
                }`}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
