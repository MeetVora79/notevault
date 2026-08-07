import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLogoutMutation } from "@/features/auth/authApi";
import { logoutLocal } from "@/features/auth/authSlice";
import { toggleTheme } from "@/features/theme/themeSlice";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Pin,
  Archive,
  Trash2,
  Tag,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "all", label: "All notes", icon: FileText },
  { key: "pinned", label: "Pinned", icon: Pin },
  { key: "archived", label: "Archive", icon: Archive },
  { key: "trashed", label: "Trash", icon: Trash2 },
];

export default function Sidebar({ activeView, onViewChange, labels }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const mode = useSelector((state) => state.theme.mode);
  const [logout] = useLogoutMutation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      dispatch(logoutLocal());
    }
  };

  const NavButton = ({ item, active, onClick }) => {
    const Icon = item.icon;
    const button = (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
          collapsed ? "justify-center" : ""
        } ${
          active
            ? "bg-brand/10 text-brand"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        <Icon size={17} strokeWidth={2} className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    );

    if (!collapsed) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <aside
      className={`shrink-0 h-screen border-r border-border flex flex-col bg-background transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div
        className={`flex items-center px-4 py-5 ${collapsed ? "justify-center" : "justify-between"}`}
      >
        {!collapsed && (
          <h1 className="font-display font-semibold text-lg tracking-tight">
            Notes<span className="text-brand">AI</span>
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 cursor-pointer"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            active={activeView === item.key}
            onClick={() => onViewChange(item.key)}
          />
        ))}

        {labels?.length > 0 && (
          <>
            <Separator className="my-3" />
            {!collapsed && (
              <p className="px-3 text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Tag size={13} /> Labels
              </p>
            )}
            {labels.map((label) => {
              const button = (
                <button
                  key={label}
                  onClick={() => onViewChange(`label:${label}`)}
                  className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    activeView === `label:${label}`
                      ? "bg-brand/10 text-brand"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {collapsed ? (
                    <span className="text-xs font-mono">
                      <Tag size={12} />
                    </span>
                  ) : (
                    <span className="truncate">{label}</span>
                  )}
                </button>
              );
              return collapsed ? (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ) : (
                button
              );
            })}
          </>
        )}
      </nav>

      <Separator />

      <div
        className={`p-3 space-y-3 ${collapsed ? "flex flex-col items-center" : ""}`}
      >
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <p className="px-3 text-sm font-medium text-muted-foreground tracking-wide mb-1 flex items-center gap-1.5">
              Theme
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => dispatch(toggleTheme())}
            >
              {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => dispatch(toggleTheme())}
          >
            {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        )}

        <div
          className={`flex items-center gap-2 ${collapsed ? "flex-col" : "w-full"}`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0 bg-green-950"
            style={{ backgroundColor: user?.avatarColor }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Log out</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut size={14} className="mr-2" /> Log out
          </Button>
        )}
      </div>
    </aside>
  );
}
