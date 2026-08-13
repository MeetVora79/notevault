import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLogoutMutation } from "@/features/auth/authApi";
import { logoutLocal } from "@/features/auth/authSlice";
import { api } from "@/services/api";
import { toggleTheme } from "@/features/theme/themeSlice";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SettingsDialog from "@/pages/Settings";
import { toast } from "sonner";
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
  User,
  ChevronUp,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "all", label: "All notes", icon: FileText },
  { key: "pinned", label: "Pinned", icon: Pin },
  { key: "archived", label: "Archive", icon: Archive },
  { key: "trashed", label: "Trash", icon: Trash2 },
];

// The actual sidebar content — shared between desktop and mobile
function SidebarContent({
  activeView,
  onViewChange,
  labels,
  collapsed,
  onClose,
}) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const mode = useSelector((state) => state.theme.mode);
  const [logout] = useLogoutMutation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Logged out successfully");
    } finally {
      dispatch(api.util.resetApiState());
      dispatch(logoutLocal());
    }
  };

  const handleNavClick = (key) => {
    onViewChange(key);
    onClose?.(); // close mobile drawer on nav
  };

  const NavButton = ({ item, active, onClick }) => {
    const Icon = item.icon;
    const buttonClass = `w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer font-medium transition-colors ${
      collapsed ? "justify-center" : ""
    } ${
      active
        ? "bg-brand/10 text-brand"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    }`;

    if (!collapsed) {
      return (
        <button onClick={onClick} className={buttonClass}>
          <Icon size={17} strokeWidth={2} className="shrink-0" />
          <span className="truncate">{item.label}</span>
        </button>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <button onClick={onClick} className={buttonClass}>
              <Icon size={17} strokeWidth={2} className="shrink-0" />
            </button>
          }
        />
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            active={activeView === item.key}
            onClick={() => handleNavClick(item.key)}
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
              const isActive = activeView === `label:${label}`;
              const btnClass = `w-full flex items-center gap-3 text-left px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`;

              const btn = (
                <button
                  key={label}
                  onClick={() => handleNavClick(`label:${label}`)}
                  className={btnClass}
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
                  <TooltipTrigger
                    render={
                      <button
                        onClick={() => handleNavClick(`label:${label}`)}
                        className={btnClass}
                      >
                        <span className="text-xs font-mono">
                          <Tag size={12} />
                        </span>
                      </button>
                    }
                  />
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ) : (
                btn
              );
            })}
          </>
        )}
      </nav>

      <Separator />

      {/* User menu */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                style={{ backgroundColor: user?.avatarColor }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate leading-tight">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronUp
                    size={18}
                    className="text-muted-foreground shrink-0"
                  />
                </>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align={collapsed ? "center" : "start"}
            className="w-56 mb-2"
            sideOffset={8}
          >
            {!collapsed && (
              <>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              className="p-2"
              onClick={() => setSettingsOpen(true)}
            >
              <User size={14} className="mr-2" />
              Profile & Account
            </DropdownMenuItem>

            <DropdownMenuItem
              className="p-2"
              onClick={() => dispatch(toggleTheme())}
            >
              {mode === "dark" ? (
                <Sun size={14} className="mr-2" />
              ) : (
                <Moon size={14} className="mr-2" />
              )}
              {mode === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive p-2"
              onClick={handleLogout}
            >
              <LogOut size={14} className="mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

// Desktop sidebar
function DesktopSidebar({ activeView, onViewChange, labels }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex shrink-0 h-screen border-r border-border flex-col bg-background transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div
        className={`flex items-center px-4 py-5 ${collapsed ? "justify-center" : "justify-between"}`}
      >
        {!collapsed && (
          <h1 className="font-display font-semibold text-lg tracking-tight">
            Note<span className="text-brand">Vault</span>
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
      <SidebarContent
        activeView={activeView}
        onViewChange={onViewChange}
        labels={labels}
        collapsed={collapsed}
      />
    </aside>
  );
}

// Mobile sidebar (Sheet drawer)
function MobileSidebar({ activeView, onViewChange, labels, open, onClose }) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex items-center px-4 py-5">
          <h1 className="font-display font-semibold text-lg tracking-tight">
            Notes<span className="text-brand">AI</span>
          </h1>
        </div>
        <SidebarContent
          activeView={activeView}
          onViewChange={onViewChange}
          labels={labels}
          collapsed={false}
          onClose={onClose}
        />
      </SheetContent>
    </Sheet>
  );
}

// Main export — renders both, controls which is visible via CSS
export default function Sidebar({ activeView, onViewChange, labels }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <DesktopSidebar
        activeView={activeView}
        onViewChange={onViewChange}
        labels={labels}
      />
      <MobileSidebar
        activeView={activeView}
        onViewChange={onViewChange}
        labels={labels}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      {/* Mobile menu trigger — passed up via context would be cleaner,
          but for simplicity we expose it via a global button in Navbar */}
      <button
        id="mobile-menu-trigger"
        className="hidden"
        onClick={() => setMobileOpen(true)}
      />
    </>
  );
}

export const openMobileMenu = () => {
  document.getElementById("mobile-menu-trigger")?.click();
};
