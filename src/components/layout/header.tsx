"use client";

import { Bell, Search, Menu, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/40 bg-card/80 glass-strong px-4 sm:px-6"
    >
      {/* Mobile menu toggle */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl hover:bg-accent/60 transition-colors"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </motion.button>

      {/* Search */}
      <div className="relative hidden flex-1 sm:block max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Search clients, products, orders..."
          className="pl-9 bg-muted/40 border-border/30 rounded-xl focus:bg-card/60 transition-colors"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* AI Hint */}
        <motion.div
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-xs font-medium text-primary"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="h-3 w-3" />
          <span>JMS v1.0</span>
        </motion.div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex items-center justify-center rounded-xl h-9 w-9 text-sm font-medium transition-colors hover:bg-accent/60 focus-visible:outline-none">
            <Bell className="h-4.5 w-4.5 text-muted-foreground" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-[9px] font-bold text-white shadow-sm">
              3
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass-strong bg-popover/95 border-border/40 rounded-2xl p-1">
            <DropdownMenuLabel className="px-3 py-2">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator className="opacity-30" />
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer">
              <span className="text-sm font-medium">Low Stock Alert</span>
              <span className="text-xs text-muted-foreground">
                Jump rings (JR-001) below threshold — 45 remaining
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer">
              <span className="text-sm font-medium">Dormant Client</span>
              <span className="text-xs text-muted-foreground">
                Boutique Gems Ltd has not ordered in 62 days
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer">
              <span className="text-sm font-medium">Order Overdue</span>
              <span className="text-xs text-muted-foreground">
                Order #1247 past dispatch deadline by 2 days
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full focus-visible:outline-none">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-semibold">
                  AD
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-strong bg-popover/95 border-border/40 rounded-2xl p-1">
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-semibold">Admin User</p>
                <p className="text-xs text-muted-foreground">
                  admin@wildtouch.co.uk
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="opacity-30" />
            <DropdownMenuItem className="rounded-xl cursor-pointer">Profile Settings</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl cursor-pointer">System Settings</DropdownMenuItem>
            <DropdownMenuSeparator className="opacity-30" />
            <DropdownMenuItem className="rounded-xl cursor-pointer text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
