import { Link, useLocation, useNavigate } from "react-router";
import { Gem, Menu, Plus, UserCircle2, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { getCurrentUser, logout } from "../data/auth";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const currentUser = getCurrentUser() ?? "Guest";
  const dispatchLink = "/dispatch/new";
  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navClass = (path: string) =>
    isActive(path)
      ? "text-orange-600 font-bold bg-orange-100/70 px-3 py-1.5 rounded-full"
      : "text-[#5b412f] hover:text-orange-600 px-3 py-1.5 rounded-full hover:bg-orange-50";

  return (
    <header className="bg-white/88 backdrop-blur-sm sticky top-0 z-50 border-b border-orange-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <Gem className="text-orange-600 mr-3" size={28} />
            <h1 className="text-xl font-bold text-[#3d2515]">OrderTrail</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 text-sm font-medium items-center">
            <Link to="/" className={navClass("/")}>
              Dashboard
            </Link>
            <Link to="/sales-orders" className={navClass("/sales-orders")}>
              Sales Orders
            </Link>
            <Link to="/stock" className={navClass("/stock")}>
              Stock
            </Link>
            <Link to={dispatchLink} className={navClass("/dispatch")}>
              Dispatch
            </Link>
            <Link
              to="/sales-order/new"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-[0_8px_20px_rgba(255,109,0,0.28)] flex items-center gap-2"
            >
              <Plus size={16} />
              New Sales Order
            </Link>
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1.5 text-[#6d4a30] hover:bg-orange-50"
              >
                <UserCircle2 size={18} className="text-orange-600" />
                <span className="max-w-[120px] truncate text-sm font-semibold">{currentUser}</span>
                <ChevronDown size={14} />
              </button>
              {profileMenuOpen ? (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-orange-100 bg-white shadow-[0_14px_30px_rgba(143,77,31,0.2)] p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#6a4126] hover:bg-orange-50 flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 border-t border-orange-100 py-4 space-y-3">
            <Link to="/" className={`block ${navClass("/")}`}>
              Dashboard
            </Link>
            <Link to="/sales-orders" className={`block ${navClass("/sales-orders")}`}>
              Sales Orders
            </Link>
            <Link to="/stock" className={`block ${navClass("/stock")}`}>
              Stock
            </Link>
            <Link to={dispatchLink} className={`block ${navClass("/dispatch")}`}>
              Dispatch
            </Link>
            <Link
              to="/sales-order/new"
              className="block px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow"
            >
              + New Sales Order
            </Link>
            <div className="mx-1 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-[#6d4a30]">
              <UserCircle2 size={18} className="text-orange-600" />
              <span className="truncate text-sm font-semibold">{currentUser}</span>
            </div>
            <button
              onClick={handleLogout}
              className="mx-1 w-[calc(100%-0.5rem)] rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-sm font-semibold text-red-700"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
